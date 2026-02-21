import { NextResponse } from "next/server";
import { attachTenantContext } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";
import WorkoutPlan from "@/models/WorkoutPlan";
import Exercise from "@/models/Exercise";

/**
 * GET /api/member/active-workout
 * Fetch the current day's workout for the logged-in member.
 */
export async function GET(req: Request) {
    const result = await attachTenantContext();
    if ("error" in result) return result.error;

    const { session } = result;

    try {
        await connectDB();

        // 1. Find active assigned plan
        const plan = await AssignedWorkoutPlan.findOne({
            gymId: session.user.gymId,
            memberId: session.user.id,
            status: "active"
        });

        if (!plan) {
            return NextResponse.json({ message: "No active workout plan found" }, { status: 404 });
        }

        // 2. Fetch template
        const template = await WorkoutPlan.findOne({
            _id: plan.templateId,
            gymId: session.user.gymId
        }).populate("schedule.exercises.exerciseId");

        if (!template || !template.active) {
            return NextResponse.json({ error: "Workout plan is no longer available" }, { status: 410 });
        }

        // 3. Rolling Day Logic
        // Determine the current day of the week since the member's schedule follows Monday-Sunday
        const today = new Date();
        const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const todayStr = daysMap[today.getDay()];

        // 4. Extract current day data
        let currentDay = template.schedule.find((d: any) => d.day === todayStr);

        // If no exercises for today but plan exists, just return empty exercises to show "Rest Day"
        if (!currentDay) {
            currentDay = {
                day: todayStr,
                title: `${todayStr.charAt(0).toUpperCase() + todayStr.slice(1)} Session`,
                exercises: []
            };
        }

        return NextResponse.json({
            planId: plan._id,
            templateName: template.name,
            currentDay: {
                dayNumber: today.getDay(), // 0 = Sun
                title: currentDay.title || `${todayStr.toUpperCase()} PLAN`,
                exercises: currentDay.exercises || []
            },
            scheduleInfo: {
                startDate: plan.startDate,
                daysPerWeek: template.schedule.length,
                currentCycleDay: today.getDay()
            }
        });

    } catch (error: any) {
        console.error("Active workout error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
