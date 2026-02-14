import mongoose from "mongoose";

const TrainerSessionLogSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TrainerBooking",
            required: true,
        },
        trainerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
        },
        exercises: [
            {
                name: String,
                sets: Number,
                reps: Number,
                weight: String,
                notes: String,
            },
        ],
        trainerNotes: {
            type: String,
        },
        nextPlan: {
            type: String,
        },
        injuryFlags: {
            type: Boolean,
            default: false,
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
    },
    { timestamps: true }
);

TrainerSessionLogSchema.index({ bookingId: 1 }, { unique: true });
TrainerSessionLogSchema.index({ memberId: 1 });

export default mongoose.models.TrainerSessionLog ||
    mongoose.model("TrainerSessionLog", TrainerSessionLogSchema);
