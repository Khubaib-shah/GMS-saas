import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import Subscription from "@/models/Subscription";
import { isSubscriptionActive } from "@/lib/subscription-utils";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");

        const gymId = session.user.gymId;
        const branchId = session.user.branchId;
        const role = (session.user as any).role;
        const trainerId = role === 'trainer' ? (session.user as any).id : null;

        // Generate a deterministic cache key based on query parameters and user scope
        const cacheKey = `members:list:gym:${gymId}:branch:${branchId || 'all'}:trainer:${trainerId || 'all'}:search:${search || 'none'}`;

        // Attempt to fetch from Redis first (Cache-First)
        const cachedData = await getCache<any[]>(cacheKey);
        if (cachedData) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedData);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();

        // Build query using helper for legacy/branch support
        const query = buildGymQuery(session);

        // Add search filter if present
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const members = await Member.find(query)
            .sort({ createdAt: -1 })
            .populate("trainerId", "firstName lastName photo")
            .lean();

        // Bulk fetch active subscriptions for status injection
        const memberIds = members.map((m: any) => m._id.toString());
        const activeSubs = await Subscription.find({
            memberId: { $in: memberIds },
            gymId,
            status: { $in: ["active", "paused"] },
            deletedAt: null
        }).lean();

        // Map members and inject status info
        const mappedMembers = members.map((m: any) => {
            const mId = m._id.toString();
            const mySubs = activeSubs.filter(s => s.memberId === mId);

            // Find current active one
            const currentSub = mySubs.find(s => isSubscriptionActive(s.endDate, s.status));

            return {
                ...m,
                id: mId,
                _id: undefined,
                activeSubscription: currentSub ? {
                    status: currentSub.status,
                    endDate: currentSub.endDate
                } : null
            };
        });

        // Store in Redis with a 15-minute TTL (900 seconds)
        await setCache(cacheKey, mappedMembers, 900);

        return NextResponse.json(mappedMembers);
    } catch (error) {
        console.error("Get members error:", error);
        return NextResponse.json({ message: "Error fetching members" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_CREATE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        // Auto-inject gymId and optional branchId
        const memberData = {
            ...body,
            gymId: session.user.gymId,
            branchId: body.branchId || session.user.branchId || undefined,
        };
        const member = await Member.create(memberData);
        const createdMember = Array.isArray(member) ? member[0] : member;

        // Audit log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "member",
                createdMember._id.toString(),
                `${body.firstName || ""} ${body.lastName || ""}`.trim(),
                { member: body },
                req.headers
            )
        );

        // Invalidate all member list caches for this gym on addition of new member
        await invalidatePattern(`members:list:gym:${session.user.gymId}:*`);

        return NextResponse.json(createdMember, { status: 201 });
    } catch (error: any) {
        console.error("Create member error:", error);
        if (error.code === 11000) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating member" }, { status: 500 });
    }
}

