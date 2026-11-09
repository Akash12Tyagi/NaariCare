// Shared WebGL post FX + page chrome for the product pages.
import * as THREE from 'three';

// Cursor "liquid lens": the image ripples and splits RGB around the pointer,
// proportional to how fast it moves (a lightweight take on fluid-cursor sites).
export const CursorFxShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: 0 }, uAspect: { value: 1 }, uGrain: { value: 0.035 }, uVignette: { value: 0.6 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uVel, uAspect, uGrain, uVignette; uniform vec2 uMouse; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 d = (uv - uMouse) * vec2(uAspect, 1.0);
      float r = length(d);
      float lens = exp(-r * r * 22.0) * uVel;
      vec2 dir = r > 1e-4 ? d / r : vec2(0.0);
      float wave = sin(r * 60.0 - uTime * 10.0) * 0.5 + 0.5;
      vec2 off = dir / vec2(uAspect, 1.0) * lens * (0.02 + wave * 0.012);
      vec3 col;
      col.r = texture2D(tDiffuse, uv - off * 1.6).r;
      col.g = texture2D(tDiffuse, uv - off).g;
      col.b = texture2D(tDiffuse, uv - off * 0.4).b;
      vec2 c = vUv - 0.5;
      col *= 1.0 - smoothstep(0.25, 0.85, dot(c, c) * 2.0) * uVignette;
      col += (hash(vUv * 900.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function trackPointer() {
  const st = { x: 0.5, y: 0.5, px: 0, py: 0, vel: 0, nx: 0, ny: 0 };
  let lx = 0, ly = 0, lt = performance.now();
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dt = Math.max(now - lt, 8);
    const v = Math.hypot(e.clientX - lx, e.clientY - ly) / dt;
    st.vel = Math.min(1, Math.max(st.vel, v * 0.35));
    lx = e.clientX; ly = e.clientY; lt = now;
    st.px = e.clientX; st.py = e.clientY;
    st.x = e.clientX / innerWidth; st.y = 1 - e.clientY / innerHeight;
    st.nx = st.x * 2 - 1; st.ny = st.y * 2 - 1;
  }, { passive: true });
  st.decay = (dt) => { st.vel *= Math.exp(-dt * 3.2); };
  return st;
}

/* ---------------- page chrome shared by products.html and product.html ---------------- */
export function initChrome({ reduced }) {
  const { gsap, ScrollTrigger, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // cart count from the shop
  try { const cart = JSON.parse(localStorage.getItem('onf-cart') || '[]'); const n = cart.reduce((a, c) => a + c.qty, 0); const el = $('#cartCount'); if (el) el.textContent = n; } catch { /* ignore */ }

  // cursor
  if (finePointer && $('.cursor')) {
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...p };
    addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      r.x += (p.x - r.x) * 0.18; r.y += (p.y - r.y) * 0.18;
      dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
      ring.style.transform = `translate(${r.x}px, ${r.y}px)`;
    });
    document.addEventListener('pointerover', (e) => { if (e.target.closest('a, button, [data-magnetic]')) cur.classList.add('is-hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest('a, button, [data-magnetic]')) cur.classList.remove('is-hover'); });
    document.addEventListener('cursor:label', (e) => { label.textContent = e.detail || ''; cur.classList.toggle('is-label', !!e.detail); });
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * 0.28, y: (e.clientY - b.top - b.height / 2) * 0.35, duration: 0.6, ease: 'power3.out' }); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
    });
  }

  // HUD pointer coordinates (Heron-style)
  const hx = $('#hx'), hy = $('#hy');
  if (hx) addEventListener('pointermove', (e) => { hx.textContent = String(Math.round(e.clientX)).padStart(4, '0'); hy.textContent = String(Math.round(e.clientY)).padStart(4, '0'); }, { passive: true });

  // smooth scroll
  let lenis = null;
  if (!reduced && document.body.dataset.scroll !== 'virtual') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // circular page transition
  const wipe = $('#wipe');
  function leaveTo(href, x = innerWidth / 2, y = innerHeight / 2) {
    if (!wipe || reduced) { location.href = href; return; }
    wipe.style.setProperty('--wx', x + 'px'); wipe.style.setProperty('--wy', y + 'px');
    wipe.classList.remove('out'); wipe.classList.add('in');
    setTimeout(() => { location.href = href; }, 780);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-transition]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    leaveTo(a.getAttribute('href'), e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
  });
  function reveal() { if (wipe) { wipe.classList.remove('in'); wipe.classList.add('out'); } }
  addEventListener('pageshow', (e) => { if (e.persisted && wipe) { wipe.classList.remove('in'); wipe.classList.add('out'); } });

  // boot log (Heron-style numbered initialisation lines)
  function boot(lines, progressFn, done) {
    const log = $('#bootLog'), pct = $('#bootPct'), el = $('#boot');
    if (!el) { done(); return; }
    lines.forEach((l, i) => { const li = document.createElement('li'); li.innerHTML = `<span>${String(i + 1).padStart(3, '0')}</span>${l}`; log.appendChild(li); });
    const items = [...log.children];
    let shown = 0, start = performance.now();
    (function loop() {
      const real = progressFn();
      const minT = Math.min(1, (performance.now() - start) / (reduced ? 200 : 1800));
      const p = Math.min(real, minT);
      shown += (p - shown) * 0.12;
      if (p >= 1 && shown > 0.995) shown = 1;
      pct.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      items.forEach((li, i) => li.classList.toggle('on', shown >= (i + 1) / (items.length + 1)));
      if (shown >= 1) { el.classList.add('done'); document.body.classList.remove('is-loading'); setTimeout(done, 300); return; }
      requestAnimationFrame(loop);
    })();
  }

  return { lenis, leaveTo, reveal, boot, finePointer };
}
