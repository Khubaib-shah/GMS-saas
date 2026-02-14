import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo } from "@/lib/audit";
import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import Member from "@/models/Member";

/**
 * POST /api/subscriptions/resume - Resume a paused subscription
 * Body: { subscriptionId }
 * 
 * When resuming, the endDate is extended by the number of paused days
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_PAUSE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json({ message: "Subscription ID is required" }, { status: 400 });
        }

        await connectDB();

        const query = buildGymQuery(session, { _id: subscriptionId, deletedAt: null });
        const subscription = await Subscription.findOne(query);

        if (!subscription) {
            return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
        }

        if (subscription.status !== "paused") {
            return NextResponse.json({ message: "Subscription is not paused" }, { status: 400 });
        }

        const now = new Date();
        const pauseStart = subscription.currentPauseStart;

        if (!pauseStart) {
            return NextResponse.json({ message: "No pause start date found" }, { status: 400 });
        }

        // Calculate paused days
        const pausedMs = now.getTime() - new Date(pauseStart).getTime();
        // Use floor to ensure at least 24 hours must pass to gain a day extension
        // This prevents exploits where users pause/resume repeatedly to gain days
        const pausedDays = Math.floor(pausedMs / (1000 * 60 * 60 * 24));

        // Extend end date by paused days
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setDate(currentEndDate.getDate() + pausedDays);
        const newEndDate = currentEndDate.toISOString().split("T")[0]; // Keep as YYYY-MM-DD

        // Update the last pause history entry with end date
        if (subscription.pauseHistory.length > 0) {
            const lastPause = subscription.pauseHistory[subscription.pauseHistory.length - 1];
            lastPause.endDate = now;
            lastPause.resumedBy = session.user.id;
        }

        subscription.status = "active";
        subscription.endDate = newEndDate;
        subscription.totalPausedDays = (subscription.totalPausedDays || 0) + pausedDays;
        subscription.currentPauseStart = undefined;

        await subscription.save();

        // Get member name for audit
        const member = await Member.findById(subscription.memberId).lean();
        const memberName = member ? `${(member as any).firstName} ${(member as any).lastName || ""}`.trim() : "Unknown";

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "resume_subscription",
            resource: "subscription",
            resourceId: subscriptionId,
            resourceName: `Subscription for ${memberName}`,
            details: {
                pausedDays,
                newEndDate,
                resumedAt: now.toISOString(),
            },
            branchId: session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({
            message: "Subscription resumed successfully",
            subscription,
            pausedDays,
            newEndDate,
        });
    } catch (error) {
        console.error("Resume subscription error:", error);
        return NextResponse.json({ message: "Error resuming subscription" }, { status: 500 });
    }
}
