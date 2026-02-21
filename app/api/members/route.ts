import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo } from "@/lib/audit";
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

        // Build base query with gym scope and exclude deleted
        const query: any = { gymId, deletedAt: null };

        if (branchId && !search) {
            query.branchId = branchId;
        }

        if (trainerId && !search) {
            query.trainerId = trainerId;
        }

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

        // lean() bypasses toJSON transform, so we must manually map _id to id
        const mappedMembers = members.map((m: any) => ({
            ...m,
            id: m._id.toString(),
            _id: undefined
        }));

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
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "create",
            resource: "member",
            resourceId: createdMember._id.toString(),
            resourceName: `${body.firstName || ""} ${body.lastName || ""}`.trim(),
            details: { member: body },
            branchId: session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

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

