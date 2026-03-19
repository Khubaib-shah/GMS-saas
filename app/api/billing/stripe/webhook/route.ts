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
        // In dummy mode, we don't actually verify signatures
        const event = JSON.parse(payload);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const { gymId, planId, planName } = session.metadata || {};
            const amount = session.amount_total;

            await connectDB();
            
            // Update Gym Subscription
            const gym = await Gym.findById(gymId);
            if (gym) {
                const newExpiry = new Date();
                newExpiry.setMonth(newExpiry.getMonth() + 1); // Mock 1 month extension

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
                    amountPKR: amount,
                    paymentMethod: "online", // Stripe
                    paymentDate: new Date(),
                    expiryDate: newExpiry,
                    enteredBy: "system_stripe", // Mock system user
                    notes: `Stripe Payment: ${session.id}`,
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
                        stripeSessionId: session.id,
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
