import connectDB from "@/lib/db";
import Plan from "@/models/Plan";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.PLANS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    const gymId = session.user.gymId;
    const role = session.user.role;

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
    const authResult = await requirePermission(PERMISSIONS.PLANS_CREATE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();
        const sessionGymId = session.user.gymId;
        const role = session.user.role;

        // Use gymId from body if super_admin providing one, else use session gymId
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

        const plan = await new Plan({
            ...body,
            gymId: targetGymId
        }).save();

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "plan",
                plan._id.toString(),
                plan.name,
                { plan: body },
                req.headers
            )
        );

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
