import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Products from './components/Products';
import AboutSection from './components/AboutSection';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  return (
    <div className="App">
      <Navbar cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
      <Hero />
      <Categories />
      <Products addToCart={addToCart} />
      <AboutSection />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
