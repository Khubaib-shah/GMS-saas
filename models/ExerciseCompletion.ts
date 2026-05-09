import mongoose from "mongoose";

/**
 * ExerciseCompletion — Per-exercise, per-set completion tracking.
 * Stores individual set timings for anti-cheat and trainer reporting.
 * Each member can complete each exercise max 2 times per day.
 */

const SetLogSchema = new mongoose.Schema({
    setNumber: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    reps: { type: String },
    weight: { type: Number },
}, { _id: false });

const ExerciseCompletionSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "AssignedWorkoutPlan", required: true },

    date: { type: String, required: true },       // "2026-05-10" — date-only string for easy dedup
    attemptNumber: { type: Number, required: true, min: 1, max: 2 },

    sets: [SetLogSchema],
    totalSets: { type: Number, required: true },
    totalDuration: { type: Number, default: 0 },   // Sum of all set durations in seconds

    status: {
        type: String,
        enum: ["in_progress", "completed", "abandoned"],
        default: "in_progress"
    },
    completedAt: { type: Date },

    // Anti-cheat flag
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
}, { timestamps: true });

// Compound unique: one attempt per exercise per day per member
ExerciseCompletionSchema.index(
    { gymId: 1, memberId: 1, exerciseId: 1, date: 1, attemptNumber: 1 },
    { unique: true }
);
// Fast lookups for today's completions
ExerciseCompletionSchema.index({ gymId: 1, memberId: 1, date: 1 });
// Trainer reports
ExerciseCompletionSchema.index({ gymId: 1, memberId: 1, createdAt: -1 });

export default mongoose.models.ExerciseCompletion ||
    mongoose.model("ExerciseCompletion", ExerciseCompletionSchema);
