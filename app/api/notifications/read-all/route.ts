import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

/**
 * POST /api/notifications/read-all
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        const gymId = session.user.gymId;
        const role = session.user.role;
        const userId = session.user.id;

        const query = {
            gymId,
            $or: [
                { targetUserId: userId },
                { targetRoles: role }
            ],
            readBy: { $ne: userId }
        };

        // Find all unread notifications for this user and push their ID to readBy
        await Notification.updateMany(query, {
            $addToSet: { readBy: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Notification Read All Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
