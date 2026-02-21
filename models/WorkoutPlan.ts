import mongoose from "mongoose";

const WorkoutDaySchema = new mongoose.Schema({
    day: { type: String, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], required: true },
    title: { type: String, required: true }, // e.g., "Leg Day"
    exercises: [{
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
        sets: { type: Number, required: true },
        reps: { type: String, required: true }, // "8-12", "Failure", "Time"
        restSeconds: { type: Number, default: 60 },
        notes: { type: String }
    }]
});

const WorkoutPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    schedule: [WorkoutDaySchema], // Array of days covered
    active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.WorkoutPlan || mongoose.model("WorkoutPlan", WorkoutPlanSchema);
