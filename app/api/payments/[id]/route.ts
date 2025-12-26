import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        const update: any = { $set: { ...body } };
        if (body.receiptUrl === null) {
            update.$unset = { receiptUrl: "" };
            delete update.$set.receiptUrl;
        }

        // Ensure payment belongs to this gym
        const payment = await Payment.findOneAndUpdate(
            { _id: objectId, gymId: (session.user as any).gymId },
            update,
            { new: true }
        );

        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        return NextResponse.json(payment.toJSON());
    } catch (error) {
        console.error("Update payment error:", error);
        return NextResponse.json({ message: "Error updating payment" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        const payment = await Payment.findOneAndDelete({
            _id: objectId,
            gymId: (session.user as any).gymId
        });

        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Payment deleted" });
    } catch (error) {
        console.error("Delete payment error:", error);
        return NextResponse.json({ message: "Error deleting payment" }, { status: 500 });
    }
}
