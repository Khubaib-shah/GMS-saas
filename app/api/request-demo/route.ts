import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, gymName, members, message } = body;

        if (!firstName || !lastName || !email || !gymName) {
            return NextResponse.json(
                { error: "Please fill in all required fields." },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false, // STARTTLS on port 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"GymFlow Demo Requests" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // send to yourself
            replyTo: email,
            subject: `New Demo Request from ${firstName} ${lastName} — ${gymName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f1a2e; color: #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #a3e635; margin-bottom: 4px;">New Demo Request</h2>
                    <p style="color: #94a3b8; margin-top: 0;">Submitted via the GymFlow landing page</p>
                    <hr style="border-color: #1e293b; margin: 20px 0;" />

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8; width: 160px; vertical-align: top;">Name</td>
                            <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${firstName} ${lastName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Email</td>
                            <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Gym/Studio</td>
                            <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${gymName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Active Members</td>
                            <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${members || "Not specified"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Message</td>
                            <td style="padding: 8px 0; color: #f1f5f9;">${message || "—"}</td>
                        </tr>
                    </table>
                    <hr style="border-color: #1e293b; margin: 20px 0;" />
                    <p style="color: #64748b; font-size: 12px;">Reply directly to this email to respond to ${firstName}.</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[request-demo] Failed to send email:", error);
        return NextResponse.json(
            { error: "Failed to send your request. Please try again." },
            { status: 500 }
        );
    }
}
