// "The Onfinity Orbit" — product index as a circular 3D carousel.
// Products sit on a ring around a glowing infinity core. Scrolling/dragging
// spins the ring while the camera flies between per-product poses (low,
// high, side, overhead…) so every move shows the scene from a new angle.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PRODUCTS } from './product-data.js';
import { CursorFxShader, trackPointer, initChrome } from './fx.js';

const { gsap } = window;
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 720px)').matches;
const chrome = initChrome({ reduced });

const N = PRODUCTS.length;
const STEP = (Math.PI * 2) / N;
const R = 4.8;
const CW = 2.7, CH = 2.02;

/* ---------------------------------------------------------------- renderer */
const canvas = $('#orbit');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.setClearColor(0x020d0a, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020d0a, 0.045);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

/* ---------------------------------------------------------------- infinity core */
class Lemniscate extends THREE.Curve {
  constructor(a = 1.4) { super(); this.a = a; }
  getPoint(t, target = new THREE.Vector3()) {
    const u = t * Math.PI * 2, s = Math.sin(u), c = Math.cos(u), d = 1 + s * s;
    return target.set((this.a * c) / d, (this.a * s * c) / d, Math.sin(u * 2) * 0.12);
  }
}
const core = new THREE.Group(); scene.add(core);
const coreTube = new THREE.Mesh(new THREE.TubeGeometry(new Lemniscate(1.5), 400, 0.05, 16, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8d433).multiplyScalar(1.5) }));
core.add(coreTube);
const coreHalo = new THREE.Mesh(new THREE.TubeGeometry(new Lemniscate(1.5), 300, 0.16, 12, true), new THREE.MeshBasicMaterial({ color: 0xb8d433, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
core.add(coreHalo);
// travelling spark on the curve
const spark = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcb05).multiplyScalar(2.5) }));
core.add(spark);
const sparkCurve = new Lemniscate(1.5);

// orbital rings
const rings = [];
[[R + 0.05, 0.004, 0x5eead4, 0.5, [Math.PI / 2, 0, 0]], [R * 0.62, 0.006, 0xb8d433, 0.35, [1.2, 0.4, 0]], [R * 1.55, 0.006, 0xb8d433, 0.22, [1.75, -0.3, 0.2]], [R * 2.2, 0.004, 0x5eead4, 0.15, [1.4, 0.6, 0]]].forEach(([r, tube, col, op, rot]) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 240), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.set(...rot); scene.add(m); rings.push(m);
});
// tick marks on the main ring
const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.008, 0.16), new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.6 }), 120);
const dm = new THREE.Object3D();
for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; dm.position.set(Math.sin(a) * (R + 0.35), -CH / 2 - 0.25, Math.cos(a) * (R + 0.35)); dm.rotation.y = a; dm.scale.z = i % 10 === 0 ? 2.5 : 1; dm.updateMatrix(); ticks.setMatrixAt(i, dm.matrix); }
scene.add(ticks);

// star dust
const SN = isMobile ? 600 : 1400;
const sp = new Float32Array(SN * 3);
for (let i = 0; i < SN; i++) { const r = 8 + Math.random() * 30, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 30; sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = y; sp[i * 3 + 2] = Math.sin(a) * r; }
const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xdfeec0, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(stars);

/* ---------------------------------------------------------------- cards */
const manager = new THREE.LoadingManager();
let loaded = 0, total = 1, assetsDone = false;
manager.onProgress = (_u, l, t) => { loaded = l; total = t; };
manager.onLoad = () => { assetsDone = true; };
setTimeout(() => { assetsDone = true; }, 10000);
const loader = new THREE.TextureLoader(manager);

const cardVert = /* glsl */`
  uniform float uVel, uTime, uFocus, uR;
  varying vec2 vUv; varying float vShade;
  void main(){
    vUv = uv;
    vec3 p = position;
    float a = p.x / uR;
    // hug the ring, bend harder with velocity, flatten when focused
    float bend = uR * (1.0 - uFocus * 0.65) / (1.0 + abs(uVel) * 2.5);
    float ab = p.x / bend;
    vec3 q = vec3(sin(ab) * bend, p.y, cos(ab) * bend - bend);
    q.y += sin(p.x * 1.8 + uTime * 2.0) * uVel * 0.18;
    q.z += sin(p.y * 2.0 + uTime) * 0.02 * (1.0 - uFocus);
    vShade = 1.0 - abs(ab) * 0.25;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
  }`;
const cardFrag = /* glsl */`
  uniform sampler2D map; uniform float uVel, uFocus, uHover, uImgA, uCardA, uTime; uniform vec3 uAccent;
  varying vec2 vUv; varying float vShade;
  float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main(){
    vec2 uv = vUv;
    // cover-fit + hover zoom
    vec2 s = uImgA > uCardA ? vec2(uCardA / uImgA, 1.0) : vec2(1.0, uImgA / uCardA);
    uv = 0.5 + (uv - 0.5) * s / (1.0 + uHover * 0.08 + uFocus * 0.02);
    float split = uVel * 0.025;
    vec3 c = vec3(texture2D(map, uv + vec2(split, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(split, 0.0)).b);
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 duo = mix(vec3(0.01, 0.07, 0.05), vec3(0.75, 0.86, 0.6), l);
    c = mix(duo * 0.75, c, 0.25 + uFocus * 0.75);
    c *= 0.55 + 0.45 * uFocus + uHover * 0.15;
    c *= vShade;
    // rounded corners + accent edge
    vec2 p = (vUv - 0.5) * vec2(uCardA, 1.0);
    float d = sdRound(p, vec2(uCardA, 1.0) * 0.5, 0.06);
    float alpha = smoothstep(0.004, -0.004, d);
    float edge = smoothstep(0.012, 0.0, abs(d + 0.006));
    c += uAccent * edge * (0.2 + uFocus * 0.7 + uHover * 0.6);
    // scanning line on the focused card
    float scan = smoothstep(0.006, 0.0, abs(vUv.y - fract(uTime * 0.25))) * uFocus * 0.35;
    c += uAccent * scan;
    gl_FragColor = vec4(c, alpha);
  }`;

const ring = new THREE.Group(); scene.add(ring);
const cards = PRODUCTS.map((prod, k) => {
  const tex = loader.load(prod.photo, (t) => { u.uImgA.value = t.image.width / t.image.height; });
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const u = {
    map: { value: tex }, uVel: { value: 0 }, uTime: { value: 0 }, uFocus: { value: 0 }, uHover: { value: 0 },
    uImgA: { value: 4 / 3 }, uCardA: { value: CW / CH }, uR: { value: R }, uAccent: { value: new THREE.Color(prod.accent) },
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH, 48, 12), new THREE.ShaderMaterial({ uniforms: u, vertexShader: cardVert, fragmentShader: cardFrag, transparent: true, side: THREE.DoubleSide }));
  mesh.userData.k = k;
  const g = new THREE.Group();
  const a = k * STEP;
  g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
  g.rotation.y = a;
  g.add(mesh);
  // index label under each card
  const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 96;
  const lg = lc.getContext('2d');
  lg.font = '500 44px ui-monospace, Menlo, monospace'; lg.fillStyle = prod.accent; lg.fillText(prod.index, 0, 64);
  lg.font = '500 46px Inter, Arial'; lg.fillStyle = '#EEF1EA'; lg.fillText(prod.name.toUpperCase(), 110, 64);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.225), new THREE.MeshBasicMaterial({ map: lt, transparent: true, opacity: 0.85, depthWrite: false }));
  label.position.set(-CW / 2 + 1.2, -CH / 2 - 0.26, 0.02);
  g.add(label);
  ring.add(g);
  return { g, mesh, u, label, hover: 0, focus: 0 };
});
const pickables = cards.map((c) => c.mesh);

/* ---------------------------------------------------------------- post */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.42, 0.35, 0.88));
const fx = new ShaderPass(CursorFxShader);
composer.addPass(fx);
composer.addPass(new OutputPass());
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w / h < 0.8 ? 62 : 40;
  // shift the frame so the focused product sits beside the copy, not under it
  if (w / h < 0.8) camera.setViewOffset(w, h, 0, h * 0.21, w, h);
  else camera.setViewOffset(w, h, -w * 0.22, 0, w, h);
  camera.updateProjectionMatrix();
  fx.uniforms.uAspect.value = w / h;
}
resize();
new ResizeObserver(resize).observe(canvas);

/* ---------------------------------------------------------------- camera poses (one per product) */
// az: swing around the ring, el: elevation, d: distance, roll, look: how far toward the card to aim
const POSES = [
  { az: 0.0, el: 0.08, d: 9.6, roll: 0.0, look: 0.62, y: 0.0 },
  { az: -0.62, el: 0.55, d: 10.8, roll: -0.08, look: 0.55, y: 0.3 },
  { az: 0.5, el: -0.22, d: 9.4, roll: 0.07, look: 0.66, y: -0.1 },
  { az: -0.25, el: 0.95, d: 12.0, roll: 0.03, look: 0.5, y: 0.5 },
  { az: 0.72, el: 0.3, d: 10.2, roll: -0.05, look: 0.58, y: 0.1 },
];
if (isMobile) POSES.forEach((p) => { p.d *= 1.25; p.az *= 0.6; });
const mod = (n, m) => ((n % m) + m) % m;
const lerp = THREE.MathUtils.lerp;
function poseAt(s) {
  const i = Math.floor(s), f = s - i;
  const A = POSES[mod(i, N)], B = POSES[mod(i + 1, N)];
  const e = f * f * (3 - 2 * f), arc = Math.sin(Math.PI * f);
  return {
    az: lerp(A.az, B.az, e) + arc * 0.35,
    el: lerp(A.el, B.el, e) + arc * 0.28,
    d: lerp(A.d, B.d, e) * (1 + arc * 0.22),
    roll: lerp(A.roll, B.roll, e) + arc * 0.1 * (i % 2 ? 1 : -1),
    look: lerp(A.look, B.look, e) - arc * 0.25,
    y: lerp(A.y, B.y, e),
  };
}

/* ---------------------------------------------------------------- input (virtual scroll) */
let s = 0, target = 0, vel = 0, lastInput = 0, entering = false;
const nudge = (d) => { target += d; lastInput = performance.now(); };
addEventListener('wheel', (e) => {
  e.preventDefault();
  const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
  nudge(THREE.MathUtils.clamp((px + e.deltaX) * 0.0016, -0.6, 0.6));
}, { passive: false });
let dragging = false, lx = 0, ly = 0, moved = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; moved = 0; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  nudge(-(dx + dy * 0.6) * (isMobile ? 0.008 : 0.005));
});
canvas.addEventListener('pointerup', (e) => {
  dragging = false;
  if (moved < 6) {
    const k = pick(e.clientX, e.clientY);
    if (k >= 0) { if (k === focusIdx()) enter(k); else goTo(k); }
  }
});
canvas.addEventListener('pointercancel', () => { dragging = false; });
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nudge(1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nudge(-1);
  if (e.key === 'Enter') enter(focusIdx());
});
const focusIdx = () => mod(Math.round(s), N);
function goTo(k) {
  const cur = Math.round(target);
  let d = mod(k - mod(cur, N), N); if (d > N / 2) d -= N;
  target = cur + d; lastInput = performance.now() - 1000;
}

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.k : -1;
}

/* ---------------------------------------------------------------- HUD */
const list = $('#oList');
list.innerHTML = PRODUCTS.map((p, k) => `<li><button type="button" data-k="${k}"><i>${p.index}</i>${p.short}</button></li>`).join('');
list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goTo(+b.dataset.k); });
let shown = -1;
function showProduct(k) {
  if (k === shown) return;
  shown = k;
  const p = PRODUCTS[k];
  $('#oIdx').textContent = p.index;
  $('#oKick').textContent = p.kicker;
  const words = p.name.split(' ');
  $('#oTitle').innerHTML = words.map((w, i) => `<span class="w"><span>${i === words.length - 1 ? `<em>${w}</em>` : w}</span></span>`).join(' ');
  $('#oLede').textContent = p.lede;
  $('#oGo').href = `product.html?p=${p.id}`;
  $('#oRingTxt').textContent = p.index;
  document.documentElement.style.setProperty('--accent', p.accent);
  list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.k === k)));
  gsap.fromTo('#oTitle .w > span', { yPercent: 110 }, { yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: 0.06 });
  gsap.fromTo(['#oLede', '.orbit-title .kick'], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 });
}
$('#oGo').addEventListener('click', (e) => { e.preventDefault(); enter(focusIdx()); });

function enter(k) {
  if (entering) return;
  entering = true;
  const p = PRODUCTS[k];
  goTo(k);
  gsap.to(dolly, { v: 1, duration: reduced ? 0.01 : 1.1, ease: 'power3.in' });
  gsap.to(fx.uniforms.uVel, { value: 1, duration: 0.8 });
  setTimeout(() => chrome.leaveTo(`product.html?p=${p.id}`), reduced ? 0 : 500);
}
const dolly = { v: 0 };

/* ---------------------------------------------------------------- loop */
const pointer = trackPointer();
const clock = new THREE.Clock();
const intro = { k: 1 };
const lookAt = new THREE.Vector3();
const ringTxtCirc = 207.3;
let hovered = -1;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  pointer.decay(dt);

  // snap to the nearest product when idle
  if (!dragging && performance.now() - lastInput > 180) target += (Math.round(target) - target) * (1 - Math.exp(-dt * 6));
  const prev = s;
  s += (target - s) * (1 - Math.exp(-dt * (reduced ? 20 : 4.2)));
  vel += ((s - prev) / Math.max(dt, 1e-3) - vel) * 0.15;
  const v = THREE.MathUtils.clamp(vel * 0.35, -1, 1);

  ring.rotation.y = -s * STEP;
  ring.rotation.z = v * 0.06;
  core.rotation.y = t * 0.25 - s * 0.6;
  core.rotation.x = Math.sin(t * 0.3) * 0.2;
  sparkCurve.getPoint((t * 0.12) % 1, spark.position);
  rings.forEach((r, i) => { r.rotation.z += dt * (0.03 + i * 0.015) * (i % 2 ? -1 : 1) + v * 0.01; });
  ticks.rotation.y = ring.rotation.y * 0.5;
  stars.rotation.y = -s * 0.05 + t * 0.005;

  // camera
  const P = poseAt(s);
  const az = P.az + pointer.nx * 0.08, el = P.el + pointer.ny * 0.05 + intro.k * 0.7;
  const d = P.d * (1 + intro.k * 0.8) * (1 - dolly.v * 0.62);
  camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d + P.y, Math.cos(az) * Math.cos(el) * d);
  lookAt.set(0, P.y * 0.3, R * P.look * (1 - intro.k * 0.6) + dolly.v * R * 0.38);
  camera.up.set(0, 1, 0);
  camera.lookAt(lookAt);
  camera.rotateZ(P.roll + intro.k * 0.3);

  // cards
  ray.setFromCamera(ndc.set(pointer.nx, pointer.ny), camera);
  const hit = dragging ? null : ray.intersectObjects(pickables, false)[0];
  const h = hit ? hit.object.userData.k : -1;
  if (h !== hovered) {
    hovered = h;
    document.dispatchEvent(new CustomEvent('cursor:label', { detail: h < 0 ? '' : h === focusIdx() ? 'Enter' : 'View' }));
    canvas.style.cursor = h >= 0 ? 'pointer' : 'grab';
  }
  const fk = focusIdx();
  cards.forEach((c, k) => {
    const dist = Math.abs(mod(s - k + N / 2, N) - N / 2);
    c.focus = Math.max(0, 1 - dist * 1.6);
    c.hover += ((k === hovered ? 1 : 0) - c.hover) * (1 - Math.exp(-dt * 8));
    c.u.uFocus.value = c.focus; c.u.uHover.value = c.hover; c.u.uVel.value = v; c.u.uTime.value = t;
    c.g.scale.setScalar(1 + c.focus * 0.12 + c.hover * 0.04);
    c.g.position.y = Math.sin(t * 0.8 + k) * 0.06 + c.focus * 0.1;
    c.label.material.opacity = 0.35 + c.focus * 0.6;
  });
  showProduct(fk);

  // HUD
  const frac = mod(s, N) / N;
  $('#oRing').setAttribute('stroke-dashoffset', String(ringTxtCirc * (1 - (fk + 1) / N)));
  $('#hAng').textContent = String(Math.round(frac * 360)).padStart(3, '0');
  $('#hVel').textContent = Math.abs(v).toFixed(2);

  fx.uniforms.uTime.value = t;
  fx.uniforms.uMouse.value.set(pointer.x, pointer.y);
  if (!entering) fx.uniforms.uVel.value = reduced ? 0 : Math.max(pointer.vel, Math.abs(v) * 0.6);
  composer.render(dt);
}
requestAnimationFrame(tick);

// deep link: products.html#kiosk
const startId = location.hash.slice(1);
const startK = PRODUCTS.findIndex((p) => p.id === startId);
if (startK > 0) { s = target = startK; }

chrome.boot(['Spinning up the orbit', 'Loading five product lines', 'Aligning orbital rings', 'Igniting the infinity core', 'Ready for launch'],
  () => (assetsDone ? 1 : loaded / Math.max(total, 1)),
  () => { chrome.reveal(); gsap.to(intro, { k: 0, duration: reduced ? 0.01 : 2.8, ease: 'expo.out' }); });
