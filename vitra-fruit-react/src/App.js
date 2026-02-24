import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Products from './components/Products';
import Contact from './components/Contact';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar cartCount={0} />
      <main id="main-content">
        <Hero />
        <Categories />
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
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="Visa logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="Mastercard logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="Maestro logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="Samsung Pay logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="SnapScan logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="Zapper logo" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></li>
              <li className="payment-logo-card"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default App;
