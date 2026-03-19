import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { stripeService } from "@/lib/services/stripe";
import connectDB from "@/lib/db";
import PlatformPlan from "@/models/PlatformPlan";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { planId, successUrl, cancelUrl } = body;

        if (!planId) {
            return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
        }

        await connectDB();
        const plan = await PlatformPlan.findById(planId);
        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        const gymId = session.user.gymId;
        if (!gymId && session.user.role !== "super_admin") {
            return NextResponse.json({ message: "Gym ID not found in session" }, { status: 400 });
        }

        // Create dummy checkout session
        const checkoutSession = await stripeService.createCheckoutSession({
            gymId: gymId || "super_admin_test",
            planId: plan._id.toString(),
            planName: plan.name,
            amount: plan.monthlyPricePKR,
            successUrl: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
            cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?payment=cancel`,
            customerEmail: session.user.email || undefined,
        });

        return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
    } catch (error: any) {
        console.error("[Stripe API Error]:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
