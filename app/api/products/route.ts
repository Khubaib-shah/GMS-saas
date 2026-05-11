import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export async function GET(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const gymId = session.user.gymId;
        const cacheKey = `products:list:gym:${gymId}`;

        const cached = await getCache<{ products: any[] }>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();
        const products = await Product.find({ 
            gymId,
            status: { $ne: "archived" }
        })
        .populate("categoryId brandId")
        .sort({ createdAt: -1 })
        .lean();
        
        const data = { products };
        await setCache(cacheKey, data, 3600); // 1 hour cache
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        const product = new Product({
            ...body,
            gymId: session.user.gymId,
            createdBy: session.user.id
        });
        await product.save();

        // Invalidate Cache
        await invalidatePattern(`products:list:gym:${session.user.gymId}*`);

        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "product",
                product._id.toString(),
                product.name,
                { sku: product.sku, price: product.price },
                req.headers
            )
        );

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
