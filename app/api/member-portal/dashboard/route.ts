import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import Plan from "@/models/Plan";
import WorkoutPlan from "@/models/WorkoutPlan";
import Exercise from "@/models/Exercise";

const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";

interface MemberToken {
    memberId: string;
    gymId: string;
    email: string;
    type: "member";
}

/**
 * Verify member JWT token
 */
function verifyMemberToken(authHeader: string | null): MemberToken | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, MEMBER_JWT_SECRET) as MemberToken;
        if (decoded.type !== "member") return null;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * GET /api/member-portal/dashboard - Get member dashboard data
 * Headers: Authorization: Bearer <token>
 */
export async function GET(req: Request) {
    const tokenData = verifyMemberToken(req.headers.get("authorization"));

    if (!tokenData) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // Get member
        const member = await Member.findOne({
            _id: tokenData.memberId,
            gymId: tokenData.gymId,
            deletedAt: null,
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Get active subscription
        const subscription = await Subscription.findOne({
            memberId: tokenData.memberId,
            gymId: tokenData.gymId,
            deletedAt: null,
        }).sort({ endDate: -1 });

        // Get plan details if subscription exists
        let plan = null;
        if (subscription?.planId) {
            plan = await Plan.findById(subscription.planId);
        }

        // Get recent payments (last 10)
        const payments = await Payment.find({
            memberId: tokenData.memberId,
            gymId: tokenData.gymId,
            deletedAt: null,
        })
            .sort({ date: -1 })
            .limit(10)
            .lean();

        // Get recent attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendance = await Attendance.find({
            memberId: tokenData.memberId,
            gymId: tokenData.gymId,
            date: { $gte: thirtyDaysAgo },
        })
            .sort({ date: -1 })
            .lean();

        // Get Workout Plan
        let workoutPlan = null;
        if (member.workoutPlanId) {
            workoutPlan = await WorkoutPlan.findById(member.workoutPlanId)
                .populate({
                    path: "schedule.exercises.exerciseId",
                    model: Exercise
                })
                .lean();
        }

        // Calculate stats
        const daysUntilExpiry = subscription
            ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        return NextResponse.json({
            member: {
                id: member._id.toString(),
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                phone: member.phone,
                photoBase64: member.photoBase64,
                joinDate: member.joinDate,
                qrCode: member.qrCode,
                attendanceStreak: member.attendanceStreak || 0,
                totalCheckIns: member.totalCheckIns || 0,
                lastCheckIn: member.lastCheckIn,
            },
            subscription: subscription
                ? {
                    id: subscription._id.toString(),
                    planId: subscription.planId,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    originalEndDate: subscription.originalEndDate,
                    status: subscription.status,
                    totalPausedDays: subscription.totalPausedDays || 0,
                    currentPauseStart: subscription.currentPauseStart,
                    pauseHistory: subscription.pauseHistory,
                    daysUntilExpiry,
                    isPaused: subscription.status === "paused",
                }
                : null,
            plan: plan
                ? {
                    id: plan._id.toString(),
                    name: plan.name,
                    price: plan.price,
                    duration: plan.duration,
                    description: plan.description,
                }
                : null,
            payments: payments.map((p: any) => ({
                id: p._id.toString(),
                amount: p.amount,
                date: p.date,
                method: p.method,
                receiptNumber: p.receiptNumber,
                description: p.description,
            })),
            attendance: attendance.map((a: any) => ({
                id: a._id.toString(),
                date: a.date,
                checkInTime: a.checkInTime,
                checkOutTime: a.checkOutTime,
                status: a.status,
            })),
            workoutPlan: workoutPlan ? {
                id: workoutPlan._id.toString(),
                name: workoutPlan.name,
                description: workoutPlan.description,
                schedule: workoutPlan.schedule.map((day: any) => ({
                    _id: day._id?.toString(),
                    day: day.day,
                    title: day.title,
                    exercises: day.exercises.map((ex: any) => ({
                        exercise: ex.exerciseId ? {
                            id: ex.exerciseId._id.toString(),
                            name: ex.exerciseId.name,
                            muscleGroup: ex.exerciseId.muscleGroup,
                            gifUrl: ex.exerciseId.gifUrl,
                            equipment: ex.exerciseId.equipment,
                        } : null,
                        sets: ex.sets,
                        reps: ex.reps,
                        restSeconds: ex.restSeconds,
                        notes: ex.notes
                    }))
                }))
            } : null,
        });
    } catch (error) {
        console.error("Member dashboard error:", error);
        return NextResponse.json({ message: "Failed to load dashboard" }, { status: 500 });
    }
}
