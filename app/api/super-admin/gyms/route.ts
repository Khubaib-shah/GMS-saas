import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { requireSuperAdmin } from "@/lib/api-middleware";
import bcrypt from "bcryptjs";

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
    const isDeleted = searchParams.get("isDeleted") === "true";

    await connectDB();

    const filter: any = isDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null };

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

/**
 * POST /api/super-admin/gyms — Manually create a new gym and owner
 */
export async function POST(req: Request) {
    const authResult = await requireSuperAdmin();
    if ("error" in authResult) return authResult.error;

    try {
        const body = await req.json();
        const {
            gymName,
            ownerName,
            ownerEmail,
            ownerPassword,
            planId,
            city,
            phone,
            address,
            trialDays = 14,
        } = body;

        if (!gymName || !ownerName || !ownerEmail || !ownerPassword || !planId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // 1. Check if plan exists
        const PlatformPlan = (await import("@/models/PlatformPlan")).default;
        const plan = await PlatformPlan.findById(planId);
        if (!plan) {
            return NextResponse.json({ message: "Platform plan not found" }, { status: 404 });
        }

        // 2. Check if owner email exists
        const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
        }

        // 3. Create Gym
        const trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        const gym = await Gym.create({
            name: gymName,
            city: city || "",
            phone: phone || "",
            address: address || "",
            subscriptionStatus: "trial",
            platformPlanId: planId,
            trialEndsAt: trialEndDate,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days when active
            branches: [{
                name: "Main Branch",
                address: address || "",
                phone: phone || "",
                email: ownerEmail,
                isDefault: true
            }]
        });

        // 4. Create Owner User
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        const user = await User.create({
            fullName: ownerName,
            email: ownerEmail.toLowerCase(),
            password: hashedPassword,
            role: "owner",
            gymId: gym._id,
            status: "active",
        });

        // 5. Create SubscriptionPlan (Feature Gating)
        const SubscriptionPlan = (await import("@/models/SubscriptionPlan")).default;
        await SubscriptionPlan.create({
            gymId: gym._id,
            tierName: plan.name,
            active: true,
            enabledFeatures: plan.featureFlags || [],
            expiresAt: gym.expiryDate
        });

        return NextResponse.json({
            message: "Gym and Owner created successfully",
            gymId: gym._id,
            userId: user._id
        }, { status: 201 });

    } catch (error: any) {
        console.error("Manual gym creation error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
