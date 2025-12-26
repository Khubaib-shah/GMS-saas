import mongoose from "mongoose";

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
    },
    { timestamps: true }
);

export default mongoose.models.Gym || mongoose.model("Gym", GymSchema);
