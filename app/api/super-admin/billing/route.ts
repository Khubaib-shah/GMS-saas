import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPayment from "@/models/PlatformPayment";
import Gym from "@/models/Gym";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/billing — List all platform payments
 */
export async function GET(req: Request) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "2026-02"
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const gymId = searchParams.get("gymId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectDB();

    const filter: any = {};
    if (gymId) filter.gymId = gymId;

    if (from && to) {
        filter.paymentDate = { 
            $gte: new Date(from), 
            $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) 
        };
    } else if (month) {
        const [year, mon] = month.split("-").map(Number);
        const start = new Date(year, mon - 1, 1);
        const end = new Date(year, mon, 0, 23, 59, 59);
        filter.paymentDate = { $gte: start, $lte: end };
    }

    const [payments, total] = await Promise.all([
        PlatformPayment.find(filter)
            .populate("gymId", "name")
            .populate("enteredBy", "fullName")
            .sort({ paymentDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        PlatformPayment.countDocuments(filter),
    ]);

    // Total revenue from filtered results
    const revenueAgg = await PlatformPayment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$amountPKR" } } },
    ]);

    // Overdue gyms
    const now = new Date();
    const overdueGyms = await Gym.countDocuments({
        expiryDate: { $lt: now },
        subscriptionStatus: { $ne: "suspended" },
        isSuspended: false,
        deletedAt: null,
    });

    return NextResponse.json({
        payments: payments.map((p: any) => ({
            id: p._id.toString(),
            gymName: p.gymId?.name || "Unknown",
            gymId: p.gymId?._id?.toString() || p.gymId,
            planName: p.planName,
            amountPKR: p.amountPKR,
            paymentMethod: p.paymentMethod,
            paymentDate: p.paymentDate,
            expiryDate: p.expiryDate,
            notes: p.notes,
            enteredByName: p.enteredBy?.fullName || "System",
            createdAt: p.createdAt,
        })),
        totalRevenuePKR: revenueAgg[0]?.total || 0,
        overdueGyms,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
}
