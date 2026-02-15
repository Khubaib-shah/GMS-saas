import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    muscleGroup: { type: String, required: true }, // Chest, Back, Legs, Shoulders, Arms, Core, Cardio
    equipment: { type: String }, // Barbell, Dumbbell, Machine, Bodyweight
    gifUrl: { type: String, required: true }, // URL to visual aid
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
});

export default mongoose.models.Exercise || mongoose.model("Exercise", ExerciseSchema);
