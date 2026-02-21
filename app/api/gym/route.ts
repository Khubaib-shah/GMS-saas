import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import { NextResponse } from "next/server";
import { getCache, setCache, deleteCache } from "@/lib/redis";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const gymId = (session.user as any).gymId;
        if (!session || !gymId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const cacheKey = `gym:profile:${gymId}`;

        // Cache-First
        const cachedGym = await getCache<any>(cacheKey);
        if (cachedGym) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedGym);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const gym = await Gym.findById(gymId);

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        // Cache for 24 hours (86400 seconds) since it rarely changes
        await setCache(cacheKey, gym, 86400);

        return NextResponse.json(gym);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching gym" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).gymId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, address, phone } = body;

        await connectDB();
        const gym = await Gym.findByIdAndUpdate(
            (session.user as any).gymId,
            { name, address, phone },
            { new: true }
        );

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        // Invalidate cache
        await deleteCache(`gym:profile:${(session.user as any).gymId}`);

        return NextResponse.json(gym);
    } catch (error) {
        return NextResponse.json({ message: "Error updating gym" }, { status: 500 });
    }
}
