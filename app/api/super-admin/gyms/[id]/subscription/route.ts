import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/gyms/[id]/subscription — Get gym subscription status/features
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireSuperAdmin();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    await connectDB();

    const subPlan = await SubscriptionPlan.findOne({ gymId: id });
    if (!subPlan) {
        return NextResponse.json({ message: "Subscription plan not found" }, { status: 404 });
    }

    return NextResponse.json({ subscriptionPlan: subPlan });
}

/**
 * PUT /api/super-admin/gyms/[id]/subscription — Manually override subscription features
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireSuperAdmin();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await req.json();
    const { enabledFeatures, expiresAt, tierName, active } = body;

    await connectDB();

    const subPlan = await SubscriptionPlan.findOneAndUpdate(
        { gymId: id },
        { 
            $set: { 
                ...(enabledFeatures && { enabledFeatures }),
                ...(expiresAt && { expiresAt: new Date(expiresAt) }),
                ...(tierName && { tierName }),
                ...(active !== undefined && { active })
            } 
        },
        { new: true, upsert: true }
    );

    return NextResponse.json({ 
        message: "Subscription plan updated successfully", 
        subscriptionPlan: subPlan 
    });
}
