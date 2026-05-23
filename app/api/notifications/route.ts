import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

/**
 * GET /api/notifications
 * Fetch notifications for the current user based on gymId and role.
 */
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        const gymId = session.user.gymId;
        const role = session.user.role;
        const userId = session.user.id;

        // Build query to find notifications meant for this user
        // 1. Must match gymId
        // 2. Either targetUserId is the user OR targetRoles includes the user's role
        const query = {
            gymId,
            $or: [
                { targetUserId: userId },
                { targetRoles: role }
            ]
        };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Mark as read indicator in the response
        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy.some((id: any) => id.toString() === userId.toString())
        }));

        return NextResponse.json(mapped);
    } catch (error: any) {
        console.error("Notifications GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
