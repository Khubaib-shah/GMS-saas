import mongoose from "mongoose";

const TemplateExerciseSchema = new mongoose.Schema({
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    restSeconds: { type: Number, default: 60 },
    notes: { type: String }
});

const WorkoutDaySchema = new mongoose.Schema({
    dayNumber: { type: Number, required: true }, // 1-7
    title: { type: String, required: true },
    exercises: [TemplateExerciseSchema]
});

const WorkoutTemplateSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    createdByTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    goal: { type: String },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    days: [WorkoutDaySchema],
    isPublicWithinGym: { type: Boolean, default: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

// Validating days list matches daysPerWeek
WorkoutTemplateSchema.pre('save', function (next) {
    if (this.days.length > this.daysPerWeek) {
        return next(new Error('Number of days in template exceeds daysPerWeek limitation.'));
    }
    next();
});

// Indexing
WorkoutTemplateSchema.index({ gymId: 1, createdByTrainerId: 1 });
WorkoutTemplateSchema.index({ gymId: 1, isPublicWithinGym: 1 });

export default mongoose.models.WorkoutTemplate || mongoose.model("WorkoutTemplate", WorkoutTemplateSchema);
