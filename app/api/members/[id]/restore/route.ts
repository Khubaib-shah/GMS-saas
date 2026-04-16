import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { invalidatePattern, deleteCache } from "@/lib/redis";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_EDIT);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 });
    }

    try {
        await connectDB();

        // When restoring, we explicitly look for a document where deletedAt is NOT null
        const query = buildGymQuery(session, { 
            _id: id, 
            deletedAt: { $ne: null } 
        });

        const member = await Member.findOneAndUpdate(
            query,
            { deletedAt: null },
            { new: true }
        );

        if (!member) {
            return NextResponse.json({ message: "Member not found in trash" }, { status: 404 });
        }

        // Audit log
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "member",
                id,
                `${member.firstName} ${member.lastName || ""}`.trim(),
                { restoredFromTrash: true },
                req.headers
            )
        );

        // Cascading restore for subscriptions and payments that were deleted at the exact same time 
        // Or just restore any associated ones to be safe
        await Subscription.updateMany(
            { memberId: id, gymId: session.user.gymId },
            { deletedAt: null }
        );

        await Payment.updateMany(
            { memberId: id, gymId: session.user.gymId },
            { deletedAt: null }
        );

        // Invalidate caches
        await deleteCache(`member:profile:${id}`);
        await invalidatePattern(`members:list:gym:${session.user.gymId}:*`);

        return NextResponse.json({ message: "Member successfully restored from trash", member });
    } catch (error) {
        console.error("Restore member error:", error);
        return NextResponse.json({ message: "Error restoring member" }, { status: 500 });
    }
}
