import { useMemo, useRef, useState, useEffect } from "react";
import { navLinks } from "../data/siteContent";
import logoJpg from "../assets/images/logo.jpg";
import logoWebp from "../assets/images/logo.webp";
import logoAvif from "../assets/images/logo.avif";

function Navbar({ cartCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [activeHref, setActiveHref] = useState("#home");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastScrollY = useRef(0);
  const navbarRef = useRef(null);
  const searchInputRef = useRef(null);
  const allLinks = useMemo(() => [...navLinks.left, ...navLinks.right], []);
  const sectionLinks = useMemo(
    () =>
      allLinks
        .map((link) => link.href)
        .filter((href) => href.startsWith("#") && href !== "#cart"),
    [allLinks]
  );
  const shopDropdownItems = useMemo(
    () => [
      { label: "Citrus", categoryId: "citrus", href: "citrus.html" },
      { label: "Citrus Powders", categoryId: "citrus-powders", href: "shakers.html" },
      { label: "Dried Fruits", categoryId: "dried-fruits", href: "dried-fruits.html" },
      { label: "Vegetable Powders", categoryId: "vegetable-powders", href: "vegetable-powders.html" },
      { label: "Lifestyle", categoryId: "lifestyle", href: "lifestyle.html" }
    ],
    []
  );
  const searchItems = useMemo(
    () => [
      { label: "Lemon Wheel", href: "lemon-wheel.html", tags: ["lemon", "citrus", "wheel"] },
      { label: "Orange Wheel", href: "orange-wheel.html", tags: ["orange", "citrus", "wheel"] },
      { label: "Lime Wheel", href: "lime-wheel.html", tags: ["lime", "citrus", "wheel"] },
      { label: "Grapefruit Wheel", href: "grapefruit-wheel.html", tags: ["grapefruit", "citrus", "wheel"] },
      { label: "Citrus Collection", href: "citrus.html", tags: ["citrus", "collection", "wheels", "slices"] },
      { label: "Dried Fruits", href: "dried-fruits.html", tags: ["dried", "fruits", "slices", "chips", "strips", "apple", "pear", "banana", "pineapple", "mango"] },
      { label: "Vegetable Powders", href: "vegetable-powders.html", tags: ["vegetable", "powders"] },
      { label: "Citrus Powders", href: "shakers.html", tags: ["shakers", "citrus", "powders"] },
      { label: "Dehydrated Fruits", href: "dehydrated-fruits.html", tags: ["dehydrated", "fruits", "citrus"] },
      { label: "Lifestyle", href: "lifestyle.html", tags: ["lifestyle", "teas", "juices"] }
    ],
    []
  );

  const selectCategory = (categoryId) => {
    window.dispatchEvent(
      new CustomEvent("vitra:select-category", { detail: { categoryId } })
    );
    setActiveHref("#shop");
  };

  const navigateToShop = (categoryId) => {
    selectCategory(categoryId);
    const shopSection = document.querySelector("#shop");
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToShop = () => {
    const shopSection = document.querySelector("#shop");
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const triggerSearch = (query, { scroll = false } = {}) => {
    const trimmedQuery = query.trim();
    window.dispatchEvent(
      new CustomEvent("vitra:product-search", { detail: { query: trimmedQuery } })
    );
    if (scroll) {
      setActiveHref("#shop");
      scrollToShop();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollY.current;

      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > previousScrollY && currentScrollY > 90 && !isOpen) {
        setIsVisible(false);
      } else if (currentScrollY < previousScrollY) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  useEffect(() => {
    const updateActiveSection = () => {
      const offset = window.innerWidth >= 1100 ? 140 : 110;
      const scrollTarget = window.scrollY + offset;
      let current = "#home";

      sectionLinks.forEach((href) => {
        const section = document.querySelector(href);
        if (!section) return;
        if (section.offsetTop <= scrollTarget) {
          current = href;
        }
      });

      setActiveHref(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [sectionLinks]);

  useEffect(() => {
    if (!isOpen && !isSearchOpen) return;

    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsMobileShopOpen(false);
    }
  }, [isOpen]);

  const renderLink = (link, keyPrefix, isMobile = false) => {
    if (link.label === "Shop Now") {
      const isActive = activeHref === "#shop";

      return (
        <li key={`${keyPrefix}-${link.label}`} className="nav-item nav-dropdown">
          <button
            className={`nav-link nav-link-dropdown ${isActive ? "active" : ""}`}
            type="button"
            onClick={() => {
              if (isMobile) {
                setIsMobileShopOpen((current) => !current);
              }
            }}
            aria-expanded={isMobile ? isMobileShopOpen : undefined}
            aria-haspopup="true"
          >
            <span>{link.label}</span>
            <span className="nav-caret" aria-hidden="true">▾</span>
          </button>
          <ul className={`nav-dropdown-menu ${isMobile && isMobileShopOpen ? "is-open" : ""}`}>
            {shopDropdownItems.map((item) => (
              <li key={item.categoryId}>
                <a
                  className="nav-dropdown-link"
                  href={item.href || "#shop"}
                  onClick={(event) => {
                    if (item.href) {
                      if (isMobile) {
                        setIsOpen(false);
                      }
                      return;
                    }
                    event.preventDefault();
                    navigateToShop(item.categoryId);
                    if (isMobile) {
                      setIsOpen(false);
                    }
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    const isCart = link.label.toLowerCase() === "cart";
    if (isMobile && isCart) {
      return null;
    }
    const isActive = !isCart && activeHref === link.href;

    return (
      <li key={`${keyPrefix}-${link.label}`} className="nav-item">
        <a
          className={`nav-link ${isCart ? "cart-link" : ""} ${isActive ? "active" : ""}`}
          href={link.href}
          onClick={isMobile ? () => setIsOpen(false) : undefined}
        >
          {isCart && (
            <svg className="nav-cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M3 5h2l1.3 7.3a2 2 0 0 0 2 1.7h7.2a2 2 0 0 0 1.9-1.4l1.4-4.8H7.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.2" cy="18.4" r="1.4" fill="currentColor" />
              <circle cx="16.6" cy="18.4" r="1.4" fill="currentColor" />
            </svg>
          )}
          <span>{link.label}</span>
          {isCart && cartCount > 0 && <span className="nav-count">{cartCount}</span>}
        </a>
      </li>
    );
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    triggerSearch(searchQuery, { scroll: true });
    if (window.innerWidth < 1100) {
      setIsSearchOpen(false);
    }
  };

  const handleSearchChange = (event) => {
    const nextQuery = event.target.value;
    setSearchQuery(nextQuery);
    triggerSearch(nextQuery);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSearchItems = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }
    return searchItems
      .filter((item) => {
        const haystack = [item.label, ...(item.tags || [])].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [normalizedQuery, searchItems]);

  return (
    <div id="wrapper-navbar" className={!isVisible && !isOpen ? "is-hidden" : ""}>
      <nav ref={navbarRef} className="navbar" aria-label="Main Navigation">
        <div className="container navbar-container">
          <ul className="navbar-menu navbar-left">
            {navLinks.left.map((link) => renderLink(link, "left"))}
          </ul>

          <a className="navbar-logo" href="#home">
            <picture>
              <source srcSet={logoAvif} type="image/avif" />
              <source srcSet={logoWebp} type="image/webp" />
              <img src={logoJpg} alt="VitraFruits logo" />
            </picture>
          </a>

          <ul className="navbar-menu navbar-right">
            {navLinks.right.map((link) => renderLink(link, "right"))}
            <li className="nav-item nav-item-icon">
              <button
                className="nav-icon-button nav-search-button"
                type="button"
                aria-label="Search products"
                aria-expanded={isSearchOpen}
                aria-controls="nav-search-panel"
                onClick={() => setIsSearchOpen((current) => !current)}
              >
                <svg className="nav-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M16.3 16.3L21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          </ul>

          <button
            className={`navbar-toggler ${isOpen ? "is-open" : ""}`}
            type="button"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="navbar-toggler-icon">
              <span className="toggler-line" />
              <span className="toggler-line" />
              <span className="toggler-line" />
            </span>
          </button>

          <div className="navbar-actions">
            <button
              className="nav-icon-button nav-search-button"
              type="button"
              aria-label="Search products"
              aria-expanded={isSearchOpen}
              aria-controls="nav-search-panel"
              onClick={() => setIsSearchOpen((current) => !current)}
            >
              <svg className="nav-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16.3 16.3L21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <a className="nav-icon-link nav-cart-link" href="cart.html" aria-label="View cart">
              <svg className="nav-cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M3 5h2l1.3 7.3a2 2 0 0 0 2 1.7h7.2a2 2 0 0 0 1.9-1.4l1.4-4.8H7.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9.2" cy="18.4" r="1.4" fill="currentColor" />
                <circle cx="16.6" cy="18.4" r="1.4" fill="currentColor" />
              </svg>
              {cartCount > 0 && <span className="nav-count">{cartCount}</span>}
            </a>
          </div>

          <div
            id="nav-search-panel"
            className={`nav-search-panel ${isSearchOpen ? "is-open" : ""}`}
            role="search"
          >
            <form className="nav-search-form" onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                className="nav-search-input"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products..."
                aria-label="Search products"
              />
              <button className="nav-search-submit" type="submit">Search</button>
              <button
                className="nav-search-clear"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  triggerSearch("");
                }}
              >
                Clear
              </button>
            </form>
            {normalizedQuery ? (
              <div className="nav-search-results" role="list" aria-live="polite">
                {filteredSearchItems.length ? (
                  filteredSearchItems.map((item) => (
                    <a key={item.href} className="nav-search-result" href={item.href} role="listitem">
                      {item.label}
                    </a>
                  ))
                ) : (
                  <div className="nav-search-empty">No products found.</div>
                )}
              </div>
            ) : null}
          </div>

          <div className={`mobile-nav ${isOpen ? "is-open" : ""}`}>
            <ul className="navbar-nav">
              {allLinks.map((link) => renderLink(link, "mobile", true))}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
