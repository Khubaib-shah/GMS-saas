import { NextResponse } from "next/server";
import { requirePermission, authorize } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Exercise from "@/models/Exercise";
import AuditLog from "@/models/AuditLog";

/**
 * GET /api/exercises
 * Fetch exercises for the current gym.
 * Trainers see public exercises + their own private ones.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();

        // Logical filter: Public within gym OR created by the current trainer
        const exercises = await Exercise.find({
            gymId: session.user.gymId,
            $or: [
                { isPublicWithinGym: true },
                { createdByTrainerId: session.user.id }
            ]
        }).sort({ name: 1 });

        return NextResponse.json(exercises);
    } catch (error: any) {
        console.error("Fetch exercises error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/exercises
 * Create a new exercise.
 */
export async function POST(req: Request) {
    const authResult = await authorize(PERMISSIONS.EXERCISE_CREATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { name, muscleGroup, equipment, description, difficulty, tips, svgUrl, thumbnailUrl, isPublicWithinGym } = body;

        if (!name || !muscleGroup) {
            return NextResponse.json({ error: "Name and Muscle Group are required" }, { status: 400 });
        }

        await connectDB();
        const exercise = await Exercise.create({
            gymId: session.user.gymId,
            createdByTrainerId: session.user.id,
            name,
            muscleGroup,
            equipment,
            description,
            difficulty,
            tips,
            svgUrl,
            thumbnailUrl,
            isPublicWithinGym: isPublicWithinGym ?? true
        });

        // Log audit
        await AuditLog.create({
            gymId: session.user.gymId,
            performedBy: session.user.id,
            action: "EXERCISE_CREATED",
            entityType: "Exercise",
            entityId: exercise._id,
            newValue: exercise.toObject()
        });

        return NextResponse.json(exercise, { status: 201 });
    } catch (error: any) {
        console.error("Create exercise error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
