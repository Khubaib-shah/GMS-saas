import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { Permission, hasPermission, getPermissionsForRole, hasAnyPermission } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Gym from "@/models/Gym";
import jwt from "jsonwebtoken";

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
    // 1. Check for standard NextAuth session (Staff/Staff Members)
    const session = await getAuthSession();

    if (session) {
        if (session.user.role === 'super_admin' || session.user.gymId) {
            return { session };
        }
    }

    // 2. Check for Member Portal JWT (Bearer Token)
    try {
        const headersList = await headers();
        const authHeader = headersList.get("authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const secret = process.env.NEXTAUTH_SECRET || "member-portal-secret";
            const decoded = jwt.verify(token, secret) as any;

            if (decoded && decoded.type === "member") {
                return {
                    session: {
                        user: {
                            id: decoded.memberId,
                            name: decoded.email,
                            email: decoded.email,
                            role: "member",
                            gymId: decoded.gymId,
                            isPremium: false, // Default or fetch if needed
                            permissions: getPermissionsForRole("member"),
                        }
                    }
                };
            }
        }
    } catch (e) {
        console.error("JWT Auth error in middleware:", e);
    }

    return {
        error: NextResponse.json(
            { message: "Unauthorized. Please log in." },
            { status: 401 }
        )
    };
}

// ─────────────────────────────────────────────────
// 3. Subscription Enforcement
// ─────────────────────────────────────────────────

/**
 * Validates that the gym has an active subscription.
 * If expired but not updated in DB, it updates the status to 'expired'.
 * Returns null if active, or NextResponse if blocked.
 */
export async function checkGymSubscription(gymId: string): Promise<NextResponse | null> {
    if (!gymId) return null;

    await connectDB();
    const gym = await Gym.findById(gymId).select("subscriptionStatus expiryDate trialEndsAt isSuspended").lean();

    if (!gym) {
        return NextResponse.json({ message: "Gym not found" }, { status: 404 });
    }

    if (gym.isSuspended) {
        return NextResponse.json({ 
            message: "Gym access suspended. Contact support.", 
            status: "suspended" 
        }, { status: 403 });
    }

    const now = new Date();
    const expiry = gym.expiryDate ? new Date(gym.expiryDate) : null;
    const trialExpiry = gym.trialEndsAt ? new Date(gym.trialEndsAt) : null;

    // Check if actually expired
    const isExpired = (expiry && now > expiry) || (gym.subscriptionStatus === "trial" && trialExpiry && now > trialExpiry);

    if (isExpired && gym.subscriptionStatus !== "expired") {
        // Auto-update status to expired in DB
        await Gym.findByIdAndUpdate(gymId, { subscriptionStatus: "expired" });
        gym.subscriptionStatus = "expired";
    }

    if (gym.subscriptionStatus === "expired") {
        return NextResponse.json({ 
            message: "Subscription expired. Please renew to continue.", 
            status: "expired" 
        }, { status: 403 });
    }

    return null;
}

// ─────────────────────────────────────────────────
// 4. Permission Check Middleware
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

    // Optional: Skip subscription check for super_admins or specific billing routes
    // But for general permissioned routes, enforce it.
    if (session.user.role !== 'super_admin') {
        const subError = await checkGymSubscription(session.user.gymId);
        if (subError) return { error: subError };
    }

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
    const result = await attachTenantContext();
    if ('error' in result) return result;

    // For generic auth, we still want to ensure they haven't been suspended
    if (result.session.user.role !== 'super_admin') {
        const subError = await checkGymSubscription(result.session.user.gymId);
        if (subError) return { error: subError };
    }

    return result;
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
    // We allow records with the specific branchId OR missing branchId (legacy)
    if (session.user.branchId) {
        query.$or = [
            { branchId: session.user.branchId },
            { branchId: { $exists: false } },
            { branchId: null }
        ];
    }

    return query;
}
