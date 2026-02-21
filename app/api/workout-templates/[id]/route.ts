import { NextResponse } from "next/server";
import { requirePermission, authorize } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import AuditLog from "@/models/AuditLog";

/**
 * GET /api/workout-templates/[id]
 * Fetch a single template.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await requirePermission(PERMISSIONS.PLANS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const template = await WorkoutTemplate.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/workout-templates/[id]
 * Update a template.
 */
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await authorize(PERMISSIONS.WORKOUT_TEMPLATE_UPDATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        const template = await WorkoutTemplate.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Permission check
        if (template.createdByTrainerId?.toString() !== session.user.id && !["owner", "manager"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const oldData = template.toObject();
        Object.assign(template, body);
        await template.save();

        // Log audit
        await AuditLog.create({
            gymId: session.user.gymId,
            performedBy: session.user.id,
            action: "TEMPLATE_UPDATED",
            entityType: "WorkoutTemplate",
            entityId: template._id,
            oldValue: oldData,
            newValue: template.toObject()
        });

        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/workout-templates/[id]
 * Soft delete a template.
 */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await authorize(PERMISSIONS.PLANS_DELETE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const template = await WorkoutTemplate.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Permission check
        if (template.createdByTrainerId?.toString() !== session.user.id && !["owner", "manager"].includes(session.user.role)) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const oldData = template.toObject();
        template.active = false; // Soft delete only
        await template.save();

        // Log audit
        await AuditLog.create({
            gymId: session.user.gymId,
            performedBy: session.user.id,
            action: "TEMPLATE_DELETED",
            entityType: "WorkoutTemplate",
            entityId: params.id,
            oldValue: oldData
        });

        return NextResponse.json({ message: "Template deactivated successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
