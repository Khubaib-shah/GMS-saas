import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        // Populate member data if available
        const orders = await Order.find({ gymId: session.user.gymId })
            .populate("memberId", "firstName lastName email phone")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({ orders });

    } catch (error: any) {
        console.error("Fetch orders error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
