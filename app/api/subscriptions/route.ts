import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const gymId = (session.user as any).gymId;
    const cacheKey = `subscriptions:list:gym:${gymId}`;

    try {
        const cachedSubs = await getCache<any[]>(cacheKey);
        if (cachedSubs) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedSubs);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const subs = await Subscription.find({
            gymId: gymId,
            deletedAt: null
        }).sort({ createdAt: -1 });

        await setCache(cacheKey, subs, 1800); // 30 min TTL

        return NextResponse.json(subs);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching subscriptions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();
        const sub = await Subscription.create({
            ...body,
            gymId: (session.user as any).gymId
        });

        // Invalidate cache
        await invalidatePattern(`subscriptions:list:gym:${(session.user as any).gymId}`);

        return NextResponse.json(sub.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create subscription error:", error);
        return NextResponse.json({ message: "Error creating subscription" }, { status: 500 });
    }
}
