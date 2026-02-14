"use client";

import { useSession } from "next-auth/react";
import { Permission, hasPermission, getPermissionsForRole, hasAnyPermission, hasAllPermissions } from "@/lib/permissions";

interface UsePermissionsReturn {
    isLoading: boolean;
    isAuthenticated: boolean;
    role: string | null;
    permissions: Permission[];
    can: (permission: Permission) => boolean;
    canAny: (permissions: Permission[]) => boolean;
    canAll: (permissions: Permission[]) => boolean;
    isPremium: boolean;
    branchId: string | null;
    gymId: string | null;
}

/**
 * Hook for checking user permissions in client components
 * 
 * @example
 * ```tsx
 * function MemberActions() {
 *   const { can } = usePermissions();
 *   
 *   return (
 *     <div>
 *       {can('members:create') && <Button>Add Member</Button>}
 *       {can('members:delete') && <Button variant="destructive">Delete</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
    const { data: session, status } = useSession();
    
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated" && !!session?.user;
    
    const user = session?.user as any;
    const role = user?.role ?? null;
    const branchId = user?.branchId ?? null;
    const gymId = user?.gymId ?? null;
    const isPremium = user?.isPremium ?? false;
    
    // Get permissions - use custom if set, otherwise derive from role
    const customPermissions = user?.customPermissions ?? [];
    const permissions: Permission[] = customPermissions.length > 0 
        ? customPermissions 
        : (role ? getPermissionsForRole(role) : []);
    
    const can = (permission: Permission): boolean => {
        if (!role) return false;
        // Check custom permissions first
        if (customPermissions.length > 0) {
            return customPermissions.includes(permission);
        }
        return hasPermission(role, permission);
    };
    
    const canAny = (perms: Permission[]): boolean => {
        if (!role) return false;
        if (customPermissions.length > 0) {
            return perms.some(p => customPermissions.includes(p));
        }
        return hasAnyPermission(role, perms);
    };
    
    const canAll = (perms: Permission[]): boolean => {
        if (!role) return false;
        if (customPermissions.length > 0) {
            return perms.every(p => customPermissions.includes(p));
        }
        return hasAllPermissions(role, perms);
    };
    
    return {
        isLoading,
        isAuthenticated,
        role,
        permissions,
        can,
        canAny,
        canAll,
        isPremium,
        branchId,
        gymId,
    };
}

/**
 * Component wrapper that only renders children if user has permission
 * 
 * @example
 * ```tsx
 * <PermissionGate permission="members:delete">
 *   <DeleteMemberButton />
 * </PermissionGate>
 * ```
 */
interface PermissionGateProps {
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function PermissionGate({ 
    permission, 
    permissions, 
    requireAll = false,
    fallback = null, 
    children 
}: PermissionGateProps) {
    const { can, canAny, canAll, isLoading } = usePermissions();
    
    if (isLoading) return null;
    
    // Check single permission
    if (permission && !can(permission)) {
        return <>{fallback}</>;
    }
    
    // Check multiple permissions
    if (permissions && permissions.length > 0) {
        const hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
        if (!hasAccess) {
            return <>{fallback}</>;
        }
    }
    
    return <>{children}</>;
}
