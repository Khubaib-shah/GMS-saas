import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";

interface MemberToken {
    memberId: string;
    gymId: string;
    email: string;
    type: "member";
}

/**
 * Verify member JWT token
 */
function verifyMemberToken(authHeader: string | null): MemberToken | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, MEMBER_JWT_SECRET) as MemberToken;
        if (decoded.type !== "member") return null;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * GET /api/member-portal/profile - Get member profile
 */
export async function GET(req: Request) {
    const tokenData = verifyMemberToken(req.headers.get("authorization"));

    if (!tokenData) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const member = await Member.findOne({
            _id: tokenData.memberId,
            gymId: tokenData.gymId,
            deletedAt: null,
        }).select("-portalPassword -portalPin");

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error) {
        console.error("Member profile fetch error:", error);
        return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 });
    }
}

/**
 * PATCH /api/member-portal/profile - Update member profile
 */
export async function PATCH(req: Request) {
    const tokenData = verifyMemberToken(req.headers.get("authorization"));

    if (!tokenData) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { firstName, lastName, phone, password, pin } = body;

        await connectDB();

        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;

        if (password) {
            updateData.portalPassword = await bcrypt.hash(password, 10);
        }

        if (pin) {
            updateData.portalPin = await bcrypt.hash(pin, 10);
        }

        const member = await Member.findOneAndUpdate(
            {
                _id: tokenData.memberId,
                gymId: tokenData.gymId,
                deletedAt: null,
            },
            { $set: updateData },
            { new: true }
        ).select("-portalPassword -portalPin");

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            member
        });
    } catch (error) {
        console.error("Member profile update error:", error);
        return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
    }
}
