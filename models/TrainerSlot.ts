import mongoose from "mongoose";

const TrainerSlotSchema = new mongoose.Schema(
    {
        trainerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        availabilityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TrainerAvailability",
        },
        date: {
            type: Date,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        }, // "HH:mm"
        endTime: {
            type: String,
            required: true,
        }, // "HH:mm"
        capacity: {
            type: Number,
            required: true,
            default: 1,
        },
        bookedCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["available", "full", "cancelled", "blocked"],
            default: "available",
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

TrainerSlotSchema.index({ trainerId: 1, date: 1, startTime: 1 });
TrainerSlotSchema.index({ gymId: 1, date: 1 });

export default mongoose.models.TrainerSlot ||
    mongoose.model("TrainerSlot", TrainerSlotSchema);
