import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import AssetFolder from "@/models/AssetFolder";
import { getCache, setCache } from "@/lib/redis";

/**
 * GET /api/gallery
 * List assets and folders in a specific parent directory
 */
export async function GET(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("folderId") || null;
    const search = searchParams.get("search");

    try {
        const cacheKey = `gallery:list:gym:${session.user.gymId}:folder:${parentId || 'root'}:q:${search || 'none'}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();
        
        // ... (rest of query logic)
        const query: any = { gymId: session.user.gymId };
        const folderQuery: any = { gymId: session.user.gymId };

        if (search) {
            query.name = { $regex: search, $options: "i" };
        } else {
            query.folderId = parentId === "root" ? null : parentId;
            folderQuery.parentId = parentId === "root" ? null : parentId;
        }

        const [assets, folders, currentFolder] = await Promise.all([
            Asset.find(query).sort({ createdAt: -1 }).lean(),
            AssetFolder.find(folderQuery).sort({ name: 1 }).lean().then(async (folderList) => {
                const [assetCounts, subfolderCounts] = await Promise.all([
                    Promise.all(folderList.map(f => Asset.countDocuments({ folderId: f._id, gymId: session.user.gymId }))),
                    Promise.all(folderList.map(f => AssetFolder.countDocuments({ parentId: f._id, gymId: session.user.gymId })))
                ]);
                return folderList.map((f, i) => ({ ...f, assetCount: assetCounts[i] + subfolderCounts[i] }));
            }),
            parentId && parentId !== "root" ? AssetFolder.findOne({ _id: parentId, gymId: session.user.gymId }).lean() : Promise.resolve(null)
        ]);

        const data = { assets, folders, currentFolder };
        await setCache(cacheKey, data, 1800); // 30 min cache
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
