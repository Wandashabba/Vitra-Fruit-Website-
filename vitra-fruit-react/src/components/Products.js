import React from 'react';
import aboutUsJpg from '../assets/images/about-us.jpg';
import aboutUsWebp from '../assets/images/about-us.webp';
import aboutUsAvif from '../assets/images/about-us.avif';

const favouriteProducts = [
  {
    name: 'Pear slices',
    note: 'Sweet and mellow',
    price: 'R60-R360',
    href: '#shop',
    imageSrc: '/images/pear.png',
    imageAlt: 'Fresh pear flavour inspiration'
  },
  {
    name: 'Pineapple slices',
    note: 'Bright tropical lift',
    price: 'R80-R480',
    href: '#shop',
    imageSrc: '/images/Pineapple 1.png',
    imageAlt: 'Pineapple flavour inspiration'
  },
  {
    name: 'Hibiscus Flower',
    note: 'Floral and vibrant',
    price: 'R60',
    href: '#shop',
    imageSrc: '/images/Hibiscus.png',
    imageAlt: 'Hibiscus flavour inspiration'
  }
];

const welcomeOfferLead = 'Welcome to our store, first time purchasers get';
const welcomeOfferHighlight = '10% off first purchase';
const welcomeOfferTail = 'on our products.';

function Products() {

  const welcomeOfferItems = Array.from({ length: 6 }, (_, index) => index);
  const welcomeOfferMarquee = [...welcomeOfferItems, ...welcomeOfferItems];

  return (
    <>
      <section className="favourite-products" id="shop" aria-labelledby="favourite-products-heading">
        <div className="container">
          <div className="favourite-products-section">
            <div className="favourite-products-head">
              <div className="favourite-products-title-block">
                <p className="featured-kicker">Handpicked Flavours</p>
                <h2 id="favourite-products-heading">Our Crowd Pleasers</h2>
              </div>
            </div>
            <div className="favourite-products-grid" role="list" aria-label="Favourite products">
              {favouriteProducts.map((product, index) => (
                <figure key={product.name} className={`favourite-product-item favourite-product-item-${index + 1}`} role="listitem">
                  <div className="favourite-product-visual">
                    <img
                      src={product.imageSrc}
                      alt={product.imageAlt}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption>
                    <strong>{product.name}</strong>
                    {product.price ? <span className="favourite-product-price">{product.price}</span> : null}
                    <a href={product.href} className="btn favourite-buy-btn" aria-label={`Buy ${product.name} now`}>
                      Buy now
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="welcome-strip" aria-label="Welcome offer">
        <div className="welcome-strip-viewport">
          <ul className="welcome-strip-track">
            {welcomeOfferMarquee.map((_, index) => {
              const isDecorativeDuplicate = index >= welcomeOfferItems.length;
              return (
                <li
                  key={`welcome-offer-${index}`}
                  className="welcome-strip-item"
                  aria-hidden={isDecorativeDuplicate ? 'true' : undefined}
                >
                  {welcomeOfferLead}{' '}
                  <span className="welcome-strip-highlight">{welcomeOfferHighlight}</span>{' '}
                  {welcomeOfferTail}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="featured-products" id="products">
        <div className="container">
          <p className="featured-kicker featured-kicker-top">Our Story</p>
          <div className="featured-products-content founder-layout">
            <div className="founder-text">
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
              <p className="founder-signoff">
                Mary Manchadi Mahuma
                <span>FOUNDER</span>
              </p>
            </div>
            <figure className="about-owner-image">
              <picture>
                <source srcSet={aboutUsAvif} type="image/avif" />
                <source srcSet={aboutUsWebp} type="image/webp" />
                <img
                  src={aboutUsJpg}
                  alt="Vitra Fruit owner with her dehydrated fruit products"
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

export default Products;
