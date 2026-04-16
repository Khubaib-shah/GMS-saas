import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import Subscription from "@/models/Subscription";
import PlatformPayment from "@/models/PlatformPayment";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/api-middleware";
import { deleteCache } from "@/lib/redis";

/**
 * GET /api/super-admin/gyms/[id] — Gym detail
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { id } = await params;
    await connectDB();

    const gym = await Gym.findById(id).populate("platformPlanId").lean();
    if (!gym) {
        return NextResponse.json({ message: "Gym not found" }, { status: 404 });
    }

    const [owner, memberCount, activeMembers, trainersCount, revenueAgg, payments, subPlan] =
        await Promise.all([
            User.findOne({ gymId: id, role: { $in: ["gym_owner", "owner"] } })
                .select("fullName email phone")
                .lean(),
            Member.countDocuments({ gymId: id }),
            Subscription.countDocuments({
                gymId: id,
                status: "active",
                endDate: { $gte: new Date().toISOString() },
            }),
            User.countDocuments({ gymId: id, role: "trainer", deletedAt: null }),
            Payment.aggregate([
                { $match: { gymId: (gym as any)._id } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            PlatformPayment.find({ gymId: id })
                .sort({ paymentDate: -1 })
                .limit(10)
                .lean(),
            SubscriptionPlan.findOne({ gymId: id, active: true }).lean(),
        ]);

    return NextResponse.json({
        gym: {
            id: (gym as any)._id.toString(),
            name: gym.name,
            address: gym.address,
            phone: gym.phone,
            city: (gym as any).city || "",
            isActive: gym.isActive,
            isPremium: gym.isPremium,
            branches: gym.branches,
            subscriptionStatus: (gym as any).subscriptionStatus || "trial",
            expiryDate: (gym as any).expiryDate,
            trialEndsAt: (gym as any).trialEndsAt,
            isSuspended: (gym as any).isSuspended || false,
            suspensionReason: (gym as any).suspensionReason,
            outstandingAmount: (gym as any).outstandingAmount || 0,
            plan: (gym as any).platformPlanId || null,
            enabledFeatures: (subPlan as any)?.enabledFeatures || [],
            createdAt: (gym as any).createdAt,
            deletedAt: (gym as any).deletedAt || null,
        },
        owner: owner
            ? {
                name: owner.fullName,
                email: owner.email,
                phone: (owner as any).phone || "",
            }
            : null,
        stats: {
            totalMembers: memberCount,
            activeMembers,
            trainersCount,
            branchCount: gym.branches?.length || 0,
            totalRevenue: revenueAgg[0]?.total || 0,
        },
        platformPayments: payments,
    });
}

/**
 * PATCH /api/super-admin/gyms/[id] — Gym actions
 * Actions: activate, suspend, unsuspend, extend, changePlan, markPaid, resetPassword, softDelete
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    await connectDB();
    const gym = await Gym.findById(id);
    if (!gym) {
        return NextResponse.json({ message: "Gym not found" }, { status: 404 });
    }

    switch (action) {
        case "activate": {
            gym.subscriptionStatus = "active";
            gym.isSuspended = false;
            gym.suspendedAt = null;
            gym.suspensionReason = null;
            gym.isActive = true;
            await gym.save();

            // Sync SubscriptionPlan
            await SubscriptionPlan.findOneAndUpdate(
                { gymId: id },
                { active: true },
                { upsert: true }
            );

            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym activated", gym });
        }

        case "suspend": {
            gym.isSuspended = true;
            gym.suspendedAt = new Date();
            gym.suspensionReason = body.reason || "Suspended by Super Admin";
            gym.subscriptionStatus = "suspended";
            await gym.save();
            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym suspended", gym });
        }

        case "unsuspend": {
            gym.isSuspended = false;
            gym.suspendedAt = null;
            gym.suspensionReason = null;
            gym.subscriptionStatus = gym.expiryDate && new Date(gym.expiryDate) > new Date() ? "active" : "expired";
            await gym.save();
            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym unsuspended", gym });
        }

        case "extend": {
            const { days } = body;
            if (!days || days < 1) {
                return NextResponse.json({ message: "Invalid days" }, { status: 400 });
            }
            const currentExpiry = gym.expiryDate ? new Date(gym.expiryDate) : new Date();
            const base = currentExpiry > new Date() ? currentExpiry : new Date();
            base.setDate(base.getDate() + parseInt(days));
            gym.expiryDate = base;
            gym.subscriptionStatus = "active";
            gym.isSuspended = false;
            await gym.save();

            // Sync SubscriptionPlan
            await SubscriptionPlan.findOneAndUpdate(
                { gymId: id },
                { active: true, expiresAt: base },
                { upsert: true }
            );

            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: `Extended by ${days} days`, gym });
        }

        case "changePlan": {
            const { planId } = body;
            if (!planId) {
                return NextResponse.json({ message: "planId required" }, { status: 400 });
            }
            gym.platformPlanId = planId;
            await gym.save();

            // Sync SubscriptionPlan features
            const PlatformPlan = (await import("@/models/PlatformPlan")).default;
            const plan = await PlatformPlan.findById(planId);
            if (plan) {
                await SubscriptionPlan.findOneAndUpdate(
                    { gymId: id },
                    { 
                        tierName: plan.name, 
                        enabledFeatures: plan.featureFlags || [],
                        active: true 
                    },
                    { upsert: true }
                );
            }

            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Plan changed", gym });
        }

        case "markPaid": {
            const { amount, method, notes, expiryDate } = body;
            if (!amount || !expiryDate) {
                return NextResponse.json({ message: "amount and expiryDate required" }, { status: 400 });
            }

            // Record payment
            await PlatformPayment.create({
                gymId: id,
                planId: gym.platformPlanId,
                planName: body.planName || "",
                amountPKR: amount,
                paymentMethod: method || "cash",
                paymentDate: new Date(),
                expiryDate: new Date(expiryDate),
                notes: notes || "",
                enteredBy: result.session.user.id,
            });

            gym.expiryDate = new Date(expiryDate);
            gym.subscriptionStatus = "active";
            gym.isSuspended = false;
            gym.outstandingAmount = Math.max(0, (gym.outstandingAmount || 0) - amount);
            await gym.save();

            // Sync SubscriptionPlan
            await SubscriptionPlan.findOneAndUpdate(
                { gymId: id },
                { active: true, expiresAt: gym.expiryDate },
                { upsert: true }
            );

            await deleteCache(`gym:profile:${id}`);

            return NextResponse.json({ message: "Payment recorded", gym });
        }

        case "resetPassword": {
            const owner = await User.findOne({ gymId: id, role: { $in: ["gym_owner", "owner"] } });
            if (!owner) {
                return NextResponse.json({ message: "Owner not found" }, { status: 404 });
            }
            const newPassword = body.newPassword || "password123";
            owner.password = await bcrypt.hash(newPassword, 10);
            owner.failedLoginAttempts = 0;
            await owner.save();
            return NextResponse.json({ message: "Password reset successful" });
        }

        case "softDelete": {
            gym.deletedAt = new Date();
            gym.isActive = false;
            await gym.save();
            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym soft-deleted" });
        }

        case "restore": {
            gym.deletedAt = null;
            gym.isActive = true;
            await gym.save();
            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym restored successfully" });
        }

        case "hardDelete": {
            // Delete the gym and all associated data permanently
            await Promise.all([
                Gym.findByIdAndDelete(id),
                User.deleteMany({ gymId: id }),
                Member.deleteMany({ gymId: id }),
                Subscription.deleteMany({ gymId: id }),
                Payment.deleteMany({ gymId: id }),
                PlatformPayment.deleteMany({ gymId: id }),
                SubscriptionPlan.deleteMany({ gymId: id })
            ]);
            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: "Gym permanently deleted" });
        }

        case "toggleFeature": {
            const { featureKey } = body;
            if (!featureKey) {
                return NextResponse.json({ message: "featureKey required" }, { status: 400 });
            }

            const plan = await SubscriptionPlan.findOne({ gymId: id, active: true });
            if (!plan) {
                return NextResponse.json({ message: "Subscription plan not found" }, { status: 404 });
            }

            const features = plan.enabledFeatures || [];
            const index = features.indexOf(featureKey);
            
            if (index > -1) {
                features.splice(index, 1);
            } else {
                features.push(featureKey);
            }

            plan.enabledFeatures = features;
            await plan.save();

            await deleteCache(`gym:profile:${id}`);
            return NextResponse.json({ message: `Feature ${index > -1 ? "disabled" : "enabled"}`, features });
        }

        default:
            return NextResponse.json({ message: "Unknown action" }, { status: 400 });
    }
}

/**
 * PUT /api/super-admin/gyms/[id] — General gym update
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireSuperAdmin();
    if ("error" in authResult) return authResult.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { name, city, phone, address, trialEndsAt, expiryDate, subscriptionStatus } = body;

        await connectDB();
        const gym = await Gym.findById(id);
        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        if (name) gym.name = name;
        if (city !== undefined) gym.city = city;
        if (phone !== undefined) gym.phone = phone;
        if (address !== undefined) gym.address = address;
        if (trialEndsAt !== undefined) gym.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
        if (expiryDate !== undefined) gym.expiryDate = expiryDate ? new Date(expiryDate) : null;
        if (subscriptionStatus !== undefined) gym.subscriptionStatus = subscriptionStatus;

        await gym.save();
        await deleteCache(`gym:profile:${id}`);

        return NextResponse.json({ message: "Gym updated successfully", gym });
    } catch (error: any) {
        console.error("Gym update error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
