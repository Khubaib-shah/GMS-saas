import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import Subscription from "@/models/Subscription";
import { isSubscriptionActive } from "@/lib/subscription-utils";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";
import GymSettings from "@/models/GymSettings";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const showDeleted = searchParams.get("showDeleted") === "true";

        const gymId = session.user.gymId;
        const branchId = session.user.branchId;
        const role = (session.user as any).role;
        const trainerId = role === 'trainer' ? (session.user as any).id : null;

        // Deterministic cache key
        const cacheKey = `members:list:v2:gym:${gymId}:branch:${branchId || 'all'}:trainer:${trainerId || 'all'}:del:${showDeleted}:q:${search || 'none'}`;

        const cachedData = await getCache<any[]>(cacheKey);
        if (cachedData) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedData);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();

        const query = buildGymQuery(session, showDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null });

        if (search) {
            const searchFilter = {
                $or: [
                    { firstName: { $regex: search, $options: "i" } },
                    { lastName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            };
            if (query.$or) {
                query.$and = [{ $or: query.$or }, searchFilter];
                delete query.$or;
            } else {
                query.$or = searchFilter.$or;
            }
        }

        const [members, settings] = await Promise.all([
            Member.find(query)
                .sort({ createdAt: -1 })
                .select("-photoBase64 -portalPassword -portalPin")
                .populate("trainerId", "fullName photo")
                .lean(),
            GymSettings.findOne({ gymId }).lean()
        ]);

        const memberIds = members.map((m: any) => m._id.toString());
        const subscriptionQuery: any = {
            memberId: { $in: memberIds },
            status: { $in: ["active", "paused"] },
            deletedAt: null
        };
        if (gymId) subscriptionQuery.gymId = gymId;

        const activeSubs = await Subscription.find(subscriptionQuery).lean();
        const graceDays = (settings as any)?.business?.gracePeriodDays || 0;

        // O(1) Map lookup
        const subMap = new Map();
        activeSubs.forEach(s => {
            const mId = s.memberId.toString();
            if (isSubscriptionActive(s.endDate, s.status, graceDays)) {
                const existing = subMap.get(mId);
                if (!existing || new Date(s.endDate) > new Date(existing.endDate)) {
                    subMap.set(mId, s);
                }
            }
        });

        const mappedMembers = members.map((m: any) => {
            const mId = m._id.toString();
            const currentSub = subMap.get(mId);

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

        await setCache(cacheKey, mappedMembers, 1800);

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

        // Sanitize: remove empty/invalid values that would cause MongoDB CastError
        const sanitizedBody = { ...body };
        // trainerId must be a valid ObjectId or undefined
        if (!sanitizedBody.trainerId || sanitizedBody.trainerId === "__none__" || sanitizedBody.trainerId === "") {
            delete sanitizedBody.trainerId;
        }
        // Remove empty email to avoid duplicate key errors on sparse unique index
        if (!sanitizedBody.email || sanitizedBody.email.trim() === "") {
            delete sanitizedBody.email;
        }
        // Remove empty phone
        if (!sanitizedBody.phone || sanitizedBody.phone.trim() === "") {
            delete sanitizedBody.phone;
        }

        console.log("[POST /api/members] Sanitized payload:", { ...sanitizedBody, photoBase64: sanitizedBody.photoBase64 ? "[BASE64]" : undefined });

        // Auto-inject gymId and optional branchId
        const gymId = session.user.gymId;

        if (!gymId && session.user.role !== 'super_admin') {
            return NextResponse.json({ message: "Gym ID is required to create a member" }, { status: 400 });
        }

        // If super_admin, we might expect gymId in the body or they just can't create members this way
        const targetGymId = gymId || sanitizedBody.gymId;
        if (!targetGymId) {
            return NextResponse.json({ message: "Contextual Gym ID missing. Super-admins must provide a gymId." }, { status: 400 });
        }

        const memberData = {
            ...sanitizedBody,
            gymId: targetGymId,
            branchId: sanitizedBody.branchId || session.user.branchId || undefined,
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

