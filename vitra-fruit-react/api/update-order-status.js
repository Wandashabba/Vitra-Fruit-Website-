const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple secret-key auth
  const secret = process.env.ADMIN_SECRET;
  const provided = (req.headers.authorization || '').replace('Bearer ', '').trim();

  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized. Provide a valid Bearer token.' });
  }

  try {
    const { orderId, customerEmail, customerName, status, trackingNumber, trackingUrl } = req.body;

    if (!orderId || !customerEmail || !status) {
      return res.status(400).json({ error: 'Missing required fields: orderId, customerEmail, status' });
    }

    const validStatuses = ['preparing', 'ready_collection', 'shipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
    });

    const publicSiteUrl = getPublicSiteUrl(req);
    const attachments = await buildEmailAttachments(publicSiteUrl);

    const { subject, html } = buildStatusEmail({
      orderId,
      customerName: customerName || 'there',
      status,
      trackingNumber,
      trackingUrl,
    });

    await transporter.sendMail({
      from: `"Vitra Fruit" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject,
      html,
      attachments,
    });

    return res.status(200).json({ success: true, message: `Status email "${status}" sent to ${customerEmail}` });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ error: err && err.message ? err.message : 'Failed to send status email' });
  }
};

function getPublicSiteUrl(req) {
  const explicit = String(process.env.PUBLIC_SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host = req && req.headers ? req.headers.host : '';
  if (host) return `https://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://vitra-fruit-website-vyda.vercel.app';
}

async function buildEmailAttachments(publicSiteUrl) {
  const assets = [{ filename: 'logo.jpg', cid: 'vitra-logo' }];
  const attachments = await Promise.all(
    assets.map(async ({ filename, cid }) => {
      try {
        const response = await fetch(`${publicSiteUrl}/images/${filename}`);
        if (!response.ok) throw new Error(`Image fetch failed for ${filename}`);
        const contentType = response.headers.get('content-type') || undefined;
        const content = Buffer.from(await response.arrayBuffer());
        return { filename, cid, content, contentType };
      } catch (err) {
        console.warn('Email image skipped:', err.message);
        return null;
      }
    })
  );
  return attachments.filter(Boolean);
}

/* ── Email builder ──────────────────────────────────────────── */

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

function buildStatusEmail({ orderId, customerName, status, trackingNumber, trackingUrl }) {
  const configs = {
    preparing: {
      subject: `Your order is being prepared — ${orderId}`,
      accentColor: '#c09828',
      title: 'Your order is being prepared',
      body: `<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
              We've started preparing your order. Our team is carefully packing your items to make sure everything arrives in perfect condition.
            </p>
            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
              We'll send you another email once your order is ready for collection or has been shipped.
            </p>`,
    },
    ready_collection: {
      subject: `Your order is ready for collection — ${orderId}`,
      accentColor: '#607848',
      title: 'Your order is ready for collection',
      body: `<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
              Great news — your order has been packed and is ready for you to collect.
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
              Please bring your order number <strong style="color:#333;">${orderId}</strong> when you come to pick up.
            </p>
            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
              If you need to arrange a different collection time, just reply to this email or contact us below.
            </p>`,
    },
    shipped: {
      subject: `Your order has been shipped — ${orderId}`,
      accentColor: '#607848',
      title: 'Your order is on its way',
      body: buildShippedBody(orderId, trackingNumber, trackingUrl),
    },
  };

  const config = configs[status];

  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;text-align:center;border-bottom:3px solid ${config.accentColor};">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:90px;border-radius:14px;" />
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${config.title}</h1>
        <p style="margin:0 0 24px;font-size:13px;color:#c09828;font-weight:600;">${orderId}</p>

        <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.7;">
          Hi ${customerName},
        </p>

        ${config.body}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:32px 40px;border-top:1px solid #e8e2d6;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:14px;color:#c03030;text-decoration:none;font-weight:600;">orderinfo@vitrafruits.co.za</a>
      </td>
    </tr>`;

  return {
    subject: config.subject,
    html: emailWrapper(content),
  };
}

function buildShippedBody(orderId, trackingNumber, trackingUrl) {
  let trackingBlock = '';

  if (trackingNumber) {
    const trackingLink = trackingUrl
      ? `<a href="${trackingUrl}" style="color:#c03030;text-decoration:none;font-weight:600;" target="_blank">${trackingNumber}</a>`
      : `<strong style="color:#333;">${trackingNumber}</strong>`;

    trackingBlock = `
      <div style="margin:20px 0;padding:16px 20px;background:#f5f0e8;border-left:3px solid #607848;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#607848;font-weight:700;">Tracking Number</p>
        <p style="margin:0;font-size:16px;color:#333;">${trackingLink}</p>
      </div>`;
  }

  return `
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
      Your order <strong style="color:#333;">${orderId}</strong> has been handed to the courier and is on its way to you.
    </p>
    ${trackingBlock}
    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Delivery typically takes 2–5 business days depending on your location. If you have any questions about your delivery, feel free to get in touch.
    </p>`;
}
