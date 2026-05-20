import { NextResponse } from "next/server";
import { getCache, deleteCache } from "@/lib/redis";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Member from "@/models/Member";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, token, newPassword } = body;

        if (!email || !token || !newPassword) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const tokenCacheKey = `reset_password_token_${email}`;
        const storedToken = await getCache<string>(tokenCacheKey);

        if (!storedToken) {
            return NextResponse.json({ message: "Session expired, please restart password reset" }, { status: 400 });
        }

        const cleanStoredToken = storedToken.replace(/"/g, '');

        if (cleanStoredToken !== token) {
            return NextResponse.json({ message: "Invalid reset token" }, { status: 400 });
        }

        await connectDB();

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Try updating User
        let updatedUser = await User.findOneAndUpdate(
            { email, deletedAt: null },
            { $set: { password: hashedPassword } },
            { new: true }
        );

        // If not a user, try updating Member
        if (!updatedUser) {
            updatedUser = await Member.findOneAndUpdate(
                { email, deletedAt: null },
                { $set: { portalPassword: hashedPassword } },
                { new: true }
            );
        }

        if (!updatedUser) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }

        // Clean up token cache
        await deleteCache(tokenCacheKey);

        // Also clean up OTP cache just in case
        await deleteCache(`forgot_password_otp_${email}`);

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
