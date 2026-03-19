import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo, createCrudAuditEntry } from "@/lib/audit";
import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import Member from "@/models/Member";

/**
 * POST /api/subscriptions/pause - Pause a subscription
 * Body: { subscriptionId, reason? }
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_PAUSE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { subscriptionId, reason } = body;

        if (!subscriptionId) {
            return NextResponse.json({ message: "Subscription ID is required" }, { status: 400 });
        }

        await connectDB();

        const query = buildGymQuery(session, { _id: subscriptionId, deletedAt: null });
        const subscription = await Subscription.findOne(query);

        if (!subscription) {
            return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
        }

        if (subscription.status === "paused") {
            return NextResponse.json({ message: "Subscription is already paused" }, { status: 400 });
        }

        if (subscription.status === "expired") {
            return NextResponse.json({ message: "Cannot pause an expired subscription" }, { status: 400 });
        }

        const now = new Date();

        // Store original end date if this is the first pause
        if (!subscription.originalEndDate) {
            subscription.originalEndDate = subscription.endDate;
        }

        // Add to pause history
        subscription.pauseHistory.push({
            startDate: now,
            reason: reason || "Paused by staff",
            pausedBy: session.user.id,
        });

        subscription.status = "paused";
        subscription.currentPauseStart = now;

        await subscription.save();

        // Get member name for audit
        const member = await Member.findById(subscription.memberId).lean();
        const memberName = member ? `${(member as any).firstName} ${(member as any).lastName || ""}`.trim() : "Unknown";

        // Audit log
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "subscription",
                subscriptionId,
                `Subscription for ${memberName}`,
                {
                    action: "pause",
                    reason,
                    pausedAt: now.toISOString()
                },
                req.headers
            )
        );

        return NextResponse.json({
            message: "Subscription paused successfully",
            subscription,
        });
    } catch (error) {
        console.error("Pause subscription error:", error);
        return NextResponse.json({ message: "Error pausing subscription" }, { status: 500 });
    }
}
