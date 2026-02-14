import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo } from "@/lib/audit";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

/**
 * POST /api/member-portal/setup - Enable portal access for a member
 * Body: { memberId, password?, pin?, generateQrCode? }
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_EDIT);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { memberId, password, pin, generateQrCode } = body;

        if (!memberId) {
            return NextResponse.json({ message: "Member ID is required" }, { status: 400 });
        }

        // At least one auth method required
        if (!password && !pin) {
            return NextResponse.json({ message: "Password or PIN is required" }, { status: 400 });
        }

        await connectDB();

        const query = buildGymQuery(session, { _id: memberId, deletedAt: null });
        const member = await Member.findOne(query);

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        const updates: Record<string, any> = {
            portalEnabled: true,
        };

        // Hash and set password if provided
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
            }
            updates.portalPassword = await bcrypt.hash(password, 10);
        }

        // Hash and set PIN if provided
        if (pin) {
            if (!/^\d{4,6}$/.test(pin)) {
                return NextResponse.json({ message: "PIN must be 4-6 digits" }, { status: 400 });
            }
            updates.portalPin = await bcrypt.hash(pin, 10);
        }

        // Generate QR code if requested
        if (generateQrCode && !member.qrCode) {
            updates.qrCode = `GMS-${member._id.toString()}-${randomBytes(4).toString("hex")}`;
        }

        await Member.updateOne({ _id: memberId }, { $set: updates });

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "enable_portal",
            resource: "member",
            resourceId: memberId,
            resourceName: `${member.firstName} ${member.lastName || ""}`.trim(),
            details: {
                passwordSet: !!password,
                pinSet: !!pin,
                qrCodeGenerated: !!generateQrCode,
            },
            branchId: session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({
            message: "Portal access enabled",
            qrCode: updates.qrCode || member.qrCode,
        });
    } catch (error) {
        console.error("Portal setup error:", error);
        return NextResponse.json({ message: "Error setting up portal access" }, { status: 500 });
    }
}

/**
 * DELETE /api/member-portal/setup - Disable portal access for a member
 */
export async function DELETE(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_EDIT);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");

        if (!memberId) {
            return NextResponse.json({ message: "Member ID is required" }, { status: 400 });
        }

        await connectDB();

        const query = buildGymQuery(session, { _id: memberId, deletedAt: null });
        const member = await Member.findOne(query);

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        await Member.updateOne(
            { _id: memberId },
            {
                $set: { portalEnabled: false },
                $unset: { portalPassword: "", portalPin: "" },
            }
        );

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "disable_portal",
            resource: "member",
            resourceId: memberId,
            resourceName: `${member.firstName} ${member.lastName || ""}`.trim(),
            details: {},
            branchId: session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({ message: "Portal access disabled" });
    } catch (error) {
        console.error("Portal disable error:", error);
        return NextResponse.json({ message: "Error disabling portal access" }, { status: 500 });
    }
}
