import React from 'react';

const galleryImages = [1, 2, 3, 4, 5].map((imageNumber) => ({
  src: `/images/picture${imageNumber}.webp`,
  alt: `Vitra Fruit gallery image ${imageNumber}`
}));

function Contact() {

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-gallery reveal-scale" aria-label="Contact gallery">
          {galleryImages.map((image) => (
            <figure key={image.src} className="contact-gallery-item">
              <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
            </figure>
          ))}
          <a href="/contact.html" className="btn btn-contact-page">Contact Us</a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
