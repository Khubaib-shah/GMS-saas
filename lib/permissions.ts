/**
 * Permission System for GMS SaaS
 * This file defines all available permissions and role-permission mappings.
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
    STAFF_MANAGE: 'staff:manage',
    BRANCHES_MANAGE: 'branches:manage',
    AUDIT_VIEW: 'audit:view',

    // Trainer Profiles
    TRAINERS_VIEW: 'trainers:view',
    TRAINERS_MANAGE: 'trainers:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

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

// Default permissions per role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    super_admin: Object.values(PERMISSIONS).filter(p =>
        p !== PERMISSIONS.PLANS_CREATE &&
        p !== PERMISSIONS.PLANS_EDIT &&
        p !== PERMISSIONS.PLANS_DELETE
    ),

    owner: Object.values(PERMISSIONS), // Owner has all permissions

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
        PERMISSIONS.TRAINERS_MANAGE, // Manager can manage trainers
        PERMISSIONS.TRAINERS_VIEW,
    ],

    trainer: [
        PERMISSIONS.MEMBERS_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_CHECKIN,
        PERMISSIONS.ATTENDANCE_CHECKOUT,
        PERMISSIONS.PLANS_VIEW,
        PERMISSIONS.TRAINERS_VIEW,
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
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | string, permission: Permission): boolean {
    // Handle legacy roles
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
export function hasAnyPermission(role: Role | string, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(role: Role | string, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}
