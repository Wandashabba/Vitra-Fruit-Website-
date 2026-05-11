const fs = require('fs');

// Simple mock for browser localStorage
const mockStorage = {
  store: {
    vitra_cart: JSON.stringify([
      { id: '1', name: 'Lemon Slices', quantity: 14, price: 120 }
    ])
  },
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = val; },
  removeItem(key) { delete this.store[key]; }
};

global.localStorage = mockStorage;
global.window = { addEventListener: () => {} };
global.document = { querySelectorAll: () => [] };

// Run cart.js
const code = fs.readFileSync('public/cart.js', 'utf8');
try {
  eval(code);
  console.log("Cart loaded successfully! localStorage.vitra_cart:", localStorage.getItem('vitra_cart'));
} catch (e) {
  console.log("Error evaluating cart.js:", e);
}
