
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Main Models
import Gym from "@/models/Gym";
import User from "@/models/User";
import Member from "@/models/Member";
import Plan from "@/models/Plan";
import Subscription from "@/models/Subscription";
import TrainerAvailability from "@/models/TrainerAvailability";
import TrainerSlot from "@/models/TrainerSlot";
import TrainerBooking from "@/models/TrainerBooking";
import Payment from "@/models/Payment";
import Exercise from "@/models/Exercise";
import WorkoutPlan from "@/models/WorkoutPlan";
import AssignedWorkoutPlan from "@/models/AssignedWorkoutPlan";
import WorkoutLog from "@/models/WorkoutLog";

// New Models
import Role from "@/models/Role";
import GymSettings from "@/models/GymSettings";
import PlatformSettings from "@/models/PlatformSettings";
import PlatformPlan from "@/models/PlatformPlan";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Attendance from "@/models/Attendance";
import AuditLog from "@/models/AuditLog";

// Permissions
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions";

// Load environment variables
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

loadEnv();

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.error("MONGODB_URL not found in environment variables");
    process.exit(1);
}

// Helpers
const hashPassword = async (password: string) => await bcrypt.hash(password, 10);

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

const gymNames = [
    "Iron Forge Gym", "Titan Fitness", "Muscle Mechanics", "The Powerhouse", "Spartan Gym",
    "Velocity Fitness", "Apex Performance", "Core Strength Studio", "Legacy Gym", "Olympus Gym"
];

const addresses = [
    "Block A, North Nazimabad, Karachi", "DHA Phase 6, Lahore", "F-10 Markaz, Islamabad",
    "Gulshan-e-Iqbal, Karachi", "Johar Town, Lahore", "Blue Area, Islamabad",
    "Saddar, Rawalpindi", "University Road, Peshawar", "Satellite Town, Quetta", "Model Town, Lahore"
];

const specialties = [
    "Weight Training", "Cardio Fitness", "Yoga & Pilates", "CrossFit",
    "Bodybuilding", "Nutrition Coaching", "Rehabilitation", "HIIT",
    "Functional Training", "Sports Conditioning"
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL!);
        console.log("Connected to MongoDB");

        console.log("Cleaning database...");
        await Promise.all([
            Gym.deleteMany({}),
            User.deleteMany({}),
            Member.deleteMany({}),
            Plan.deleteMany({}),
            Subscription.deleteMany({}),
            TrainerAvailability.deleteMany({}),
            TrainerSlot.deleteMany({}),
            TrainerBooking.deleteMany({}),
            Payment.deleteMany({}),
            Exercise.deleteMany({}),
            WorkoutPlan.deleteMany({}),
            AssignedWorkoutPlan.deleteMany({}),
            WorkoutLog.deleteMany({}),
            Role.deleteMany({}),
            GymSettings.deleteMany({}),
            PlatformSettings.deleteMany({}),
            PlatformPlan.deleteMany({}),
            SubscriptionPlan.deleteMany({}),
            Attendance.deleteMany({}),
            AuditLog.deleteMany({})
        ]);
        console.log("Database cleaned");

        // Seed Platform Settings
        console.log("Seeding Platform Settings...");
        await PlatformSettings.create({});

        // Seed Platform Plans
        await PlatformPlan.create([
            { name: "Starter", slug: "starter", monthlyPricePKR: 5000, branchLimit: 1, maxStaffAccounts: 3 },
            { name: "Professional", slug: "professional", monthlyPricePKR: 15000, branchLimit: 3, maxStaffAccounts: 10 },
            { name: "Enterprise", slug: "enterprise", monthlyPricePKR: 50000, branchLimit: 10, maxStaffAccounts: 50 }
        ]);

        const globalCredentials: any[] = [];

        // Pre-hash password once to speed up
        const defaultPassword = "password123";
        const defaultPin = "1234";
        const hashedPassword = await hashPassword(defaultPassword);
        const hashedPin = await hashPassword(defaultPin);

        for (let i = 0; i < 3; i++) { // Seeding 3 gyms for variety
            const gymName = gymNames[i];
            console.log(`Processing Gym ${i + 1}/3: ${gymName}`);

            const gymEmail = `contact@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`;

            const gym = await Gym.create({
                name: gymName,
                address: addresses[i],
                phone: getRandomPhone(),
                isActive: true,
                branches: [{ name: "Main", address: addresses[i], phone: getRandomPhone(), email: gymEmail, isDefault: true }]
            });

            // Seed Gym Settings
            await GymSettings.create({
                gymId: gym._id,
                general: { name: gymName, address: addresses[i] }
            });

            // Seed Subscription Plan for the Gym (SaaS Tier)
            await SubscriptionPlan.create({
                gymId: gym._id,
                tierName: "Professional",
                active: true,
                enabledFeatures: ["members", "subscriptions", "payments", "attendance", "workout_plans"]
            });

            // Seed Roles for this Gym
            console.log(`  Seeding Roles for ${gymName}...`);
            const rolesMap: Record<string, any> = {};
            
            const rolesToCreate = [
                { name: "owner", permissions: ALL_PERMISSIONS, description: "Full access" },
                { name: "manager", permissions: ROLE_PERMISSIONS.manager, description: "Management access" },
                { name: "trainer", permissions: ROLE_PERMISSIONS.trainer, description: "Staff access" },
                { name: "receptionist", permissions: ROLE_PERMISSIONS.receptionist, description: "Front desk access" }
            ];

            for (const r of rolesToCreate) {
                const roleDoc = await Role.create({
                    gymId: gym._id,
                    name: r.name,
                    permissions: r.permissions,
                    isSystemRole: true,
                    description: r.description
                });
                rolesMap[r.name] = roleDoc;
            }

            const gymCreds: any = {
                gymName,
                owner: null,
                manager: null,
                receptionist: null,
                trainers: [],
                members: []
            };

            // Gym Owner
            const ownerName = getRandomName();
            const owner = await User.create({
                fullName: ownerName.full,
                email: `owner@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
                password: hashedPassword,
                role: "owner",
                roleId: rolesMap["owner"]._id,
                gymId: gym._id,
                isActive: true
            });
            gymCreds.owner = { email: owner.email, password: defaultPassword };

            // Manager & Receptionist
            const managerName = getRandomName();
            const receptName = getRandomName();

            const [manager, receptionist] = await Promise.all([
                User.create({
                    fullName: managerName.full,
                    email: `manager@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
                    password: hashedPassword,
                    role: "manager",
                    roleId: rolesMap["manager"]._id,
                    gymId: gym._id,
                    isActive: true
                }),
                User.create({
                    fullName: receptName.full,
                    email: `reception@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
                    password: hashedPassword,
                    role: "receptionist",
                    roleId: rolesMap["receptionist"]._id,
                    gymId: gym._id,
                    isActive: true
                })
            ]);

            gymCreds.manager = { email: manager.email, password: defaultPassword };
            gymCreds.receptionist = { email: receptionist.email, password: defaultPassword };

            // Trainers
            const trainers: any[] = [];
            const trainerDocs = [];
            for (let t = 0; t < 2; t++) {
                const tName = getRandomName();
                const email = `${tName.first.toLowerCase()}.${gymName.substring(0, 3).toLowerCase().replace(/[^a-z]/g, "")}${t + 1}@gms.com`;
                const trainSpecs = [specialties[Math.floor(Math.random() * specialties.length)], specialties[Math.floor(Math.random() * specialties.length)]];

                trainerDocs.push({
                    fullName: tName.full,
                    email,
                    password: hashedPassword,
                    role: "trainer",
                    roleId: rolesMap["trainer"]._id,
                    gymId: gym._id,
                    isActive: true,
                    bio: "Expert Trainer assisting members with personalized workout plans.",
                    specialties: trainSpecs,
                    hourlyRate: 2000,
                    trainerStatus: "active"
                });
            }
            const createdTrainers = await User.insertMany(trainerDocs);

            // Exercise Seeding
            const commonExercises = [
                { name: "Bench Press", group: "Chest", equip: "Barbell" },
                { name: "Deadlift", group: "Back", equip: "Barbell" },
                { name: "Squats", group: "Legs", equip: "Barbell" },
                { name: "Plank", group: "Core", equip: "Bodyweight" },
                { name: "Treadmill Run", group: "Cardio", equip: "Machine" }
            ];

            const exercisesToInsert = commonExercises.map(ex => ({
                gymId: gym._id,
                name: ex.name,
                muscleGroup: ex.group,
                equipment: ex.equip,
                difficulty: "Intermediate",
                createdByTrainerId: createdTrainers[0]._id,
                isPublicWithinGym: true
            }));
            const createdExercises = await Exercise.insertMany(exercisesToInsert);

            // Workout Templates
            const templatesData = [
                {
                    name: "Full Body Foundation",
                    description: "Balanced full body workout.",
                    schedule: [
                        {
                            day: "monday",
                            title: "Power Day",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 4, reps: "8-10", restSeconds: 90 },
                                { exerciseId: createdExercises[1]._id, sets: 4, reps: "8-10", restSeconds: 120 }
                            ]
                        }
                    ]
                }
            ];

            const createdTemplates = await WorkoutPlan.insertMany(templatesData.map(t => ({
                ...t,
                gymId: gym._id,
                trainerId: createdTrainers[0]._id,
                active: true
            })));

            // Trainer Schedules
            const slotsToInsert: any[] = [];
            for (const trainer of createdTrainers) {
                gymCreds.trainers.push({ name: trainer.fullName, email: trainer.email, password: defaultPassword });
                trainers.push(trainer);

                const availability = await TrainerAvailability.create({
                    trainerId: trainer._id,
                    dayOfWeek: 1, // Monday
                    startTime: "09:00",
                    endTime: "18:00",
                    slotDurationMinutes: 60,
                    gymId: gym._id
                });

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                for (let d = 0; d < 7; d++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + d);
                    if (date.getDay() === 1) {
                        for (let h = 9; h < 12; h++) {
                            slotsToInsert.push({
                                trainerId: trainer._id,
                                availabilityId: availability._id,
                                date: new Date(date),
                                startTime: `${h.toString().padStart(2, '0')}:00`,
                                endTime: `${(h + 1).toString().padStart(2, '0')}:00`,
                                capacity: 1,
                                gymId: gym._id,
                                status: "available"
                            });
                        }
                    }
                }
            }
            const allCreatedSlots = await TrainerSlot.insertMany(slotsToInsert);

            // Plans
            const plansToInsert = [
                { id: "silver-30", gymId: gym._id, name: "Silver Plan", price: 3000, duration: 30, description: "Basic access" },
                { id: "gold-60", gymId: gym._id, name: "Gold Plan", price: 5000, duration: 60, description: "Premium access" }
            ];
            const createdPlans = await Plan.insertMany(plansToInsert);

            // Members
            const memberCount = 10; // Further reduced for faster seeding
            const membersData = [];
            for (let m = 0; m < memberCount; m++) {
                const mName = getRandomName();
                const plan = createdPlans[m % createdPlans.length];
                const trainer = trainers[m % trainers.length];
                const joinDate = new Date();
                joinDate.setDate(joinDate.getDate() - (m % 30));

                membersData.push({
                    firstName: mName.first,
                    lastName: mName.last,
                    email: `${mName.first.toLowerCase()}.${mName.last.toLowerCase()}${Math.floor(Math.random() * 9999)}@gmail.com`,
                    phone: getRandomPhone(),
                    gymId: gym._id,
                    joinDate: joinDate.toISOString(),
                    trainerId: trainer._id,
                    planId: plan.id,
                    portalPassword: hashedPassword,
                    portalPin: hashedPin,
                    portalEnabled: true,
                    status: "active"
                });
            }
            const createdMembers = await Member.insertMany(membersData);

            // Subscriptions, Payments, Attendance & Bookings
            const subscriptionsData = [];
            const paymentsToInsert = [];
            const attendanceToInsert = [];

            for (const member of createdMembers) {
                const plan = createdPlans.find(p => p.id === member.planId);
                const startDate = new Date(member.joinDate);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + (plan?.duration || 30));

                subscriptionsData.push({
                    memberId: member._id,
                    planId: member.planId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    status: "active",
                    gymId: gym._id
                });

                paymentsToInsert.push({
                    memberId: member._id,
                    amount: plan?.price || 3000,
                    date: new Date().toISOString(),
                    method: "cash",
                    description: `Payment for ${plan?.name}`,
                    gymId: gym._id,
                    collectedBy: receptionist._id
                });

                // Attendance
                for (let a = 0; a < 2; a++) {
                    const attDate = new Date();
                    attDate.setDate(attDate.getDate() - a);
                    attendanceToInsert.push({
                        gymId: gym._id,
                        memberId: member._id,
                        date: attDate,
                        checkInTime: new Date(attDate.setHours(9, 0, 0, 0)),
                        status: "present"
                    });
                }

                gymCreds.members.push({
                    name: `${member.firstName} ${member.lastName}`,
                    email: member.email,
                    password: defaultPassword
                });
            }

            await Subscription.insertMany(subscriptionsData);
            await Payment.insertMany(paymentsToInsert);
            await Attendance.insertMany(attendanceToInsert);

            globalCredentials.push(gymCreds);
        }

        // Final output
        fs.writeFileSync("seed_credentials.json", JSON.stringify(globalCredentials, null, 2));
        console.log("\n SEEDING COMPLETE! Credentials saved to 'seed_credentials.json'.");

    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
