import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../lib/db";
import Exercise from "../models/Exercise";

async function checkExercises() {
    await connectDB();
    const exercises = await Exercise.find({}).sort({ createdAt: -1 }).limit(5);
    console.log("Recent Exercises:");
    exercises.forEach(ex => {
        console.log(`- Name: ${ex.name}`);
        console.log(`  SVG: ${ex.svgUrl}`);
        console.log(`  Video: ${ex.videoUrl}`);
        console.log(`  CreatedAt: ${ex.createdAt}`);
        console.log("---");
    });
    process.exit(0);
}

checkExercises();
