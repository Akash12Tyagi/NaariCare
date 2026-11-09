# Onfinity — 3D website prototype

An interactive, WebGL-first concept for **Onfinity Technologies** (onfinitytechnologies.com), positioning the brand as a premium Indian TV maker while keeping its display-solutions business visible.

## Run it

Use the bundled Node server (zero dependencies, Node ≥ 18). It serves the site, the AR files with the correct content types, and the API:

```bash
cd onfinity-3d
npm start
```

Then open http://localhost:8080. The terminal also prints your network address (for example `http://192.168.1.20:8080`). The desktop QR code uses that address, so a phone on the same Wi-Fi can open products in AR.

Any static server still works for the 3D site (`python3 -m http.server`), but iPhone Quick Look needs the server's `.usdz` content type and the analytics/leads APIs need the Node server.

**For WebXR on Android and the live-camera preview on phones, the page must be served over HTTPS.** Either deploy it, or run with a certificate:

```bash
HTTPS_KEY=key.pem HTTPS_CERT=cert.pem npm start
```

iPhone Quick Look and Android Scene Viewer also work over plain HTTP on your local network.

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

### Product pages (`products.html`, `product.html?p=…`)

**The Onfinity Orbit (`products.html`)** is the product index, presented as a circular 3D carousel rather than a horizontal one. The five product lines sit as curved screens showing Onfinity's original photos, on a ring around a glowing ∞ core with orbital rings and tick marks.
- **Navigation:** scroll, drag or the arrow keys spin the ring. Releasing snaps to the nearest product. A list on the right jumps straight to any product, and `products.html#kiosk` deep-links to one.
- **Camera:** each product has its own camera pose (low, high, side, overhead, below). Between products the camera swings through an arc, rising, pulling back and rolling.
- **Cards:** they bend harder and split RGB with scroll speed, straighten and colour up when focused, and zoom on hover.
- **HUD and transitions:** a Heron-style HUD shows live X/Y cursor coordinates, the orbit angle and velocity, plus a numbered boot log. A cursor "liquid lens" post effect (inspired by Emotion) adds ripple and RGB split. Clicking the focused card flies the camera in and wipes to its page with a circular transition.

**Product page template (`product.html?p=camera|led|kiosk|visualizer|display`)** gives each product a procedural, animated 3D model on a branded studio set:
- **PTZ camera:** graphite body with the glossy Ōnfinity band and an iridescent lens. The head pans and tilts, the zoom element moves, a field-of-view frustum appears, and an auto-tracking reticle follows a walking figure.
- **LED wall:** 30 modular cabinets that separate to show modularity. A pixel-pitch shader shows individual RGB LEDs up close. Silhouettes give scale.
- **Kiosk:** black-and-silver standee showing Onfinity's poster. A touch ripple animates on the screen, the content wipes to a generated wayfinding map, Wi-Fi waves show remote updates, and the OPS slot lights up on the back.
- **Visualizer:** the folding arm unfolds, a document slides onto the backlit stage, the side lamps hinge open, and a floating LIVE feed appears with a data beam.
- **Menu-board displays:** a slatted wood wall with pendant lamps and six screens using the original photo's menus. One rotates from portrait to landscape, the board flips content in a stagger wave, and one detaches to show its slim profile.

Page behaviour:
- **Five scroll stations.** The camera travels between them on spherical arcs, with lift and roll mid-flight. Each station pins a Heron-style callout to a 3D hotspot on the model, with a dashed leader line and a numbered card.
- **Rest of the page:** the original photo with a scroll clip-reveal and a hover loupe; specs, models and use cases from onfinitytechnologies.com; a catalogue link; and a "Next product" link with a circular wipe.

Global details: Lenis smooth scroll, GSAP ScrollTrigger, custom magnetic cursor, film grain, split-text reveals, a hide-on-scroll header, a full-screen menu, keyboard support and `prefers-reduced-motion` handling.

## AR: "View in your space"

Visitors can place any product in their own room at its **real size**:
- **Showroom:** click a screen, and the product card has a "View on your wall" or "View on your floor" button.
- **Shop configurator:** "View on your wall · AR", using the selected size.
- **Each 3D product page:** in the hero and next to the specs.

| Device | What happens |
|---|---|
| **iPhone / iPad (Safari)** | AR Quick Look opens with the baked `.usdz`. Wall products anchor to vertical planes, floor products to horizontal ones. |
| **Android (Chrome + ARCore)** | Google **Scene Viewer** (native ARCore) first, with wall or floor placement. In-page WebXR is the fallback (needs HTTPS). |
| **Phone without AR** | Live camera preview: the model is drawn over the rear camera feed (drag to turn, pinch to zoom). |
| **Desktop** | Interactive 3D preview plus a **QR code** that opens `ar.html?m=<model>` on a phone. |

- **Fixed scale:** `ar-scale="fixed"`, so people can't shrink a 98″ TV to make it fit.
- **Measurements:** the 3D preview labels width and height on the model.
- **Sizes:** TVs and interactive panels have size chips (32–98″), each its own true-size model.
- **Wall or table:** TVs have an "On the wall" / "On a table / floor" switch. The table version is the same TV on its blade feet (`tv-55-stand` and so on), because floor and table detection is far more reliable than wall detection.
- **Camera preview on every phone:** a guaranteed way to see the product on camera, even when AR can't find a surface.
- **During an AR session:** the 3D-preview size tags are hidden and a compact HUD shows the name, true size and coaching. After 9 s without placement it explains how to find a wall, or to switch to "On a table".
- **Built on Google's `<model-viewer>`:** vendored in `vendor/model-viewer.min.js` and loaded only when the viewer first opens.

### AR model pipeline

`js/ar-models.js` defines the AR catalogue with real-world dimensions. It reuses the procedural product models and converts them to export-safe materials (Standard PBR, front-sided, no shaders, lights or helpers). `npm run export:ar` bakes them in headless Chromium:

```bash
npm i -D playwright && npx playwright install chromium   # once
npm run export:ar                                        # all models
npm run export:ar -- tv-55 kiosk                         # just some
```

Output goes to `assets/ar/`: `<id>.glb` (Android/WebXR), `<id>.usdz` (iOS) and `manifest.json` with sizes in metres. Textures are JPEG, so a TV is about 260 KB as GLB and 450 KB as USDZ. `vendor/three/addons/exporters/USDZExporter.js` carries a one-line patch to write JPEG instead of PNG.

| Model | Placement | Real size (W × H × D) |
|---|---|---|
| Smart 4K TV 32–98″ | wall | 0.72 × 0.42 m … 2.18 × 1.25 m |
| Smart 4K TV on stand 32–98″ | floor / table | 0.73 × 0.51 m … 2.19 × 1.34 m |
| Interactive flat panel 75″ / 86″ | wall | 1.70 × 0.98 m / 1.95 × 1.12 m |
| Commercial / info display 55″ | wall | 1.24 × 0.71 m |
| LED video wall | wall | 3.40 × 1.09 m |
| Signage kiosk 43″ | floor | 0.71 × 1.89 m |
| PTZ conference camera | floor / table | 17 × 19 cm |
| Digital visualizer | floor / table | 42 × 26 cm |

## Backend (`server/server.mjs`)

Zero dependencies, using Node's built-in `http`/`https` modules.

- **Static hosting:** AR content types (`model/gltf-binary`, `model/vnd.usdz+zip`), ETag/304, cache headers, and partial-download support (Quick Look and Scene Viewer fetch in ranges). It blocks path traversal and hides `server/`, dotfiles and `node_modules`.
- **API:**
  - `GET /api/health`
  - `GET /api/ar/manifest`: the AR catalogue.
  - `GET /api/network`: local network URLs, so desktop QR codes work on phones.
  - `POST /api/events`: AR analytics (`view_3d`, `ar_launch`, `ar_placed`, `ar_failed`, `ar_unsupported`, `qr_shown`, `camera_preview`, `size_change`). Validated, rate-limited, IPs hashed, append-only file in `server/data/` (git-ignored).
  - `GET /api/events/summary`: counts per event and model, plus the AR placement rate.
  - `GET /api/events/recent?limit=50`: latest events with device (iOS/Android/Desktop) and AR mode, for debugging a real-phone test.
  - `POST /api/leads`: the book-a-demo form posts here (validated, rate-limited, stored as NDJSON).
- **Tests:** `npm run test:api` (node:test, 10 tests).

### AR troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Size shows but no product on camera | In-page WebXR drew the HTML labels, but the model was unlit (light estimation) or still waiting for a wall | Fixed: Scene Viewer / Quick Look first, light estimation off, lighter frame with aluminium trim, labels hidden in AR. |
| Product never appears on the wall | ARCore / ARKit can't detect plain, untextured walls | Aim at a wall with a switchboard, frame or edge, 1–2 m away. Or choose **On a table / floor**. |
| Android opens nothing | Scene Viewer needs the Google app with AR support, and must be able to download the `.glb` from the page URL | Use a deployed URL or your LAN IP (not `localhost`). Otherwise use the camera preview. |
| iPhone shows a blank page or a download | `.usdz` served with the wrong content type | Serve with `npm start` (sends `model/vnd.usdz+zip`). |
| Unsure what happened on a test phone | — | Open `/api/events/recent`: it lists device, model, AR mode and failures. |

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
products.html          product orbit (3D circular index)
product.html           product page template (?p=camera|led|kiosk|visualizer|display)
css/products.css       orbit + product page styles
js/orbit.js            orbit scene, virtual scroll, camera poses
js/product-page.js     studio scene, station camera arcs, hotspot callouts, loupe
js/models.js           procedural animated product models
js/product-data.js     product copy, specs, models (from the client site)
js/fx.js               cursor liquid-lens post FX, boot log, circular wipe, shared chrome
ar.html                standalone AR page (QR target)
js/ar-viewer.js        AR viewer: model-viewer, sizes, QR hand-off, camera fallback, analytics
js/ar-models.js        AR catalogue + export-safe real-scale model builders
tools/                 AR export pipeline (ar-export.html + export-ar.mjs)
assets/ar/             baked GLB + USDZ + manifest.json
server/                Node server, API and tests
package.json           npm start / export:ar / test:api
assets/products        Onfinity's original product photos + screen-content crops
vendor/                three.js r170, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18 (vendored, no CDN)
assets/img, assets/clients
```

## Next steps for production

1. Swap placeholder prices and confirm specs per model with Onfinity.
2. Connect the cart to Shopify / WooCommerce and Razorpay, and forward `/api/leads` to their CRM (it currently stores NDJSON).
3. Optional: a real GLB model of an Onfinity TV in place of the procedural one, plus product video on the showroom screens.
4. Add product detail pages for the TV series and IFPDs in the same template, plus SEO and analytics.
