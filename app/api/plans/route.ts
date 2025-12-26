import connectDB from "@/lib/db";
import Plan from "@/models/Plan";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const gymId = (session.user as any).gymId;

    if (role !== "super_admin" && !gymId) {
        return NextResponse.json({ message: "Unauthorized: No gym associated" }, { status: 401 });
    }

    await connectDB();

    // If super_admin, they can see all plans (or we could filter later)
    // For now, if they have a gymId, they see that gym's plans. 
    // If not, they see all plans.
    const query = (role === "super_admin" && !gymId) ? {} : { gymId };

    const plans = await Plan.find(query).sort({ price: 1 });
    return NextResponse.json(plans);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "super_admin") {
        return NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 });
    }



    try {
        const body = await req.json();
        await connectDB();
        const role = (session.user as any).role;
        const sessionGymId = (session.user as any).gymId;

        // Use gymId from body if super_admin providing one, else use session gymId
        const targetGymId = (role === "super_admin" && body.gymId) ? body.gymId : sessionGymId;

        if (!targetGymId) {
            return NextResponse.json({ message: "Gym ID is required" }, { status: 400 });
        }

        // Check if ID exists within the target Gym
        if (body.id) {
            const existing = await Plan.findOne({ id: body.id, gymId: targetGymId });
            if (existing) {
                return NextResponse.json({ message: "Plan ID already exists in this gym" }, { status: 400 });
            }
        }

        const plan = await Plan.create({
            ...body,
            gymId: targetGymId
        });
        return NextResponse.json(plan, { status: 201 });
    } catch (error: any) {
        console.error("Create plan error:", error);
        return NextResponse.json({
            message: "Error creating plan",
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}
