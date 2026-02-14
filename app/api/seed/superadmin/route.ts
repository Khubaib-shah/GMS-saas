import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * Seed Superadmin API Endpoint
 * POST /api/seed/superadmin
 * 
 * Creates a superadmin user for initial setup
 * This endpoint can be used to recover access if superadmin is deleted
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, fullName, confirmSecret } = body;

        // Simple security measure - require a secret confirmation
        // You can change this to any secret value
        const SEED_SECRET = process.env.SEED_SECRET || "create-superadmin-2024";

        if (confirmSecret !== SEED_SECRET) {
            return NextResponse.json(
                { message: "Invalid secret. Set SEED_SECRET in body or environment." },
                { status: 403 }
            );
        }

        await connectDB();

        // Check if superadmin with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                {
                    message: "User with this email already exists",
                    userId: existingUser._id,
                    role: existingUser.role
                },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create superadmin
        const superadmin = await User.create({
            fullName: fullName || "Super Admin",
            email,
            password: hashedPassword,
            role: "super_admin",
            isActive: true,
        });

        return NextResponse.json(
            {
                message: "Superadmin created successfully",
                user: {
                    id: superadmin._id,
                    email: superadmin.email,
                    fullName: superadmin.fullName,
                    role: superadmin.role,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Seed Superadmin Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: String(error) },
            { status: 500 }
        );
    }
}
