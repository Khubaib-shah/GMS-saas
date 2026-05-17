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
import { CreateMemberSchema } from "@/lib/validations";

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

        // If trainer, only show members assigned to them
        if (role === 'trainer' && trainerId) {
            query.trainerId = trainerId;
        }

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

        // ── Zod Validation (Mass Assignment Protection) ──
        const parsed = CreateMemberSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = parsed.data;
        await connectDB();

        // Auto-inject gymId from session (never trust client)
        const gymId = session.user.gymId;

        if (!gymId && session.user.role !== 'super_admin') {
            return NextResponse.json({ message: "Gym ID is required to create a member" }, { status: 400 });
        }

        const targetGymId = gymId || body.gymId;
        if (!targetGymId) {
            return NextResponse.json({ message: "Contextual Gym ID missing. Super-admins must provide a gymId." }, { status: 400 });
        }

        // Build safe member data — only validated fields
        const memberData: Record<string, any> = {
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            joinDate: data.joinDate,
            planId: data.planId,
            notes: data.notes,
            gymId: targetGymId,
            branchId: data.branchId || session.user.branchId || undefined,
        };

        // Sanitize optional fields
        if (data.email && data.email.trim() !== "") memberData.email = data.email;
        if (data.phone && data.phone.trim() !== "") memberData.phone = data.phone;
        if (data.trainerId && data.trainerId !== "" && data.trainerId !== "__none__") {
            memberData.trainerId = data.trainerId;
        }
        if (data.photoBase64) memberData.photoBase64 = data.photoBase64;

        const member = await Member.create(memberData);
        const createdMember = Array.isArray(member) ? member[0] : member;

        // Audit log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "member",
                createdMember._id.toString(),
                `${data.firstName || ""} ${data.lastName || ""}`.trim(),
                { member: data },
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

