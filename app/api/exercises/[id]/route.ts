import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Exercise from "@/models/Exercise";
import { logAudit, createCrudAuditEntry, createUpdateDiff } from "@/lib/audit";

/**
 * GET /api/exercises/[id]
 * Fetch a single exercise.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await requirePermission(PERMISSIONS.EXERCISE_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const exercise = await Exercise.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!exercise) {
            return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }

        return NextResponse.json(exercise);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/exercises/[id]
 * Update an existing exercise.
 */
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await requirePermission(PERMISSIONS.EXERCISE_UPDATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        const exercise = await Exercise.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!exercise) {
            return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }

        // Permission check: Only creator or manager/owner can edit
        if (exercise.createdByTrainerId?.toString() !== session.user.id && !["owner", "manager"].includes(session.user.role)) {
            return NextResponse.json({ error: "Permission denied — you can only edit your own exercises" }, { status: 403 });
        }

        const oldData = exercise.toObject();
        Object.assign(exercise, body);
        await exercise.save();

        // Log audit
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "exercise" as any,
                exercise._id.toString(),
                exercise.name,
                { diff: createUpdateDiff(oldData, exercise.toObject()) },
                req.headers
            )
        );

        return NextResponse.json(exercise);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/exercises/[id]
 * Soft delete or hard delete an exercise.
 */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authResult = await requirePermission(PERMISSIONS.EXERCISE_DELETE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const exercise = await Exercise.findOne({
            _id: params.id,
            gymId: session.user.gymId
        });

        if (!exercise) {
            return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }

        // Permission check
        if (exercise.createdByTrainerId?.toString() !== session.user.id && !["owner", "manager"].includes(session.user.role)) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const oldData = exercise.toObject();
        await Exercise.deleteOne({ _id: params.id });

        // Log audit
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "exercise" as any,
                params.id,
                exercise.name,
                undefined,
                req.headers
            )
        );

        return NextResponse.json({ message: "Exercise deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
