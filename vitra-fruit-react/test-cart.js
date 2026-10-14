const fs = require('fs');
const assert = require('assert');

// Simple mock for browser localStorage
const mockStorage = {
  store: {
    vitra_cart: JSON.stringify([
      { id: '1', name: 'Lemon Slices', quantity: 14, price: 120 }
    ])
  },
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

// Minimal DOM: only the cart badge exists, so cart/checkout rendering is skipped
function mockElement() {
  return { textContent: '', style: {}, dataset: {}, addEventListener: () => {} };
}
const countBadge = mockElement();
const bagBadge = mockElement();

global.localStorage = mockStorage;
global.window = {
  addEventListener: () => {},
  dispatchEvent: () => true,
  location: { origin: 'http://localhost', search: '', href: '' },
  history: { length: 1, back: () => {} },
};
global.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };
global.document = {
  querySelector: () => null,
  querySelectorAll: (selector) => {
    if (selector === '[data-cart-count]') return [countBadge];
    if (selector === '[data-cart-bag-count]') return [bagBadge];
    return [];
  },
  getElementById: () => null,
  createElement: () => mockElement(),
};

// Run cart.js
const code = fs.readFileSync('public/cart.js', 'utf8');
try {
  eval(code);
  const cart = JSON.parse(localStorage.getItem('vitra_cart'));
  assert.ok(Array.isArray(cart) && cart.length === 1, 'cart should still hold one line');
  assert.strictEqual(cart[0].quantity, 14);
  assert.strictEqual(countBadge.textContent, '14', 'cart count badge should show 14');
  assert.strictEqual(bagBadge.textContent, '14', 'bag count badge should show 14');
  console.log('Cart loaded successfully! localStorage.vitra_cart:', localStorage.getItem('vitra_cart'));
  console.log('PASS');
} catch (e) {
  console.log('Error evaluating cart.js:', e);
  process.exitCode = 1;
}
