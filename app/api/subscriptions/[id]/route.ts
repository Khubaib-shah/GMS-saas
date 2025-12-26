import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
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

        // Ensure subscription belongs to this gym
        const sub = await Subscription.findOneAndUpdate(
            { _id: objectId, gymId: (session.user as any).gymId },
            { $set: body },
            { new: true }
        );

        if (!sub) {
            return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
        }

        return NextResponse.json(sub);
    } catch (error) {
        console.error("Update subscription error:", error);
        return NextResponse.json({ message: "Error updating subscription" }, { status: 500 });
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
        console.log(`[DELETE SUBSCRIPTION] Attempting to delete sub: ${id}`);

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        // Find subscription first to get the paymentId
        const sub = await Subscription.findOne({
            _id: objectId,
            gymId: (session.user as any).gymId
        });

        if (!sub) {
            console.log(`[DELETE SUBSCRIPTION] Sub not found: ${id}`);
            return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
        }

        console.log(`[DELETE SUBSCRIPTION] Sub found. linked paymentId: ${sub.paymentId}`);

        // 1. Delete associated payment if it exists
        if (sub.paymentId) {
            try {
                // Ensure sub.paymentId is a valid ObjectId if it's a string
                const paymentIdToDelete = mongoose.Types.ObjectId.isValid(sub.paymentId)
                    ? new mongoose.Types.ObjectId(sub.paymentId)
                    : sub.paymentId;

                const deletedPayment = await Payment.findOneAndDelete({
                    _id: paymentIdToDelete,
                    gymId: (session.user as any).gymId
                });
                console.log(`[DELETE SUBSCRIPTION] Associated payment deletion result:`, deletedPayment ? 'Success' : 'Not found');
            } catch (paymentError) {
                console.error("[DELETE SUBSCRIPTION] Failed to delete associated payment error:", paymentError);
                // We continue anyway to delete the subscription
            }
        } else {
            console.log(`[DELETE SUBSCRIPTION] No paymentId found on this subscription record.`);
        }

        // 2. Delete the subscription
        await Subscription.findByIdAndDelete(objectId);
        console.log(`[DELETE SUBSCRIPTION] Subscription ${id} deleted successfully.`);

        return NextResponse.json({ message: "Subscription and associated payment deleted" });
    } catch (error) {
        console.error("Delete subscription error:", error);
        return NextResponse.json({ message: "Error deleting subscription" }, { status: 500 });
    }
}
