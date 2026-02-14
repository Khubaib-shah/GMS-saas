import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerSlot from "@/models/TrainerSlot";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const trainerId = searchParams.get("trainerId");
        const dateStr = searchParams.get("date");
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");
        const branchId = searchParams.get("branchId");

        await connectDB();

        const query: any = {
            gymId: session.user.gymId,
            status: { $in: ["available", "full"] },
            deletedAt: null
        };

        if (trainerId) query.trainerId = trainerId;
        if (branchId) query.branchId = branchId;

        if (dateStr) {
            const date = new Date(dateStr);
            query.date = {
                $gte: startOfDay(date),
                $lte: endOfDay(date)
            };
        } else if (startDateStr) {
            const start = new Date(startDateStr);
            const end = endDateStr ? new Date(endDateStr) : addDays(start, 7);
            query.date = {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
            };
        }

        const slots = await TrainerSlot.find(query).sort({ date: 1, startTime: 1 });
        return NextResponse.json(slots);
    } catch (error) {
        console.error("Fetch slots error:", error);
        return NextResponse.json({ message: "Error fetching slots" }, { status: 500 });
    }
}
