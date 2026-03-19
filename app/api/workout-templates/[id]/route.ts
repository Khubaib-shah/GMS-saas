import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import { logAudit, createCrudAuditEntry, createUpdateDiff } from "@/lib/audit";

/**
 * GET /api/workout-templates/[id]
 * Fetch a single template.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_VIEW);
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
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_UPDATE);
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
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "workout_template",
                template._id.toString(),
                template.name,
                { diff: createUpdateDiff(oldData, template.toObject()) },
                req.headers
            )
        );

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
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_TEMPLATE_DELETE);
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
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "workout_template",
                params.id,
                template.name,
                { reason: "soft_delete" },
                req.headers
            )
        );

        return NextResponse.json({ message: "Template deactivated successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
