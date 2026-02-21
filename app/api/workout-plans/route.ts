import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/workout-plans - Fetch all workout plans for the gym
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const workoutPlans = await WorkoutPlan.find({
            gymId: session.user.gymId,
            trainerId: session.user.id,
            active: true
        }).sort({ createdAt: -1 });

        return NextResponse.json(workoutPlans);
    } catch (error) {
        console.error("Fetch workout plans error:", error);
        return NextResponse.json({ message: "Failed to fetch workout plans" }, { status: 500 });
    }
}

/**
 * POST /api/workout-plans - Create a new workout plan
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_CREATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { name, description, schedule } = body;

        if (!name) {
            return NextResponse.json({ message: "Name is required" }, { status: 400 });
        }

        await connectDB();
        const workoutPlan = await WorkoutPlan.create({
            name,
            description,
            schedule,
            gymId: session.user.gymId,
            trainerId: session.user.id,
            active: true
        });

        return NextResponse.json(workoutPlan);
    } catch (error) {
        console.error("Create workout plan error:", error);
        return NextResponse.json({ message: "Failed to create workout plan" }, { status: 500 });
    }
}
