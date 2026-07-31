# Order Email Restore & Fail-Safe Checkout — Design

**Date:** 2026-07-31
**Trigger:** Order VF-MS7CVT7D-XW96 (R366.00, 30 July 2026) — customer paid via PayFast but
the shop received no notification and has no delivery address; customer received no
confirmation from Vitra.

## Background (root causes)

1. **Broken SMTP host.** `SMTP_HOST=mail.vitrafruits.co.za` does not exist in DNS
   (NXDOMAIN). Every email the site attempts to send fails at connection and is
   silently swallowed by `try/catch` blocks.
2. **Missing notifications.** Commit `0e08cc0` (29 Apr 2026) removed both the
   payment-received notification to the shop (`payfast-notify.js`) and the customer
   order-received email (`create-order.js`). The template `buildCustomerEmail()` was
   left orphaned. Since then the shop is only ever emailed *before* payment
   ("Awaiting PayFast"), never on completion.
3. **Failures invisible by design.** Email errors only `console.error`; the
   `emailSent` flag returned by `/api/create-order` is never read by the frontend;
   there is no order persistence of any kind — orders exist only as emails.

## Goals

- The shop receives a **"Payment received"** email for every completed PayFast
  payment, containing the full delivery address and order details.
- The customer receives an **order-received** email at checkout and keeps the
  existing payment-confirmed email.
- A customer can **never again pay for an order the shop cannot see**: if the
  checkout notification email fails, payment is blocked.
- Outbound mail goes through a host that actually exists and passes SPF.

## Non-goals (explicitly out of scope)

- Order persistence / database (Vercel KV, Sheets, etc.). The two independent
  notifications (checkout-time + payment-time) remove the single point of failure
  for now. Revisit if volume grows.
- Admin order-status tooling changes (`update-order-status.js` untouched).

## Design

### 1. SMTP configuration

- Correct relay: **`smtpout.secureserver.net`** (GoDaddy Workspace Email outgoing
  relay; the domain's MX and SPF `include:secureserver.net` confirm GoDaddy).
  Port **465** (SSL).
- **Owner action (Wandile):** update Vercel → Settings → Environment Variables:
  `SMTP_HOST=smtpout.secureserver.net`, `SMTP_PORT=465`, then redeploy.
- Code: nodemailer transporter derives `secure: port === 465` instead of the
  hardcoded `secure: false` (which breaks TLS-on-connect ports). Applied in all
  three API files that build a transporter (`create-order.js`,
  `payfast-notify.js`, `update-order-status.js` — the last only for consistency
  of transporter construction, no behavior change otherwise).
- Local `.env`: remove the inline comment glued to `SMTP_HOST` (dotenv can parse
  it as part of the value) and set the correct host/port.

### 2. `api/create-order.js` — fail-safe checkout

- **Shop notification becomes blocking.** Send the existing "New Order" email to
  `ORDER_EMAIL_TO` first. On failure: log, return HTTP 502 with
  `error: "We couldn't process your order right now. Please try again in a few
  minutes, or WhatsApp us on 078 404 5558."` The frontend's existing catch path
  displays server error messages, so no new UI is required — the customer is not
  redirected to PayFast and does not pay.
- **Restore customer email.** After the shop email succeeds, send
  `buildCustomerEmail(...)` (already present, currently uncalled) to
  `billing.email`, best-effort in its own `try/catch` — a customer-email failure
  alone must not block the sale.
- Response stays `{ success, orderId, emailSent }`; on the success path
  `emailSent` is always `true` (kept for compatibility).

### 3. `api/payfast-notify.js` — payment-received notification to shop

- On `payment_status === 'COMPLETE'` (after PayFast validation, as today), send
  **two** emails, each in its own independent `try/catch`:
  1. **NEW — shop notification** to `ORDER_EMAIL_TO || SMTP_USER`:
     subject `Payment received — Order <id> — R<amount>`; body includes payment
     ID, amount, items, subtotal/discount/shipping, full billing/delivery address
     and customer contact decoded from the `custom_str1–5` payload, plus a
     fallback note ("address not transmitted — retrieve from PayFast dashboard")
     when the payload is missing/unparseable.
  2. Existing customer "Good things are heading your way" email — unchanged.
- Transporter is created once and shared by both sends.
- ITN still returns 200 in all handled cases so PayFast doesn't retry forever.

### 4. `public/cart.js` — callback pinning and dead domains

- `notify_url` pinned to `https://www.vitrafruits.co.za/api/payfast-notify`
  (canonical host) instead of the customer's browsing origin — removes the
  307-redirect risk on PayFast's server-to-server callback from the apex domain.
- Remove dead `vitrafruit.com` / `www.vitrafruit.com` (NXDOMAIN) from the
  create-order API fallback list; keep the browsing origin plus
  `vitrafruits.co.za` / `www.vitrafruits.co.za`.
- `return_url` / `cancel_url` keep using the browsing origin (user-facing
  redirects; redirects are fine there).

### 5. Error handling summary

| Failure | Behavior |
| --- | --- |
| Shop email fails at checkout | Block: HTTP 502, customer sees retry message, no payment taken |
| Customer email fails at checkout | Proceed (logged) |
| Shop email fails at ITN | Logged; customer email still attempted; ITN returns 200 |
| Customer email fails at ITN | Logged; shop email unaffected; ITN returns 200 |
| Custom payload unparseable at ITN | Shop email still sent, with "retrieve address from PayFast dashboard" note |

### 6. Verification plan

1. Local SMTP connection test (`transporter.verify()`) against
   `smtpout.secureserver.net:465` with credentials from `.env` — asks user before
   sending any real email.
2. Local invocation of the two API handlers with sample payloads (send-status /
   test scripts pattern already in repo) to confirm template rendering and the
   blocking path (bad SMTP host → 502).
3. After Vercel env update + deploy: one end-to-end test order (small amount)
   confirming: customer order-received email, shop new-order email, PayFast
   payment, shop payment-received email, customer payment-confirmed email.

## Decisions log

- **Scope:** full email restore, no persistence (user choice, 2026-07-31).
- **Checkout email failure blocks payment** (user choice, 2026-07-31).
- SMTP relay `smtpout.secureserver.net` chosen because domain mail is on GoDaddy
  (MX `smtp.secureserver.net` / `mailstore1.secureserver.net`) and SPF is
  `v=spf1 include:secureserver.net -all` (hard fail) — Gmail relay would be
  rejected.
