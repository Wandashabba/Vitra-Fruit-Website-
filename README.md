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

## Vercel Deployment

Deploy the `vitra-fruit-react` folder itself as the Vercel project root. This app includes static pages in `public/` and serverless functions in `vitra-fruit-react/api/`, so both need to live in the same Vercel project.

1. In Vercel, create a new project and set the Root Directory to `vitra-fruit-react`.
2. Leave the build command as `npm run build`.
3. Leave the output directory as `build`.
4. Add the environment variables from `vitra-fruit-react/.env.example` in the Vercel project settings.
5. Deploy, then verify the backend is live by opening `/api/health` on the deployed domain.

Expected backend checks after deploy:

- `https://<your-vercel-domain>/api/health`
- `https://<your-vercel-domain>/api/create-order` should return `405 Method not allowed` in the browser for a GET request, which is correct because it only accepts `POST`.

If you later connect a custom domain, point that custom domain to this same Vercel project so the frontend and `/api/*` routes stay on the same host.

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
