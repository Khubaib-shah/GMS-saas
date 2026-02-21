import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { Permission, hasPermission, getPermissionsForRole, hasAnyPermission } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import SubscriptionPlan from "@/models/SubscriptionPlan";

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

// ─────────────────────────────────────────────────
// 1. Core Session Helper
// ─────────────────────────────────────────────────

/**
 * Get authenticated session with permissions.
 * Resolves permissions from DB-backed Role if the user has one,
 * otherwise falls back to the legacy hardcoded ROLE_PERMISSIONS map.
 */
export async function getAuthSession(): Promise<AuthenticatedSession | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user) return null;

    const user = session.user as any;

    let permissions: Permission[];

    // If user has custom permissions set directly on their profile, use those
    if (user.customPermissions?.length > 0) {
        permissions = user.customPermissions;
    } else {
        // Fallback: derive permissions from role string
        permissions = getPermissionsForRole(user.role);
    }

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

// ─────────────────────────────────────────────────
// 2. Tenant Context (Critical Middleware)
// ─────────────────────────────────────────────────

/**
 * attachTenantContext()
 *
 * Responsibilities:
 * - Extracts user from JWT/session
 * - Injects req.gymId from the server-side session (never trust client)
 * - Blocks the request if gymId is missing (except for super_admin)
 * - Prevents cross-tenant queries
 *
 * Returns either { session } or { error } — caller must check.
 */
export async function attachTenantContext(): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const session = await getAuthSession();

    if (!session) {
        return {
            error: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        };
    }

    // Super admins can operate without a gymId (platform-level routes)
    if (session.user.role === 'super_admin') {
        return { session };
    }

    if (!session.user.gymId) {
        return {
            error: NextResponse.json(
                { message: "No gym context — access denied" },
                { status: 403 }
            )
        };
    }

    return { session };
}

// ─────────────────────────────────────────────────
// 3. Permission Check Middleware
// ─────────────────────────────────────────────────

/**
 * authorize(permissionKey)
 *
 * Flow:
 * 1. Attach tenant context
 * 2. Fetch user role
 * 3. Check if role.permissions includes key
 * 4. Allow / deny
 *
 * No hardcoded role checks allowed — everything is permission-based.
 */
export async function authorize(permission: Permission): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const result = await attachTenantContext();
    if ('error' in result) return result;

    const { session } = result;

    // Owner shortcut: owner always has full permissions
    // This is still permission-based — owner role is seeded with ALL_PERMISSIONS.
    if (!hasPermission(session.user.role, permission, session.user.permissions as string[])) {
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
    const result = await attachTenantContext();
    if ('error' in result) return result;

    const { session } = result;

    if (!hasAnyPermission(session.user.role, permissions, session.user.permissions as string[])) {
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
    return attachTenantContext();
}

// Backward compat alias
export async function requirePermission(permission: Permission): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    return authorize(permission);
}

// ─────────────────────────────────────────────────
// 4. Feature Flag / Monetization Check
// ─────────────────────────────────────────────────

/**
 * checkFeature(featureKey)
 *
 * Middleware that:
 * 1. Attaches tenant context
 * 2. Checks the gym's SubscriptionPlan for the required feature
 * 3. Verifies the subscription is active and not expired
 * 4. Allows / denies
 */
export async function checkFeature(featureKey: string): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const result = await attachTenantContext();
    if ('error' in result) return result;

    const { session } = result;

    // Super admin bypasses feature checks
    if (session.user.role === 'super_admin') return { session };

    await connectDB();
    const plan = await SubscriptionPlan.findOne({
        gymId: session.user.gymId,
        active: true,
    }).lean();

    if (!plan) {
        return {
            error: NextResponse.json(
                { message: "No active subscription plan", feature: featureKey },
                { status: 403 }
            )
        };
    }

    // Check expiry
    if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) {
        return {
            error: NextResponse.json(
                { message: "Subscription expired", feature: featureKey },
                { status: 403 }
            )
        };
    }

    // Check feature
    if (!plan.enabledFeatures?.includes(featureKey)) {
        return {
            error: NextResponse.json(
                { message: "Feature not available on your plan", feature: featureKey, currentPlan: plan.tierName },
                { status: 403 }
            )
        };
    }

    return { session };
}

// ─────────────────────────────────────────────────
// 5. Super Admin Guard
// ─────────────────────────────────────────────────

/**
 * Ensures only super_admin can access the route.
 */
export async function requireSuperAdmin(): Promise<{ session: AuthenticatedSession } | { error: NextResponse }> {
    const session = await getAuthSession();

    if (!session) {
        return {
            error: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        };
    }

    if (session.user.role !== 'super_admin') {
        return {
            error: NextResponse.json(
                { message: "Super admin access required" },
                { status: 403 }
            )
        };
    }

    return { session };
}

// ─────────────────────────────────────────────────
// 6. Query Builder
// ─────────────────────────────────────────────────

/**
 * Build a gym-scoped query filter including optional branch filtering.
 * All database queries MUST use this to ensure tenant isolation.
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
