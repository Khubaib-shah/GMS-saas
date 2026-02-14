import mongoose from "mongoose";

const TrainerBookingSchema = new mongoose.Schema(
    {
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TrainerSlot",
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
        bookingSource: {
            type: String,
            enum: ["admin", "staff", "member"],
            default: "staff",
        },
        status: {
            type: String,
            enum: ["booked", "completed", "cancelled", "no-show"],
            default: "booked",
        },
        notes: {
            type: String,
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

TrainerBookingSchema.index({ slotId: 1 });
TrainerBookingSchema.index({ memberId: 1, status: 1 });

export default mongoose.models.TrainerBooking ||
    mongoose.model("TrainerBooking", TrainerBookingSchema);
