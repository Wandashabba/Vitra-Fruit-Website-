import { useEffect, useRef, useState } from "react";
import { navLinks } from "../data/siteContent";
import logo from "../assets/images/logo.jpg";

function Navbar({ cartCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const allLinks = [...navLinks.left, ...navLinks.right];

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

  const renderLink = (link, keyPrefix, isMobile = false) => {
    const isCart = link.label.toLowerCase() === "cart";

    return (
      <li key={`${keyPrefix}-${link.label}`} className="nav-item">
        <a
          className={`nav-link ${isCart ? "cart-link" : ""}`}
          href={link.href}
          onClick={isMobile ? () => setIsOpen(false) : undefined}
        >
          <span>{link.label}</span>
          {isCart && <span className="nav-count">{cartCount}</span>}
        </a>
      </li>
    );
  };

  return (
    <div id="wrapper-navbar" className={!isVisible && !isOpen ? "is-hidden" : ""}>
      <nav className="navbar" aria-label="Main Navigation">
        <div className="container navbar-container">
          <ul className="navbar-menu navbar-left">
            {navLinks.left.map((link) => renderLink(link, "left"))}
          </ul>

          <a className="navbar-logo" href="#home">
            <img src={logo} alt="Vitra Fruit" />
          </a>

          <ul className="navbar-menu navbar-right">
            {navLinks.right.map((link) => renderLink(link, "right"))}
          </ul>

          <button
            className="navbar-toggler"
            type="button"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="navbar-toggler-icon" />
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
