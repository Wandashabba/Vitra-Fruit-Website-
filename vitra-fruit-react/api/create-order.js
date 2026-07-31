const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  const allowedOrigins = [
    'https://vitrafruits.co.za',
    'https://www.vitrafruits.co.za',
  ];
  const origin = req.headers.origin || '';
  const isVercel = origin.endsWith('.vercel.app');
  if (allowedOrigins.includes(origin) || isVercel) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { billing, shipping, deliveryMethod, items, subtotal, discount, total } = req.body;
    const missingEnv = getMissingEnvVars();
    const publicSiteUrl = getPublicSiteUrl(req);
    if (!billing || !items || !items.length || !total) {
      return res.status(400).json({ error: 'Missing required order data' });
    }

    // Server-side price validation — recompute total from known prices
    const priceValidation = validateOrderTotal({ items, discount, deliveryMethod, total });
    if (!priceValidation.valid) {
      console.error('Price validation failed:', priceValidation.reason);
      return res.status(400).json({ error: 'Order total could not be verified. Please refresh and try again.' });
    }

    if (missingEnv.length) {
      return res.status(500).json({
        error: `Missing server configuration: ${missingEnv.join(', ')}`
      });
    }

    // Generate a short, readable order ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `VF-${timestamp}-${random}`;

    // Send the shop owner notification email. This is BLOCKING by design:
    // orders have no persistence other than email, so if the shop cannot be
    // notified, the customer must not be sent to PayFast to pay for an order
    // nobody can see or fulfil.
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: smtpPort,
      secure: smtpPort === 465, // TLS-on-connect for 465, STARTTLS otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
      connectionTimeout: 10000, // 10s connect timeout
      socketTimeout: 15000,     // 15s socket timeout
    });

    const attachments = await buildEmailAttachments(publicSiteUrl);
    const shopHtml = buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total });

    try {
      await transporter.sendMail({
        from: `"VitraFruits Orders" <${process.env.SMTP_USER}>`,
        to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
        subject: `New Order ${orderId} — ${deliveryMethod === 'collection' ? 'COLLECTION' : 'DELIVERY'} — R${total.toFixed(2)}`,
        html: shopHtml,
        attachments,
      });
    } catch (emailErr) {
      console.error('Order notification email failed — blocking checkout:', emailErr.message || emailErr);
      return res.status(502).json({
        error: "We couldn't process your order right now. Please try again in a few minutes, or WhatsApp us on 078 404 5558.",
      });
    }

    // Customer "order received" email — best-effort; a failure here must not
    // block the sale (the shop already has the order).
    try {
      if (billing.email) {
        await transporter.sendMail({
          from: `"VitraFruits" <${process.env.SMTP_USER}>`,
          to: billing.email,
          subject: `We've received your order ${orderId} — VitraFruits`,
          html: buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total }),
          attachments,
        });
      }
    } catch (emailErr) {
      console.error('Customer order-received email failed (non-blocking):', emailErr.message || emailErr);
    }

    return res.status(200).json({ success: true, orderId, emailSent: true });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({
      error: err && err.message ? err.message : 'Failed to process order. Please try again.'
    });
  }
};

/* ── Server-side price catalogue ──────────────────────────────── */

const PRODUCT_PRICES = {
  // Citrus wheels
  'dehydrated orange wheels': { default: 200 },
  'dehydrated lemon wheels': { default: 200 },
  'dehydrated lime wheels': { default: 200 },
  'dehydrated grapefruit wheels': { default: 200 },
  // Citrus slices — price by size
  'dehydrated lemon slices': { '100g': 120, '150g': 120, '200g': 200, '1kg': 580 },
  'dehydrated lime slices': { '100g': 120, '150g': 120, '200g': 200, '1kg': 580 },
  'dehydrated orange slices': { '100g': 120, '150g': 120, '200g': 200, '1kg': 580 },
  'dehydrated grapefruit slices': { '100g': 120, '150g': 120, '200g': 200, '1kg': 580 },
  // Apple / Pear
  'dehydrated apple slices': { '100g': 100, '200g': 180 },
  'dehydrated pear slices': { '100g': 100, '200g': 180 },
  // Banana chips
  'dehydrated banana chips': { '100g': 100, '200g': 180 },
  // Pineapple
  'dehydrated pineapple slices': { '100g': 120, '200g': 220 },
  // Mango
  'dehydrated mango strips': { '100g': 100, '200g': 160 },
  // Fruit strips
  'fruit strips': { default: 80 },
  // Citrus powders — product pages sell these under the plural name at R140
  'dehydrated lemon powders': { default: 140 },
  'dehydrated orange powders': { default: 140 },
  'dehydrated grapefruit powders': { default: 140 },
  // Vegetable powders — plural name, priced by size
  'beetroot powders': { '150g': 160, '500g': 380 },
  'butternut powders': { '150g': 160, '500g': 380 },
  'carrot powders': { '150g': 160, '500g': 380 },
  'spinach powders': { '150g': 160, '500g': 380 },
  // Legacy singular keys — old carts before the rename
  'lemon powder': { default: 120 },
  'orange powder': { default: 120 },
  'grapefruit powder': { default: 120 },
  'beetroot powder': { default: 130 },
  'butternut powder': { default: 130 },
  'carrot powder': { default: 130 },
  'spinach powder': { default: 130 },
  // Hibiscus
  'hibiscus flowers': { '100g': 100, '200g': 180, '1kg': 980 },
};

const SHIPPING_COST = 150;
const FREE_SHIPPING_THRESHOLD = 850; // matches cart.js — free delivery at/above this after discount
const FIRST_ORDER_DISCOUNT_RATE = 0.10;

function lookupPrice(name, size) {
  const key = (name || '').toLowerCase().trim();
  const entry = PRODUCT_PRICES[key];
  if (!entry) return null;
  if (entry.default !== undefined) return entry.default;
  const sizeKey = (size || '').toLowerCase().trim();
  return entry[sizeKey] ?? null;
}

function validateOrderTotal({ items, discount, deliveryMethod, total }) {
  let computedSubtotal = 0;
  for (const item of items) {
    const unitPrice = lookupPrice(item.name, item.size);
    if (unitPrice === null) {
      // Unknown product — skip strict validation for this item but trust the others
      computedSubtotal += Number(item.price || 0) * Number(item.quantity || 1);
      continue;
    }
    computedSubtotal += unitPrice * Number(item.quantity || 1);
  }

  const isFirstOrder = discount > 0;
  const computedDiscount = isFirstOrder ? Math.round(computedSubtotal * FIRST_ORDER_DISCOUNT_RATE * 100) / 100 : 0;
  const shipping = deliveryMethod === 'collection' || (computedSubtotal - computedDiscount) >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_COST;
  const computedTotal = computedSubtotal - computedDiscount + shipping;

  const tolerance = 1.00; // allow R1 rounding difference
  const diff = Math.abs(computedTotal - Number(total));
  if (diff > tolerance) {
    return { valid: false, reason: `Submitted total R${total} differs from server-computed R${computedTotal.toFixed(2)}` };
  }
  return { valid: true };
}

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

let cachedLogoAttachment = null;

async function buildEmailAttachments(publicSiteUrl) {
  if (cachedLogoAttachment) return [cachedLogoAttachment];
  try {
    const response = await fetch(`${publicSiteUrl}/images/logo.jpg`);
    if (!response.ok) throw new Error(`Image request failed (${response.status}) for logo.jpg`);
    const contentType = response.headers.get('content-type') || undefined;
    const content = Buffer.from(await response.arrayBuffer());
    cachedLogoAttachment = { filename: 'logo.jpg', cid: 'vitra-logo', content, contentType };
    return [cachedLogoAttachment];
  } catch (err) {
    console.warn('Email image attachment skipped:', err.message);
    return [];
  }
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
    <body style="margin:0;padding:0;background:#ffffff;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;">
        <tr><td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
            ${content}
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
            &copy; ${new Date().getFullYear()} VitraFruits &middot; Proudly South African
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
            <td><img src="cid:vitra-logo" alt="VitraFruits" style="height:90px;border-radius:14px;" /></td>
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

function buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';

  const discountRow = discount > 0
    ? `<tr><td style="padding:8px 0;font-size:14px;color:#607848;">Discount (10%)</td><td style="padding:8px 0;font-size:14px;color:#607848;text-align:right;font-weight:600;">-${formatCurrency(discount)}</td></tr>`
    : '';

  const deliveryNote = isCollection
    ? `<p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">You've chosen <strong>collection</strong>. We'll let you know when your order is ready for pickup.</p>`
    : `<p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Your order will be <strong>delivered</strong> to the address you provided. We'll share tracking details once it's dispatched.</p>`;

  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px;text-align:center;border-bottom:3px solid #c09828;">
        <img src="cid:vitra-logo" alt="VitraFruits" style="height:90px;border-radius:14px;margin-bottom:4px;" />
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#333;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">Thank you for your order</h1>
        <p style="margin:0 0 20px;font-size:13px;color:#c09828;font-weight:600;letter-spacing:0.04em;">${orderId}</p>
        <p style="margin:0 0 8px;font-size:15px;color:#333;line-height:1.7;">
          Hi ${billing.firstName || 'there'},
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
          We've received your order and it's being processed. You'll get a confirmation once your payment clears through PayFast.
        </p>
        ${deliveryNote}
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:0 40px;">
        <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Your Items</p>
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

    <!-- Footer -->
    <tr>
      <td style="padding:32px 40px;border-top:1px solid #e8e2d6;margin-top:28px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#c09828;font-weight:700;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:14px;color:#c03030;text-decoration:none;font-weight:600;">orderinfo@vitrafruits.co.za</a>
      </td>
    </tr>`;

  return emailWrapper(content);
}
