import React, { useEffect, useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import Contact from './components/Contact';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

const paymentLogos = [
  { src: '/images/visa logo.webp', alt: 'Visa logo' },
  { src: '/images/mastercard logo.webp', alt: 'Mastercard logo' },
  { src: '/images/maestro logo.webp', alt: 'Maestro logo' },
  { src: '/images/samsung pay.webp', alt: 'Samsung Pay logo' },
  { src: '/images/snapscan logo.webp', alt: 'SnapScan logo' },
  { src: '/images/Zapper logo.webp', alt: 'Zapper logo' }
];

function App() {
  const marqueeLogos = [...paymentLogos, ...paymentLogos, ...paymentLogos];
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const readCartCount = () => {
      try {
        const raw = localStorage.getItem('vitra_cart');
        const items = raw ? JSON.parse(raw) : [];
        const total = Array.isArray(items)
          ? items.reduce((sum, item) => sum + (item?.quantity || 0), 0)
          : 0;
        setCartCount(total);
      } catch (err) {
        setCartCount(0);
      }
    };

    readCartCount();

    const handleStorage = (event) => {
      if (!event || event.key === 'vitra_cart') {
        readCartCount();
      }
    };

    const handleCartUpdated = () => {
      readCartCount();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('vitra:cart-updated', handleCartUpdated);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('vitra:cart-updated', handleCartUpdated);
    };
  }, []);

  // Scroll-triggered reveal animations
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="App">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar cartCount={cartCount} />
      <main id="main-content">
        <Hero />
        <Products />
        <Contact />
        <AboutSection />
      </main>
      <section className="payment-strip" aria-label="Accepted payment methods">
        <div className="payment-strip-inner">
          <div className="payment-strip-head">
            <p className="payment-strip-eyebrow">Secure checkout</p>
          </div>
          <div className="payment-strip-viewport">
            <ul className="payment-strip-track">
              {marqueeLogos.map((logo, index) => {
                const isDecorativeDuplicate = index >= paymentLogos.length;
                return (
                  <li key={`${logo.alt}-${index}`} className="payment-logo-card">
                    <img
                      src={logo.src}
                      alt={isDecorativeDuplicate ? '' : logo.alt}
                      aria-hidden={isDecorativeDuplicate ? 'true' : undefined}
                      className="payment-logo"
                      loading="lazy"
                      decoding="async"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default App;
