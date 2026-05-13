import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern, deleteCache } from "@/lib/redis";

/**
 * GET /api/products/[id]
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const cacheKey = `product:id:${id}:gym:${session.user.gymId}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();

        const product = await Product.findOne({
            _id: id,
            gymId: session.user.gymId
        }).populate("categoryId brandId").lean();

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        await setCache(cacheKey, product, 3600);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/products/[id]
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_EDIT);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        await connectDB();

        const product = await Product.findOne({
            _id: id,
            gymId: session.user.gymId
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Update product
        Object.assign(product, body);
        await product.save();

        // Invalidate Cache
        await deleteCache(`product:id:${id}:gym:${session.user.gymId}`);
        await invalidatePattern(`products:list:gym:${session.user.gymId}*`);

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "product",
                product._id.toString(),
                product.name,
                { updatedFields: Object.keys(body) },
                req.headers
            )
        );

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/products/[id]
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_DELETE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();

        const product = await Product.findOne({
            _id: id,
            gymId: session.user.gymId
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Archive instead of hard delete for data integrity
        product.status = "archived";
        await product.save();

        // Invalidate Cache
        await deleteCache(`product:id:${id}:gym:${session.user.gymId}`);
        await invalidatePattern(`products:list:gym:${session.user.gymId}*`);

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "product",
                product._id.toString(),
                product.name,
                { action: "archived" },
                req.headers
            )
        );

        return NextResponse.json({ message: "Product archived successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
