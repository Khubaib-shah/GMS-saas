import mongoose from "mongoose";

const AssignedWorkoutPlanSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date },

    status: {
        type: String,
        enum: ["active", "paused", "completed"],
        default: "active",
        required: true
    }
}, { timestamps: true });

// Ensure only one active plan per member within a gym
AssignedWorkoutPlanSchema.index({ gymId: 1, memberId: 1, status: 1 });
AssignedWorkoutPlanSchema.index({ trainerId: 1, status: 1 });

export default mongoose.models.AssignedWorkoutPlan || mongoose.model("AssignedWorkoutPlan", AssignedWorkoutPlanSchema);
