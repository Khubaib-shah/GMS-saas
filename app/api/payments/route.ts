import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
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
    const cacheKey = `payments:list:gym:${gymId}`;

    try {
        const cachedPayments = await getCache<any[]>(cacheKey);
        if (cachedPayments) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedPayments);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const payments = await Payment.find({
            gymId: gymId,
            deletedAt: null
        }).sort({ date: -1 });

        await setCache(cacheKey, payments, 1800);

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching payments" }, { status: 500 });
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
        const payment = await Payment.create({
            ...body,
            gymId: (session.user as any).gymId
        });

        // Invalidate cache
        await invalidatePattern(`payments:list:gym:${(session.user as any).gymId}`);

        return NextResponse.json(payment.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ message: "Error creating payment" }, { status: 500 });
    }
}
