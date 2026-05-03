import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPlan from "@/models/PlatformPlan";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/plans — List all platform plans
 */
export async function GET() {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    await connectDB();
    const plans = await PlatformPlan.find().sort({ sortOrder: 1 }).lean();

    return NextResponse.json({ plans });
}

/**
 * POST /api/super-admin/plans — Create a new platform plan
 */
export async function POST(req: Request) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const body = await req.json();
    const {
        name,
        monthlyPricePKR,
        yearlyPricePKR,
        branchLimit,
        maxStaffAccounts,
        maxTrainers,
        trialDays,
        featureFlags,
        description,
    } = body;

    if (!name || monthlyPricePKR == null) {
        return NextResponse.json(
            { message: "name and monthlyPricePKR are required" },
            { status: 400 }
        );
    }

    await connectDB();

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await PlatformPlan.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
        return NextResponse.json({ message: "Plan with this name already exists" }, { status: 400 });
    }

    const plan = await PlatformPlan.create({
        name,
        slug,
        monthlyPricePKR,
        yearlyPricePKR: yearlyPricePKR || null,
        branchLimit: branchLimit || 1,
        maxStaffAccounts: maxStaffAccounts || 5,
        maxTrainers: maxTrainers || 2,
        trialDays: trialDays || 14,
        featureFlags: featureFlags || ["members", "manualAttendance", "qrAttendance"],
        description: description || "",
    });

    return NextResponse.json({ plan }, { status: 201 });
}
