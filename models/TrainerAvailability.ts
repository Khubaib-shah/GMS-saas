import mongoose from "mongoose";

const TrainerAvailabilitySchema = new mongoose.Schema(
    {
        trainerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6, // 0 = Sunday, 6 = Saturday
        },
        startTime: {
            type: String,
            required: true,
        }, // "HH:mm"
        endTime: {
            type: String,
            required: true,
        }, // "HH:mm"
        slotDurationMinutes: {
            type: Number,
            required: true,
            default: 60,
        },
        recurring: {
            type: Boolean,
            default: true,
        },
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

TrainerAvailabilitySchema.index({ trainerId: 1, dayOfWeek: 1 });

export default mongoose.models.TrainerAvailability ||
    mongoose.model("TrainerAvailability", TrainerAvailabilitySchema);
