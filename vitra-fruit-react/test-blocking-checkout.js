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
