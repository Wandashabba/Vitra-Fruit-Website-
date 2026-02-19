import React, { useState } from 'react';
import category1Png from '../assets/images/category1.png';
import category2Png from '../assets/images/category2.png';
import category3Png from '../assets/images/category3.png';
import category1Webp from '../assets/images/category1.webp';
import category2Webp from '../assets/images/category2.webp';
import category3Webp from '../assets/images/category3.webp';
import category1Avif from '../assets/images/category1.avif';
import category2Avif from '../assets/images/category2.avif';
import category3Avif from '../assets/images/category3.avif';

function Categories() {
  const [activeTab, setActiveTab] = useState('dried-fruits');
  const tabImages = {
    'dried-fruits': { png: category1Png, webp: category1Webp, avif: category1Avif, alt: 'Dehydrated fruits category' },
    beverages: { png: category2Png, webp: category2Webp, avif: category2Avif, alt: 'Beverages category' },
    'gift-boxes': { png: category3Png, webp: category3Webp, avif: category3Avif, alt: 'Gift boxes category' }
  };

  const categories = [
    { id: 'dried-fruits', title: 'Dehydrated Fruits', subtitle: 'Fruity Flavours', 
      desc: 'All our dried fruits are naturally air-dried with no added preservatives or sulphur. Perfect for snacking, baking, or adding to your favorite recipes.' },
    { id: 'beverages', title: 'Beverages', subtitle: 'Refreshing & Pure',
      desc: 'Our premium beverages are crafted from the finest natural ingredients. From fruit juices to specialty drinks, each bottle delivers pure refreshment.' },
    { id: 'gift-boxes', title: 'Gift Boxes', subtitle: 'Perfect for Any Occasion',
      desc: 'Curated gift boxes featuring our best dried fruits and beverages. Beautifully packaged and ready to delight your loved ones.' }
  ];

  return (
    <section className="categories" id="shop">
      <div className="container">
        <div className="categories-header">
          <p className="categories-kicker">Shop by Category</p>
        </div>
        <div className="category-tabs">
          <div className="tab-buttons" role="tablist" aria-label="Product categories">
            {categories.map(cat => {
              const imageSet = tabImages[cat.id];
              const isActive = activeTab === cat.id;

              return (
                <button 
                  key={cat.id}
                  id={`tab-${cat.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${cat.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`tab-btn ${isActive ? 'active' : ''} ${imageSet ? 'tab-btn-with-image' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {imageSet ? (
                    <picture>
                      <source srcSet={imageSet.avif} type="image/avif" />
                      <source srcSet={imageSet.webp} type="image/webp" />
                      <img
                        className={`tab-btn-image ${cat.id === 'dried-fruits' ? 'tab-btn-image-fit' : ''}`}
                        src={imageSet.png}
                        alt={imageSet.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  ) : (
                    <h3>{cat.title}</h3>
                  )}
                </button>
              );
            })}
          </div>
          <div className="tab-content">
            {categories.map(cat => {
              const isActive = activeTab === cat.id;

              return (
              <div
                key={cat.id}
                id={`panel-${cat.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${cat.id}`}
                hidden={!isActive}
                className={`tab-pane ${isActive ? 'active' : ''}`}
              >
                <h2>{cat.title}</h2>
                <h4>{cat.subtitle}</h4>
                <p>{cat.desc}</p>
                <a href="#products" className="btn btn-secondary">Shop {cat.title}</a>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Categories;
