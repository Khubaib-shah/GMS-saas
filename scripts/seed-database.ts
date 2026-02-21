
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
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
            WorkoutLog.deleteMany({})
        ]);
        console.log("Database cleaned");

        const globalCredentials: any[] = [];

        // Pre-hash password once to speed up
        const defaultPassword = "password123";
        const defaultPin = "1234";
        const hashedPassword = await hashPassword(defaultPassword);
        const hashedPin = await hashPassword(defaultPin);

        for (let i = 0; i < 10; i++) {
            const gymName = gymNames[i];
            console.log(`Processing Gym ${i + 1}/10: ${gymName}`);

            const gymEmail = `contact@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`;

            const gym = await Gym.create({
                name: gymName,
                address: addresses[i],
                phone: getRandomPhone(),
                isActive: true,
                branches: [{ name: "Main", address: addresses[i], phone: getRandomPhone(), email: gymEmail, isDefault: true }]
            });

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
                role: "gym_owner",
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
                    gymId: gym._id,
                    isActive: true
                }),
                User.create({
                    fullName: receptName.full,
                    email: `reception@${gymName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
                    password: hashedPassword,
                    role: "receptionist",
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
                // Pick 2 random specialties
                const trainSpecs = [];
                trainSpecs.push(specialties[Math.floor(Math.random() * specialties.length)]);
                trainSpecs.push(specialties[Math.floor(Math.random() * specialties.length)]);

                trainerDocs.push({
                    fullName: tName.full,
                    email,
                    password: hashedPassword,
                    role: "trainer",
                    gymId: gym._id,
                    isActive: true,
                    bio: "Expert Trainer with 5+ years of experience helping clients achieve their fitness goals.",
                    specialties: trainSpecs,
                    hourlyRate: 2000,
                    trainerStatus: "active"
                });
            }
            const createdTrainers = await User.insertMany(trainerDocs);

            // Exercise Seeding
            const commonExercises = [
                { name: "Bench Press", group: "Chest", equip: "Barbell" },
                { name: "Incline Dumbbell Press", group: "Chest", equip: "Dumbbell" },
                { name: "Deadlift", group: "Back", equip: "Barbell" },
                { name: "Pull-ups", group: "Back", equip: "Bodyweight" },
                { name: "Squats", group: "Legs", equip: "Barbell" },
                { name: "Leg Press", group: "Legs", equip: "Machine" },
                { name: "Overhead Press", group: "Shoulders", equip: "Barbell" },
                { name: "Lateral Raises", group: "Shoulders", equip: "Dumbbell" },
                { name: "Bicep Curls", group: "Arms", equip: "Dumbbell" },
                { name: "Tricep Pushdowns", group: "Arms", equip: "Machine" },
                { name: "Plank", group: "Core", equip: "Bodyweight" },
                { name: "Crunches", group: "Core", equip: "Bodyweight" },
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

            // Workout Templates (WorkoutPlans)
            const templatesData = [
                {
                    name: "Full Body Foundation",
                    description: "Balanced full body workout for all levels.",
                    schedule: [
                        {
                            day: "monday",
                            title: "Power Day",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 4, reps: "8-10", restSeconds: 90 },
                                { exerciseId: createdExercises[4]._id, sets: 4, reps: "8-10", restSeconds: 120 },
                                { exerciseId: createdExercises[2]._id, sets: 3, reps: "5-8", restSeconds: 180 }
                            ]
                        },
                        {
                            day: "wednesday",
                            title: "Hypertrophy Day",
                            exercises: [
                                { exerciseId: createdExercises[1]._id, sets: 3, reps: "12-15", restSeconds: 60 },
                                { exerciseId: createdExercises[3]._id, sets: 3, reps: "10-12", restSeconds: 60 },
                                { exerciseId: createdExercises[5]._id, sets: 3, reps: "15-20", restSeconds: 90 }
                            ]
                        },
                        {
                            day: "friday",
                            title: "Core & Cardio",
                            exercises: [
                                { exerciseId: createdExercises[10]._id, sets: 3, reps: "60s", restSeconds: 30 },
                                { exerciseId: createdExercises[11]._id, sets: 3, reps: "20", restSeconds: 30 },
                                { exerciseId: createdExercises[12]._id, sets: 1, reps: "20min", restSeconds: 0 }
                            ]
                        }
                    ]
                },
                {
                    name: "Push/Pull Split",
                    description: "Advanced split for maximum muscle growth.",
                    schedule: [
                        {
                            day: "monday",
                            title: "Push Focus",
                            exercises: [
                                { exerciseId: createdExercises[0]._id, sets: 4, reps: "8", restSeconds: 90 },
                                { exerciseId: createdExercises[6]._id, sets: 3, reps: "10", restSeconds: 60 },
                                { exerciseId: createdExercises[9]._id, sets: 3, reps: "12", restSeconds: 60 }
                            ]
                        },
                        {
                            day: "tuesday",
                            title: "Pull Focus",
                            exercises: [
                                { exerciseId: createdExercises[2]._id, sets: 4, reps: "5", restSeconds: 120 },
                                { exerciseId: createdExercises[3]._id, sets: 3, reps: "10", restSeconds: 90 },
                                { exerciseId: createdExercises[8]._id, sets: 3, reps: "12", restSeconds: 60 }
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
            const availabilitiesToInsert = [];

            for (const trainer of createdTrainers) {
                gymCreds.trainers.push({ name: trainer.fullName, email: trainer.email, password: defaultPassword });
                trainers.push(trainer);

                const days = [1, 2, 3, 4, 5, 6];
                for (const day of days) {
                    const availability = new TrainerAvailability({
                        trainerId: trainer._id,
                        dayOfWeek: day,
                        startTime: "09:00",
                        endTime: "18:00",
                        slotDurationMinutes: 60,
                        gymId: gym._id
                    });
                    availabilitiesToInsert.push(availability);

                    // Generate slots for next 30 days
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    for (let d = 0; d < 30; d++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + d);
                        if (date.getDay() === day) {
                            for (let h = 9; h < 18; h++) {
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
            }

            await TrainerAvailability.bulkSave(availabilitiesToInsert);

            // Use insertMany to get _ids back for slots (important for booking)
            // We'll insert in chunks but we need to keep track of them for booking assignments
            // To simplify, we'll insert all slots (memory warning handled by loop previously, but for seed data usually ok up to 10k items)
            // Chunk slots insertion to avoid memory issues
            const chunkSize = 1000;
            const allCreatedSlots: any[] = [];
            for (let i = 0; i < slotsToInsert.length; i += chunkSize) {
                const chunk = await TrainerSlot.insertMany(slotsToInsert.slice(i, i + chunkSize));
                allCreatedSlots.push(...chunk);
            }

            // Plans
            const plansToInsert = [];
            const planNames = ["Silver", "Gold", "Platinum"];
            const durations = [30, 60, 90];

            for (let p = 0; p < 3; p++) {
                plansToInsert.push({
                    id: `${planNames[p].toLowerCase()}-${durations[p]}`,
                    gymId: gym._id,
                    name: `${planNames[p]} Plan`,
                    price: 3000 + (p * 2000),
                    duration: durations[p],
                    description: `Access for ${durations[p]} days`
                });
            }
            const createdPlans = await Plan.insertMany(plansToInsert);

            // Members
            const memberCount = 50 + Math.floor(Math.random() * 21);
            const membersData = [];

            for (let m = 0; m < memberCount; m++) {
                const mName = getRandomName();
                const plan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
                const trainer = trainers[Math.floor(Math.random() * trainers.length)];

                // Random join date
                const daysOptions = [0, 10, 15, 25, 28, Math.floor(Math.random() * 30)];
                const daysAgo = daysOptions[Math.floor(Math.random() * daysOptions.length)];
                const joinDate = new Date();
                joinDate.setDate(joinDate.getDate() - daysAgo);

                membersData.push({
                    firstName: mName.first,
                    lastName: mName.last,
                    email: `${mName.first.toLowerCase()}.${mName.last.toLowerCase()}${Math.floor(Math.random() * 9999)}@gmail.com`,
                    phone: getRandomPhone(),
                    gymId: gym._id,
                    joinDate: joinDate.toISOString(),
                    trainerId: trainer._id,
                    planId: plan.id, // Using String ID as per schema
                    portalPassword: hashedPassword,
                    portalPin: hashedPin,
                    portalEnabled: true,
                    status: "active"
                });
            }

            const createdMembers = await Member.insertMany(membersData);
            const subscriptionsWithDetails: any[] = []

            // Subscriptions & Payments & Bookings
            const paymentsToInsert: any[] = [];
            const bookingsToInsert: any[] = [];
            const slotsToUpdate: any[] = []; // IDs of slots to update bookedCount

            const subscriptionsData = createdMembers.map(member => {
                const plan = createdPlans.find(p => p.id === member.planId);
                const trainer = trainers.find(t => t._id.equals(member.trainerId));

                // For JSON output
                subscriptionsWithDetails.push({
                    name: `${member.firstName} ${member.lastName}`,
                    email: member.email,
                    password: defaultPassword,
                    pin: defaultPin,
                    plan: plan?.name,
                    trainer: trainer?.fullName
                });

                // 1. Create Payment
                paymentsToInsert.push({
                    memberId: member._id.toString(),
                    amount: plan?.price || 3000,
                    date: new Date().toISOString(),
                    method: "cash",
                    description: `Payment for ${plan?.name}`,
                    gymId: gym._id,
                    collectedBy: receptionist._id // Receptionist collected it
                });

                // 2. Book Slots (Assign random slots of the assigned trainer to this member)
                // Filter slots for this trainer
                const trainerSlots = allCreatedSlots.filter((s: any) => s.trainerId.equals(trainer?._id));
                if (trainerSlots.length > 0) {
                    // Pick 0 to 5 random slots
                    const bookingsCount = Math.floor(Math.random() * 6);
                    for (let b = 0; b < bookingsCount; b++) {
                        const randomSlot = trainerSlots[Math.floor(Math.random() * trainerSlots.length)];
                        bookingsToInsert.push({
                            slotId: randomSlot._id,
                            trainerId: trainer?._id,
                            memberId: member._id,
                            bookingSource: "member",
                            status: "booked",
                            gymId: gym._id
                        });
                        // Track slot to update capacity/bookedCount later (simplified for seed)
                        slotsToUpdate.push(randomSlot._id);
                    }
                }

                // Subscription dates should align with join date
                const startDate = new Date(member.joinDate);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + (plan?.duration || 30));

                return {
                    memberId: member._id.toString(), // String ID as per schema
                    planId: member.planId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    status: "active",
                    gymId: gym._id
                };
            });

            await Subscription.insertMany(subscriptionsData);
            await Payment.insertMany(paymentsToInsert);
            await TrainerBooking.insertMany(bookingsToInsert);

            // Workout Assignments & Logs
            const assignmentsToInsert = [];
            const logsToInsert = [];

            for (const member of createdMembers) {
                const template = createdTemplates[Math.floor(Math.random() * createdTemplates.length)];

                // 1. Assign Template
                const assignment = {
                    gymId: gym._id,
                    memberId: member._id,
                    trainerId: member.trainerId,
                    templateId: template._id,
                    startDate: new Date(),
                    status: "active"
                };
                assignmentsToInsert.push(assignment);
            }

            const createdAssignments = await AssignedWorkoutPlan.insertMany(assignmentsToInsert);

            // Seed some logs for history
            for (const assignment of createdAssignments) {
                const template = createdTemplates.find(t => t._id.equals(assignment.templateId));
                if (!template) continue;

                // Create a log for yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                const log = {
                    gymId: gym._id,
                    memberId: assignment.memberId,
                    trainerId: assignment.trainerId,
                    planId: assignment._id,
                    date: yesterday,
                    exercises: template.schedule[0].exercises.map((ex: { exerciseId: any; sets: any; reps: any; }) => ({
                        exerciseId: ex.exerciseId,
                        setsCompleted: ex.sets,
                        repsCompleted: ex.reps,
                        weightUsed: 20 + Math.floor(Math.random() * 40),
                        notes: "Good session"
                    }))
                };
                logsToInsert.push(log);
            }

            await WorkoutLog.insertMany(logsToInsert);

            // Update slots bookedCount
            // Doing strictly one by one update is slow, but for seed it's acceptable vs complex bulkWrite
            // Optimization: Filter unique IDs and $inc
            const uniqueSlotIds = [...new Set(slotsToUpdate)];
            if (uniqueSlotIds.length > 0) {
                await TrainerSlot.updateMany(
                    { _id: { $in: uniqueSlotIds } },
                    { $inc: { bookedCount: 1 } }
                );
            }

            gymCreds.members = subscriptionsWithDetails;
            globalCredentials.push(gymCreds);
        }

        // Write output
        console.log("💾 Writing credentials...");
        fs.writeFileSync("seed_credentials.json", JSON.stringify(globalCredentials, null, 2));

        console.log("\n SEEDING COMPLETE!");
        console.log("Check 'seed_credentials.json' for full details.");

        // Quick preview
        const firstGym = globalCredentials[0];
        if (firstGym) {
            console.log(`\nExample Gym: ${firstGym.gymName}`);
            console.log(`Owner: ${firstGym.owner.email} / ${firstGym.owner.password}`);
            console.log(`Manager: ${firstGym.manager.email} / ${firstGym.manager.password}`);
            console.log(`Trainer: ${firstGym.trainers[0].email} / ${firstGym.trainers[0].password}`);
            console.log(`Member: ${firstGym.members[0].email} / ${firstGym.members[0].password}`);
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
