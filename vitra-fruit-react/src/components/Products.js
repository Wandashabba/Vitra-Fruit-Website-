import React from 'react';

const products = [
  { id: 1, name: 'Dried Strawberries', price: 85.00, category: 'dried-fruits' },
  { id: 2, name: 'Dried Mango Slices', price: 95.00, category: 'dried-fruits' },
  { id: 3, name: 'Dried Pineapple Rings', price: 78.00, category: 'dried-fruits' },
  { id: 4, name: 'Mixed Dried Fruit Box', price: 150.00, category: 'gift-boxes' },
  { id: 5, name: 'Premium Fruit Juice', price: 45.00, category: 'beverages' },
  { id: 6, name: 'Natural Fruit Smoothie', price: 55.00, category: 'beverages' }
];

function Products({ addToCart }) {
  const handleAddToCart = (product) => {
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <section className="featured-products" id="products">
      <div className="container">
        <h2>Featured Products</h2>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image"></div>
              <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-price">R {product.price.toFixed(2)}</p>
                <button className="add-to-cart" onClick={() => handleAddToCart(product)}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Products;
