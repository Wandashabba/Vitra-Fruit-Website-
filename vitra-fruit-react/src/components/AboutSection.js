import React from 'react';

function AboutSection() {
  return (
    <section className="about-section-home" id="about">
      <div className="container">
        <div className="about-layout">
          <div className="about-text">
            <h2>About Us</h2>
            <p className="featured-copy">
              Vitra Fruit is a proudly South African, black female-owned business founded in Cape Town, with roots from Pretoria. We produce premium dehydrated fruits, powders, crisps and functional ingredients that preserve flavour, quality and value.
            </p>
            <p className="featured-copy">
              Our purpose is simple: reduce food waste through sustainable preservation while delivering versatile products for homes, food service and wellness-focused brands.
            </p>
          </div>
          <figure className="about-owner-image">
            <img
              src="/images/about-us-image-1200.jpeg"
              srcSet="/images/about-us-image-800.jpeg 800w, /images/about-us-image-1200.jpeg 1200w"
              sizes="(max-width: 900px) 90vw, 520px"
              alt="Vitra Fruit founder with premium dehydrated products"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
