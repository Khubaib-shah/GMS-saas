import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPayment from "@/models/PlatformPayment";
import Gym from "@/models/Gym";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/billing/platform — Fetch platform billing history and current plan for the gym
 */
export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.BILLING_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    const gymId = session.user.gymId;
    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    await connectDB();

    const [gym, payments] = await Promise.all([
        Gym.findById(gymId).populate("platformPlanId").lean(),
        PlatformPayment.find({ gymId })
            .populate("enteredBy", "fullName")
            .sort({ paymentDate: -1 })
            .lean(),
    ]);

    if (!gym) {
        return NextResponse.json({ message: "Gym not found" }, { status: 404 });
    }

    return NextResponse.json({
        gym: {
            id: (gym as any)._id.toString(),
            name: gym.name,
            subscriptionStatus: (gym as any).subscriptionStatus,
            expiryDate: (gym as any).expiryDate,
            trialEndsAt: (gym as any).trialEndsAt,
            isSuspended: (gym as any).isSuspended,
            outstandingAmount: (gym as any).outstandingAmount || 0,
            plan: (gym as any).platformPlanId || null,
        },
        payments: payments.map((p: any) => ({
            id: p._id.toString(),
            planName: p.planName,
            amountPKR: p.amountPKR,
            paymentMethod: p.paymentMethod,
            paymentDate: p.paymentDate,
            expiryDate: p.expiryDate,
            notes: p.notes,
            enteredByName: p.enteredBy?.fullName || "System",
        })),
    });
}
