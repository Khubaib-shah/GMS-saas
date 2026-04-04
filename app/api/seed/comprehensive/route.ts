import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import bcrypt from "bcryptjs";
import fs from "fs";
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Plan from "@/models/Plan";
import Subscription from "@/models/Subscription";
import TrainerAvailability from "@/models/TrainerAvailability";
import TrainerSlot from "@/models/TrainerSlot";
import TrainerBooking from "@/models/TrainerBooking";
import TrainerSessionLog from "@/models/TrainerSessionLog";
import Payment from "@/models/Payment";
import Exercise from "@/models/Exercise";
import WorkoutPlan from "@/models/WorkoutPlan";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";
import WorkoutLog from "@/models/WorkoutLog";
import WorkoutTemplate from "@/models/WorkoutTemplate";
import Role from "@/models/Role";
import GymSettings from "@/models/GymSettings";
import PlatformSettings from "@/models/PlatformSettings";
import PlatformPlan from "@/models/PlatformPlan";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Attendance from "@/models/Attendance";
import AuditLog from "@/models/AuditLog";
import PlatformPayment from "@/models/PlatformPayment";
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions";

function getRandomDate(monthsBack = 5, monthsForward = 3): Date {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(now.getMonth() - monthsBack);
    const end = new Date(now);
    end.setMonth(now.getMonth() + monthsForward);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

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

const gymNames = ["Titan Core", "Nexus Fitness", "Iron Legacy", "Velox Studio", "Apex Gym"];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { secret } = body;

        if (secret !== (process.env.SEED_SECRET || "comprehensive-seed-2026")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        console.log("Cleaning database...");
        const models = [
            Gym, User, Member, Plan, Subscription, TrainerAvailability, TrainerSlot, 
            TrainerBooking, TrainerSessionLog, Payment, Exercise, WorkoutPlan, 
            AssignedWorkoutPlan, WorkoutLog, WorkoutTemplate, Role, GymSettings, 
            PlatformSettings, PlatformPlan, SubscriptionPlan, Attendance, AuditLog, PlatformPayment
        ];
        await Promise.all(models.map(m => m.deleteMany({})));

        await PlatformSettings.create({});
        await PlatformPlan.create([
            { name: "Starter", slug: "starter", monthlyPricePKR: 3000, branchLimit: 1, maxStaffAccounts: 3, featureFlags: ["members", "manualAttendance", "payments"] },
            { name: "Professional", slug: "professional", monthlyPricePKR: 5000, branchLimit: 3, maxStaffAccounts: 10, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics"] },
            { name: "Enterprise", slug: "enterprise", monthlyPricePKR: 8000, branchLimit: 10, maxStaffAccounts: 50, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs"] }
        ]);

        const globalCredentials = [];
        const defaultPassword = "password123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        for (let i = 0; i < gymNames.length; i++) {
            const gymName = gymNames[i];
            const gym = await Gym.create({
                name: gymName,
                address: `Karachi, Pakistan - Area ${i+1}`,
                phone: getRandomPhone(),
                isActive: true,
                branches: [{ name: "Main", address: `Karachi, Pakistan - Area ${i+1}`, phone: getRandomPhone(), email: `main@${gymName.toLowerCase().replace(/\s/g, "")}.com`, isDefault: true }]
            });

            await GymSettings.create({ gymId: gym._id, general: { name: gymName, address: gym.address } });
            await SubscriptionPlan.create({ gymId: gym._id, tierName: "Professional", active: true, enabledFeatures: ["members", "subscriptions", "payments", "attendance", "workout_plans"] });

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

            const gymCreds: any = { gymName, owner: null, trainers: [], members: [] };

            const owner = await User.create({ fullName: getRandomName().full, email: `owner@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "owner", roleId: rolesMap["owner"]._id, gymId: gym._id, isActive: true });
            gymCreds.owner = owner.email;

            const createdTrainers = await User.insertMany([
                { fullName: getRandomName().full, email: `trainer1@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "trainer", roleId: rolesMap["trainer"]._id, gymId: gym._id, isActive: true, specialties: ["Weight Training"], hourlyRate: 1500 },
                { fullName: getRandomName().full, email: `trainer2@${gymName.toLowerCase().replace(/\s/g, "")}.com`, password: hashedPassword, role: "trainer", roleId: rolesMap["trainer"]._id, gymId: gym._id, isActive: true, specialties: ["Yoga"], hourlyRate: 1500 }
            ]);

            const exercises = await Exercise.insertMany([
                { gymId: gym._id, name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", createdByTrainerId: createdTrainers[0]._id },
                { gymId: gym._id, name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", createdByTrainerId: createdTrainers[0]._id }
            ]);

            const template = await WorkoutTemplate.create({
                gymId: gym._id, createdByTrainerId: createdTrainers[0]._id, name: "Basic Strength", daysPerWeek: 2, days: [
                    { dayNumber: 1, title: "Day 1", exercises: [{ exerciseId: exercises[0]._id, sets: 3, reps: "10" }] },
                    { dayNumber: 2, title: "Day 2", exercises: [{ exerciseId: exercises[1]._id, sets: 3, reps: "10" }] }
                ]
            });

            const plans = await Plan.insertMany([
                { id: "monthly-30", gymId: gym._id, name: "Monthly", price: 3000, duration: 30 }
            ]);

            const createdMembers = await Member.insertMany([
                { firstName: "Ali", lastName: "Khan", email: `ali@${gymName.toLowerCase().replace(/\s/g, "")}.com`, phone: getRandomPhone(), gymId: gym._id, joinDate: getRandomDate().toISOString(), trainerId: createdTrainers[0]._id, planId: plans[0].id, status: "active" }
            ]);

            for (const member of createdMembers) {
                const subDate = getRandomDate();
                await Subscription.create({ 
                    memberId: member._id.toString(), planId: member.planId, 
                    startDate: subDate.toISOString(), endDate: new Date(subDate.getTime() + 30*24*60*60*1000).toISOString(), 
                    status: "active", gymId: gym._id 
                });
                await Payment.create({ memberId: member._id, amount: 3000, date: getRandomDate(), method: "cash", gymId: gym._id, collectedBy: owner._id });
                
                for (let a = 0; a < 5; a++) {
                    const attDate = getRandomDate();
                    await Attendance.create({ gymId: gym._id, memberId: member._id, date: attDate, checkInTime: attDate, status: "present" });
                }

                const assignedPlan = await AssignedWorkoutPlan.create({ gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, templateId: template._id, startDate: getRandomDate(), status: "active" });
                await WorkoutLog.create({ gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, planId: assignedPlan._id, date: getRandomDate(), exercises: [{ exerciseId: exercises[0]._id, setsCompleted: 3, repsCompleted: "10", weightUsed: 40 }] });
            }

            globalCredentials.push(gymCreds);
        }

        return NextResponse.json({ message: "Seeding complete", credentials: globalCredentials }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
    }
}
