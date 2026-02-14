import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { generateAllTrainerSlots } from "@/lib/services/trainer-slot-service";

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();
        const count = await generateAllTrainerSlots(session.user.gymId);
        return NextResponse.json({ message: `Successfully generated ${count} slots across all trainers.` });
    } catch (error) {
        console.error("Generate slots error:", error);
        return NextResponse.json({ message: "Error generating slots" }, { status: 500 });
    }
}
