import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
    const member = await Member.findOne({ _id: objectId, gymId: (session.user as any).gymId });

    if (!member) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        const member = await Member.findOneAndUpdate(
            { _id: objectId, gymId: (session.user as any).gymId },
            body,
            { new: true }
        );

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error updating member" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

    const result = await Member.findOneAndDelete({ _id: objectId, gymId: (session.user as any).gymId });
    if (!result) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Member deleted" });
}
