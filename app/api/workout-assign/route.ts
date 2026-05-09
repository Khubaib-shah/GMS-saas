import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";
import Member from "@/models/Member";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * POST /api/workout-assign
 * Assign a template to one or more members.
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_PLAN_ASSIGN);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { templateId, memberIds, startDate, endDate } = body;

        if (!templateId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return NextResponse.json({ error: "templateId and memberIds (array) are required" }, { status: 400 });
        }

        await connectDB();

        // 1. Validate template
        const template = await WorkoutPlan.findOne({
            _id: templateId,
            gymId: session.user.gymId,
            active: true
        });

        if (!template) {
            return NextResponse.json({ error: "Workout plan not found" }, { status: 404 });
        }

        // 2. Validate membership and ownership
        // In this system, trainers can only assign to members assigned to them.
        // Owners and managers can assign to anyone in the gym.
        const memberQuery: any = {
            _id: { $in: memberIds },
            gymId: session.user.gymId,
            deletedAt: null
        };

        if (session.user.role === "trainer") {
            memberQuery.trainerId = new mongoose.Types.ObjectId(session.user.id);
        }

        const validMembers = await Member.find(memberQuery).select("_id firstName lastName");
        const validMemberIds = validMembers.map(m => m._id.toString());

        if (validMemberIds.length !== memberIds.length) {
            const invalidIds = memberIds.filter(id => !validMemberIds.includes(id));
            return NextResponse.json({
                error: "One or more members are invalid or not assigned to you",
                invalidIds,
                message: "Ensure all selected members are assigned to you and are active."
            }, { status: 403 });
        }

        // 3. Filter out members who already have this EXACT plan active
        const existingAssignments = await AssignedWorkoutPlan.find({
            gymId: session.user.gymId,
            memberId: { $in: validMemberIds },
            templateId: templateId,
            status: "active"
        }).select("memberId");

        const alreadyAssignedIds = existingAssignments.map(a => a.memberId.toString());
        const finalMemberIdsToAssign = validMemberIds.filter(id => !alreadyAssignedIds.includes(id));

        if (finalMemberIdsToAssign.length === 0 && validMemberIds.length > 0) {
            return NextResponse.json({
                message: "This plan is already active for the selected member(s).",
                count: 0,
                skipped: alreadyAssignedIds.length
            });
        }

        // 4. Create assignments (Loop preventing dual active plans)
        const assignmentsCreated = [];
        const start = startDate ? new Date(startDate) : new Date();

        for (const memberId of finalMemberIdsToAssign) {
            // Deactivate existing active plans if any
            await AssignedWorkoutPlan.updateMany(
                { gymId: session.user.gymId, memberId, status: "active" },
                { status: "completed" }
            );

            const assignment = await AssignedWorkoutPlan.create({
                gymId: session.user.gymId,
                memberId,
                trainerId: session.user.id,
                templateId,
                startDate: start,
                endDate: endDate ? new Date(endDate) : null,
                status: "active"
            });

            // Update Member reference (Optional, depends on how much you want to sync)
            await Member.updateOne({ _id: memberId }, { workoutPlanId: templateId });

            assignmentsCreated.push(assignment);

            // Log individual audit
            await logAudit(
                createCrudAuditEntry(
                    session,
                    "create",
                    "workout_assignment",
                    assignment._id.toString(),
                    memberId,
                    { templateId, startDate: assignment.startDate },
                    req.headers
                )
            );
        }

        return NextResponse.json({
            message: `Successfully assigned plan to ${assignmentsCreated.length} member(s)${alreadyAssignedIds.length > 0 ? ` (${alreadyAssignedIds.length} already had this plan active)` : ""}`,
            count: assignmentsCreated.length,
            assignments: assignmentsCreated,
            skipped: alreadyAssignedIds.length
        });

    } catch (error: any) {
        console.error("Assignment error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
