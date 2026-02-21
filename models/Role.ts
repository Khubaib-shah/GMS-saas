import mongoose from "mongoose";

/**
 * Role - Database-backed role with string permission keys.
 * Replaces the hardcoded ROLE_PERMISSIONS map for per-gym customizability.
 * System roles (isSystemRole: true) are seeded automatically and cannot be deleted.
 */
const RoleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Role name is required"],
        },
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        permissions: {
            type: [String],
            default: [],
        },
        isSystemRole: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Unique role name per gym
RoleSchema.index({ gymId: 1, name: 1 }, { unique: true });

RoleSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Role || mongoose.model("Role", RoleSchema);
