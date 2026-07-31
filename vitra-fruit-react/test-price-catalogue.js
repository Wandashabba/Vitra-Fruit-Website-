// Verifies the server-side price catalogue accepts what the product pages
// actually charge. Each scenario posts a basket priced exactly as the live
// product page (and cart.js normalizeItemPrice) would price it; with an
// unreachable SMTP host the expected outcome is 502 (email blocked), never
// 400 (price validation rejection).
// Run: node test-price-catalogue.js
process.env.SMTP_HOST = 'smtp.invalid';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'orderinfo@vitrafruits.co.za';
process.env.SMTP_PASS = 'not-a-real-password';
process.env.ORDER_EMAIL_TO = 'orderinfo@vitrafruits.co.za';
process.env.PUBLIC_SITE_URL = 'https://www.vitrafruits.co.za';

const handler = require('./api/create-order.js');

const SHIPPING = 150;
const scenarios = [
  { label: 'Banana Chips 200g', item: { name: 'Dehydrated Banana Chips', size: '200g', price: 180, quantity: 1 } },
  { label: 'Mango Strips 200g', item: { name: 'Dehydrated Mango Strips', size: '200g', price: 160, quantity: 1 } },
  { label: 'Hibiscus Flowers 1kg', item: { name: 'Hibiscus Flowers', size: '1kg', price: 980, quantity: 1 } },
  { label: 'Lime Slices 1kg', item: { name: 'Dehydrated Lime Slices', size: '1kg', price: 580, quantity: 1 } },
  { label: 'Beetroot Powders 500g', item: { name: 'Beetroot Powders', size: '500g', price: 380, quantity: 1 } },
  { label: 'Lemon Powders (citrus, default)', item: { name: 'Dehydrated Lemon Powders', size: '', price: 140, quantity: 1 } },
];

function makeReq(item) {
  const subtotal = item.price * item.quantity;
  const shipping = subtotal >= 850 ? 0 : SHIPPING;
  return {
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
      items: [item],
      subtotal,
      discount: 0,
      total: subtotal + shipping,
    },
  };
}

(async () => {
  let failed = 0;
  for (const s of scenarios) {
    let statusCode = null;
    let payload = null;
    const res = {
      setHeader() {},
      status(code) { statusCode = code; return this; },
      json(obj) { payload = obj; return this; },
      end() { return this; },
    };
    await handler(makeReq(s.item), res);
    if (statusCode === 400) {
      console.error(`FAIL: ${s.label} rejected by price validation:`, JSON.stringify(payload));
      failed += 1;
    } else if (statusCode === 502) {
      console.log(`ok: ${s.label} accepted (502 from unreachable SMTP, as expected)`);
    } else {
      console.error(`FAIL: ${s.label} unexpected status ${statusCode}`);
      failed += 1;
    }
  }
  if (failed) {
    console.error(`FAIL: ${failed}/${scenarios.length} catalogue scenarios rejected`);
    process.exit(1);
  }
  console.log('PASS: price catalogue matches product pages');
  process.exit(0);
})();
