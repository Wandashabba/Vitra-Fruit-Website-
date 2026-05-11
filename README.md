# Vitra Fruit Website

Premium Dehydrated Fruits & Beverages E-commerce platform built with React and deployed on Vercel.
---

## Overview

Vitra Fruit is a modern e-commerce web platform focused on showcasing and selling premium dehydrated fruits and beverages through a responsive and accessible shopping experience.

The application is built using React and deployed on Vercel with a GitHub-based workflow. The repository is structured with maintainability, scalability, and deployment automation in mind, following modern DevOps and frontend engineering practices.
---

## Architecture

```text
User
  ↓
Custom Domain (GoDaddy DNS)
  ↓
Vercel Edge Network
  ↓
React Frontend + Serverless API Functions
  ↓
GitHub Repository
  ↓
GitHub Actions CI Pipeline
```
---

## Features

- Responsive design (mobile, tablet, desktop)
- Product catalog with category grouping
- Shopping cart functionality
- Contact and customer engagement forms
- Smooth scrolling navigation
- Interactive product tabs
- Modern UI with purple/teal color scheme
- Optimized images (AVIF, WebP, fallbacks)
- Accessibility compliant
- Serverless API endpoints
- Vercel deployment integration

---
## Repository Structure

```text
Vitra-Fruit-Website-/
├── apps/
│   ├── web/                 
│   │   ├── api/             # Serverless API functions
│   │   ├── public/      
│   │   └── src/
│   │   │   ├── components/      # React components
│   │   │   ├── data/            # Site content data
│   │   │   ├── assets/          # Static assets
│   │   │   ├── App.js           # Main app component
│   │   │   ├── App.css          # Global styles
│   │   │   └── index.js         # Entry point
│   │   ├── .env.example
│   │   └── package.json
├── .github/
│   └── workflows/
└── README.md
```
---
## Local Development

### Clone the repository

```bash
git clone https://github.com/wandashabba/Vitra-Fruit-Website.git
cd Vitra-Fruit-Website/vitra-fruit-react
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Update environment values as required.

### Start the developement server

```bash
npm start
```

## Production Build

Generate an optimized production build:

```bash
npm run build
```
---

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
## CI/CD

GitHub Actions is used for continuous integration and deployment validation.

Pipeline responsibilities include:

- Dependency installation
- Build validation
- Linting
- Deployment verification

Workflow definitions are located in:

```text
.github/workflows/
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Vitra Fruit. All Rights Reserved.
