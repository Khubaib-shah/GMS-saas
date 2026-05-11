import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import ProductCategory from "@/models/ProductCategory";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/products/categories/[id]
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
        await connectDB();
        const category = await ProductCategory.findOne({
            _id: id,
            gymId: session.user.gymId
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/products/categories/[id]
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

        const category = await ProductCategory.findOneAndUpdate(
            { _id: id, gymId: session.user.gymId },
            { $set: body },
            { new: true }
        );

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "product_category",
                category._id.toString(),
                category.name,
                { updatedFields: Object.keys(body) },
                req.headers
            )
        );

        return NextResponse.json(category);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/products/categories/[id]
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
        const category = await ProductCategory.findOne({
            _id: id,
            gymId: session.user.gymId
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if category has products
        const Product = require("@/models/Product").default;
        const productCount = await Product.countDocuments({ categoryId: id });
        
        if (productCount > 0) {
            return NextResponse.json({ 
                error: "Cannot delete category with associated products. Move products to another category first." 
            }, { status: 400 });
        }

        await ProductCategory.deleteOne({ _id: id });

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "product_category",
                category._id.toString(),
                category.name,
                {},
                req.headers
            )
        );

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
