import mongoose from "mongoose";

const LogExerciseSchema = new mongoose.Schema({
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
    setsCompleted: { type: Number, required: true },
    repsCompleted: { type: String, required: true },
    weightUsed: { type: Number },
    notes: { type: String }
});

const WorkoutLogSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "AssignedWorkoutPlan", required: true },

    date: { type: Date, default: Date.now, required: true },
    exercises: [LogExerciseSchema]
}, { timestamps: true });

// Indexing for analytics and tenant isolation
WorkoutLogSchema.index({ gymId: 1, memberId: 1, date: -1 });
WorkoutLogSchema.index({ gymId: 1, trainerId: 1, date: -1 });
WorkoutLogSchema.index({ planId: 1 });

export default mongoose.models.WorkoutLog || mongoose.model("WorkoutLog", WorkoutLogSchema);
