import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import mongoose from "mongoose";

/**
 * GET /api/trainer/stats — Fetch dynamic stats for the logged-in trainer
 */
export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.TRAINER_DASHBOARD_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    const trainerId = session.user.id;
    const gymId = session.user.gymId;

    await connectDB();

    const [members, activeSubs] = await Promise.all([
        Member.find({ 
            gymId, 
            trainerId: new mongoose.Types.ObjectId(trainerId),
            deletedAt: null 
        }).populate("workoutPlanId").lean(),
        Subscription.find({
            gymId,
            status: "active",
            endDate: { $gte: new Date().toISOString() }
        }).lean()
    ]);

    const activeSubsMap = new Map(activeSubs.map(s => [s.memberId.toString(), s]));

    const stats = {
        totalMembers: members.length,
        activePlans: members.filter(m => m.workoutPlanId).length,
        membersWithoutPlans: members.filter(m => !m.workoutPlanId).length,
        todaySessions: 0, // In a full implementation, this might fetch from a schedule model
        complianceRate: 0, // Placeholder for analytics logic
    };

    // Calculate real compliance if we had workout logs, for now just a mockup based on plans
    stats.complianceRate = members.length > 0 
        ? Math.round((stats.activePlans / members.length) * 100) 
        : 100;

    return NextResponse.json({
        stats,
        members: members.map((m: any) => ({
            id: m._id.toString(),
            fullName: `${m.firstName} ${m.lastName || ""}`,
            phone: m.phone,
            joinDate: m.joinDate,
            workoutPlanName: m.workoutPlanId?.name || "No Plan",
            subscriptionStatus: activeSubsMap.has(m._id.toString()) ? "active" : "expired",
            attendanceStreak: m.attendanceStreak || 0,
            lastCheckIn: m.lastCheckIn,
        }))
    });
}
