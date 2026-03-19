import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import PlatformPayment from "@/models/PlatformPayment";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/dashboard — Super Admin dashboard KPIs
 */
export async function GET() {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    await connectDB();

    const [
        totalGyms,
        activeGyms,
        suspendedGyms,
        trialGyms,
        expiredGyms,
    ] = await Promise.all([
        Gym.countDocuments({ deletedAt: null }),
        Gym.countDocuments({ subscriptionStatus: "active", deletedAt: null }),
        Gym.countDocuments({ isSuspended: true, deletedAt: null }),
        Gym.countDocuments({ subscriptionStatus: "trial", deletedAt: null }),
        Gym.countDocuments({ subscriptionStatus: "expired", deletedAt: null }),
    ]);

    // Platform revenue (from PlatformPayments)
    const revenueAgg = await PlatformPayment.aggregate([
        { $group: { _id: null, total: { $sum: "$amountPKR" } } },
    ]);
    const totalRevenuePKR = revenueAgg[0]?.total || 0;

    // Monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueAgg = await PlatformPayment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amountPKR" } } },
    ]);
    const monthlyRevenuePKR = monthlyRevenueAgg[0]?.total || 0;

    // Upcoming expiries (next 7 days)
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const upcomingExpiries = await Gym.countDocuments({
        expiryDate: { $gte: now, $lte: next7Days },
        subscriptionStatus: { $ne: "suspended" },
        deletedAt: null,
    });

    // Monthly gym registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const registrationTrend = await Gym.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, deletedAt: null } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Monthly revenue trend (last 6 months)
    const revenueTrend = await PlatformPayment.aggregate([
        { $match: { paymentDate: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
                total: { $sum: "$amountPKR" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Plan distribution
    const planDistribution = await Gym.aggregate([
        { $match: { deletedAt: null, platformPlanId: { $ne: null } } },
        { $group: { _id: "$platformPlanId", count: { $sum: 1 } } },
        {
            $lookup: {
                from: "platformplans",
                localField: "_id",
                foreignField: "_id",
                as: "plan",
            },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                name: { $ifNull: ["$plan.name", "No Plan"] },
                count: 1,
            },
        },
    ]);

    // Recent activity (last 10 platform payments as proxy for activity)
    const recentPayments = await PlatformPayment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("gymId", "name")
        .lean();

    return NextResponse.json({
        kpis: {
            totalGyms,
            activeGyms,
            suspendedGyms,
            trialGyms,
            expiredGyms,
            totalRevenuePKR,
            monthlyRevenuePKR,
            upcomingExpiries,
        },
        charts: {
            registrationTrend,
            revenueTrend,
            planDistribution,
        },
        recentActivity: recentPayments.map((p: any) => ({
            id: p._id,
            type: "payment_recorded",
            gymName: p.gymId?.name || "Unknown Gym",
            amount: p.amountPKR,
            date: p.paymentDate,
            createdAt: p.createdAt,
        })),
    });
}
