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
      <Footer />
    </div>
  );
}

export default App;
