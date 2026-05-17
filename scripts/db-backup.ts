/**
 * GMS SaaS — Daily Database Backup Script
 *
 * Creates a gzipped mongodump archive and optionally uploads it to AWS S3.
 *
 * USAGE:
 *   npx ts-node --project tsconfig.seed.json scripts/db-backup.ts
 *
 * ENVIRONMENT VARIABLES:
 *   Required:
 *     MONGODB_URL              — MongoDB connection string
 *   Optional (for S3 upload):
 *     BACKUP_S3_BUCKET         — S3 bucket name (e.g. "gms-saas-backups")
 *     BACKUP_AWS_REGION        — AWS region (default: "us-east-1")
 *     BACKUP_AWS_ACCESS_KEY_ID — AWS access key
 *     BACKUP_AWS_SECRET_ACCESS_KEY — AWS secret key
 *
 * SCHEDULING:
 *   Add to your deployment platform's cron (e.g. Vercel Cron, Railway, or system crontab):
 *     0 3 * * * cd /path/to/project && npx ts-node scripts/db-backup.ts
 */

import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execPromise = promisify(exec);

const MONGODB_URL = process.env.MONGODB_URL;
const BACKUP_DIR = path.join(process.cwd(), "backups");
const S3_BUCKET = process.env.BACKUP_S3_BUCKET;
const MAX_LOCAL_BACKUPS = 7; // Keep last 7 local backups

async function cleanOldBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith("gms-backup-") && f.endsWith(".gz"))
        .sort()
        .reverse();

    // Remove backups beyond retention limit
    for (let i = MAX_LOCAL_BACKUPS; i < files.length; i++) {
        const filePath = path.join(BACKUP_DIR, files[i]);
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Removed old backup: ${files[i]}`);
    }
}

async function uploadToS3(archivePath: string, archiveName: string) {
    try {
        // Dynamic import to avoid requiring @aws-sdk/client-s3 when not using S3
        // @ts-ignore — Optional dependency: install with `npm i @aws-sdk/client-s3` when S3 uploads are needed
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

        const s3 = new S3Client({
            region: process.env.BACKUP_AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.BACKUP_AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.BACKUP_AWS_SECRET_ACCESS_KEY || "",
            },
        });

        const fileStream = fs.createReadStream(archivePath);
        const uploadCommand = new PutObjectCommand({
            Bucket: S3_BUCKET!,
            Key: `db-backups/${archiveName}`,
            Body: fileStream,
        });

        await s3.send(uploadCommand);
        console.log(`[S3] Backup uploaded: db-backups/${archiveName}`);
    } catch (error) {
        console.error("[S3] Upload failed:", error);
        console.log("[S3] Local backup retained as fallback.");
    }
}

async function runBackup() {
    console.log("═══════════════════════════════════════════");
    console.log(" GMS SaaS — Database Backup");
    console.log(`  Time: ${new Date().toISOString()}`);
    console.log("═══════════════════════════════════════════");

    if (!MONGODB_URL) {
        console.error("[FATAL] MONGODB_URL is not defined in environment variables.");
        process.exit(1);
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveName = `gms-backup-${timestamp}.gz`;
    const archivePath = path.join(BACKUP_DIR, archiveName);

    try {
        console.log(`[Dump] Starting mongodump...`);
        const dumpCommand = `mongodump --uri="${MONGODB_URL}" --archive="${archivePath}" --gzip`;
        const { stdout, stderr } = await execPromise(dumpCommand);

        if (stderr) console.log("[mongodump stderr]:", stderr);
        console.log(`[Dump] Archive created: ${archivePath}`);

        // Get file size
        const stats = fs.statSync(archivePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`[Dump] Archive size: ${sizeMB} MB`);

        // Upload to S3 if configured
        if (S3_BUCKET) {
            await uploadToS3(archivePath, archiveName);
        } else {
            console.log("[S3] Skipped — BACKUP_S3_BUCKET not configured. Local backup retained.");
        }

        // Cleanup old local backups
        await cleanOldBackups();

        console.log("\n Backup completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("[FATAL] Backup failed:", error);
        process.exit(1);
    }
}

// runBackup();
