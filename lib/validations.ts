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
    address: z.string().max(300).optional(),
    phone: z.string().max(20).optional(),
});

export const BusinessSettingsSchema = z.object({
    joiningFee: z.number().min(0).optional(),
    autoExpireDays: z.number().min(0).max(365).optional(),
    gracePeriodDays: z.number().min(0).max(90).optional(),
});

export const NotificationSettingsSchema = z.object({
    sendExpiryReminder: z.boolean().optional(),
    sendInvoiceEmail: z.boolean().optional(),
    sendSMS: z.boolean().optional(),
});

export const ModuleSettingsSchema = z.object({
    trainersEnabled: z.boolean().optional(),
    attendanceEnabled: z.boolean().optional(),
});

export const EmailSettingsSchema = z.object({
    host: z.string().min(1, "SMTP Host is required").optional().or(z.literal("")),
    port: z.number().min(1).max(65535).optional(),
    secure: z.boolean().optional(),
    user: z.string().optional().or(z.literal("")),
    pass: z.string().optional().or(z.literal("")),
    fromName: z.string().optional().or(z.literal("")),
    fromEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
});

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
    }).optional(),
    pricingTiers: z.array(z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        allowedFeatures: z.array(z.string()),
    })).optional(),
});

// ─────────────────────────────────────────────────
// Role Schemas
// ─────────────────────────────────────────────────

export const CreateRoleSchema = z.object({
    name: z.string().min(1).max(50),
    permissions: z.array(z.string()).min(0),
    description: z.string().max(200).optional(),
});

export const UpdateRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    permissions: z.array(z.string()).optional(),
    description: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────────
// User Preferences Schema
// ─────────────────────────────────────────────────

export const UserPreferencesSchema = z.object({
    theme: z.enum(["dark", "light", "system"]).optional(),
    notificationMode: z.enum(["email", "sms", "both", "none"]).optional(),
});

// ─────────────────────────────────────────────────
// Password Policy
// ─────────────────────────────────────────────────

export const PasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// ─────────────────────────────────────────────────
// Member Schemas (Mass Assignment Protection)
// ─────────────────────────────────────────────────

export const CreateMemberSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().max(50).optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    gender: z.enum(["male", "female", "other"]).optional(),
    joinDate: z.string().min(1, "Join date is required"),
    planId: z.string().optional(),
    notes: z.string().max(500).optional(),
    trainerId: z.string().optional().or(z.literal("")),
    branchId: z.string().optional().or(z.literal("")),
    photoBase64: z.string().optional(),
});

export const UpdateMemberSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().max(50).optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    gender: z.enum(["male", "female", "other"]).optional(),
    joinDate: z.string().optional(),
    planId: z.string().optional(),
    notes: z.string().max(500).optional(),
    trainerId: z.string().optional().or(z.literal("")).or(z.literal("__none__")),
    branchId: z.string().optional().or(z.literal("")),
    photoBase64: z.string().optional().or(z.literal("")),
});

// ─────────────────────────────────────────────────
// Payment Schemas
// ─────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
    amount: z.number().min(0, "Amount must be positive"),
    date: z.string().min(1, "Payment date is required"),
    method: z.enum(["cash", "online", "bank_transfer", "card", "other"]),
    description: z.string().max(500).optional(),
    receiptUrl: z.string().url().optional().or(z.literal("")),
    receiptNumber: z.string().max(50).optional(),
    collectedBy: z.string().optional(),
    notes: z.string().max(500).optional(),
    branchId: z.string().optional(),
});

// ─────────────────────────────────────────────────
// Subscription Schemas
// ─────────────────────────────────────────────────

export const CreateSubscriptionSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    originalEndDate: z.string().optional(),
    status: z.enum(["active", "expired", "paused"]).optional(),
    paymentId: z.string().optional(),
    branchId: z.string().optional(),
});

// ─────────────────────────────────────────────────
// Staff Schemas
// ─────────────────────────────────────────────────

export const CreateStaffSchema = z.object({
    fullName: z.string().min(1, "Full name is required").max(100),
    email: z.string().email("Invalid email format"),
    password: PasswordSchema,
    role: z.enum(["manager", "receptionist", "trainer", "accountant"]),
});

// ─────────────────────────────────────────────────
// Signup Schema
// ─────────────────────────────────────────────────

export const SignupSchema = z.object({
    fullName: z.string().min(1, "Full name is required").max(100),
    email: z.string().email("Invalid email format"),
    password: PasswordSchema,
    gymName: z.string().min(1, "Gym name is required").max(100),
    planName: z.string().optional(),
});

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
            $set[`${section}.${key}`] = value;
        }
    }
    return $set;
}
