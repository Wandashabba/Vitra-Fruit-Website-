const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Allow CORS for same-site requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId: reqOrderId, billing, shipping, deliveryMethod, items, subtotal, discount, shippingFee, total } = req.body;
    const missingEnv = getMissingEnvVars();
    const publicSiteUrl = getPublicSiteUrl(req);
    if (!billing || !items || !items.length || !total) {
      return res.status(400).json({ error: 'Missing required order data' });
    }

    if (missingEnv.length) {
      return res.status(500).json({
        error: `Missing server configuration: ${missingEnv.join(', ')}`
      });
    }

    const orderId = reqOrderId || `VF-${Date.now().toString(36).toUpperCase()}`;

    // Build email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
    });

    await transporter.verify();
    const attachments = await buildEmailAttachments(publicSiteUrl);

    // --- Shop owner email ---
    const shopHtml = buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total });

    await transporter.sendMail({
      from: `"Vitra Fruit Orders" <${process.env.SMTP_USER}>`,
      to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
      subject: `New Order ${orderId} — ${deliveryMethod === 'collection' ? 'COLLECTION' : 'DELIVERY'} — R${total.toFixed(2)}`,
      html: shopHtml,
      attachments,
    });

    // --- Customer confirmation email ---
    const customerHtml = buildCustomerEmail({ orderId, billing, items, subtotal, discount, shippingFee, total });

    await transporter.sendMail({
      from: `"Vitra Fruit" <${process.env.SMTP_USER}>`,
      to: billing.email,
      subject: `Order Received — ${orderId}`,
      html: customerHtml,
      attachments,
    });

    return res.status(200).json({ success: true, orderId });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({
      error: err && err.message ? err.message : 'Failed to process order. Please try again.'
    });
  }
};

function getMissingEnvVars() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ORDER_EMAIL_TO'];
  return required.filter((key) => !String(process.env[key] || '').trim());
}

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

/* ── Email templates ──────────────────────────────────────────── */

function formatCurrency(value) {
  return `R${Number(value).toFixed(2)}`;
}

function buildItemRows(items) {
  return items
    .map((item) => {
      const size = item.size ? ` — ${item.size}` : '';
      const lineTotal = (item.price * item.quantity).toFixed(2);
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8e2d6;font-size:14px;color:#333;">
            ${item.name || 'Product'}${size}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e2d6;font-size:14px;color:#555;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e2d6;font-size:14px;color:#333;text-align:right;font-weight:600;">
            R${lineTotal}
          </td>
        </tr>`;
    })
    .join('');
}

function addressBlock(label, data) {
  if (!data) return '';
  const lines = [
    `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    data.street || '',
    data.apartment || '',
    data.suburb || '',
    `${data.town || ''}, ${data.province || ''} ${data.postcode || ''}`.trim(),
    data.phone || '',
  ].filter(Boolean);

  return `
    <div style="margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">${label}</p>
      <p style="margin:0;font-size:14px;color:#333;line-height:1.7;">
        ${lines.join('<br/>')}
      </p>
    </div>`;
}

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

function buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';
  const dateStr = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

  const discountRow = discount > 0
    ? `<tr><td style="padding:8px 0;font-size:14px;color:#607848;">Discount (10%)</td><td style="padding:8px 0;font-size:14px;color:#607848;text-align:right;font-weight:600;">-${formatCurrency(discount)}</td></tr>`
    : '';

  const deliveryAddress = !isCollection
    ? addressBlock('Delivery Address', shipping || billing)
    : `<p style="margin:0 0 16px;font-size:14px;color:#c09828;font-weight:600;">Customer will collect from store</p>`;

  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;border-bottom:3px solid #c09828;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td><img src="cid:vitra-logo" alt="Vitra Fruit" style="height:90px;border-radius:14px;" /></td>
            <td style="text-align:right;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#c09828;font-weight:700;">Order Desk</p>
              <p style="margin:4px 0 0;font-size:12px;color:#999;">${dateStr}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">New Order Received</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#888;">${orderId} &middot; Awaiting PayFast</p>
        <p style="margin:0;display:inline-block;padding:6px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#fff;background:${isCollection ? '#c09828' : '#607848'};border-radius:4px;">
          ${isCollection ? 'Collection' : 'Delivery'}
        </p>
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Items Ordered</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #333;text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Item</th>
              <th style="border-bottom:2px solid #333;text-align:center;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Qty</th>
              <th style="border-bottom:2px solid #333;text-align:right;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Totals -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:8px 0;font-size:14px;color:#333;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:12px 0;font-size:18px;font-weight:700;color:#333;border-top:2px solid #333;">Total</td>
            <td style="padding:12px 0;font-size:18px;font-weight:700;color:#c03030;text-align:right;border-top:2px solid #333;">${formatCurrency(total)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Address & Contact -->
    <tr>
      <td style="padding:28px 40px 0;border-top:1px solid #e8e2d6;">
        ${addressBlock('Billing Details', billing)}
        ${deliveryAddress}
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Customer Contact</p>
        <p style="margin:0;font-size:14px;color:#333;">
          <a href="mailto:${billing.email}" style="color:#c03030;text-decoration:none;">${billing.email}</a><br/>
          ${billing.phone || 'No phone provided'}
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}

function buildCustomerEmail({ orderId, billing, items, subtotal, discount, shippingFee = 120, total }) {
  const discountRow = discount > 0
    ? `<tr><td style="padding:8px 0;font-size:14px;color:#607848;">Discount (10%)</td><td style="padding:8px 0;font-size:14px;color:#607848;text-align:right;font-weight:600;">-${formatCurrency(discount)}</td></tr>`
    : '';

  const today = new Date();
  const minDelivery = new Date(today);
  minDelivery.setDate(today.getDate() + 1);
  const maxDelivery = new Date(today);
  maxDelivery.setDate(today.getDate() + 3);
  
  const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  const minDeliveryStr = minDelivery.toLocaleDateString('en-GB', options);
  const maxDeliveryStr = maxDelivery.toLocaleDateString('en-GB', options);
  const orderDateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const vat = total - (total / 1.15);

  const addressData = billing;
  const addressLines = [
    `${addressData.firstName || ''} ${addressData.lastName || ''}`.trim(),
    addressData.street || '',
    addressData.apartment || '',
    addressData.suburb || '',
    `${addressData.town || ''}`,
    `${addressData.province || ''}`,
    `${addressData.postcode || ''}`,
    'South Africa',
    addressData.phone || '',
    addressData.email || ''
  ].filter(Boolean);

  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;text-align:center;border-bottom:3px solid #c09828;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:90px;border-radius:14px;margin-bottom:4px;" />
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Thank you for your order</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.7;">
          Hi ${billing.firstName || 'there'},
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
          Just to let you know — we’ve received your order, and it is now being processed.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
          The estimated delivery date is between <strong>${minDeliveryStr}</strong> and <strong>${maxDeliveryStr}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
          Here’s a reminder of what you’ve ordered:
        </p>
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:0 40px;">
        <p style="margin:0 0 10px;font-size:18px;color:#333;font-weight:700;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Order summary</p>
        <p style="margin:0 0 20px;font-size:13px;color:#c09828;font-weight:600;letter-spacing:0.04em;">Order ${orderId} (${orderDateStr})</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #333;text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Product</th>
              <th style="border-bottom:2px solid #333;text-align:center;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Quantity</th>
              <th style="border-bottom:2px solid #333;text-align:right;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#333;font-weight:700;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Totals -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#666;">Subtotal:</td>
            <td style="padding:8px 0;font-size:14px;color:#333;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#666;">Shipping: Delivery fee</td>
            <td style="padding:8px 0;font-size:14px;color:#333;text-align:right;font-weight:600;">${formatCurrency(shippingFee)}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;font-size:18px;font-weight:700;color:#333;border-top:2px solid #333;">Total:</td>
            <td style="padding:12px 0;font-size:18px;font-weight:700;color:#c03030;text-align:right;border-top:2px solid #333;">${formatCurrency(total)}<br/><span style="font-size:12px;font-weight:400;color:#666;">(includes ${formatCurrency(vat)} VAT)</span></td>
          </tr>
          <tr>
            <td style="padding:12px 0;font-size:14px;color:#666;border-top:1px solid #e8e2d6;">Payment method:</td>
            <td style="padding:12px 0;font-size:14px;color:#333;text-align:right;font-weight:600;border-top:1px solid #e8e2d6;">Payfast</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Billing Address -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 10px;font-size:18px;color:#333;font-weight:700;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Billing address</p>
        <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
          ${addressLines.join('<br/>')}
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:32px 40px;border-top:1px solid #e8e2d6;margin-top:28px;">
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
          Thanks for using vitrafruits.co.za!
        </p>
        <p style="margin:0;font-size:14px;color:#333;font-weight:600;">
          Vitra Fruits
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}
