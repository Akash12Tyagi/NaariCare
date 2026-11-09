import * as THREE from 'three';
import { SERIES, SHOWROOM, SOLUTIONS, CLIENTS, LOADER_LINES, inr } from './data.js';
import { createTVStory } from './tv-scene.js';
import { createCorridor } from './corridor-scene.js';
import { createRoomPreview, tvDims } from './room-scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ================================================================ sound */
const sound = (() => {
  let ctx = null;
  let on = store.get('onf-sound', true);
  const btn = $('#soundToggle');
  btn.setAttribute('aria-pressed', String(on));
  btn.addEventListener('click', () => { on = !on; store.set('onf-sound', on); btn.setAttribute('aria-pressed', String(on)); if (on) tick(); });
  const ensure = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } } return ctx; };
  function tone(freq, dur, type = 'sine', gain = 0.05, slideTo) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function tick() { tone(1800, 0.04, 'triangle', 0.015); }
  function powerOn() {
    tone(1200, 0.08, 'square', 0.02);
    setTimeout(() => tone(55, 1.6, 'sine', 0.09, 110), 60);
    setTimeout(() => tone(7800, 0.9, 'sine', 0.006), 120);
  }
  return { tick, powerOn, ensure };
})();

/* ============================================================== loader */
const loaderEl = $('#loader');
const ring = $('.ld-ring');
const countEl = $('#ldCount');
const textEl = $('#ldText');
const powerBtn = $('#powerBtn');
let lineIdx = 0;
const lineTimer = setInterval(() => {
  lineIdx = (lineIdx + 1) % LOADER_LINES.length;
  textEl.textContent = LOADER_LINES[lineIdx];
}, 900);

const prog = { shown: 0, real: 0, minDone: false };
setTimeout(() => { prog.minDone = true; }, reduced ? 200 : 2200);
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, loaded, total) => { prog.real = loaded / total; };
let assetsDone = false;
manager.onLoad = () => { assetsDone = true; prog.real = 1; };
// failsafe: never trap the visitor behind the loader
setTimeout(() => { assetsDone = true; prog.real = 1; }, 12000);

function loaderTick() {
  const target = prog.minDone ? prog.real : Math.min(prog.real, 0.9);
  prog.shown += (target - prog.shown) * 0.08;
  if (assetsDone && prog.minDone && prog.shown > 0.995) prog.shown = 1;
  ring.style.strokeDashoffset = String(289 * (1 - prog.shown));
  countEl.textContent = String(Math.round(prog.shown * 100)).padStart(3, '0');
  if (prog.shown >= 1) return ready();
  requestAnimationFrame(loaderTick);
}

function ready() {
  clearInterval(lineTimer);
  textEl.textContent = 'READY WHEN YOU ARE';
  loaderEl.classList.add('ready');
  powerBtn.disabled = false;
  powerBtn.focus({ preventScroll: true });
}

/* ============================================================== smooth scroll */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else document.querySelector(target)?.scrollIntoView();
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href.length < 2 && href !== '#') return;
  e.preventDefault();
  if (href === '#') return;
  closeMenu();
  if (a.hasAttribute('data-close-nav')) closeModal();
  scrollToTarget(href === '#top' ? 0 : href);
});

/* ============================================================== scenes */
const tvStory = createTVStory({ canvas: $('#stage'), manager, reduced });
const hudIdx = $('#hudIdx'), hudTitle = $('#hudTitle');
$('#hudTotal').textContent = String(SHOWROOM.length).padStart(2, '0');
createCorridor({
  canvas: $('#corridor'), section: $('#showroom'), items: SHOWROOM, manager, reduced,
  onSelect: (i) => openModal(i),
  onFocus: (i) => {
    hudIdx.textContent = String(i + 1).padStart(2, '0');
    gsap.fromTo(hudTitle, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', onStart: () => { hudTitle.textContent = SHOWROOM[i].title; } });
  },
});

requestAnimationFrame(loaderTick);

/* ============================================================== power on */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.style.display = 'inline-block';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
  });
  return $$('.ch', el);
}
const heroChars = $$('.hero-title .split').flatMap(splitChars);
gsap.set(heroChars, { yPercent: 115 });
gsap.set('.chapter-hero .reveal-up', { y: 24, opacity: 0 });

let started = false;
function start() {
  if (started || powerBtn.disabled) return;
  started = true;
  sound.ensure();
  sound.powerOn();
  const crt = $('#poweron'), line = $('#poweron i');
  const tl = gsap.timeline();
  tl.set(crt, { visibility: 'visible' })
    .to('.ld-power', { scale: 0.85, duration: 0.15, ease: 'power2.in' })
    .to(line, { scaleX: 1, duration: reduced ? 0.01 : 0.35, ease: 'expo.out' })
    .add(() => { loaderEl.classList.add('done'); document.body.classList.remove('is-loading'); })
    .to(line, { scaleY: 400, opacity: 0, duration: reduced ? 0.01 : 0.6, ease: 'power3.in' })
    .add(() => {
      tvStory.powerOn();
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    }, '-=0.3')
    .to(heroChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.025 }, '-=0.1')
    .to('.chapter-hero .reveal-up', { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=1')
    .set(crt, { visibility: 'hidden' });
}
powerBtn.addEventListener('click', start);
addEventListener('keydown', (e) => { if (!started && (e.key === 'Enter' || e.key === ' ') && !powerBtn.disabled) { e.preventDefault(); start(); } });

/* ============================================================== cursor */
if (finePointer) {
  const cur = $('.cursor'), dot = $('.cursor-dot'), ringEl = $('.cursor-ring'), label = $('.cursor-label');
  const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
  addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    r.x += (p.x - r.x) * 0.18; r.y += (p.y - r.y) * 0.18;
    dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
    ringEl.style.transform = `translate(${r.x}px, ${r.y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest('a, button, [data-magnetic], input, select, .sol-card')) { cur.classList.add('is-hover'); }
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('a, button, [data-magnetic], input, select, .sol-card')) cur.classList.remove('is-hover');
  });
  document.addEventListener('cursor:label', (e) => {
    label.textContent = e.detail || '';
    cur.classList.toggle('is-label', !!e.detail);
  });

  // magnetic elements
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * 0.28, y: (e.clientY - b.top - b.height / 2) * 0.35, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
    el.addEventListener('pointerenter', () => sound.tick());
  });
}

/* ============================================================== header + menu */
const header = $('#header');
let lastY = 0;
const onScroll = (y) => {
  header.classList.toggle('is-solid', y > 80);
  header.classList.toggle('is-hidden', y > 300 && y > lastY && !menuOpen);
  lastY = y;
};
if (lenis) lenis.on('scroll', (l) => onScroll(l.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

const menu = $('#menu'), menuBtn = $('#menuOpen');
let menuOpen = false;
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); menuBtn.setAttribute('aria-expanded', 'false');
  lenis?.start();
}
menuBtn.addEventListener('click', () => {
  if (menuOpen) return closeMenu();
  menuOpen = true;
  menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false'); menuBtn.setAttribute('aria-expanded', 'true');
  lenis?.stop();
  gsap.fromTo('.menu-link', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.9, ease: 'expo.out', delay: 0.25 });
});

$$('.nav a').forEach((a) => {
  const id = a.getAttribute('href');
  ScrollTrigger.create({ trigger: id, start: 'top center', end: 'bottom center', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
});

/* ============================================================== reveals */
$$('.reveal-lines').forEach((el) => {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="rl"><span>${p}</span></span>`).join('');
  gsap.from($$('.rl > span', el), {
    yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});
$$('.reveal-up').forEach((el) => {
  if (el.closest('.chapter-hero')) return;
  gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('.chapter .panel').forEach((el) => {
  gsap.from(el.children, {
    y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' },
  });
});


/* ============================================================== 3D room */
const room = createRoomPreview({
  canvas: $('#roomCanvas'), manager, reduced,
  screens: { hummingbird: 'assets/img/screen-hummingbird.jpg', flower: 'assets/img/screen-flower.jpg' },
});
const distRange = $('#distRange');
let roomDist = +distRange.value;
const fovOf = (inch, d) => (2 * Math.atan(tvDims(inch).w / 2 / d) * 180) / Math.PI;
function recommendFor(d, sizes) {
  // ~33 deg horizontal field of view: between SMPTE (30) and THX (40) cinema guidance
  const ideal = (2 * d * Math.tan((33 / 2) * Math.PI / 180)) / 0.8716 / 0.0254;
  return sizes.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a));
}
function updateRoomReadout() {
  const sz = cfg.size, d = roomDist;
  const { w, h } = tvDims(sz);
  const fov = fovOf(sz, d);
  $('#rdSize').textContent = sz + '″';
  $('#rdDims').textContent = `${w.toFixed(2)}×${h.toFixed(2)} m`;
  $('#rdFov').textContent = Math.round(fov) + '°';
  const fit = $('#rdFit');
  fit.className = 'fit' + (fov < 24 ? ' small' : fov > 42 ? ' big' : '');
  fit.querySelector('em').textContent = fov < 24 ? 'Feels small from this distance' : fov > 42 ? 'Very immersive — consider sitting further back' : 'Perfect fit — cinema-like immersion';
  $('#distVal').textContent = d.toFixed(1) + ' m';
  distRange.style.setProperty('--p', ((d - 1.5) / 3) * 100 + '%');
  const rec = recommendFor(d, cfg.series.sizes);
  const btn = $('#recoBtn');
  if (rec === sz) {
    $('#recoText').textContent = `At ${d.toFixed(1)} m, the ${sz}″ is the best fit in this series.`;
    btn.hidden = true;
  } else {
    $('#recoText').textContent = `At ${d.toFixed(1)} m, we'd suggest the ${rec}″ ${cfg.series.tab}.`;
    btn.hidden = false;
    btn.querySelector('span').textContent = `Try ${rec}″`;
    btn.dataset.size = rec;
  }
}
distRange.addEventListener('input', () => { roomDist = +distRange.value; room.setDistance(roomDist); updateRoomReadout(); });
$('#recoBtn').addEventListener('click', (e) => { cfg.size = +e.currentTarget.dataset.size; updateSize(); sound.tick(); });
$$('.seg [data-view]').forEach((b) => b.addEventListener('click', () => {
  $$('.seg [data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  room.setView(b.dataset.view);
  $('#roomHint').textContent = b.dataset.view === 'sofa' ? 'Your view from the sofa' : 'Drag to look around';
  sound.tick();
}));
$('#roomNight').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.querySelector('span').textContent = on ? 'Day' : 'Night';
  room.setNight(on);
  sound.tick();
});
if (!finePointer) $('#roomHint').textContent = 'Switch views above';

/* ============================================================== configurator */
const tabs = $('#seriesTabs'), chips = $('#sizeChips');
const cfg = { series: SERIES[1], size: 55 };
SERIES.forEach((s) => {
  const b = document.createElement('button');
  b.type = 'button'; b.role = 'tab'; b.textContent = s.tab; b.dataset.id = s.id;
  b.addEventListener('click', () => { selectSeries(s); sound.tick(); });
  tabs.appendChild(b);
});

function selectSeries(s) {
  cfg.series = s;
  if (!s.sizes.includes(cfg.size)) cfg.size = s.sizes.reduce((a, b) => (Math.abs(b - 55) < Math.abs(a - 55) ? b : a));
  $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === s.id)));
  const img = $('#cfgImage');
  if (!img.src.endsWith(s.image)) {
    img.classList.add('swap');
    setTimeout(() => { img.src = s.image; img.alt = s.name; img.onload = () => img.classList.remove('swap'); }, 300);
  }
  room.setScreen(s.screen);
  $('#cfgName').textContent = s.name;
  $('#cfgDesc').textContent = s.desc;
  chips.innerHTML = '';
  s.sizes.forEach((sz) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'radio'; b.textContent = sz + '″'; b.dataset.size = sz;
    b.addEventListener('click', () => { cfg.size = sz; updateSize(); sound.tick(); });
    chips.appendChild(b);
  });
  updateSize();
}
function updateSize() {
  const s = cfg.series, sz = cfg.size;
  $$('button', chips).forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.size === sz)));
  $('#cfgModel').textContent = s.models[sz] ? `Model ${s.models[sz]}` : `${s.tab} · ${sz}-inch`;
  $('#cfgSpecs').innerHTML = s.specs(sz).map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
  const price = s.prices[sz];
  const pe = $('#cfgPrice');
  const from = { v: +(pe.dataset.v || 0) };
  gsap.to(from, { v: price, duration: 0.8, ease: 'power3.out', onUpdate: () => { pe.textContent = inr(Math.round(from.v)); } });
  pe.dataset.v = price;
  $('#cfgEmi').textContent = `No-cost EMI from ${inr(Math.round(price / 12))}/month`;
  room.setSize(sz);
  updateRoomReadout();
}
selectSeries(cfg.series);

// 3D tilt on the product image
const tiltEl = $('#cfgImageWrap');
if (finePointer) {
  tiltEl.addEventListener('pointermove', (e) => {
    const b = tiltEl.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    tiltEl.style.transform = `perspective(1000px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 8}deg)`;
    tiltEl.style.setProperty('--gx', px * 100 + '%'); tiltEl.style.setProperty('--gy', py * 100 + '%');
  });
  tiltEl.addEventListener('pointerleave', () => { tiltEl.style.transform = ''; });
}

/* ============================================================== cart */
const cartEl = $('#cart'), cartItems = $('#cartItems'), cartCount = $('#cartCount');
let cart = store.get('onf-cart', []);
function saveCart() { store.set('onf-cart', cart); renderCart(); }
function renderCart() {
  const n = cart.reduce((a, c) => a + c.qty, 0);
  cartCount.textContent = n;
  if (!cart.length) {
    cartItems.innerHTML = '<li class="cart-empty">Your cart is empty.<br />Pick a screen to get started.</li>';
  } else {
    cartItems.innerHTML = cart.map((c, i) => `
      <li>
        <img src="${c.image}" alt="" />
        <div><h5>${c.name}</h5><small>${c.size}″ · ${inr(c.price)}</small>
          <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease">−</button><span>${c.qty}</span><button data-q="1" data-i="${i}" aria-label="Increase">+</button></div>
        </div>
        <b>${inr(c.price * c.qty)}</b>
      </li>`).join('');
  }
  $('#cartTotal').textContent = inr(cart.reduce((a, c) => a + c.price * c.qty, 0));
}
cartItems.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-q]');
  if (!b) return;
  const i = +b.dataset.i;
  cart[i].qty += +b.dataset.q;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  saveCart();
});
function openCart() { cartEl.classList.add('is-open'); cartEl.setAttribute('aria-hidden', 'false'); lenis?.stop(); }
function closeCart() { cartEl.classList.remove('is-open'); cartEl.setAttribute('aria-hidden', 'true'); lenis?.start(); }
$('#cartOpen').addEventListener('click', openCart);
$$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeCart));
$('#addToCart').addEventListener('click', () => {
  const s = cfg.series, sz = cfg.size;
  const id = `${s.id}-${sz}`;
  const ex = cart.find((c) => c.id === id);
  if (ex) ex.qty++; else cart.push({ id, name: s.name, size: sz, price: s.prices[sz], image: s.image, qty: 1 });
  saveCart();
  cartCount.classList.remove('bump'); void cartCount.offsetWidth; cartCount.classList.add('bump');
  sound.tick();
  toast(`${s.name} ${sz}″ added to cart`);
});
$('#checkout').addEventListener('click', () => toast('Prototype: checkout & payment gateway connect here.'));
renderCart();

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ============================================================== modal */
const modal = $('#modal');
function openModal(i) {
  const it = SHOWROOM[i];
  $('#modalImg').src = it.img; $('#modalImg').alt = it.title;
  $('#modalCat').textContent = it.cat;
  $('#modalTitle').textContent = it.title;
  $('#modalDesc').textContent = it.desc;
  $('#modalList').innerHTML = it.list.map((l) => `<li>${l}</li>`).join('');
  modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  sound.tick();
  setTimeout(() => $('.modal-close').focus({ preventScroll: true }), 50);
}
function closeModal() {
  if (!modal.classList.contains('is-open')) return;
  modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
  lenis?.start();
}
$$('[data-close]', modal).forEach((b) => b.addEventListener('click', closeModal));
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeCart(); closeMenu(); } });

/* ============================================================== solutions (horizontal) */
const track = $('#solutionsTrack');
track.innerHTML = SOLUTIONS.map((s, i) => `
  <article class="sol-card" tabindex="0">
    <img src="${s.img}" alt="${s.title}" loading="lazy" />
    <div class="sol-body"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h3>${s.title}</h3><p>${s.text}</p></div>
  </article>`).join('');
const pin = $('.solutions-pin');
const getDist = () => Math.max(0, track.scrollWidth - (pin.clientWidth - track.offsetLeft) + 40);
gsap.to(track, {
  x: () => -getDist(), ease: 'none',
  scrollTrigger: { trigger: '#solutions', start: 'top top', end: () => '+=' + getDist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
});
$$('.sol-card img').forEach((img) => {
  gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '#solutions', start: 'top top', end: () => '+=' + getDist(), scrub: true } });
});

/* ============================================================== bharat */
gsap.fromTo('.bharat-media img', { yPercent: -16 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.bharat-media', start: 'top bottom', end: 'bottom top', scrub: true } });
$$('[data-count]').forEach((el) => {
  const o = { v: 0 };
  gsap.to(o, {
    v: +el.dataset.count, duration: 2, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
    onUpdate: () => { el.textContent = Math.round(o.v); },
  });
});

/* ============================================================== marquee */
const mt = $('#marqueeTrack');
mt.innerHTML = [...CLIENTS, ...CLIENTS].map((src) => `<img src="${src}" alt="" loading="lazy" />`).join('');
$('#marquee').setAttribute('aria-label', `${CLIENTS.length} client institutions`);
const marq = gsap.to(mt, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
if (lenis) lenis.on('scroll', (l) => { marq.timeScale(1 + Math.min(Math.abs(l.velocity) * 0.15, 6)); gsap.to(marq, { timeScale: 1, duration: 1, overwrite: true }); });

/* ============================================================== footer */
gsap.from('.footer-word', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 80%' } });

/* ============================================================== form */
$('#demoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  let ok = true;
  ['name', 'phone'].forEach((n) => {
    const inp = f.elements[n];
    const valid = n === 'phone' ? /^[+\d][\d\s-]{7,}$/.test(inp.value.trim()) : inp.value.trim().length > 1;
    inp.classList.toggle('invalid', !valid);
    if (!valid) ok = false;
  });
  const msg = $('#formMsg');
  if (!ok) { msg.textContent = 'Please add your name and a valid phone number.'; return; }
  msg.textContent = `Thanks ${f.elements.name.value.trim().split(' ')[0]} — our team will call you within one working day.`;
  f.reset();
});

addEventListener('load', () => ScrollTrigger.refresh());
