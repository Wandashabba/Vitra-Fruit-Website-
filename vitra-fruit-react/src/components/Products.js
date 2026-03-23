import React, { useEffect, useMemo, useState } from 'react';
import '../product-hover-graphics.css';
import aboutUsJpg from '../assets/images/about-us.jpg';
import aboutUsWebp from '../assets/images/about-us.webp';
import aboutUsAvif from '../assets/images/about-us.avif';
import homepagePe from '../assets/images/Pleaser2.png';
import homepageOr from '../assets/images/OrangePleaser.png';
import homepageHi from '../assets/images/Pleaser3.png';
import homepageLi from '../assets/images/Pleaser4.png';
import proudlySALogo from '../assets/images/ProudlySA_Member_Logo 2.png';

const favouriteProducts = [
  {
    name: 'Lemon Slices',
    note: 'Sweet and mellow',
    price: 'R150 - R480',
    href: '#shop',
    imageSrc: homepagePe,
    imageAlt: 'Fresh lemon flavour inspiration'
  },
  {
    name: 'Orange wheel',
    note: 'Citrus brightness',
    price: 'R80',
    href: '#shop',
    imageSrc: homepageOr,
    imageAlt: 'Orange wheel flavour inspiration'
  },
  {
    name: 'Grapefruit Slices',
    note: 'Floral and vibrant',
    price: 'R150 - R480',
    href: '#shop',
    imageSrc: homepageHi,
    imageAlt: 'Grapefruit flavour inspiration'
  },
  {
    name: 'Lime Wheels',
    note: 'Zesty and refreshing',
    price: 'R80',
    href: '#shop',
    imageSrc: homepageLi,
    imageAlt: 'Lime wheel flavour inspiration'
  }
];

const welcomeOfferLead = 'Enjoy';
const welcomeOfferHighlight = '10% off';
const welcomeOfferTail = 'your first purchase';

function Products() {
  const [searchQuery, setSearchQuery] = useState('');

  const welcomeOfferItems = Array.from({ length: 6 }, (_, index) => index);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return favouriteProducts;
    }

    return favouriteProducts.filter((product) => {
      const haystack = [product.name, product.note, product.price]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  useEffect(() => {
    const handleProductSearch = (event) => {
      const nextQuery = event.detail?.query ?? '';
      setSearchQuery(nextQuery);
    };

    window.addEventListener('vitra:product-search', handleProductSearch);
    return () => window.removeEventListener('vitra:product-search', handleProductSearch);
  }, []);

  return (
    <>
      <section
        className="favourite-products"
        id="shop"
        aria-labelledby="favourite-products-heading"
      >
        <div className="container">
          <div className="favourite-products-section">
            <div className="favourite-products-head reveal">
              <div className="favourite-products-title-block">

                <h2 id="favourite-products-heading">Our Crowd Pleasers</h2>
              </div>
              {normalizedQuery ? (
                <p className="product-search-note">
                  Showing results for "{searchQuery}"
                </p>
              ) : null}
            </div>
            <div className="favourite-products-grid reveal-stagger" role="list" aria-label="Favourite products">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <figure
                    key={product.name}
                    className={`favourite-product-item favourite-product-item-${index + 1}${product.videoSrc ? ' has-video' : ''}`}
                    role="listitem"
                  >
                    <div className="favourite-product-visual">
                      {/* Hover graphic decorations */}
                      <div className="hover-graphic hover-graphic-left" aria-hidden="true">
                        <ProductGraphicLeft index={index} />
                      </div>
                      <div className="hover-graphic hover-graphic-right" aria-hidden="true">
                        <ProductGraphicRight index={index} />
                      </div>
                      {product.videoSrc ? (
                        <video
                          className="favourite-product-video"
                          src={product.videoSrc}
                          muted
                          loop
                          autoPlay
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={product.imageSrc}
                          alt={product.imageAlt}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <figcaption>
                      <strong>{product.name}</strong>
                      {product.price ? <span className="favourite-product-price">{product.price}</span> : null}
                      <a href={product.href} className="btn favourite-buy-btn" aria-label={`Buy ${product.name} now`}>
                        Buy now
                      </a>
                    </figcaption>
                  </figure>
                ))
              ) : (
                <div className="product-search-empty">
                  <h3>No products match that search yet.</h3>
                  <p>Try another term like pear, orange, or hibiscus.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="welcome-strip" aria-label="Welcome offer">
        <div className="welcome-strip-viewport">
          <ul className="welcome-strip-track">
            {welcomeOfferItems.map((_, index) => (
              <li
                key={`welcome-offer-${index}`}
                className="welcome-strip-item"
              >
                {welcomeOfferLead}{' '}
                <span className="welcome-strip-highlight">{welcomeOfferHighlight}</span>{' '}
                {welcomeOfferTail}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="featured-products" id="products">
        <div className="container">
          <p className="featured-kicker featured-kicker-top reveal">Our Story</p>
          <div className="featured-products-content founder-layout">
            <div className="founder-text reveal-left">
              <h2>A Message from Our Founder</h2>
              <p className="featured-copy">
                Long before sustainability became a global conversation, I understood that preservation protects dignity and extending shelf life protects families and reducing waste protects resources.
              </p>
              <p className="featured-copy">
                Years later, that foundation became VitraFruits. What was once a sun-drying in rural homesteads has evolved into a modern agro-processing business but the principles remain the same:
              </p>
              <p className="featured-copy">
                VitraFruits is deeply personal to me because it reflects how I was raised. It reflects resilience, responsibility and the belief that food carries effort, labour, land, and rain. We honour all of that by ensuring it is not wasted.
              </p>
              <p className="featured-copy">
                Today, we transform fresh produce into premium dehydrated fruits, powders, crisps, and functional ingredients. But behind every product is a philosophy rooted in lived experience.
              </p>
              <p className="featured-copy">
                Reducing food waste is not a marketing message for VitraFruits. It is my story.
              </p>
              <div className="founder-signoff-block">
                <p className="founder-signoff">
                  Mary Mahuma
                  <span>FOUNDER</span>
                </p>
                <img
                  className="proudly-sa-logo"
                  src={proudlySALogo}
                  alt="Proudly South African member logo"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <figure className="about-owner-image reveal-right">
              <picture>
                <source srcSet={aboutUsAvif} type="image/avif" />
                <source srcSet={aboutUsWebp} type="image/webp" />
                <img
                  src={aboutUsJpg}
                  alt="VitraFruits owner with her dehydrated fruit products"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Hover Graphic SVG Components — Fruit Illustrations ── */

function ProductGraphicLeft({ index }) {
  const graphics = [
    // Product 1: Pear slices — pears and leaves
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="hover-svg-group">
        {/* Large pear */}
        <path d="M75 130c0 22-12 38-28 38S19 152 19 130c0-18 8-32 16-44 6-8 8-16 6-24 4 4 12 14 18 24 8 12 16 26 16 44z" fill="#C5D647" stroke="#8BA832" strokeWidth="1.5"/>
        <path d="M47 62c-2-10 2-20 10-24-1 8 1 16-2 24" fill="#5D8C1F" className="leaf-wiggle"/>
        <path d="M47 62c4-8 12-14 18-12-5 6-12 10-18 12" fill="#7CB342" className="leaf-wiggle"/>
        {/* Small pear */}
        <path d="M100 80c0 14-8 24-18 24s-18-10-18-24c0-12 5-20 10-28 4-5 5-10 4-16 3 3 8 9 12 16 5 8 10 16 10 28z" fill="#D4E157" stroke="#9E9D24" strokeWidth="1"/>
        <path d="M86 36c-1-7 1-13 7-16-1 5 0 10-1 16" fill="#558B2F" className="leaf-wiggle"/>
        {/* Orange slice accent */}
        <path d="M30 30a16 16 0 0132 0a16 16 0 01-32 0z" fill="#FF9800"/>
        <path d="M46 14v32M34 22l24 16M34 46l24-16" stroke="#E65100" strokeWidth="1.2" opacity="0.6"/>
        <circle cx="46" cy="30" r="5" fill="#FFB74D" opacity="0.5"/>
        {/* Sparkle stars */}
        <path className="sparkle-star" d="M105 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M15 110l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>,
    // Product 2: Orange wheel — orange slices and whole orange
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="hover-svg-group">
        {/* Large orange slice (half) */}
        <path d="M90 75a35 35 0 01-70 0z" fill="#FF9800" stroke="#E65100" strokeWidth="1.5"/>
        <path d="M55 75v35M38 82l34 20M38 102l34-20" stroke="#FFB74D" strokeWidth="2" opacity="0.7"/>
        <path d="M20 75h70" stroke="#E65100" strokeWidth="1.5"/>
        {/* Whole small orange */}
        <circle cx="90" cy="40" r="18" fill="#FF9800" stroke="#E65100" strokeWidth="1.2"/>
        <circle cx="90" cy="40" r="12" fill="#FFA726" opacity="0.6"/>
        <path d="M90 28v24M80 34l20 12M80 46l20-12" stroke="#E65100" strokeWidth="1" opacity="0.45"/>
        {/* Orange leaf */}
        <path d="M90 22c-3-8 2-16 8-18 0 7-2 14-8 18z" fill="#4CAF50" className="leaf-wiggle"/>
        {/* Small orange wedge */}
        <path d="M25 140a14 14 0 0028 0l-14-22z" fill="#FFB74D" stroke="#F57C00" strokeWidth="1"/>
        <path d="M39 140l-9-14M39 140l9-14M39 140v-22" stroke="#E65100" strokeWidth="0.8" opacity="0.5"/>
        {/* Juice drops */}
        <circle cx="18" cy="55" r="3" fill="#FFD54F" opacity="0.8"/>
        <circle cx="75" cy="130" r="2.5" fill="#FFCC02" opacity="0.7"/>
        {/* Sparkle stars */}
        <path className="sparkle-star" d="M15 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFF176"/>
        <path className="sparkle-star" d="M70 160l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FDD835"/>
      </g>
    </svg>,
    // Product 3: Grapefruit — grapefruit slices and wedges
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="hover-svg-group">
        {/* Large grapefruit half */}
        <circle cx="55" cy="65" r="30" fill="#FF6F61" stroke="#D84315" strokeWidth="1.5"/>
        <circle cx="55" cy="65" r="24" fill="#FF8A65" opacity="0.7"/>
        <path d="M55 41v48M37 49l36 32M37 81l36-32" stroke="#D84315" strokeWidth="1.3" opacity="0.5"/>
        <circle cx="55" cy="65" r="7" fill="#FFAB91" opacity="0.6"/>
        {/* Grapefruit rind highlight */}
        <circle cx="55" cy="65" r="30" fill="none" stroke="#FFF176" strokeWidth="2.5" opacity="0.35"/>
        {/* Small grapefruit wedge */}
        <path d="M20 140a16 16 0 0032 0l-16-26z" fill="#FF8A65" stroke="#E64A19" strokeWidth="1"/>
        <path d="M36 140l-10-16M36 140l10-16M36 140v-26" stroke="#D84315" strokeWidth="0.8" opacity="0.5"/>
        {/* Grapefruit leaf */}
        <path d="M55 35c-3-10 2-18 10-20-1 8-3 16-10 20z" fill="#4CAF50" className="leaf-wiggle"/>
        {/* Juice drops */}
        <circle cx="95" cy="50" r="3" fill="#FFAB91" opacity="0.8"/>
        <circle cx="85" cy="130" r="2.5" fill="#FF8A65" opacity="0.7"/>
        {/* Sparkle stars */}
        <path className="sparkle-star" d="M100 100l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M15 50l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>,
    // Product 4: Lime — lime slices, wedges, and zest
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="hover-svg-group">
        {/* Large lime half */}
        <circle cx="58" cy="70" r="30" fill="#7CB342" stroke="#33691E" strokeWidth="1.5"/>
        <circle cx="58" cy="70" r="24" fill="#9CCC65" opacity="0.7"/>
        <path d="M58 46v48M40 54l36 32M40 86l36-32" stroke="#33691E" strokeWidth="1.3" opacity="0.5"/>
        <circle cx="58" cy="70" r="7" fill="#C5E1A5" opacity="0.6"/>
        {/* Lime rind glow */}
        <circle cx="58" cy="70" r="30" fill="none" stroke="#E6EE9C" strokeWidth="2.5" opacity="0.35"/>
        {/* Whole small lime */}
        <circle cx="25" cy="130" r="16" fill="#8BC34A" stroke="#558B2F" strokeWidth="1.2"/>
        <circle cx="25" cy="130" r="10" fill="#9CCC65" opacity="0.6"/>
        {/* Lime leaf */}
        <path d="M58 40c-3-10 2-18 10-20-1 8-3 16-10 20z" fill="#2E7D32" className="leaf-wiggle"/>
        <path d="M25 114c-2-7 1-14 7-17 0 6-1 12-7 17z" fill="#4CAF50" className="leaf-wiggle"/>
        {/* Lime wedge */}
        <path d="M85 140a12 12 0 0024 0l-12-20z" fill="#AED581" stroke="#689F38" strokeWidth="1"/>
        <path d="M97 140l-7-12M97 140l7-12M97 140v-20" stroke="#558B2F" strokeWidth="0.8" opacity="0.5"/>
        {/* Juice drops */}
        <circle cx="100" cy="55" r="3" fill="#C5E1A5" opacity="0.8"/>
        <circle cx="15" cy="95" r="2.5" fill="#AED581" opacity="0.7"/>
        {/* Sparkle stars */}
        <path className="sparkle-star" d="M105 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M10 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>
  ];
  return graphics[index] || graphics[0];
}

function ProductGraphicRight({ index }) {
  const graphics = [
    // Product 1: Pear — mirrored fruit arrangement
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{transform: 'scaleX(-1)'}}>
      <g className="hover-svg-group">
        <path d="M75 130c0 22-12 38-28 38S19 152 19 130c0-18 8-32 16-44 6-8 8-16 6-24 4 4 12 14 18 24 8 12 16 26 16 44z" fill="#C5D647" stroke="#8BA832" strokeWidth="1.5"/>
        <path d="M47 62c-2-10 2-20 10-24-1 8 1 16-2 24" fill="#5D8C1F" className="leaf-wiggle"/>
        <path d="M47 62c4-8 12-14 18-12-5 6-12 10-18 12" fill="#7CB342" className="leaf-wiggle"/>
        <path d="M100 80c0 14-8 24-18 24s-18-10-18-24c0-12 5-20 10-28 4-5 5-10 4-16 3 3 8 9 12 16 5 8 10 16 10 28z" fill="#D4E157" stroke="#9E9D24" strokeWidth="1"/>
        <path d="M86 36c-1-7 1-13 7-16-1 5 0 10-1 16" fill="#558B2F" className="leaf-wiggle"/>
        <path d="M30 30a16 16 0 0132 0a16 16 0 01-32 0z" fill="#FF9800"/>
        <path d="M46 14v32M34 22l24 16M34 46l24-16" stroke="#E65100" strokeWidth="1.2" opacity="0.6"/>
        <circle cx="46" cy="30" r="5" fill="#FFB74D" opacity="0.5"/>
        <path className="sparkle-star" d="M105 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M15 110l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>,
    // Product 2: Orange — mirrored citrus
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{transform: 'scaleX(-1)'}}>
      <g className="hover-svg-group">
        <path d="M90 75a35 35 0 01-70 0z" fill="#FF9800" stroke="#E65100" strokeWidth="1.5"/>
        <path d="M55 75v35M38 82l34 20M38 102l34-20" stroke="#FFB74D" strokeWidth="2" opacity="0.7"/>
        <path d="M20 75h70" stroke="#E65100" strokeWidth="1.5"/>
        <circle cx="90" cy="40" r="18" fill="#FF9800" stroke="#E65100" strokeWidth="1.2"/>
        <circle cx="90" cy="40" r="12" fill="#FFA726" opacity="0.6"/>
        <path d="M90 28v24M80 34l20 12M80 46l20-12" stroke="#E65100" strokeWidth="1" opacity="0.45"/>
        <path d="M90 22c-3-8 2-16 8-18 0 7-2 14-8 18z" fill="#4CAF50" className="leaf-wiggle"/>
        <path d="M25 140a14 14 0 0028 0l-14-22z" fill="#FFB74D" stroke="#F57C00" strokeWidth="1"/>
        <path d="M39 140l-9-14M39 140l9-14M39 140v-22" stroke="#E65100" strokeWidth="0.8" opacity="0.5"/>
        <circle cx="18" cy="55" r="3" fill="#FFD54F" opacity="0.8"/>
        <circle cx="75" cy="130" r="2.5" fill="#FFCC02" opacity="0.7"/>
        <path className="sparkle-star" d="M15 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFF176"/>
        <path className="sparkle-star" d="M70 160l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FDD835"/>
      </g>
    </svg>,
    // Product 3: Grapefruit — mirrored grapefruit
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{transform: 'scaleX(-1)'}}>
      <g className="hover-svg-group">
        <circle cx="55" cy="65" r="30" fill="#FF6F61" stroke="#D84315" strokeWidth="1.5"/>
        <circle cx="55" cy="65" r="24" fill="#FF8A65" opacity="0.7"/>
        <path d="M55 41v48M37 49l36 32M37 81l36-32" stroke="#D84315" strokeWidth="1.3" opacity="0.5"/>
        <circle cx="55" cy="65" r="7" fill="#FFAB91" opacity="0.6"/>
        <circle cx="55" cy="65" r="30" fill="none" stroke="#FFF176" strokeWidth="2.5" opacity="0.35"/>
        <path d="M20 140a16 16 0 0032 0l-16-26z" fill="#FF8A65" stroke="#E64A19" strokeWidth="1"/>
        <path d="M36 140l-10-16M36 140l10-16M36 140v-26" stroke="#D84315" strokeWidth="0.8" opacity="0.5"/>
        <path d="M55 35c-3-10 2-18 10-20-1 8-3 16-10 20z" fill="#4CAF50" className="leaf-wiggle"/>
        <circle cx="95" cy="50" r="3" fill="#FFAB91" opacity="0.8"/>
        <circle cx="85" cy="130" r="2.5" fill="#FF8A65" opacity="0.7"/>
        <path className="sparkle-star" d="M100 100l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M15 50l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>,
    // Product 4: Lime — mirrored lime
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{transform: 'scaleX(-1)'}}>
      <g className="hover-svg-group">
        <circle cx="58" cy="70" r="30" fill="#7CB342" stroke="#33691E" strokeWidth="1.5"/>
        <circle cx="58" cy="70" r="24" fill="#9CCC65" opacity="0.7"/>
        <path d="M58 46v48M40 54l36 32M40 86l36-32" stroke="#33691E" strokeWidth="1.3" opacity="0.5"/>
        <circle cx="58" cy="70" r="7" fill="#C5E1A5" opacity="0.6"/>
        <circle cx="58" cy="70" r="30" fill="none" stroke="#E6EE9C" strokeWidth="2.5" opacity="0.35"/>
        <circle cx="25" cy="130" r="16" fill="#8BC34A" stroke="#558B2F" strokeWidth="1.2"/>
        <circle cx="25" cy="130" r="10" fill="#9CCC65" opacity="0.6"/>
        <path d="M58 40c-3-10 2-18 10-20-1 8-3 16-10 20z" fill="#2E7D32" className="leaf-wiggle"/>
        <path d="M25 114c-2-7 1-14 7-17 0 6-1 12-7 17z" fill="#4CAF50" className="leaf-wiggle"/>
        <path d="M85 140a12 12 0 0024 0l-12-20z" fill="#AED581" stroke="#689F38" strokeWidth="1"/>
        <path d="M97 140l-7-12M97 140l7-12M97 140v-20" stroke="#558B2F" strokeWidth="0.8" opacity="0.5"/>
        <circle cx="100" cy="55" r="3" fill="#C5E1A5" opacity="0.8"/>
        <circle cx="15" cy="95" r="2.5" fill="#AED581" opacity="0.7"/>
        <path className="sparkle-star" d="M105 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FDD835"/>
        <path className="sparkle-star" d="M10 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFEB3B"/>
      </g>
    </svg>
  ];
  return graphics[index] || graphics[0];
}

export default Products;
