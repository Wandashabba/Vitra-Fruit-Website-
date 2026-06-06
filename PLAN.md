# Vitra Fruit — Project Roadmap

> Living document tracking completed work and planned improvements for [vitrafruits.co.za](https://vitrafruits.co.za).

---

## Completed Work

### Security
- Removed live PayFast credentials from `.env.example`
- Restricted CORS from wildcard (`*`) to allowed domains on all API endpoints
- Added server-side price validation in `create-order.js`
- Fixed PayFast ITN handler to reject on network verification failure
- Fixed `deliveryMethod` hardcoded bug in `cart.js`
- Fixed mobile nav bag icon linking to `#shop` instead of `cart.html`
- Added `sitemap.xml` and `robots.txt`
- Removed `.env` from git tracking, updated `.gitignore`

### Analytics & Marketing
- Added GA4 (`G-KTXB4XS3P0`) to all pages
- Added WhatsApp floating button (`0679414223`) to all pages
- Added Instagram CTA strip on homepage
- Wired Mailchimp newsletter subscription to `/api/subscribe` on 6 category pages

### New Pages
- `returns.html` — Returns & Refund Policy (SA CPA compliant)
- `faq.html` — FAQ with accessible accordion

### E-commerce Improvements
- Added 3-step checkout progress indicator (Cart → Details → Payment)
- Added "← Back to cart" link on checkout page
- Added Product JSON-LD schema to all 22 product detail pages (enables Google rich results)

### SEO
- `sitemap.xml` covering all 30+ product and category pages
- `robots.txt` blocking cart, checkout, and account pages from indexing
- Product schema markup on all product pages

### AI Chatbot
- `/api/chat.js` — Claude-powered product assistant (Anthropic API)
- Chatbot React widget — floating button, streaming responses, WhatsApp escalation

---

## Roadmap

### High Priority

1. **Customer Accounts**
   Register/login system using Supabase Auth or Firebase. Required for order history, loyalty program, and subscriptions.
   _Blocks items 2, 3, 4, 11, 12, and 13._

2. **Order Tracking Page**
   Customer-facing page where shoppers enter their email + order ID to see status. The `/api/update-order-status.js` backend already exists — only a frontend lookup page is needed.

3. **account.html**
   Currently a dead-end placeholder linked from every footer. Needs to become a real account portal (once accounts are built) or a temporary redirect to `contact.html` in the interim.

4. **Real Customer Testimonials**
   Testimonials section was built and removed pending real quotes. Once customer quotes are collected, rebuild the section on the React homepage.

5. **Rotate Exposed Credentials**
   The SMTP password and PayFast merchant key were previously exposed in git history. Must be rotated in their respective dashboards (Hostinger / PayFast) and updated in Vercel environment variables.

---

### Medium Priority

6. **Product Reviews**
   Integrate Judge.me (free tier) or build a simple review submission form backed by a Google Sheet. Display star ratings on product pages.

7. **Bundle / Gift Set Builder**
   "Build Your Box" page with curated bundle tiers (3-product, 5-product). Static bundle options work — no configurator needed. Would increase average order value.

8. **Promo / Coupon Code System**
   Add a coupon code input to the cart and checkout pages. Wire to a backend validation endpoint. Enables influencer codes and seasonal campaigns.

9. **React Error Boundaries**
   There are currently zero error boundaries in the React app. A runtime error in any component causes a blank white screen. Wrap `Hero`, `Products`, `Contact`, and `AboutSection` in error boundaries.

10. **Search Improvements**
    Current search only matches category pages. Extend it to return individual product pages with price and image in results.

---

### Low Priority / Long Term

11. **Loyalty / Rewards Program**
    Requires customer accounts. Consider Smile.io integration once accounts are in place.

12. **Subscribe & Save**
    Recurring billing via PayFast Subscriptions API. Requires customer accounts and a database.

13. **Referral Program**
    "Give R50, get R50" referral flow. Consider ReferralHero or a simple discount-code-based approach.

14. **Full Instagram Feed Embed**
    Replace the current CTA strip with a live Instagram grid widget (SnapWidget or Elfsight) showing real posts.

15. **Wishlist / Save for Later**
    Save products to a wishlist. A basic version can use `localStorage` with no account required; full persistence needs customer accounts.

16. **Email Sequence Automation**
    Welcome email series, abandoned cart emails, and post-purchase follow-up. Requires Klaviyo (more powerful than Mailchimp for e-commerce) or Mailchimp automations to be configured.

17. **www to non-www Redirect**
    `vitrafruits.co.za` and `www.vitrafruits.co.za` are used interchangeably. Add a canonical redirect in `vercel.json`.

---

## Notes

| Key | Value |
|-----|-------|
| Active branch | `tumo` (not yet merged to `main`) |
| WhatsApp | 0679414223 (Vitra business number) |
| GA4 Measurement ID | `G-KTXB4XS3P0` |
| Mailchimp Audience ID | `1366eeb52e` (API key in Vercel env vars — not in repo) |
| PayFast | Sandbox mode off; production credentials in Vercel env vars |
| Vercel project | `vitra-fruit-website-vyda.vercel.app` |
| Chatbot | `ANTHROPIC_API_KEY` must be added to Vercel env vars for the chatbot to work |
