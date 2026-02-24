import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Products from './components/Products';
import Contact from './components/Contact';
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
      </main>
      <section className="payment-strip" aria-label="Accepted payment methods">
        <div className="container payment-strip-inner">
          <p className="payment-strip-title">Secure payments accepted</p>
          <div className="payment-strip-viewport">
            <div className="payment-strip-track">
              <div className="payment-logo-item"><img src="/images/visa logo.webp" alt="Visa logo" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/maestro logo.png" alt="Maestro logo" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/Zapper logo.webp" alt="Zapper logo" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/snapscan logo.png" alt="SnapScan logo" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/samsung pay.png" alt="Samsung Pay logo" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/mastercard logo.jpeg" alt="Mastercard logo" className="payment-logo" /></div>

              <div className="payment-logo-item"><img src="/images/visa logo.webp" alt="" aria-hidden="true" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/maestro logo.png" alt="" aria-hidden="true" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/Zapper logo.webp" alt="" aria-hidden="true" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/snapscan logo.png" alt="" aria-hidden="true" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/samsung pay.png" alt="" aria-hidden="true" className="payment-logo" /></div>
              <div className="payment-logo-item"><img src="/images/mastercard logo.jpeg" alt="" aria-hidden="true" className="payment-logo" /></div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default App;
