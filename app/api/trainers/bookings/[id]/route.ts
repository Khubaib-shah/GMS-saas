import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerBooking from "@/models/TrainerBooking";
import TrainerSlot from "@/models/TrainerSlot";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { status } = body; // cancelled, completed, no-show

        await connectDB();
        const booking = await TrainerBooking.findOne({
            _id: id,
            gymId: session.user.gymId,
        });

        if (!booking) {
            return NextResponse.json({ message: "Booking not found" }, { status: 404 });
        }

        // RBAC check (Optional: only staff or owner of booking)

        const prevStatus = booking.status;
        booking.status = status;
        await booking.save();

        // If cancelled, free up slot capacity
        if (status === "cancelled" && prevStatus !== "cancelled") {
            const slot = await TrainerSlot.findById(booking.slotId);
            if (slot) {
                slot.bookedCount = Math.max(0, slot.bookedCount - 1);
                if (slot.status === "full") slot.status = "available";
                await slot.save();
            }
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Update booking error:", error);
        return NextResponse.json({ message: "Error updating booking" }, { status: 500 });
    }
}
