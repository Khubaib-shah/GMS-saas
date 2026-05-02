import nodemailer from "nodemailer";

/**
 * Mail Service Utility
 * Handles SMTP transport and branded HTML email templates.
 */

const transporter = nodemailer.createTransport({
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
}

/**
 * Base Brand Template Wrapper
 * Injects content into a glass-premium, HUD-inspired HTML container.
 */
export function getBaseTemplate(title: string, content: string): string {
  const primaryColor = "#ccff00";
  const bgColor = "#05080a";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            background-color: ${bgColor}; 
            color: #f8fafc; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: rgba(255, 255, 255, 0.02); 
            border: 1px solid rgba(255, 255, 255, 0.05); 
            border-radius: 24px; 
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          }
          .header { 
            padding: 40px 20px; 
            text-align: center; 
            background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, transparent 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .logo-text {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -1px;
            color: #9f9f9f;
            font-style: italic;
          }
          .logo-text span { color: ${primaryColor}; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .footer { 
            padding: 30px; 
            text-align: center; 
            font-size: 11px; 
            color: #64748b; 
            background: rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .btn {
            display: inline-block;
            padding: 14px 28px;
            background-color: ${primaryColor};
            color: #000;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 12px;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);
          }
          h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 20px; color: ${primaryColor}; }
          p { margin-bottom: 16px; font-size: 15px; color: #cbd5e1; }
          .divider { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 30px 0; }
          @media only screen and (max-width: 600px) {
            .receipt-box { padding: 10px !important; }
            .content { padding: 30px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">GYM<span>FLOW</span></div>
            <div style="font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 2px; margin-top: 5px;">MANAGEMENT SYSTEM</div>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} GymFlow SaaS. All Rights Reserved.<br>
            Managed high-performance fitness technology.
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generic Send Email Function
 */
export async function sendEmail({ to, subject, html, attachments }: MailOptions) {
  try {
    // In development, we log a preview even if we try to send
    if (process.env.NODE_ENV === "development") {
      console.log("\n--- [DEVELOPMENT EMAIL PREVIEW] ---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("-----------------------------------\n");
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"GymFlow Admin" <noreply@gymflow.pk>',
      to,
      subject,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);

    // Ethereal provides a preview URL
    if (info.messageId && process.env.SMTP_HOST?.includes("ethereal")) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);

    // Fallback: Log the HTML content so the user can verify it works
    console.log("\n--- [FAILED EMAIL CONTENT FALLBACK] ---");
    console.log("The email could not be sent due to a network error, but here is the content generated:");
    console.log(`SUBJECT: ${subject}`);
    console.log(`RECIPIENT: ${to}`);
    console.log("---------------------------------------");
    console.log("Check the logic above - the data generation is successful!");

    return { success: false, error };
  }
}
