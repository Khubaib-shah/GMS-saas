import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPlan from "@/models/PlatformPlan";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * PUT /api/super-admin/plans/[id] — Update a platform plan
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const plan = await PlatformPlan.findByIdAndUpdate(id, body, { new: true });
    if (!plan) {
        return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });
}

/**
 * DELETE /api/super-admin/plans/[id] — Toggle plan active status
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { id } = await params;
    await connectDB();

    const plan = await PlatformPlan.findById(id);
    if (!plan) {
        return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    return NextResponse.json({ plan, message: plan.isActive ? "Plan activated" : "Plan deactivated" });
}
