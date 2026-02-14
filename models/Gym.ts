import mongoose from "mongoose";

// Branch sub-schema for multi-branch support
const BranchSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        address: { type: String },
        phone: { type: String },
        email: { type: String },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false }, // The main/primary branch
    },
    { _id: true, timestamps: true }
);

const GymSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a gym name"],
        },
        address: {
            type: String,
        },
        phone: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        // Multi-branch support - optional, empty array means single-branch gym
        branches: {
            type: [BranchSchema],
            default: [],
        },
        // Settings for the gym
        settings: {
            allowMultipleBranches: { type: Boolean, default: false },
            defaultBranchId: { type: mongoose.Schema.Types.ObjectId },
            attendanceRules: {
                preventDuplicateCheckin: { type: Boolean, default: true },
                dailyLimit: { type: Number, default: 1 }, // Max check-ins per day
                allowLateCheckout: { type: Boolean, default: true },
            },
            sessionTimeoutMinutes: { type: Number, default: 60 },
        },
    },
    { timestamps: true }
);

// Helper method to get the default branch or first branch
GymSchema.methods.getDefaultBranch = function () {
    if (this.branches.length === 0) return null;
    const defaultBranch = this.branches.find((b: any) => b.isDefault);
    return defaultBranch || this.branches[0];
};

GymSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Gym || mongoose.model("Gym", GymSchema);
