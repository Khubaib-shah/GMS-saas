import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import ExerciseCompletion from "@/models/ExerciseCompletion";
import WorkoutLog from "@/models/WorkoutLog";

/**
 * GET /api/trainer/member-report?memberId=X&from=2026-05-01&to=2026-05-10
 * Returns exercise completion analytics for a specific member.
 * Accessible by: trainer (own members), manager, owner.
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.WORKOUT_LOG_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!memberId) {
        return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    try {
        await connectDB();

        // Build date filter
        const dateFilter: any = {};
        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;

        const query: any = {
            gymId: session.user.gymId,
            memberId,
        };
        if (from || to) query.date = dateFilter;

        // Get all completions for the member in the date range
        const completions = await ExerciseCompletion.find(query)
            .populate("exerciseId", "name muscleGroup")
            .sort({ createdAt: -1 })
            .lean();

        // Calculate analytics
        const totalCompleted = completions.filter((c: any) => c.status === "completed").length;
        const totalAbandoned = completions.filter((c: any) => c.status === "abandoned").length;
        const totalFlagged = completions.filter((c: any) => c.flagged).length;

        const avgDuration = totalCompleted > 0
            ? Math.round(
                completions
                    .filter((c: any) => c.status === "completed")
                    .reduce((sum: number, c: any) => sum + (c.totalDuration || 0), 0) / totalCompleted
            )
            : 0;

        // Group by exercise for per-exercise stats
        const exerciseMap: Record<string, any> = {};
        for (const c of completions) {
            const exId = (c as any).exerciseId?._id?.toString() || (c as any).exerciseId?.toString();
            if (!exerciseMap[exId]) {
                exerciseMap[exId] = {
                    exerciseId: exId,
                    exerciseName: (c as any).exerciseId?.name || "Unknown",
                    muscleGroup: (c as any).exerciseId?.muscleGroup || "Unknown",
                    completions: 0,
                    abandonments: 0,
                    flagged: 0,
                    avgDuration: 0,
                    totalDuration: 0,
                };
            }
            if ((c as any).status === "completed") {
                exerciseMap[exId].completions++;
                exerciseMap[exId].totalDuration += (c as any).totalDuration || 0;
            } else if ((c as any).status === "abandoned") {
                exerciseMap[exId].abandonments++;
            }
            if ((c as any).flagged) exerciseMap[exId].flagged++;
        }

        // Calculate avg per exercise
        for (const key of Object.keys(exerciseMap)) {
            if (exerciseMap[key].completions > 0) {
                exerciseMap[key].avgDuration = Math.round(exerciseMap[key].totalDuration / exerciseMap[key].completions);
            }
        }

        // Get workout log count
        const logQuery: any = { gymId: session.user.gymId, memberId };
        if (from || to) {
            logQuery.date = {};
            if (from) logQuery.date.$gte = new Date(from);
            if (to) logQuery.date.$lte = new Date(to + "T23:59:59.999Z");
        }
        const workoutSessions = await WorkoutLog.countDocuments(logQuery);

        return NextResponse.json({
            summary: {
                totalExercisesCompleted: totalCompleted,
                totalAbandoned,
                totalFlagged,
                avgSetDuration: avgDuration,
                workoutSessionsLogged: workoutSessions,
            },
            exerciseBreakdown: Object.values(exerciseMap),
            recentCompletions: completions.slice(0, 20),
        });
    } catch (error: any) {
        console.error("Member report error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
