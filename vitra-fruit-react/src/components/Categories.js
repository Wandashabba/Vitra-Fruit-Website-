import React, { useState } from 'react';

function Categories() {
  const [activeTab, setActiveTab] = useState('dried-fruits');

  const categories = [
    { id: 'dried-fruits', title: 'Dried Fruits', subtitle: 'Natural & Nutritious', 
      desc: 'All our dried fruits are naturally air-dried with no added preservatives or sulphur. Perfect for snacking, baking, or adding to your favorite recipes.' },
    { id: 'beverages', title: 'Beverages', subtitle: 'Refreshing & Pure',
      desc: 'Our premium beverages are crafted from the finest natural ingredients. From fruit juices to specialty drinks, each bottle delivers pure refreshment.' },
    { id: 'gift-boxes', title: 'Gift Boxes', subtitle: 'Perfect for Any Occasion',
      desc: 'Curated gift boxes featuring our best dried fruits and beverages. Beautifully packaged and ready to delight your loved ones.' }
  ];

  return (
    <section className="categories" id="shop">
      <div className="container">
        <div className="category-tabs">
          <div className="tab-buttons">
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`tab-btn ${activeTab === cat.id ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <h3>{cat.title}</h3>
              </button>
            ))}
          </div>
          <div className="tab-content">
            {categories.map(cat => (
              <div key={cat.id} className={`tab-pane ${activeTab === cat.id ? 'active' : ''}`}>
                <h2>{cat.title}</h2>
                <h4>{cat.subtitle}</h4>
                <p>{cat.desc}</p>
                <a href="#products" className="btn btn-secondary">Shop {cat.title}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Categories;
