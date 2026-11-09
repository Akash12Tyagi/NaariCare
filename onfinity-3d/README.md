# Onfinity — 3D website prototype

An interactive, WebGL-first concept for **Onfinity Technologies** (onfinitytechnologies.com), positioning the brand as a premium Indian TV maker while keeping its display-solutions business visible.

## Run it

It's a static site with no build step. Serve the folder over HTTP, because ES modules don't load from `file://`:

```bash
cd onfinity-3d
python3 -m http.server 8080
```

Then open http://localhost:8080. Use a desktop Chrome, Edge or Safari with hardware acceleration for the full experience.

## The experience

| # | Section | What happens |
|---|---------|--------------|
| 0 | **Power gate** | Preloader built around the Onfinity power-icon logo, with rotating "warming up the panel…" lines. Press power and a CRT-style line flash switches the TV on, with a synthesised hum (toggle in header). |
| 1 | **Hero** | A procedurally modelled, bezel-less Onfinity TV on blade feet. Its screen is a live shader: a brand-coloured aurora with a glowing ∞ (the "Onfinity" infinity). Mouse tilts the set, and the screen light spills onto a showroom floor. |
| 2 | **Design** | Scroll turns the TV side-on to show the slim profile and the port cluster. Specs: 178°, 20 W, ports. |
| 3 | **Every room** | The TV grows through 32 → 98″ as you scroll, next to a 1.75 m person for scale, with the ideal viewing distance. |
| 4–6 | **4K / QLED / OLED** | The screen wipes between modes: a 4K zoom down to RGB sub-pixels, QLED quantum-dot shimmer, and an OLED true-black nebula. Floor light changes colour with each. |
| 7 | **Smart** | An animated Android-style home launcher on the TV. |
| 8 | **Infinite showroom** | Inspired by midnightvideo.cuchillo.rocks: an endless corridor of Onfinity screens (IFPDs, LED walls, kiosks, VC, command centres…) showing the client's real photography. Scroll or drag to walk, click a screen for details. Bloom plus a CRT pass (scanlines, aberration, noise, barrel). |
| 9 | **Shop** | Series tabs, size chips, specs, animated price and EMI, add to cart with a cart drawer (kept in localStorage). |
| 9b | **See it in your room (3D)** | A true-to-scale 3D living room: the selected TV, sized from its real 16:9 diagonal, is wall-mounted on a walnut-slat feature wall above a media console, with a sofa at the visitor's chosen viewing distance (slider, 1.5–4.5 m), a rug, a coffee table, a plant, a floor lamp and a 1.75 m person for scale. The screen lights the room (area light plus wall glow). Day/Night toggle, Room / From the sofa / Side camera views, drag to orbit. Live readout of W×H, field of view and fit (SMPTE 30° / THX 40° guidance), plus a recommended size for your distance with a one-tap "Try 75″". |
| 10 | **Solutions** | Pinned horizontal gallery: Education, Enterprise, Healthcare, Govt & Smart City, Retail, BFSI, Defence. |
| 11 | **Built for Bharat** | Ethos (Right product · Reasonable price · Reliable service), counters, Make in India. |
| 12 | **Clients, contact, footer** | Velocity-reactive logo marquee, experience centres, book-a-demo form, giant wordmark. |

Global details: Lenis smooth scroll, GSAP ScrollTrigger, custom magnetic cursor, film grain, split-text reveals, a hide-on-scroll header, a full-screen menu, keyboard support and `prefers-reduced-motion` handling.

## Brand system (from the current site)

- **Colours:** logo green `#105F42`, site green `#034238`, lime `#B8D433`, sun-yellow `#FFCB05` / `#FFC008`, cream `#F3DFBE`, ink `#231F20`.
- **Type:** Inter (UI and headlines) and Cormorant Garamond italic (editorial accents), the same pair the live site loads.
- **Motif:** the power-button logo and the infinity curve.

## Content and assets

- All copy, product lines, model numbers, features, offices, phone numbers and client logos come from onfinitytechnologies.com. Photography is the client's own, downloaded from their site.
- `render-qled.jpg` and `render-oled.jpg` are renders of this prototype's own 3D TV. The live site's QLED photo shows a recognisable actor from a streaming series, so it isn't used.
- **Prices are placeholders.** They're labelled in the UI and must be replaced with real pricing. Model numbers are shown only where the live site lists them.

## Structure

```
index.html
css/style.css          design tokens + all styles
js/main.js             loader, scroll, cursor, configurator, cart, modal, sections
js/tv-scene.js         hero TV model, screen shaders, scroll choreography
js/corridor-scene.js   infinite showroom
js/room-scene.js       true-scale 3D living-room preview
js/data.js             products, showroom items, solutions, copy
vendor/                three.js r170, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18 (vendored, no CDN)
assets/img, assets/clients
```

## Next steps for production

1. Swap placeholder prices and confirm specs per model with Onfinity.
2. Connect the cart to Shopify / WooCommerce and Razorpay, and the demo form to their CRM.
3. Optional: a real GLB model of an Onfinity TV in place of the procedural one, plus product video on the showroom screens.
4. Build product detail pages for each series, plus SEO and analytics.
