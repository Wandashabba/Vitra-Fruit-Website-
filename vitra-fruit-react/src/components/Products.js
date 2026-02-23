import React from 'react';
import aboutUsJpg from '../assets/images/about-us.jpg';
import aboutUsWebp from '../assets/images/about-us.webp';
import aboutUsAvif from '../assets/images/about-us.avif';

function Products() {
  return (
    <section className="featured-products" id="products">
      <div className="container">
        <p className="featured-kicker featured-kicker-top">Our Story</p>
        <div className="featured-products-content about-layout">
          <div className="about-text">
            <h2>About Us</h2>
            <p className="featured-copy">
              Vitra Fruit is a proudly South African, black female-owned business founded in Cape Town, with roots from Pretoria.
              Inspired by the idea of preserving the natural goodness of citrus fruits beyond their seasons, we specialise in
              producing high-quality dried fruits that are both healthy and versatile.
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
  );
}

export default Products;
