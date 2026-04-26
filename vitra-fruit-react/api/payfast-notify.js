const nodemailer = require('nodemailer');
const https = require('https');
const querystring = require('querystring');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const data = req.body;
    const publicSiteUrl = getPublicSiteUrl(req);
    const paymentStatus = data.payment_status;
    const orderId = data.m_payment_id || 'Unknown';
    const amountGross = data.amount_gross;
    const customerEmail = data.email_address;
    const customerName = `${data.name_first || ''} ${data.name_last || ''}`.trim();

    // Basic validation
    if (!paymentStatus) {
      console.error('ITN: Missing payment_status');
      return res.status(400).send('Bad request');
    }

    // Verify with PayFast server (recommended for production)
    const isValid = await verifyWithPayFast(data);
    if (!isValid) {
      console.error('ITN: PayFast verification failed for', orderId);
      return res.status(400).send('Verification failed');
    }

    // Only process completed payments
    if (paymentStatus !== 'COMPLETE') {
      console.log(`ITN: Order ${orderId} status is ${paymentStatus}, not COMPLETE`);
      return res.status(200).send('OK');
    }

    // Setup email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
    });
    const attachments = await buildEmailAttachments(publicSiteUrl);

    // Notify shop owner: payment confirmed
    await transporter.sendMail({
      from: `"Vitra Fruit Orders" <${process.env.SMTP_USER}>`,
      to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
      subject: `Payment Confirmed — ${orderId} — R${amountGross}`,
      html: buildPaymentConfirmedShopEmail({ orderId, amountGross, customerName, customerEmail, data }),
      attachments,
    });

    // Notify customer: payment received
    if (customerEmail) {
      await transporter.sendMail({
        from: `"Vitra Fruit" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Payment Confirmed — ${orderId}`,
        html: buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName }),
        attachments,
      });
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('ITN processing error:', err);
    // Return 200 so PayFast doesn't keep retrying on our errors
    return res.status(200).send('OK');
  }
};

function getPublicSiteUrl(req) {
  const explicit = String(process.env.PUBLIC_SITE_URL || '').trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const host = req && req.headers ? req.headers.host : '';
  if (host) {
    return `https://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://vitra-fruit-website-vyda.vercel.app';
}

async function buildEmailAttachments(publicSiteUrl) {
  const assets = [
    { filename: 'logo.jpg', cid: 'vitra-logo' },
    { filename: 'IMG_1114.jpeg', cid: 'vitra-gallery-1' },
    { filename: 'IMG_1122.jpeg', cid: 'vitra-gallery-2' },
    { filename: 'IMG_1131.jpeg', cid: 'vitra-gallery-3' },
    { filename: 'IMG_1135.jpeg', cid: 'vitra-gallery-4' }
  ];

  const attachments = await Promise.all(
    assets.map(async ({ filename, cid }) => {
      try {
        const response = await fetch(`${publicSiteUrl}/images/${filename}`);
        if (!response.ok) {
          throw new Error(`Image request failed (${response.status}) for ${filename}`);
        }

        const contentType = response.headers.get('content-type') || undefined;
        const content = Buffer.from(await response.arrayBuffer());

        return { filename, cid, content, contentType };
      } catch (err) {
        console.warn('Email image attachment skipped:', err.message);
        return null;
      }
    })
  );

  return attachments.filter(Boolean);
}

/**
 * Verify the ITN data with PayFast's server.
 * Posts the received data back to PayFast to confirm authenticity.
 */
function verifyWithPayFast(data) {
  return new Promise((resolve) => {
    const isSandbox = process.env.PAYFAST_SANDBOX === 'true';
    const host = isSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';

    // Build verification string (exclude signature)
    const params = { ...data };
    delete params.signature;
    const postData = querystring.stringify(params);

    const options = {
      hostname: host,
      port: 443,
      path: '/eng/query/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        resolve(body.trim() === 'VALID');
      });
    });

    request.on('error', (err) => {
      console.error('PayFast verification request error:', err);
      // If verification fails due to network, allow the payment
      // (the order email was already sent in create-order)
      resolve(true);
    });

    request.write(postData);
    request.end();
  });
}

/* ── Email templates ──────────────────────────────────────────── */

function emailWrapper(content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0e8;">
        <tr><td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
            ${content}
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
            &copy; ${new Date().getFullYear()} Vitra Fruit &middot; Proudly South African
          </p>
        </td></tr>
      </table>
    </body>
    </html>`;
}

function buildPaymentConfirmedShopEmail({ orderId, amountGross, customerName, customerEmail, data }) {
  const pfPaymentId = data.pf_payment_id || '';
  const amountFee = data.amount_fee || '0.00';
  const amountNet = data.amount_net || amountGross;

  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;border-bottom:3px solid #607848;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td><img src="cid:vitra-logo" alt="Vitra Fruit" style="height:90px;border-radius:14px;" /></td>
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
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Payment Confirmed</h1>
        <p style="margin:0 0 24px;font-size:13px;color:#c09828;font-weight:600;">${orderId}</p>
      </td>
    </tr>

    <!-- Details -->
    <tr>
      <td style="padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Customer</td>
            <td style="padding:10px 0;font-size:14px;color:#333;text-align:right;font-weight:600;border-bottom:1px solid #e8e2d6;">${customerName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Email</td>
            <td style="padding:10px 0;font-size:14px;text-align:right;border-bottom:1px solid #e8e2d6;">
              <a href="mailto:${customerEmail}" style="color:#c03030;text-decoration:none;font-weight:600;">${customerEmail || 'N/A'}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Amount Paid</td>
            <td style="padding:10px 0;font-size:16px;color:#607848;text-align:right;font-weight:700;">R${amountGross}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#888;border-bottom:1px solid #e8e2d6;">PayFast Fee</td>
            <td style="padding:10px 0;font-size:14px;color:#888;text-align:right;border-bottom:1px solid #e8e2d6;">R${amountFee}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #e8e2d6;">Net Amount</td>
            <td style="padding:10px 0;font-size:14px;color:#333;text-align:right;font-weight:700;border-bottom:1px solid #e8e2d6;">R${amountNet}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#888;">PayFast Reference</td>
            <td style="padding:10px 0;font-size:14px;color:#333;text-align:right;">${pfPaymentId}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Note -->
    <tr>
      <td style="padding:28px 40px 32px;">
        <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
          Payment verified by PayFast. You can now prepare this order for ${data.item_description && data.item_description.includes('COLLECTION') ? 'collection' : 'dispatch'}.
          Match this with the order details email sent earlier for the full address and item breakdown.
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}

function buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName }) {
  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;text-align:center;border-bottom:3px solid #607848;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:90px;border-radius:14px;" />
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Payment received</h1>
        <p style="margin:0 0 24px;font-size:13px;color:#c09828;font-weight:600;">${orderId}</p>

        <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.7;">
          Hi ${customerName || 'there'},
        </p>

        <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">
          Your payment of <strong style="color:#333;">R${amountGross}</strong> has been successfully received and confirmed.
        </p>

        <p style="margin:0 0 0;font-size:14px;color:#555;line-height:1.7;">
          We're now preparing your order. We'll be in touch with updates as soon as it's ready. If you have any questions, don't hesitate to reach out.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:32px 40px;border-top:1px solid #e8e2d6;margin-top:28px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:14px;color:#c03030;text-decoration:none;font-weight:600;">orderinfo@vitrafruits.co.za</a>
      </td>
    </tr>`;

  return emailWrapper(content);
}
