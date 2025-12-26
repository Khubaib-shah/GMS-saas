import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).gymId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const gym = await Gym.findById((session.user as any).gymId);

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        return NextResponse.json(gym);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching gym" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).gymId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, address, phone } = body;

        await connectDB();
        const gym = await Gym.findByIdAndUpdate(
            (session.user as any).gymId,
            { name, address, phone },
            { new: true }
        );

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        return NextResponse.json(gym);
    } catch (error) {
        return NextResponse.json({ message: "Error updating gym" }, { status: 500 });
    }
}
