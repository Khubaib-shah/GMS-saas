import mongoose from "mongoose";

// Pause history sub-schema
const PauseHistorySchema = new mongoose.Schema(
    {
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        reason: { type: String },
        pausedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        resumedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { _id: true, timestamps: true }
);

const SubscriptionSchema = new mongoose.Schema(
    {
        memberId: { type: String, required: true },
        planId: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        originalEndDate: { type: String }, // Store original end date before any pauses
        status: { type: String, enum: ["active", "expired", "paused"], default: "active" },
        paymentId: { type: String },
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
        // Multi-branch support
        branchId: { type: mongoose.Schema.Types.ObjectId },
        // Pause/freeze support
        pauseHistory: { type: [PauseHistorySchema], default: [] },
        totalPausedDays: { type: Number, default: 0 },
        currentPauseStart: { type: Date }, // Set when paused, cleared when resumed
        // Soft delete
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Indexes
SubscriptionSchema.index({ gymId: 1, memberId: 1 });
SubscriptionSchema.index({ gymId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

SubscriptionSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.mongoId = doc._id.toString();
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);

