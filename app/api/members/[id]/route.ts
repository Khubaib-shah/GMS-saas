import connectDB from "@/lib/db";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo, createUpdateDiff, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, deleteCache, invalidatePattern } from "@/lib/redis";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;

    // Defensive guard: reject obviously invalid IDs early
    if (!id || id === "undefined" || id === "null" || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 });
    }

    const cacheKey = `member:profile:${id}`;

    try {
        // Cache-First
        const cachedMember = await getCache<any>(cacheKey);
        if (cachedMember) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedMember);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();

        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        // Profiles should be viewable even if they are in the trash (so they can be restored)
        // We override the default 'deletedAt: null' filter from buildGymQuery.
        const query = buildGymQuery(session, {
            _id: objectId,
            deletedAt: { $ne: undefined } // Matches any value, including null and dates
        });
        const member = await Member.findOne(query).populate("trainerId", "fullName firstName lastName photo").lean();

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Inject active subscription status for UI (confidentiality bypass)
        // This allows trainers to see the "Active" banner even if they can't fetch the full history
        const subscriptionQuery: any = {
            memberId: id,
            status: { $in: ["active", "paused"] },
            endDate: { $gt: new Date().toISOString() },
            deletedAt: null
        };
        if (session.user.gymId) subscriptionQuery.gymId = session.user.gymId;

        const activeSub = await Subscription.findOne(subscriptionQuery).sort({ endDate: -1 }).lean();

        if (activeSub) {
            (member as any).activeSubscription = {
                status: activeSub.status,
                endDate: activeSub.endDate
            };
        }

        // Store in Redis (30-minute TTL)
        await setCache(cacheKey, member, 1800);

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

    // Defensive guard
    if (!id || id === "undefined" || id === "null" || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 });
    }

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
            await logAudit(
                createCrudAuditEntry(
                    session,
                    "update",
                    "member",
                    id,
                    `${member?.firstName} ${member?.lastName || ""}`.trim(),
                    { changes: diff },
                    req.headers
                )
            );
        }

        // Invalidate profile cache and all list caches for this gym
        await deleteCache(`member:profile:${id}`);
        await invalidatePattern(`members:list:gym:${session.user.gymId}:*`);

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

    // Defensive guard
    if (!id || id === "undefined" || id === "null" || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 });
    }

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const permanent = searchParams.get("permanent") === "true";
        const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

        // Final Purge: If permanent delete, we override the default 'deletedAt: null' filter
        // to find the record even if it's already in the trash ($ne: undefined matches any value).
        const query = buildGymQuery(session, {
            _id: objectId,
            ...(permanent ? { deletedAt: { $ne: undefined } } : { deletedAt: null })
        });

        let member;

        if (permanent) {
            member = await Member.findOneAndDelete(query);
        } else {
            // Soft delete
            member = await Member.findOneAndUpdate(
                query,
                { deletedAt: new Date() },
                { new: true }
            );
        }

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Audit log
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "member",
                id,
                `${member.firstName} ${member.lastName || ""}`.trim(),
                { softDelete: !permanent, permanentDelete: permanent },
                req.headers
            )
        );

        if (!permanent) {
            // Cascading soft delete for subscriptions and payments only if soft-deleting
            await Subscription.updateMany(
                { memberId: id, gymId: session.user.gymId },
                { deletedAt: new Date() }
            );

            await Payment.updateMany(
                { memberId: id, gymId: session.user.gymId },
                { deletedAt: new Date() }
            );
        } else {
            // Hard delete associated records if permanent
            await Subscription.deleteMany({ memberId: id, gymId: session.user.gymId });
            await Payment.deleteMany({ memberId: id, gymId: session.user.gymId });
        }

        // Invalidate profile cache and all list caches for this gym
        await deleteCache(`member:profile:${id}`);
        await invalidatePattern(`members:list:gym:${session.user.gymId}:*`);

        return NextResponse.json({ message: permanent ? "Member permanently deleted" : "Member and associated data deleted" });
    } catch (error) {
        console.error("Delete member error:", error);
        return NextResponse.json({ message: "Error deleting member" }, { status: 500 });
    }
}

