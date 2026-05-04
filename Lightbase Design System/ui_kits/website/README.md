# Lightbase Website UI Kit

Recreates the public marketing site at [lightbase.ca](https://www.lightbase.ca).

## What's here
- `index.html` — full clickable prototype: hero → collections → sectors → CTA → footer, with a Connect modal and product-detail drill-in.
- `Components.jsx` — modular React components (Nav, Hero, WhoAreWe, CollectionsGrid, Sectors, CTA, Footer, ConnectModal, ProductDetail). Imported inline in `index.html` to avoid Babel cross-file scope issues.
- `styles.css` — kit-specific layout + component styles. Imports `../../colors_and_type.css` for tokens.

## Click-through
1. Land on **Home**: full-bleed hero, "Design Meets Engineering"
2. Click any **product card** → drills into product detail page with photo + spec CTA
3. Click **← Back** → returns to home
4. Click any **Let's Connect** button → opens contact modal with underline-only form
5. Submit or × → closes modal

## Components covered
- `Nav` — sticky, blur-veil, transparent over hero
- `Hero` — full-bleed image + protection gradient + display headline
- `WhoAreWe` — light section with eyebrow + h2 + lede
- `CollectionsGrid` — 3-col photo cards with hover image-zoom
- `Sectors` — 4-col square photo cards
- `CTA` — full-bleed image banner with bottom-veil
- `Footer` — black, 4-col links, logo + address
- `ConnectModal` — center-stage form with underline inputs
- `ProductDetail` — drill-in screen with back button + cta row

## Coverage caveats
- Site has Technologies / Services / About sub-pages we did not recreate — content was thin in the source.
- Carousel marquee on the live site (collections) is replaced with a static 3×4 grid, which preserves the visual vocabulary while being more navigable in a kit.
