import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/workout-templates
 * Fetch templates for the current gym.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();

        // Filter: Public OR created by me
        const templates = await WorkoutTemplate.find({
            gymId: session.user.gymId,
            active: true,
            $or: [
                { isPublicWithinGym: true },
                { createdByTrainerId: session.user.id }
            ]
        }).sort({ createdAt: -1 });

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
