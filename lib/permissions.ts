/**
 * Permission System for GMS SaaS
 * This file defines all available permissions and role-permission mappings.
 * 
 * ARCHITECTURE NOTE:
 * - In-code ROLE_PERMISSIONS serves as the DEFAULT template.
 * - At runtime the DB-backed Role model takes precedence if a user has roleId set.
 * - The `hasPermission` and related helpers accept a permissions array directly
 *   so they work with both approaches (legacy role string or DB-backed permissions).
 */

// All available permissions in the system
export const PERMISSIONS = {
    // Members
    MEMBERS_VIEW: 'members:view',
    MEMBERS_CREATE: 'members:create',
    MEMBERS_EDIT: 'members:edit',
    MEMBERS_DELETE: 'members:delete',

    // Subscriptions
    SUBSCRIPTIONS_VIEW: 'subscriptions:view',
    SUBSCRIPTIONS_CREATE: 'subscriptions:create',
    SUBSCRIPTIONS_EDIT: 'subscriptions:edit',
    SUBSCRIPTIONS_DELETE: 'subscriptions:delete',
    SUBSCRIPTIONS_PAUSE: 'subscriptions:pause',

    // Payments
    PAYMENTS_VIEW: 'payments:view',
    PAYMENTS_CREATE: 'payments:create',
    PAYMENTS_EDIT: 'payments:edit',
    PAYMENTS_DELETE: 'payments:delete',

    // Attendance
    ATTENDANCE_VIEW: 'attendance:view',
    ATTENDANCE_CHECKIN: 'attendance:checkin',
    ATTENDANCE_CHECKOUT: 'attendance:checkout',
    ATTENDANCE_MANUAL: 'attendance:manual',

    // Plans
    PLANS_VIEW: 'plans:view',
    PLANS_CREATE: 'plans:create',
    PLANS_EDIT: 'plans:edit',
    PLANS_DELETE: 'plans:delete',

    // Analytics & Reports
    ANALYTICS_VIEW: 'analytics:view',
    REPORTS_EXPORT: 'reports:export',

    // Settings & Admin
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    STAFF_VIEW: 'staff:view',
    STAFF_MANAGE: 'staff:manage',
    BRANCHES_MANAGE: 'branches:manage',
    AUDIT_VIEW: 'audit:view',
    BILLING_VIEW: 'billing:view',

    // Trainer Profiles
    TRAINERS_VIEW: 'trainers:view',
    TRAINERS_MANAGE: 'trainers:manage',

    // Roles & Permissions management
    ROLES_VIEW: 'roles:view',
    ROLES_CREATE: 'roles:create',
    ROLES_EDIT: 'roles:edit',
    ROLES_DELETE: 'roles:delete',

    // Platform (super admin only)
    PLATFORM_SETTINGS_VIEW: 'platform:settings:view',
    PLATFORM_SETTINGS_EDIT: 'platform:settings:edit',

    // Trainer Workout Management (Structured)
    TRAINER_DASHBOARD_VIEW: 'trainer.dashboard.view',
    EXERCISE_VIEW: 'exercise:view',
    EXERCISE_CREATE: 'exercise.create',
    EXERCISE_UPDATE: 'exercise.update',
    EXERCISE_DELETE: 'exercise:delete',
    WORKOUT_TEMPLATE_VIEW: 'workout.template:view',
    WORKOUT_TEMPLATE_CREATE: 'workout.template.create',
    WORKOUT_TEMPLATE_UPDATE: 'workout.template.update',
    WORKOUT_TEMPLATE_DELETE: 'workout.template:delete',
    WORKOUT_PLAN_ASSIGN: 'workout.plan.assign',
    WORKOUT_PLAN_MODIFY: 'workout.plan.modify',
    WORKOUT_PLAN_DELETE: 'workout.plan:delete',
    WORKOUT_LOG_VIEW: 'workout.log.view',
    WORKOUT_LOG_CREATE: 'workout.log:create',

    // Bookings & Availability
    BOOKING_VIEW: 'booking:view',
    BOOKING_CREATE: 'booking:create',
    BOOKING_DELETE: 'booking:delete',
    AVAILABILITY_VIEW: 'availability:view',
    AVAILABILITY_MANAGE: 'availability:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// All permission keys as an array (useful f    ding owner role)
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Role types
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    OWNER: 'owner',
    MANAGER: 'manager',
    TRAINER: 'trainer',
    RECEPTIONIST: 'receptionist',
    ACCOUNTANT: 'accountant',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Legacy role mapping (for backward compatibility)
export const LEGACY_ROLE_MAP: Record<string, Role> = {
    'gym_owner': 'owner',
    'staff': 'receptionist',
};

// Default permissions per role (used as template when seeding DB-backed Role objects)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    super_admin: ALL_PERMISSIONS,

    owner: ALL_PERMISSIONS, // Owner always has all permissions

    manager: [
        PERMISSIONS.MEMBERS_VIEW,
        PERMISSIONS.MEMBERS_CREATE,
        PERMISSIONS.MEMBERS_EDIT,
        PERMISSIONS.MEMBERS_DELETE,
        PERMISSIONS.SUBSCRIPTIONS_VIEW,
        PERMISSIONS.SUBSCRIPTIONS_CREATE,
        PERMISSIONS.SUBSCRIPTIONS_EDIT,
        PERMISSIONS.SUBSCRIPTIONS_DELETE,
        PERMISSIONS.SUBSCRIPTIONS_PAUSE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_EDIT,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_CHECKIN,
        PERMISSIONS.ATTENDANCE_CHECKOUT,
        PERMISSIONS.ATTENDANCE_MANUAL,
        PERMISSIONS.PLANS_VIEW,
        PERMISSIONS.PLANS_CREATE,
        PERMISSIONS.PLANS_EDIT,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.STAFF_MANAGE,
        PERMISSIONS.BRANCHES_MANAGE,
        PERMISSIONS.TRAINERS_MANAGE,
        PERMISSIONS.TRAINERS_VIEW,
        PERMISSIONS.ROLES_VIEW,
    ],

    trainer: [
        PERMISSIONS.MEMBERS_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.PLANS_VIEW,
        PERMISSIONS.PLANS_CREATE,
        PERMISSIONS.PLANS_EDIT,
        PERMISSIONS.PLANS_DELETE,
        PERMISSIONS.TRAINERS_VIEW,
        PERMISSIONS.TRAINER_DASHBOARD_VIEW,
        PERMISSIONS.EXERCISE_CREATE,
        PERMISSIONS.EXERCISE_UPDATE,
        PERMISSIONS.WORKOUT_TEMPLATE_CREATE,
        PERMISSIONS.WORKOUT_TEMPLATE_UPDATE,
        PERMISSIONS.WORKOUT_PLAN_ASSIGN,
        PERMISSIONS.WORKOUT_PLAN_MODIFY,
        PERMISSIONS.WORKOUT_LOG_VIEW,
    ],

    receptionist: [
        PERMISSIONS.MEMBERS_VIEW,
        PERMISSIONS.MEMBERS_CREATE,
        PERMISSIONS.MEMBERS_EDIT,
        PERMISSIONS.SUBSCRIPTIONS_VIEW,
        PERMISSIONS.SUBSCRIPTIONS_CREATE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_CHECKIN,
        PERMISSIONS.ATTENDANCE_CHECKOUT,
        PERMISSIONS.ATTENDANCE_MANUAL,
        PERMISSIONS.PLANS_VIEW,
        PERMISSIONS.TRAINERS_VIEW,
    ],

    accountant: [
        PERMISSIONS.MEMBERS_VIEW,
        PERMISSIONS.SUBSCRIPTIONS_VIEW,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_EDIT,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.TRAINERS_VIEW,
    ],
};

/**
 * Check if a role has a specific permission.
 * Works with both legacy role-string approach and DB-backed permission arrays.
 */
export function hasPermission(role: Role | string, permission: Permission, customPermissions?: string[]): boolean {
    // If custom permissions are provided (from DB Role), use those
    if (customPermissions && customPermissions.length > 0) {
        return customPermissions.includes(permission);
    }
    // Fallback to hardcoded role defaults
    const normalizedRole = LEGACY_ROLE_MAP[role] || role as Role;
    const permissions = ROLE_PERMISSIONS[normalizedRole];
    if (!permissions) return false;
    return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role | string): Permission[] {
    const normalizedRole = LEGACY_ROLE_MAP[role] || role as Role;
    return ROLE_PERMISSIONS[normalizedRole] || [];
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(role: Role | string, permissions: Permission[], customPermissions?: string[]): boolean {
    return permissions.some(p => hasPermission(role, p, customPermissions));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(role: Role | string, permissions: Permission[], customPermissions?: string[]): boolean {
    return permissions.every(p => hasPermission(role, p, customPermissions));
}
