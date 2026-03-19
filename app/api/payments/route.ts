import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";
import { authorize, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
    const authResult = await authorize(PERMISSIONS.PAYMENTS_VIEW);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    const gymId = session.user.gymId;
    const cacheKey = `payments:list:gym:${gymId}`;

    try {
        const cachedPayments = await getCache<any[]>(cacheKey);
        if (cachedPayments) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedPayments);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const payments = await Payment.find(buildGymQuery(session, {
            deletedAt: null
        })).sort({ date: -1 });

        await setCache(cacheKey, payments, 1800);

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching payments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authResult = await authorize(PERMISSIONS.PAYMENTS_CREATE);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();
        const payment = await new Payment({
            ...body,
            gymId: session.user.gymId,
            branchId: session.user.branchId
        }).save();

        // Invalidate cache
        await invalidatePattern(`payments:list:gym:${session.user.gymId}`);

        return NextResponse.json(payment.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ message: "Error creating payment" }, { status: 500 });
    }
}
