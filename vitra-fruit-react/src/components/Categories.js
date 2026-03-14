import React, { useEffect, useState } from 'react';
import categoryPlaceholder from '../assets/images/category-placeholder.svg';

function Categories() {
  const [activeTab, setActiveTab] = useState('citrus');
  const getCategoryCtaHref = (category) => {
    const categoryPageById = {
      citrus: '/dehydrated-fruits.html',
      tropical: '/fruit-strips.html'
    };

    return categoryPageById[category.id] || '#products';
  };
  const tabImages = {
    citrus: { png: categoryPlaceholder, alt: 'Citrus category placeholder' },
    tropical: { png: categoryPlaceholder, alt: 'Tropical category placeholder' }
  };

  const categories = [
    {
      id: 'citrus',
      title: 'Citrus',
      subtitle: 'Bright & Zesty',
      desc: 'Discover bold citrus favourites made from carefully dehydrated fruit with crisp flavour and clean ingredients.'
    },
    {
      id: 'tropical',
      title: 'Tropical',
      subtitle: 'Sweet & Exotic',
      desc: 'Explore tropical fruit favourites with naturally vibrant sweetness, perfect for snacking, garnishing, and everyday flavour.'
    }
  ];

  useEffect(() => {
    const categoryAliasById = {
      citrus: 'citrus',
      tropical: 'tropical',
      'dried-fruits': 'citrus',
      beverages: 'citrus',
      'gift-boxes': 'tropical',
      'vegetable-powders': 'tropical'
    };

    const handleCategorySelect = (event) => {
      const categoryId = event.detail?.categoryId;
      const mappedCategoryId = categoryAliasById[categoryId];
      if (mappedCategoryId) {
        setActiveTab(mappedCategoryId);
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
                  className={`tab-btn ${isActive ? 'active' : ''} ${imageSet ? 'tab-btn-with-image' : ''} ${cat.id === 'citrus' ? 'tab-btn-citrus' : ''} ${cat.id === 'tropical' ? 'tab-btn-tropical' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {imageSet ? (
                    <picture className={`tab-btn-media ${cat.id === 'citrus' ? 'tab-btn-media-citrus' : ''} ${cat.id === 'tropical' ? 'tab-btn-media-tropical' : ''}`}>
                      <img
                        className={`tab-btn-image ${cat.id === 'citrus' ? 'tab-btn-image-citrus' : ''} ${cat.id === 'tropical' ? 'tab-btn-image-tropical' : ''}`}
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
