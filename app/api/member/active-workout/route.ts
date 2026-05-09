import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
            gymId: new mongoose.Types.ObjectId(session.user.gymId),
            memberId: new mongoose.Types.ObjectId(session.user.id),
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
        const { searchParams } = new URL(req.url);
        const requestedDay = searchParams.get("day")?.toLowerCase();

        const today = new Date();
        const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const todayStr = daysMap[today.getDay()];
        
        // Use requested day if valid, otherwise fallback to current day of week
        const finalDayStr = requestedDay && daysMap.includes(requestedDay) ? requestedDay : todayStr;
        const finalDayIndex = daysMap.indexOf(finalDayStr);

        // 4. Extract current day data
        let currentDay = template.schedule.find((d: any) => d.day === finalDayStr);

        // If no exercises for today but plan exists, just return empty exercises to show "Rest Day"
        if (!currentDay) {
            currentDay = {
                day: finalDayStr,
                title: `${finalDayStr.charAt(0).toUpperCase() + finalDayStr.slice(1)} Session`,
                exercises: []
            };
        }

        return NextResponse.json({
            planId: plan._id,
            templateName: template.name,
            currentDay: {
                dayNumber: finalDayIndex, // 0 = Sun
                title: currentDay.title || `${finalDayStr.toUpperCase()} PLAN`,
                exercises: currentDay.exercises || []
            },
            scheduleInfo: {
                startDate: plan.startDate,
                daysPerWeek: template.schedule.length,
                currentCycleDay: finalDayIndex
            }
        });

    } catch (error: any) {
        console.error("Active workout error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
