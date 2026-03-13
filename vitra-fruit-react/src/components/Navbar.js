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
  const lastScrollY = useRef(0);
  const navbarRef = useRef(null);
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
      { label: "Citrus", categoryId: "citrus", href: "/citrus.html" },
      { label: "Tropical", categoryId: "tropical" },
      { label: "Vegetable Powders", categoryId: "vegetable-powders", href: "/vegetable-powders.html" },
      { label: "Fruit Bites", categoryId: "fruit-bites", href: "/fruit-strips.html" },
      { label: "Lifestyle", categoryId: "lifestyle", href: "#about" }
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
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen]);

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
    const isActive = !isCart && activeHref === link.href;

    return (
      <li key={`${keyPrefix}-${link.label}`} className="nav-item">
        <a
          className={`nav-link ${isCart ? "cart-link" : ""} ${isActive ? "active" : ""}`}
          href={link.href}
          onClick={isMobile ? () => setIsOpen(false) : undefined}
        >
          <span>{link.label}</span>
          {isCart && cartCount > 0 && <span className="nav-count">{cartCount}</span>}
        </a>
      </li>
    );
  };

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
              <img src={logoJpg} alt="Vitra Fruit logo" />
            </picture>
          </a>

          <ul className="navbar-menu navbar-right">
            {navLinks.right.map((link) => renderLink(link, "right"))}
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
