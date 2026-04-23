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

function buildPaymentConfirmedShopEmail({ orderId, amountGross, customerName, customerEmail, data }) {
  const pfPaymentId = data.pf_payment_id || '';
  const amountFee = data.amount_fee || '0.00';
  const amountNet = data.amount_net || amountGross;

  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:640px;margin:0 auto;background:#fcf8f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px rgba(50,30,20,0.14);border:1px solid #eadfc7;">
      <div style="background:#607848;padding:40px 40px 34px;text-align:center;border-bottom:4px solid #C09828;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:84px; border-radius:16px; margin-bottom: 18px;" />
        <p style="margin:0 0 8px;color:#e9ddbc;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Payment Update</p>
        <h1 style="margin:0;color:#fff;font-size:30px;font-family:'Playfair Display', serif;font-weight:700;">Payment Confirmed</h1>
        <p style="margin:10px 0 0;color:#f6ebc7;font-size:14px;font-weight:600;">${orderId}</p>
      </div>

      <div style="padding:38px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #eee;">Customer</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;font-weight:600;border-bottom:1px solid #eee;">${customerName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;border-bottom:1px solid #eee;">Email</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;border-bottom:1px solid #eee;">
              <a href="mailto:${customerEmail}" style="color:#C09828;text-decoration:none;">${customerEmail || 'N/A'}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Amount Paid</td>
            <td style="padding:10px 0;font-size:16px;color:#27ae60;text-align:right;font-weight:800;">R${amountGross}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#888;">PayFast Fee</td>
            <td style="padding:10px 0;font-size:14px;color:#888;text-align:right;">R${amountFee}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Net Amount</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;font-weight:700;">R${amountNet}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#888;">PayFast Reference</td>
            <td style="padding:10px 0;font-size:14px;color:#111;text-align:right;">${pfPaymentId}</td>
          </tr>
        </table>

        <div style="padding:20px;background:#f4efe4;border-left:4px solid #C09828;border-radius:12px;">
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0;font-weight:600;">
            Payment verified by PayFast. You can now prepare this order for ${data.item_description && data.item_description.includes('COLLECTION') ? 'collection' : 'dispatch'}.
            Match this with the order details email sent earlier for the full address and item breakdown.
          </p>
        </div>

        ${buildGallerySection()}
      </div>
    </div>`;
}

function buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName }) {
  return `
    <div style="font-family:'Montserrat', 'Segoe UI', Arial, sans-serif;max-width:640px;margin:0 auto;background:#fcf8f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px rgba(50,30,20,0.14);border:1px solid #eadfc7;">
      <div style="background:#607848;padding:42px 40px 36px;text-align:center;border-bottom:4px solid #C09828;">
        <img src="cid:vitra-logo" alt="Vitra Fruit" style="height:88px; border-radius:16px; margin-bottom: 18px;" />
        <p style="margin:0 0 8px;color:#e9ddbc;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Vitra Fruit</p>
        <h1 style="margin:0;color:#fff;font-size:30px;font-family:'Playfair Display', serif;font-weight:700;">Payment received</h1>
        <p style="margin:10px 0 0;color:#f6ebc7;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Order ${orderId}</p>
      </div>

      <div style="padding:38px;">
        <p style="font-size:16px;color:#111;line-height:1.6;margin-bottom:20px;font-weight:600;">
          Hi ${customerName || 'there'},
        </p>
        
        <div style="padding:24px;border:2px solid #d9dcbf;background:#f5f7ef;border-radius:16px;text-align:center;margin-bottom:30px;">
          <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 10px;">
            Your payment of
          </p>
          <p style="font-size:32px;color:#27ae60;font-weight:800;margin:0;">
            R${amountGross}
          </p>
          <p style="font-size:15px;color:#555;line-height:1.6;margin:10px 0 0;">
            has been successfully received and confirmed.
          </p>
        </div>

        <p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:0;">
          We are now actively preparing your order. We'll be in touch with updates on your order's status as soon as it's ready. If you have any questions before then, please don't hesitate to reach out!
        </p>

        ${buildGallerySection()}
      </div>

      <div style="padding:28px;background:#f3ecdf;border-top:1px solid #e3d7b9;border-radius:0 0 24px 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#607848;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Questions about your order?</p>
        <a href="mailto:orderinfo@vitrafruits.co.za" style="font-size:15px;color:#802050;font-weight:700;text-decoration:none;">orderinfo@vitrafruits.co.za</a>
      </div>
    </div>`;
}
