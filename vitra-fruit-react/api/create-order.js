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
    const { billing, shipping, deliveryMethod, items, subtotal, discount, total } = req.body;
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

    // Generate a short, readable order ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `VF-${timestamp}-${random}`;

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
    const customerHtml = buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total });

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
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">
            ${item.name || 'Product'}${size}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;font-weight:600;">
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
    <div style="margin-bottom:20px;">
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#888;">${label}</strong>
      <div style="margin-top:6px;font-size:14px;color:#333;line-height:1.6;">
        ${lines.join('<br/>')}
      </div>
    </div>`;
}

function buildGallerySection() {
  return `
    <div style="margin-top:32px;padding:22px;background:#f7f1e5;border:1px solid #e3d7b9;border-radius:20px;">
      <p style="margin:0 0 14px;color:#607848;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;text-align:center;">Vitra Fruit</p>
      <h3 style="margin:0 0 18px;color:#802050;font-size:22px;font-family:'Playfair Display', serif;font-weight:700;text-align:center;">Crafted colour. Natural flavour.</h3>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="table-layout:fixed;">
        <tr>
          <td width="25%" style="padding:4px;"><img src="cid:vitra-gallery-1" alt="Vitra Fruit product" width="128" height="128" style="display:block;width:100%;height:128px;border-radius:14px;object-fit:cover;background:#efe7d5;" /></td>
          <td width="25%" style="padding:4px;"><img src="cid:vitra-gallery-2" alt="Vitra Fruit product" width="128" height="128" style="display:block;width:100%;height:128px;border-radius:14px;object-fit:cover;background:#efe7d5;" /></td>
          <td width="25%" style="padding:4px;"><img src="cid:vitra-gallery-3" alt="Vitra Fruit product" width="128" height="128" style="display:block;width:100%;height:128px;border-radius:14px;object-fit:cover;background:#efe7d5;" /></td>
          <td width="25%" style="padding:4px;"><img src="cid:vitra-gallery-4" alt="Vitra Fruit product" width="128" height="128" style="display:block;width:100%;height:128px;border-radius:14px;object-fit:cover;background:#efe7d5;" /></td>
        </tr>
      </table>
    </div>`;
}

function buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';
  const methodBadge = isCollection
    ? '<span style="background:#C09828;color:#fff;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">Collection</span>'
    : '<span style="background:#607848;color:#fff;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">Delivery</span>';

  const deliveryAddress = !isCollection
    ? addressBlock('Delivery Address', shipping || billing)
    : '<div style="margin-bottom:20px;padding:16px;background:#fdfcf9;border-left:4px solid #C09828;border-radius:4px;font-size:14px;color:#C09828;font-weight:700;">Customer will collect from store</div>';

  const discountRow = discount > 0
    ? `<tr><td style="padding:10px 0;font-size:14px;color:#27ae60;border-top:1px solid #eee;">Discount (10%)</td><td style="padding:10px 0;font-size:14px;color:#27ae60;text-align:right;font-weight:700;border-top:1px solid #eee;">-${formatCurrency(discount)}</td></tr>`
    : '';

  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:640px;margin:0 auto;background:#fcf8f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px rgba(50,30,20,0.14);border:1px solid #eadfc7;">
      <div style="background:#802050;padding:40px 40px 34px;text-align:center;border-bottom:4px solid #C09828;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:84px; border-radius:16px; margin-bottom: 18px;" />
        <p style="margin:0 0 8px;color:#f1dfac;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Order Desk</p>
        <h1 style="margin:0;color:#fff;font-size:30px;font-family:'Playfair Display', serif;font-weight:700;">New Order Received</h1>
        <p style="margin:10px 0 0;color:#f5e7bf;font-size:14px;font-weight:600;">${orderId} • Awaiting PayFast</p>
      </div>

      <div style="padding:38px;">
        <div style="margin-bottom:30px; display:flex; justify-content:space-between; align-items:center;">
          ${methodBadge}
          <span style="font-size:13px;color:#8c7d61;font-weight:600;">
            ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
          </span>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;background:#fff;border-radius:16px;overflow:hidden;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #d8ccb0;text-align:left;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Item</th>
              <th style="border-bottom:2px solid #d8ccb0;text-align:center;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Qty</th>
              <th style="border-bottom:2px solid #d8ccb0;text-align:right;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:34px;background:#fff7e9;border:1px solid #ebddb9;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:14px 18px;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:14px 18px;font-size:14px;color:#111;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:16px 18px;font-size:18px;font-weight:800;color:#802050;border-top:2px solid #d1bb7c;">Total</td>
            <td style="padding:16px 18px;font-size:18px;font-weight:800;color:#C09828;text-align:right;border-top:2px solid #d1bb7c;">${formatCurrency(total)}</td>
          </tr>
        </table>

        <div style="display:flex;gap:24px;flex-wrap:wrap;border-top:1px solid #eadfc7;padding-top:28px;margin-bottom:18px;">
          <div style="flex:1;min-width:200px;">
            ${addressBlock('Billing Details', billing)}
          </div>
          <div style="flex:1;min-width:200px;">
            ${deliveryAddress}
          </div>
        </div>

        <div style="padding:20px;background:#f4efe4;border-radius:16px;border:1px solid #e5d8bb;">
          <strong style="color:#607848;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Customer Contact</strong>
          <div style="margin-top:8px;font-size:14px;color:#555;font-weight:600;">
            <a href="mailto:${billing.email}" style="color:#C09828;text-decoration:none;">${billing.email}</a><br/>
            ${billing.phone || 'No phone provided'}
          </div>
        </div>

        ${buildGallerySection()}
      </div>
    </div>`;
}

function buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';

  const discountRow = discount > 0
    ? `<tr><td style="padding:10px 0;font-size:14px;color:#27ae60;border-top:1px solid #eee;">Discount (10%)</td><td style="padding:10px 0;font-size:14px;color:#27ae60;text-align:right;font-weight:700;border-top:1px solid #eee;">-${formatCurrency(discount)}</td></tr>`
    : '';

  const deliveryNote = isCollection
    ? '<p style="font-size:15px;color:#555;line-height:1.7;background:#fbf3df;padding:18px;border-left:4px solid #C09828;border-radius:10px;">You\'ve chosen <strong>collection</strong>. We\'ll confirm when your order is ready for pickup from our store.</p>'
    : '<p style="font-size:15px;color:#555;line-height:1.7;background:#eef4e8;padding:18px;border-left:4px solid #607848;border-radius:10px;">Your order will be <strong>delivered</strong> to the address provided. We\'ll share tracking details once dispatched.</p>';

  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:640px;margin:0 auto;background:#fcf8f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px rgba(50,30,20,0.14);border:1px solid #eadfc7;">
      <div style="background:#802050;padding:42px 40px 36px;text-align:center;border-bottom:4px solid #C09828;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:88px; border-radius:16px; margin-bottom: 18px;" />
        <p style="margin:0 0 8px;color:#f1dfac;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Vitra Fruit</p>
        <h1 style="margin:0;color:#fff;font-size:30px;font-family:'Playfair Display', serif;font-weight:700;">Thank you for your order</h1>
        <p style="margin:10px 0 0;color:#f5e7bf;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Order ${orderId}</p>
      </div>

      <div style="padding:38px;">
        <p style="font-size:16px;color:#111;line-height:1.7;margin-bottom:24px;font-weight:600;">
          Hi ${billing.firstName || 'there'},<br/>
          <span style="font-weight:400;color:#555;">We've received your order and it is being processed. You'll receive a full confirmation once your payment clears through PayFast.</span>
        </p>

        ${deliveryNote}

        <table style="width:100%;border-collapse:collapse;margin:30px 0;background:#fff;border-radius:16px;overflow:hidden;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #d8ccb0;text-align:left;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Item</th>
              <th style="border-bottom:2px solid #d8ccb0;text-align:center;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Qty</th>
              <th style="border-bottom:2px solid #d8ccb0;text-align:right;padding:16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8c7d61;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;background:#fff7e9;border:1px solid #ebddb9;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:14px 18px;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:14px 18px;font-size:14px;color:#111;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:16px 18px;font-size:18px;font-weight:800;color:#802050;border-top:2px solid #d1bb7c;">Total</td>
            <td style="padding:16px 18px;font-size:18px;font-weight:800;color:#C09828;text-align:right;border-top:2px solid #d1bb7c;">${formatCurrency(total)}</td>
          </tr>
        </table>

        ${buildGallerySection()}
      </div>

      <div style="padding:28px;background:#f3ecdf;border-top:1px solid #e3d7b9;border-radius:0 0 24px 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#607848;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:15px;color:#802050;font-weight:700;text-decoration:none;">orderinfo@vitrafruits.co.za</a>
      </div>
    </div>`;
}
