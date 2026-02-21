import connectDB from "@/lib/db";
import Plan from "@/models/Plan";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { invalidatePattern } from "@/lib/redis";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, PERMISSIONS.PLANS_EDIT)) {
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const idQuery = isObjectId ? { _id: id } : { id: id };

        // If super_admin, we can update any plan. If not, only our gym's plans.
        // Since super_admin is restricted, they won't reach here unless permissions change.
        const query = role === "super_admin" ? idQuery : { ...idQuery, gymId };
        const plan = await Plan.findOneAndUpdate(query, body, { new: true });

        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        // Invalidate list cache
        await invalidatePattern(`plans:list:gym:${gymId}`);

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Update plan error:", error);
        return NextResponse.json({ message: "Error updating plan" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, PERMISSIONS.PLANS_DELETE)) {
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const idQuery = isObjectId ? { _id: id } : { id: id };

        // If super_admin, we can delete any plan. If not, only our gym's plans.
        const query = role === "super_admin" ? idQuery : { ...idQuery, gymId };
        const plan = await Plan.findOneAndDelete(query);
        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        // Invalidate list cache
        await invalidatePattern(`plans:list:gym:${gymId}`);

        return NextResponse.json({ message: "Plan deleted" });
    } catch (error) {
        console.error("Delete plan error:", error);
        return NextResponse.json({ message: "Error deleting plan" }, { status: 500 });
    }
}
