import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry, createUpdateDiff } from "@/lib/audit";
import mongoose from "mongoose";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.PAYMENTS_EDIT);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        const update: any = { $set: { ...body } };
        if (body.receiptUrl === null) {
            update.$unset = { receiptUrl: "" };
            delete update.$set.receiptUrl;
        }

        // Get old version for diff
        const oldPayment = await Payment.findOne({ _id: objectId, gymId: session.user.gymId }).lean();
        if (!oldPayment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        const payment = await Payment.findOneAndUpdate(
            { _id: objectId, gymId: session.user.gymId },
            update,
            { new: true }
        );

        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        // Audit Log
        const diff = createUpdateDiff(oldPayment as any, body);
        if (Object.keys(diff).length > 0) {
            await logAudit(
                createCrudAuditEntry(
                    session,
                    "update",
                    "payment",
                    id,
                    (payment.amount || 0).toString(),
                    { changes: diff },
                    req.headers
                )
            );
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
    const authResult = await requirePermission(PERMISSIONS.PAYMENTS_DELETE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        const payment = await Payment.findOneAndUpdate(
            {
                _id: objectId,
                gymId: (session.user as any).gymId,
                deletedAt: null
            },
            { deletedAt: new Date() },
            { new: true }
        );

        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "payment",
                id,
                (payment.amount || 0).toString(),
                { softDelete: true },
                req.headers
            )
        );

        return NextResponse.json({ message: "Payment deleted" });
    } catch (error) {
        console.error("Delete payment error:", error);
        return NextResponse.json({ message: "Error deleting payment" }, { status: 500 });
    }
}
