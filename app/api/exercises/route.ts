import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Exercise from "@/models/Exercise";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

/**
 * GET /api/exercises
 * Fetch exercises for the current gym.
 * Trainers see public exercises + their own private ones.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.EXERCISE_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const gymId = session.user.gymId;
        const trainerId = session.user.id;
        // Key includes trainerId because trainers might see different private exercises
        const cacheKey = `exercises:list:gym:${gymId}:trainer:${trainerId}`;

        const cached = await getCache<any[]>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();

        // Logical filter: Public within gym OR created by the current trainer
        const exercises = await Exercise.find({
            gymId,
            $or: [
                { isPublicWithinGym: true },
                { createdByTrainerId: trainerId }
            ]
        }).sort({ name: 1 }).lean();

        await setCache(cacheKey, exercises, 3600);
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
    const authResult = await requirePermission(PERMISSIONS.EXERCISE_CREATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        console.log("Exercise POST body:", body);
        const { name, muscleGroup, equipment, description, difficulty, tips, svgUrl, videoUrl, thumbnailUrl, isPublicWithinGym } = body;

        if (!name || !muscleGroup) {
            return NextResponse.json({ error: "Name and Muscle Group are required" }, { status: 400 });
        }

        await connectDB();
        
        const exercise = new Exercise({
            gymId: session.user.gymId,
            createdByTrainerId: session.user.id,
            name,
            muscleGroup,
            equipment,
            description,
            difficulty,
            tips,
            svgUrl,
            videoUrl,
            thumbnailUrl,
            isPublicWithinGym: isPublicWithinGym ?? true
        });

        await exercise.save();
        
        // Invalidate Cache
        await invalidatePattern(`exercises:list:gym:${session.user.gymId}*`);

        console.log("Created Exercise with Media:", { id: exercise._id, video: exercise.videoUrl, svg: exercise.svgUrl });

        // Log audit
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "exercise",
                exercise._id.toString(),
                exercise.name,
                { muscleGroup: exercise.muscleGroup },
                req.headers
            )
        );

        return NextResponse.json(exercise, { status: 201 });
    } catch (error: any) {
        console.error("Create exercise error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
