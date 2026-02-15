import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exercise from "@/models/Exercise";
import WorkoutPlan from "@/models/WorkoutPlan";
import Member from "@/models/Member";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // For security, only allow admin/owner to seed, or just open for now since it helps the user
        // simplified validtion

        // 1. Create Exercises if none exist for this gym (or globally if we want shared)
        // For now, we will create them for the first gym found or a specific gym if provided
        // We'll assume this is run by an admin for their gym

        const gymId = (session?.user as any)?.gymId;
        if (!gymId) {
            return NextResponse.json({ message: "Gym ID required" }, { status: 400 });
        }

        const exerciseCount = await Exercise.countDocuments({ gymId });
        let createdExercises = [];

        if (exerciseCount === 0) {
            const exercises = [
                {
                    name: "Barbell Bench Press",
                    description: "Lie on a flat bench and press the weight up.",
                    muscleGroup: "Chest",
                    equipment: "Barbell",
                    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RqbHl6eGZ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7Tjq1q4q4q4q4q4q/giphy.gif", // Placeholder
                    gymId
                },
                {
                    name: "Squats",
                    description: "Stand with feet shoulder-width apart and lower your hips.",
                    muscleGroup: "Legs",
                    equipment: "Barbell",
                    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RqbHl6eGZ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlO3JjJjJjJjJjJ/giphy.gif",
                    gymId
                },
                {
                    name: "Deadlifts",
                    description: "Lift the bar from the ground to hip level.",
                    muscleGroup: "Back",
                    equipment: "Barbell",
                    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RqbHl6eGZ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7Tjq1q4q4q4q4q4q/giphy.gif",
                    gymId
                },
                {
                    name: "Pull Ups",
                    description: "Pull your body up until your chin passes the bar.",
                    muscleGroup: "Back",
                    equipment: "Bodyweight",
                    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RqbHl6eGZ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7Tjq1q4q4q4q4q4q/giphy.gif",
                    gymId
                },
                {
                    name: "Dumbbell Shoulder Press",
                    description: "Press dumbbells overhead while seated or standing.",
                    muscleGroup: "Shoulders",
                    equipment: "Dumbbell",
                    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RqbHl6eGZ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eWJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7Tjq1q4q4q4q4q4q/giphy.gif",
                    gymId
                }
            ];
            createdExercises = await Exercise.insertMany(exercises);
        } else {
            createdExercises = await Exercise.find({ gymId });
        }

        // 2. Create Default Plan if none exists
        const planCount = await WorkoutPlan.countDocuments({ gymId });
        if (planCount === 0 && createdExercises.length > 0) {
            const plan = new WorkoutPlan({
                name: "Full Body Alpha Protocol",
                description: "A high-intensity full body routine for beginners.",
                gymId,
                schedule: [
                    {
                        day: "monday",
                        title: "Heavy Push Day",
                        exercises: [
                            { exerciseId: createdExercises[0]._id, sets: 4, reps: "8-10", restSeconds: 90, notes: "Focus on form" },
                            { exerciseId: createdExercises[4]._id, sets: 3, reps: "10-12", restSeconds: 60 }
                        ]
                    },
                    {
                        day: "tuesday",
                        title: "Leg Destruction",
                        exercises: [
                            { exerciseId: createdExercises[1]._id, sets: 5, reps: "5", restSeconds: 120, notes: "Go heavy" }
                        ]
                    },
                    {
                        day: "thursday",
                        title: "Pull & Back",
                        exercises: [
                            { exerciseId: createdExercises[2]._id, sets: 3, reps: "5", restSeconds: 120 },
                            { exerciseId: createdExercises[3]._id, sets: 3, reps: "Failure", restSeconds: 60 }
                        ]
                    }
                ]
            });
            await plan.save();

            // Auto-assign to members who don't have a plan
            await Member.updateMany(
                { gymId, workoutPlanId: { $exists: false } },
                { $set: { workoutPlanId: plan._id } }
            );
        }

        return NextResponse.json({ success: true, message: "Workouts seeded" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Seeding failed" }, { status: 500 });
    }
}
