import { z } from "zod";

/**
 * Zod Validation Schemas for Secure Settings Updates.
 *
 * PRINCIPLE: Never allow direct object overwrite.
 * Each schema validates only the allowed fields for its section.
 * Fields like gymId, subscription fields, and internal flags are blocked.
 */

// ─────────────────────────────────────────────────
// Gym Settings Schemas (tenant-level)
// ─────────────────────────────────────────────────

export const GeneralSettingsSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    logo: z.string().max(500).optional(),
    address: z.string().max(300).optional(),
    phone: z.string().max(20).optional(),
    timezone: z.string().max(50).optional(),
    currency: z.string().max(10).optional(),
}).strict(); // .strict() blocks unknown keys

export const BusinessSettingsSchema = z.object({
    taxPercentage: z.number().min(0).max(100).optional(),
    joiningFee: z.number().min(0).optional(),
    autoExpireDays: z.number().min(0).max(365).optional(),
    gracePeriodDays: z.number().min(0).max(90).optional(),
    modules: z.object({
        trainers: z.boolean().optional(),
        attendance: z.boolean().optional(),
        workoutPlans: z.boolean().optional(),
        payments: z.boolean().optional(),
        auditLogs: z.boolean().optional(),
        multiBranch: z.boolean().optional(),
    }).optional(),
}).strict();

export const NotificationSettingsSchema = z.object({
    sendExpiryReminder: z.boolean().optional(),
    sendInvoiceEmail: z.boolean().optional(),
    sendSMS: z.boolean().optional(),
}).strict();

export const ModuleSettingsSchema = z.object({
    trainers: z.boolean().optional(),
    attendance: z.boolean().optional(),
    workoutPlans: z.boolean().optional(),
    payments: z.boolean().optional(),
    auditLogs: z.boolean().optional(),
    multiBranch: z.boolean().optional(),
}).strict();

// ─────────────────────────────────────────────────
// Platform Settings Schema (super admin only)
// ─────────────────────────────────────────────────

export const PlatformSettingsUpdateSchema = z.object({
    maintenanceMode: z.boolean().optional(),
    defaultTrialDays: z.number().min(0).max(365).optional(),
    featureFlags: z.object({
        trainersModule: z.boolean().optional(),
        dietModule: z.boolean().optional(),
        advancedReports: z.boolean().optional(),
    }).strict().optional(),
    pricingTiers: z.array(z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        allowedFeatures: z.array(z.string()),
    })).optional(),
}).strict();

// ─────────────────────────────────────────────────
// Role Schemas
// ─────────────────────────────────────────────────

export const CreateRoleSchema = z.object({
    name: z.string().min(1).max(50),
    permissions: z.array(z.string()).min(0),
    description: z.string().max(200).optional(),
}).strict();

export const UpdateRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    permissions: z.array(z.string()).optional(),
    description: z.string().max(200).optional(),
}).strict();

// ─────────────────────────────────────────────────
// User Preferences Schema
// ─────────────────────────────────────────────────

export const UserPreferencesSchema = z.object({
    theme: z.enum(["dark", "light", "system"]).optional(),
    notificationMode: z.enum(["email", "sms", "both", "none"]).optional(),
}).strict();

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/**
 * Build a MongoDB $set object from validated data.
 * Prefixes all keys with a section name, e.g.:
 *   buildSetObject("business", { taxPercentage: 18 })
 *   => { "business.taxPercentage": 18 }
 *
 * This prevents direct object overwrites and ensures atomic field updates.
 */
export function buildSetObject(section: string, data: Record<string, any>): Record<string, any> {
    const $set: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Handle nested objects like modules
                for (const [subKey, subValue] of Object.entries(value)) {
                    $set[`${section}.${key}.${subKey}`] = subValue;
                }
            } else {
                $set[`${section}.${key}`] = value;
            }
        }
    }
    return $set;
}
