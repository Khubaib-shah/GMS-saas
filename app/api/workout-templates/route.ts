import { NextResponse } from "next/server";
import { requirePermission, authorize } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import AuditLog from "@/models/AuditLog";

/**
 * GET /api/workout-templates
 * Fetch templates for the current gym.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.PLANS_VIEW);
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
    const authResult = await authorize(PERMISSIONS.WORKOUT_TEMPLATE_CREATE);
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
        await AuditLog.create({
            gymId: session.user.gymId,
            performedBy: session.user.id,
            action: "TEMPLATE_CREATED",
            entityType: "WorkoutTemplate",
            entityId: template._id,
            newValue: template.toObject()
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
