import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Gym from "@/models/Gym";
import User from "@/models/User";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";

const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";
const TOKEN_EXPIRY = "7d";

/**
 * POST /api/member-portal/login - Member portal login
 * Body: { email, password } OR { email, pin } OR { qrCode }
 */
export async function POST(req: Request) {
    try {
        // ── Rate Limiting (10 login attempts per 15 minutes per IP) ──
        const ip = getClientIp(req);
        const limiter = await rateLimit(`member-login:${ip}`, 10, 900);
        if (!limiter.success) {
            return NextResponse.json(
                { message: "Too many login attempts. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(limiter.reset - Math.floor(Date.now() / 1000)),
                        "X-RateLimit-Limit": String(limiter.limit),
                        "X-RateLimit-Remaining": String(limiter.remaining),
                    },
                }
            );
        }

        const body = await req.json();
        const { email, password, pin, qrCode, gymId } = body;

        // gymId is optional for email login, but required for others
        if (!gymId && !email) {
            return NextResponse.json({ message: "Gym ID is required" }, { status: 400 });
        }

        await connectDB();

        let member;

        // Helper: fetch contact info for gym (owner phone preferred)
        async function getGymContact(gymIdToFetch: any) {
            try {
                const gym = await Gym.findById(gymIdToFetch).lean();
                const owner = await User.findOne({ gymId: gymIdToFetch, role: { $in: ["gym_owner", "owner", "manager"] } }).select("fullName email phone").lean();
                const phone = (owner && owner.phone) || (gym && gym.phone) || (gym && gym.branches && gym.branches[0] && gym.branches[0].phone) || null;
                let whatsappUrl = null;
                if (phone) {
                    // sanitize phone for wa.me (remove non digits and leading +)
                    const digits = phone.replace(/[^0-9]/g, "");
                    whatsappUrl = `https://wa.me/${digits}`;
                }
                return { phone, whatsappUrl, owner };
            } catch (e) {
                return { phone: null, whatsappUrl: null, owner: null };
            }
        }

        // QR Code login
        if (qrCode) {
            member = await Member.findOne({
                qrCode,
                gymId,
                deletedAt: null,
            }).select("+portalPassword +portalPin +portalEnabled");

            if (!member) {
                return NextResponse.json({ message: "Member not found" }, { status: 404 });
            }

            if (!member.portalEnabled) {
                const contact = await getGymContact(member.gymId);
                return NextResponse.json({ message: "Member portal is disabled for this account", code: "PORTAL_DISABLED", contact }, { status: 403 });
            }
        }
        // Email + Password/PIN login
        else if (email) {
            // Find member by email (do not filter by portalEnabled yet)
            member = await Member.findOne({
                email,
                deletedAt: null,
            }).select("+portalPassword +portalPin +portalEnabled gymId");

            if (!member) {
                return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
            }

            if (!member.portalEnabled) {
                const contact = await getGymContact(member.gymId);
                return NextResponse.json({ message: "Member portal is disabled for this account", code: "PORTAL_DISABLED", contact }, { status: 403 });
            }

            // Verify password or PIN
            if (password) {
                if (!member.portalPassword) {
                    return NextResponse.json({ message: "Password login not set up" }, { status: 401 });
                }
                const isMatch = await bcrypt.compare(password, member.portalPassword);
                if (!isMatch) {
                    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
                }
            } else if (pin) {
                if (!member.portalPin) {
                    return NextResponse.json({ message: "PIN login not set up" }, { status: 401 });
                }
                // PIN is stored hashed as well
                const isMatch = await bcrypt.compare(pin, member.portalPin);
                if (!isMatch) {
                    return NextResponse.json({ message: "Invalid PIN" }, { status: 401 });
                }
            } else {
                return NextResponse.json({ message: "Password or PIN required" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ message: "Email or QR code required" }, { status: 400 });
        }

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Derive gymId from member if not provided or to ensure truth from DB
        const effectiveGymId = member.gymId.toString();

        // Update last portal login
        await Member.updateOne(
            { _id: member._id },
            { $set: { lastPortalLogin: new Date() } }
        );

        // Get active subscription
        const subscription = await Subscription.findOne({
            memberId: member._id.toString(),
            gymId: effectiveGymId,
            status: { $in: ["active", "paused"] },
            deletedAt: null,
        }).sort({ endDate: -1 });

        // Generate JWT token for member
        const token = jwt.sign(
            {
                memberId: member._id.toString(),
                gymId: effectiveGymId,
                email: member.email,
                type: "member",
            },
            MEMBER_JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        return NextResponse.json({
            token,
            member: {
                id: member._id.toString(),
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                phone: member.phone,
                qrCode: member.qrCode,
                attendanceStreak: member.attendanceStreak,
                totalCheckIns: member.totalCheckIns,
                gymId: effectiveGymId,
            },
            subscription: subscription ? {
                id: subscription._id.toString(),
                planId: subscription.planId,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                status: subscription.status,
                totalPausedDays: subscription.totalPausedDays,
            } : null,
        });
    } catch (error) {
        console.error("Member portal login error:", error);
        return NextResponse.json({ message: "Login failed" }, { status: 500 });
    }
}
