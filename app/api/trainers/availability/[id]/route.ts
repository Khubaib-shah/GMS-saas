import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerAvailability from "@/models/TrainerAvailability";
import TrainerSlot from "@/models/TrainerSlot";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();
        const availability = await TrainerAvailability.findOne({
            _id: id,
            gymId: session.user.gymId,
        });

        if (!availability) {
            return NextResponse.json({ message: "Availability not found" }, { status: 404 });
        }

        // RBAC: Trainers can only own manage their own availability
        if (session.user.role === "trainer" && availability.trainerId.toString() !== session.user.id) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        availability.deletedAt = new Date();
        await availability.save();

        // Also soft-delete all slots associated with this availability
        await TrainerSlot.updateMany(
            { availabilityId: id, gymId: session.user.gymId },
            { deletedAt: new Date() }
        );

        return NextResponse.json({ message: "Availability deleted successfully" });
    } catch (error) {
        console.error("Delete availability error:", error);
        return NextResponse.json({ message: "Error deleting availability" }, { status: 500 });
    }
}
