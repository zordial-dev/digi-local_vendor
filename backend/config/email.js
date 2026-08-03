const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a subscription expiry alert email to a vendor.
 * @param {Object} vendor - { vendor_name, store_name, email, end_date }
 * @param {number} daysLeft - Days remaining until expiry (negative = already expired)
 */
const sendSubscriptionExpiryEmail = async (vendor, daysLeft) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
        console.log(`[Email Skipped] No email configured. Would send to: ${vendor.email} (${daysLeft} days left)`);
        return;
    }

    const isExpired = daysLeft <= 0;
    const subject = isExpired
        ? `⚠️ DigiLocal Subscription Expired – ${vendor.store_name}`
        : `🔔 DigiLocal Subscription Expiring in ${daysLeft} Day${daysLeft === 1 ? '' : 's'} – ${vendor.store_name}`;

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#FAF9F6; padding:30px; color:#0A1428;">
      <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; border:1px solid #e0d5c3; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div style="background:#0A1428; padding:24px 32px; text-align:center;">
          <h1 style="color:#C5A880; font-size:22px; margin:0; letter-spacing:2px;">DIGILOCAL</h1>
          <p style="color:#8aa0b8; font-size:11px; margin:4px 0 0; letter-spacing:1px;">LOCAL MARKETPLACE PLATFORM</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:${isExpired ? '#b91c1c' : '#B78103'}; font-size:18px; margin:0 0 12px;">
            ${isExpired ? '⚠️ Subscription Expired' : `🔔 ${daysLeft} Day${daysLeft === 1 ? '' : 's'} Until Expiry`}
          </h2>
          <p style="font-size:14px; line-height:1.7; color:#444; margin:0 0 16px;">
            Dear <strong>${vendor.vendor_name}</strong>,
          </p>
          <p style="font-size:14px; line-height:1.7; color:#444; margin:0 0 16px;">
            ${isExpired
                ? `Your DigiLocal subscription for <strong>${vendor.store_name}</strong> has <span style="color:#b91c1c;font-weight:bold;">expired</span>. Your store is now hidden from residents. Please renew immediately.`
                : `Your DigiLocal subscription for <strong>${vendor.store_name}</strong> will expire in <strong style="color:#B78103;">${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> (on <strong>${vendor.end_date}</strong>). Renew now to avoid interruption.`
            }
          </p>
          <div style="background:#FAF9F6; border-radius:10px; border:1px solid #e0d5c3; padding:16px 20px; margin:20px 0; font-size:13px;">
            <table width="100%" cellpadding="4">
              <tr><td style="color:#787F8C;">Store:</td><td style="font-weight:bold;">${vendor.store_name}</td></tr>
              <tr><td style="color:#787F8C;">Subscription Ends:</td><td style="font-weight:bold; color:#B78103;">${vendor.end_date || 'N/A'}</td></tr>
              <tr><td style="color:#787F8C;">Renewal Cost:</td><td style="font-weight:bold;">₹2,999 / year</td></tr>
            </table>
          </div>
          <div style="text-align:center; margin:24px 0 8px;">
            <a href="http://localhost:3000" style="display:inline-block; background:#0A1428; color:#C5A880; font-weight:bold; padding:12px 32px; border-radius:10px; text-decoration:none; font-size:13px; letter-spacing:1px;">
              RENEW SUBSCRIPTION NOW
            </a>
          </div>
          <p style="font-size:11px; color:#aaa; text-align:center; margin-top:24px;">
            DigiLocal Platform &bull; Subscription Management
          </p>
        </div>
      </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `DigiLocal Platform <${process.env.EMAIL_USER}>`,
            to: vendor.email,
            subject,
            html
        });
        console.log(`[Email Sent] Subscription alert → ${vendor.email} (${daysLeft} days left)`);
    } catch (err) {
        console.error(`[Email Error] Failed to send to ${vendor.email}:`, err.message);
    }
};

module.exports = { transporter, sendSubscriptionExpiryEmail };
