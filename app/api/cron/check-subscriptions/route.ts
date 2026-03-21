import { NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Enforce basic auth/security layer for cron jobs if CRON_SECRET is configured
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse("Unauthorized execution attempt", { status: 401 });
        }

        const stats = await subscriptionService.processDailyExpirations();
        
        return NextResponse.json({
            success: true,
            message: "Successfully processed subscription expirations",
            stats: stats
        });
    } catch (error: any) {
        console.error("[CRON subscriptions] execution error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
