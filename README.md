# Vitra Fruit Website

Premium Dried Fruits & Beverages E-commerce Website (React)

## Features

- Responsive design (mobile, tablet, desktop)
- Product catalog with categories
- Shopping cart functionality
- Contact form
- Smooth scrolling navigation
- Interactive product tabs
- Modern UI with purple/teal color scheme
- Optimized images (AVIF, WebP, fallbacks)
- Accessibility compliant

## Structure

```
Vitra-Fruit-Website-/
├── vitra-fruit-react/
│   ├── public/
│   │   ├── images/          # Product images
│   │   ├── index.html       # HTML template
│   │   └── *.html           # Additional pages
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── data/            # Site content data
│   │   ├── assets/          # Static assets
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Global styles
│   │   └── index.js         # Entry point
│   └── package.json
└── README.md
```

## Setup

1. Navigate to the React app:
   ```bash
   cd vitra-fruit-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Customization

### Adding Products

Edit the product data in `src/components/Products.js`:

```javascript
const favouriteProducts = [
  {
    name: 'Product Name',
    note: 'Description',
    price: 'R60-R360',
    href: '#shop',
    imageSrc: '/images/product.png',
    imageAlt: 'Product description'
  }
];
```

### Changing Colors

Edit CSS variables in `src/App.css`:

```css
:root {
  --primary-color: #5533ff;
  --secondary-color: #17a2b8;
  --nav-accent: #f6b25f;
}
```

### Navigation Links

Update navigation in `src/data/siteContent.js`:

```javascript
export const navLinks = {
  left: [
    { label: 'Home', href: '#home' },
    { label: 'Shop Now', href: '#shop' }
  ],
  right: [
    { label: 'Contact', href: '/contact.html' },
    { label: 'Cart', href: '/account.html' }
  ]
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Vitra Fruit. All Rights Reserved.
