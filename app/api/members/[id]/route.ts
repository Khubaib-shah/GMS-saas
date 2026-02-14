import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo, createUpdateDiff } from "@/lib/audit";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        const query = buildGymQuery(session, { _id: objectId, deletedAt: null });
        const member = await Member.findOne(query).populate("trainerId", "firstName lastName photo");

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error) {
        console.error("Get member error:", error);
        return NextResponse.json({ message: "Error fetching member" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_EDIT);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;
    const body = await req.json();

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        const query = buildGymQuery(session, { _id: objectId, deletedAt: null });

        // Get the current state for audit diff
        const oldMember = await Member.findOne(query).lean();
        if (!oldMember) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        const member = await Member.findOneAndUpdate(
            query,
            body,
            { new: true }
        );

        // Audit log
        const diff = createUpdateDiff(oldMember as Record<string, any>, body);
        if (Object.keys(diff).length > 0) {
            await logAudit({
                gymId: session.user.gymId,
                userId: session.user.id,
                userName: session.user.name,
                action: "update",
                resource: "member",
                resourceId: id,
                resourceName: `${member?.firstName} ${member?.lastName || ""}`.trim(),
                details: { changes: diff },
                branchId: session.user.branchId,
                ...extractRequestInfo(req.headers),
            });
        }

        return NextResponse.json(member);
    } catch (error: any) {
        console.error("Update member error:", error);
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
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_DELETE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    try {
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        const query = buildGymQuery(session, { _id: objectId, deletedAt: null });

        // Soft delete instead of hard delete
        const member = await Member.findOneAndUpdate(
            query,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "delete",
            resource: "member",
            resourceId: id,
            resourceName: `${member.firstName} ${member.lastName || ""}`.trim(),
            details: { softDelete: true },
            branchId: session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

        // Cascading soft delete for subscriptions and payments
        // Using models directly ensuring they are loaded
        await Subscription.updateMany(
            { memberId: id, gymId: session.user.gymId },
            { deletedAt: new Date() }
        );

        await Payment.updateMany(
            { memberId: id, gymId: session.user.gymId },
            { deletedAt: new Date() }
        );

        return NextResponse.json({ message: "Member and associated data deleted" });
    } catch (error) {
        console.error("Delete member error:", error);
        return NextResponse.json({ message: "Error deleting member" }, { status: 500 });
    }
}

