/**
 * GMS SaaS Feature Flags
 * This file serves as the single source of truth for all restricted features
 * that can be toggled per subscription plan or per gym.
 */

export const SYSTEM_FEATURES = [
    { key: "members", label: "Members Registry" },
    { key: "subscriptions", label: "Billing & Subscriptions" },
    { key: "payments", label: "Payment History" },
    { key: "attendance", label: "Attendance Core" },
    { key: "manualAttendance", label: "Manual Attendance" },
    { key: "qrAttendance", label: "QR Access Control" },
    { key: "workoutPlanner", label: "Workout Planner" },
    { key: "dietModule", label: "Diet & Nutrition" },
    { key: "advancedReports", label: "Advanced Analytics" },
    { key: "trainersModule", label: "Trainers/Staff" },
    { key: "branches", label: "Multi-Branch Support" },
    { key: "memberPortal", label: "Customer Portal" },
    { key: "api_access", label: "External API" },
    // "multipleTrainers" was found in plans but is likely covered by maxTrainers or trainersModule.
    // Keeping it here if specific logic depends on it, but standardizing on trainersModule for UI.
    { key: "multipleTrainers", label: "Multiple Trainers" },
] as const;

export type FeatureKey = (typeof SYSTEM_FEATURES)[number]["key"];

/**
 * Helper to get label for a feature key
 */
export const FEATURE_LABELS: Record<string, string> = SYSTEM_FEATURES.reduce(
    (acc, f) => ({ ...acc, [f.key]: f.label }),
    {}
);

/**
 * Array of all feature keys
 */
export const FEATURE_KEYS = SYSTEM_FEATURES.map((f) => f.key);

/**
 * Default features for a new plan/gym
 */
export const DEFAULT_FEATURES: FeatureKey[] = [
    "members",
    "subscriptions",
    "payments",
    "attendance",
    "manualAttendance",
    "qrAttendance",
];
