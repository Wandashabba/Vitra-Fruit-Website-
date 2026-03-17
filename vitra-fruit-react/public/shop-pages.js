(function () {
  const revealPage = () => {
    if (document.body) {
      document.body.classList.add('is-ready');
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealPage, { once: true });
  } else {
    revealPage();
  }
  const wrapper = document.getElementById('wrapper-navbar');
  const toggler = document.getElementById('navToggler');
  const mobileNav = document.getElementById('mobileNav');
  const mobileShopToggle = document.getElementById('mobileShopToggle');
  const mobileShopDropdown = document.getElementById('mobileShopDropdown');
  const searchButtons = Array.from(document.querySelectorAll('.nav-search-button'));
  const searchPanel = document.querySelector('.nav-search-panel');
  const searchForm = searchPanel ? searchPanel.querySelector('.nav-search-form') : null;
  const searchInput = searchPanel ? searchPanel.querySelector('.nav-search-input') : null;
  const searchClear = searchPanel ? searchPanel.querySelector('.nav-search-clear') : null;
  let searchResults = searchPanel ? searchPanel.querySelector('.nav-search-results') : null;

  const yearTargets = document.querySelectorAll('[data-current-year]');
  yearTargets.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (!wrapper || !toggler || !mobileNav || !mobileShopToggle || !mobileShopDropdown) {
    return;
  }

  let isOpen = false;
  let isSearchOpen = false;
  let searchQuery = '';
  let lastScrollY = window.scrollY;

  const searchIndex = [
    { label: 'Lemon Wheel', href: 'lemon-wheel.html', tags: ['lemon', 'citrus', 'wheel'] },
    { label: 'Orange Wheel', href: 'orange-wheel.html', tags: ['orange', 'citrus', 'wheel'] },
    { label: 'Lime Wheel', href: 'lime-wheel.html', tags: ['lime', 'citrus', 'wheel'] },
    { label: 'Grapefruit Wheel', href: 'grapefruit-wheel.html', tags: ['grapefruit', 'citrus', 'wheel'] },
    { label: 'Citrus Collection', href: 'citrus.html', tags: ['citrus', 'wheels', 'powders'] },
    { label: 'Fruit Strips', href: 'fruit-strips.html', tags: ['tropical', 'strips', 'bites'] },
    { label: 'Vegetable Powders', href: 'vegetable-powders.html', tags: ['vegetable', 'powders'] },
    { label: 'Shakers', href: 'shakers.html', tags: ['shakers', 'citrus'] },
    { label: 'Dehydrated Fruits', href: 'dehydrated-fruits.html', tags: ['dehydrated', 'fruits'] }
  ];

  if (searchPanel && !searchResults) {
    searchResults = document.createElement('div');
    searchResults.className = 'nav-search-results';
    searchResults.setAttribute('aria-live', 'polite');
    searchPanel.appendChild(searchResults);
  }

  const closeMobile = () => {
    isOpen = false;
    toggler.classList.remove('is-open');
    toggler.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileShopToggle.setAttribute('aria-expanded', 'false');
    mobileShopDropdown.classList.remove('is-open');
  };

  const setSearchOpen = (next) => {
    if (!searchPanel || !searchButtons.length) {
      return;
    }
    isSearchOpen = next;
    searchPanel.classList.toggle('is-open', next);
    searchButtons.forEach((button) => {
      button.setAttribute('aria-expanded', next ? 'true' : 'false');
    });
    if (next && searchInput) {
      searchInput.focus();
    }
  };

  const normalizeValue = (value) => String(value || '').trim().toLowerCase();

  const tabButtons = Array.from(document.querySelectorAll('[data-category-tab]'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-pane'));
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const productsCount = document.getElementById('productsCount');
  let activeCategoryId = '';
  const activeButton = tabButtons.find((button) => button.classList.contains('active'));
  if (activeButton) {
    activeCategoryId = activeButton.getAttribute('data-category-tab') || '';
  }

  function setActiveCategory(categoryId) {
    activeCategoryId = categoryId || activeCategoryId;
    tabButtons.forEach(function (button) {
      const isActive = button.getAttribute('data-category-tab') === activeCategoryId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });

    tabPanels.forEach(function (panel) {
      const isActive = panel.id === ('panel-' + activeCategoryId);
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
  }

  function updateCategoryVisibility(query) {
    if (!tabButtons.length) {
      return;
    }
    const hasQuery = query.length > 0;
    const visibleButtons = [];

    tabButtons.forEach((button) => {
      const img = button.querySelector('img');
      const label = normalizeValue(button.textContent) + ' ' + normalizeValue(img ? img.alt : '');
      const matches = !hasQuery || label.includes(query);
      button.hidden = !matches;
      button.setAttribute('aria-hidden', matches ? 'false' : 'true');
      if (matches) {
        visibleButtons.push(button);
      }
    });

    if (!visibleButtons.length) {
      tabPanels.forEach((panel) => {
        panel.hidden = true;
        panel.classList.remove('active');
      });
      return;
    }

    if (!visibleButtons.some((button) => button.getAttribute('data-category-tab') === activeCategoryId)) {
      activeCategoryId = visibleButtons[0].getAttribute('data-category-tab');
    }
    setActiveCategory(activeCategoryId);
  }

  function updateProductVisibility(query) {
    if (!productCards.length) {
      return;
    }
    let visibleCount = 0;
    productCards.forEach((card) => {
      const text = normalizeValue(card.textContent);
      const matches = !query || text.includes(query);
      const typeHidden = card.getAttribute('data-type-hidden') === 'true';
      const shouldShow = matches && !typeHidden;
      card.hidden = !shouldShow;
      card.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      if (shouldShow) {
        visibleCount += 1;
      }
    });
    if (productsCount) {
      productsCount.textContent = `${visibleCount} product${visibleCount === 1 ? '' : 's'}`;
    }
  }

  function applySearch() {
    const normalized = normalizeValue(searchQuery);
    updateCategoryVisibility(normalized);
    updateProductVisibility(normalized);
    renderSearchResults(normalized);
    window.dispatchEvent(
      new CustomEvent('vitra:product-search', { detail: { query: searchQuery.trim() } })
    );
  }

  window.vitraApplySearch = applySearch;

  function renderSearchResults(normalizedQuery) {
    if (!searchResults) {
      return;
    }

    searchResults.innerHTML = '';
    if (!normalizedQuery) {
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
      return;
    }

    matches.slice(0, 6).forEach((item) => {
      const link = document.createElement('a');
      link.className = 'nav-search-result';
      link.href = item.href;
      link.textContent = item.label;
      searchResults.appendChild(link);
    });
  }

  toggler.addEventListener('click', function () {
    isOpen = !isOpen;
    toggler.classList.toggle('is-open', isOpen);
    toggler.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    mobileNav.classList.toggle('is-open', isOpen);
    if (!isOpen) {
      mobileShopToggle.setAttribute('aria-expanded', 'false');
      mobileShopDropdown.classList.remove('is-open');
    }
  });

  mobileShopToggle.addEventListener('click', function () {
    const isDropdownOpen = mobileShopDropdown.classList.toggle('is-open');
    mobileShopToggle.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
  });

  document.addEventListener('click', function (event) {
    const nav = wrapper.querySelector('.navbar');
    if (nav && !nav.contains(event.target)) {
      closeMobile();
      setSearchOpen(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMobile();
      setSearchOpen(false);
    }
  });

  window.addEventListener('scroll', function () {
    const currentY = window.scrollY;
    if (currentY <= 20) {
      wrapper.classList.remove('is-hidden');
    } else if (currentY > lastScrollY && currentY > 90 && !isOpen && !isSearchOpen) {
      wrapper.classList.add('is-hidden');
    } else if (currentY < lastScrollY) {
      wrapper.classList.remove('is-hidden');
    }
    lastScrollY = currentY;
  }, { passive: true });

  tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setActiveCategory(button.getAttribute('data-category-tab'));
    });
  });

  if (searchButtons.length) {
    searchButtons.forEach((button) => {
      button.addEventListener('click', function () {
        setSearchOpen(!isSearchOpen);
      });
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchQuery = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      applySearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function (event) {
      searchQuery = event.target.value || '';
      applySearch();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      applySearch();
      const shopSection = document.getElementById('shop');
      if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (window.innerWidth < 1100) {
        setSearchOpen(false);
      }
    });
  }

  applySearch();
})();
