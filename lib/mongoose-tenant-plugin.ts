/**
 * Mongoose Tenant Isolation Plugin
 *
 * Automatically injects `gymId` scoping into all find/update/delete queries
 * when a tenant context is established via AsyncLocalStorage.
 *
 * USAGE:
 *   1. Register globally:  mongoose.plugin(mongooseTenantPlugin)
 *   2. Wrap API handlers:  await withTenantScope(session.user.gymId, async () => { ... })
 *
 * SAFETY:
 *   - If no AsyncLocalStorage context is active (e.g. seed scripts, cron jobs),
 *     the plugin is a no-op and does not interfere.
 *   - Blocks cross-tenant query spoofing by throwing if gymId mismatch is detected.
 *   - Models that don't have a gymId field (e.g. PlatformSettings, PlatformPlan)
 *     are automatically skipped.
 */

import mongoose, { Schema, Query } from "mongoose";
import { AsyncLocalStorage } from "async_hooks";

// ─── Tenant Context ───────────────────────────────
export interface TenantContext {
    gymId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

// ─── Plugin ───────────────────────────────────────
export function mongooseTenantPlugin(schema: Schema) {
    // Only apply to schemas that actually have a gymId path
    // This skips platform-level models like PlatformSettings, PlatformPlan, etc.
    const hasGymId = !!schema.paths["gymId"];
    if (!hasGymId) return;

    const applyTenantFilter = function (this: Query<any, any>) {
        const context = tenantStorage.getStore();
        // No context = system-level operation (seeds, cron, migrations) — skip silently
        if (!context?.gymId) return;

        const query = this.getQuery();

        // If the query already has gymId, verify it matches the context
        if (query.gymId) {
            const queryGymId = query.gymId.toString();
            if (queryGymId !== context.gymId) {
                throw new Error(
                    `[TenantPlugin] Cross-tenant query blocked. Context gymId: ${context.gymId}, Query gymId: ${queryGymId}`
                );
            }
        } else {
            // Auto-inject gymId scoping
            this.where("gymId").equals(new mongoose.Types.ObjectId(context.gymId));
        }
    };

    // Hook into all query types that could leak data
    schema.pre("find", applyTenantFilter);
    schema.pre("findOne", applyTenantFilter);
    schema.pre("findOneAndUpdate", applyTenantFilter);
    schema.pre("findOneAndDelete", applyTenantFilter);
    schema.pre("updateOne", applyTenantFilter);
    schema.pre("updateMany", applyTenantFilter);
    schema.pre("deleteOne", applyTenantFilter);
    schema.pre("deleteMany", applyTenantFilter);
    schema.pre("countDocuments", applyTenantFilter);
}

// ─── Helper ───────────────────────────────────────
/**
 * Execute a database operation within a tenant-scoped context.
 * All Mongoose queries inside the callback will automatically be scoped to the given gymId.
 *
 * @example
 * const members = await withTenantScope(session.user.gymId, async () => {
 *   return Member.find({ deletedAt: null }); // gymId auto-injected
 * });
 */
export async function withTenantScope<T>(gymId: string, operation: () => Promise<T>): Promise<T> {
    return tenantStorage.run({ gymId }, operation);
}
