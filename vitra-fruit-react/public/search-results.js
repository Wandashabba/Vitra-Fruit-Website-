(function () {
  const searchIndex = [
    { label: 'Citrus Collection', href: 'citrus.html', tags: ['citrus', 'collection', 'wheels', 'slices'] },
    { label: 'Citrus Powders', href: 'shakers.html', tags: ['citrus', 'powders', 'shakers'] },
    { label: 'Dried Fruits', href: 'dried-fruits.html', tags: ['dried', 'fruits', 'apple', 'pear', 'pineapple', 'banana', 'mango'] },
    { label: 'Vegetable Powders', href: 'vegetable-powders.html', tags: ['vegetable', 'powders', 'beetroot', 'butternut', 'carrot', 'spinach'] },
    { label: 'Dehydrated Fruits', href: 'dehydrated-fruits.html', tags: ['dehydrated', 'fruits'] },
    { label: 'Lifestyle', href: 'lifestyle.html', tags: ['lifestyle', 'teas', 'juices'] },
    { label: 'Lemon Wheels', href: 'lemon-wheel.html', tags: ['lemon', 'wheel', 'wheels', 'citrus'] },
    { label: 'Orange Wheels', href: 'orange-wheel.html', tags: ['orange', 'wheel', 'wheels', 'citrus'] },
    { label: 'Lime Wheels', href: 'lime-wheel.html', tags: ['lime', 'wheel', 'wheels', 'citrus'] },
    { label: 'Grapefruit Wheels', href: 'grapefruit-wheel.html', tags: ['grapefruit', 'wheel', 'wheels', 'citrus'] },
    { label: 'Lemon Slices', href: 'lemon-slices.html', tags: ['lemon', 'slices', 'citrus'] },
    { label: 'Orange Slices', href: 'orange-slices.html', tags: ['orange', 'slices', 'citrus'] },
    { label: 'Lime Slices', href: 'lime-slices.html', tags: ['lime', 'slices', 'citrus'] },
    { label: 'Grapefruit Slices', href: 'grapefruit-slices.html', tags: ['grapefruit', 'slices', 'citrus'] },
    { label: 'Apple Slices', href: 'apple-slices.html', tags: ['apple', 'slices', 'dried', 'fruits'] },
    { label: 'Pear Slices', href: 'pear-slices.html', tags: ['pear', 'slices', 'dried', 'fruits'] },
    { label: 'Pineapple Slices', href: 'pineapple-slices.html', tags: ['pineapple', 'slices', 'dried', 'fruits', 'tropical'] },
    { label: 'Banana Chips', href: 'banana-chips.html', tags: ['banana', 'chips', 'dried', 'fruits'] },
    { label: 'Mango Strips', href: 'mango-strips.html', tags: ['mango', 'strips', 'dried', 'fruits', 'tropical'] },
    { label: 'Hibiscus Flowers', href: 'hibiscus-flowers.html', tags: ['hibiscus', 'flowers', 'lifestyle'] },
    { label: 'Lemon Powders', href: 'lemon-powder.html', tags: ['lemon', 'powder', 'powders', 'citrus'] },
    { label: 'Orange Powders', href: 'orange-powder.html', tags: ['orange', 'powder', 'powders', 'citrus'] },
    { label: 'Grapefruit Powders', href: 'grapefruit-powder.html', tags: ['grapefruit', 'powder', 'powders', 'citrus'] },
    { label: 'Beetroot Powders', href: 'beetroot-powder.html', tags: ['beetroot', 'powder', 'powders', 'vegetable'] },
    { label: 'Butternut Powders', href: 'butternut-powder.html', tags: ['butternut', 'powder', 'powders', 'vegetable'] },
    { label: 'Carrot Powders', href: 'carrot-powder.html', tags: ['carrot', 'powder', 'powders', 'vegetable'] },
    { label: 'Spinach Powders', href: 'spinach-powder.html', tags: ['spinach', 'powder', 'powders', 'vegetable'] },
    { label: 'Fruit Strips', href: 'fruit-strips.html', tags: ['fruit', 'strips', 'dried', 'fruits'] }
  ];

  const normalize = (value) => String(value || '').trim().toLowerCase();

  function ensureSearchPanel() {
    const searchPanel = document.querySelector('.nav-search-panel');
    const searchInput = searchPanel ? searchPanel.querySelector('.nav-search-input') : null;
    const searchForm = searchPanel ? searchPanel.querySelector('.nav-search-form') : null;
    const searchClear = searchPanel ? searchPanel.querySelector('.nav-search-clear') : null;
    if (!searchPanel || !searchInput || !searchForm) {
      return null;
    }

    let searchResults = searchPanel.querySelector('.nav-search-results');
    if (!searchResults) {
      searchResults = document.createElement('div');
      searchResults.className = 'nav-search-results';
      searchResults.setAttribute('aria-live', 'polite');
      searchPanel.appendChild(searchResults);
    }

    const renderResults = (query) => {
      const normalizedQuery = normalize(query);
      searchResults.innerHTML = '';

      if (!normalizedQuery) {
        searchResults.classList.remove('is-open');
        return;
      }

      const matches = searchIndex.filter((item) => {
        const haystack = [item.label, ...(item.tags || [])].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      });

      if (!matches.length) {
        const empty = document.createElement('div');
        empty.className = 'nav-search-empty';
        empty.textContent = 'No products found.';
        searchResults.appendChild(empty);
        searchResults.classList.add('is-open');
        return;
      }

      matches.forEach((item) => {
        const link = document.createElement('a');
        link.className = 'nav-search-result';
        link.href = item.href;
        link.textContent = item.label;
        searchResults.appendChild(link);
      });
      searchResults.classList.add('is-open');
    };

    searchInput.addEventListener('input', () => {
      renderResults(searchInput.value);
    });

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      renderResults(searchInput.value);
    });

    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      renderResults('');
      searchInput.focus();
    });

    renderResults(searchInput.value);
    return searchResults;
  }

  function injectBulkOrderNote() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (!addToCartBtn || document.querySelector('.bulk-order-note')) {
      return;
    }

    const note = document.createElement('div');
    note.className = 'bulk-order-note';
    note.innerHTML = `
      <span style="font-size: 1.2rem;">📦</span>
      <span>Wholesale or bulk orders? Contact us at <a href="mailto:orderinfo@vitrafruits.co.za" style="color: #c03030; text-decoration: underline; font-weight: 700;">orderinfo@vitrafruits.co.za</a></span>
    `;
    note.style.cssText = 'margin: 24px 0 0; padding: 16px; background: #fff9f0; border: 1px solid rgba(192, 152, 40, 0.15); border-radius: 16px; font-size: 0.88rem; font-weight: 500; line-height: 1.4; color: #444; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);';

    const actions = addToCartBtn.closest('.actions');
    if (actions) {
      actions.insertAdjacentElement('afterend', note);
    } else {
      addToCartBtn.parentNode.appendChild(note);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureSearchPanel();
      injectBulkOrderNote();
    }, { once: true });
  } else {
    ensureSearchPanel();
    injectBulkOrderNote();
  }
})();
