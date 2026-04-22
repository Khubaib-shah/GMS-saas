import mongoose from "mongoose";

/**
 * PlatformPlan — Platform-level subscription plans managed by Super Admin.
 * These control what features each gym client can access, their branch limits,
 * and pricing in PKR (manual billing).
 */
const PlatformPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: "" },
        monthlyPricePKR: { type: Number, required: true },
        yearlyPricePKR: { type: Number, default: null },
        branchLimit: { type: Number, default: 1 },
        maxStaffAccounts: { type: Number, default: 5 },
        maxTrainers: { type: Number, default: 2 },
        trialDays: { type: Number, default: 14 },
        featureFlags: {
            type: [String],
            default: [
                "members",
                "subscriptions",
                "payments",
                "attendance",
                "trainers",
                "workoutPlans",
                "auditLogs",
            ],
        },
        isActive: { type: Boolean, default: true },
        isPopular: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

PlatformPlanSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
    },
});

export default mongoose.models.PlatformPlan ||
    mongoose.model("PlatformPlan", PlatformPlanSchema);
