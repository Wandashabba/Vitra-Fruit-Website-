#!/usr/bin/env node

/**
 * Vitra Fruit — Order Status Update Script
 * 
 * Usage:
 *   node send-status.js <status> <orderId> <customerEmail> [customerName] [trackingNumber] [trackingUrl]
 * 
 * Statuses:
 *   preparing         — "Your order is being prepared"
 *   ready_collection   — "Your order is ready for collection"  
 *   shipped           — "Your order has been shipped" (include tracking number)
 * 
 * Examples:
 *   node send-status.js preparing VF-ABC123 customer@email.com "John"
 *   node send-status.js ready_collection VF-ABC123 customer@email.com "John"
 *   node send-status.js shipped VF-ABC123 customer@email.com "John" "TRACK123" "https://tracking-url.com"
 * 
 * Environment:
 *   Set SITE_URL to your deployed site (defaults to https://vitra-fruit-website-vyda.vercel.app)
 *   Set ADMIN_SECRET to match your server's ADMIN_SECRET env var
 */

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
  Vitra Fruit — Order Status Update
  ──────────────────────────────────

  Usage:
    node send-status.js <status> <orderId> <customerEmail> [customerName] [trackingNumber] [trackingUrl]

  Statuses:
    preparing          Your order is being prepared
    ready_collection   Your order is ready for collection
    shipped            Your order has been shipped

  Examples:
    node send-status.js preparing VF-ABC123 customer@email.com "John"
    node send-status.js ready_collection VF-ABC123 customer@email.com "John"
    node send-status.js shipped VF-ABC123 customer@email.com "John" "TRACK123" "https://courier.co.za/track/TRACK123"
  `);
  process.exit(1);
}

const [status, orderId, customerEmail, customerName, trackingNumber, trackingUrl] = args;

const SITE_URL = process.env.SITE_URL || 'https://vitra-fruit-website-vyda.vercel.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'vitra-admin-2024';

async function sendStatusUpdate() {
  const url = `${SITE_URL}/api/update-order-status`;

  const body = {
    orderId,
    customerEmail,
    customerName: customerName || 'there',
    status,
  };

  if (trackingNumber) body.trackingNumber = trackingNumber;
  if (trackingUrl) body.trackingUrl = trackingUrl;

  console.log(`\nSending "${status}" email for order ${orderId} to ${customerEmail}...`);
  console.log(`API: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success: ${data.message}`);
    } else {
      console.error(`❌ Error (${response.status}): ${data.error}`);
    }
  } catch (err) {
    console.error(`❌ Request failed: ${err.message}`);
  }
}

sendStatusUpdate();
