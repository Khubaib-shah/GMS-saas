import mongoose from "mongoose";
import fs from "fs";
import path from "path";

function loadEnv() {
    const filePath = path.join(process.cwd(), ".env");
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

loadEnv();
const url = process.env.MONGODB_URL;
console.log("Connecting to:", url);

async function test() {
    try {
        await mongoose.connect(url!);
        console.log("SUCCESS: Connected to MongoDB");
        await mongoose.connection.close();
    } catch (e) {
        console.error("FAILURE: Could not connect to MongoDB");
        console.error(e);
        process.exit(1);
    }
}

test();
