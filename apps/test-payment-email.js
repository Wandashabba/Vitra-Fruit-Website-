require('dotenv').config();
const nodemailer = require('nodemailer');

// We need to extract the template logic or just use the handler
// But verifyWithPayFast will block us.
// I'll create a test script that mocks the transporter and the handler's internal logic.

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
  },
});

const orderId = 'VF-TEST-1234';
const amountGross = '640.00';
const customerName = 'Mary Mahuma';
const customerEmail = process.env.ORDER_EMAIL_TO || process.env.SMTP_USER;

const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0e8;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px;border-bottom:3px solid #607848;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td><span style="font-size:24px; font-weight:bold; color:#607848;">Vitra Fruit</span></td>
                <td style="text-align:right;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#607848;font-weight:700;">Payment Update</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:32px 40px 0;">
            <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;">Payment Confirmed</h1>
            <p style="margin:0 0 24px;font-size:13px;color:#c09828;font-weight:600;">${orderId}</p>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Customer</td>
                <td style="padding:10px 0;font-size:14px;color:#333;text-align:right;font-weight:600;border-bottom:1px solid #e8e2d6;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Email</td>
                <td style="padding:10px 0;font-size:14px;text-align:right;border-bottom:1px solid #e8e2d6;">
                  <a href="mailto:${customerEmail}" style="color:#c03030;text-decoration:none;font-weight:600;">${customerEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Amount Paid</td>
                <td style="padding:10px 0;font-size:16px;color:#607848;text-align:right;font-weight:700;">R${amountGross}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:28px 40px 32px;">
            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
              Payment verified by PayFast. You can now prepare this order for dispatch.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

(async () => {
  console.log('Sending test payment confirmation email (Shop Version)...');
  await transporter.sendMail({
    from: `"Vitra Fruit Orders" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: `TEST: Payment Confirmed — ${orderId} — R${amountGross}`,
    html: html
  });
  console.log('Done!');
})();
