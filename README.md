# Vitra Fruit Website

Premium Dried Fruits & Beverages E-commerce Website

## Features

- Responsive design (mobile, tablet, desktop)
- Product catalog with categories
- Shopping cart functionality
- Contact form
- Smooth scrolling navigation
- Interactive product tabs
- Modern UI with purple/teal color scheme

## Structure

```
Vitra-Fruit-Website-/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Stylesheet
├── js/
│   └── script.js       # JavaScript functionality
├── images/             # Product images folder
└── README.md           # This file
```

## Setup

1. Open `index.html` in a web browser
2. Add your product images to the `images/` folder
3. Customize products in `js/script.js`
4. Update contact information in `index.html`

## Customization

### Adding Products

Edit the `products` array in `js/script.js`:

```javascript
{
    id: 7,
    name: 'Your Product Name',
    price: 99.00,
    category: 'dried-fruits', // or 'beverages' or 'gift-boxes'
    image: 'images/your-image.jpg'
}
```

### Changing Colors

Edit CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #5533ff;
    --secondary-color: #17a2b8;
    --dark-color: #2c3e50;
}
```

### Contact Information

Update the contact section in `index.html` with your:
- Email address
- Phone number
- Physical address

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Vitra Fruit. All Rights Reserved.
