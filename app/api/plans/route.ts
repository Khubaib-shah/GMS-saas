import connectDB from "@/lib/db";
import Plan from "@/models/Plan";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const gymId = (session.user as any).gymId;

    if (role !== "super_admin" && !gymId) {
        return NextResponse.json({ message: "Unauthorized: No gym associated" }, { status: 401 });
    }

    const cacheKey = `plans:list:gym:${gymId || 'all'}`;

    try {
        const cachedPlans = await getCache<any[]>(cacheKey);
        if (cachedPlans) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedPlans);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();

        const query = (role === "super_admin" && !gymId) ? {} : { gymId };
        const plans = await Plan.find(query).sort({ price: 1 });

        await setCache(cacheKey, plans, 3600); // 1 hour TTL

        return NextResponse.json(plans);
    } catch (error) {
        console.error("Get plans error:", error);
        return NextResponse.json({ message: "Error fetching plans" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const canCreate = hasPermission(role, PERMISSIONS.PLANS_CREATE);

    if (!canCreate) {
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    try {
        const body = await req.json();
        await connectDB();
        const sessionGymId = (session.user as any).gymId;

        // Use gymId from body if super_admin providing one, else use session gymId
        // Since super_admin is restricted from creating plans, this will mostly use sessionGymId
        const targetGymId = (role === "super_admin" && body.gymId) ? body.gymId : sessionGymId;

        if (!targetGymId) {
            return NextResponse.json({ message: "Gym ID is required" }, { status: 400 });
        }

        // Check if ID exists within the target Gym
        if (body.id) {
            const existing = await Plan.findOne({ id: body.id, gymId: targetGymId });
            if (existing) {
                return NextResponse.json({ message: "Plan ID already exists in this gym" }, { status: 400 });
            }
        }

        const plan = await Plan.create({
            ...body,
            gymId: targetGymId
        });

        // Invalidate list cache
        await invalidatePattern(`plans:list:gym:${targetGymId}`);

        return NextResponse.json(plan, { status: 201 });
    } catch (error: any) {
        console.error("Create plan error:", error);
        return NextResponse.json({
            message: "Error creating plan",
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}
