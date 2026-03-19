/**
 * Dummy Stripe Service
 * This service mocks Stripe interactions for development.
 * Real credentials and implementation will be added later.
 */

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
        console.log("[Mock Stripe] Creating checkout session for:", params);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return a mock session object
        return {
            id: `mock_cs_${Math.random().toString(36).substring(7)}`,
            url: `${params.successUrl}?session_id=mock_session_${Date.now()}`,
            amount_total: params.amount,
            currency: 'pkr',
            payment_status: 'unpaid',
        };
    },

    async verifyWebhookSignature(payload: string, signature: string) {
        // Always true for dummy implementation
        return true;
    },

    async handleWebhookEvent(event: any) {
        console.log("[Mock Stripe] Handling webhook event:", event.type);
        
        // Mock event handling
        switch (event.type) {
            case 'checkout.session.completed':
                return {
                    success: true,
                    gymId: event.data.object.metadata.gymId,
                    planId: event.data.object.metadata.planId,
                    amount: event.data.object.amount_total,
                };
            default:
                return { success: false };
        }
    }
};
