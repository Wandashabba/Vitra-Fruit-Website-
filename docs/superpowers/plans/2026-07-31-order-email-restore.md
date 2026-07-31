# Order Email Restore & Fail-Safe Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the two deleted order-notification emails (shop payment-received + customer order-received), make checkout block when the shop cannot be notified, and point SMTP at a mail host that actually exists.

**Architecture:** Three Vercel serverless functions (`api/create-order.js`, `api/payfast-notify.js`, `api/update-order-status.js`) send email via nodemailer; a static checkout page driven by `public/cart.js` posts to `create-order` then redirects to PayFast, which later calls back `payfast-notify` (ITN). All changes are in these four files plus env config. No database — email is the system of record, so the checkout-time shop email becomes a blocking precondition for payment.

**Tech Stack:** Node 20 serverless functions (CommonJS), nodemailer 6.x, plain-JS test scripts run with `node` (repo convention — no jest for API code), dotenv (resolved transitively) for local scripts.

**Spec:** `docs/superpowers/specs/2026-07-31-order-email-restore-design.md`

**Working directory for all commands:** `vitra-fruit-react/` inside the repo (`cd "/Users/wandileshabangu/Vitra Fruit Website/Vitra-Fruit-Website-/vitra-fruit-react"`). Git commands run from the repo root or any subdirectory.

**Repo conventions:** API files are CommonJS (`require`/`module.exports`). Test scripts live in `vitra-fruit-react/` root named `test-*.js`, run directly with `node`, print PASS/FAIL, exit 0/1. Email templates are inline-styled HTML table functions per API file. Do not edit anything under `build/` (gitignored, regenerated on deploy).

---

### Task 1: SMTP configuration — correct host, TLS derivation, env cleanup

The root cause: `SMTP_HOST=mail.vitrafruits.co.za` is NXDOMAIN. The domain's mail is GoDaddy Workspace Email (MX `smtp.secureserver.net`/`mailstore1.secureserver.net`, SPF `include:secureserver.net -all`), whose outgoing relay is `smtpout.secureserver.net`. Port 465 requires `secure: true` (TLS-on-connect); the code hardcodes `secure: false` everywhere — fix by deriving from port.

**Files:**
- Modify: `vitra-fruit-react/.env` (SMTP_HOST/SMTP_PORT lines)
- Modify: `vitra-fruit-react/.env.example` (SMTP section)
- Modify: `vitra-fruit-react/api/create-order.js:56-66` (transporter)
- Modify: `vitra-fruit-react/api/payfast-notify.js:56-66` (transporter)
- Modify: `vitra-fruit-react/api/update-order-status.js:42-50` (transporter)
- Create: `vitra-fruit-react/test-smtp-connection.js`

- [ ] **Step 1: Fix `.env`**

Replace these two lines (note the inline comment glued to the value — it must go):

```
SMTP_HOST=mail.vitrafruits.co.za  # Or smtp.gmail.com if you use Google Workspace
SMTP_PORT=587
```

with:

```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
```

- [ ] **Step 2: Fix `.env.example` SMTP section**

Replace:

```
# SMTP settings (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=wandileshaba96@gmail.com
SMTP_PASS=your-gmail-app-password-here

# Where order notification emails are sent
ORDER_EMAIL_TO=wandileshaba96@gmail.com
```

with:

```
# SMTP settings — domain mail is GoDaddy Workspace Email (secureserver.net).
# The outgoing relay is smtpout.secureserver.net; SPF is "include:secureserver.net -all"
# so mail MUST be sent through GoDaddy or it will be rejected. Port 465 = SSL.
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=orderinfo@vitrafruits.co.za
SMTP_PASS=your-mailbox-password-here

# Where order notification emails are sent
ORDER_EMAIL_TO=orderinfo@vitrafruits.co.za
```

- [ ] **Step 3: Derive `secure` from port in `api/create-order.js`**

Replace (inside the handler, currently ~line 56):

```js
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
        },
        connectionTimeout: 10000, // 10s connect timeout
        socketTimeout: 15000,     // 15s socket timeout
      });
```

with:

```js
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
```

(Note: Task 2 restructures the surrounding try/catch; the transporter block itself stays as written here.)

- [ ] **Step 4: Same change in `api/payfast-notify.js`** (currently ~line 56)

Identical replacement to Step 3 — same old block, same new block (this file's transporter is inside its own `try {`; keep it there for now, Task 3 restructures).

- [ ] **Step 5: Same change in `api/update-order-status.js`** (currently ~line 42)

Replace:

```js
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
    });
```

with:

```js
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: smtpPort,
      secure: smtpPort === 465, // TLS-on-connect for 465, STARTTLS otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
```

- [ ] **Step 6: Create `test-smtp-connection.js`**

```js
// Verifies SMTP connection + auth using values from .env.
// Does NOT send any email — transporter.verify() only does EHLO/AUTH.
// Run: node test-smtp-connection.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
  },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

console.log(`Testing ${process.env.SMTP_HOST}:${smtpPort} as ${process.env.SMTP_USER} ...`);
transporter.verify(function (error) {
  if (error) {
    console.error('FAIL:', error.message);
    process.exit(1);
  }
  console.log('PASS: SMTP server accepted connection and credentials');
  process.exit(0);
});
```

- [ ] **Step 7: Syntax-check all touched JS**

Run: `node --check api/create-order.js && node --check api/payfast-notify.js && node --check api/update-order-status.js && node --check test-smtp-connection.js && echo SYNTAX-OK`
Expected: `SYNTAX-OK`

(Do **not** run `test-smtp-connection.js` yet — the local `.env` password may be stale; live verification happens in Task 5.)

- [ ] **Step 8: Commit**

```bash
git add vitra-fruit-react/.env.example vitra-fruit-react/api/create-order.js vitra-fruit-react/api/payfast-notify.js vitra-fruit-react/api/update-order-status.js vitra-fruit-react/test-smtp-connection.js
git commit -m "fix: point SMTP at GoDaddy relay and derive TLS mode from port

mail.vitrafruits.co.za does not exist in DNS (NXDOMAIN); every order email
has been silently failing. Domain mail lives on secureserver.net (GoDaddy),
outgoing relay smtpout.secureserver.net:465. secure:false was hardcoded,
which breaks TLS-on-connect ports; now derived from the port."
```

Note `.env` is gitignored (secrets) — the edit in Step 1 is local-only and intentionally not committed.

---

### Task 2: `api/create-order.js` — blocking shop email + restore customer email

Currently the shop email failure is swallowed (`emailSent:false` returned but never read) and the customer email was deleted in commit `0e08cc0` leaving `buildCustomerEmail()` orphaned at lines 370-449. Make the shop email a blocking precondition (fail → 502, no PayFast redirect) and re-wire the customer email as best-effort.

**Files:**
- Modify: `vitra-fruit-react/api/create-order.js:52-85` (email send block)
- Test: `vitra-fruit-react/test-blocking-checkout.js` (create)

- [ ] **Step 1: Write the failing test — `test-blocking-checkout.js`**

```js
// Verifies checkout is BLOCKED (HTTP 502) when the shop notification email
// cannot be sent. Orders have no persistence besides email, so a customer must
// never pay for an order the shop can't see.
// Run: node test-blocking-checkout.js
process.env.SMTP_HOST = 'smtp.invalid';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'orderinfo@vitrafruits.co.za';
process.env.SMTP_PASS = 'not-a-real-password';
process.env.ORDER_EMAIL_TO = 'orderinfo@vitrafruits.co.za';
process.env.PUBLIC_SITE_URL = 'https://www.vitrafruits.co.za';

const handler = require('./api/create-order.js');

const req = {
  method: 'POST',
  headers: { origin: 'https://www.vitrafruits.co.za', host: 'www.vitrafruits.co.za' },
  body: {
    billing: {
      firstName: 'Test', lastName: 'Customer', email: 'test@example.com',
      phone: '0800000000', street: '1 Test St', town: 'Cape Town',
      province: 'Western Cape', postcode: '8000',
    },
    shipping: null,
    deliveryMethod: 'delivery',
    // 2 x Lemon Slices 100g @ R120 = R240, -10% (R24), +R150 shipping = R366
    items: [{ name: 'Dehydrated Lemon Slices', size: '100g', price: 120, quantity: 2 }],
    subtotal: 240,
    discount: 24,
    total: 366,
  },
};

let statusCode = null;
let payload = null;
const res = {
  setHeader() {},
  status(code) { statusCode = code; return this; },
  json(obj) { payload = obj; return this; },
  end() { return this; },
};

(async () => {
  await handler(req, res);
  console.log('status:', statusCode, 'payload:', JSON.stringify(payload));
  if (statusCode === 502 && payload && /couldn/i.test(payload.error || '')) {
    console.log('PASS: checkout blocked when shop email fails');
    process.exit(0);
  }
  console.error('FAIL: expected 502 blocking response, got', statusCode);
  process.exit(1);
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node test-blocking-checkout.js`
Expected: `FAIL: expected 502 blocking response, got 200` — current code swallows the send error and returns `{ success: true, orderId, emailSent: false }`. (Takes a few seconds: DNS failure on `smtp.invalid`.)

- [ ] **Step 3: Implement the blocking + customer email**

In `api/create-order.js`, replace the whole block from the comment above the transporter through the success return (currently lines 52-85, beginning `// Attempt to send the shop owner notification email (non-blocking).` and ending `return res.status(200).json({ success: true, orderId, emailSent });`) with:

```js
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
```

Also delete the now-unused declaration `let emailSent = false;` (currently line 54) — it is replaced by the literal `emailSent: true` in the success response (kept for frontend compatibility). `buildCustomerEmail` already exists at the bottom of the file with exactly the parameter object used above — do not redefine it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node test-blocking-checkout.js`
Expected: `PASS: checkout blocked when shop email fails` (status 502)

- [ ] **Step 5: Syntax check**

Run: `node --check api/create-order.js && echo SYNTAX-OK`
Expected: `SYNTAX-OK`

- [ ] **Step 6: Commit**

```bash
git add vitra-fruit-react/api/create-order.js vitra-fruit-react/test-blocking-checkout.js
git commit -m "fix: block checkout when shop order email fails; restore customer order-received email

The shop notification is the only record of an order. Previously a send
failure was swallowed and the customer paid for an order nobody could see
(VF-MS7CVT7D-XW96). Now a failed shop email returns 502 and the customer is
never redirected to PayFast. Also re-wires buildCustomerEmail (orphaned by
0e08cc0) as a best-effort order-received email."
```

---

### Task 3: `api/payfast-notify.js` — shop "Payment received" email

The ITN handler currently emails only the customer. Add the notification Mary asked for: shop email on every COMPLETE payment with items, totals, delivery address (decoded from `custom_str1-5`), and customer contact — with a PayFast-dashboard fallback note when the payload is missing. Each email gets its own try/catch so one failing can't kill the other. Also fix the grammar in the customer template.

**Files:**
- Modify: `vitra-fruit-react/api/payfast-notify.js:53-82` (email send block), `:243` (grammar), end of file (new template + export)
- Test: `vitra-fruit-react/test-itn-shop-email.js` (create)

- [ ] **Step 1: Write the failing test — `test-itn-shop-email.js`**

```js
// Verifies the ITN shop "payment received" email template renders the
// delivery address, items and totals — and points at the PayFast dashboard
// when the custom payload is missing.
// Run: node test-itn-shop-email.js
const notify = require('./api/payfast-notify.js');
const build = notify.buildShopPaymentReceivedEmail;

if (typeof build !== 'function') {
  console.error('FAIL: buildShopPaymentReceivedEmail is not exported');
  process.exit(1);
}

const orderData = {
  b: {
    f: 'Dru-Anne', l: 'Dookhi', e: 'druanne18@gmail.com', p: '0820000000',
    s: '12 Example Road', t: 'Durban', pr: 'KwaZulu-Natal', z: '4001',
  },
  i: [{ n: 'Dehydrated Lemon Slices 100g', q: 2, p: 120 }],
  sub: 240, sh: 150, d: 24,
};

const html = build({
  orderId: 'VF-TEST-1234', pfPaymentId: '999999', amountGross: '366.00',
  customerName: 'Dru-Anne Dookhi', customerEmail: 'druanne18@gmail.com', orderData,
});

const mustContain = [
  'VF-TEST-1234', '12 Example Road', 'Durban', 'KwaZulu-Natal', '4001',
  'Dehydrated Lemon Slices', 'druanne18@gmail.com', '366.00',
];
const missing = mustContain.filter((s) => !html.includes(s));
if (missing.length) {
  console.error('FAIL: missing from rendered template:', missing);
  process.exit(1);
}

const fallbackHtml = build({
  orderId: 'VF-TEST-1234', pfPaymentId: '999999', amountGross: '366.00',
  customerName: 'X', customerEmail: 'x@example.com', orderData: null,
});
if (!/PayFast dashboard/i.test(fallbackHtml)) {
  console.error('FAIL: fallback note (PayFast dashboard) missing when payload absent');
  process.exit(1);
}

console.log('PASS: ITN shop email template');
process.exit(0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node test-itn-shop-email.js`
Expected: `FAIL: buildShopPaymentReceivedEmail is not exported`

- [ ] **Step 3: Restructure the email send block in the handler**

Replace the block currently at lines 53-82 (from `// Setup email — use timeouts and graceful handling ...` through the closing `}` of `catch (emailErr) { ... }` that logs `'ITN: Customer confirmation email failed (non-blocking):'`) with:

```js
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

    // 1) Notify shop: payment received. Independent try/catch — a failure here
    //    must not stop the customer confirmation, and vice versa.
    try {
      await transporter.sendMail({
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
      });
    } catch (emailErr) {
      console.error('ITN: Shop payment-received email failed (non-blocking):', emailErr.message || emailErr);
    }

    // 2) Notify customer: payment received
    try {
      if (customerEmail) {
        await transporter.sendMail({
          from: `"VitraFruits" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          subject: `Good things are heading your way! Order ${orderId}`,
          html: buildPaymentConfirmedCustomerEmail({ orderId, amountGross, customerName, orderData, publicSiteUrl }),
          attachments,
        });
      }
    } catch (emailErr) {
      console.error('ITN: Customer confirmation email failed (non-blocking):', emailErr.message || emailErr);
    }
```

(`buildEmailAttachments` catches its own errors and returns `[]`, so it is safe outside a try/catch. `data`, `orderId`, `amountGross`, `customerName`, `customerEmail`, `orderData` are all already in scope at this point in the handler.)

- [ ] **Step 4: Add the new template function at the end of the file (after `buildPaymentConfirmedCustomerEmail`)**

```js
function buildShopPaymentReceivedEmail({ orderId, pfPaymentId, amountGross, customerName, customerEmail, orderData }) {
  const dateStr = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
  const b = orderData && orderData.b ? orderData.b : null;
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
```

Then add the export as the **last line of the file** (the file already assigns `module.exports = async function handler...` at the top; attaching a property to it is valid CommonJS):

```js
module.exports.buildShopPaymentReceivedEmail = buildShopPaymentReceivedEmail;
```

- [ ] **Step 5: Grammar fix in the customer template**

In `buildPaymentConfirmedCustomerEmail` (currently ~line 243), replace:

```
The estimated delivery date is between <strong>${startDeliveryStr}</strong> and <strong>${endDeliveryStr}</strong>. It must take 1-5 days delivery.
```

with:

```
The estimated delivery date is between <strong>${startDeliveryStr}</strong> and <strong>${endDeliveryStr}</strong> (1&ndash;5 business days).
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node test-itn-shop-email.js`
Expected: `PASS: ITN shop email template`

- [ ] **Step 7: Syntax check**

Run: `node --check api/payfast-notify.js && echo SYNTAX-OK`
Expected: `SYNTAX-OK`

- [ ] **Step 8: Commit**

```bash
git add vitra-fruit-react/api/payfast-notify.js vitra-fruit-react/test-itn-shop-email.js
git commit -m "feat: notify shop on completed PayFast payment with delivery address

Restores the payment-received notification removed in 0e08cc0. On every
COMPLETE ITN the shop now gets order items, totals, the delivery address
decoded from custom_str1-5, and customer contact — with a PayFast-dashboard
fallback note when the payload is missing. Shop and customer emails send in
independent try/catch blocks so one failure cannot suppress the other."
```

---

### Task 4: `public/cart.js` — pin notify_url, drop dead domains, surface server errors

PayFast's server-to-server callback must not depend on the customer's browsing origin: the apex domain 307-redirects `/api/*` to www, and PayFast is not guaranteed to follow redirects. Also `vitrafruit.com` is NXDOMAIN, and the new 502 error message from Task 2 must reach the customer readably.

**Files:**
- Modify: `vitra-fruit-react/public/cart.js:316-331` (endpoints), `:349-356` (error parsing), `:727` and `:853` (notify_url), `:863-866` (error display)

- [ ] **Step 1: Remove dead domains from `getCheckoutEndpoints`**

Replace (currently lines 317-325):

```js
    const origin = window.location.origin || '';
    const candidateApiBases = [
      origin,
      'https://vitrafruit.com',
      'https://www.vitrafruit.com',
      'https://vitrafruits.co.za',
      'https://www.vitrafruits.co.za'
    ];
    const returnBase = origin || 'https://vitrafruit.com';
```

with:

```js
    const origin = window.location.origin || '';
    const candidateApiBases = [
      origin,
      'https://www.vitrafruits.co.za',
      'https://vitrafruits.co.za'
    ];
    const returnBase = origin || 'https://www.vitrafruits.co.za';
```

- [ ] **Step 2: Parse server error messages in `createOrderRequest`**

Replace (currently lines 349-356):

```js
        const errText = await response.text();
        lastError = new Error(`Failed to create order (${response.status}) via ${base}: ${errText}`);

        if (response.status === 404) {
          continue;
        }

        throw lastError;
```

with:

```js
        const errText = await response.text();
        let serverMessage = '';
        try { serverMessage = JSON.parse(errText).error || ''; } catch (parseErr) { /* body was not JSON */ }

        if (response.status === 404) {
          lastError = new Error(`Failed to create order (404) via ${base}`);
          continue;
        }

        lastError = new Error(serverMessage || `Failed to create order (${response.status}) via ${base}`);
        if (serverMessage) lastError.isServerMessage = true;
        throw lastError;
```

(The `Failed to create order (404)` message format must be preserved — the catch block at line ~359 regex-matches it to decide whether to try the next base.)

- [ ] **Step 3: Pin `notify_url` (both places)**

At line ~727 replace:

```js
      setField('notify_url', '');
```

with:

```js
      setField('notify_url', 'https://www.vitrafruits.co.za/api/payfast-notify');
```

At line ~853 replace:

```js
            setField('notify_url', apiBase + '/api/payfast-notify');
```

with:

```js
            // Pinned to the canonical host: PayFast's server-to-server callback
            // must not depend on the customer's browsing origin (the apex domain
            // 307-redirects /api/*, and PayFast may not follow redirects).
            setField('notify_url', 'https://www.vitrafruits.co.za/api/payfast-notify');
```

(The `apiBase` variable remains in use for the create-order request itself — do not remove it.)

- [ ] **Step 4: Show server-provided error messages verbatim**

In the submit handler's catch block, replace (currently lines 863-866):

```js
            if (payfastNote) {
              payfastNote.style.color = '#c53b56';
              payfastNote.textContent = `Oops, something went wrong saving your order: ${err.message}. Please try again.`;
            }
```

with:

```js
            if (payfastNote) {
              payfastNote.style.color = '#c53b56';
              payfastNote.textContent = err && err.isServerMessage
                ? err.message
                : 'Oops, something went wrong saving your order. Please try again.';
            }
```

- [ ] **Step 5: Syntax check + verify no stray references**

Run: `node --check public/cart.js && grep -n "vitrafruit\.com" public/cart.js; grep -c "www.vitrafruits.co.za/api/payfast-notify" public/cart.js`
Expected: no `vitrafruit.com` matches (grep prints nothing for it), count `2` for the pinned notify_url, no syntax errors.

- [ ] **Step 6: Commit**

```bash
git add vitra-fruit-react/public/cart.js
git commit -m "fix: pin PayFast notify_url to canonical host, drop dead domains, surface order errors

notify_url now always points at https://www.vitrafruits.co.za/api/payfast-notify
so the ITN callback never hits the apex 307 redirect. Removes NXDOMAIN
vitrafruit.com fallbacks and shows the server's checkout error message to the
customer instead of a raw JSON blob."
```

---

### Task 5: Local verification

**Files:** none modified.

- [ ] **Step 1: Full syntax + test sweep**

Run: `node --check api/create-order.js && node --check api/payfast-notify.js && node --check api/update-order-status.js && node --check public/cart.js && node test-blocking-checkout.js && node test-itn-shop-email.js`
Expected: both scripts print PASS, exit 0.

- [ ] **Step 2: SMTP connection test with real credentials**

Run: `node test-smtp-connection.js`
Expected: `PASS: SMTP server accepted connection and credentials`.
If it prints `FAIL: Invalid login` (auth error): the connection/TLS fix works but the `.env` password is not the real GoDaddy mailbox password — **stop and ask Wandile for the correct `orderinfo@vitrafruits.co.za` mailbox password** (and note the same correct password must go into Vercel). If it fails with a connection/DNS error, investigate before proceeding (do not rationalize it away — the entire fix depends on this host being reachable).

- [ ] **Step 3: (Only with explicit user go-ahead) send one real test email**

Ask the user first. Then run: `node send-status.js` is NOT the tool for this — instead run a one-off:

```bash
node -e "
require('dotenv').config();
const nm = require('nodemailer');
const p = parseInt(process.env.SMTP_PORT || '587', 10);
const t = nm.createTransport({ host: process.env.SMTP_HOST, port: p, secure: p === 465, auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '') } });
t.sendMail({ from: '\"VitraFruits Test\" <' + process.env.SMTP_USER + '>', to: process.env.ORDER_EMAIL_TO, subject: 'SMTP fix verification — ' + new Date().toISOString(), text: 'If you can read this, order emails are working again.' }).then(i => { console.log('SENT', i.response); process.exit(0); }).catch(e => { console.error('FAIL', e.message); process.exit(1); });
"
```

Expected: `SENT 250 ...` and the email arrives in the `orderinfo@vitrafruits.co.za` inbox.

---

### Task 6: Deployment handoff (user actions + end-to-end test)

**Files:** none. This task is instructions for Wandile — present as a checklist, do not attempt the Vercel dashboard steps yourself.

- [ ] **Step 1: Vercel environment variables** (Vercel dashboard → project → Settings → Environment Variables, Production scope):
  - `SMTP_HOST` = `smtpout.secureserver.net`
  - `SMTP_PORT` = `465`
  - `SMTP_USER` = `orderinfo@vitrafruits.co.za`
  - `SMTP_PASS` = the real GoDaddy mailbox password (the one that passed Task 5 Step 2)
  - `ORDER_EMAIL_TO` = `orderinfo@vitrafruits.co.za`
  - `PUBLIC_SITE_URL` = `https://www.vitrafruits.co.za`

- [ ] **Step 2: Ship the code** — push `tumo` and merge to `main` via PR (repo convention, e.g. PR #81), which triggers the Vercel production deploy:

```bash
git push origin tumo
gh pr create --base main --head tumo --title "Restore order emails, fail-safe checkout, fix SMTP host" --body "See docs/superpowers/specs/2026-07-31-order-email-restore-design.md"
```

- [ ] **Step 3: End-to-end test** (after deploy): place one real low-value order on the live site (e.g. cheapest item, collection) and confirm all four emails arrive:
  1. Shop: "New Order VF-… — COLLECTION — R…" (checkout time)
  2. Customer: "We've received your order VF-…" (checkout time)
  3. Shop: "Payment received — Order VF-… — R…" **with the address/collection details** (after paying)
  4. Customer: "Good things are heading your way! Order VF-…" (after paying)

  Then refund the test transaction from the PayFast dashboard if desired.

- [ ] **Step 4: Confirm blocking behavior did not regress live checkout** — normal orders must still reach PayFast (the 502 path only triggers when SMTP fails).

---

## Self-review notes

- Spec coverage: §1 SMTP → Task 1 + Task 6 Step 1; §2 create-order → Task 2; §3 payfast-notify → Task 3; §4 cart.js → Task 4; §5 error table → Tasks 2-4; §6 verification → Tasks 5-6. Grammar fix (agreed in conversation) → Task 3 Step 5. No gaps.
- Line numbers are as of commit `3d46721`; treat them as anchors, match on the quoted code.
- `.env` is gitignored: Task 1 Step 1 is deliberately uncommitted.
