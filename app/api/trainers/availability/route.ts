import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerAvailability from "@/models/TrainerAvailability";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { generateTrainerSlots } from "@/lib/services/trainer-slot-service";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.AVAILABILITY_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const trainerId = searchParams.get("trainerId");

        await connectDB();

        const query: any = { gymId: session.user.gymId, deletedAt: null };
        if (trainerId) query.trainerId = trainerId;

        // RBAC: Trainers can only see their own availability unless they are admin/staff
        if (session.user.role === "trainer" && trainerId && trainerId !== session.user.id) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const availabilities = await TrainerAvailability.find(query).sort({ dayOfWeek: 1, startTime: 1 });
        return NextResponse.json(availabilities);
    } catch (error) {
        console.error("Fetch availability error:", error);
        return NextResponse.json({ message: "Error fetching availability" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.AVAILABILITY_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { trainerId, dayOfWeek, startTime, endTime, slotDurationMinutes, branchId } = body;

        await connectDB();

        if (dayOfWeek === 0) {
            return NextResponse.json({ message: "Gyms are closed on Sundays" }, { status: 400 });
        }

        // RBAC: Trainers can only manage their own availability
        if (session.user.role === "trainer" && trainerId !== session.user.id) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        // Check for overlaps (No overlapping availability for the same trainer on the same day)
        const existing = await TrainerAvailability.find({
            trainerId,
            dayOfWeek,
            deletedAt: null
        });

        const isOverlapping = existing.some(avail => {
            return (startTime >= avail.startTime && startTime < avail.endTime) ||
                (endTime > avail.startTime && endTime <= avail.endTime) ||
                (startTime <= avail.startTime && endTime >= avail.endTime);
        });

        if (isOverlapping) {
            return NextResponse.json({ message: "Availability overlaps with an existing schedule" }, { status: 400 });
        }

        const availability = await TrainerAvailability.create({
            trainerId,
            dayOfWeek,
            startTime,
            endTime,
            slotDurationMinutes: slotDurationMinutes || 60,
            gymId: session.user.gymId,
            branchId: branchId || session.user.branchId,
            recurring: true
        });

        // Automatically generate slots for this new availability
        await generateTrainerSlots(trainerId, session.user.gymId, availability.branchId?.toString());

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "availability",
                availability._id.toString(),
                (dayOfWeek || "Unknown").toString(),
                { trainerId, dayOfWeek, startTime, endTime },
                req.headers
            )
        );

        return NextResponse.json(availability, { status: 201 });
    } catch (error) {
        console.error("Create availability error:", error);
        return NextResponse.json({ message: "Error creating availability" }, { status: 500 });
    }
}
