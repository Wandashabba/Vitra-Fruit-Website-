import React from 'react';
import aboutUsJpg from '../assets/images/about-us.jpg';
import aboutUsWebp from '../assets/images/about-us.webp';
import aboutUsAvif from '../assets/images/about-us.avif';

function Products() {
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
      name: 'Pipeapple slices',
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

  return (
    <>
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
      <section className="favourite-products" aria-labelledby="favourite-products-heading">
        <div className="container">
          <div className="favourite-products-section">
            <p className="featured-kicker">Handpicked Flavours</p>
            <h2 id="favourite-products-heading">Our Favourite Products</h2>
            <p className="favourite-products-intro">
              Three flavour notes our customers keep coming back to for character, freshness and everyday versatility.
            </p>
            <div className="favourite-products-grid" role="list" aria-label="Favourite products">
              {favouriteProducts.map((product) => (
                <figure key={product.name} className="favourite-product-item" role="listitem">
                  <img
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>
                    <strong>{product.name}</strong>
                    <span>{product.note}</span>
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
    </>
  );
}

export default Products;
