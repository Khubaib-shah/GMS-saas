import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo } from "@/lib/audit";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");

        await connectDB();

        // Build base query with gym scope and exclude deleted
        const query: any = { gymId: session.user.gymId, deletedAt: null };

        // If user is branch-scoped AND NOT searching, apply branch filter.
        // During search, we allow finding members across branches.
        if (session.user.branchId && !search) {
            query.branchId = session.user.branchId;
        }

        // If user is a trainer AND NOT searching, restrict to their assigned members only.
        if ((session.user as any).role === 'trainer' && !search) {
            query.trainerId = (session.user as any).id;
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
            _id: undefined // Optional: match toJSON behavior
        }));

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

        return NextResponse.json(createdMember, { status: 201 });
    } catch (error: any) {
        console.error("Create member error:", error);
        if (error.code === 11000) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating member" }, { status: 500 });
    }
}

