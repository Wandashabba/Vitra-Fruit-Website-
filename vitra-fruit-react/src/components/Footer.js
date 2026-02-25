import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-col">
            <h4>Customer Service</h4>
            <ul>
              <li><a href="/account.html">My account</a></li>
              <li><a href="/contact.html">Contact Us</a></li>
              <li><a href="/shipping.html">Shipping Costs</a></li>
              <li><a href="/terms.html">Terms and Conditions</a></li>
            </ul>
            <a
              className="footer-social-link"
              href="https://www.instagram.com/vitrafruits?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D"
              target="_blank"
              rel="noreferrer"
              aria-label="Vitra Fruit Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm9.75 2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              </svg>
              <span>@vitrafruits</span>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} Vitra Fruit. All Rights Reserved. Developed by Wanda Shabangu</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
