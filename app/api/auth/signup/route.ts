import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Gym from "@/models/Gym";
import PlatformPlan from "@/models/PlatformPlan";
import bcrypt from "bcryptjs";
import { stripeService } from "@/lib/services/stripe";
import { SignupSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(req: Request) {
    try {
        // ── Rate Limiting (5 signups per hour per IP) ──
        const ip = getClientIp(req);
        const limiter = await rateLimit(`signup:${ip}`, 5, 3600);
        if (!limiter.success) {
            return NextResponse.json(
                { message: "Too many signup attempts. Please try again later." },
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

        // ── Zod Validation (includes PasswordSchema complexity) ──
        const parsed = SignupSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { fullName, email, password, gymName, planName } = parsed.data;

        await connectDB();

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
        }

        // Get Plan (Support slug or name)
        const plan = await PlatformPlan.findOne({ 
            $or: [
                { slug: planName }, 
                { name: planName },
                { name: "Professional" } // Final fallback
            ] 
        });
        if (!plan) {
            return NextResponse.json({ message: "Selected plan not found" }, { status: 404 });
        }

        // 1. Create Gym (pending payment)
        const gym = await Gym.create({
            name: gymName,
            slug: gymName.toLowerCase().replace(/\s+/g, '-'),
            subscriptionStatus: 'pending',
            platformPlanId: plan._id,
        });

        // 2. Create User (Owner)
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'owner',
            gymId: gym._id,
            status: 'active',
        });

        // 3. Create Stripe Checkout Session
        const checkoutSession = await stripeService.createCheckoutSession({
            gymId: gym._id.toString(),
            planId: plan._id.toString(),
            planName: plan.name,
            amount: plan.monthlyPricePKR,
            successUrl: `${process.env.NEXTAUTH_URL}/login?message=Welcome! Login to access your gym.`,
            cancelUrl: `${process.env.NEXTAUTH_URL}/signup?plan=${plan.slug}&error=payment_cancelled`,
            customerEmail: email,
        });

        return NextResponse.json({ 
            success: true, 
            checkoutUrl: checkoutSession.url,
            gymId: gym._id,
            userId: user._id 
        }, { status: 201 });

    } catch (error: any) {
        console.error("[Signup API Error]:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
