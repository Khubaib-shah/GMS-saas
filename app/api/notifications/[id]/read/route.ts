import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

/**
 * POST /api/notifications/[id]/read
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        const notification = await Notification.findById(id);
        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        // Add user ID to readBy array if not already present
        if (!notification.readBy.includes(session.user.id)) {
            notification.readBy.push(session.user.id);
            await notification.save();
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Notification Read Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
