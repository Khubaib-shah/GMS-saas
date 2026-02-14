import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Please provide your full name"],
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            select: false,
        },
        // Expanded role system - maintains backward compatibility
        role: {
            type: String,
            enum: [
                // Legacy roles (still supported)
                "super_admin",
                "gym_owner",
                "staff",
                // New granular roles
                "owner",
                "manager",
                "trainer",
                "receptionist",
                "accountant"
            ],
            default: "owner",
        },
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            // Not required for super_admin
        },
        // Multi-branch support - which branch this user belongs to
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            // Optional - if null, user has access to all branches
        },
        // Trainer Profile Fields
        bio: { type: String },
        specialties: { type: [String], default: [] },
        photo: { type: String }, // Base64 or URL
        certifications: { type: [String], default: [] },
        experienceYears: { type: Number, default: 0 },
        hourlyRate: { type: Number, default: 0 },
        maxMembersPerSlot: { type: Number, default: 1 },
        trainerStatus: {
            type: String,
            enum: ["active", "on_leave", "inactive"],
            default: "active"
        },
        // Custom permissions override (optional - if empty, use role defaults)
        customPermissions: {
            type: [String],
            default: [],
        },
        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        // Last login tracking
        lastLoginAt: {
            type: Date,
        },
        // Failed login attempts (for rate limiting)
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lastFailedLoginAt: {
            type: Date,
        },
        // Soft delete support
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
UserSchema.index({ gymId: 1, email: 1 });
UserSchema.index({ gymId: 1, branchId: 1 });
UserSchema.index({ gymId: 1, role: 1 });
UserSchema.index({ gymId: 1, deletedAt: 1 });
UserSchema.index({ gymId: 1, isActive: 1 });

// Virtual to check if user is deleted
UserSchema.virtual("isDeleted").get(function () {
    return this.deletedAt !== null;
});

UserSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
        delete ret.password;
    },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
