import { NextResponse } from "next/server";
import { attachTenantContext } from "@/lib/api-middleware";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutLog from "@/models/WorkoutLog";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";

/**
 * POST /api/workout-log
 * Log a completed workout session.
 */
export async function POST(req: Request) {
    const result = await attachTenantContext();
    if ("error" in result) return result.error;

    const { session } = result;

    try {
        const body = await req.json();
        const { planId, exercises, date } = body;

        if (!planId || !exercises || !Array.isArray(exercises)) {
            return NextResponse.json({ error: "planId and exercises (array) are required" }, { status: 400 });
        }

        await connectDB();

        // Validate plan ownership
        const plan = await AssignedWorkoutPlan.findOne({
            _id: planId,
            gymId: session.user.gymId
        });

        if (!plan) {
            return NextResponse.json({ error: "Assigned plan not found" }, { status: 404 });
        }

        // Only the member themselves or their trainer can log
        const isSelf = plan.memberId.toString() === session.user.id;
        const isTrainer = plan.trainerId.toString() === session.user.id;
        const isStaff = ["owner", "manager"].includes(session.user.role);

        if (!isSelf && !isTrainer && !isStaff) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const log = await WorkoutLog.create({
            gymId: session.user.gymId,
            memberId: plan.memberId,
            trainerId: plan.trainerId,
            planId,
            date: date ? new Date(date) : new Date(),
            exercises
        });

        return NextResponse.json(log, { status: 201 });
    } catch (error: any) {
        console.error("Log error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/workout-log
 * Fetch logs for a member (query param memberId).
 */
export async function GET(req: Request) {
    const result = await attachTenantContext();
    if ("error" in result) return result.error;

    const { session } = result;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId") || session.user.id;

    try {
        await connectDB();

        // Authorization check
        const isSelf = memberId === session.user.id;
        const isAdmin = ["owner", "manager"].includes(session.user.role);
        const isTrainer = session.user.role === "trainer";

        if (!isSelf && !isAdmin && !isTrainer) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const logs = await WorkoutLog.find({
            gymId: session.user.gymId,
            memberId
        }).sort({ date: -1 }).populate("exercises.exerciseId", "name muscleGroup");

        return NextResponse.json(logs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
