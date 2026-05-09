import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/api-middleware";

/**
 * POST /api/upload
 * Handles file uploads to Cloudinary via server-side utility
 */
export async function POST(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "general";
        const resourceType = (formData.get("resourceType") as "image" | "video" | "auto") || "auto";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // ── Security: File size limits ──
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10 MB
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024;   // 100 MB
        const isVideoType = file.type.startsWith("video/");
        const maxSize = isVideoType ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

        if (file.size > maxSize) {
            const limitMB = Math.round(maxSize / 1024 / 1024);
            return NextResponse.json(
                { error: `File too large. Maximum ${limitMB}MB for ${isVideoType ? "videos" : "images"}.` },
                { status: 413 }
            );
        }

        // ── Security: Allowed file types ──
        const ALLOWED_TYPES = [
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "video/mp4", "video/webm", "video/quicktime", "video/x-m4v"
        ];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type "${file.type}" is not allowed.` },
                { status: 415 }
            );
        }

        // Convert file to base64 for Cloudinary SDK
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Perform upload using our utility
        const result = await uploadToCloudinary(fileBase64, folder, resourceType);

        return NextResponse.json({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resourceType: result.resource_type
        });
    } catch (error: any) {
        console.error("Server-side Upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
