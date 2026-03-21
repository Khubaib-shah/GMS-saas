
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Import Models to ensure they are registered
import Gym from "../models/Gym";
import User from "../models/User";
import Member from "../models/Member";
import Plan from "../models/Plan";
import Subscription from "../models/Subscription";
import TrainerAvailability from "../models/TrainerAvailability";
import TrainerSlot from "../models/TrainerSlot";
import TrainerBooking from "../models/TrainerBooking";
import Payment from "../models/Payment";
import Exercise from "../models/Exercise";
import WorkoutPlan from "../models/WorkoutPlan";
import AssignedWorkoutPlan from "../models/AssignedWorkoutPlan";
import WorkoutLog from "../models/WorkoutLog";
import Role from "../models/Role";
import GymSettings from "../models/GymSettings";
import PlatformSettings from "../models/PlatformSettings";
import PlatformPlan from "../models/PlatformPlan";
import SubscriptionPlan from "../models/SubscriptionPlan";
import Attendance from "../models/Attendance";
import AuditLog from "../models/AuditLog";
import PlatformPayment from "../models/PlatformPayment";
import TrainerSessionLog from "../models/TrainerSessionLog";
import WorkoutTemplate from "../models/WorkoutTemplate";

function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            console.log(`Loading environment from ${file}`);
            const content = fs.readFileSync(filePath, "utf8");
            const lines = content.split("\n");
            for (const line of lines) {
                if (!line || line.startsWith("#") || !line.includes("=")) continue;
                const [key, ...valueParts] = line.split("=");
                const value = valueParts.join("=").trim().replace(/^["'](.*)["']$/, "$1");
                if (key && value && !process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        }
    }
}

async function reset() {
    loadEnv();
    const MONGODB_URL = process.env.MONGODB_URL;
    if (!MONGODB_URL) {
        console.error("MONGODB_URL not found in environment variables");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("Connected Successfully.");

        console.log("--- Starting Selective Reset ---");

        // 1. Clear all business data collections completely
        const collectionsToClear = [
            Gym, Member, Plan, Subscription, TrainerAvailability,
            TrainerSlot, TrainerBooking, Payment, Exercise,
            WorkoutPlan, AssignedWorkoutPlan, WorkoutLog, Role,
            GymSettings, SubscriptionPlan, Attendance, AuditLog,
            PlatformPayment, TrainerSessionLog, WorkoutTemplate
        ];

        for (const model of collectionsToClear) {
            const result = await model.deleteMany({});
            console.log(`Cleared ${model.modelName}: deleted ${result.deletedCount} items.`);
        }

        // 2. Clear Users EXCEPT Super Admins
        const userResult = await User.deleteMany({ role: { $ne: "super_admin" } });
        console.log(`Cleared non-admin Users: deleted ${userResult.deletedCount} items.`);

        const remainingAdmins = await User.countDocuments({ role: "super_admin" });
        console.log(`Preserved ${remainingAdmins} Super Admin(s).`);

        // 3. Clear and Re-seed Platform/System Data
        console.log("Re-initializing Platform Data...");
        await PlatformSettings.deleteMany({});
        await PlatformPlan.deleteMany({});

        await PlatformSettings.create({});
        await PlatformPlan.create([
            {
                name: "Starter",
                slug: "starter",
                monthlyPricePKR: 3000,
                branchLimit: 1,
                maxStaffAccounts: 3,
                featureFlags: ["members", "manualAttendance", "payments"]
            },
            {
                name: "Professional",
                slug: "professional",
                monthlyPricePKR: 5000,
                branchLimit: 3,
                maxStaffAccounts: 10,
                featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics"]
            },
            {
                name: "Enterprise",
                slug: "enterprise",
                monthlyPricePKR: 8000,
                branchLimit: 10,
                maxStaffAccounts: 50,
                featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs"]
            }
        ]);
        console.log("Platform Settings and Plans re-seeded.");

        console.log("--- Reset Complete ---");

    } catch (error) {
        console.error("Reset Error:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

reset();
