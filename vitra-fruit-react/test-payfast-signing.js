// End-to-end check of the order signing between create-order and
// payfast-notify, fully offline: SMTP and the PayFast postback are stubbed.
//  - a genuine payment is confirmed and the customer is emailed
//  - a payment whose amount or items were altered is flagged "CHECK BEFORE SHIPPING"
//  - a payment to a different merchant account is rejected
// Run: node test-payfast-signing.js
process.env.SMTP_HOST = 'smtp.invalid';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'orderinfo@vitrafruits.co.za';
process.env.SMTP_PASS = 'not-a-real-password';
process.env.ORDER_EMAIL_TO = 'orderinfo@vitrafruits.co.za';
process.env.ORDER_SIGNING_SECRET = 'test-signing-secret';
process.env.PUBLIC_SITE_URL = 'https://www.vitrafruits.co.za';

const { EventEmitter } = require('events');
const nodemailer = require('nodemailer');
const https = require('https');

const sent = [];
nodemailer.createTransport = () => ({
  sendMail: async (mail) => { sent.push(mail); return { messageId: 'stub' }; },
});
global.fetch = async () => ({ ok: false, status: 404 });
https.request = (options, onResponse) => {
  const req = new EventEmitter();
  req.write = () => {};
  req.end = () => {
    const response = new EventEmitter();
    onResponse(response);
    response.emit('data', 'VALID');
    response.emit('end');
  };
  req.destroy = () => {};
  return req;
};

const createOrder = require('./api/create-order.js');
const notify = require('./api/payfast-notify.js');

function mockRes() {
  return {
    statusCode: null, body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(text) { this.body = text; return this; },
    end() { return this; },
  };
}

let failures = 0;
function check(label, ok) {
  console.log(`${ok ? 'ok' : 'FAIL'}: ${label}`);
  if (!ok) failures++;
}

(async () => {
  const orderReq = {
    method: 'POST',
    headers: { origin: 'https://www.vitrafruits.co.za', host: 'www.vitrafruits.co.za' },
    body: {
      billing: {
        firstName: 'Test', lastName: '<b>Customer</b>', email: 'test@example.com',
        phone: '0800000000', street: '1 Test St', town: 'Cape Town', province: 'Western Cape', postcode: '8000',
      },
      items: [{ name: 'Dehydrated Lemon Slices', size: '100g', price: 1, quantity: 2 }],
      total: 390,
    },
  };
  const orderRes = mockRes();
  await createOrder(orderReq, orderRes);
  check('create-order succeeds', orderRes.statusCode === 200);
  const pf = orderRes.body && orderRes.body.payfast;
  check('server sets the amount from its catalogue, not the client price', pf && pf.amount === '390.00');
  check('order emails escape customer HTML', sent.every((m) => !m.html.includes('<b>Customer</b>')));

  const itn = (overrides) => ({
    method: 'POST',
    headers: { 'x-forwarded-for': '197.97.145.150' },
    body: {
      merchant_id: '34140649', payment_status: 'COMPLETE', pf_payment_id: '1',
      m_payment_id: pf.m_payment_id, amount_gross: pf.amount,
      email_address: 'test@example.com', name_first: 'Test', name_last: 'Customer',
      custom_str1: pf.custom_str1, custom_str2: pf.custom_str2, custom_str3: pf.custom_str3,
      custom_str4: pf.custom_str4, custom_str5: pf.custom_str5,
      ...overrides,
    },
  });

  sent.length = 0;
  await notify(itn({}), mockRes());
  check('genuine payment is confirmed to the shop', sent.some((m) => /^Payment received/.test(m.subject)));
  check('genuine payment emails the customer', sent.some((m) => m.to === 'test@example.com'));

  sent.length = 0;
  await notify(itn({ amount_gross: '1.00' }), mockRes());
  check('altered amount is flagged', sent.length === 1 && /^CHECK BEFORE SHIPPING/.test(sent[0].subject));
  check('altered amount does not email the customer', !sent.some((m) => m.to === 'test@example.com'));

  sent.length = 0;
  await notify(itn({ custom_str1: pf.custom_str1.replace('Lemon', 'Mango') }), mockRes());
  check('altered items are flagged', sent.length === 1 && /^CHECK BEFORE SHIPPING/.test(sent[0].subject));

  sent.length = 0;
  const otherMerchant = mockRes();
  await notify(itn({ merchant_id: '10000100' }), otherMerchant);
  check('payment to another merchant is rejected', otherMerchant.statusCode === 400 && sent.length === 0);

  check('PayFast IP ranges recognised', notify.isPayfastIp('197.97.145.150') && !notify.isPayfastIp('8.8.8.8'));

  const unknown = mockRes();
  await createOrder({ ...orderReq, body: { ...orderReq.body, items: [{ name: 'Gold Bar', quantity: 1, price: 1 }], total: 151 } }, unknown);
  check('unknown products are rejected', unknown.statusCode === 400);

  const badQty = mockRes();
  await createOrder({ ...orderReq, body: { ...orderReq.body, items: [{ name: 'Fruit Strips', quantity: -3 }], total: 0 } }, badQty);
  check('negative quantities are rejected', badQty.statusCode === 400);

  if (failures) {
    console.error(`FAIL: ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('PASS: PayFast order signing');
  process.exit(0);
})();
