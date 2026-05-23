import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import ProductCategory from "@/models/ProductCategory";

const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";

interface MemberToken {
    memberId: string;
    gymId: string;
    email: string;
    type: "member";
}

function verifyMemberToken(authHeader: string | null): MemberToken | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, MEMBER_JWT_SECRET) as MemberToken;
        if (decoded.type !== "member") return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    const tokenData = verifyMemberToken(req.headers.get("authorization"));

    if (!tokenData) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    ProductCategory.init();

    try {
        await connectDB();
        
        const products = await Product.find({
            gymId: tokenData.gymId,
            status: "active"
        })
        .populate("categoryId")
        .sort({ createdAt: -1 })
        .lean();

        return NextResponse.json({ products });
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to load products" }, { status: 500 });
    }
}
