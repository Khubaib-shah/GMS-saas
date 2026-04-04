
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Models
import Gym from "../models/Gym";
import User from "../models/User";
import Member from "../models/Member";
import Plan from "../models/Plan";
import Subscription from "../models/Subscription";
import TrainerAvailability from "../models/TrainerAvailability";
import TrainerSlot from "../models/TrainerSlot";
import TrainerBooking from "../models/TrainerBooking";
import TrainerSessionLog from "../models/TrainerSessionLog";
import Payment from "../models/Payment";
import Exercise from "../models/Exercise";
import WorkoutPlan from "../models/WorkoutPlan";
import AssignedWorkoutPlan from "../models/AssignedWorkoutPlan";
import WorkoutLog from "../models/WorkoutLog";
import WorkoutTemplate from "../models/WorkoutTemplate";
import Role from "../models/Role";
import GymSettings from "../models/GymSettings";
import PlatformSettings from "../models/PlatformSettings";
import PlatformPlan from "../models/PlatformPlan";
import SubscriptionPlan from "../models/SubscriptionPlan";
import Attendance from "../models/Attendance";
import AuditLog from "../models/AuditLog";
import PlatformPayment from "../models/PlatformPayment";

// Permissions
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "../lib/permissions";

// Load environment variables
function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            console.log(`Loading environment from ${file}`);
            const content = fs.readFileSync(filePath, "utf8");
            for (const line of content.split("\n")) {
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

loadEnv();

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.error("MONGODB_URL not found");
    process.exit(1);
}

// Date Utility: Random date from past 5 months to next 3 months
function getRandomDate(monthsBack = 5, monthsForward = 3): Date {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(now.getMonth() - monthsBack);
    const end = new Date(now);
    end.setMonth(now.getMonth() + monthsForward);
    
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helpers
const hashPassword = async (pwd: string) => await bcrypt.hash(pwd, 10);

const pakistanFirstNames = ["Ahmed", "Ali", "Bilal", "Danish", "Fahad", "Hamza", "Hassan", "Imran", "Junaid", "Kamran", "Mohammad", "Noman", "Omar", "Qasim", "Rizwan", "Saad", "Taimoor", "Usman", "Waqas", "Zain", "Fatima", "Ayesha", "Zainab", "Maryam", "Sana", "Hira", "Sadia", "Kiran", "Nida", "Amna"];
const pakistanLastNames = ["Khan", "Ahmed", "Ali", "Hussain", "Shah", "Malik", "Raja", "Butt", "Sheikh", "Chaudhry", "Ansari", "Qureshi", "Siddiqui", "Baig", "Mirza"];

const getRandomName = () => {
    const first = pakistanFirstNames[Math.floor(Math.random() * pakistanFirstNames.length)];
    const last = pakistanLastNames[Math.floor(Math.random() * pakistanLastNames.length)];
    return { first, last, full: `${first} ${last}` };
};

const getRandomPhone = () => {
    const prefixes = ["0300", "0301", "0302", "0312", "0313", "0321", "0322", "0333", "0334", "0345", "0346"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefix}-${number}`;
};

const gymNames = ["Power Genesis", "Skyline Fitness", "Metal Temple", "Oceanic Gym", "Desert Storm Fitness"];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL!);
        console.log("Connected");

        console.log("Cleaning database...");
        const models = [
            Gym, User, Member, Plan, Subscription, TrainerAvailability, TrainerSlot, 
            TrainerBooking, TrainerSessionLog, Payment, Exercise, WorkoutPlan, 
            AssignedWorkoutPlan, WorkoutLog, WorkoutTemplate, Role, GymSettings, 
            PlatformSettings, PlatformPlan, SubscriptionPlan, Attendance, AuditLog, PlatformPayment
        ];
        await Promise.all(models.map(m => m.deleteMany({})));
        console.log("Database cleaned");

        // 1. Platform Settings & Plans
        console.log("Seeding Platform...");
        const platformSettings = await PlatformSettings.create({});
        const pPlans = await PlatformPlan.create([
            { name: "Starter", slug: "starter", monthlyPricePKR: 3000, branchLimit: 1, maxStaffAccounts: 3, featureFlags: ["members", "manualAttendance", "payments"] },
            { name: "Professional", slug: "professional", monthlyPricePKR: 5000, branchLimit: 3, maxStaffAccounts: 10, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics"] },
            { name: "Enterprise", slug: "enterprise", monthlyPricePKR: 8000, branchLimit: 10, maxStaffAccounts: 50, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs"] }
        ]);

        const globalCredentials = [];
        const defaultPassword = "password123";
        const hashedPassword = await hashPassword(defaultPassword);

        // 2. Gyms (Looping for Variety)
        for (let i = 0; i < gymNames.length; i++) {
            const gymName = gymNames[i];
            console.log(`Processing Gym: ${gymName}`);

            const gym = await Gym.create({
                name: gymName,
                address: `Karachi, Pakistan - Area ${i+1}`,
                phone: getRandomPhone(),
                isActive: true,
                branches: [{ name: "Main", address: `Karachi, Pakistan - Area ${i+1}`, phone: getRandomPhone(), email: `main@${gymName.toLowerCase().replace(/\s/g, "")}.com`, isDefault: true }]
            });

            await GymSettings.create({ gymId: gym._id, general: { name: gymName, address: gym.address } });
            await SubscriptionPlan.create({ gymId: gym._id, tierName: "Professional", active: true, enabledFeatures: ["members", "subscriptions", "payments", "attendance", "workout_plans"] });

            // 3. Roles
            const rolesMap: Record<string, any> = {};
            const rolesToCreate = [
                { name: "owner", permissions: ALL_PERMISSIONS },
                { name: "manager", permissions: ROLE_PERMISSIONS.manager },
                { name: "trainer", permissions: ROLE_PERMISSIONS.trainer },
                { name: "receptionist", permissions: ROLE_PERMISSIONS.receptionist }
            ];
            for (const r of rolesToCreate) {
                rolesMap[r.name] = await Role.create({ gymId: gym._id, name: r.name, permissions: r.permissions, isSystemRole: true });
            }

            const gymCreds: any = { gymName, owner: null, manager: null, trainers: [], members: [] };

            // 4. Users
            const owner = await User.create({ fullName: getRandomName().full, email: `owner@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "owner", roleId: rolesMap["owner"]._id, gymId: gym._id, isActive: true });
            gymCreds.owner = { email: owner.email, password: defaultPassword };

            const manager = await User.create({ fullName: getRandomName().full, email: `manager@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "manager", roleId: rolesMap["manager"]._id, gymId: gym._id, isActive: true });
            gymCreds.manager = { email: manager.email, password: defaultPassword };

            const trainerDocs = [];
            for (let t = 0; t < 2; t++) {
                const tName = getRandomName();
                trainerDocs.push({ fullName: tName.full, email: `trainer${t+1}@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "trainer", roleId: rolesMap["trainer"]._id, gymId: gym._id, isActive: true, specialties: ["Weight Training", "Yoga"], hourlyRate: 1500 });
            }
            const createdTrainers = await User.insertMany(trainerDocs);
            createdTrainers.forEach(t => gymCreds.trainers.push({ email: t.email, password: defaultPassword }));

            // 5. Exercises & Workout Templates
            const exercises = await Exercise.insertMany([
                { gymId: gym._id, name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", createdByTrainerId: createdTrainers[0]._id },
                { gymId: gym._id, name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", createdByTrainerId: createdTrainers[0]._id },
                { gymId: gym._id, name: "Squat", muscleGroup: "Legs", equipment: "Barbell", createdByTrainerId: createdTrainers[0]._id }
            ]);

            const template = await WorkoutTemplate.create({
                gymId: gym._id, createdByTrainerId: createdTrainers[0]._id, name: "Standard Strength", daysPerWeek: 3, days: [
                    { dayNumber: 1, title: "Push", exercises: [{ exerciseId: exercises[0]._id, sets: 4, reps: "10" }] },
                    { dayNumber: 2, title: "Legs", exercises: [{ exerciseId: exercises[2]._id, sets: 4, reps: "10" }] },
                    { dayNumber: 3, title: "Pull", exercises: [{ exerciseId: exercises[1]._id, sets: 4, reps: "10" }] }
                ]
            });

            // 6. Plans
            const plans = await Plan.insertMany([
                { id: "basic-30", gymId: gym._id, name: "Basic", price: 2500, duration: 30 },
                { id: "pro-90", gymId: gym._id, name: "Pro", price: 6000, duration: 90 }
            ]);

            // 7. Members
            const mDocs = [];
            for (let m = 0; m < 5; m++) {
                const mName = getRandomName();
                mDocs.push({
                    firstName: mName.first, lastName: mName.last, email: `member${m+1}@${gymName.toLowerCase().replace(/\s/g, "")}.com`,
                    phone: getRandomPhone(), gymId: gym._id, joinDate: getRandomDate().toISOString(), trainerId: createdTrainers[m % 2]._id, planId: plans[m % 2].id, status: "active"
                });
            }
            const createdMembers = await Member.insertMany(mDocs);

            // 8. Subscriptions, Payments, Attendance
            for (const member of createdMembers) {
                const subDate = getRandomDate();
                const expiryDate = new Date(subDate);
                expiryDate.setMonth(expiryDate.getMonth() + 1);

                await Subscription.create({ 
                    memberId: member._id.toString(), planId: member.planId, 
                    startDate: subDate.toISOString(), endDate: expiryDate.toISOString(), 
                    status: "active", gymId: gym._id 
                });
                
                await Payment.create({ 
                    memberId: member._id, amount: 2500, date: getRandomDate(), method: "cash", gymId: gym._id, collectedBy: manager._id 
                });

                // Multiple Attendance records
                for (let a = 0; a < 10; a++) {
                    const attDate = getRandomDate();
                    await Attendance.create({ gymId: gym._id, memberId: member._id, date: attDate, checkInTime: attDate, status: "present" });
                }

                // Assigned Workout Plan
                const assignedPlan = await AssignedWorkoutPlan.create({
                    gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, templateId: template._id,
                    startDate: getRandomDate(), status: "active"
                });

                // Workout Log
                await WorkoutLog.create({
                    gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, planId: assignedPlan._id,
                    date: getRandomDate(), exercises: [{ exerciseId: exercises[0]._id, setsCompleted: 4, repsCompleted: "10", weightUsed: 50 }]
                });

                gymCreds.members.push({ email: member.email, password: defaultPassword });
            }

            // 9. Trainer Availability, Slots, Bookings, Sessions
            for (const trainer of createdTrainers) {
                const avail = await TrainerAvailability.create({ trainerId: trainer._id, dayOfWeek: 1, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60, gymId: gym._id });
                
                const slotDate = getRandomDate(0, 3); // More future slots
                const slot = await TrainerSlot.create({ 
                    trainerId: trainer._id, availabilityId: avail._id, date: slotDate, startTime: "10:00", endTime: "11:00", capacity: 1, gymId: gym._id, status: "available" 
                });

                const booking = await TrainerBooking.create({
                    gymId: gym._id, memberId: createdMembers[0]._id, trainerId: trainer._id, slotId: slot._id, startTime: slot.startTime, endTime: slot.endTime, bookingDate: slot.date, status: "confirmed"
                });

                await TrainerSessionLog.create({
                    bookingId: booking._id, trainerId: trainer._id, memberId: createdMembers[0]._id, gymId: gym._id, trainerNotes: "Great progress!"
                });
            }

            // 10. Platform Payment (Gym to Platform)
            await PlatformPayment.create({
                gymId: gym._id, amountPKR: 5000, paymentDate: getRandomDate(), expiryDate: getRandomDate(0, 1), enteredBy: owner._id, planName: "Professional"
            });

            // 11. Audit Logs
            for (let l = 0; l < 5; l++) {
                await AuditLog.create({
                    gymId: gym._id, userId: owner._id, userName: owner.fullName, action: "update", resource: "gym_settings", details: { changes: "updated gym name" }, ipAddress: "127.0.0.1"
                });
            }

            globalCredentials.push(gymCreds);
        }

        fs.writeFileSync("seed_credentials_comprehensive.json", JSON.stringify(globalCredentials, null, 2));
        console.log("Seeding complete. Credentials saved to 'seed_credentials_comprehensive.json'");

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
