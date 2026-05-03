
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
    console.error("MONGODB_URL not found in environment variables");
    process.exit(1);
}

// Helpers
const hashPassword = async (pwd: string) => await bcrypt.hash(pwd, 10);

const pakistanFirstNamesMale = [
    "Ahmed", "Ali", "Bilal", "Danish", "Fahad", "Hamza", "Hassan", "Imran", "Junaid", "Kamran",
    "Mohammad", "Noman", "Omar", "Qasim", "Rizwan", "Saad", "Taimoor", "Usman", "Waqas", "Zain",
    "Arsalan", "Babar", "Faisal", "Ghayur", "Haris", "Irfan", "Jawad", "Kashif", "Luqman", "Mansoor",
    "Nasir", "Owais", "Pervaiz", "Raheel", "Sajid", "Tahir", "Umer", "Vikas", "Waseem", "Zubair",
    "Khubaib", "Shahzaib", "Zeeshan", "Mubashir", "Adeel", "Asad", "Basit", "Daniyal", "Ehsan", "Farhan"
];

const pakistanFirstNamesFemale = [
    "Fatima", "Ayesha", "Zainab", "Maryam", "Sana", "Hira", "Sadia", "Kiran", "Nida", "Amna",
    "Bakhtawar", "Bushra", "Dur-e-Fishan", "Eshal", "Fiza", "Ghazala", "Humaira", "Iffat", "Javerya", "Komal",
    "Laila", "Mahnoor", "Nadia", "Pareeshay", "Quratulain", "Rabia", "Saba", "Tayyaba", "Urooj", "Vaneeza",
    "Warda", "Yumna", "Zoya", "Anum", "Bisma", "Dua", "Eman", "Farah", "Gia", "Hania"
];

const pakistanLastNames = [
    "Khan", "Ahmed", "Ali", "Hussain", "Shah", "Malik", "Raja", "Butt", "Sheikh", "Chaudhry",
    "Ansari", "Qureshi", "Siddiqui", "Baig", "Mirza", "Abbasi", "Awan", "Lodhi", "Mughal", "Pasha",
    "Zaid", "Farooqi", "Javed", "Saeed", "Iqbal", "Hashmi", "Naqvi", "Kazmi", "Gillani", "Tirmizi"
];

const getRandomName = (gender?: "male" | "female") => {
    const isMale = gender ? gender === "male" : Math.random() > 0.4;
    const firstNames = isMale ? pakistanFirstNamesMale : pakistanFirstNamesFemale;
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = pakistanLastNames[Math.floor(Math.random() * pakistanLastNames.length)];
    return { first, last, full: `${first} ${last}`, gender: isMale ? "male" : "female" };
};

const getRandomPhone = () => {
    const prefixes = ["0300", "0301", "0302", "0303", "0312", "0313", "0314", "0321", "0322", "0333", "0334", "0335", "0345", "0346", "0347"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefix}-${number}`;
};

const cities = [
    { name: "Karachi", areas: ["DHA Phase 5", "Gulshan-e-Iqbal", "North Nazimabad", "Clifton", "PECHS", "Korangi"] },
    { name: "Lahore", areas: ["Gulberg III", "DHA Phase 6", "Johar Town", "Model Town", "Bahria Town", "Samanabad"] },
    { name: "Islamabad", areas: ["F-10 Markaz", "F-6", "G-11", "E-7", "Blue Area", "I-8"] },
    { name: "Rawalpindi", areas: ["Saddar", "Satellite Town", "Bahria Phase 7", "Westridge"] },
    { name: "Faisalabad", areas: ["People's Colony", "Canal Road", "Madina Town"] },
    { name: "Peshawar", areas: ["Hayatabad", "University Road", "Peshawar Cantt"] }
];

const gymNames = [
    "The Iron Forge Karachi", "Lahore Power Fitness", "Islamabad Elite Club",
    "Titan Strength Rawalpindi", "Faisalabad Muscle Mania", "Hayatabad Warriors Gym",
    "Skyline Health Studio", "Oceanic Fitness Clifton", "Metal Temple Gulberg", "Desert Storm Bahria"
];

const specialties = [
    "Weight Training", "Cardio Fitness", "Yoga & Pilates", "CrossFit",
    "Bodybuilding", "Nutrition Coaching", "Rehabilitation", "HIIT",
    "Functional Training", "Sports Conditioning", "Powerlifting", "MMA & Boxing"
];

function getRandomDate(monthsBack = 3, monthsForward = 0): Date {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(now.getMonth() - monthsBack);
    const end = new Date(now);
    end.setMonth(now.getMonth() + monthsForward);

    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generates a list of monthly dates starting from joinDate until now
 */
function getMonthlyDates(startDate: Date): Date[] {
    const dates = [];
    const current = new Date(startDate);
    const now = new Date();
    
    while (current <= now) {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
    }
    return dates;
}

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL!);
        console.log("Database connection established");
        console.log("Cleaning database...");
        const models = [
            Gym, User, Member, Plan, Subscription, TrainerAvailability, TrainerSlot,
            TrainerBooking, TrainerSessionLog, Payment, Exercise, WorkoutPlan,
            AssignedWorkoutPlan, WorkoutLog, WorkoutTemplate, Role, GymSettings,
            PlatformSettings, PlatformPlan, SubscriptionPlan, Attendance, AuditLog, PlatformPayment
        ];
        await Promise.all((models as any[]).map(m => m.deleteMany({})));
        console.log("Database cleaned");

        // 1. Platform Settings & Plans
        console.log("Seeding Platform...");
        await PlatformSettings.create({});
        const pPlans = await PlatformPlan.create([
            { name: "Starter", slug: "starter", monthlyPricePKR: 3000, branchLimit: 1, maxStaffAccounts: 3, featureFlags: ["members", "manualAttendance", "payments"] },
            { name: "Professional", slug: "professional", monthlyPricePKR: 5000, branchLimit: 3, maxStaffAccounts: 10, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics"] },
            { name: "Enterprise", slug: "enterprise", monthlyPricePKR: 10000, branchLimit: 10, maxStaffAccounts: 50, featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs"] }
        ]);

        const globalCredentials = [];
        const defaultPassword = "password123";
        const hashedPassword = await hashPassword(defaultPassword);
        const hashedPin = await hashPassword("1234");

        // 2. Gyms
        for (let i = 0; i < 6; i++) {
            const gymName = gymNames[i % gymNames.length];
            const cityData = cities[i % cities.length];
            const area = cityData.areas[Math.floor(Math.random() * cityData.areas.length)];
            const address = `${area}, ${cityData.name}, Pakistan`;

            console.log(`Processing Gym ${i + 1}/6: ${gymName}`);

            const gym = await Gym.create({
                name: gymName,
                address: address,
                city: cityData.name,
                phone: getRandomPhone(),
                isActive: true,
                branches: [{
                    name: "Main Branch",
                    address: address,
                    phone: getRandomPhone(),
                    email: `contact@${gymName.toLowerCase().replace(/\s/g, "")}.pk`,
                    isDefault: true
                }]
            });

            await GymSettings.create({
                gymId: gym._id,
                general: { name: gymName, address: address },
                attendanceRules: { preventDuplicateCheckin: true, dailyLimit: 2 }
            } as any);

            await SubscriptionPlan.create({
                gymId: gym._id,
                tierName: i % 2 === 0 ? "Professional" : "Enterprise",
                active: true,
                enabledFeatures: ["members", "subscriptions", "payments", "attendance", "workout_plans", "trainersModule"]
            });

            // 3. Roles
            const rolesMap: Record<string, any> = {};
            const rolesToCreate = [
                { name: "owner", permissions: ALL_PERMISSIONS },
                { name: "manager", permissions: ROLE_PERMISSIONS.manager },
                { name: "trainer", permissions: ROLE_PERMISSIONS.trainer },
                { name: "receptionist", permissions: ROLE_PERMISSIONS.receptionist }
            ];
            for (const r of rolesToCreate) {
                rolesMap[r.name] = await Role.create({
                    gymId: gym._id,
                    name: r.name,
                    permissions: r.permissions,
                    isSystemRole: true,
                    description: `${r.name.charAt(0).toUpperCase() + r.name.slice(1)} access for ${gymName}`
                });
            }

            const gymCreds: any = { gymName, owner: null, manager: null, trainers: [], members: [] };

            // 4. Users (Staff)
            const ownerName = getRandomName();
            const owner = await User.create({
                fullName: ownerName.full,
                email: `owner@${gymName.toLowerCase().replace(/\s/g, "")}.pk`,
                password: hashedPassword,
                role: "owner",
                roleId: rolesMap["owner"]._id,
                gymId: gym._id,
                isActive: true
            });
            gymCreds.owner = { email: owner.email, password: defaultPassword };

            const managerName = getRandomName();
            const manager = await User.create({
                fullName: managerName.full,
                email: `manager@${gymName.toLowerCase().replace(/\s/g, "")}.pk`,
                password: hashedPassword,
                role: "manager",
                roleId: rolesMap["manager"]._id,
                gymId: gym._id,
                isActive: true
            });
            gymCreds.manager = { email: manager.email, password: defaultPassword };

            const trainerDocs = [];
            for (let t = 0; t < 3; t++) {
                const tName = getRandomName();
                const specCount = 2 + Math.floor(Math.random() * 2);
                const tSpecs = [];
                for (let s = 0; s < specCount; s++) tSpecs.push(specialties[Math.floor(Math.random() * specialties.length)]);

                trainerDocs.push({
                    fullName: tName.full,
                    email: `trainer${t + 1}@${gymName.toLowerCase().replace(/\s/g, "")}.pk`,
                    password: hashedPassword,
                    role: "trainer",
                    roleId: rolesMap["trainer"]._id,
                    gymId: gym._id,
                    isActive: true,
                    bio: `Professional ${tSpecs[0]} trainer with 5+ years of experience in ${cityData.name}.`,
                    specialties: [...new Set(tSpecs)],
                    hourlyRate: 1500 + (Math.floor(Math.random() * 10) * 100),
                    trainerStatus: "active"
                });
            }
            const createdTrainers = await User.insertMany(trainerDocs);
            createdTrainers.forEach(t => gymCreds.trainers.push({ name: t.fullName, email: t.email, password: defaultPassword }));

            // 5. Exercises
            const exercises = await Exercise.insertMany([
                { gymId: gym._id, name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", difficulty: "Intermediate", createdByTrainerId: createdTrainers[0]._id, tips: [], isPublicWithinGym: true },
                { gymId: gym._id, name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", difficulty: "Advanced", createdByTrainerId: createdTrainers[0]._id, tips: [], isPublicWithinGym: true },
                { gymId: gym._id, name: "High Bar Squat", muscleGroup: "Legs", equipment: "Barbell", difficulty: "Intermediate", createdByTrainerId: createdTrainers[0]._id, tips: [], isPublicWithinGym: true },
                { gymId: gym._id, name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell", difficulty: "Intermediate", createdByTrainerId: createdTrainers[1]._id, tips: [], isPublicWithinGym: true },
                { gymId: gym._id, name: "Lat Pulldown", muscleGroup: "Back", equipment: "Machine", difficulty: "Beginner", createdByTrainerId: createdTrainers[1]._id, tips: [], isPublicWithinGym: true },
                { gymId: gym._id, name: "Dumbbell Bicep Curls", muscleGroup: "Arms", equipment: "Dumbbells", difficulty: "Beginner", createdByTrainerId: createdTrainers[2]._id, tips: [], isPublicWithinGym: true }
            ] as any);

            // 6. Workout Templates
            const template = await WorkoutTemplate.create({
                gymId: gym._id,
                createdByTrainerId: createdTrainers[0]._id,
                name: "Pakistani Power Split",
                goal: "Strength & Hypertrophy",
                daysPerWeek: 3,
                days: [
                    {
                        dayNumber: 1, title: "Push (Chest/Shoulders/Triceps)", exercises: [
                            { exerciseId: exercises[0]._id, sets: 4, reps: "8-12", restSeconds: 90 },
                            { exerciseId: exercises[3]._id, sets: 3, reps: "10-12", restSeconds: 60 }
                        ]
                    },
                    {
                        dayNumber: 2, title: "Pull (Back/Biceps)", exercises: [
                            { exerciseId: exercises[1]._id, sets: 3, reps: "5", restSeconds: 180 },
                            { exerciseId: exercises[4]._id, sets: 4, reps: "10-15", restSeconds: 60 },
                            { exerciseId: exercises[5]._id, sets: 3, reps: "12-15", restSeconds: 45 }
                        ]
                    },
                    {
                        dayNumber: 3, title: "Legs", exercises: [
                            { exerciseId: exercises[2]._id, sets: 4, reps: "8-10", restSeconds: 120 }
                        ]
                    }
                ]
            });

            // 7. Membership Plans
            const plans = await Plan.insertMany([
                { id: "basic-monthly", gymId: gym._id, name: "Basic Monthly", price: 3000, duration: 30, description: "Full gym access" },
                { id: "standard-quarterly", gymId: gym._id, name: "Standard Quarterly", price: 7500, duration: 90, description: "Save with 3 months access" },
                { id: "premium-yearly", gymId: gym._id, name: "Premium Yearly", price: 25000, duration: 365, description: "VIP access with locker" }
            ] as any);

            // 8. Members
            const memberCount = 20; // Increased count
            const mDocs = [];
            for (let m = 0; m < memberCount; m++) {
                const mName = getRandomName();
                const plan = plans[m % plans.length];
                const trainer = createdTrainers[m % createdTrainers.length];
                const joinDate = getRandomDate(3, 0); // Past 3 months

                mDocs.push({
                    firstName: mName.first,
                    lastName: mName.last,
                    email: `${mName.first.toLowerCase()}.${mName.last.toLowerCase()}${m + 1}@gmail.com`,
                    phone: getRandomPhone(),
                    gender: mName.gender,
                    gymId: gym._id,
                    joinDate: joinDate.toISOString(),
                    trainerId: trainer._id,
                    planId: plan.id,
                    status: "active",
                    portalPassword: hashedPassword,
                    portalPin: hashedPin,
                    portalEnabled: true,
                    qrCode: `QR-${gym._id.toString().substring(0, 4)}-${m + 100}`
                });
            }
            const createdMembers = await Member.insertMany(mDocs);

            // 9. Subscriptions, Payments, Attendance
            for (const member of createdMembers) {
                const joinDate = new Date(member.joinDate);
                const paymentDates = getMonthlyDates(joinDate);
                const plan = plans.find(p => p.id === member.planId);
                
                // 9.1 Monthly Payments
                for (const pDate of paymentDates) {
                    await Payment.create({
                        memberId: member._id,
                        amount: plan?.price || 3000,
                        date: pDate,
                        method: Math.random() > 0.3 ? "cash" : "bank_transfer",
                        gymId: gym._id,
                        collectedBy: manager._id,
                        description: `Renewal payment for ${plan?.name}`
                    });
                }

                // 9.2 Subscription (Set based on latest payment)
                const lastPaymentDate = paymentDates[paymentDates.length - 1];
                const expiryDate = new Date(lastPaymentDate);
                expiryDate.setDate(expiryDate.getDate() + (plan?.duration || 30));

                await Subscription.create({
                    memberId: member._id.toString(),
                    planId: member.planId,
                    startDate: lastPaymentDate.toISOString(),
                    endDate: expiryDate.toISOString(),
                    status: expiryDate > new Date() ? "active" : "expired",
                    gymId: gym._id
                });

                // 9.3 Attendance logs (Higher density since join date)
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - joinDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Average 4-5 days a week
                for (let d = 0; d < diffDays; d++) {
                    if (Math.random() > 0.4) { // 60% attendance rate
                        const attDate = new Date(joinDate);
                        attDate.setDate(joinDate.getDate() + d);
                        if (attDate <= now) {
                            const checkIn = new Date(attDate);
                            checkIn.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
                            await Attendance.create({
                                gymId: gym._id,
                                memberId: member._id,
                                date: attDate,
                                checkInTime: checkIn,
                                status: "present"
                            });
                        }
                    }
                }

                // Assigned Workout Plan
                const assignedPlan = await AssignedWorkoutPlan.create({
                    gymId: gym._id,
                    memberId: member._id,
                    trainerId: member.trainerId,
                    templateId: template._id,
                    startDate: joinDate,
                    status: "active"
                });

                // Recent Workout Log
                await WorkoutLog.create({
                    gymId: gym._id,
                    memberId: member._id,
                    trainerId: member.trainerId,
                    planId: assignedPlan._id,
                    date: new Date(),
                    exercises: [
                        { exerciseId: exercises[0]._id, setsCompleted: 4, repsCompleted: "10", weightUsed: 40 + Math.floor(Math.random() * 40) },
                        { exerciseId: exercises[2]._id, setsCompleted: 3, repsCompleted: "12", weightUsed: 60 + Math.floor(Math.random() * 60) }
                    ]
                });

                gymCreds.members.push({ name: `${member.firstName} ${member.lastName}`, email: member.email, password: defaultPassword });
            }

            // 10. Trainer Availability & Bookings
            for (const trainer of createdTrainers) {
                const availDays = [1, 2, 3, 4, 5]; // Mon-Fri
                for (const day of availDays) {
                    const avail = await TrainerAvailability.create({
                        trainerId: trainer._id,
                        dayOfWeek: day,
                        startTime: "09:00",
                        endTime: "18:00",
                        slotDurationMinutes: 60,
                        gymId: gym._id
                    });

                    // Create some slots for next 3 days
                    const today = new Date();
                    for (let d = 0; d < 3; d++) {
                        const slotDate = new Date(today);
                        slotDate.setDate(today.getDate() + d);
                        if (slotDate.getDay() === day) {
                            const startTime = "10:00";
                            const endTime = "11:00";

                            const slot = await TrainerSlot.create({
                                trainerId: trainer._id,
                                availabilityId: avail._id,
                                date: slotDate,
                                startTime,
                                endTime,
                                capacity: 1,
                                gymId: gym._id,
                                status: "available"
                            });

                            // Book one slot for variety
                            if (d === 1) {
                                const member = createdMembers[Math.floor(Math.random() * createdMembers.length)];
                                const booking = await TrainerBooking.create({
                                    gymId: gym._id,
                                    memberId: member._id,
                                    trainerId: trainer._id,
                                    slotId: slot._id,
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                    bookingDate: slot.date,
                                    status: "booked"
                                });
                                booking.status = "booked"; // Should be booked (already is)
                                slot.status = "full";
                                await slot.save();

                                // Historical session log
                                if (slotDate < new Date()) {
                                    await TrainerSessionLog.create({
                                        bookingId: booking._id,
                                        trainerId: trainer._id,
                                        memberId: member._id,
                                        gymId: gym._id,
                                        trainerNotes: "Focused on form today. Improved squat depth."
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // 11. Platform Payments (Gym to Platform)
            await PlatformPayment.create({
                gymId: gym._id,
                amountPKR: 5000,
                paymentDate: getRandomDate(1, 0),
                expiryDate: getRandomDate(0, 1),
                enteredBy: owner._id,
                planName: "Professional",
                status: "completed"
            });

            // 12. Audit Logs
            const logActions = ["create_member", "update_settings", "process_payment", "update_plan"];
            for (let l = 0; l < 10; l++) {
                await AuditLog.create({
                    gymId: gym._id,
                    userId: manager._id,
                    userName: manager.fullName,
                    action: logActions[l % logActions.length],
                    resource: "system",
                    details: { message: `Performed ${logActions[l % logActions.length]} action` },
                    ipAddress: "182.180.1.1"
                });
            }

            globalCredentials.push(gymCreds);
        }

        // 13. Super Admin
        console.log("Seeding Super Admin...");
        const admin = await User.create({
            fullName: "Super Admin",
            email: "admin@gms.com",
            password: hashedPassword,
            role: "super_admin",
            isActive: true
        });
        globalCredentials.push({ role: "super-admin", email: admin.email, password: defaultPassword });

        fs.writeFileSync("seed_pakistani_credentials.json", JSON.stringify(globalCredentials, null, 2));
        console.log("Seeding process completed successfully.");
        console.log("Credentials saved to 'seed_pakistani_credentials.json'");

    } catch (e) {
        console.error("Seeding failed:", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
