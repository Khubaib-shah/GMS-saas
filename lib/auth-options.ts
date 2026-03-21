import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Gym from "@/models/Gym";
import { subscriptionService } from "@/lib/services/subscription";

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
                const user = await User.findOne({
                    email: credentials.email,
                    deletedAt: null, // Exclude soft-deleted users
                }).select("+password");

                if (!user) {
                    throw new Error("Invalid credentials");
                }

                // Check if account is active
                if (!user.isActive) {
                    throw new Error("Account is disabled. Contact your administrator.");
                }

                // Rate limiting check
                if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                    const lockoutEnd = new Date(user.lastFailedLoginAt?.getTime() + LOCKOUT_DURATION_MS);
                    if (new Date() < lockoutEnd) {
                        const minutesLeft = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
                        throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minutes.`);
                    }
                    // Lockout expired, reset counter
                    await User.updateOne(
                        { _id: user._id },
                        { $set: { failedLoginAttempts: 0 } }
                    );
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    // Increment failed attempts
                    await User.updateOne(
                        { _id: user._id },
                        {
                            $inc: { failedLoginAttempts: 1 },
                            $set: { lastFailedLoginAt: new Date() }
                        }
                    );
                    throw new Error("Invalid credentials");
                }

                // Successful login - reset failed attempts and update last login
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            failedLoginAttempts: 0,
                            lastLoginAt: new Date()
                        }
                    }
                );

                let isPremium = false;
                let gymSuspended = false;
                if (user.gymId) {
                    const gym = await subscriptionService.checkAndUpdateGymSubscriptionStatus(user.gymId.toString());
                    isPremium = !!gym?.isPremium;

                    // Block login if gym is deleted or deactivated
                    if (gym?.deletedAt || gym?.isActive === false) {
                        throw new Error(`SUSPENDED:This gym has been deactivated or deleted by the administration.`);
                    }

                    // Block login if gym is suspended (super_admin can always log in)
                    if (gym?.isSuspended && user.role !== "super_admin") {
                        const reason = gym.suspensionReason || "Administrative Action";
                        throw new Error(`SUSPENDED:${reason}`);
                    }

                    // Block login if gym subscription is expired
                    if (gym?.subscriptionStatus === "expired" && user.role !== "super_admin") {
                        throw new Error(`EXPIRED:Your subscription or trial package has expired. Please contact support to renew.`);
                    }
                }

                return {
                    id: user._id.toString(),
                    name: user.fullName,
                    email: user.email,
                    role: user.role,
                    gymId: user.gymId ? user.gymId.toString() : null,
                    branchId: user.branchId ? user.branchId.toString() : null,
                    customPermissions: user.customPermissions || [],
                    isPremium
                };
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

