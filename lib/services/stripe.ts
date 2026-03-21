import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover", // or latest stable version
});

export const stripeService = {
    async createCheckoutSession(params: {
        gymId: string;
        planId: string;
        planName: string;
        amount: number;
        successUrl: string;
        cancelUrl: string;
        customerEmail?: string;
    }) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "pkr",
                        product_data: {
                            name: params.planName,
                            description: `Subscription for ${params.planName}`,
                        },
                        unit_amount: params.amount * 100, // Stripe expects amounts in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment", // or 'subscription' if using recurring prices
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            customer_email: params.customerEmail,
            metadata: {
                gymId: params.gymId,
                planId: params.planId,
                planName: params.planName,
            },
        });

        return {
            id: session.id,
            url: session.url as string,
            amount_total: session.amount_total as number,
            currency: session.currency as string,
            payment_status: session.payment_status,
        };
    },

    async verifyWebhookSignature(payload: string, signature: string) {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is not defined in environment variables");
        }
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    },

    async handleWebhookEvent(event: Stripe.Event) {
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object as Stripe.Checkout.Session;
                return {
                    success: true,
                    gymId: session.metadata?.gymId,
                    planId: session.metadata?.planId,
                    amount: session.amount_total,
                    sessionId: session.id,
                };
            default:
                return { success: false };
        }
    },
};
