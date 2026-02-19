import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! We will contact you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section className="contact" id="contact">
      <div className="container">
        <h2>Contact Us</h2>
        <div className="contact-content">
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Your Name" value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <input type="email" placeholder="Your Email" value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="tel" placeholder="Phone Number" value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <textarea placeholder="Your Message" rows="5" value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})} required></textarea>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <p>📧 Email: info@vitrafruit.com</p>
            <p>📞 Phone: +27 123 456 789</p>
            <p>📍 Location: South Africa</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
