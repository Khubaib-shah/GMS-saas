import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const payments = await Payment.find({ gymId: (session.user as any).gymId }).sort({ date: -1 });
    return NextResponse.json(payments);
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
        return NextResponse.json(payment.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ message: "Error creating payment" }, { status: 500 });
    }
}
