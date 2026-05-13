import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import bcrypt from "bcryptjs";
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
import Product from "@/models/Product";
import ProductCategory from "@/models/ProductCategory";
import ProductBrand from "@/models/ProductBrand";
import InventoryLog from "@/models/InventoryLog";
import ApiKey from "@/models/ApiKey";
import Asset from "@/models/Asset";
import AssetFolder from "@/models/AssetFolder";
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
            PlatformSettings, PlatformPlan, SubscriptionPlan, Attendance, AuditLog,
            PlatformPayment, Product, ProductCategory, ProductBrand, InventoryLog,
            ApiKey, Asset, AssetFolder
        ];
        await Promise.all(models.map(m => m.deleteMany({})));

        await PlatformSettings.create({});
        await PlatformPlan.create([
            { name: "Starter", slug: "starter", monthlyPricePKR: 3000, branchLimit: 1, maxStaffAccounts: 3, featureFlags: ["members", "manualAttendance"] },
            { name: "Professional", slug: "professional", monthlyPricePKR: 5000, branchLimit: 3, maxStaffAccounts: 10, featureFlags: ["members", "manualAttendance", "qrAttendance", "trainersModule", "analytics"] },
            { name: "Enterprise", slug: "enterprise", monthlyPricePKR: 8000, branchLimit: 10, maxStaffAccounts: 50, featureFlags: ["members", "manualAttendance", "qrAttendance", "trainersModule", "analytics", "workoutPlanner", "auditLogs"] }
        ]);

        const globalCredentials = [];
        const defaultPassword = "password123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        for (let i = 0; i < gymNames.length; i++) {
            const gymName = gymNames[i];
            const gym = await Gym.create({
                name: gymName,
                address: `Karachi, Pakistan - Area ${i + 1}`,
                phone: getRandomPhone(),
                isActive: true,
                branches: [{ name: "Main", address: `Karachi, Pakistan - Area ${i + 1}`, phone: getRandomPhone(), email: `main@${gymName.toLowerCase().replace(/\s/g, "")}.com`, isDefault: true }]
            });

            await GymSettings.create({ gymId: gym._id, general: { name: gymName, address: gym.address } });
            await SubscriptionPlan.create({
                gymId: gym._id,
                tierName: "Enterprise",
                active: true,
                enabledFeatures: ["members", "manualAttendance", "qrAttendance", "workout_plans", "selling", "commerce", "analytics", "auditLogs"]
            });

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
                { id: `monthly-${gym._id.toString().slice(-4)}`, gymId: gym._id, name: "Monthly Standard", price: 3000, duration: 30 },
                { id: `quarterly-${gym._id.toString().slice(-4)}`, gymId: gym._id, name: "Quarterly Pro", price: 8000, duration: 90 },
                { id: `yearly-${gym._id.toString().slice(-4)}`, gymId: gym._id, name: "Yearly Elite", price: 25000, duration: 365 }
            ]);

            const memberData = [];
            for (let m = 0; m < 50; m++) {
                const name = getRandomName();
                const joinDate = getRandomDate(6, 0);
                memberData.push({
                    firstName: name.first,
                    lastName: name.last,
                    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}.${m}@${gymName.toLowerCase().replace(/\s/g, "")}.com`,
                    phone: getRandomPhone(),
                    gymId: gym._id,
                    joinDate: joinDate.toISOString(),
                    trainerId: createdTrainers[m % 2]._id,
                    planId: plans[m % 3].id,
                    status: Math.random() > 0.1 ? "active" : "expired"
                });
            }
            const createdMembers = await Member.insertMany(memberData);

            // Seed Commerce Data
            const categories = await ProductCategory.insertMany([
                { gymId: gym._id, name: "Supplements", slug: "supplements", description: "High-quality protein and vitamins" },
                { gymId: gym._id, name: "Gear", slug: "gear", description: "Gym belts, straps, and gloves" },
                { gymId: gym._id, name: "Apparel", slug: "apparel", description: "Comfortable workout clothing" }
            ]);

            const brands = await ProductBrand.insertMany([
                { gymId: gym._id, name: "Optimum Nutrition", slug: "optimum-nutrition" },
                { gymId: gym._id, name: "MyProtein", slug: "myprotein" },
                { gymId: gym._id, name: "Nike", slug: "nike" }
            ]);

            const productsData = [
                { name: "Whey Protein 1kg", categoryId: categories[0]._id, brandId: brands[0]._id, price: 8500, costPrice: 6000, stockQuantity: 15, slug: "whey-protein-1kg" },
                { name: "Pre-Workout 300g", categoryId: categories[0]._id, brandId: brands[1]._id, price: 4500, costPrice: 3000, stockQuantity: 20, slug: "pre-workout-300g" },
                { name: "Gym Belt Pro", categoryId: categories[1]._id, brandId: brands[2]._id, price: 3500, costPrice: 1500, stockQuantity: 8, slug: "gym-belt-pro" },
                { name: "Training T-Shirt", categoryId: categories[2]._id, brandId: brands[2]._id, price: 2000, costPrice: 800, stockQuantity: 25, slug: "training-tshirt" }
            ];

            const createdProducts = [];
            for (const p of productsData) {
                const product = await Product.create({
                    ...p,
                    gymId: gym._id,
                    status: "active",
                    visibility: "public",
                    trackInventory: true,
                    images: [{ url: `https://placehold.co/400x400?text=${p.name}`, publicId: `seed-${p.slug}`, alt: p.name }]
                });
                createdProducts.push(product);

                await InventoryLog.create({
                    gymId: gym._id,
                    productId: product._id,
                    type: "in",
                    quantity: p.stockQuantity,
                    reason: "Initial Stocking",
                    performedBy: owner._id
                });
            }

            for (const member of createdMembers) {
                const subDate = new Date(member.joinDate);
                const plan = plans.find(p => p.id === member.planId);
                const subPrice = plan?.price || 3000;
                const subDuration = plan?.duration || 30;

                await Subscription.create({
                    memberId: member._id.toString(), planId: member.planId,
                    startDate: subDate.toISOString(), endDate: new Date(subDate.getTime() + subDuration * 24 * 60 * 60 * 1000).toISOString(),
                    status: member.status === "active" ? "active" : "expired", gymId: gym._id
                });

                // Multiple payments for some members
                const numPayments = Math.floor(Math.random() * 3) + 1;
                for (let p = 0; p < numPayments; p++) {
                    const payDate = new Date(subDate);
                    payDate.setMonth(subDate.getMonth() - p);
                    await Payment.create({
                        memberId: member._id,
                        amount: subPrice,
                        date: payDate,
                        method: Math.random() > 0.3 ? "cash" : "bank_transfer",
                        gymId: gym._id,
                        collectedBy: owner._id
                    });
                }

                // Attendance density
                const numAttendance = Math.floor(Math.random() * 15) + 5;
                for (let a = 0; a < numAttendance; a++) {
                    const attDate = getRandomDate(3, 0);
                    await Attendance.create({ gymId: gym._id, memberId: member._id, date: attDate, checkInTime: attDate, status: "present" });
                }

                // Assigned workouts for 30% of members
                if (Math.random() > 0.7) {
                    const assignedPlan = await AssignedWorkoutPlan.create({ gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, templateId: template._id, startDate: getRandomDate(), status: "active" });
                    await WorkoutLog.create({ gymId: gym._id, memberId: member._id, trainerId: createdTrainers[0]._id, planId: assignedPlan._id, date: getRandomDate(), exercises: [{ exerciseId: exercises[0]._id, setsCompleted: 3, repsCompleted: "10", weightUsed: 40 }] });
                }

                if (gymCreds.members.length < 3) {
                    gymCreds.members.push({ email: member.email, password: defaultPassword });
                }
            }

            globalCredentials.push(gymCreds);
        }

        return NextResponse.json({ message: "Seeding complete", credentials: globalCredentials }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
    }
}
