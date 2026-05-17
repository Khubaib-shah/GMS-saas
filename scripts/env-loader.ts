import fs from "fs";
import path from "path";

function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf8");
            for (let line of content.split("\n")) {
                line = line.trim();
                if (!line || line.startsWith("#") || !line.includes("=")) continue;
                const [key, ...valueParts] = line.split("=");
                const value = valueParts.join("=").trim().replace(/^["'](.*)["']$/, "$1");
                const cleanKey = key.trim();
                if (cleanKey && value && !process.env[cleanKey]) {
                    process.env[cleanKey] = value;
                }
            }
        }
    }
}

loadEnv();
