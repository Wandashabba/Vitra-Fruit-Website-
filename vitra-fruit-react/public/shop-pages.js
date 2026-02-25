(function () {
  const wrapper = document.getElementById('wrapper-navbar');
  const toggler = document.getElementById('navToggler');
  const mobileNav = document.getElementById('mobileNav');
  const mobileShopToggle = document.getElementById('mobileShopToggle');
  const mobileShopDropdown = document.getElementById('mobileShopDropdown');

  const yearTargets = document.querySelectorAll('[data-current-year]');
  yearTargets.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (!wrapper || !toggler || !mobileNav || !mobileShopToggle || !mobileShopDropdown) {
    return;
  }

  let isOpen = false;
  let lastScrollY = window.scrollY;

  const closeMobile = () => {
    isOpen = false;
    toggler.classList.remove('is-open');
    toggler.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileShopToggle.setAttribute('aria-expanded', 'false');
    mobileShopDropdown.classList.remove('is-open');
  };

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
    }
  });

  window.addEventListener('scroll', function () {
    const currentY = window.scrollY;
    if (currentY <= 20) {
      wrapper.classList.remove('is-hidden');
    } else if (currentY > lastScrollY && currentY > 90 && !isOpen) {
      wrapper.classList.add('is-hidden');
    } else if (currentY < lastScrollY) {
      wrapper.classList.remove('is-hidden');
    }
    lastScrollY = currentY;
  }, { passive: true });

  const tabButtons = Array.from(document.querySelectorAll('[data-category-tab]'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-pane'));

  function setActiveCategory(categoryId) {
    tabButtons.forEach(function (button) {
      const isActive = button.getAttribute('data-category-tab') === categoryId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });

    tabPanels.forEach(function (panel) {
      const isActive = panel.id === ('panel-' + categoryId);
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
  }

  tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setActiveCategory(button.getAttribute('data-category-tab'));
    });
  });
})();
