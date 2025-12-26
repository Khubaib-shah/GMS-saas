import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const subs = await Subscription.find({ gymId: (session.user as any).gymId }).sort({ createdAt: -1 });
    return NextResponse.json(subs);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();
        const sub = await Subscription.create({
            ...body,
            gymId: (session.user as any).gymId
        });
        return NextResponse.json(sub.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create subscription error:", error);
        return NextResponse.json({ message: "Error creating subscription" }, { status: 500 });
    }
}
