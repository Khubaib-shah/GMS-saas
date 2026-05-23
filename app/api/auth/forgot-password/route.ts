import { NextResponse } from "next/server";
import { setCache } from "@/lib/redis";
import { sendEmail, getBaseTemplate } from "@/lib/mail-service";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Member from "@/models/Member";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        await connectDB();

        // Check if user exists in Staff or Member collection
        let isStaff = true;
        let account = await User.findOne({ email, deletedAt: null });

        if (!account) {
            isStaff = false;
            account = await Member.findOne({ email, deletedAt: null });
        }

        if (!account) {
            // We should ideally not reveal if an email exists or not, but for simplicity:
            return NextResponse.json({ message: "No account found with this email" }, { status: 404 });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Store OTP in Redis (Expires in 60 seconds + small buffer, or just 120 seconds to be safe)
        // Let's keep the TTL to 120 seconds to allow for UI delays
        const cacheKey = `forgot_password_otp_${email}`;
        await setCache(cacheKey, otp, 120);

        // Send Email
        const emailContent = `
            <p>Hello ${account.firstName || account.fullName || "User"},</p>
            <p>You requested to reset your password. Use the following 6-digit verification code:</p>
            <div style="background: #11161d; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <h2 style="color: #ccff00; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
            <p>This code will expire in 1 minute.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        `;

        await sendEmail({
            to: email,
            subject: "Your Password Reset Code",
            html: getBaseTemplate("Reset Password", emailContent)
        });

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
