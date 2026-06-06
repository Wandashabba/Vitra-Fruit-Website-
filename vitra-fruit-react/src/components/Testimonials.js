import React from 'react';

const testimonials = [
  {
    quote:
      'The citrus slices are absolutely stunning in cocktails. I\'ve been ordering every month — they look and taste incredible.',
    name: 'Lerato M.',
    location: 'Johannesburg',
  },
  {
    quote:
      'Finally found a South African brand that takes dehydrated fruit seriously. The quality is unmatched and delivery was fast.',
    name: 'Ryan T.',
    location: 'Cape Town',
  },
  {
    quote:
      'I use the vegetable powders in my smoothies every day. No additives, just pure flavour. Will never go back to anything else.',
    name: 'Thandi N.',
    location: 'Durban',
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <p className="testimonials-eyebrow">WHAT OUR CUSTOMERS SAY</p>
        <h2 className="testimonials-heading">Loved by South Africans</h2>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <article key={i} className="testimonial-card">
              <p className="testimonial-stars" aria-label="5 out of 5 stars">
                ★★★★★
              </p>
              <blockquote className="testimonial-quote">"{t.quote}"</blockquote>
              <footer className="testimonial-author">
                <span className="testimonial-name">{t.name}</span>
                <span className="testimonial-location">{t.location}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
