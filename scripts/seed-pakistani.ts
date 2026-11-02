import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
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
import Product from "../models/Product";
import ProductCategory from "../models/ProductCategory";
import ProductBrand from "../models/ProductBrand";
import InventoryLog from "../models/InventoryLog";
import Order from "../models/Order";
import Notification from "../models/Notification";
import ApiKey from "../models/ApiKey";
import Asset from "../models/Asset";
import AssetFolder from "../models/AssetFolder";
import ExerciseCompletion from "../models/ExerciseCompletion";

// Permissions
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "../lib/permissions";

// Load environment variables
function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
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

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;
if (!MONGODB_URL) {
    console.error("MONGODB_URL not found in environment variables");
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers & Name Lists
// ─────────────────────────────────────────────────────────────────────────────
const hashPassword = async (pwd: string) => await bcrypt.hash(pwd, 10);

const pakistanFemaleFirstNames = [
    "Fatima", "Ayesha", "Zainab", "Maryam", "Sana", "Hira", "Sadia", "Kiran", "Nida", "Amna",
    "Bakhtawar", "Bushra", "Dur-e-Fishan", "Eshal", "Fiza", "Ghazala", "Humaira", "Iffat", "Javerya", "Komal",
    "Laila", "Mahnoor", "Nadia", "Pareeshay", "Quratulain", "Rabia", "Saba", "Tayyaba", "Urooj", "Vaneeza",
    "Warda", "Yumna", "Zoya", "Anum", "Bisma", "Dua", "Eman", "Farah", "Gia", "Hania",
    "Alizeh", "Mehak", "Laiba", "Zunaira", "Momina", "Natasha", "Ayeza", "Kinza", "Sidra", "Samina"
];

const pakistanMaleFirstNames = [
    "Ahmed", "Ali", "Bilal", "Danish", "Fahad", "Hamza", "Hassan", "Imran", "Junaid", "Kamran",
    "Mohammad", "Noman", "Omar", "Qasim", "Rizwan", "Saad", "Taimoor", "Usman", "Waqas", "Zain",
    "Arsalan", "Babar", "Faisal", "Ghayur", "Haris", "Irfan", "Jawad", "Kashif", "Luqman", "Mansoor",
    "Nasir", "Owais", "Pervaiz", "Raheel", "Sajid", "Tahir", "Umer", "Vikas", "Waseem", "Zubair",
    "Khubaib", "Shahzaib", "Zeeshan", "Mubashir", "Adeel", "Asad", "Basit", "Daniyal", "Ehsan", "Farhan"
];

const pakistanLastNames = [
    "Khan", "Ahmed", "Ali", "Hussain", "Shah", "Malik", "Raja", "Butt", "Sheikh", "Chaudhry",
    "Ansari", "Qureshi", "Siddiqui", "Baig", "Mirza", "Abbasi", "Awan", "Lodhi", "Mughal", "Pasha",
    "Zaid", "Farooqi", "Javed", "Saeed", "Iqbal", "Hashmi", "Naqvi", "Kazmi", "Gillani", "Tirmizi",
    "Rehman", "Tariq", "Mustafa", "Akram", "Bhatti"
];

const getRandomPhone = () => {
    const prefixes = ["0300", "0301", "0302", "0303", "0312", "0313", "0314", "0321", "0322", "0333", "0334", "0335", "0345", "0346", "0347"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefix}-${number}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log("==========================================================");
        console.log("  GymFlow SaaS - 6-Month Chronological Database Seeding   ");
        console.log("==========================================================");
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL!);
        console.log("✅ Database connection established.");

        // 1. PURGE ALL EXISTING DATA
        console.log("\nPurging all existing data across 34 models...");
        const modelsToClean = [
            Gym, User, Member, Plan, Subscription, TrainerAvailability, TrainerSlot,
            TrainerBooking, TrainerSessionLog, Payment, Exercise, WorkoutPlan,
            AssignedWorkoutPlan, WorkoutLog, WorkoutTemplate, Role, GymSettings,
            PlatformSettings, PlatformPlan, SubscriptionPlan, Attendance, AuditLog,
            PlatformPayment, Product, ProductCategory, ProductBrand, InventoryLog,
            Order, Notification, ApiKey, Asset, AssetFolder, ExerciseCompletion
        ];
        await Promise.all((modelsToClean as any[]).map(m => m.deleteMany({})));
        console.log("✅ All collections cleaned.");

        const defaultPassword = "password123";
        const defaultPin = "1234";
        const hashedPassword = await hashPassword(defaultPassword);
        const hashedPin = await hashPassword(defaultPin);

        // 2. PLATFORM SETTINGS & PLANS
        console.log("\nSeeding Platform Settings and Plans...");
        await PlatformSettings.create({});

        const pPlans = await PlatformPlan.create([
            {
                name: "Starter",
                slug: "starter",
                monthlyPricePKR: 3500,
                branchLimit: 1,
                maxStaffAccounts: 3,
                maxTrainers: 2,
                featureFlags: ["members", "manualAttendance", "payments"]
            },
            {
                name: "Professional",
                slug: "professional",
                monthlyPricePKR: 6500,
                branchLimit: 3,
                maxStaffAccounts: 10,
                maxTrainers: 5,
                featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "selling"]
            },
            {
                name: "Enterprise",
                slug: "enterprise",
                monthlyPricePKR: 12000,
                branchLimit: 10,
                maxStaffAccounts: 50,
                maxTrainers: 20,
                isPopular: true,
                featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs", "selling", "inventory", "pos"]
            }
        ]);
        console.log(`✅ Seeded ${pPlans.length} Platform Plans.`);

        // 3. SUPER ADMIN USER
        console.log("\nSeeding Super Admin...");
        const superAdmin = await User.create({
            fullName: "Platform Super Admin",
            email: "admin@gms.com",
            password: hashedPassword,
            role: "super_admin",
            isActive: true
        });
        console.log(`✅ Super Admin created: admin@gms.com / ${defaultPassword}`);

        // Current simulated date reference: late September 2026
        const NOW = new Date("2026-09-22T08:00:00.000Z");
        const SIX_MONTHS_AGO = new Date("2026-03-22T08:00:00.000Z");

        // ─────────────────────────────────────────────────────────────────────────
        // GYM CONFIGURATIONS (With Ladies Health Care as Gym 1)
        // ─────────────────────────────────────────────────────────────────────────
        const gymConfigs = [
            {
                isFemaleOnly: true,
                name: "Ladies Health Care",
                slug: "ladieshealthcare",
                tagline: "Premier Women's Fitness, Wellness & Rehabilitation Center",
                city: "Lahore",
                address: "Plot 42-C, Commercial Zone, DHA Phase 5, Lahore, Pakistan",
                phone: "042-35789012",
                planIdx: 2, // Enterprise
                staff: {
                    owner: { name: "Dr. Fatima Tariq", email: "owner@ladieshealthcare.pk" },
                    manager: { name: "Ayesha Khan", email: "manager@ladieshealthcare.pk" },
                    receptionist: { name: "Zainab Malik", email: "receptionist@ladieshealthcare.pk" },
                    trainers: [
                        { name: "Maryam Siddiqui", email: "trainer.maryam@ladieshealthcare.pk", spec: ["HIIT", "Pilates", "Postnatal Fitness"], rate: 2500 },
                        { name: "Sana Mir", email: "trainer.sana@ladieshealthcare.pk", spec: ["Yoga & Mobility", "Core Conditioning"], rate: 2200 },
                        { name: "Hira Ahmed", email: "trainer.hira@ladieshealthcare.pk", spec: ["Strength & Tone", "Nutrition Coaching"], rate: 2400 }
                    ]
                }
            },
            {
                isFemaleOnly: false,
                name: "The Iron Forge Karachi",
                slug: "ironforgekarachi",
                tagline: "Karachi's Hardcore Strength and Performance Gym",
                city: "Karachi",
                address: "Street 7, Khayaban-e-Shamsheer, DHA Phase 5, Karachi, Pakistan",
                phone: "021-35841234",
                planIdx: 2, // Enterprise
                staff: {
                    owner: { name: "Shahzaib Khan", email: "owner@ironforge.pk" },
                    manager: { name: "Bilal Hussain", email: "manager@ironforge.pk" },
                    receptionist: { name: "Haris Qureshi", email: "receptionist@ironforge.pk" },
                    trainers: [
                        { name: "Usman Raza", email: "trainer.usman@ironforge.pk", spec: ["Powerlifting", "Bodybuilding"], rate: 2000 },
                        { name: "Zain Tariq", email: "trainer.zain@ironforge.pk", spec: ["Weight Training", "HIIT"], rate: 1800 },
                        { name: "Hamza Abbasi", email: "trainer.hamza@ironforge.pk", spec: ["Sports Conditioning", "Functional Training"], rate: 2200 }
                    ]
                }
            },
            {
                isFemaleOnly: false,
                name: "Islamabad Elite Club",
                slug: "islamabadelite",
                tagline: "Exclusive Wellness & Fitness Studio in the Capital",
                city: "Islamabad",
                address: "Plot 14, Markaz F-10, Islamabad, Pakistan",
                phone: "051-2210456",
                planIdx: 1, // Professional
                staff: {
                    owner: { name: "Mohammad Fahad", email: "owner@islamabadelite.pk" },
                    manager: { name: "Omer Farooq", email: "manager@islamabadelite.pk" },
                    receptionist: { name: "Danish Ali", email: "receptionist@islamabadelite.pk" },
                    trainers: [
                        { name: "Arsalan Baig", email: "trainer.arsalan@islamabadelite.pk", spec: ["Functional Fitness", "Cardio Conditioning"], rate: 2500 },
                        { name: "Kashif Mirza", email: "trainer.kashif@islamabadelite.pk", spec: ["Rehabilitation", "Weight Training"], rate: 2000 },
                        { name: "Jawad Sheikh", email: "trainer.jawad@islamabadelite.pk", spec: ["CrossFit", "Athletic Prep"], rate: 2200 }
                    ]
                }
            },
            {
                isFemaleOnly: false,
                name: "Titan Strength Rawalpindi",
                slug: "titanrawalpindi",
                tagline: "Rawalpindi's Leading Bodybuilding & Hypertrophy Facility",
                city: "Rawalpindi",
                address: "Civic Center, Bahria Town Phase 7, Rawalpindi, Pakistan",
                phone: "051-5401987",
                planIdx: 1, // Professional
                staff: {
                    owner: { name: "Rizwan Ahmed", email: "owner@titanstrength.pk" },
                    manager: { name: "Saad Malik", email: "manager@titanstrength.pk" },
                    receptionist: { name: "Waqas Chaudhry", email: "receptionist@titanstrength.pk" },
                    trainers: [
                        { name: "Taimoor Shah", email: "trainer.taimoor@titanstrength.pk", spec: ["Bodybuilding", "Nutrition Coaching"], rate: 1700 },
                        { name: "Noman Ansari", email: "trainer.noman@titanstrength.pk", spec: ["Strength & Hypertrophy"], rate: 1600 },
                        { name: "Nasir Lodhi", email: "trainer.nasir@titanstrength.pk", spec: ["Weight Training", "HIIT"], rate: 1800 }
                    ]
                }
            },
            {
                isFemaleOnly: false,
                name: "Faisalabad Muscle Mania",
                slug: "faisalabadmuscle",
                tagline: "High Performance Fitness for Industrial Titans",
                city: "Faisalabad",
                address: "Jaranwala Road, People's Colony No. 1, Faisalabad, Pakistan",
                phone: "041-8723456",
                planIdx: 0, // Starter
                staff: {
                    owner: { name: "Kamran Siddiqui", email: "owner@musclemania.pk" },
                    manager: { name: "Faisal Mehmood", email: "manager@musclemania.pk" },
                    receptionist: { name: "Luqman Butt", email: "receptionist@musclemania.pk" },
                    trainers: [
                        { name: "Babar Awan", email: "trainer.babar@musclemania.pk", spec: ["Strength Conditioning", "Powerlifting"], rate: 1500 },
                        { name: "Irfan Pasha", email: "trainer.irfan@musclemania.pk", spec: ["Weight Training", "Fat Loss"], rate: 1400 },
                        { name: "Sajid Tirmizi", email: "trainer.sajid@musclemania.pk", spec: ["Calisthenics", "Functional"], rate: 1500 }
                    ]
                }
            },
            {
                isFemaleOnly: false,
                name: "Hayatabad Warriors Gym",
                slug: "hayatabadwarriors",
                tagline: "Combat, Conditioning, and Iron Power",
                city: "Peshawar",
                address: "Phase 3 Chowk, Hayatabad, Peshawar, Pakistan",
                phone: "091-5820987",
                planIdx: 1, // Professional
                staff: {
                    owner: { name: "Asadullah Khan", email: "owner@hayatabadwarriors.pk" },
                    manager: { name: "Daniyal Gillani", email: "manager@hayatabadwarriors.pk" },
                    receptionist: { name: "Raheel Farooqi", email: "receptionist@hayatabadwarriors.pk" },
                    trainers: [
                        { name: "Ehsan Afridi", email: "trainer.ehsan@hayatabadwarriors.pk", spec: ["MMA Conditioning", "Strength"], rate: 1800 },
                        { name: "Farhan Bangash", email: "trainer.farhan@hayatabadwarriors.pk", spec: ["Boxing & HIIT", "Functional"], rate: 1700 },
                        { name: "Junaid Shinwari", email: "trainer.junaid@hayatabadwarriors.pk", spec: ["Bodybuilding", "Cardio"], rate: 1600 }
                    ]
                }
            }
        ];

        const credentialsExport: any = {
            featuredGym: null,
            superAdmin: { email: superAdmin.email, password: defaultPassword, role: "super_admin" },
            gyms: []
        };

        // ─────────────────────────────────────────────────────────────────────────
        // ITERATE GYMS
        // ─────────────────────────────────────────────────────────────────────────
        for (let gIdx = 0; gIdx < gymConfigs.length; gIdx++) {
            const cfg = gymConfigs[gIdx];
            const platformPlan = pPlans[cfg.planIdx];
            console.log(`\n-----------------------------------------------------------`);
            console.log(`[${gIdx + 1}/${gymConfigs.length}] Seeding Gym: ${cfg.name} (${cfg.city})`);
            console.log(`-----------------------------------------------------------`);

            // 1. Create Gym Document (Est. 6 months ago)
            const gymCreatedAt = new Date(SIX_MONTHS_AGO.getTime() + (gIdx * 7 * 24 * 60 * 60 * 1000));
            const gymExpiry = new Date(NOW.getTime() + (180 * 24 * 60 * 60 * 1000)); // 6 months in future

            const gym = await Gym.create({
                name: cfg.name,
                address: cfg.address,
                city: cfg.city,
                phone: cfg.phone,
                isActive: true,
                platformPlanId: platformPlan._id,
                subscriptionStatus: "active",
                expiryDate: gymExpiry,
                createdAt: gymCreatedAt,
                updatedAt: NOW,
                branches: [{
                    name: "Main Branch",
                    address: cfg.address,
                    phone: cfg.phone,
                    email: `contact@${cfg.slug}.pk`,
                    isDefault: true,
                    isActive: true,
                    createdAt: gymCreatedAt
                }],
                settings: {
                    allowMultipleBranches: platformPlan.branchLimit > 1,
                    attendanceRules: {
                        preventDuplicateCheckin: true,
                        dailyLimit: 2,
                        allowLateCheckout: true
                    },
                    sessionTimeoutMinutes: 90
                }
            });

            // 2. GymSettings
            await GymSettings.create({
                gymId: gym._id,
                business: { joiningFee: 1000, autoExpireDays: 0, gracePeriodDays: 3 },
                notifications: { sendExpiryReminder: true, sendInvoiceEmail: true, sendSMS: true },
                modules: { trainersEnabled: true, attendanceEnabled: true, sellingEnabled: true }
            });

            // 3. SubscriptionPlan (Tenant monetization tier)
            await SubscriptionPlan.create({
                gymId: gym._id,
                tierName: platformPlan.name,
                active: true,
                expiresAt: gymExpiry,
                enabledFeatures: platformPlan.featureFlags
            });

            // 4. Platform Payments (Gym -> SaaS Platform for the past 6 months)
            console.log("  • Seeding 6 months of platform payment history...");
            for (let m = 5; m >= 0; m--) {
                const payDate = new Date(NOW);
                payDate.setMonth(NOW.getMonth() - m);
                payDate.setDate(1);
                payDate.setHours(10, 0, 0, 0);

                const expDate = new Date(payDate);
                expDate.setMonth(expDate.getMonth() + 1);

                await PlatformPayment.create({
                    gymId: gym._id,
                    planId: platformPlan._id,
                    planName: platformPlan.name,
                    amountPKR: platformPlan.monthlyPricePKR,
                    paymentMethod: m % 2 === 0 ? "bank_transfer" : "cash",
                    paymentDate: payDate,
                    expiryDate: expDate,
                    notes: `Monthly platform subscription - ${payDate.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
                    enteredBy: superAdmin._id,
                    createdAt: payDate
                });
            }

            // 5. System Roles
            console.log("  • Seeding Roles...");
            const rolesMap: Record<string, any> = {};
            const rolesToCreate = [
                { name: "owner", permissions: ALL_PERMISSIONS, desc: "Full ownership access" },
                { name: "manager", permissions: ROLE_PERMISSIONS.manager, desc: "Full branch management and staff oversight" },
                { name: "trainer", permissions: ROLE_PERMISSIONS.trainer, desc: "Client workouts, progress tracking, and schedule" },
                { name: "receptionist", permissions: ROLE_PERMISSIONS.receptionist, desc: "Front desk, member registrations, and billing" }
            ];
            for (const r of rolesToCreate) {
                rolesMap[r.name] = await Role.create({
                    gymId: gym._id,
                    name: r.name,
                    permissions: r.permissions,
                    isSystemRole: true,
                    description: `${r.desc} at ${cfg.name}`
                });
            }

            // 6. Staff Users (Owner, Manager, Receptionist, 3 Trainers)
            console.log("  • Seeding Staff accounts...");
            const owner = await User.create({
                fullName: cfg.staff.owner.name,
                email: cfg.staff.owner.email,
                password: hashedPassword,
                role: "owner",
                roleId: rolesMap["owner"]._id,
                gymId: gym._id,
                isActive: true,
                createdAt: gymCreatedAt
            });

            const manager = await User.create({
                fullName: cfg.staff.manager.name,
                email: cfg.staff.manager.email,
                password: hashedPassword,
                role: "manager",
                roleId: rolesMap["manager"]._id,
                gymId: gym._id,
                isActive: true,
                createdAt: gymCreatedAt
            });

            const receptionist = await User.create({
                fullName: cfg.staff.receptionist.name,
                email: cfg.staff.receptionist.email,
                password: hashedPassword,
                role: "receptionist",
                roleId: rolesMap["receptionist"]._id,
                gymId: gym._id,
                isActive: true,
                createdAt: gymCreatedAt
            });

            const trainerDocs = [];
            for (const tr of cfg.staff.trainers) {
                trainerDocs.push({
                    fullName: tr.name,
                    email: tr.email,
                    password: hashedPassword,
                    role: "trainer",
                    roleId: rolesMap["trainer"]._id,
                    gymId: gym._id,
                    isActive: true,
                    bio: `Certified Fitness Trainer specializing in ${tr.spec.join(", ")}. Dedicated to progressive client results.`,
                    specialties: tr.spec,
                    hourlyRate: tr.rate,
                    trainerStatus: "active",
                    createdAt: gymCreatedAt
                });
            }
            const createdTrainers = await User.insertMany(trainerDocs);

            // Record Credentials
            const gymCredRecord: any = {
                gymName: cfg.name,
                city: cfg.city,
                address: cfg.address,
                phone: cfg.phone,
                owner: { name: owner.fullName, email: owner.email, password: defaultPassword },
                manager: { name: manager.fullName, email: manager.email, password: defaultPassword },
                receptionist: { name: receptionist.fullName, email: receptionist.email, password: defaultPassword },
                trainers: createdTrainers.map(t => ({ name: t.fullName, email: t.email, password: defaultPassword, specialties: t.specialties })),
                sampleMembers: []
            };

            if (cfg.isFemaleOnly) {
                credentialsExport.featuredGym = gymCredRecord;
            } else {
                credentialsExport.gyms.push(gymCredRecord);
            }

            // 7. Exercises (Gym Specific)
            console.log("  • Seeding Exercise Library...");
            const exerciseDefinitions = cfg.isFemaleOnly ? [
                { name: "Barbell Hip Thrust", muscleGroup: "Legs", equipment: "Barbell", difficulty: "Intermediate", desc: "Premier posterior chain movement for glute development." },
                { name: "Goblet Squats", muscleGroup: "Legs", equipment: "Dumbbells", difficulty: "Beginner", desc: "Full-depth squat focusing on core stability and quad strength." },
                { name: "Cable Glute Kickbacks", muscleGroup: "Legs", equipment: "Machine", difficulty: "Beginner", desc: "Targeted glute isolation using ankle strap attachment." },
                { name: "Lat Pulldown (Wide Grip)", muscleGroup: "Back", equipment: "Machine", difficulty: "Beginner", desc: "Builds upper back and improves posture." },
                { name: "Dumbbell Overhead Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbells", difficulty: "Intermediate", desc: "Tones shoulders and upper chest." },
                { name: "Plank to Push-Up", muscleGroup: "Core", equipment: "Bodyweight", difficulty: "Intermediate", desc: "Dynamic core endurance and upper body stability." },
                { name: "Dumbbell Romanian Deadlift", muscleGroup: "Legs", equipment: "Dumbbells", difficulty: "Intermediate", desc: "Hamstring and lower back strengthening." },
                { name: "Incline Treadmill Strides", muscleGroup: "Cardio", equipment: "Machine", difficulty: "Beginner", desc: "High incline fat burning cardio conditioning." }
            ] : [
                { name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", difficulty: "Intermediate", desc: "Compound horizontal pressing for chest and triceps." },
                { name: "Conventional Deadlift", muscleGroup: "Back", equipment: "Barbell", difficulty: "Advanced", desc: "Total body strength and spinal erectors power." },
                { name: "High Bar Back Squat", muscleGroup: "Legs", equipment: "Barbell", difficulty: "Intermediate", desc: "Fundamental quad and glute strength builder." },
                { name: "Standing Military Press", muscleGroup: "Shoulders", equipment: "Barbell", difficulty: "Intermediate", desc: "Strict overhead pressing for deltoid mass." },
                { name: "Close Grip Cable Row", muscleGroup: "Back", equipment: "Machine", difficulty: "Beginner", desc: "Mid-back thickness and lats engagement." },
                { name: "Incline Dumbbell Bicep Curl", muscleGroup: "Arms", equipment: "Dumbbells", difficulty: "Beginner", desc: "Long-head bicep isolation on 60 degree bench." },
                { name: "Hanging Leg Raises", muscleGroup: "Core", equipment: "Bodyweight", difficulty: "Intermediate", desc: "Lower abdominal strengthening and hip flexor control." },
                { name: "Assault Bike Intervals", muscleGroup: "Cardio", equipment: "Machine", difficulty: "Advanced", desc: "Tabata style high-intensity anaerobic conditioning." }
            ];

            const createdExercises = await Exercise.insertMany(
                exerciseDefinitions.map(e => ({
                    gymId: gym._id,
                    name: e.name,
                    description: e.desc,
                    muscleGroup: e.muscleGroup,
                    equipment: e.equipment,
                    difficulty: e.difficulty,
                    createdByTrainerId: createdTrainers[0]._id,
                    tips: [],
                    isPublicWithinGym: true
                })) as any
            );

            // 8. Workout Plans & Templates
            console.log("  • Seeding Workout Plans...");
            const workoutPlanData = cfg.isFemaleOnly ? [
                {
                    name: "Women's Glute & Tone Split",
                    desc: "Specialized 3-day split focused on posterior chain, posture, and core tightening.",
                    trainer: createdTrainers[0],
                    schedule: [
                        {
                            day: "monday", title: "Glutes & Hamstrings",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 4, reps: "10-12", restSeconds: 75, notes: "Pause 2 sec at peak contraction" },
                                { exerciseId: createdExercises[6]._id, sets: 3, reps: "12", restSeconds: 60, notes: "Focus on hip hinge stretch" }
                            ]
                        },
                        {
                            day: "wednesday", title: "Upper Body & Posture",
                            exercises: [
                                { exerciseId: createdExercises[3]._id, sets: 4, reps: "12-15", restSeconds: 60, notes: "Drive with elbows" },
                                { exerciseId: createdExercises[4]._id, sets: 3, reps: "10-12", restSeconds: 60, notes: "Control the eccentric descent" }
                            ]
                        },
                        {
                            day: "friday", title: "Core, Tone & Conditioning",
                            exercises: [
                                { exerciseId: createdExercises[1]._id, sets: 3, reps: "15", restSeconds: 45, notes: "Chest up and slow tempo" },
                                { exerciseId: createdExercises[5]._id, sets: 3, reps: "10 per side", restSeconds: 45, notes: "Maintain neutral pelvis" }
                            ]
                        }
                    ]
                },
                {
                    name: "Pilates, Mobility & Flow",
                    desc: "Low impact flexibility, pelvic floor health, and muscular endurance.",
                    trainer: createdTrainers[1],
                    schedule: [
                        {
                            day: "tuesday", title: "Full Body Mobility",
                            exercises: [
                                { exerciseId: createdExercises[5]._id, sets: 3, reps: "12", restSeconds: 45, notes: "Breath in cadence" },
                                { exerciseId: createdExercises[2]._id, sets: 3, reps: "15", restSeconds: 45, notes: "Keep tension constant" }
                            ]
                        },
                        {
                            day: "thursday", title: "Cardio Sculpt",
                            exercises: [
                                { exerciseId: createdExercises[7]._id, sets: 4, reps: "5 mins", restSeconds: 60, notes: "12% incline, steady brisk pace" },
                                { exerciseId: createdExercises[1]._id, sets: 3, reps: "15", restSeconds: 45, notes: "Controlled depth" }
                            ]
                        }
                    ]
                }
            ] : [
                {
                    name: "Pakistani Power Split",
                    desc: "Classic Heavy-Duty strength routine for building raw power and lean muscle mass.",
                    trainer: createdTrainers[0],
                    schedule: [
                        {
                            day: "monday", title: "Push (Chest, Shoulders, Triceps)",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 4, reps: "8-10", restSeconds: 90, notes: "Touch sternum and press explosively" },
                                { exerciseId: createdExercises[3]._id, sets: 3, reps: "10-12", restSeconds: 60, notes: "Strict form, no leg drive" }
                            ]
                        },
                        {
                            day: "wednesday", title: "Pull (Back & Biceps)",
                            exercises: [
                                { exerciseId: createdExercises[1]._id, sets: 3, reps: "5", restSeconds: 150, notes: "Engage lats and drive heels through floor" },
                                { exerciseId: createdExercises[4]._id, sets: 4, reps: "10-12", restSeconds: 60, notes: "Squeeze shoulder blades together" },
                                { exerciseId: createdExercises[5]._id, sets: 3, reps: "12-15", restSeconds: 45, notes: "Slow 3-second negative" }
                            ]
                        },
                        {
                            day: "friday", title: "Legs & Core",
                            exercises: [
                                { exerciseId: createdExercises[2]._id, sets: 4, reps: "8-10", restSeconds: 120, notes: "Break parallel cleanly" },
                                { exerciseId: createdExercises[6]._id, sets: 3, reps: "15", restSeconds: 60, notes: "Control swing, flex abs" }
                            ]
                        }
                    ]
                },
                {
                    name: "Hypertrophy & Conditioning",
                    desc: "Body composition enhancement with moderate weights and aerobic capacity.",
                    trainer: createdTrainers[1],
                    schedule: [
                        {
                            day: "tuesday", title: "Upper Body Hypertrophy",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 3, reps: "12", restSeconds: 60, notes: "Moderate load, maximum pump" },
                                { exerciseId: createdExercises[4]._id, sets: 3, reps: "12", restSeconds: 60, notes: "Full range of motion" }
                            ]
                        },
                        {
                            day: "thursday", title: "Metabolic HIIT",
                            exercises: [
                                { exerciseId: createdExercises[7]._id, sets: 5, reps: "30s sprint", restSeconds: 60, notes: "All-out sprint effort" },
                                { exerciseId: createdExercises[6]._id, sets: 3, reps: "12", restSeconds: 45, notes: "Abs burn" }
                            ]
                        }
                    ]
                }
            ];

            const createdWorkoutPlans: any[] = [];
            for (const wp of workoutPlanData) {
                const planDoc = await WorkoutPlan.create({
                    name: wp.name,
                    description: wp.desc,
                    gymId: gym._id,
                    trainerId: wp.trainer._id,
                    schedule: wp.schedule,
                    active: true
                });
                createdWorkoutPlans.push(planDoc);

                // Also create WorkoutTemplate for template library view
                await WorkoutTemplate.create({
                    gymId: gym._id,
                    createdByTrainerId: wp.trainer._id,
                    name: wp.name,
                    goal: wp.desc,
                    daysPerWeek: wp.schedule.length,
                    days: wp.schedule.map((s, idx) => ({
                        dayNumber: idx + 1,
                        title: s.title,
                        exercises: s.exercises.map(e => ({
                            exerciseId: e.exerciseId,
                            sets: e.sets,
                            reps: e.reps,
                            restSeconds: e.restSeconds
                        }))
                    }))
                });
            }

            // 9. Membership Plans
            console.log("  • Seeding Membership Plans...");
            const plans = await Plan.insertMany([
                { id: "basic-monthly", gymId: gym._id, name: "Basic Monthly", price: cfg.isFemaleOnly ? 4000 : 3500, duration: 30, description: "Full gym facility access" },
                { id: "standard-quarterly", gymId: gym._id, name: "Standard Quarterly", price: cfg.isFemaleOnly ? 10500 : 9000, duration: 90, description: "3 Months commitment with savings" },
                { id: "vip-halfyearly", gymId: gym._id, name: "VIP Half-Yearly", price: cfg.isFemaleOnly ? 19000 : 16000, duration: 180, description: "6 Months access with locker included" },
                { id: "elite-yearly", gymId: gym._id, name: "Elite Yearly", price: cfg.isFemaleOnly ? 34000 : 28000, duration: 365, description: "All-inclusive annual membership" },
                { id: "student-monthly", gymId: gym._id, name: "Student Monthly", price: cfg.isFemaleOnly ? 2800 : 2500, duration: 30, description: "Discounted student rate with valid ID" }
            ] as any);

            // 10. Members (50 for Ladies Health Care, 45 for others)
            const targetMemberCount = cfg.isFemaleOnly ? 50 : 45;
            console.log(`  • Seeding ${targetMemberCount} Members with chronological history...`);

            const memberDocs = [];
            const femaleList = [...pakistanFemaleFirstNames];
            const maleList = [...pakistanMaleFirstNames];

            for (let m = 0; m < targetMemberCount; m++) {
                let first: string;
                let gender: "female" | "male";

                if (cfg.isFemaleOnly) {
                    first = femaleList[m % femaleList.length];
                    gender = "female";
                } else {
                    gender = Math.random() > 0.4 ? "male" : "female";
                    first = gender === "female"
                        ? femaleList[m % femaleList.length]
                        : maleList[m % maleList.length];
                }
                const last = pakistanLastNames[m % pakistanLastNames.length];
                const fullName = `${first} ${last}`;
                const email = `${first.toLowerCase()}.${last.toLowerCase()}.${cfg.slug}.${m + 1}@gmail.com`;

                // Stagger join dates over the 6-month simulation (0 to 175 days ago)
                const daysAgo = Math.floor(Math.random() * 175);
                const joinDate = new Date(NOW.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

                const plan = plans[m % plans.length];
                const trainer = createdTrainers[m % createdTrainers.length];
                const workoutPlan = createdWorkoutPlans[m % createdWorkoutPlans.length];

                memberDocs.push({
                    firstName: first,
                    lastName: last,
                    email: email,
                    phone: getRandomPhone(),
                    gender: gender,
                    gymId: gym._id,
                    joinDate: joinDate.toISOString(),
                    trainerId: trainer._id,
                    workoutPlanId: workoutPlan._id,
                    planId: plan.id,
                    status: "active",
                    portalPassword: hashedPassword,
                    portalPin: hashedPin,
                    portalEnabled: true,
                    qrCode: `QR-${cfg.slug.toUpperCase().slice(0, 3)}-${1000 + m}`,
                    attendanceStreak: Math.floor(Math.random() * 5),
                    totalCheckIns: 0,
                    lastCheckIn: null as any
                });
            }

            const createdMembers = await Member.insertMany(memberDocs);

            // Record a few sample member credentials
            for (let sm = 0; sm < Math.min(5, createdMembers.length); sm++) {
                const mem = createdMembers[sm];
                gymCredRecord.sampleMembers.push({
                    name: `${mem.firstName} ${mem.lastName}`,
                    email: mem.email,
                    password: defaultPassword,
                    pin: defaultPin
                });
            }

            // 11. Subscriptions, Payments, Attendance, Workouts & Exercise Completions
            console.log("  • Generating synchronized payments, attendance & workout logs...");
            const allPayments: any[] = [];
            const allSubscriptions: any[] = [];
            const allAttendance: any[] = [];
            const allAssignedPlans: any[] = [];
            const allWorkoutLogs: any[] = [];
            const allExerciseCompletions: any[] = [];

            let receiptCounter = 1;

            for (let mIdx = 0; mIdx < createdMembers.length; mIdx++) {
                const member = createdMembers[mIdx];
                const plan = plans.find(p => p.id === member.planId)!;
                const joinDate = new Date(member.joinDate);
                const assignedWp = createdWorkoutPlans.find(wp => wp._id.toString() === member.workoutPlanId?.toString()) || createdWorkoutPlans[0];

                allAssignedPlans.push({
                    gymId: gym._id,
                    memberId: member._id,
                    trainerId: member.trainerId,
                    templateId: assignedWp._id,
                    startDate: joinDate,
                    status: "active"
                });

                const durationDays = plan.duration;
                let cycleDate = new Date(joinDate);
                let paymentDates: Date[] = [];

                while (cycleDate <= NOW) {
                    paymentDates.push(new Date(cycleDate));
                    cycleDate.setDate(cycleDate.getDate() + durationDays);
                }

                // If member hasn't renewed (e.g. 10% simulated expired)
                const isSimulatedExpired = (mIdx % 10 === 0 && paymentDates.length > 1);
                if (isSimulatedExpired) {
                    paymentDates.pop();
                }

                for (let pIdx = 0; pIdx < paymentDates.length; pIdx++) {
                    const pDate = paymentDates[pIdx];
                    const receiptNum = `RCP-${cfg.slug.toUpperCase().slice(0, 3)}-26-${String(receiptCounter++).padStart(4, '0')}`;
                    allPayments.push({
                        memberId: member._id.toString(),
                        amount: plan.price,
                        date: pDate.toISOString(), // Critical ISO format
                        method: pIdx === 0 ? "cash" : (Math.random() > 0.4 ? "bank_transfer" : "card"),
                        gymId: gym._id,
                        receiptNumber: receiptNum,
                        collectedBy: Math.random() > 0.5 ? receptionist._id : manager._id,
                        description: pIdx === 0 ? `Initial membership fee - ${plan.name}` : `Renewal membership fee - ${plan.name}`,
                        createdAt: pDate
                    });
                }

                const lastPaymentDate = paymentDates[paymentDates.length - 1];
                const subExpiryDate = new Date(lastPaymentDate);
                subExpiryDate.setDate(subExpiryDate.getDate() + durationDays);

                let subStatus: "active" | "expired" = "active";
                if (subExpiryDate < NOW) {
                    subStatus = "expired";
                }

                allSubscriptions.push({
                    memberId: member._id.toString(),
                    planId: plan.id,
                    startDate: lastPaymentDate.toISOString(),
                    endDate: subExpiryDate.toISOString(),
                    status: subStatus,
                    gymId: gym._id,
                    createdAt: lastPaymentDate
                });

                // Attendance
                const attendanceEndDate = subStatus === "expired" ? subExpiryDate : NOW;
                const daysBetween = Math.max(1, Math.floor((attendanceEndDate.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000)));

                let memberCheckInCount = 0;
                let lastCheckInDate: Date | null = null;

                for (let dayOffset = 0; dayOffset < daysBetween; dayOffset++) {
                    if (Math.random() > 0.52) {
                        const attDate = new Date(joinDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
                        if (attDate <= NOW) {
                            const isMorning = Math.random() > 0.45;
                            const checkInTime = new Date(attDate);
                            checkInTime.setHours(isMorning ? 7 + Math.floor(Math.random() * 3) : 17 + Math.floor(Math.random() * 4));
                            checkInTime.setMinutes(Math.floor(Math.random() * 60));

                            const checkOutTime = new Date(checkInTime);
                            checkOutTime.setMinutes(checkInTime.getMinutes() + 55 + Math.floor(Math.random() * 35));

                            allAttendance.push({
                                gymId: gym._id,
                                memberId: member._id,
                                date: attDate,
                                checkInTime: checkInTime,
                                checkOutTime: checkOutTime,
                                status: "present",
                                checkInMethod: Math.random() > 0.3 ? "qr" : "manual"
                            });

                            memberCheckInCount++;
                            lastCheckInDate = checkInTime;

                            // Exercise Completions
                            const daysFromNow = (NOW.getTime() - attDate.getTime()) / (24 * 60 * 60 * 1000);
                            if (daysFromNow <= 30 && Math.random() > 0.3) {
                                const sampleEx1 = createdExercises[0];
                                const sampleEx2 = createdExercises[1];
                                const dateStr = attDate.toISOString().split("T")[0];

                                allExerciseCompletions.push({
                                    gymId: gym._id,
                                    memberId: member._id,
                                    exerciseId: sampleEx1._id,
                                    planId: member.workoutPlanId,
                                    date: dateStr,
                                    attemptNumber: 1,
                                    sets: [
                                        { setNumber: 1, startedAt: checkInTime, completedAt: new Date(checkInTime.getTime() + 60000), durationSeconds: 60, reps: "12", weight: 30 },
                                        { setNumber: 2, startedAt: new Date(checkInTime.getTime() + 120000), completedAt: new Date(checkInTime.getTime() + 180000), durationSeconds: 60, reps: "10", weight: 35 },
                                        { setNumber: 3, startedAt: new Date(checkInTime.getTime() + 240000), completedAt: new Date(checkInTime.getTime() + 300000), durationSeconds: 60, reps: "8", weight: 40 }
                                    ],
                                    totalSets: 3,
                                    totalDuration: 180,
                                    status: "completed",
                                    completedAt: new Date(checkInTime.getTime() + 300000)
                                });

                                allWorkoutLogs.push({
                                    gymId: gym._id,
                                    memberId: member._id,
                                    trainerId: member.trainerId,
                                    planId: member.workoutPlanId,
                                    date: attDate,
                                    exercises: [
                                        { exerciseId: sampleEx1._id, setsCompleted: 3, repsCompleted: "10", weightUsed: 35 },
                                        { exerciseId: sampleEx2._id, setsCompleted: 3, repsCompleted: "12", weightUsed: 25 }
                                    ]
                                });
                            }
                        }
                    }
                }

                member.totalCheckIns = memberCheckInCount;
                if (lastCheckInDate) member.lastCheckIn = lastCheckInDate;
                await member.save();
            }

            await Payment.insertMany(allPayments as any);
            await Subscription.insertMany(allSubscriptions as any);
            await Attendance.insertMany(allAttendance as any);
            await AssignedWorkoutPlan.insertMany(allAssignedPlans as any);
            await WorkoutLog.insertMany(allWorkoutLogs as any);
            await ExerciseCompletion.insertMany(allExerciseCompletions as any);

            console.log(`    ✓ Seeded ${allPayments.length} Payments`);
            console.log(`    ✓ Seeded ${allSubscriptions.length} Subscriptions`);
            console.log(`    ✓ Seeded ${allAttendance.length} Attendance check-ins`);
            console.log(`    ✓ Seeded ${allExerciseCompletions.length} Exercise Completion logs`);

            // 12. Selling Module
            console.log("  • Seeding Selling / POS / Store Module...");

            const catSupplements = await ProductCategory.create({
                gymId: gym._id,
                name: "Nutrition & Supplements",
                slug: "supplements",
                description: "Whey protein, amino acids, multivitamins, and recovery blends",
                isActive: true
            });

            const catApparel = await ProductCategory.create({
                gymId: gym._id,
                name: cfg.isFemaleOnly ? "Women's Activewear" : "Fitness Apparel & Gear",
                slug: "apparel",
                description: cfg.isFemaleOnly ? "High-waist leggings, sports tops, grip socks" : "Gym shirts, shorts, lifting wraps",
                isActive: true
            });

            const catAccessories = await ProductCategory.create({
                gymId: gym._id,
                name: "Accessories & Equipment",
                slug: "accessories",
                description: "Shakers, resistance loops, micro-towels, water flasks",
                isActive: true
            });

            const brandON = await ProductBrand.create({
                gymId: gym._id,
                name: "Optimum Nutrition",
                slug: "optimum-nutrition",
                description: "World recognized sports nutrition standards"
            });

            const brandGym = await ProductBrand.create({
                gymId: gym._id,
                name: cfg.name,
                slug: cfg.slug,
                description: `Official branded merchandise from ${cfg.name}`
            });

            const productCatalog = cfg.isFemaleOnly ? [
                {
                    name: "Optimum Nutrition 100% Gold Whey Isolate - Vanilla",
                    slug: "on-gold-whey-isolate-vanilla",
                    shortDesc: "Pure fast-absorbing whey protein isolate with minimal carbs.",
                    price: 19500, discountPrice: 18000,
                    stock: 35, sku: "LHC-WHEY-ISO-VAN",
                    cat: catSupplements._id, brand: brandON._id
                },
                {
                    name: "Hydrolyzed Collagen Peptides & Biotin Blend",
                    slug: "collagen-peptides-biotin",
                    shortDesc: "Supports joint flexibility, healthy skin, hair, and nail rejuvenation.",
                    price: 6800, discountPrice: 6200,
                    stock: 45, sku: "LHC-COLLAGEN-BIO",
                    cat: catSupplements._id, brand: brandON._id
                },
                {
                    name: "Women's High-Waist Seamless Compression Tights",
                    slug: "womens-high-waist-compression-tights",
                    shortDesc: "Squat-proof, breathable 4-way stretch fabric with tummy control.",
                    price: 3200, discountPrice: 2800,
                    stock: 60, sku: "LHC-TIGHTS-BLK-M",
                    cat: catApparel._id, brand: brandGym._id
                },
                {
                    name: "Fabric Resistance Booty Bands (Set of 3 Levels)",
                    slug: "fabric-resistance-booty-bands-set",
                    shortDesc: "Non-slip woven fabric bands for glute activation and warmups.",
                    price: 1800, discountPrice: 1500,
                    stock: 75, sku: "LHC-BANDS-SET3",
                    cat: catAccessories._id, brand: brandGym._id
                },
                {
                    name: "Insulated Stainless Steel Gym Flask (750ml)",
                    slug: "insulated-stainless-gym-flask",
                    shortDesc: "Keeps water chilled for 24 hours. Leak-proof sports straw lid.",
                    price: 2200, discountPrice: 1900,
                    stock: 40, sku: "LHC-FLASK-750",
                    cat: catAccessories._id, brand: brandGym._id
                }
            ] : [
                {
                    name: "Optimum Nutrition 100% Whey Gold Standard - 5lbs Chocolate",
                    slug: "on-gold-standard-whey-5lb-choc",
                    shortDesc: "The gold standard for muscle recovery with 24g pure protein per scoop.",
                    price: 18500, discountPrice: 17200,
                    stock: 30, sku: "GYM-ON-WHEY-5LB",
                    cat: catSupplements._id, brand: brandON._id
                },
                {
                    name: "Cellucor C4 Original Pre-Workout (30 Servings)",
                    slug: "cellucor-c4-original-preworkout",
                    shortDesc: "Explosive energy and endurance formula with Beta-Alanine.",
                    price: 6500, discountPrice: 5900,
                    stock: 40, sku: "GYM-C4-PRE-30",
                    cat: catSupplements._id, brand: brandON._id
                },
                {
                    name: "GymFlow Engineered Performance T-Shirt",
                    slug: "gymflow-engineered-performance-tshirt",
                    shortDesc: "Ultra-breathable sweat-wicking training tee with gym logo.",
                    price: 1800, discountPrice: 1500,
                    stock: 70, sku: "GYM-TEE-PERF-L",
                    cat: catApparel._id, brand: brandGym._id
                },
                {
                    name: "Heavy Duty Cotton Lifting Straps",
                    slug: "heavy-duty-cotton-lifting-straps",
                    shortDesc: "Neoprene padded wrist support for heavy deadlifts and pulls.",
                    price: 1200, discountPrice: 950,
                    stock: 80, sku: "GYM-STRAPS-COTTON",
                    cat: catAccessories._id, brand: brandGym._id
                },
                {
                    name: "Premium Microfiber Gym Sweat Towel",
                    slug: "premium-microfiber-gym-sweat-towel",
                    shortDesc: "Quick-drying, antibacterial workout bench towel with phone pocket.",
                    price: 850, discountPrice: 750,
                    stock: 90, sku: "GYM-TOWEL-MICRO",
                    cat: catAccessories._id, brand: brandGym._id
                }
            ];

            const createdProducts: any[] = [];
            for (const p of productCatalog) {
                const prod = await Product.create({
                    gymId: gym._id,
                    name: p.name,
                    slug: p.slug,
                    shortDescription: p.shortDesc,
                    description: `<p>${p.shortDesc}</p>`,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    categoryId: p.cat,
                    brandId: p.brand,
                    status: "active",
                    trackInventory: true,
                    stockQuantity: p.stock,
                    sku: p.sku,
                    visibility: "public",
                    images: []
                });
                createdProducts.push(prod);

                await InventoryLog.create({
                    gymId: gym._id,
                    productId: prod._id,
                    type: "restock",
                    quantityChange: p.stock,
                    previousQuantity: 0,
                    newQuantity: p.stock,
                    reason: "Initial Gym Launch Stocking",
                    performedBy: manager._id,
                    createdAt: gymCreatedAt
                });
            }

            console.log("  • Simulating POS sales and orders...");
            let orderReceiptCount = 1;
            for (let ordIdx = 0; ordIdx < 25; ordIdx++) {
                const ordMember = createdMembers[Math.floor(Math.random() * createdMembers.length)];
                const ordMemberJoin = new Date(ordMember.joinDate);
                const orderTime = new Date(ordMemberJoin.getTime() + Math.random() * (NOW.getTime() - ordMemberJoin.getTime()));
                const prod1 = createdProducts[ordIdx % createdProducts.length];
                const prod2 = createdProducts[(ordIdx + 2) % createdProducts.length];

                const qty1 = 1;
                const qty2 = ordIdx % 3 === 0 ? 1 : 0;

                const items = [
                    {
                        productId: prod1._id,
                        name: prod1.name,
                        quantity: qty1,
                        unitPrice: prod1.discountPrice || prod1.price,
                        subtotal: (prod1.discountPrice || prod1.price) * qty1
                    }
                ];

                if (qty2 > 0) {
                    items.push({
                        productId: prod2._id,
                        name: prod2.name,
                        quantity: qty2,
                        unitPrice: prod2.discountPrice || prod2.price,
                        subtotal: (prod2.discountPrice || prod2.price) * qty2
                    });
                }

                const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);
                const orderReceipt = `ORD-${cfg.slug.toUpperCase().slice(0, 3)}-26-${String(orderReceiptCount++).padStart(4, '0')}`;

                await Order.create({
                    gymId: gym._id,
                    memberId: ordMember._id,
                    processedBy: receptionist._id,
                    items: items,
                    totalAmount: total,
                    discountAmount: 0,
                    taxAmount: 0,
                    finalAmount: total,
                    paymentMethod: ordIdx % 2 === 0 ? "cash" : "card",
                    status: "completed",
                    source: "pos",
                    receiptNumber: orderReceipt,
                    createdAt: orderTime
                });

                if (prod1.stockQuantity > qty1) {
                    const prev1 = prod1.stockQuantity;
                    prod1.stockQuantity -= qty1;
                    await prod1.save();
                    await InventoryLog.create({
                        gymId: gym._id,
                        productId: prod1._id,
                        type: "sale",
                        quantityChange: -qty1,
                        previousQuantity: prev1,
                        newQuantity: prod1.stockQuantity,
                        reason: "POS Front Desk Sale",
                        referenceId: orderReceipt,
                        performedBy: receptionist._id,
                        createdAt: orderTime
                    });
                }
            }

            // 13. Trainer Slots & Bookings
            console.log("  • Seeding Trainer Availability and Bookings...");
            for (const tr of createdTrainers) {
                for (let day = 1; day <= 5; day++) {
                    const avail = await TrainerAvailability.create({
                        trainerId: tr._id,
                        dayOfWeek: day,
                        startTime: "09:00",
                        endTime: "18:00",
                        slotDurationMinutes: 60,
                        gymId: gym._id
                    });

                    const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
                    const slotYesterday = await TrainerSlot.create({
                        trainerId: tr._id,
                        availabilityId: avail._id,
                        date: yesterday,
                        startTime: "11:00",
                        endTime: "12:00",
                        capacity: 1,
                        gymId: gym._id,
                        status: "full"
                    });

                    const clientMember = createdMembers[Math.floor(Math.random() * createdMembers.length)];
                    const booking = await TrainerBooking.create({
                        gymId: gym._id,
                        memberId: clientMember._id,
                        trainerId: tr._id,
                        slotId: slotYesterday._id,
                        startTime: "11:00",
                        endTime: "12:00",
                        bookingDate: yesterday,
                        status: "completed"
                    });

                    await TrainerSessionLog.create({
                        bookingId: booking._id,
                        trainerId: tr._id,
                        memberId: clientMember._id,
                        gymId: gym._id,
                        trainerNotes: `Client had exceptional form and energy. Finished all working sets on time. Recommended 2.5kg load progression next week.`
                    });

                    const tomorrow = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
                    await TrainerSlot.create({
                        trainerId: tr._id,
                        availabilityId: avail._id,
                        date: tomorrow,
                        startTime: "15:00",
                        endTime: "16:00",
                        capacity: 1,
                        gymId: gym._id,
                        status: "available"
                    });
                }
            }

            // 14. Notifications
            console.log("  • Seeding Notifications & Media Assets...");
            await Notification.create([
                {
                    gymId: gym._id,
                    targetRoles: ["owner", "staff"],
                    title: "Welcome to GymFlow SaaS",
                    message: `System setup for ${cfg.name} completed. All modules active.`,
                    type: "system_alert",
                    createdAt: gymCreatedAt
                },
                {
                    gymId: gym._id,
                    targetRoles: ["staff"],
                    title: "Inventory Alert: High Whey Sales",
                    message: "Gold Standard Whey is selling rapidly through the POS. Check warehouse reorder levels.",
                    type: "info",
                    createdAt: new Date(NOW.getTime() - 48 * 60 * 60 * 1000)
                }
            ]);

            // 15. Assets & Folders
            const assetFolder = await AssetFolder.create({
                gymId: gym._id,
                name: "Store Catalogs",
                createdBy: manager._id
            });

            await Asset.create({
                gymId: gym._id,
                name: `${cfg.slug}-banner.jpg`,
                type: "image",
                url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200",
                publicId: `gyms/${cfg.slug}/banner_01`,
                folderId: assetFolder._id,
                size: 245120,
                createdBy: manager._id
            });

            // 16. API Key
            await ApiKey.create({
                gymId: gym._id,
                name: "Store Public Webhook & Widget Key",
                keyId: `gms_${cfg.slug}_live_key`,
                key: crypto.createHash("sha256").update(`key_${cfg.slug}_123`).digest("hex"),
                secret: crypto.createHash("sha256").update(`secret_${cfg.slug}_456`).digest("hex"),
                permissions: ["store:read", "inventory:read", "orders:create"],
                isActive: true
            });

            // 17. Audit Logs
            const logActions = ["member:created", "payment:recorded", "plan:assigned", "order:completed"];
            for (let l = 0; l < 8; l++) {
                await AuditLog.create({
                    gymId: gym._id,
                    userId: receptionist._id,
                    userName: receptionist.fullName,
                    action: logActions[l % logActions.length],
                    resource: "system",
                    details: { message: `Performed ${logActions[l % logActions.length]} in normal workflow` },
                    ipAddress: "182.180.1.15",
                    createdAt: new Date(NOW.getTime() - (l * 4 * 24 * 60 * 60 * 1000))
                });
            }

            console.log(`✅ Completed setup for ${cfg.name}.`);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // SAVE CREDENTIALS JSON FILE
        // ─────────────────────────────────────────────────────────────────────────
        const credentialsFilePath = path.join(process.cwd(), "seed_pakistani_credentials.json");
        fs.writeFileSync(credentialsFilePath, JSON.stringify(credentialsExport, null, 2));

        console.log("\n==========================================================");
        console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        console.log("==========================================================");
        console.log(`📁 Credentials exported to: ${credentialsFilePath}`);
        console.log("\n⭐ FEATURED GYM: LADIES HEALTH CARE");
        console.log(`  • Owner:        ${credentialsExport.featuredGym.owner.email} (${credentialsExport.featuredGym.owner.name})`);
        console.log(`  • Manager:      ${credentialsExport.featuredGym.manager.email} (${credentialsExport.featuredGym.manager.name})`);
        console.log(`  • Receptionist: ${credentialsExport.featuredGym.receptionist.email} (${credentialsExport.featuredGym.receptionist.name})`);
        console.log(`  • Password:     ${defaultPassword}`);
        console.log("\n⭐ SUPER ADMIN:");
        console.log(`  • Email:        ${credentialsExport.superAdmin.email}`);
        console.log(`  • Password:     ${defaultPassword}`);
        console.log("==========================================================\n");

    } catch (error) {
        console.error("❌ Seeding failed with error:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
