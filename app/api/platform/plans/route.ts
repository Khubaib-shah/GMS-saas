import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformPlan from "@/models/PlatformPlan";

/**
 * GET /api/platform/plans — Public route to fetch platform plans for the landing page
 */
export async function GET() {
    try {
        await connectDB();
        const plans = await PlatformPlan.find({ isActive: true })
            .sort({ sortOrder: 1 })
            .lean();

        return NextResponse.json({ plans });
    } catch (error) {
        console.error("Fetch platform plans error:", error);
        return NextResponse.json(
            { message: "Error fetching plans" },
            { status: 500 }
        );
    }
}
