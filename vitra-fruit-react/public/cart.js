(function () {
  const STORAGE_KEY = 'vitra_cart';
  const VAT_KEY = 'vitra_vat_rate';
  const COUNT_SELECTOR = '[data-cart-count]';
  const BAG_COUNT_SELECTOR = '[data-cart-bag-count]';
  const DEFAULT_MAX_QTY = 100;

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateCount(items);
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
    const stored = localStorage.getItem(VAT_KEY);
    const parsed = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : 0.15;
  }

  function saveVatRate(rate) {
    localStorage.setItem(VAT_KEY, String(rate));
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
    document.querySelectorAll('[data-add-to-cart]')?.forEach((button) => {
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

    let vatRate = loadVatRate();

    if (vatSelect) {
      vatSelect.value = String(vatRate);
      vatSelect.addEventListener('change', function () {
        const nextRate = parseFloat(vatSelect.value);
        if (Number.isFinite(nextRate)) {
          vatRate = nextRate;
          saveVatRate(vatRate);
          render();
        }
      });
    }

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
              ×
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
      if (totalEl) totalEl.textContent = `${formatPrice(subtotal)} (includes ${formatPrice(vat)} VAT)`;
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

    itemsWrap.innerHTML = '';

    if (!cart.length) {
      if (subtotalEl) subtotalEl.textContent = formatPrice(0) + ' (incl. VAT)';
      if (totalEl) totalEl.textContent = formatPrice(0) + ` (includes ${formatPrice(0)} VAT)`;
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
      price.textContent = formatPrice(item.price * item.quantity);

      row.appendChild(title);
      row.appendChild(price);
      itemsWrap.appendChild(row);

      subtotal += item.price * item.quantity;
    });

    const vat = subtotal - subtotal / (1 + vatRate);
    if (subtotalEl) subtotalEl.textContent = `${formatPrice(subtotal)} (incl. VAT)`;
    if (totalEl) totalEl.textContent = `${formatPrice(subtotal)} (includes ${formatPrice(vat)} VAT)`;
  }

  updateCount();
  attachAddToCart();
  renderCart();
  renderCheckout();
})();
