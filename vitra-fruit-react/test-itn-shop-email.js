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

const emptyB = { f: '', l: '', e: '', p: '', s: '', t: '', pr: '', z: '' };
const emptyBHtml = build({
  orderId: 'VF-TEST-1234', pfPaymentId: '999999', amountGross: '366.00',
  customerName: 'X', customerEmail: 'x@example.com',
  orderData: { b: emptyB, i: [], sub: null, sh: null, d: 0 },
});
if (!/PayFast dashboard/i.test(emptyBHtml)) {
  console.error('FAIL: fallback note missing when billing payload is all-empty');
  process.exit(1);
}

console.log('PASS: ITN shop email template');
process.exit(0);
