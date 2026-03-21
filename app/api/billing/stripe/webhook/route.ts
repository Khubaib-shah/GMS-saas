import { NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import PlatformPayment from "@/models/PlatformPayment";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
    const payload = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    try {
        // Real signature verification
        let event;
        try {
            event = await stripeService.verifyWebhookSignature(payload, sig);
        } catch (err: any) {
            console.error(`[Stripe Webhook Signature Error]: ${err.message}`);
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        const result = await stripeService.handleWebhookEvent(event);

        if (result.success && result.gymId) {
            const { gymId, planId, planName, amount, sessionId } = result;

            await connectDB();
            
            // Update Gym Subscription
            const gym = await Gym.findById(gymId);
            if (gym) {
                const newExpiry = new Date();
                newExpiry.setMonth(newExpiry.getMonth() + 1); // 1 month extension

                gym.expiryDate = newExpiry;
                gym.subscriptionStatus = "active";
                gym.isSuspended = false;
                gym.platformPlanId = planId;
                await gym.save();

                // Record Platform Payment
                await PlatformPayment.create({
                    gymId,
                    planId,
                    planName: planName || "SaaS Plan",
                    amountPKR: (amount || 0) / 100, // Convert from cents
                    paymentMethod: "online", // Stripe
                    paymentDate: new Date(),
                    expiryDate: newExpiry,
                    enteredBy: "system_stripe",
                    notes: `Stripe Payment Session: ${sessionId}`,
                });

                console.log(`[Stripe Webhook] Successfully processed payment for gym: ${gymId}`);

                // Audit Log (System Action)
                await logAudit({
                    gymId,
                    userId: "system_stripe",
                    userName: "Stripe Webhook",
                    action: "update",
                    resource: "gym",
                    resourceId: gymId,
                    resourceName: gym.name,
                    details: { 
                        subscriptionUpdated: true, 
                        stripeSessionId: sessionId,
                        newExpiry: newExpiry
                    }
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`[Stripe Webhook Error]: ${err.message}`);
        return NextResponse.json({ message: "Webhook handler failed" }, { status: 400 });
    }
}
