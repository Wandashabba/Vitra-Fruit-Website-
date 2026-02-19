import React from 'react';
import { aboutParagraphs } from '../data/siteContent';

function AboutSection() {
  return (
    <div className="wrapper" id="page-wrapper">
      <div className="container" id="content" tabIndex="-1">
        <div className="row">
          <div className="col-md content-area" id="primary">
            <main className="site-main" id="main">
              <article className="page">
                <header className="entry-header">
                  <h1 className="entry-title">Vitra Fruit</h1>
                </header>
                <div className="entry-content">
                  {aboutParagraphs.map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                  <div className="wp-block-image">
                    <figure className="aligncenter size-large">
                      <img
                        src="https://housebrandsa.co.za/wp-content/uploads/2025/12/32x30L-Black-Mountain-Karoo-Flora-Pink–-bringing-spirits-already-batched-up-and-blended-125L-28x30L-Hardlemon-–-bringing-neutral-–-50L-AA-30x30L-Black-Mountain-Karoo-Dry-Indian-Tonic–-need-g-1024x410.png"
                        alt="Vitra Fruit products"
                      />
                    </figure>
                  </div>
                </div>
              </article>
            </main>
          </div>
        </div>
      </div>

      <div className="wrapper" id="contact-shop-wrapper">
        <a href="#contact" className="btn btn-lg btn-secondary mt-4">
          Contact Us
        </a>
      </div>
    </div>
  );
}

export default AboutSection;
