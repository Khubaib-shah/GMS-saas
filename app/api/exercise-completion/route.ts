import { NextResponse } from "next/server";
import { attachTenantContext } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import ExerciseCompletion from "@/models/ExerciseCompletion";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";

const MIN_SET_DURATION = 10; // Minimum seconds per set (anti-cheat)
const MAX_ATTEMPTS_PER_DAY = 2;

function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * POST /api/exercise-completion
 * Start or update a per-exercise completion record.
 * Body: { exerciseId, planId, sets: [{ setNumber, startedAt, completedAt, durationSeconds, reps?, weight? }], totalSets, status? }
 */
export async function POST(req: Request) {
    const result = await attachTenantContext();
    if ("error" in result) return result.error;
    const { session } = result;

    try {
        const body = await req.json();
        const { exerciseId, planId, sets, totalSets, status } = body;

        if (!exerciseId || !planId || !totalSets) {
            return NextResponse.json({ error: "exerciseId, planId, and totalSets are required" }, { status: 400 });
        }

        await connectDB();

        // Verify plan belongs to this member
        const plan = await AssignedWorkoutPlan.findOne({
            _id: planId,
            gymId: session.user.gymId,
            memberId: session.user.id,
            status: "active"
        });

        if (!plan) {
            return NextResponse.json({ error: "Active plan not found" }, { status: 404 });
        }

        const today = getTodayDateString();

        // Find existing in-progress record for today
        let completion = await ExerciseCompletion.findOne({
            gymId: session.user.gymId,
            memberId: session.user.id,
            exerciseId,
            date: today,
            status: "in_progress"
        });

        if (completion) {
            // Update existing — append new sets
            if (sets && Array.isArray(sets)) {
                for (const set of sets) {
                    const alreadyLogged = completion.sets.some((s: any) => s.setNumber === set.setNumber);
                    if (!alreadyLogged) {
                        completion.sets.push(set);
                    }
                }
                completion.totalDuration = completion.sets.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
            }

            if (status === "completed") {
                // ── Anti-cheat: validate total duration ──
                const minExpected = completion.totalSets * MIN_SET_DURATION;
                if (completion.totalDuration < minExpected) {
                    completion.flagged = true;
                    completion.flagReason = `Total duration ${completion.totalDuration}s is below minimum ${minExpected}s (${completion.totalSets} sets × ${MIN_SET_DURATION}s)`;
                }
                completion.status = "completed";
                completion.completedAt = new Date();
            }

            await completion.save();
            return NextResponse.json(completion);
        }

        // No in-progress record — check attempt limits
        const todayAttempts = await ExerciseCompletion.countDocuments({
            gymId: session.user.gymId,
            memberId: session.user.id,
            exerciseId,
            date: today
        });

        if (todayAttempts >= MAX_ATTEMPTS_PER_DAY) {
            return NextResponse.json(
                { error: `Maximum ${MAX_ATTEMPTS_PER_DAY} attempts per exercise per day reached.` },
                { status: 409 }
            );
        }

        // Create new completion record
        const newCompletion = await ExerciseCompletion.create({
            gymId: session.user.gymId,
            memberId: session.user.id,
            exerciseId,
            planId,
            date: today,
            attemptNumber: todayAttempts + 1,
            sets: sets || [],
            totalSets,
            totalDuration: (sets || []).reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0),
            status: status || "in_progress"
        });

        return NextResponse.json(newCompletion, { status: 201 });
    } catch (error: any) {
        // Handle duplicate key (race condition)
        if (error.code === 11000) {
            return NextResponse.json({ error: "Duplicate completion attempt" }, { status: 409 });
        }
        console.error("ExerciseCompletion error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/exercise-completion?date=2026-05-10
 * Fetch today's completions for the logged-in member.
 */
export async function GET(req: Request) {
    const result = await attachTenantContext();
    if ("error" in result) return result.error;
    const { session } = result;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getTodayDateString();
    const memberId = searchParams.get("memberId") || session.user.id;

    // Only allow viewing own data unless trainer/manager/owner
    const isSelf = memberId === session.user.id;
    const isStaff = ["owner", "manager", "trainer"].includes(session.user.role);
    if (!isSelf && !isStaff) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
        await connectDB();

        const completions = await ExerciseCompletion.find({
            gymId: session.user.gymId,
            memberId,
            date
        }).sort({ attemptNumber: 1 });

        return NextResponse.json(completions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
