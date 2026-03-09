import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import Contact from './components/Contact';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

function App() {
  const paymentLogos = [
    { src: '/images/visa logo.webp', alt: 'Visa logo' },
    { src: '/images/mastercard logo.jpeg', alt: 'Mastercard logo' },
    { src: '/images/maestro logo.png', alt: 'Maestro logo' },
    { src: '/images/samsung pay.png', alt: 'Samsung Pay logo' },
    { src: '/images/snapscan logo.png', alt: 'SnapScan logo' },
    { src: '/images/Zapper logo.webp', alt: 'Zapper logo' }
  ];
  const marqueeLogos = [...paymentLogos, ...paymentLogos, ...paymentLogos];

  return (
    <div className="App">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar cartCount={0} />
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
