import { NextResponse } from "next/server";
import { validatePublicApiKey } from "@/lib/public-api-auth";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

/**
 * GET /api/v1/store/products
 * Public headless API for external websites to fetch gym products.
 */
export async function GET(req: Request) {
    // Authenticate external request
    const auth = await validatePublicApiKey(req);
    if ("error" in auth) return auth.error;
    const { gymId } = auth;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    try {
        await connectDB();

        // Build query
        const query: any = { 
            gymId, 
            status: "active", // Public API only shows active products
            visibility: "public"
        };
        
        if (category) query.categoryId = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate("categoryId", "name")
                .populate("brandId", "name")
                .select("name slug shortDescription price discountPrice images thumbnail variants inventory nutritionalInfo")
                .sort({ isFeatured: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product.countDocuments(query)
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
