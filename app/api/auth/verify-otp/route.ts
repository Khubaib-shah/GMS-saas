import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/redis";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
        }

        const cacheKey = `forgot_password_otp_${email}`;
        const storedOtp = await getCache<string>(cacheKey);

        if (!storedOtp) {
            return NextResponse.json({ message: "OTP expired or invalid" }, { status: 400 });
        }

        // Clean up quotes if stored with JSON.stringify
        const cleanStoredOtp = storedOtp.replace(/"/g, '');

        if (cleanStoredOtp !== otp) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }

        // Generate a temporary secure token for password reset (valid for 5 mins)
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenCacheKey = `reset_password_token_${email}`;
        
        await setCache(tokenCacheKey, resetToken, 300);

        return NextResponse.json({ success: true, token: resetToken });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
