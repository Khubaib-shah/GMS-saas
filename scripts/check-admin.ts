
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import User from "../models/User";

function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
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

async function checkAdmin() {
    loadEnv();
    const MONGODB_URL = process.env.MONGODB_URL;
    if (!MONGODB_URL) {
        console.error("MONGODB_URL not found");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URL);
        const admins = await User.find({ role: "super_admin" });
        console.log(`Found ${admins.length} super admins:`);
        admins.forEach(a => console.log(`- ${a.email} (${a.fullName})`));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

checkAdmin();
