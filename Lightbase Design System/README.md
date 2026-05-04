# Lightbase Design System

> *Design Meets Engineering* — Lightbase is a Montreal-based architectural lighting company designing eco-friendly, premium lighting solutions for hospitality, healthcare, education, retail, agriculture, residential and industrial spaces.

This is the brand and design system for Lightbase, modeled from their site at [lightbase.ca](https://www.lightbase.ca). It contains type and color tokens, brand assets, content guidelines, and a UI kit recreating the marketing site.

## Sources used
- **Website:** https://www.lightbase.ca (Framer-hosted) — homepage, collections, sectors, technologies, services, about, let's-connect.
- **Asset CDN:** `framerusercontent.com` — photography, logos, and product renders downloaded into `assets/`.
- **No codebase or Figma file were provided.** Visual foundations were inferred from the live site. Where exact values weren't reachable, sensible matches were used and flagged in CAVEATS.

---

## Index

| File | Purpose |
|------|---------|
| `README.md` | This file — brand context, content + visual foundations, iconography |
| `colors_and_type.css` | CSS variables for color, type, spacing, radii, shadow, motion |
| `SKILL.md` | Agent skill manifest — drop-in for Claude Code |
| `assets/` | Logos, product photography, sector imagery, SVG marks |
| `fonts/` | Web font files (or fallbacks) |
| `preview/` | Design-system preview cards (registered to the Design System tab) |
| `ui_kits/website/` | UI kit recreating the marketing site (hero, collections grid, sectors, footer) |

---

## Company / Product Context

Lightbase makes premium, architectural and horticultural LED lighting fixtures. Their core proposition is **design + engineering** — fixtures that are visually refined *and* technically rigorous. They speak to architects, designers, project leads, and procurement teams across multiple verticals.

**11 product collections**, all named with the `Light-` prefix:

| Collection  | One-liner |
|-------------|-----------|
| Lightbar    | State-of-the-art horticulture lighting |
| Lightcell   | Power-packed lighting in every cell |
| Lightcove   | Seamless molding integration for cove lighting |
| Lightdeco   | Bespoke lighting designed for your vision |
| Lightengine | Suspended shades lighting, crafted for your vision |
| Lightline   | A perfect line of light |
| Lightloom   | Elegant cylindrical lighting that elevates any space |
| Lightpro    | Game-ready lighting for athletic excellence |
| Lightrail   | One rail, limitless lighting possibilities |
| Lightring   | Capture attention with every glowing circle |
| Skylight    | Redefining daylight with sleek skylights |

**7 sectors served:** Education · Healthcare · Hospitality · Indoor Agriculture · Industrial · Public Areas · Residential · Retail.

Site IA: Home · Collections · Sectors · Technologies · Services · About · Let's Connect.

---

## CONTENT FUNDAMENTALS

**Voice:** Confident, understated, design-led. Speaks like a high-end architectural product brand — not a startup, not a hardware vendor.

**Casing:** Eyebrow / kicker labels are **ALL CAPS** with letterspacing (e.g. `WHO ARE WE`). Headlines are sentence-case or Title Case for taglines (e.g. *Design Meets Engineering*, *Innovative Lighting Solutions*, *Premium Collections*). Buttons are sentence-case with no terminal punctuation (e.g. *Let's Connect*, *See all collections*).

**Pronouns:** First-person plural — **we / our / us**. The brand presents as a team (*"We pride ourselves…"*, *"Collaborate with us…"*). The reader is rarely "you" directly except in calls-to-action.

**Tone:** Calm, declarative, slightly aspirational. Sentences are short and assertive. No hedging, no jargon, no hype-words ("revolutionary", "game-changing"). Avoid exclamation marks.

**Sentence shape:** Two-beat headline + one-line subhead pattern, repeated through the page.
- Headline: 2–5 words. Often a complete idea (*Design Meets Engineering*) or a noun phrase (*Premium Collections*, *Innovative Lighting Solutions*).
- Subhead: one full sentence, ~12–25 words, finishing the thought.

**Product naming:** Single-word, lowercase-friendly compound (`Lightbar`, `Lightcell`, `Lightcove`). Always written as one closed word, capital L only.

**Tagline pattern for products:** A short, evocative phrase, no period. Examples:
- *A perfect line of light.*
- *One rail, limitless lighting possibilities.*
- *Capture attention with every glowing circle.*

**Emoji:** Never. The brand does not use emoji anywhere — site, product, marketing.

**Vibe:** Architectural, premium, quietly Canadian. Imagine a high-end European lighting catalogue translated into plainspoken English. *Bespoke* and *seamless* and *elevates* appear; *cool* and *amazing* do not.

---

## VISUAL FOUNDATIONS

**Overall mood:** **Dark, photographic, minimal.** The site leans on full-bleed product photography (often shot in dim or warm-lit interiors) over solid black backgrounds. White type sits over dark photography. The "light" in the brand comes from the products themselves — a glowing ring, a warm cove, a horticulture bar — never from gradient backgrounds or decorative shapes.

**Color palette:**
- **Black** (`#000000`) — primary background. Used full-bleed.
- **Off-white** (`#F5F5F4` / `#FAFAF8`) — secondary surface, alternating sections.
- **Pure white** (`#FFFFFF`) — primary text on dark, logo, dividers.
- **Warm amber glow** (`oklch(0.78 0.13 70)` ≈ `#E8A33D`) — accent, drawn from the color of incandescent / warm-LED light. Used sparingly: hover states, focus rings, subtle highlights. Not a button fill on the live site, but available as a brand accent.
- **Neutral grays** — type hierarchy and dividers (`#1A1A1A`, `#2A2A2A`, `#9A9A9A`, `#D4D4D2`).

There is **no purple, no teal, no gradient-blue**. The palette is monochrome + one warm accent.

**Type:**
- **Display + body:** A clean modern geometric sans (the live site uses a Framer-hosted system font stack reading as **Inter / system-ui** with custom tracking). We use **Inter** (Google Fonts) as the primary face, with weights 400 / 500 / 600 / 700.
- **Eyebrows / kickers:** Same family, uppercase, `letter-spacing: 0.18em`, weight 500.
- **Headlines:** Weight 600–700, tight tracking (`-0.02em` to `-0.03em`), large sizes (clamp 40–96px on hero).
- **Body:** Weight 400, line-height 1.55, max-width ~62ch.
- **Numerals & UI labels:** Tabular where appropriate.

**Spacing scale (8px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192. Sections breathe — typical vertical rhythm between blocks is 96–128px on desktop.

**Backgrounds:**
- **Full-bleed photographic hero** with a video loop (the homepage hero is a video of architectural lighting installations).
- **Solid black sections** for product grids and CTAs.
- **Off-white sections** for content blocks and the "About" passage — used for breathing room between dark sections.
- **No gradients, no patterns, no textures.** The only "texture" is the photography itself.

**Animation / motion:**
- **Slow, weight-y fades and rises.** ~400–600ms, easing roughly `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint).
- **Image-zooms on hover** — product cards scale their image gently (`scale(1.04)`, 600ms).
- **No bounces, no springs, no parallax.** No JS-driven scroll choreography beyond fade-in-on-enter.
- **Cursor-following marquee carousels** for the "Premium Collections" row — slow, continuous translation.

**Hover states:**
- Links and buttons: opacity drop (`0.7`) or color shift to white-on-black inverse.
- Cards: image scales gently, headline color brightens to pure white if it was muted.
- Pill buttons (`Let's Connect`): background fills white, text inverts to black.

**Press / active states:** Subtle scale-down (`scale(0.98)`), 80ms.

**Borders:** Hairline 1px, white at 12–20% alpha on dark sections, black at 8–12% on light sections. No double borders, no inset rules.

**Shadows:** Almost none. The site is shadow-flat — depth comes from photography, not elevation. Where used (hover, modals), shadows are large, soft, low-opacity (`0 24px 60px rgba(0,0,0,0.18)`).

**Protection gradients vs capsules:** Hero text over photography uses a **subtle bottom-up protection gradient** (black 0% → black 60% over the lower 40% of the image) rather than capsules / chips behind the text.

**Layout rules:**
- Fixed top nav, transparent over hero, gains a black background after the user scrolls past the hero.
- Footer is full-width on solid black.
- 12-column grid implied at desktop; content max-width ~1440px.
- Generous gutters (32–64px).

**Transparency / blur:** Used **only** for the sticky nav (when over light sections it picks up a `backdrop-filter: blur(20px) saturate(140%)` with a translucent black/white veil, depending on what's underneath).

**Imagery vibe:** **Warm-neutral, photographic, often dim.** Product shots favor warm tungsten / amber light and architectural negative space. Sector photography is contextual (a school, a hospital corridor, a greenhouse). No black-and-white. Some grain in the lower-light shots. Color treatment is naturalistic, not heavily graded.

**Corner radii:**
- **Cards / images:** small radius (8–12px) or fully square. The site mostly uses **square corners** for product imagery.
- **Pill buttons:** fully rounded (`border-radius: 999px`).
- **No medium radii.** Either crisp / square, or pill.

**Cards:** Photo + headline + one-line tagline, stacked. No card chrome — no border, no shadow, no rounded outer container. The image *is* the card. Tap target is the whole tile.

**Footer:** Black background, multi-column link list, large logo mark, address + phone + email block, copyright line.

---

## ICONOGRAPHY

Lightbase's site uses **almost no decorative iconography**. It is a typographic + photographic brand.

What is used:
- **A single white wordmark** (`assets/logo-light.png`) sized at ~186×35px in the nav and footer.
- **Two thin chevron arrows** (`assets/arrow-1.svg`, `assets/arrow-2.svg`) used as carousel prev/next controls — 40×40px, 2px stroke, white, rounded line caps, drawn as `<` and `>` glyph paths. This is the entire icon system on the site.
- **No emoji. No unicode-character icons. No icon font.** Sector and product cards use photography, never icons.

For internal tooling and any UI surface that needs more icons (settings, forms, dashboards), we substitute **Lucide** (CDN: `https://unpkg.com/lucide@latest`) — its hairline 2px stroke and rounded line caps match the in-site arrow style closely. **This is a substitution and is flagged here** — Lightbase has no documented icon library of its own.

Rules when icons must appear:
- Stroke-only, never filled.
- 1.5–2px stroke weight.
- Rounded caps + joins.
- Always white on dark, always near-black (`#1A1A1A`) on light.
- No two-tone icons. No gradient icons.

---

## CAVEATS / FLAGS

- **No codebase or Figma access.** All tokens were inferred from the live Framer site.
- **Fonts substituted:** Lightbase's live site uses a custom-loaded Framer font stack. We use **Inter** (Google Fonts) as the closest open-source match. If you have the original `.woff2` files, drop them in `fonts/` and update `colors_and_type.css`.
- **Icon set substituted:** Lightbase has no in-house icon library. Lucide is used for any UI icon need.
- **The Framer logo PNG is white-on-transparent**, which makes it invisible against light card backgrounds. We render it inside black wrappers. A dark-ink version is missing — flag for the user.
