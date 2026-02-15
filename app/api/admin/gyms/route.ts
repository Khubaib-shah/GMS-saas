import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "super_admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const gyms = await Gym.find().sort({ createdAt: -1 });
        return NextResponse.json(gyms, { status: 200 });
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

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "super_admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, isPremium } = await req.json();

        if (!id || !isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid Gym ID" }, { status: 400 });
        }

        await connectDB();
        const updatedGym = await Gym.findByIdAndUpdate(
            id,
            { isPremium },
            { new: true }
        );

        if (!updatedGym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: `Gym premium status updated to ${isPremium}`,
            gym: updatedGym
        });
    } catch (error) {
        console.error("Update Gym Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "super_admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id || !isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid Gym ID" }, { status: 400 });
        }

        await connectDB();

        const gym = await Gym.findById(id);
        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        // Cascade delete all associated data
        const mongoose = await import("mongoose");
        const Member = (await import("@/models/Member")).default;
        const Subscription = (await import("@/models/Subscription")).default;
        const Payment = (await import("@/models/Payment")).default;
        const Plan = (await import("@/models/Plan")).default;
        const Attendance = (await import("@/models/Attendance")).default;
        const AuditLog = (await import("@/models/AuditLog")).default;

        await Promise.all([
            Member.deleteMany({ gymId: id }),
            Subscription.deleteMany({ gymId: id }),
            Payment.deleteMany({ gymId: id }),
            Plan.deleteMany({ gymId: id }),
            User.deleteMany({ gymId: id }),
            Attendance.deleteMany({ gymId: id }),
            AuditLog.deleteMany({ gymId: id }),
        ]);

        await Gym.findByIdAndDelete(id);

        return NextResponse.json({ message: "Gym and all associated data deleted successfully" });
    } catch (error) {
        console.error("Delete Gym Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
