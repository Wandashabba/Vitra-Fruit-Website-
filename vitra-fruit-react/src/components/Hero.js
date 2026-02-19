import React from 'react';

function Hero() {
  const heroTitle = 'Premium Dried Fruit and Bar Products';
  const heroTitleLines = [
    ['Premium', 'Dried', 'Fruit'],
    ['and', 'Bar', 'Products']
  ];

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="hero-kicker">Vitra Fruit Collection</p>
        <h1 className="hero-title" aria-label={heroTitle}>
          {heroTitleLines.map((line, lineIndex) => (
            <span
              key={`line-${lineIndex}`}
              className={`hero-line ${lineIndex === 1 ? 'hero-line-accent' : ''}`}
            >
              {line.map((word, wordIndex) => (
                <span
                  key={`${word}-${lineIndex}-${wordIndex}`}
                  className="hero-word"
                  style={{ '--word-index': lineIndex * 3 + wordIndex }}
                >
                  {word}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <a href="#shop" className="btn btn-hero">Shop Now</a>
      </div>
    </section>
  );
}

export default Hero;
