import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import { invalidatePattern } from "@/lib/redis";

/**
 * POST /api/gallery/upload
 * Register a new asset in the gallery after successful Cloudinary upload
 */
export async function POST(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { name, url, publicId, type, folderId, size, metadata } = body;

        if (!url || !publicId || !type) {
            return NextResponse.json({ error: "Missing required asset data" }, { status: 400 });
        }

        await connectDB();

        const asset = await Asset.create({
            gymId: session.user.gymId,
            name: name || "Untitled Asset",
            type,
            url,
            publicId,
            folderId: folderId || null,
            size,
            metadata,
            createdBy: session.user.id
        });

        // Invalidate gallery list cache for this gym
        await invalidatePattern(`gallery:list:gym:${session.user.gymId}*`);

        return NextResponse.json(asset, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
