import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "super_admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const gyms = await Gym.find().sort({ createdAt: -1 });
        return NextResponse.json(gyms);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching gyms" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== "super_admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { gymName, gymAddress, gymPhone, ownerName, ownerEmail, ownerPassword } = await req.json();

        if (!gymName || !ownerEmail || !ownerPassword) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // Check if owner email exists
        const existingUser = await User.findOne({ email: ownerEmail });
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
        }

        // Create Gym
        const newGym = await Gym.create({
            name: gymName,
            address: gymAddress,
            phone: gymPhone,
        });

        // Create Owner linked to Gym
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        const newOwner = await User.create({
            fullName: ownerName,
            email: ownerEmail,
            password: hashedPassword,
            role: "gym_owner",
            gymId: newGym._id,
        });

        return NextResponse.json(
            {
                message: "Gym created successfully",
                gym: newGym,
                owner: { id: newOwner._id, email: newOwner.email }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Gym Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
