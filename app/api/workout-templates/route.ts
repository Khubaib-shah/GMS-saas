import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

/**
 * GET /api/workout-templates
 * Fetch templates for the current gym.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const gymId = session.user.gymId;
        const trainerId = session.user.id;
        const cacheKey = `workout:templates:gym:${gymId}:trainer:${trainerId}`;

        const cached = await getCache<any[]>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();

        // Filter: Public OR created by me
        const templates = await WorkoutTemplate.find({
            gymId,
            active: true,
            $or: [
                { isPublicWithinGym: true },
                { createdByTrainerId: trainerId }
            ]
        }).sort({ createdAt: -1 }).lean();

        await setCache(cacheKey, templates, 3600);
        return NextResponse.json(templates);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/workout-templates
 * Create a new reusable template.
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_CREATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { name, goal, daysPerWeek, days, isPublicWithinGym } = body;

        if (!name || !daysPerWeek || !days) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();
        const template = await WorkoutTemplate.create({
            gymId: session.user.gymId,
            createdByTrainerId: session.user.id,
            name,
            goal,
            daysPerWeek,
            days,
            isPublicWithinGym: isPublicWithinGym ?? true
        });

        // Invalidate Cache
        await invalidatePattern(`workout:templates:gym:${session.user.gymId}*`);

        // Log audit
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "workout_template",
                template._id.toString(),
                template.name,
                { goal: template.goal },
                req.headers
            )
        );

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
