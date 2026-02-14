import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { Permission, hasPermission, getPermissionsForRole, hasAnyPermission } from "@/lib/permissions";

export interface AuthenticatedSession {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        gymId: string;
        branchId?: string;
        isPremium: boolean;
        permissions: Permission[];
    };
}

/**
 * Get authenticated session with permissions
 */
export async function getAuthSession(): Promise<AuthenticatedSession | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user) return null;

    const user = session.user as any;

    // If user has custom permissions, use those. Otherwise, derive from role.
    const permissions = user.customPermissions?.length > 0
        ? user.customPermissions
        : getPermissionsForRole(user.role);

    return {
        user: {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.role,
            gymId: user.gymId,
            branchId: user.branchId,
            isPremium: user.isPremium || false,
            permissions,
        },
    };
}

/**
 * Check if the current session has a specific permission
 * Returns an error response if not authorized
 */
export async function requirePermission(permission: Permission): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const session = await getAuthSession();

    if (!session) {
        return {
            error: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        };
    }

    if (!session.user.gymId) {
        return {
            error: NextResponse.json(
                { message: "No gym context" },
                { status: 403 }
            )
        };
    }

    if (!hasPermission(session.user.role, permission)) {
        return {
            error: NextResponse.json(
                { message: "Permission denied", required: permission },
                { status: 403 }
            )
        };
    }

    return { session };
}

/**
 * Check if the current session has any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const session = await getAuthSession();

    if (!session) {
        return {
            error: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        };
    }

    if (!session.user.gymId) {
        return {
            error: NextResponse.json(
                { message: "No gym context" },
                { status: 403 }
            )
        };
    }

    if (!hasAnyPermission(session.user.role, permissions)) {
        return {
            error: NextResponse.json(
                { message: "Permission denied", required: permissions },
                { status: 403 }
            )
        };
    }

    return { session };
}

/**
 * Simple auth check without permission requirements (just needs to be logged in with gymId)
 */
export async function requireAuth(): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const session = await getAuthSession();

    if (!session) {
        return {
            error: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        };
    }

    if (!session.user.gymId) {
        return {
            error: NextResponse.json(
                { message: "No gym context" },
                { status: 403 }
            )
        };
    }

    return { session };
}

/**
 * Build a gym-scoped query filter including optional branch filtering
 */
export function buildGymQuery(session: AuthenticatedSession, additionalFilters: Record<string, any> = {}): Record<string, any> {
    const query: Record<string, any> = {
        gymId: session.user.gymId,
        ...additionalFilters,
    };

    // If user is branch-scoped, add branch filter
    if (session.user.branchId) {
        query.branchId = session.user.branchId;
    }

    return query;
}
