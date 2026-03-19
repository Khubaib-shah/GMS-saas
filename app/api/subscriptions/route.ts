import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_VIEW);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    const gymId = session.user.gymId;
    const cacheKey = `subscriptions:list:gym:${gymId}`;

    try {
        const cachedSubs = await getCache<any[]>(cacheKey);
        if (cachedSubs) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedSubs);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const subs = await Subscription.find(buildGymQuery(session, {
            deletedAt: null
        })).sort({ createdAt: -1 });

        await setCache(cacheKey, subs, 1800); // 30 min TTL

        return NextResponse.json(subs);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching subscriptions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.SUBSCRIPTIONS_CREATE);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();
        const sub = await new Subscription({
            ...body,
            gymId: session.user.gymId,
            branchId: body.branchId || session.user.branchId
        }).save();

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "subscription",
                sub._id.toString(),
                (body.planId || "Unknown Plan").toString(),
                { subscription: body },
                req.headers
            )
        );

        // Invalidate cache
        await invalidatePattern(`subscriptions:list:gym:${session.user.gymId}`);

        return NextResponse.json(sub.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create subscription error:", error);
        return NextResponse.json({ message: "Error creating subscription" }, { status: 500 });
    }
}
