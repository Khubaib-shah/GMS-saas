import mongoose from "mongoose";

/**
 * SubscriptionPlan - Per-gym subscription for monetization / feature-gating.
 * Determines which premium modules are enabled for a gym.
 */
const SubscriptionPlanSchema = new mongoose.Schema(
    {
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        tierName: {
            type: String,
            required: true,
            default: "Basic",
        },
        active: {
            type: Boolean,
            default: true,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        enabledFeatures: {
            type: [String],
            default: ["members", "subscriptions", "payments", "manualAttendance", "qrAttendance"],
        },
    },
    { timestamps: true }
);

SubscriptionPlanSchema.index({ gymId: 1, active: 1 });

SubscriptionPlanSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.SubscriptionPlan ||
    mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
