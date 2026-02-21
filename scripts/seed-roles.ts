/**
 * Seed Default System Roles
 *
 * Run: npx tsx scripts/seed-roles.ts
 *
 * Creates the 4 default system roles (owner, manager, trainer, receptionist)
 * for every gym that doesn't already have them.
 * Also seeds default PlatformSettings and GymSettings documents.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Import models
import Role from "../models/Role";
import GymSettings from "../models/GymSettings";
import PlatformSettings from "../models/PlatformSettings";
import SubscriptionPlan from "../models/SubscriptionPlan";
import Gym from "../models/Gym";

import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "../lib/permissions";

const MONGODB_URI = process.env.MONGODB_URI || "";

interface SystemRoleSeed {
    name: string;
    permissions: string[];
    description: string;
}

const SYSTEM_ROLES: SystemRoleSeed[] = [
    {
        name: "owner",
        permissions: ALL_PERMISSIONS as unknown as string[],
        description: "Full access to everything. Cannot be deleted.",
    },
    {
        name: "manager",
        permissions: ROLE_PERMISSIONS.manager as unknown as string[],
        description: "Manages members, subscriptions, payments, and staff.",
    },
    {
        name: "trainer",
        permissions: ROLE_PERMISSIONS.trainer as unknown as string[],
        description: "View members, manage attendance.",
    },
    {
        name: "receptionist",
        permissions: ROLE_PERMISSIONS.receptionist as unknown as string[],
        description: "Front desk operations — check-in, payments, member registration.",
    },
];

async function seedRoles() {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected.");

    // 1. Seed PlatformSettings (singleton)
    const existing = await PlatformSettings.findOne();
    if (!existing) {
        await PlatformSettings.create({});
        console.log("📋 Created default PlatformSettings.");
    } else {
        console.log("📋 PlatformSettings already exists.");
    }

    // 2. Find all gyms
    const gyms = await Gym.find({});
    console.log(`🏋️ Found ${gyms.length} gym(s).`);

    for (const gym of gyms) {
        const gymId = gym._id;
        console.log(`\n--- Gym: ${gym.name} (${gymId}) ---`);

        // 3. Seed system roles for this gym
        for (const role of SYSTEM_ROLES) {
            const existingRole = await Role.findOne({ gymId, name: role.name });
            if (!existingRole) {
                await Role.create({
                    name: role.name,
                    gymId,
                    permissions: role.permissions,
                    isSystemRole: true,
                    description: role.description,
                });
                console.log(`  ✅ Created role: ${role.name}`);
            } else {
                // Optionally update permissions for existing system roles to sync
                existingRole.permissions = role.permissions;
                existingRole.description = role.description;
                await existingRole.save();
                console.log(`  ♻️  Synced role: ${role.name}`);
            }
        }

        // 4. Seed GymSettings
        const existingSettings = await GymSettings.findOne({ gymId });
        if (!existingSettings) {
            await GymSettings.create({
                gymId,
                general: {
                    name: gym.name,
                    address: gym.address || "",
                },
            });
            console.log(`  📋 Created GymSettings.`);
        } else {
            console.log(`  📋 GymSettings already exists.`);
        }

        // 5. Seed SubscriptionPlan (Basic by default)
        const existingPlan = await SubscriptionPlan.findOne({ gymId });
        if (!existingPlan) {
            await SubscriptionPlan.create({
                gymId,
                tierName: "Basic",
                active: true,
                enabledFeatures: ["members", "subscriptions", "payments", "attendance"],
            });
            console.log(`  💳 Created default SubscriptionPlan (Basic).`);
        } else {
            console.log(`  💳 SubscriptionPlan already exists.`);
        }
    }

    console.log("\n🎉 Seeding complete!");
    await mongoose.disconnect();
    process.exit(0);
}

seedRoles().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
