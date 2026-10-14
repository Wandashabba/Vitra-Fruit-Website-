// Shared helpers for the API routes. Files under api/_lib are bundled with the
// functions that require them but are not exposed as routes themselves.
const crypto = require('crypto');

/* ── Price catalogue ──────────────────────────────────────────── */

const PRODUCT_PRICES = {
  // Citrus wheels
  'dehydrated orange wheels': { default: 200 },
  'dehydrated lemon wheels': { default: 200 },
  'dehydrated lime wheels': { default: 200 },
  'dehydrated grapefruit wheels': { default: 200 },
  // Citrus slices — price by size
  'dehydrated lemon slices': { '100g': 120, '150g': 120, '200g': 200, '1kg': 580 },
  'dehydrated lime slices': { '100g': 160, '1kg': 580 },
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
  // Hibiscus
  'hibiscus flowers': { '100g': 100, '200g': 180, '1kg': 980 },
};

const SHIPPING_COST = 190;
const FREE_SHIPPING_THRESHOLD = 850; // matches cart.js — free delivery at/above this subtotal
const MAX_QTY = 10; // matches cart.js DEFAULT_MAX_QTY
const MAX_ORDER_ITEMS = 10; // matches cart.js; bigger orders go through email
const ORDER_LIMIT_ERROR = `Online orders are limited to ${MAX_ORDER_ITEMS} items. For larger orders, please email orderinfo@vitrafruits.co.za`;
const MAX_LINES = 50;

function lookupPrice(name, size) {
  const key = String(name || '').toLowerCase().trim();
  const entry = PRODUCT_PRICES[key];
  if (!entry) return null;
  if (entry.default !== undefined) return entry.default;
  const sizeKey = String(size || '').toLowerCase().trim();
  return entry[sizeKey] ?? null;
}

/**
 * Prices a cart purely from the server catalogue. Client-sent prices are
 * ignored. Returns { error } for anything that isn't a sellable line.
 */
function priceOrder(items) {
  if (!Array.isArray(items) || !items.length) return { error: 'Your cart is empty.' };
  if (items.length > MAX_LINES) return { error: 'Too many items in one order.' };

  const lines = [];
  let subtotal = 0;
  for (const item of items) {
    const quantity = Number(item && item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: 'One of the quantities in your cart is invalid.' };
    }
    if (quantity > MAX_QTY) {
      return { error: ORDER_LIMIT_ERROR };
    }
    const unitPrice = lookupPrice(item.name, item.size);
    if (unitPrice === null) {
      return { error: `"${String(item.name || 'Unknown item').slice(0, 80)}" is no longer available. Please remove it from your cart.` };
    }
    lines.push({
      name: String(item.name).trim(),
      size: item.size ? String(item.size).trim() : '',
      quantity,
      price: unitPrice,
    });
    subtotal += unitPrice * quantity;
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (itemCount > MAX_ORDER_ITEMS) {
    return { error: ORDER_LIMIT_ERROR };
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

/** Plain-text price list for the chatbot prompt, generated from the catalogue. */
function describeCatalogue() {
  const title = (key) => key.replace(/\b\w/g, (c) => c.toUpperCase());
  return Object.entries(PRODUCT_PRICES)
    .map(([key, entry]) => {
      if (entry.default !== undefined) return `${title(key)}: R${entry.default}`;
      const sizes = Object.entries(entry).map(([size, price]) => `${size} R${price}`).join(', ');
      return `${title(key)}: ${sizes}`;
    })
    .join('\n');
}

/* ── HTML escaping for email templates ────────────────────────── */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── CORS ─────────────────────────────────────────────────────── */

const ALLOWED_ORIGINS = ['https://vitrafruits.co.za', 'https://www.vitrafruits.co.za'];
// Only this project's own Vercel deployments, not every *.vercel.app site.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/vitra-fruit-website-[a-z0-9-]+\.vercel\.app$/;
const LOCAL_ORIGIN = /^http:\/\/localhost:\d+$/;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin) || VERCEL_PREVIEW_ORIGIN.test(origin)) return true;
  return process.env.VERCEL_ENV !== 'production' && LOCAL_ORIGIN.test(origin);
}

function applyCors(req, res, methods) {
  const origin = (req.headers && req.headers.origin) || '';
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ── Order signing ────────────────────────────────────────────── */
// create-order signs the PayFast amount and order payload; payfast-notify
// checks that signature, so a payment whose amount or items were altered in
// the browser is flagged instead of being confirmed as ready to fulfil.

function signOrder(orderId, amount, payload) {
  const secret = String(process.env.ORDER_SIGNING_SECRET || '');
  if (!secret) throw new Error('ORDER_SIGNING_SECRET is not set');
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${Number(amount).toFixed(2)}|${payload}`)
    .digest('hex');
}

function verifyOrderSignature(orderId, amount, payload, signature) {
  if (!signature || !process.env.ORDER_SIGNING_SECRET) return false;
  const expected = Buffer.from(signOrder(orderId, amount, payload));
  const actual = Buffer.from(String(signature));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = {
  PRODUCT_PRICES,
  SHIPPING_COST,
  MAX_ORDER_ITEMS,
  FREE_SHIPPING_THRESHOLD,
  lookupPrice,
  priceOrder,
  describeCatalogue,
  escapeHtml,
  isAllowedOrigin,
  applyCors,
  signOrder,
  verifyOrderSignature,
  safeEqual,
};
