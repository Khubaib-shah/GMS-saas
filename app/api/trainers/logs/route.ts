import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerSessionLog from "@/models/TrainerSessionLog";
import TrainerBooking from "@/models/TrainerBooking";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.STAFF_MANAGE); // Or trainer self
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { bookingId, exercises, trainerNotes, nextPlan, injuryFlags } = body;

        await connectDB();

        // Verify booking
        const booking = await TrainerBooking.findOne({ _id: bookingId, gymId: session.user.gymId });
        if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

        const log = await TrainerSessionLog.findOneAndUpdate(
            { bookingId },
            {
                bookingId,
                trainerId: booking.trainerId,
                memberId: booking.memberId,
                exercises,
                trainerNotes,
                nextPlan,
                injuryFlags,
                gymId: session.user.gymId,
                branchId: booking.branchId
            },
            { upsate: true, new: true, upsert: true }
        );

        // Auto-mark booking as completed if log is added
        if (booking.status !== "completed") {
            booking.status = "completed";
            await booking.save();
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error("Create session log error:", error);
        return NextResponse.json({ message: "Error creating session log" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");
        const memberId = searchParams.get("memberId");

        await connectDB();

        const query: any = { gymId: session.user.gymId };
        if (bookingId) query.bookingId = bookingId;
        if (memberId) query.memberId = memberId;

        const logs = await TrainerSessionLog.find(query).sort({ createdAt: -1 });
        return NextResponse.json(logs);
    } catch (error) {
        console.error("Fetch session logs error:", error);
        return NextResponse.json({ message: "Error fetching session logs" }, { status: 500 });
    }
}
