(function () {
  const STORAGE_KEY = 'vitra_cart';
  const VAT_KEY = 'vitra_vat_rate';
  const COUNT_SELECTOR = '[data-cart-count]';
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
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <button class="cart-remove" type="button" data-remove="${item.id}" aria-label="Remove item">×</button>
          </td>
          <td>
            <img class="cart-thumb" src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" />
          </td>
          <td>
            <div class="cart-product">${item.name}${item.size ? ` - ${item.size}` : ''}</div>
          </td>
          <td>${formatPrice(item.price)}</td>
          <td>
            <input class="cart-qty" type="number" min="1" max="${itemLimit}" value="${item.quantity}" data-qty="${item.id}" />
          </td>
          <td>${formatPrice(item.price * item.quantity)} (incl. VAT)</td>
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
      const removeId = target.getAttribute('data-remove');
      if (!removeId) return;
      const cart = loadCart().filter((item) => item.id !== removeId);
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

    render();
  }

  updateCount();
  attachAddToCart();
  renderCart();
})();
