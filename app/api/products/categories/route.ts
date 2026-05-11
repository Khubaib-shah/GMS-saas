import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import ProductCategory from "@/models/ProductCategory";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

export async function GET(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();
        const categories = await ProductCategory.find({ gymId: session.user.gymId }).sort({ sortOrder: 1, name: 1 });
        return NextResponse.json(categories);
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

        const category = new ProductCategory({
            ...body,
            gymId: session.user.gymId
        });
        await category.save();

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "product_category",
                category._id.toString(),
                category.name,
                { slug: category.slug },
                req.headers
            )
        );

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
