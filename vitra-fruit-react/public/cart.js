(function () {
  const STORAGE_KEY = 'vitra_cart';
  const VAT_KEY = 'vitra_vat_rate';
  const HAS_ORDERED_KEY = 'vitra_has_ordered';
  const COUNT_SELECTOR = '[data-cart-count]';
  const BAG_COUNT_SELECTOR = '[data-cart-bag-count]';
  const DEFAULT_MAX_QTY = 100;
  const FIRST_ORDER_DISCOUNT = 0.10; // 10%
  const memoryStore = { cart: [], vatRate: 0.15, hasOrdered: false };
  const canUseStorage = (function () {
    try {
      const testKey = '__vitra_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  })();

  function migrateImages(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const next = { ...item };
      const name = (next.name || '').toLowerCase();
      if (name.includes('orange wheel') && (!next.image || next.image.toLowerCase().includes('orangewheel'))) {
        next.image = '/images/OrangePleaser.png';
      }
      if (name.includes('grapefruit wheel') && (!next.image || next.image.toLowerCase().includes('grapewheel'))) {
        next.image = '/images/Grapefruitwheel.png';
      }
      if (name.includes('lime wheel') && (!next.image || next.image.toLowerCase().includes('limewheel'))) {
        next.image = '/images/Pleaser4.png';
      }
      if (name.includes('lemon wheel') && (!next.image || next.image.toLowerCase().includes('lemonwheel'))) {
        next.image = '/images/LemonWheel.png';
      }
      return next;
    });
  }

  function normalizeItemPrice(item) {
    const next = { ...item };
    const name = (next.name || '').toLowerCase();
    const size = (next.size || '').toLowerCase();
    const citrusSliceSizes = {
      '100g': 120,
      '150g': 120,
      '200g': 200,
      '1kg': 580,
    };
    const applePearSizes = {
      '100g': 100,
      '200g': 180,
    };

    if (name.includes('wheel')) {
      if (name.includes('orange wheel') && !name.includes('orange wheels')) {
        next.name = 'Dehydrated Orange Wheels';
        if (next.id && next.id.startsWith('dehydrated-orange-wheel__')) {
          next.id = next.id.replace('dehydrated-orange-wheel__', 'dehydrated-orange-wheels__');
        }
      }
      if (name.includes('lemon wheel') && !name.includes('lemon wheels')) {
        next.name = 'Dehydrated Lemon Wheels';
        if (next.id && next.id.startsWith('dehydrated-lemon-wheel__')) {
          next.id = next.id.replace('dehydrated-lemon-wheel__', 'dehydrated-lemon-wheels__');
        }
      }
      if (name.includes('lime wheel') && !name.includes('lime wheels')) {
        next.name = 'Dehydrated Lime Wheels';
        if (next.id && next.id.startsWith('dehydrated-lime-wheel__')) {
          next.id = next.id.replace('dehydrated-lime-wheel__', 'dehydrated-lime-wheels__');
        }
      }
      if (name.includes('grapefruit wheel') && !name.includes('grapefruit wheels')) {
        next.name = 'Dehydrated Grapefruit Wheels';
        if (next.id && next.id.startsWith('dehydrated-grapefruit-wheel__')) {
          next.id = next.id.replace('dehydrated-grapefruit-wheel__', 'dehydrated-grapefruit-wheels__');
        }
      }
      next.size = size || '200g';
      next.price = 200;
      return next;
    }

    if (name.includes('pineapple slices')) {
      const normalizedSize = size === '500g' ? '200g' : size || '100g';
      const pineappleSliceSizes = {
        '100g': 120,
        '200g': 220,
      };
      next.size = normalizedSize;
      next.price = pineappleSliceSizes[normalizedSize] || 120;
      return next;
    }

    if (name.includes('banana chips')) {
      const normalizedSize = size === '500g' ? '200g' : size || '100g';
      const bananaChipSizes = {
        '100g': 100,
        '200g': 180,
      };
      next.size = normalizedSize;
      next.price = bananaChipSizes[normalizedSize] || 100;
      return next;
    }

    if (name.includes('mango strips')) {
      const normalizedSize = size === '500g' ? '200g' : size || '100g';
      const mangoStripSizes = {
        '100g': 100,
        '200g': 160,
      };
      next.size = normalizedSize;
      next.price = mangoStripSizes[normalizedSize] || 100;
      return next;
    }

    if (name.includes('lime slices')) {
      const normalizedSize = size || '100g';
      const limeSliceSizes = {
        '100g': 120,
        '1kg': 960,
      };
      next.size = normalizedSize;
      next.price = limeSliceSizes[normalizedSize] || 120;
      return next;
    }

    if (name.includes('orange powder') && !name.includes('orange powders')) {
      next.name = 'Dehydrated Orange Powders';
      if (next.id === 'dehydrated-orange-powder') {
        next.id = 'dehydrated-orange-powders';
      }
      next.price = 140;
      return next;
    }

    if (name.includes('grapefruit powder') && !name.includes('grapefruit powders')) {
      next.name = 'Dehydrated Grapefruit Powders';
      if (next.id === 'dehydrated-grapefruit-powder') {
        next.id = 'dehydrated-grapefruit-powders';
      }
      next.price = 140;
      return next;
    }

    if (name.includes('lemon powder') && !name.includes('lemon powders')) {
      next.name = 'Dehydrated Lemon Powders';
      if (next.id === 'dehydrated-lemon-powder') {
        next.id = 'dehydrated-lemon-powders';
      }
      next.price = 140;
      return next;
    }

    if (name.includes('beetroot vegetable powder') && !name.includes('beetroot powders')) {
      next.name = 'Beetroot Powders';
      if (next.id === 'beetroot-vegetable-powder') {
        next.id = 'beetroot-powders';
      }
      return next;
    }

    if (name.includes('butternut vegetable powder') && !name.includes('butternut powders')) {
      next.name = 'Butternut Powders';
      if (next.id === 'butternut-vegetable-powder') {
        next.id = 'butternut-powders';
      }
      return next;
    }

    if (name.includes('carrot vegetable powder') && !name.includes('carrot powders')) {
      next.name = 'Carrot Powders';
      if (next.id === 'carrot-vegetable-powder') {
        next.id = 'carrot-powders';
      }
      return next;
    }

    if (name.includes('spinach vegetable powder') && !name.includes('spinach powders')) {
      next.name = 'Spinach Powders';
      if (next.id === 'spinach-vegetable-powder') {
        next.id = 'spinach-powders';
      }
      return next;
    }

    if (name.includes('lemon slices') || name.includes('orange slices') || name.includes('grapefruit slices')) {
      const normalizedSize = size === '150g' ? '100g' : size || '100g';
      next.size = normalizedSize;
      next.price = citrusSliceSizes[normalizedSize] || 120;
      return next;
    }

    if (name.includes('apple slices') || name.includes('pear slices')) {
      const normalizedSize = size === '500g' ? '200g' : size || '100g';
      next.size = normalizedSize;
      next.price = applePearSizes[normalizedSize] || 100;
      return next;
    }

    return next;
  }

  function normalizeCart(items) {
    return migrateImages(Array.isArray(items) ? items : []).map(normalizeItemPrice);
  }

  function loadCart() {
    if (!canUseStorage) {
      return normalizeCart(Array.isArray(memoryStore.cart) ? memoryStore.cart : []);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      const normalized = normalizeCart(Array.isArray(items) ? items : []);
      if (raw !== JSON.stringify(normalized)) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (writeErr) {
          memoryStore.cart = normalized;
        }
      }
      return normalized;
    } catch (err) {
      return normalizeCart(Array.isArray(memoryStore.cart) ? memoryStore.cart : []);
    }
  }

  function saveCart(items) {
    const nextItems = Array.isArray(items) ? items : [];
    if (!canUseStorage) {
      memoryStore.cart = nextItems;
      updateCount(nextItems);
      window.dispatchEvent(new CustomEvent('vitra:cart-updated'));
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch (err) {
      memoryStore.cart = nextItems;
    }
    updateCount(nextItems);
    window.dispatchEvent(new CustomEvent('vitra:cart-updated'));
  }

  function updateCount(items) {
    const cart = items || loadCart();
    console.log('[cart.js] Loading cart count. Items in cart:', cart);
    const total = cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
    console.log('[cart.js] Computed total cart count:', total);
    
    document.querySelectorAll(COUNT_SELECTOR).forEach((el) => {
      el.textContent = String(total);
      if (total > 0) {
        el.style.display = 'inline-flex';
        el.style.opacity = '1';
      } else {
        el.style.display = 'none';
      }
    });
    document.querySelectorAll(BAG_COUNT_SELECTOR).forEach((el) => {
      el.textContent = String(total);
    });
  }

  function loadVatRate() {
    if (!canUseStorage) {
      return memoryStore.vatRate;
    }
    const stored = localStorage.getItem(VAT_KEY);
    const parsed = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : memoryStore.vatRate;
  }

  function saveVatRate(rate) {
    if (!canUseStorage) {
      memoryStore.vatRate = rate;
      return;
    }
    try {
      localStorage.setItem(VAT_KEY, String(rate));
    } catch (err) {
      memoryStore.vatRate = rate;
    }
  }

  function isFirstTimeUser() {
    if (!canUseStorage) {
      return !memoryStore.hasOrdered;
    }
    return localStorage.getItem(HAS_ORDERED_KEY) !== 'true';
  }

  function markAsReturningUser() {
    if (!canUseStorage) {
      memoryStore.hasOrdered = true;
      return;
    }
    try {
      localStorage.setItem(HAS_ORDERED_KEY, 'true');
    } catch (err) {
      memoryStore.hasOrdered = true;
    }
  }

  function parsePrice(value) {
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }

  function formatPrice(value) {
    return `R${value.toFixed(2)}`;
  }

  function getCheckoutEndpoints() {
    const origin = window.location.origin || '';
    const candidateApiBases = [
      origin,
      'https://vitrafruit.com',
      'https://www.vitrafruit.com',
      'https://vitrafruits.co.za',
      'https://www.vitrafruits.co.za'
    ];
    const returnBase = origin || 'https://vitrafruit.com';
    const apiBases = candidateApiBases
      .filter(Boolean)
      .filter((base, index, list) => list.indexOf(base) === index);

    return { returnBase, apiBases };
  }

  async function createOrderRequest(payload, apiBases) {
    let lastError = null;

    for (const base of apiBases) {
      try {
        const response = await fetch(base + '/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          return { data, apiBase: base };
        }

        const errText = await response.text();
        lastError = new Error(`Failed to create order (${response.status}) via ${base}: ${errText}`);

        if (response.status === 404) {
          continue;
        }

        throw lastError;
      } catch (err) {
        lastError = err;
        if (!(err instanceof Error) || !/Failed to create order \(404\)/.test(err.message)) {
          break;
        }
      }
    }

    throw lastError || new Error('Could not reach any order API endpoint.');
  }

  function addItem({ id, name, image, price, size, quantity, maxQty }) {
    const cart = loadCart();
    const limit = Math.max(1, Math.min(DEFAULT_MAX_QTY, maxQty || DEFAULT_MAX_QTY));
    const qty = Math.max(1, Math.min(limit, quantity || 1));
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      const itemLimit = Math.max(1, Math.min(DEFAULT_MAX_QTY, existing.maxQty || limit));
      existing.quantity = Math.min(itemLimit, (existing.quantity || 0) + qty);
    } else {
      cart.push({ id, name, image, price, size, quantity: qty, maxQty: limit });
    }
    saveCart(cart);
  }

  function attachAddToCart() {
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
      button.addEventListener('click', function () {
        const name = button.getAttribute('data-product') || 'Product';
        const image = button.getAttribute('data-image') || '';
        const sizeSelect = document.querySelector(button.getAttribute('data-size-select') || '');
        const priceSelect = document.querySelector(button.getAttribute('data-price-select') || '');
        const qtyInput = document.querySelector(button.getAttribute('data-qty-input') || '');

        const size = sizeSelect ? sizeSelect.value : '';
        const price = priceSelect ? parsePrice(priceSelect.value) : 0;
        const quantity = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;
        const maxQty = parseInt(button.getAttribute('data-max-qty') || String(DEFAULT_MAX_QTY), 10);
        const id = `${name}__${size || 'default'}`;

        addItem({ id, name, image, price, size, quantity, maxQty });
      });
    });
  }

  function renderCart() {
    const tableBody = document.querySelector('[data-cart-body]');
    if (!tableBody) {
      return;
    }

    const emptyState = document.querySelector('[data-cart-empty]');
    const subtotalEl = document.querySelector('[data-cart-subtotal]');
    const totalEl = document.querySelector('[data-cart-total]');
    const vatEl = document.querySelector('[data-cart-vat]');
    const clearBtn = document.querySelector('[data-cart-clear]');
    const closeBtn = document.querySelector('[data-cart-close]');
    const vatSelect = document.querySelector('[data-vat-rate]');

    let vatRate = 0.15;
    // VAT rate locked at 0.15

    const discountEl = document.querySelector('[data-cart-discount]');
    const discountRow = document.querySelector('[data-cart-discount-row]');

    function render() {
      const cart = loadCart();
      const firstTime = isFirstTimeUser();
      tableBody.innerHTML = '';

      if (!cart.length) {
        if (emptyState) {
          emptyState.hidden = false;
        }
        if (subtotalEl) subtotalEl.textContent = formatPrice(0) + ' (incl. VAT)';
        if (totalEl) totalEl.textContent = formatPrice(0) + ` (includes ${formatPrice(0)} VAT)`;
        if (vatEl) vatEl.textContent = '';
        if (discountRow) discountRow.style.display = 'none';
        updateCount(cart);
        return;
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      let subtotal = 0;

      cart.forEach((item) => {
        const itemLimit = Math.max(1, Math.min(DEFAULT_MAX_QTY, item.maxQty || DEFAULT_MAX_QTY));
        const canDecrement = item.quantity > 1;
        const canIncrement = item.quantity < itemLimit;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="cart-cell cart-cell-remove">
            <button class="cart-remove" type="button" data-remove="${item.id}" aria-label="Remove item">
              <svg class="cart-remove-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                <path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="cart-remove-label">Remove</span>
            </button>
          </td>
          <td class="cart-cell cart-cell-thumb">
            <img class="cart-thumb" src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" />
          </td>
          <td class="cart-cell cart-cell-product">
            <div class="cart-product">${item.name}${item.size ? ` - ${item.size}` : ''}</div>
          </td>
          <td class="cart-cell cart-cell-price" data-label="Price">${formatPrice(item.price)}</td>
          <td class="cart-cell cart-cell-qty" data-label="Quantity">
            <div class="cart-qty-stepper" role="group" aria-label="Quantity controls">
              <button class="cart-qty-btn" type="button" data-qty-step="-1" data-qty-target="${item.id}" aria-label="Decrease quantity" ${canDecrement ? '' : 'disabled'}>-</button>
              <input class="cart-qty" type="number" min="1" max="${itemLimit}" value="${item.quantity}" data-qty="${item.id}" aria-label="Quantity" />
              <button class="cart-qty-btn" type="button" data-qty-step="1" data-qty-target="${item.id}" aria-label="Increase quantity" ${canIncrement ? '' : 'disabled'}>+</button>
            </div>
          </td>
          <td class="cart-cell cart-cell-subtotal" data-label="Subtotal">${formatPrice(item.price * item.quantity)} (incl. VAT)</td>
        `;
        tableBody.appendChild(row);
        subtotal += item.price * item.quantity;
      });

      let discountAmount = 0;
      if (firstTime && subtotal > 0) {
        discountAmount = Math.round(subtotal * FIRST_ORDER_DISCOUNT * 100) / 100;
      }
      const subtotalAfterDiscount = subtotal - discountAmount;
      const shipping = subtotalAfterDiscount >= 850 ? 0 : 150;
      const grandTotal = subtotalAfterDiscount + shipping;

      const vat = subtotal - subtotal / (1 + vatRate);
      
      let shippingNote = '';
      if (subtotalAfterDiscount >= 850) {
        shippingNote = '<div style="font-size: 0.8rem; color: #27ae60; font-weight: 700;">✨ Free Artisan Shipping Unlocked!</div>';
      } else {
        const needed = 850 - subtotalAfterDiscount;
        shippingNote = `<div style="font-size: 0.8rem; color: #c09828; font-weight: 600;">Add R${needed.toFixed(2)} more for Free Artisan Shipping!</div>`;
      }

      if (subtotalEl) {
        subtotalEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right;">
            <span>${formatPrice(subtotal)} <span style="font-size: 0.8em; font-weight: 500;">(incl. VAT)</span></span>
            <span style="font-size: 0.85em; color: var(--text-muted, #666); font-weight: 600;">
              + ${shipping === 0 ? 'Free Shipping' : formatPrice(shipping) + ' Shipping'}
            </span>
            ${shippingNote}
          </div>
        `;
      }
      if (discountRow) {
        if (firstTime && discountAmount > 0) {
          discountRow.style.display = 'flex';
          if (discountEl) discountEl.textContent = `-${formatPrice(discountAmount)}`;
        } else {
          discountRow.style.display = 'none';
        }
      }
      if (totalEl) totalEl.textContent = `${formatPrice(grandTotal)}`;
      if (vatEl) vatEl.textContent = '';

      updateCount(cart);
    }

    tableBody.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const removeBtn = target.closest('[data-remove]');
      if (removeBtn) {
        const removeId = removeBtn.getAttribute('data-remove');
        if (!removeId) return;
        const cart = loadCart().filter((item) => item.id !== removeId);
        saveCart(cart);
        render();
        return;
      }

      const stepBtn = target.closest('[data-qty-step]');
      if (!stepBtn) return;
      if (stepBtn.hasAttribute('disabled')) return;
      const stepValue = parseInt(stepBtn.getAttribute('data-qty-step') || '0', 10);
      const itemId = stepBtn.getAttribute('data-qty-target');
      if (!itemId || !Number.isFinite(stepValue) || stepValue === 0) return;

      const cart = loadCart();
      const item = cart.find((entry) => entry.id === itemId);
      if (!item) return;

      const limit = Math.max(1, Math.min(DEFAULT_MAX_QTY, item.maxQty || DEFAULT_MAX_QTY));
      const nextQty = Math.max(1, Math.min(limit, (item.quantity || 1) + stepValue));
      item.quantity = nextQty;
      saveCart(cart);
      render();
    });

    tableBody.addEventListener('change', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const itemId = target.getAttribute('data-qty');
      if (!itemId) return;
      const cart = loadCart();
      const item = cart.find((entry) => entry.id === itemId);
      const limit = item ? Math.max(1, Math.min(DEFAULT_MAX_QTY, item.maxQty || DEFAULT_MAX_QTY)) : DEFAULT_MAX_QTY;
      const nextQty = Math.max(1, Math.min(limit, parseInt(target.value || '1', 10)));
      if (item) {
        item.quantity = nextQty;
        saveCart(cart);
        render();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        saveCart([]);
        render();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'index.html';
        }
      });
    }

    render();
  }

  function renderCheckout() {
    const itemsWrap = document.querySelector('[data-checkout-items]');
    if (!itemsWrap) {
      return;
    }

    const subtotalEl = document.querySelector('[data-checkout-subtotal]');
    const totalEl = document.querySelector('[data-checkout-total]');
    const discountEl = document.querySelector('[data-checkout-discount]');
    const discountRow = document.querySelector('[data-checkout-discount-row]');
    const cart = loadCart();
    const vatRate = loadVatRate();
    const firstTime = isFirstTimeUser();
    const payfastForm = document.getElementById('payfastForm');
    const payfastNote = document.querySelector('[data-checkout-note]');
    const payfastButton = payfastForm ? payfastForm.querySelector('.place-order') : null;
    const billingFirstName = document.getElementById('billingFirstName');
    const billingLastName = document.getElementById('billingLastName');
    const billingEmail = document.getElementById('billingEmail');

    itemsWrap.innerHTML = '';

    if (!cart.length) {
      if (payfastNote) {
        payfastNote.textContent = 'Your cart is empty. Please add items to checkout.';
      }
      if (payfastButton) {
        payfastButton.disabled = true;
        payfastButton.setAttribute('aria-disabled', 'true');
      }
      if (subtotalEl) subtotalEl.textContent = formatPrice(0) + ' (incl. VAT)';
      if (totalEl) totalEl.textContent = formatPrice(0);
      if (discountRow) discountRow.style.display = 'none';
      return;
    }

    let subtotal = 0;

    cart.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'order-row';

      const title = document.createElement('span');
      title.className = 'order-product';

      if (item.image) {
        const img = document.createElement('img');
        img.className = 'order-thumb';
        img.src = item.image;
        img.alt = item.name || 'Product';
        img.loading = 'lazy';
        img.decoding = 'async';
        title.appendChild(img);
      }

      const name = document.createElement('span');
      const sizeLabel = item.size ? ` - ${item.size}` : '';
      const qtyLabel = item.quantity > 1 ? ` × ${item.quantity}` : '';
      name.textContent = `${item.name || 'Product'}${sizeLabel}${qtyLabel}`;
      title.appendChild(name);

      const price = document.createElement('span');
      price.className = 'order-subtotal';
      price.textContent = formatPrice(item.price * item.quantity);

      row.appendChild(title);
      row.appendChild(price);
      itemsWrap.appendChild(row);

      subtotal += item.price * item.quantity;
    });

    let discountAmount = 0;
    if (firstTime && subtotal > 0) {
      discountAmount = Math.round(subtotal * FIRST_ORDER_DISCOUNT * 100) / 100;
    }
    const subtotalAfterDiscount = subtotal - discountAmount;
    const shipping = subtotalAfterDiscount >= 850 ? 0 : 150; // Standard shipping or Free over R850
    const grandTotal = subtotalAfterDiscount + shipping;

    const vat = subtotal - subtotal / (1 + vatRate);
    
    // Add free shipping progress indicator
    let shippingNote = '';
    if (subtotalAfterDiscount >= 850) {
      shippingNote = '<div style="font-size: 0.8rem; color: #27ae60; font-weight: 700;">✨ Free Artisan Shipping Unlocked!</div>';
    } else {
      const needed = 850 - subtotalAfterDiscount;
      shippingNote = `<div style="font-size: 0.8rem; color: #c09828; font-weight: 600;">Add R${needed.toFixed(2)} more for Free Artisan Shipping!</div>`;
    }

    if (subtotalEl) {
      subtotalEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right;">
          <span>${formatPrice(subtotal)} <span style="font-size: 0.8em; font-weight: 500;">(incl. VAT)</span></span>
          <span style="font-size: 0.85em; color: var(--text-muted, #666); font-weight: 600;">
            + ${shipping === 0 ? 'Free Shipping' : formatPrice(shipping) + ' Shipping'}
          </span>
          ${shippingNote}
        </div>
      `;
    }
    
    if (totalEl) totalEl.textContent = `${formatPrice(grandTotal)}`;

    if (payfastNote) {
      payfastNote.textContent = '';
    }
    if (payfastButton) {
      payfastButton.disabled = false;
      payfastButton.removeAttribute('aria-disabled');
    }

    if (payfastForm) {
      const setField = (name, value) => {
        const field = payfastForm.querySelector(`[name="${name}"]`);
        if (field) {
          field.value = value;
        }
      };

      const description = cart
        .map((item) => {
          const sizeLabel = item.size ? ` ${item.size}` : '';
          const qtyLabel = item.quantity > 1 ? ` x${item.quantity}` : '';
          return `${item.name || 'Product'}${sizeLabel}${qtyLabel}`;
        })
        .join(', ')
        + (firstTime ? ' [10% First Order Discount Applied]' : '');

      const { returnBase, apiBases } = getCheckoutEndpoints();
      setField('amount', grandTotal.toFixed(2));
      setField('item_name', 'Vitra Fruit Products');
      setField('item_description', description);
      setField('return_url', returnBase + '/checkout.html?status=success');
      setField('cancel_url', returnBase + '/checkout.html?status=cancel');
      setField('notify_url', '');
      setField('m_payment_id', `VITRA-${Date.now()}`);
      setField('name_first', billingFirstName ? billingFirstName.value.trim() : '');
      setField('name_last', billingLastName ? billingLastName.value.trim() : '');
      setField('email_address', billingEmail ? billingEmail.value.trim() : '');

      const bFirst = billingFirstName ? billingFirstName.value.trim() : '';
      const bLast = billingLastName ? billingLastName.value.trim() : '';
      const bEmail = billingEmail ? billingEmail.value.trim() : '';
      const bPhone = document.getElementById('billingPhone')?.value.trim() || '';
      const bStreet = document.getElementById('billingStreet')?.value.trim() || '';
      const bTown = document.getElementById('billingTown')?.value.trim() || '';
      const bProv = document.getElementById('billingProvince')?.value.trim() || '';
      const bPost = document.getElementById('billingPostcode')?.value.trim() || '';

      const compactBilling = JSON.stringify({ f: bFirst, l: bLast, e: bEmail, p: bPhone, s: bStreet, t: bTown, pr: bProv, z: bPost });
      const compactItems = JSON.stringify(cart.map(i => ({ n: i.name, q: i.quantity, p: i.price })));
      
      const chunkString = (str, len) => {
        const size = Math.ceil(str.length / len);
        const r = Array(size);
        let offset = 0;
        for (let i = 0; i < size; i++) {
          r[i] = str.substring(offset, offset + len);
          offset += len;
        }
        return r;
      };
      
      const payloadStr = JSON.stringify({ b: JSON.parse(compactBilling), i: JSON.parse(compactItems), sub: subtotal, sh: shipping, d: discountAmount });
      const chunks = chunkString(payloadStr, 250);
      
      const addHidden = (name, val) => {
        let el = payfastForm.querySelector(`[name="${name}"]`);
        if (!el) {
          el = document.createElement('input');
          el.type = 'hidden';
          el.name = name;
          payfastForm.appendChild(el);
        }
        el.value = val;
      };

      if(chunks[0]) addHidden('custom_str1', chunks[0]);
      if(chunks[1]) addHidden('custom_str2', chunks[1]);
      if(chunks[2]) addHidden('custom_str3', chunks[2]);
      if(chunks[3]) addHidden('custom_str4', chunks[3]);
      if(chunks[4]) addHidden('custom_str5', chunks[4]);

      if (!payfastForm.dataset.listenerAttached) {
        payfastForm.addEventListener('submit', async function (event) {
          event.preventDefault(); // Stop normal form submission

          if (!cart.length) {
            if (payfastNote) payfastNote.textContent = 'Please add items to your cart to checkout.';
            return;
          }

          // Force HTML5 validation on the checkout form
          const checkoutForm = document.getElementById('billingForm');
          if (checkoutForm && !checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
          }

          // Show loading state
          if (payfastButton) {
            payfastButton.disabled = true;
            payfastButton.textContent = 'Processing...';
          }
          if (payfastNote) payfastNote.textContent = '';

          try {
            // Get selected delivery method
            const methodRadio = document.querySelector('input[name="deliveryMethodOptions"]:checked');
            const deliveryMethod = methodRadio ? methodRadio.value : 'delivery';
            
            // Build billing and shipping data
            const bFirst = document.getElementById('billingFirstName')?.value.trim();
            const bLast = document.getElementById('billingLastName')?.value.trim();
            const bEmail = document.getElementById('billingEmail')?.value.trim();
            
            const bData = {
              firstName: bFirst,
              lastName: bLast,
              email: bEmail,
              phone: document.getElementById('billingPhone')?.value.trim(),
              street: document.getElementById('billingStreet')?.value.trim(),
              apartment: document.getElementById('billingApartment')?.value.trim(),
              suburb: document.getElementById('billingSuburb')?.value.trim(),
              town: document.getElementById('billingTown')?.value.trim(),
              province: document.getElementById('billingProvince')?.value.trim(),
              postcode: document.getElementById('billingPostcode')?.value.trim()
            };

            const deliverDiff = document.getElementById('deliverToDifferent')?.checked;
            let sData = null;
            if (deliveryMethod === 'delivery' && deliverDiff) {
              sData = {
                firstName: document.getElementById('shippingFirstName')?.value.trim() || bFirst,
                lastName: document.getElementById('shippingLastName')?.value.trim() || bLast,
                street: document.getElementById('shippingStreet')?.value.trim(),
                town: document.getElementById('shippingTown')?.value.trim(),
                postcode: document.getElementById('shippingPostcode')?.value.trim()
              };
            }

            const orderPayload = {
              billing: bData,
              shipping: sData,
              deliveryMethod: 'delivery',
              items: cart,
              subtotal: subtotal,
              discount: discountAmount,
              shippingCost: shipping,
              total: grandTotal
            };

            const { data, apiBase } = await createOrderRequest(orderPayload, apiBases);
            
            // Update PayFast fields before redirecting
            setField('m_payment_id', data.orderId);
            setField('name_first', bFirst);
            setField('name_last', bLast);
            setField('email_address', bEmail);
            setField('amount', grandTotal.toFixed(2));
            setField('notify_url', apiBase + '/api/payfast-notify');

            // Mark user as returning to prevent duplicate discounts
            markAsReturningUser();

            // Actually submit to PayFast
            HTMLFormElement.prototype.submit.call(payfastForm);

          } catch (err) {
            console.error('Checkout error:', err);
            if (payfastNote) {
              payfastNote.style.color = '#c53b56';
              payfastNote.textContent = `Oops, something went wrong saving your order: ${err.message}. Please try again.`;
            }
            if (payfastButton) {
              payfastButton.disabled = false;
              payfastButton.textContent = 'Pay with PayFast';
            }
          }
        });
        payfastForm.dataset.listenerAttached = 'true';
      }
    }
    
    // Check for success/cancel params on checkout page load
    const alertBox = document.getElementById('checkoutAlert');
    if (alertBox) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('status') === 'success') {
        alertBox.style.display = 'block';
        alertBox.style.background = '#d1fae5';
        alertBox.style.color = '#065f46';
        alertBox.style.border = '1px solid #10b981';
        alertBox.innerHTML = 'Thank you for your order! Your payment was successful and we are preparing your items. A confirmation email has been sent.';
        
        // Clear cart now that it's paid
        if (canUseStorage) localStorage.removeItem(STORAGE_KEY);
        else memoryStore.cart = [];
        updateCount();
        window.dispatchEvent(new CustomEvent('vitra:cart-updated'));
        renderCart();
      } else if (urlParams.get('status') === 'cancel') {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.style.border = '1px solid #ef4444';
        alertBox.innerHTML = 'Payment was cancelled. Your cart has been saved — you can try checking out again whenever you are ready.';
      }
    }
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      updateCount();
      renderCart();
      renderCheckout();
    }
  });

  updateCount();
  attachAddToCart();
  renderCart();
  renderCheckout();
})();
