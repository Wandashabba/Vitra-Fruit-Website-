// Verifies the server-side price validation accepts a free-shipping basket
// (subtotal after discount >= R850 → shipping 0, matching cart.js). With an
// unreachable SMTP host the expected outcome is 502 (email blocked), NOT 400
// (price validation rejection).
// Run: node test-free-shipping-validation.js
process.env.SMTP_HOST = 'smtp.invalid';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'orderinfo@vitrafruits.co.za';
process.env.SMTP_PASS = 'not-a-real-password';
process.env.ORDER_EMAIL_TO = 'orderinfo@vitrafruits.co.za';
process.env.PUBLIC_SITE_URL = 'https://www.vitrafruits.co.za';

const handler = require('./api/create-order.js');

// 2 x Dehydrated Lemon Slices 1kg @ R580 = R1160, -10% (R116) = R1044 >= R850 → free shipping
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
    items: [{ name: 'Dehydrated Lemon Slices', size: '1kg', price: 580, quantity: 2 }],
    subtotal: 1160,
    discount: 116,
    total: 1044,
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
  if (statusCode === 400) {
    console.error('FAIL: free-shipping order rejected by price validation');
    process.exit(1);
  }
  if (statusCode === 502) {
    console.log('PASS: free-shipping total accepted (blocked only by unreachable SMTP, as expected)');
    process.exit(0);
  }
  console.error('FAIL: unexpected status', statusCode);
  process.exit(1);
})();
