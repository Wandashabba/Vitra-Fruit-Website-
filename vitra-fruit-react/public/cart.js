(function () {
  const STORAGE_KEY = 'vitra_cart';
  const VAT_KEY = 'vitra_vat_rate';
  const COUNT_SELECTOR = '[data-cart-count]';
  const BAG_COUNT_SELECTOR = '[data-cart-bag-count]';
  const DEFAULT_MAX_QTY = 100;
  const memoryStore = { cart: [], vatRate: 0.15 };
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
      '500g': 260,
    };

    if (name.includes('wheel')) {
      next.price = 100;
      return next;
    }

    if (name.includes('pineapple slices')) {
      const normalizedSize = size || '100g';
      const pineappleSliceSizes = {
        '100g': 120,
        '200g': 220,
        '500g': 280,
      };
      next.size = normalizedSize;
      next.price = pineappleSliceSizes[normalizedSize] || 120;
      return next;
    }

    if (name.includes('banana chips')) {
      const normalizedSize = size || '100g';
      const bananaChipSizes = {
        '100g': 100,
        '200g': 180,
        '500g': 240,
      };
      next.size = normalizedSize;
      next.price = bananaChipSizes[normalizedSize] || 100;
      return next;
    }

    if (name.includes('orange powder') && !name.includes('orange powders')) {
      next.name = 'Dehydrated Orange Powders';
      if (next.id === 'dehydrated-orange-powder') {
        next.id = 'dehydrated-orange-powders';
      }
      return next;
    }

    if (name.includes('grapefruit powder') && !name.includes('grapefruit powders')) {
      next.name = 'Dehydrated Grapefruit Powders';
      if (next.id === 'dehydrated-grapefruit-powder') {
        next.id = 'dehydrated-grapefruit-powders';
      }
      return next;
    }

    if (name.includes('lemon powder') && !name.includes('lemon powders')) {
      next.name = 'Dehydrated Lemon Powders';
      if (next.id === 'dehydrated-lemon-powder') {
        next.id = 'dehydrated-lemon-powders';
      }
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
      const normalizedSize = size || '100g';
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
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch (err) {
      memoryStore.cart = nextItems;
    }
    updateCount(nextItems);
  }

  function updateCount(items) {
    const cart = items || loadCart();
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    document.querySelectorAll(COUNT_SELECTOR).forEach((el) => {
      el.textContent = String(total);
      el.style.display = total > 0 ? 'inline-flex' : 'none';
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

  function parsePrice(value) {
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }

  function formatPrice(value) {
    return `R${value.toFixed(2)}`;
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

    function render() {
      const cart = loadCart();
      tableBody.innerHTML = '';

      if (!cart.length) {
        if (emptyState) {
          emptyState.hidden = false;
        }
        if (subtotalEl) subtotalEl.textContent = formatPrice(0) + ' (incl. VAT)';
        if (totalEl) totalEl.textContent = formatPrice(0) + ` (includes ${formatPrice(0)} VAT)`;
        if (vatEl) vatEl.textContent = '';
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

      const vat = subtotal - subtotal / (1 + vatRate);
      if (subtotalEl) subtotalEl.textContent = `${formatPrice(subtotal)} (incl. VAT)`;
      if (totalEl) totalEl.textContent = `${formatPrice(subtotal)}`;
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
    const cart = loadCart();
    const vatRate = loadVatRate();
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

    const vat = subtotal - subtotal / (1 + vatRate);
    if (subtotalEl) subtotalEl.textContent = `${formatPrice(subtotal)} (incl. VAT)`;
    if (totalEl) totalEl.textContent = `${formatPrice(subtotal)}`;

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
        .join(', ');

      const origin = window.location.origin || '';
      const liveDomain = 'https://vitrafruits.co.za';
      const returnBase = origin.includes('vitrafruits.co.za') ? origin : liveDomain;
      setField('amount', subtotal.toFixed(2));
      setField('item_name', 'Vitra Fruit Products');
      setField('item_description', description);
      setField('return_url', returnBase + '/checkout.html?status=success');
      setField('cancel_url', returnBase + '/checkout.html?status=cancel');
      setField('notify_url', '');
      setField('m_payment_id', `VITRA-${Date.now()}`);
      setField('name_first', billingFirstName ? billingFirstName.value.trim() : '');
      setField('name_last', billingLastName ? billingLastName.value.trim() : '');
      setField('email_address', billingEmail ? billingEmail.value.trim() : '');

      if (!payfastForm.dataset.listenerAttached) {
        payfastForm.addEventListener('submit', function (event) {
          if (!cart.length) {
            event.preventDefault();
            if (payfastNote) {
              payfastNote.textContent = 'Please add items to your cart to checkout.';
            }
            return;
          }
          setField('name_first', billingFirstName ? billingFirstName.value.trim() : '');
          setField('name_last', billingLastName ? billingLastName.value.trim() : '');
          setField('email_address', billingEmail ? billingEmail.value.trim() : '');
        });
        payfastForm.dataset.listenerAttached = 'true';
      }
    }
  }

  updateCount();
  attachAddToCart();
  renderCart();
  renderCheckout();
})();
