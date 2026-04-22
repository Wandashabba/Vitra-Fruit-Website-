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

    // --- Shop owner email ---
    const shopHtml = buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total });

    await transporter.sendMail({
      from: `"Vitra Fruit Orders" <${process.env.SMTP_USER}>`,
      to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
      subject: `New Order ${orderId} — ${deliveryMethod === 'collection' ? 'COLLECTION' : 'DELIVERY'} — R${total.toFixed(2)}`,
      html: shopHtml,
    });

    // --- Customer confirmation email ---
    const customerHtml = buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total });

    await transporter.sendMail({
      from: `"Vitra Fruit" <${process.env.SMTP_USER}>`,
      to: billing.email,
      subject: `Order Received — ${orderId}`,
      html: customerHtml,
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

function buildShopEmail({ orderId, billing, shipping, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';
  const methodBadge = isCollection
    ? '<span style="background:#C09828;color:#fff;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Collection</span>'
    : '<span style="background:#111;color:#fff;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Delivery</span>';

  const deliveryAddress = !isCollection
    ? addressBlock('Delivery Address', shipping || billing)
    : '<div style="margin-bottom:20px;padding:16px;background:#fdfcf9;border-left:4px solid #C09828;border-radius:4px;font-size:14px;color:#C09828;font-weight:700;">Customer will collect from store</div>';

  const discountRow = discount > 0
    ? `<tr><td style="padding:10px 0;font-size:14px;color:#27ae60;border-top:1px solid #eee;">Discount (10%)</td><td style="padding:10px 0;font-size:14px;color:#27ae60;text-align:right;font-weight:700;border-top:1px solid #eee;">-${formatCurrency(discount)}</td></tr>`
    : '';

  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="background:#111;padding:34px 40px;text-align:center;">
        <img src="https://vitrafruits.co.za/images/logo.jpg" alt="Vitra Fruit" style="height:56px; border-radius:12px; margin-bottom: 20px;" />
        <h1 style="margin:0;color:#fff;font-size:24px;font-family:'Playfair Display', serif;font-weight:700;">New Order Received</h1>
        <p style="margin:8px 0 0;color:#C09828;font-size:14px;font-weight:600;">${orderId} — Awaiting PayFast</p>
      </div>

      <div style="padding:40px;">
        <div style="margin-bottom:30px; display:flex; justify-content:space-between; align-items:center;">
          ${methodBadge}
          <span style="font-size:13px;color:#aaa;font-weight:600;">
            ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
          </span>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #111;text-align:left;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Item</th>
              <th style="border-bottom:2px solid #111;text-align:center;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Qty</th>
              <th style="border-bottom:2px solid #111;text-align:right;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:40px;">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:16px 0;font-size:18px;font-weight:800;color:#111;border-top:2px solid #111;">Total</td>
            <td style="padding:16px 0;font-size:18px;font-weight:800;color:#C09828;text-align:right;border-top:2px solid #111;">${formatCurrency(total)}</td>
          </tr>
        </table>

        <div style="display:flex;gap:30px;flex-wrap:wrap;border-top:1px solid #eee;padding-top:30px;margin-bottom:20px;">
          <div style="flex:1;min-width:200px;">
            ${addressBlock('Billing Details', billing)}
          </div>
          <div style="flex:1;min-width:200px;">
            ${deliveryAddress}
          </div>
        </div>

        <div style="padding:20px;background:#f9fafb;border-radius:12px;border:1px solid #eee;">
          <strong style="color:#111;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Customer Contact</strong>
          <div style="margin-top:8px;font-size:14px;color:#555;font-weight:600;">
            <a href="mailto:${billing.email}" style="color:#C09828;text-decoration:none;">${billing.email}</a><br/>
            ${billing.phone || 'No phone provided'}
          </div>
        </div>
      </div>
    </div>`;
}

function buildCustomerEmail({ orderId, billing, deliveryMethod, items, subtotal, discount, total }) {
  const isCollection = deliveryMethod === 'collection';

  const discountRow = discount > 0
    ? `<tr><td style="padding:10px 0;font-size:14px;color:#27ae60;border-top:1px solid #eee;">Discount (10%)</td><td style="padding:10px 0;font-size:14px;color:#27ae60;text-align:right;font-weight:700;border-top:1px solid #eee;">-${formatCurrency(discount)}</td></tr>`
    : '';

  const deliveryNote = isCollection
    ? '<p style="font-size:15px;color:#555;line-height:1.7;background:#fdfcf9;padding:16px;border-left:4px solid #C09828;border-radius:4px;">You\'ve chosen <strong>collection</strong>. We\'ll confirm when your order is ready for pickup from our store.</p>'
    : '<p style="font-size:15px;color:#555;line-height:1.7;background:#f6f7ff;padding:16px;border-left:4px solid #111;border-radius:4px;">Your order will be <strong>delivered</strong> to the address provided. We\'ll share tracking details once dispatched!</p>';

  // Beautiful gallery layout for the email footer
  const galleryHtml = `
    <div style="margin-top: 40px; text-align: center;">
      <h3 style="font-family:'Playfair Display', serif; color:#111; font-size:18px; margin-bottom:20px;">Freshness guaranteed.</h3>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="31%" style="padding:4px;"><img src="https://vitrafruits.co.za/images/grapefruitslices1.png" alt="Grapefruit" style="width:100%; height:auto; border-radius:8px; background:#f0f2f5;" /></td>
          <td width="31%" style="padding:4px;"><img src="https://vitrafruits.co.za/images/Orangeslices1.png" alt="Orange" style="width:100%; height:auto; border-radius:8px; background:#f0f2f5;" /></td>
          <td width="31%" style="padding:4px;"><img src="https://vitrafruits.co.za/images/limeslices1.png" alt="Lime" style="width:100%; height:auto; border-radius:8px; background:#f0f2f5;" /></td>
        </tr>
      </table>
    </div>
  `;

  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="background:#111;padding:40px;text-align:center;">
        <img src="https://vitrafruits.co.za/images/logo.jpg" alt="Vitra Fruit" style="height:56px; border-radius:12px; margin-bottom: 24px;" />
        <h1 style="margin:0;color:#fff;font-size:26px;font-family:'Playfair Display', serif;font-weight:700;">Thank you for your order!</h1>
        <p style="margin:10px 0 0;color:#C09828;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Order ${orderId}</p>
      </div>

      <div style="padding:40px;">
        <p style="font-size:16px;color:#111;line-height:1.6;margin-bottom:24px;font-weight:600;">
          Hi ${billing.firstName || 'there'},<br/>
          <span style="font-weight:400;color:#555;">We've received your order and it's being processed. You'll receive a full confirmation once your payment clears through PayFast.</span>
        </p>

        ${deliveryNote}

        <table style="width:100%;border-collapse:collapse;margin:30px 0;">
          <thead>
            <tr>
              <th style="border-bottom:2px solid #111;text-align:left;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Item</th>
              <th style="border-bottom:2px solid #111;text-align:center;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Qty</th>
              <th style="border-bottom:2px solid #111;text-align:right;padding:12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding:16px 0;font-size:18px;font-weight:800;color:#111;border-top:2px solid #111;">Total</td>
            <td style="padding:16px 0;font-size:18px;font-weight:800;color:#C09828;text-align:right;border-top:2px solid #111;">${formatCurrency(total)}</td>
          </tr>
        </table>
        
        ${galleryHtml}
      </div>

      <div style="padding:30px;background:#f9fafb;border-top:1px solid #eee;border-radius:0 0 16px 16px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:15px;color:#111;font-weight:700;text-decoration:none;">orderinfo@vitrafruits.co.za</a>
      </div>
    </div>`;
}
