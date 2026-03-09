import React from 'react';

function Contact() {
  const galleryImages = [1, 2, 3, 4, 5].map((imageNumber) => ({
    src: `/images/picture${imageNumber}.jpeg`,
    alt: `Vitra Fruit gallery image ${imageNumber}`
  }));

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-gallery" aria-label="Contact gallery">
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
