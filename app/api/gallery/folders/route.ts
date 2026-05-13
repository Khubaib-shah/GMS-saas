import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import AssetFolder from "@/models/AssetFolder";
import { invalidatePattern } from "@/lib/redis";

/**
 * POST /api/gallery/folders
 * Create a new asset folder
 */
export async function POST(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { name, parentId } = await req.json();
        
        if (!name) {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        await connectDB();

        const folder = await AssetFolder.create({
            name,
            parentId: parentId || null,
            gymId: session.user.gymId,
            createdBy: session.user.id
        });

        // Invalidate gallery list cache for this gym
        await invalidatePattern(`gallery:list:gym:${session.user.gymId}*`);

        return NextResponse.json(folder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/gallery/folders/[id]
 * Delete a folder (and handle its contents - simplified here for now)
 */
// NOTE: DELETE logic would normally go in a dynamic route [id]
// For simplicity in this implementation plan, we'll focus on POST.
