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
      
      <div class="receipt-box" style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.05);">
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
          <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
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
  }
};
