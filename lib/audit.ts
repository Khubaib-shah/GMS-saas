import AuditLog from "@/models/AuditLog";
import connectDB from "@/lib/db";

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'pause_subscription'
    | 'resume_subscription'
    | 'checkin'
    | 'checkout'
    | 'role_change'
    | 'export_data'
    | 'enable_portal'
    | 'disable_portal'
    | 'settings_update'
    | 'permission_change'
    | 'feature_flag_change';

export type AuditResource =
    | 'member'
    | 'subscription'
    | 'payment'
    | 'plan'
    | 'attendance'
    | 'user'
    | 'branch'
    | 'settings'
    | 'gym'
    | 'trainer_profile'
    | 'role'
    | 'platform_settings'
    | 'gym_settings'
    | 'subscription_plan';

export interface AuditLogEntry {
    gymId: string;
    userId: string;
    userName?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    branchId?: string;
}

/**
 * Log an action to the audit log
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        await connectDB();
        await AuditLog.create(entry);
    } catch (error) {
        // Don't throw - audit logging should never break the main flow
        console.error("Audit log error:", error);
    }
}

/**
 * Extract IP and User Agent from request headers
 */
export function extractRequestInfo(headers: Headers): { ipAddress?: string; userAgent?: string } {
    const ipAddress =
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        undefined;
    const userAgent = headers.get("user-agent") || undefined;
    return { ipAddress, userAgent };
}

/**
 * Create a before/after diff for update operations
 */
export function createUpdateDiff(before: Record<string, any>, after: Record<string, any>): Record<string, { old: any; new: any }> {
    const diff: Record<string, { old: any; new: any }> = {};

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
        // Skip internal fields
        if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') continue;

        const oldVal = before[key];
        const newVal = after[key];

        // Only log if values are different
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            diff[key] = { old: oldVal, new: newVal };
        }
    }

    return diff;
}

/**
 * Helper to create audit entry for common CRUD operations
 */
export function createCrudAuditEntry(
    session: any,
    action: 'create' | 'update' | 'delete',
    resource: AuditResource,
    resourceId: string,
    resourceName?: string,
    details?: Record<string, any>,
    headers?: Headers
): AuditLogEntry {
    const requestInfo = headers ? extractRequestInfo(headers) : {};

    return {
        gymId: session.user.gymId,
        userId: session.user.id,
        userName: session.user.name,
        action,
        resource,
        resourceId,
        resourceName,
        details,
        branchId: session.user.branchId,
        ...requestInfo,
    };
}
