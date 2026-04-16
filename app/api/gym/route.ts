import { requireAuth, buildGymQuery } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import { NextResponse } from "next/server";
import { getCache, setCache, deleteCache } from "@/lib/redis";

export async function GET() {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    let gymId = session.user.gymId;

    try {
        await connectDB();

        if (session.user.role === "super_admin" && !gymId) {
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ message: "No gym context found" }, { status: 404 });
        }

        const cacheKey = `gym:profile:${gymId}`;

        // Cache-First
        const cachedGym = await getCache<any>(cacheKey);
        if (cachedGym) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedGym);
        }

        const [gym, subPlan] = await Promise.all([
            Gym.findById(gymId),
            SubscriptionPlan.findOne({ gymId, active: true }).lean()
        ]);

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        const responseData = {
            ...gym.toObject(),
            enabledFeatures: (subPlan as any)?.enabledFeatures || []
        };

        // Cache for 24 hours (86400 seconds) since it rarely changes
        await setCache(cacheKey, responseData, 86400);

        return NextResponse.json(responseData);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching gym" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    let gymId = session.user.gymId;

    try {
        await connectDB();

        if (session.user.role === "super_admin" && !gymId) {
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ message: "No gym context found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, address, phone } = body;

        await connectDB();
        const gym = await Gym.findByIdAndUpdate(
            gymId,
            { name, address, phone },
            { new: true }
        );

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        // Invalidate cache
        await deleteCache(`gym:profile:${gymId}`);

        return NextResponse.json(gym);
    } catch (error) {
        return NextResponse.json({ message: "Error updating gym" }, { status: 500 });
    }
}
