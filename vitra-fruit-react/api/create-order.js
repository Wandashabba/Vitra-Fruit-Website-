const nodemailer = require('nodemailer');

const {
  priceOrder,
  escapeHtml,
  applyCors,
  signOrder,
} = require('./_lib/shop');

const PAYLOAD_CHUNK = 250;   // PayFast custom_str fields hold 255 chars each
const PAYLOAD_CHUNKS = 4;    // custom_str1-4 carry the order, custom_str5 its signature

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const billing = cleanContact(body.billing);
    const shipping = body.shipping ? cleanContact(body.shipping) : null;
    // Checkout only offers delivery; never trust a client claim of collection.
    const deliveryMethod = 'delivery';
    const missingEnv = getMissingEnvVars();
    const publicSiteUrl = getPublicSiteUrl(req);

    if (!billing || !billing.firstName || !isEmail(billing.email)) {
      return res.status(400).json({ error: 'Please enter your name and a valid email address.' });
    }

    // Price the order from the server catalogue; client-sent prices are ignored.
    const priced = priceOrder(body.items);
    if (priced.error) {
      return res.status(400).json({ error: priced.error });
    }
    const { lines: items, subtotal, shipping: shippingCost, total } = priced;

    // A stale cart (prices changed since it was filled) should be refreshed
    // rather than silently charged a different amount.
    if (Math.abs(Number(body.total) - total) > 1) {
      console.error(`Price validation failed: submitted R${body.total}, server R${total.toFixed(2)}`);
      return res.status(400).json({ error: 'Order total could not be verified. Please refresh and try again.' });
    }

    if (missingEnv.length) {
      console.error('Missing server configuration:', missingEnv.join(', '));
      return res.status(500).json({
        error: "We couldn't process your order right now. Please try again in a few minutes, or WhatsApp us on 078 404 5558.",
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
    const shopHtml = buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, total });

    try {
      await transporter.sendMail({
        from: `"VitraFruits Orders" <${process.env.SMTP_USER}>`,
        to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
        subject: `New Order ${orderId} — DELIVERY — R${total.toFixed(2)}`,
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
      await transporter.sendMail({
        from: `"VitraFruits" <${process.env.SMTP_USER}>`,
        to: billing.email,
        subject: `We've received your order ${orderId} — VitraFruits`,
        html: buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, total }),
        attachments,
      });
    } catch (emailErr) {
      console.error('Customer order-received email failed (non-blocking):', emailErr.message || emailErr);
    }

    return res.status(200).json({
      success: true,
      orderId,
      emailSent: true,
      payfast: buildPayfastFields({ orderId, billing, shipping, items, subtotal, shippingCost, total }),
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
};

/* ── Input cleaning ───────────────────────────────────────────── */

const CONTACT_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'street', 'apartment', 'suburb', 'town', 'province', 'postcode'];

function cleanContact(data) {
  if (!data || typeof data !== 'object') return null;
  const out = {};
  for (const key of CONTACT_FIELDS) {
    out[key] = String(data[key] == null ? '' : data[key]).trim().slice(0, 120);
  }
  return out;
}

function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

/* ── PayFast fields ───────────────────────────────────────────── */
// The order summary rides along in custom_str1-4 so the ITN handler can email
// it after payment; custom_str5 is an HMAC over the order id, amount and that
// summary, which payfast-notify checks before confirming the order.

function buildPayfastFields({ orderId, billing, shipping, items, subtotal, shippingCost, total }) {
  const ship = shipping && shipping.street ? shipping : null;
  const b = {
    f: billing.firstName, l: billing.lastName, e: billing.email, p: billing.phone,
    s: (ship && ship.street) || billing.street,
    t: (ship && ship.town) || billing.town,
    pr: billing.province,
    z: (ship && ship.postcode) || billing.postcode,
  };
  const i = items.map((item) => ({ n: item.size ? `${item.name} ${item.size}` : item.name, q: item.quantity, p: item.price }));

  const limit = PAYLOAD_CHUNK * PAYLOAD_CHUNKS;
  let payload = JSON.stringify({ b, i, sub: subtotal, sh: shippingCost });
  if (payload.length > limit) {
    // Very large carts: the full item list is already in the order email.
    payload = JSON.stringify({ b, i: [], it: items.length, sub: subtotal, sh: shippingCost });
  }
  if (payload.length > limit) {
    payload = JSON.stringify({ b: {}, i: [], it: items.length, sub: subtotal, sh: shippingCost });
  }

  const amount = total.toFixed(2);
  const fields = {
    m_payment_id: orderId,
    amount,
    item_name: 'Vitra Fruit Products',
    item_description: items
      .map((item) => `${item.name}${item.size ? ` ${item.size}` : ''}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
      .join(', ')
      .slice(0, 255),
  };
  for (let n = 0; n < PAYLOAD_CHUNKS; n++) {
    fields[`custom_str${n + 1}`] = payload.slice(n * PAYLOAD_CHUNK, (n + 1) * PAYLOAD_CHUNK);
  }
  fields.custom_str5 = signOrder(orderId, amount, payload);
  return fields;
}

function getMissingEnvVars() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ORDER_EMAIL_TO', 'ORDER_SIGNING_SECRET'];
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
            ${escapeHtml(item.name || 'Product')}${escapeHtml(size)}
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
        ${lines.map(escapeHtml).join('<br/>')}
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

function buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, total }) {
  const isCollection = deliveryMethod === 'collection';
  const dateStr = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

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
          <a href="mailto:${escapeHtml(billing.email)}" style="color:#c03030;text-decoration:none;">${escapeHtml(billing.email)}</a><br/>
          ${escapeHtml(billing.phone) || 'No phone provided'}
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}

function buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, total }) {
  const isCollection = deliveryMethod === 'collection';

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
          Hi ${escapeHtml(billing.firstName) || 'there'},
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
