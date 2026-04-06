import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPlan from "@/models/PlatformPlan"; // PRE-REGISTER: Important for population
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

    try {
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

        // ─────────────────────────────────────────────────
        // CRITICAL: Ensure models are registered explicitly
        // This prevents the "Schema hasn't been registered" error
        // ─────────────────────────────────────────────────
        if (!PlatformPlan) {
            console.error("[SuperAdminGyms] PlatformPlan model is UNDEFINED");
        } else {
            console.log("[SuperAdminGyms] Using model:", PlatformPlan.modelName);
        }

        const filter: any = isDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
            ];
        }
        if (status) filter.subscriptionStatus = status;
        if (city) filter.city = { $regex: city, $options: "i" };

        const [gyms, total, allPlans] = await Promise.all([
            Gym.find(filter)
                .sort({ [sortBy]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Gym.countDocuments(filter),
            PlatformPlan.find({}).select("name").lean(),
        ]);

        const gymIds = gyms.map((g: any) => g._id);

        // Batch fetch Owners, Member counts, and Revenue to avoid N+1
        const [owners, memberCounts, revenueAggs] = await Promise.all([
            User.find({ gymId: { $in: gymIds }, role: { $in: ["gym_owner", "owner"] } })
                .select("fullName email gymId")
                .lean(),
            Member.aggregate([
                { $match: { gymId: { $in: gymIds } } },
                { $group: { _id: "$gymId", count: { $sum: 1 } } }
            ]),
            Payment.aggregate([
                { $match: { gymId: { $in: gymIds } } },
                { $group: { _id: "$gymId", total: { $sum: "$amount" } } }
            ])
        ]);

        const enriched = gyms.map((gym: any) => {
            const owner = owners.find((o: any) => o.gymId.toString() === gym._id.toString());
            const memberCount = memberCounts.find((m: any) => m._id.toString() === gym._id.toString())?.count || 0;
            const revenue = revenueAggs.find((r: any) => r._id.toString() === gym._id.toString())?.total || 0;
            const platformPlan = allPlans.find((p: any) => p._id.toString() === gym.platformPlanId?.toString());

            return {
                id: gym._id.toString(),
                name: gym.name,
                city: gym.city || "",
                phone: gym.phone || "",
                ownerName: owner?.fullName || "N/A",
                ownerEmail: owner?.email || "N/A",
                planName: platformPlan?.name || "No Plan",
                branchCount: gym.branches?.length || 0,
                subscriptionStatus: gym.subscriptionStatus || "trial",
                expiryDate: gym.expiryDate,
                trialEndsAt: gym.trialEndsAt,
                isSuspended: gym.isSuspended || false,
                totalMembers: memberCount,
                totalRevenue: revenue,
                outstandingAmount: gym.outstandingAmount || 0,
                createdAt: gym.createdAt,
            };
        });

        return NextResponse.json({
            gyms: enriched,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("[SuperAdminGyms] GET error:", error);
        return NextResponse.json({ message: "Failed to fetch gyms list", error: error.message }, { status: 500 });
    }
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
