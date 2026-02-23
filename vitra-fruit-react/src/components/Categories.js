import React, { useEffect, useState } from 'react';
import category4Png from '../assets/images/category4.png';
import category5Png from '../assets/images/category5.png';
import category6Png from '../assets/images/category6.png';
import category4Webp from '../assets/images/category4.webp';
import category5Webp from '../assets/images/category5.webp';
import category6Webp from '../assets/images/category6.webp';
import category4Avif from '../assets/images/category4.avif';
import category5Avif from '../assets/images/category5.avif';
import category6Avif from '../assets/images/category6.avif';

function Categories() {
  const [activeTab, setActiveTab] = useState('dried-fruits');
  const getCategoryCtaHref = (category) =>
    category.title === 'Dehydrated Fruits' ? '/dehydrated-fruits.html' : '#products';
  const tabImages = {
    'dried-fruits': { png: category5Png, webp: category5Webp, avif: category5Avif, alt: 'Dehydrated fruits category' },
    beverages: { png: category4Png, webp: category4Webp, avif: category4Avif, alt: 'Beverages category' },
    'gift-boxes': { png: category6Png, webp: category6Webp, avif: category6Avif, alt: 'Gift boxes category' }
  };

  const categories = [
    { id: 'dried-fruits', title: 'Fruit Powder', subtitle: 'Fruity Flavours', 
      desc: 'Our fruit powders are made from carefully dehydrated fruit and finely milled to lock in natural taste and aroma. Perfect for smoothies, baking, desserts, cocktails, and everyday flavour boosts.' },
    { id: 'beverages', title: 'Dehydrated Fruits', subtitle: 'Fruity Flavours',
      desc: 'All our dried fruits are naturally air-dried with no added preservatives or sulphur. Perfect for snacking, baking, or adding to your favorite recipes.' },
    { id: 'gift-boxes', title: 'Fruit Strips', subtitle: 'Dried Fruits',
      desc: 'Our fruit strips are made from naturally dried fruit with vibrant flavour and a satisfying chewy texture. Perfect for healthy snacking, lunchboxes, travel, and on-the-go energy.' }
  ];

  useEffect(() => {
    const validCategoryIds = ['dried-fruits', 'beverages', 'gift-boxes'];

    const handleCategorySelect = (event) => {
      const categoryId = event.detail?.categoryId;
      if (validCategoryIds.includes(categoryId)) {
        setActiveTab(categoryId);
      }
    };

    window.addEventListener('vitra:select-category', handleCategorySelect);
    return () => window.removeEventListener('vitra:select-category', handleCategorySelect);
  }, []);

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
                        className={`tab-btn-image ${cat.id === 'dried-fruits' ? 'tab-btn-image-fit' : ''} ${cat.id === 'gift-boxes' ? 'tab-btn-image-gift' : ''}`}
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
                <a href={getCategoryCtaHref(cat)} className="btn btn-secondary">Shop {cat.title}</a>
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
