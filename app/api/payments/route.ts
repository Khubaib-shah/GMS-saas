import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
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
        await connectDB();
        const payment = await new Payment({
            ...body,
            gymId: session.user.gymId,
            branchId: body.branchId || session.user.branchId
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
            const [settings, member] = await Promise.all([
                GymSettings.findOne({ gymId: session.user.gymId }).lean(),
                Member.findById(body.memberId).lean()
            ]);

            const canSend = settings?.notifications?.sendInvoiceEmail;
            const hasEmail = !!member?.email;

            console.log(`[Email Debug] Settings Found: ${!!settings}, Send Enabled: ${canSend}, Member Email: ${member?.email || 'N/A'}`);

            if (canSend && hasEmail) {
                // Extract plan name from description if possible
                const planName = body.description?.includes(':')
                    ? body.description.split(':')[1].split('(')[0].trim()
                    : "Membership Subscription";

                console.log(`[Email Debug] Attempting to send branded receipt to ${member?.email}...`);
                const html = EmailTemplates.paymentReceipt({
                    memberName: member?.firstName || "Member",
                    amount: payment.amount,
                    planName,
                    date: payment.date,
                    gymName: (settings as any)?.general?.name || "Our Gym",
                    paymentId: payment._id.toString()
                });

                const mailResult = await sendEmail({
                    to: member?.email!,
                    subject: `Payment Receipt - ${(settings as any)?.general?.name || 'GymFlow'}`,
                    html
                });
                console.log(`[Email Debug] Send Result:`, mailResult);
            } else {
                console.log(`[Email Debug] Skipping email: ${!canSend ? 'Notification disabled in settings' : 'Member has no email'}`);
            }
        } catch (mailError) {
            console.error("[Email Debug] Failed to send invoice email:", mailError);
            // We don't fail the request if email fails
        }

        return NextResponse.json(payment.toJSON(), { status: 201 });
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ message: "Error creating payment" }, { status: 500 });
    }
}
