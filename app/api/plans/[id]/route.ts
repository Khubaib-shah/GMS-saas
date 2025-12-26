import connectDB from "@/lib/db";
import Plan from "@/models/Plan";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "super_admin") {
        return NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 });
    }



    const { id } = await params;
    const body = await req.json();
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const idQuery = isObjectId ? { _id: id } : { id: id };

        // If super_admin, we can update any plan. If not, only our gym's plans.
        const query = (session.user as any).role === "super_admin" ? idQuery : { ...idQuery, gymId };
        const plan = await Plan.findOneAndUpdate(query, body, { new: true });

        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

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
    if (!session || (session.user as any).role !== "super_admin") {
        return NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 });
    }



    const { id } = await params;
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const idQuery = isObjectId ? { _id: id } : { id: id };

        // If super_admin, we can delete any plan. If not, only our gym's plans.
        const query = (session.user as any).role === "super_admin" ? idQuery : { ...idQuery, gymId };
        const plan = await Plan.findOneAndDelete(query);
        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Plan deleted" });
    } catch (error) {
        console.error("Delete plan error:", error);
        return NextResponse.json({ message: "Error deleting plan" }, { status: 500 });
    }
}
