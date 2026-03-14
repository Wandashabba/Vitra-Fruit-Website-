import React from 'react';

const heroTitle = 'All natural dehydrated fruits.';
const heroSubtitle = 'Crafted for cocktails, baking, snacking & indulging.';
const heroTitleWords = ['All', 'natural', 'dehydrated', 'fruits.'];

function Hero() {

  const handleShopClick = (event) => {
    event.preventDefault();
    const shopSection = document.querySelector('#shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.location.hash = '#shop';
  };

  return (
    <section className="hero" id="home">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/images/HeroVideoCompressed1.mp4" type="video/mp4" />
      </video>
      <div className="hero-content">
        <p className="hero-kicker">Vitra Fruit Collection</p>
        <div className="hero-layout-side">
          <div className="hero-copy-left">
            <h1 className="hero-title" aria-label={heroTitle}>
              <span className="hero-line">
                {heroTitleWords.map((word, wordIndex) => (
                  <span
                    key={`${word}-${wordIndex}`}
                    className="hero-word"
                    style={{ '--word-index': wordIndex }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>
          </div>
          <div className="hero-copy-right">
            <h2 className="hero-subtitle">{heroSubtitle}</h2>
            <div className="hero-actions">
              <a href="#shop" className="btn btn-hero" onClick={handleShopClick}>Shop Now</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
