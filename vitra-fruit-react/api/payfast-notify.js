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

    // Parse custom order data
    let payloadStr = '';
    if (data.custom_str1) payloadStr += data.custom_str1;
    if (data.custom_str2) payloadStr += data.custom_str2;
    if (data.custom_str3) payloadStr += data.custom_str3;
    if (data.custom_str4) payloadStr += data.custom_str4;
    if (data.custom_str5) payloadStr += data.custom_str5;

    let orderData = null;
    try {
      if (payloadStr) orderData = JSON.parse(payloadStr);
    } catch (e) {
      console.error('ITN: Failed to parse custom payload', e);
    }

    // Email transport — timeouts so SMTP problems can never hang the ITN.
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

    // Send both notifications concurrently — they are independent, and running
    // them in parallel keeps worst-case handler time within the serverless
    // budget so the ITN 200 ACK is never starved (a late ACK makes PayFast
    // retry and duplicate the emails).
    const sends = [
      // 1) Notify shop: payment received
      transporter.sendMail({
        from: `"VitraFruits Orders" <${process.env.SMTP_USER}>`,
        to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
        subject: `Payment received — Order ${orderId} — R${amountGross}`,
        html: buildShopPaymentReceivedEmail({
          orderId,
          pfPaymentId: data.pf_payment_id,
          amountGross,
          customerName,
          customerEmail,
          orderData,
        }),
        attachments,
      }).catch((emailErr) => {
        console.error('ITN: Shop payment-received email failed (non-blocking):', emailErr.message || emailErr);
      }),
    ];

    // 2) Notify customer: payment received
    if (customerEmail) {
      sends.push(
        transporter.sendMail({
          from: `"VitraFruits" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          subject: `Good things are heading your way! Order ${orderId}`,
          html: buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName, orderData, publicSiteUrl }),
          attachments,
        }).catch((emailErr) => {
          console.error('ITN: Customer confirmation email failed (non-blocking):', emailErr.message || emailErr);
        })
      );
    }

    await Promise.all(sends);

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
      resolve(false);
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
    <body style="margin:0;padding:0;background:#ffffff;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;">
        <tr><td align="center" style="padding:16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;text-align:left;">
            ${content}
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

function buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName, orderData, publicSiteUrl }) {
  const dateStr = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const b = orderData?.b || {};
  const items = orderData?.i || [];
  const subtotal = orderData?.sub || amountGross;
  const shipping = orderData?.sh || 0;
  const discount = orderData?.d || 0;
  
  // Calculate VAT correctly for the display
  const vat = (parseFloat(amountGross) - parseFloat(amountGross) / 1.15).toFixed(2);

  const addressLines = [
    `${b.f || ''} ${b.l || ''}`.trim(),
    b.s || '',
    b.t || '',
    b.pr || '',
    b.z || '',
    b.p || '',
    b.e || ''
  ].filter(Boolean).join('<br/>');

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">
        ${item.n}<br/>
        &times;${item.q}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;color:#333;text-align:right;font-size:14px;">
        R${(item.p * item.q).toFixed(2)}
      </td>
    </tr>
  `).join('');

    const today = new Date();
    const startDelivery = new Date(today);
    startDelivery.setDate(today.getDate() + 1);
    const endDelivery = new Date(today);
    endDelivery.setDate(today.getDate() + 5);

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const startDeliveryStr = startDelivery.toLocaleString('en-GB', dateOptions);
    const endDeliveryStr = endDelivery.toLocaleString('en-GB', dateOptions);

    const content = `
      <tr>
        <td style="padding:0 0 20px 0;">
          <div style="margin:0 0 20px;">
            <img src="cid:vitra-logo" alt="VitraFruits" width="150" style="display:block; max-width:100%; border-radius:12px;" />
          </div>
          <p style="margin:0 0 20px;font-size:16px;color:#333;"><strong>Good things are heading your way!</strong></p>
          <p style="margin:0 0 20px;font-size:14px;color:#333;">Hi ${b.f || customerName || 'there'},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#333;">We have finished processing your order.</p>
          
          <p style="margin:0 0 30px;font-size:14px;color:#333;background:#f9f9f9;padding:15px;border-radius:8px;">
            The estimated delivery date is between <strong>${startDeliveryStr}</strong> and <strong>${endDeliveryStr}</strong> (1&ndash;5 business days).
          </p>
        
        <p style="margin:0 0 15px;font-size:14px;color:#333;">Here’s a reminder of what you’ve ordered:</p>
        
        <h2 style="margin:0 0 5px;font-size:18px;color:#333;font-weight:bold;">Order summary</h2>
        <p style="margin:0 0 15px;font-size:14px;color:#333;">Order ${orderId} (${dateStr})</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:2px solid #333;padding:8px 0;font-size:14px;">Product &amp; Quantity</th>
              <th style="text-align:right;border-bottom:2px solid #333;padding:8px 0;font-size:14px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:30px;">
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#333;">Subtotal:</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">R${parseFloat(subtotal).toFixed(2)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#333;">Discount:</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">-R${parseFloat(discount).toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#333;">Shipping:</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">${parseFloat(shipping) === 0 ? 'Free shipping' : 'R' + parseFloat(shipping).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:16px;color:#333;font-weight:bold;">Total:</td>
            <td style="padding:8px 0;font-size:16px;color:#333;text-align:right;font-weight:bold;">R${amountGross}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 0 10px 0;font-size:12px;color:#666;text-align:right;">(includes R${vat} VAT)</td>
          </tr>
        </table>

        <p style="margin:0 0 5px;font-size:14px;color:#333;"><strong>Payment method:</strong> Payfast</p>
        
        <h2 style="margin:20px 0 10px;font-size:16px;color:#333;font-weight:bold;">Billing address</h2>
        <p style="margin:0 0 30px;font-size:14px;color:#333;line-height:1.5;">
          ${addressLines}
        </p>

        <p style="margin:0 0 30px;font-size:14px;color:#333;">Thanks for shopping with us.</p>
        
        <p style="margin:0 0 5px;font-size:14px;color:#333;"><strong>VitraFruits</strong></p>
        <p style="margin:0 0 20px;font-size:12px;color:#666;line-height:1.5;">
          Thank you for shopping at VitraFruits!<br/><br/>
          Need help?<br/>
          WhatsApp: 078 404 5558<br/>
          Mon-Fri: 8AM – 5PM<br/>
          Email: info@vitrafruits.co.za<br/><br/>
          VitraFruits | vitrafruits.co.za
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}

function buildShopPaymentReceivedEmail({ orderId, pfPaymentId, amountGross, customerName, customerEmail, orderData }) {
  const dateStr = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
  const rawB = orderData && orderData.b ? orderData.b : null;
  const b = rawB && Object.values(rawB).some((v) => String(v == null ? '' : v).trim() !== '') ? rawB : null;
  const items = (orderData && orderData.i) || [];
  const subtotal = orderData ? orderData.sub : null;
  const shipping = orderData ? orderData.sh : null;
  const discount = (orderData && orderData.d) || 0;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">${item.n} &times;${item.q}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;color:#333;text-align:right;font-size:14px;">R${(Number(item.p) * Number(item.q)).toFixed(2)}</td>
    </tr>`).join('');

  const totalsRows = `
    ${subtotal != null ? `<tr><td style="padding:4px 0;font-size:14px;color:#333;">Subtotal:</td><td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">R${Number(subtotal).toFixed(2)}</td></tr>` : ''}
    ${discount > 0 ? `<tr><td style="padding:4px 0;font-size:14px;color:#607848;">Discount:</td><td style="padding:4px 0;font-size:14px;color:#607848;text-align:right;">-R${Number(discount).toFixed(2)}</td></tr>` : ''}
    ${shipping != null ? `<tr><td style="padding:4px 0;font-size:14px;color:#333;">Shipping:</td><td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">${Number(shipping) === 0 ? 'Free / Collection' : 'R' + Number(shipping).toFixed(2)}</td></tr>` : ''}
    <tr><td style="padding:8px 0;font-size:16px;color:#333;font-weight:bold;">Paid:</td><td style="padding:8px 0;font-size:16px;color:#c03030;text-align:right;font-weight:bold;">R${amountGross}</td></tr>`;

  const addressHtml = b
    ? `<p style="margin:0 0 20px;font-size:14px;color:#333;line-height:1.7;">
         ${[`${b.f || ''} ${b.l || ''}`.trim(), b.s, b.t, b.pr, b.z, b.p, b.e].filter(Boolean).join('<br/>')}
       </p>`
    : `<p style="margin:0 0 20px;font-size:14px;color:#c03030;font-weight:600;">
         Delivery address was not transmitted with this payment.
         Retrieve it from the PayFast dashboard: Transactions &rarr; ${orderId} &rarr; custom_str fields.
       </p>`;

  const content = `
    <tr>
      <td style="padding:0 0 20px 0;">
        <div style="margin:0 0 20px;">
          <img src="cid:vitra-logo" alt="VitraFruits" width="150" style="display:block;max-width:100%;border-radius:12px;" />
        </div>
        <h1 style="margin:0 0 6px;font-size:20px;color:#333;">Payment received &mdash; Order ${orderId}</h1>
        <p style="margin:0 0 20px;font-size:13px;color:#888;">${dateStr}${pfPaymentId ? ` &middot; PayFast payment ${pfPaymentId}` : ''}</p>
        <p style="margin:0 0 20px;font-size:14px;color:#333;">
          <strong>${customerName || 'A customer'}</strong> has paid <strong>R${amountGross}</strong> via PayFast.
          This order is confirmed and ready to fulfil.
        </p>
        ${items.length ? `
        <h2 style="margin:0 0 10px;font-size:16px;color:#333;">Items</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">${itemRows}</table>` : ''}
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">${totalsRows}</table>
        <h2 style="margin:0 0 10px;font-size:16px;color:#333;">Deliver to</h2>
        ${addressHtml}
        <h2 style="margin:0 0 10px;font-size:16px;color:#333;">Customer contact</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#333;">
          ${customerEmail ? `<a href="mailto:${customerEmail}" style="color:#c03030;text-decoration:none;">${customerEmail}</a>` : 'No email provided'}${b && b.p ? `<br/>${b.p}` : ''}
        </p>
      </td>
    </tr>`;

  return emailWrapper(content);
}

module.exports.buildShopPaymentReceivedEmail = buildShopPaymentReceivedEmail;
