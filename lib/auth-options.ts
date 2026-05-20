import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Member from "@/models/Member";
import Gym from "@/models/Gym";
import { subscriptionService } from "@/lib/services/subscription";
import { logAudit } from "@/lib/audit";

// Rate limiting constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                await connectDB();
                const identifier = credentials.email;

                // 1. Try finding in User model (Staff/Admin)
                let account = await User.findOne({
                    email: identifier,
                    deletedAt: null,
                }).select("+password");

                let isMember = false;

                // 2. If not found, try finding in Member model
                if (!account) {
                    // Normalize phone number query to match both formats (e.g. 0300... and +92300...)
                    const phoneAlternatives = [identifier];
                    if (/^03\d{9}$/.test(identifier)) {
                        phoneAlternatives.push("+92" + identifier.substring(1));
                    } else if (/^\+923\d{9}$/.test(identifier)) {
                        phoneAlternatives.push("0" + identifier.substring(3));
                    }

                    account = await Member.findOne({
                        $or: [
                            { email: identifier },
                            { phone: { $in: phoneAlternatives } }
                        ],
                        deletedAt: null,
                        portalEnabled: true
                    }).select("+portalPassword +portalPin");
                    console.log(account);
                    if (account) {
                        isMember = true;
                        account.password = account.portalPassword;
                        account.role = "member";
                        account.fullName = `${account.firstName} ${account.lastName || ""}`.trim();
                    }
                }

                if (!account) {
                    throw new Error("Invalid credentials");
                }

                // Check if account is active (Staff users have isActive, Members are active if portalEnabled && !deletedAt)
                if (!isMember && !account.isActive) {
                    throw new Error("Account is disabled. Contact your administrator.");
                }

                // Rate limiting check (applies to both Staff and Members)
                if (account.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                    const lockoutEnd = new Date(account.lastFailedLoginAt?.getTime() + LOCKOUT_DURATION_MS);
                    if (new Date() < lockoutEnd) {
                        const minutesLeft = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
                        throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minutes.`);
                    }
                    // Lockout expired, reset counter
                    const Model = isMember ? Member : User;
                    await Model.updateOne(
                        { _id: account._id },
                        { $set: { failedLoginAttempts: 0 } }
                    );
                }

                let isMatch = false;

                // For Members, we might be comparing against a PIN instead of a password
                if (isMember) {
                    // Try password first
                    if (account.password) {
                        isMatch = await bcrypt.compare(credentials.password, account.password);
                    }
                    // If no match, try PIN
                    if (!isMatch && account.portalPin) {
                        isMatch = await bcrypt.compare(credentials.password, account.portalPin);
                    }
                } else {
                    isMatch = await bcrypt.compare(credentials.password, account.password);
                }

                if (!isMatch) {
                    // Increment failed attempts for both Staff and Members
                    const Model = isMember ? Member : User;
                    await Model.updateOne(
                        { _id: account._id },
                        {
                            $inc: { failedLoginAttempts: 1 },
                            $set: { lastFailedLoginAt: new Date() }
                        }
                    );
                    throw new Error("Invalid credentials");
                }

                // Successful login - reset failed attempts and update last login
                if (!isMember) {
                    await User.updateOne(
                        { _id: account._id },
                        {
                            $set: {
                                failedLoginAttempts: 0,
                                lastLoginAt: new Date()
                            }
                        }
                    );
                } else {
                    await Member.updateOne(
                        { _id: account._id },
                        {
                            $set: {
                                failedLoginAttempts: 0,
                                lastPortalLogin: new Date()
                            }
                        }
                    );
                }

                // Audit log: successful login
                try {
                    await logAudit({
                        gymId: account.gymId ? account.gymId.toString() : "PLATFORM",
                        userId: account._id.toString(),
                        userName: account.fullName || account.email || identifier,
                        userRole: account.role,
                        action: "login",
                        resource: "user",
                        resourceId: account._id.toString(),
                        details: { status: "success", isMember },
                    });
                } catch (_auditErr) {
                    // Never block login flow due to audit failure
                }

                let isPremium = false;
                if (account.gymId) {
                    const gym = await subscriptionService.checkAndUpdateGymSubscriptionStatus(account.gymId.toString());
                    isPremium = !!gym?.isPremium;

                    if (gym?.deletedAt || gym?.isActive === false) {
                        throw new Error(`SUSPENDED:This gym has been deactivated or deleted by the administration.`);
                    }

                    if (gym?.isSuspended && account.role !== "super_admin") {
                        const reason = gym.suspensionReason || "Administrative Action";
                        throw new Error(`SUSPENDED:${reason}`);
                    }

                    if (gym?.subscriptionStatus === "expired" && account.role !== "super_admin" && !isMember) {
                        throw new Error(`EXPIRED:Your subscription or trial package has expired. Please contact support to renew.`);
                    }
                }

                const returnVal: any = {
                    id: account._id.toString(),
                    name: account.fullName,
                    email: account.email || account.phone, // Use phone if email is missing
                    role: account.role,
                    gymId: account.gymId ? account.gymId.toString() : null,
                    branchId: account.branchId ? account.branchId.toString() : null,
                    customPermissions: account.customPermissions || [],
                    isPremium
                };

                if (isMember) {
                    const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";
                    returnVal.memberToken = jwt.sign(
                        {
                            memberId: account._id.toString(),
                            gymId: account.gymId ? account.gymId.toString() : "",
                            email: account.email || "",
                            type: "member",
                        },
                        MEMBER_JWT_SECRET,
                        { expiresIn: "7d" }
                    );
                }

                return returnVal;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.gymId = (user as any).gymId;
                token.branchId = (user as any).branchId;
                token.customPermissions = (user as any).customPermissions;
                token.isPremium = (user as any).isPremium;
                if ((user as any).memberToken) {
                    token.memberToken = (user as any).memberToken;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).gymId = token.gymId;
                (session.user as any).branchId = token.branchId;
                (session.user as any).customPermissions = token.customPermissions;
                (session.user as any).isPremium = token.isPremium;
                if (token.memberToken) {
                    (session.user as any).memberToken = token.memberToken;
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

