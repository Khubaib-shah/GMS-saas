import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerBooking from "@/models/TrainerBooking";
import TrainerSlot from "@/models/TrainerSlot";
import Member from "@/models/Member";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { isBefore, parse, format } from "date-fns";

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW); // Adjust if specific 'BOOKING_CREATE' exists
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { slotId, memberId, notes } = body;

        await connectDB();

        // 1. Fetch Slot and Member
        const slot = await TrainerSlot.findOne({ _id: slotId, deletedAt: null });
        const member = await Member.findOne({ _id: memberId, deletedAt: null });

        if (!slot) return NextResponse.json({ message: "Slot not found" }, { status: 404 });
        if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

        // 2. Validate Branch
        if (slot.branchId && member.branchId && slot.branchId.toString() !== member.branchId.toString()) {
            return NextResponse.json({ message: "Trainer and member must belong to the same branch" }, { status: 400 });
        }

        // 3. Check Capacity
        if (slot.bookedCount >= slot.capacity || slot.status === "full") {
            return NextResponse.json({ message: "Slot is fully booked" }, { status: 400 });
        }

        // 4. Prevent Past-Time Booking
        const slotDateTime = parse(`${format(slot.date, "yyyy-MM-dd")} ${slot.startTime}`, "yyyy-MM-dd HH:mm", new Date());
        if (isBefore(slotDateTime, new Date())) {
            return NextResponse.json({ message: "Cannot book sessions in the past" }, { status: 400 });
        }

        // 5. Prevent Double Booking for the member at the same slot
        const existing = await TrainerBooking.findOne({
            memberId,
            slotId,
            status: "booked",
            deletedAt: null
        });
        if (existing) return NextResponse.json({ message: "Member is already booked for this slot" }, { status: 400 });

        // 6. Create Booking and Update Slot
        const booking = await TrainerBooking.create({
            slotId,
            trainerId: slot.trainerId,
            memberId,
            bookingSource: session.user.role === "member" ? "member" : "staff",
            status: "booked",
            notes,
            gymId: session.user.gymId,
            branchId: slot.branchId
        });

        slot.bookedCount += 1;
        if (slot.bookedCount >= slot.capacity) {
            slot.status = "full";
        }
        await slot.save();

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        console.error("Create booking error:", error);
        return NextResponse.json({ message: "Error creating booking" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const trainerId = searchParams.get("trainerId");
        const memberId = searchParams.get("memberId");
        const status = searchParams.get("status");

        await connectDB();

        const query: any = { gymId: session.user.gymId, deletedAt: null };
        if (trainerId) query.trainerId = trainerId;
        if (memberId) query.memberId = memberId;
        if (status) query.status = status;

        // RDAC: Trainer only see their bookings
        if (session.user.role === "trainer" && trainerId && trainerId !== session.user.id) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const bookings = await TrainerBooking.find(query)
            .populate("slotId")
            .populate("memberId", "firstName lastName photoBase64")
            .populate("trainerId", "fullName photo")
            .sort({ createdAt: -1 });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Fetch bookings error:", error);
        return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
    }
}
