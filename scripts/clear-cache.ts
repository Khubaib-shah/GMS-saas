import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

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

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function clearCache() {
    if (!redisUrl || !redisToken) {
        console.log("No Redis configuration found. Skipping cache clear.");
        return;
    }

    const redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });

    try {
        console.log("Flushing Redis cache...");
        await redis.flushdb();
        console.log("Redis cache cleared successfully.");
    } catch (error) {
        console.error("Failed to clear Redis cache:", error);
    }
}

clearCache();
