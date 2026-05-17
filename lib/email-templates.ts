import { getBaseTemplate } from "./mail-service";
import { formatCurrency, formatDate } from "./utils/file-utils";

// Email Templates Library
// Generates branded HTML content for various notifications.

export const EmailTemplates = {
  // Invoice Receipt Template
  paymentReceipt: (data: {
    memberName: string;
    amount: number;
    planName: string;
    date: string;
    gymName: string;
    paymentId: string;
  }) => {
    const content = `
      <p>Hello <strong>${data.memberName}</strong>,</p>
      <p>Thank you for your payment. Your subscription for <strong>${data.planName}</strong> has been successfully processed.</p>
      
      <div class="receipt-box" style="background-color: #11161d !important; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #1e293b !important;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Transaction ID</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px; font-family: monospace;">#${data.paymentId.slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Date</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px;">${formatDate(data.date)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Membership</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px;">${data.planName}</td>
          </tr>
          <tr style="border-top: 1px solid #1e293b !important;">
            <td style="color: #9f9f9f; font-weight: 900; padding-top: 15px; font-size: 16px;">Total Paid</td>
            <td style="text-align: right; color: #ccff00; font-weight: 900; padding-top: 15px; font-size: 20px;">${formatCurrency(data.amount)}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <a href="#" class="btn">View Digital Receipt</a>
      </p>
      
      <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
        If you have any questions regarding this transaction, please contact <strong>${data.gymName}</strong> management.
      </p>
    `;

    return getBaseTemplate("Payment Receipt", content);
  },

  // Expiry Reminder Template
  expiryReminder: (data: {
    memberName: string;
    planName: string;
    expiryDate: string;
    gymName: string;
    daysRemaining: number;
  }) => {
    const content = `
      <p>Hello <strong>${data.memberName}</strong>,</p>
      <p>This is a friendly reminder from <strong>${data.gymName}</strong>. Your current membership for <strong>${data.planName}</strong> is set to expire in <strong>${data.daysRemaining} days</strong>.</p>
      
      <div style="background: rgba(255,165,0,0.05); border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid rgba(255,165,0,0.2);">
        <p style="color: #ffa500; font-weight: bold; margin: 0; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
          Subscription Ends: ${formatDate(data.expiryDate)}
        </p>
      </div>

      <p>To ensure uninterrupted access to the gym and maintain your training streak, please renew your subscription before the expiry date.</p>

      <p style="text-align: center;">
        <a href="#" class="btn">Renew Membership Now</a>
      </p>

      <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
        Stay strong and keep pushing your limits!<br>
        — The ${data.gymName} Team
      </p>
    `;

    return getBaseTemplate("Membership Expiring Soon", content);
  },

  // ── Gym Owner Welcome (SaaS Onboarding) ──
  ownerWelcome: (data: {
    ownerName: string;
    gymName: string;
    planName: string;
    expiryDate: string;
    loginUrl: string;
  }) => {
    const content = `
      <p>Hello <strong>${data.ownerName}</strong>,</p>
      <p>Welcome to <strong>GymFlow</strong>! We are thrilled to partner with you to help streamline, scale, and elevate your fitness facility operations.</p>
      
      <p>Your subscription is now active. We've set up your secure tenant space with the details below:</p>

      <div class="receipt-box" style="background-color: #11161d !important; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #1e293b !important;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Facility Name</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px; font-weight: bold;">${data.gymName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">SaaS Plan</td>
            <td style="text-align: right; color: #ccff00; padding-bottom: 10px; font-weight: bold;">${data.planName} Plan</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Renewal Date</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px;">${formatDate(data.expiryDate)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Status</td>
            <td style="text-align: right; color: #ccff00; padding-bottom: 10px; font-weight: bold;">Active </td>
          </tr>
        </table>
      </div>

      <p>You can now access your administrative portal, manage your branches, set up membership plans, onboard staff, and configure dynamic check-ins.</p>

      <p style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="${data.loginUrl}" class="btn" style="background-color: #ccff00 !important; color: #000000 !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 12px; display: inline-block;">Access Admin Dashboard</a>
      </p>

      <div class="privacy-box" style="background-color: #06090d !important; border-radius: 12px; padding: 15px; margin-top: 30px; border: 1px solid #1e293b !important; font-size: 11px; color: #64748b; line-height: 1.4;">
        <strong>🔒 Privacy & Data Protection Notice:</strong><br>
        This email contains confidential information related to your enterprise account at GymFlow. We process your data in accordance with our Privacy Policy and applicable data protection regulations. We never share your personal or payment details with third parties. Under relevant privacy laws, you have the right to access, rectify, or request erasure of your data at any time. For privacy inquiries or to manage your communication preferences, contact our Data Protection Officer at <a href="mailto:gymflow@gmail.com" style="color: #ccff00 !important; text-decoration: none;">gymflow@gmail.com</a>.
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
        Welcome aboard!<br>
        — The GymFlow SaaS Team
      </p>
    `;

    return getBaseTemplate("Welcome to GymFlow!", content);
  },

  // ── Gym Member Welcome (Tenant Onboarding) ──
  memberWelcome: (data: {
    memberName: string;
    gymName: string;
    planName: string;
    email: string;
    portalUrl: string;
  }) => {
    const content = `
      <p>Hello <strong>${data.memberName}</strong>,</p>
      <p>Welcome to <strong>${data.gymName}</strong>! We are absolutely thrilled to have you join our community and are excited to support you on your fitness journey.</p>
      
      <p>Your membership is active and your account is set up. Below is a summary of your registration details:</p>

      <div class="receipt-box" style="background-color: #11161d !important; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #1e293b !important;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Facility</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px; font-weight: bold;">${data.gymName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Membership Plan</td>
            <td style="text-align: right; color: #ccff00; padding-bottom: 10px; font-weight: bold;">${data.planName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Portal Email</td>
            <td style="text-align: right; color: #9f9f9f; padding-bottom: 10px; font-family: monospace;">${data.email}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 10px;">Portal Status</td>
            <td style="text-align: right; color: #ccff00; padding-bottom: 10px; font-weight: bold;">Setup Complete</td>
          </tr>
        </table>
      </div>

      <p>You can now log in to your personal Member Portal to view your dynamic QR check-in code, track subscription status, and view logs.</p>

      <p style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="${data.portalUrl}" class="btn" style="background-color: #ccff00 !important; color: #000000 !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 12px; display: inline-block;">Login to Member Portal</a>
      </p>

      <div class="privacy-box" style="background-color: #06090d !important; border-radius: 12px; padding: 15px; margin-top: 30px; border: 1px solid #1e293b !important; font-size: 11px; color: #64748b; line-height: 1.4;">
        <strong>🔒 Privacy & GDPR Notice:</strong><br>
        Your privacy is extremely important to us. Your membership data is securely stored on behalf of <strong>${data.gymName}</strong> via GymFlow. We process your contact information and workout history solely to facilitate membership access. We do not sell your personal health records or contact info. You have full rights to request a copy of your records, restrict processing, or request account deletion. For any privacy requests or to modify your communication preferences, contact the gym management or email <a href="mailto:privacy@gymflow.pk" style="color: #ccff00 !important; text-decoration: none;">privacy@gymflow.pk</a>.
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
        Train hard, stay consistent!<br>
        — The ${data.gymName} Team
      </p>
    `;

    return getBaseTemplate("Welcome to the Gym!", content);
  }
};
