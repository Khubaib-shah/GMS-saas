import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const members = await Member.find({ gymId: (session.user as any).gymId }).sort({ createdAt: -1 });
    return NextResponse.json(members);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();

        // Auto-inject gymId
        const member = await Member.create({
            ...body,
            gymId: (session.user as any).gymId
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error: any) {
        console.error("Create member error:", error);
        if (error.code === 11000) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating member" }, { status: 500 });
    }
}
