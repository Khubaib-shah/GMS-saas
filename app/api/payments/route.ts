import connectDB from "@/lib/db";
import { CreatePaymentSchema } from "@/lib/validations";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import GymSettings from "@/models/GymSettings";
import Member from "@/models/Member";
import { sendEmail } from "@/lib/mail-service";
import { EmailTemplates } from "@/lib/email-templates";

export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.PAYMENTS_VIEW);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    const gymId = session.user.gymId;
    const cacheKey = `payments:list:gym:${gymId}`;

    try {
        const cachedPayments = await getCache<any[]>(cacheKey);
        if (cachedPayments) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedPayments);
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();
        const payments = await Payment.find(buildGymQuery(session, {
            deletedAt: null
        })).sort({ date: -1 });

        await setCache(cacheKey, payments, 1800);

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching payments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();

        // ── Zod Validation (Mass Assignment Protection) ──
        const parsed = CreatePaymentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = parsed.data;
        await connectDB();

        const payment = await new Payment({
            memberId: data.memberId,
            amount: data.amount,
            date: data.date,
            method: data.method,
            description: data.description,
            receiptUrl: data.receiptUrl || undefined,
            receiptNumber: data.receiptNumber,
            collectedBy: data.collectedBy,
            notes: data.notes,
            gymId: session.user.gymId,
            branchId: data.branchId || session.user.branchId,
        }).save();

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "payment",
                payment._id.toString(),
                (body.amount || 0).toString(),
                { payment: body },
                req.headers
            )
        );

        // Invalidate cache
        await invalidatePattern(`payments:list:gym:${session.user.gymId}`);

        // Send Email Notification
        try {
            console.log(`[Email Debug] Checking settings for Gym: ${session.user.gymId}`);
            const Gym = require("@/models/Gym").default;
            const [settings, member, gym] = await Promise.all([
                GymSettings.findOne({ gymId: session.user.gymId }).lean(),
                Member.findById(body.memberId).lean(),
                Gym.findById(session.user.gymId).select("name").lean()
            ]);

            const canSend = settings?.notifications?.sendInvoiceEmail;
            const hasEmail = !!member?.email;

            if (canSend && hasEmail) {
                const planName = body.description?.includes(':')
                    ? body.description.split(':')[1].split('(')[0].trim()
                    : "Membership Subscription";

                console.log(`[Email Debug] Attempting to send dynamic receipt to ${member?.email}...`);
                const html = EmailTemplates.paymentReceipt({
                    memberName: member?.firstName || "Member",
                    amount: payment.amount,
                    planName,
                    date: payment.date,
                    gymName: gym?.name || "Our Gym",
                    paymentId: payment._id.toString()
                });

                const mailResult = await sendEmail({
                    to: member?.email!,
                    subject: `Payment Receipt - ${gym?.name || 'GymFlow'}`,
                    html,
                    gymId: session.user.gymId // Enable custom SMTP
                });
                console.log(`[Email Debug] Send Result:`, mailResult);
            }
        } catch (mailError) {
            console.error("[Email Debug] Failed to send invoice email:", mailError);
        }

        return NextResponse.json(payment.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ message: "Error creating payment" }, { status: 500 });
    }
}
