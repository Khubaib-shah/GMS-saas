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
        role: {
            type: String,
            enum: ["super_admin", "gym_owner", "staff"],
            default: "gym_owner",
        },
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            // Not required for super_admin
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
