import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * PUT /api/workout-plans/[id] - Update a workout plan
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_EDIT);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    try {
        const body = await req.json();
        await connectDB();

        const workoutPlan = await WorkoutPlan.findOneAndUpdate(
            { _id: id, gymId: session.user.gymId, trainerId: session.user.id },
            { $set: body },
            { new: true }
        );

        if (!workoutPlan) {
            return NextResponse.json({ message: "Workout plan not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(workoutPlan);
    } catch (error) {
        console.error("Update workout plan error:", error);
        return NextResponse.json({ message: "Failed to update workout plan" }, { status: 500 });
    }
}

/**
 * DELETE /api/workout-plans/[id] - Delete a workout plan (soft delete by marking inactive)
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_DELETE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    try {
        await connectDB();

        const workoutPlan = await WorkoutPlan.findOneAndUpdate(
            { _id: id, gymId: session.user.gymId, trainerId: session.user.id },
            { $set: { active: false } },
            { new: true }
        );

        if (!workoutPlan) {
            return NextResponse.json({ message: "Workout plan not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ message: "Workout plan deleted successfully" });
    } catch (error) {
        console.error("Delete workout plan error:", error);
        return NextResponse.json({ message: "Failed to delete workout plan" }, { status: 500 });
    }
}
