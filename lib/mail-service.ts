import nodemailer from "nodemailer";
import connectDB from "./db";
import GymSettings from "../models/GymSettings";
import path from "path";
import fs from "fs";

/**
 * Mail Service Utility
 * Handles SMTP transport and branded HTML email templates.
 */

// Global transporter (Fallback)
const globalTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  gymId?: string; // Optional gym context for dynamic SMTP
}

/**
 * Base Brand Template Wrapper
 */
export function getBaseTemplate(title: string, content: string): string {
  const primaryColor = "#ccff00";
  const bgColor = "#05080a";
  const cardBg = "#0c1015";
  const borderColor = "#1e293b";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Global resets & client overrides */
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: ${bgColor} !important;
            color: #f8fafc !important;
          }
          /* Forced high contrast for stripped clients */
          .email-body-wrapper {
            background-color: ${bgColor} !important;
            color: #f8fafc !important;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: ${cardBg} !important; 
            border: 1px solid ${borderColor} !important; 
            border-radius: 24px; 
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          }
          .header { 
            padding: 40px 20px; 
            text-align: center; 
            background: #090d12 linear-gradient(135deg, rgba(204, 255, 0, 0.08) 0%, transparent 100%) !important;
            border-bottom: 1px solid ${borderColor} !important;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -1px;
            color: #9f9f9f !important;
            font-style: italic;
          }
          .logo-text span { color: ${primaryColor} !important; }
          .content { 
            padding: 40px 30px; 
            line-height: 1.6;
            background-color: ${cardBg} !important;
            color: #cbd5e1 !important;
          }
          .footer { 
            padding: 30px; 
            text-align: center; 
            font-size: 11px; 
            color: #64748b !important; 
            background-color: #06090d !important;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-top: 1px solid ${borderColor} !important;
          }
          .btn {
            display: inline-block;
            padding: 14px 28px;
            background-color: ${primaryColor} !important;
            color: #000000 !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 12px;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);
          }
          h1 { 
            font-size: 20px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: -0.5px; 
            margin-bottom: 20px; 
            color: ${primaryColor} !important; 
          }
          p { 
            margin-bottom: 16px; 
            font-size: 15px; 
            color: #cbd5e1 !important; 
          }
          .divider { 
            height: 1px; 
            background-color: ${borderColor} !important; 
            margin: 30px 0; 
          }
          /* Make sure links inside standard classes keep high contrast */
          a {
            color: ${primaryColor} !important;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            .receipt-box { padding: 15px !important; }
            .content { padding: 30px 15px; }
          }
        </style>
      </head>
      <body style="background-color: ${bgColor}; color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; min-height: 100%; width: 100%;">
        <!-- Outer wrapper table to force solid dark background in all email clients -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-body-wrapper" style="background-color: ${bgColor}; min-height: 100%; width: 100%; margin: 0; padding: 40px 0;">
          <tr>
            <td align="center" valign="top" style="padding: 0 10px;">
              <div class="container" style="max-width: 600px; width: 100%; background-color: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 24px; overflow: hidden; text-align: left;">
                <div class="header" style="padding: 30px 20px; text-align: center; background-color: #090d12; border-bottom: 1px solid ${borderColor};">
                  <img src="cid:gymflow-logo" alt="GymFlow Logo" style="height: 50px; width: auto; max-width: 250px; display: block; margin: 0 auto; object-fit: contain;" />
                </div>
                <div class="content" style="padding: 40px 30px; background-color: ${cardBg}; color: #cbd5e1;">
                  <h1 style="color: ${primaryColor}; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 800; text-transform: uppercase;">${title}</h1>
                  ${content}
                </div>
                <div class="footer" style="padding: 30px; text-align: center; font-size: 11px; color: #64748b; background-color: #06090d; border-top: 1px solid ${borderColor};">
                  &copy; ${new Date().getFullYear()} GymFlow SaaS. All Rights Reserved.<br>
                  Managed high-performance fitness technology.
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Generic Send Email Function with Dynamic SMTP support
 */
export async function sendEmail({ to, subject, html, attachments = [], gymId }: MailOptions) {
  try {
    let transporter = globalTransporter;
    let from = process.env.EMAIL_FROM || '"GymFlow Admin" <noreply@gymflow.pk>';

    // Automatically inject the branding logo inline attachment if not already provided
    const hasLogo = attachments.some(att => att.cid === "gymflow-logo");
    if (!hasLogo) {
      const logoPath = path.join(process.cwd(), "public/assets/logo/left&right.png");
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: "logo.png",
          path: logoPath,
          cid: "gymflow-logo",
        });
      } else {
        console.warn(`[MailService] Branding logo not found at: ${logoPath}. Falling back without inline logo.`);
      }
    }

    // If gymId is provided, try to use custom SMTP settings
    if (gymId) {
      await connectDB();
      const settings = await GymSettings.findOne({ gymId } as any).lean();
      
      if (settings?.email?.host && settings?.email?.user) {
        console.log(`[MailService] Using custom SMTP for Gym: ${gymId}`);
        transporter = nodemailer.createTransport({
          host: settings.email.host,
          port: settings.email.port || 587,
          secure: settings.email.secure || false,
          auth: {
            user: settings.email.user,
            pass: settings.email.pass,
          },
        });
        
        const fromName = settings.email.fromName || "Gym Notifications";
        const fromEmail = settings.email.fromEmail || settings.email.user;
        from = `"${fromName}" <${fromEmail}>`;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("\n--- [DEVELOPMENT EMAIL PREVIEW] ---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${from}`);
      console.log(`Attachments: ${attachments.map(att => att.filename).join(", ")}`);
      console.log("-----------------------------------\n");
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
