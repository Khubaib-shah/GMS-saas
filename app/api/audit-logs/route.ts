import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";

/**
 * GET /api/audit-logs - Get paginated audit logs for the current gym
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - resource: Filter by resource type (optional)
 *   - action: Filter by action type (optional)
 *   - userId: Filter by specific user (optional)
 *   - startDate: Filter logs from this date (optional)
 *   - endDate: Filter logs until this date (optional)
 */
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.AUDIT_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
        const resource = searchParams.get("resource");
        const action = searchParams.get("action");
        const userId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        await connectDB();

        // Build query
        const query: Record<string, any> = buildGymQuery(session);

        if (resource) query.resource = resource;
        if (action) query.action = action;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Restrict audit log visibility
        // Only Super Admin and Gym Owner can view audit logs
        const userRole = (session.user as any).role;
        if (userRole !== "super_admin" && userRole !== "owner" && userRole !== "gym_owner") {
            return NextResponse.json({ error: "Forbidden: Only Owners can view audit logs" }, { status: 403 });
        }

        // Get total count
        const total = await AuditLog.countDocuments(query);

        // Get paginated logs
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const mappedLogs = logs.map((log: any) => ({
            ...log,
            id: log._id.toString(),
            _id: undefined
        }));

        return NextResponse.json({
            logs: mappedLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get audit logs error:", error);
        return NextResponse.json({ message: "Error fetching audit logs" }, { status: 500 });
    }
}
