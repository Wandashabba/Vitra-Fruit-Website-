(function () {
  var navWrap = document.querySelector('[data-site-nav]');
  if (!navWrap) return;

  var menuToggle = navWrap.querySelector('[data-menu-toggle]');
  var menu = navWrap.querySelector('[data-menu]');
  var shopItem = navWrap.querySelector('[data-shop-item]');
  var shopToggle = navWrap.querySelector('[data-shop-toggle]');

  var lastY = window.scrollY;
  var isMenuOpen = false;

  function closeShop() {
    if (!shopItem || !shopToggle) return;
    shopItem.classList.remove('open');
    shopToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleShop() {
    if (!shopItem || !shopToggle) return;
    var isOpen = shopItem.classList.toggle('open');
    shopToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function closeMenu() {
    if (!menu || !menuToggle) return;
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    isMenuOpen = false;
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      isMenuOpen = !isMenuOpen;
      menu.classList.toggle('open', isMenuOpen);
      menuToggle.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
      if (!isMenuOpen) closeShop();
    });
  }

  if (shopToggle) {
    shopToggle.addEventListener('click', function () {
      toggleShop();
    });
  }

  document.addEventListener('click', function (event) {
    if (shopItem && !shopItem.contains(event.target)) {
      closeShop();
    }
    if (window.innerWidth <= 900 && menu && menuToggle && !menuToggle.contains(event.target) && !menu.contains(event.target)) {
      closeMenu();
      closeShop();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      if (menu) menu.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      isMenuOpen = false;
    }
  });

  window.addEventListener('scroll', function () {
    var currentY = window.scrollY;
    if (currentY <= 20) {
      navWrap.classList.remove('is-hidden');
    } else if (currentY > lastY + 2 && currentY > 90 && !isMenuOpen) {
      navWrap.classList.add('is-hidden');
    } else if (currentY < lastY - 2) {
      navWrap.classList.remove('is-hidden');
    }
    lastY = currentY;
  }, { passive: true });

  var path = window.location.pathname;
  var links = navWrap.querySelectorAll('.site-nav-link[data-match]');
  links.forEach(function (link) {
    var match = link.getAttribute('data-match');
    var isActive = false;
    if (match === 'home') {
      isActive = path === '/' || path.endsWith('/index.html');
    } else if (match === 'contact') {
      isActive = path.endsWith('/contact.html');
    } else if (match === 'account') {
      isActive = path.endsWith('/account.html');
    } else if (match === 'dehydrated') {
      isActive = path.endsWith('/dehydrated-fruits.html');
    }
    if (isActive) link.classList.add('is-active');
  });
})();
