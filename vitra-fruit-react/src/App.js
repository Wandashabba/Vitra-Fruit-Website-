import React, { useEffect, useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import Contact from './components/Contact';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

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
      <section className="instagram-strip" aria-label="Follow us on Instagram">
        <div className="instagram-strip-inner">
          <div className="instagram-strip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.6"/>
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/>
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>
            </svg>
          </div>
          <div className="instagram-strip-copy">
            <p className="instagram-strip-eyebrow">Find us on Instagram</p>
            <p className="instagram-strip-text">
              Recipes, cocktail inspo & behind the scenes
            </p>
          </div>
          <a
            className="instagram-strip-link"
            href="https://www.instagram.com/vitrafruits/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @vitrafruits
          </a>
        </div>
      </section>
      <Footer />
      <a
        className="wa-float"
        href="https://wa.me/27679414223"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      <Chatbot />
    </div>
  );
}

export default App;
