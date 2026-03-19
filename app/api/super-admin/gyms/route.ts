import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/gyms — List all gyms with stats
 */
export async function GET(req: Request) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const city = searchParams.get("city") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectDB();

    const filter: any = { deletedAt: null };

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
        ];
    }
    if (status) filter.subscriptionStatus = status;
    if (city) filter.city = { $regex: city, $options: "i" };

    const [gyms, total] = await Promise.all([
        Gym.find(filter)
            .populate("platformPlanId", "name")
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Gym.countDocuments(filter),
    ]);

    // Enrich with owner info, member count, revenue
    const enriched = await Promise.all(
        gyms.map(async (gym: any) => {
            const [owner, memberCount, revenueAgg] = await Promise.all([
                User.findOne({ gymId: gym._id, role: { $in: ["gym_owner", "owner"] } })
                    .select("fullName email")
                    .lean(),
                Member.countDocuments({ gymId: gym._id }),
                Payment.aggregate([
                    { $match: { gymId: gym._id } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]),
            ]);

            return {
                id: gym._id.toString(),
                name: gym.name,
                city: gym.city || "",
                phone: gym.phone || "",
                ownerName: owner?.fullName || "N/A",
                ownerEmail: owner?.email || "N/A",
                planName: gym.platformPlanId?.name || "No Plan",
                branchCount: gym.branches?.length || 0,
                subscriptionStatus: gym.subscriptionStatus || "trial",
                expiryDate: gym.expiryDate,
                trialEndsAt: gym.trialEndsAt,
                isSuspended: gym.isSuspended || false,
                totalMembers: memberCount,
                totalRevenue: revenueAgg[0]?.total || 0,
                outstandingAmount: gym.outstandingAmount || 0,
                createdAt: gym.createdAt,
            };
        })
    );

    return NextResponse.json({
        gyms: enriched,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}
