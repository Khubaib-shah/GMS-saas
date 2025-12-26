import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    return NextResponse.json(
        { message: "Public registration is disabled. Please contact system administrator." },
        { status: 403 }
    );
}
