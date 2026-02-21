import mongoose from "mongoose";

/**
 * PlatformSettings - Global system configuration (singleton document).
 * Only super_admin can read/write. Controls feature flags, pricing tiers, and maintenance mode.
 */
const PricingTierSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        allowedFeatures: { type: [String], default: [] },
    },
    { _id: true }
);

const PlatformSettingsSchema = new mongoose.Schema(
    {
        maintenanceMode: { type: Boolean, default: false },
        defaultTrialDays: { type: Number, default: 14 },
        featureFlags: {
            trainersModule: { type: Boolean, default: true },
            dietModule: { type: Boolean, default: false },
            advancedReports: { type: Boolean, default: false },
        },
        pricingTiers: {
            type: [PricingTierSchema],
            default: [
                {
                    name: "Basic",
                    price: 0,
                    allowedFeatures: ["members", "subscriptions", "payments", "attendance"],
                },
                {
                    name: "Pro",
                    price: 29,
                    allowedFeatures: [
                        "members", "subscriptions", "payments", "attendance",
                        "trainersModule", "advancedReports",
                    ],
                },
                {
                    name: "Enterprise",
                    price: 99,
                    allowedFeatures: [
                        "members", "subscriptions", "payments", "attendance",
                        "trainersModule", "advancedReports", "dietModule",
                        "branches", "api_access",
                    ],
                },
            ],
        },
    },
    { timestamps: true }
);

PlatformSettingsSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.PlatformSettings ||
    mongoose.model("PlatformSettings", PlatformSettingsSchema);
