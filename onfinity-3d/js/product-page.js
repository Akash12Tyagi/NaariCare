import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { byId, nextOf, PRODUCTS } from './product-data.js';
import { BUILDERS } from './models.js';
import { CursorFxShader, trackPointer, initChrome } from './fx.js';
import { openAR, AR_FOR_PRODUCT } from './ar-viewer.js';

const { gsap, ScrollTrigger } = window;
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 720px)').matches;

const id = new URLSearchParams(location.search).get('p');
const prod = byId(id);
const next = nextOf(prod.id);

/* ---------------------------------------------------------------- content */
document.title = `${prod.name} — Onfinity`;
document.documentElement.style.setProperty('--accent', prod.accent);
$('#bootTitle').textContent = `Onfinity · ${prod.name}`;
$('#crumb').textContent = prod.short;
$('#ppName').textContent = `${prod.index} — ${prod.kicker}`;
$('#ppTitle').innerHTML = prod.tagline.map((l) => `<span class="w"><span>${l}</span></span>`).join('');
$('#ppLede').textContent = prod.lede;
$('#hcode').textContent = prod.models[0];
$('#ppPhoto').src = prod.photo; $('#ppPhoto').alt = prod.photoAlt;
$('#photoCap').textContent = `${prod.name} · original photo`;
$('#specTable').innerHTML = prod.specs.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
$('#models').innerHTML = prod.models.map((m) => `<span>${m}</span>`).join('');
$('#uses').innerHTML = prod.uses.map((u) => `<span>${u}</span>`).join('');
$('#catalog').href = prod.link;
$('#specTitle').innerHTML = `${prod.short.split(' ')[0]}, <em class="serif">specified.</em>`;
$('#next').href = `product.html?p=${next.id}`;
$('#nextIdx').textContent = `· ${next.index} / ${String(PRODUCTS.length).padStart(2, '0')}`;
$('#nextName').innerHTML = next.name.replace(/(\S+)$/, '<em>$1</em>');
$('#nextImg').src = next.photo;

const BOOT = {
  camera: ['Initialising optics', 'Calibrating 30× zoom', 'Aligning pan & tilt motors', 'Syncing 4K pipeline', 'Framing the room'],
  led: ['Powering cabinets', 'Mapping pixel grid', 'Balancing brightness', 'Seaming modules', 'Wall online'],
  kiosk: ['Booting player', 'Loading campaign', 'Calibrating touch', 'Connecting network', 'Kiosk ready'],
  visualizer: ['Unfolding arm', 'Warming LED lamps', 'Focusing lens', 'Starting live feed', 'Ready to present'],
  display: ['Waking displays', 'Syncing menus', 'Rotating layouts', 'Checking prices', 'Open for business'],
};

const chrome = initChrome({ reduced });

// AR: view this product in your own room at real size
const arId = AR_FOR_PRODUCT[prod.id];
const arHooks = { source: 'product-page', onOpen: () => chrome.lenis?.stop(), onClose: () => chrome.lenis?.start() };
$('#ppARLabel').textContent = /^(kiosk|camera|visualizer)$/.test(arId) ? 'View on your floor · AR' : 'View on your wall · AR';
['#ppAR', '#ppAR2'].forEach((s) => $(s).addEventListener('click', () => openAR(arId, arHooks)));

/* ---------------------------------------------------------------- renderer */
const canvas = $('#pstage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x03110d, 9, 22);
const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 80);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.65;

// backdrop sphere: brand-green radial studio
const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uAccent: { value: new THREE.Color(prod.accent) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 uAccent; varying vec3 vP;
    void main(){ float h = vP.y; vec3 top = vec3(0.004,0.03,0.022); vec3 mid = vec3(0.012,0.09,0.065);
      vec3 c = mix(mid, top, smoothstep(-0.05, 0.6, h)); c = mix(c, vec3(0.002,0.012,0.009), smoothstep(0.0, -0.4, h));
      c += uAccent * 0.025 * smoothstep(0.5, 0.0, abs(h - 0.05));
      gl_FragColor = vec4(c, 1.0); }`,
}));
scene.add(sky);

// floor + podium
const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 96), new THREE.MeshStandardMaterial({ color: 0x05140f, roughness: 0.62, metalness: 0.1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uAccent: { value: new THREE.Color(prod.accent) } },
  vertexShader: 'varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform vec3 uAccent; varying vec2 vW;
    void main(){ vec2 g = abs(fract(vW / 0.5) - 0.5); float l = smoothstep(0.015, 0.0, min(g.x, g.y));
      float r = length(vW); float ring = smoothstep(0.02, 0.0, abs(r - 2.6)) + smoothstep(0.012, 0.0, abs(r - 3.1)) * 0.5;
      float a = (l * 0.07 + ring * 0.55) * smoothstep(12.0, 2.0, r);
      gl_FragColor = vec4(uAccent * 1.4, a); }`,
}));
grid.rotation.x = -Math.PI / 2; grid.position.y = 0.002; scene.add(grid);

// lights
scene.add(new THREE.HemisphereLight(0xe8fff4, 0x0b1a14, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3.5, 6, 4); key.castShadow = true;
key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -3, near: 1, far: 20 });
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
scene.add(key);
const rimA = new THREE.DirectionalLight(new THREE.Color(prod.accent), 1.5); rimA.position.set(-4, 3, -4); scene.add(rimA);
const rimB = new THREE.DirectionalLight(0x5eead4, 1.0); rimB.position.set(5, 1.5, -3); scene.add(rimB);

// dust
const N = isMobile ? 200 : 500;
const dpos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { dpos[i * 3] = (Math.random() - 0.5) * 14; dpos[i * 3 + 1] = Math.random() * 5; dpos[i * 3 + 2] = (Math.random() - 0.5) * 14; }
const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xdfeec0, size: 0.014, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

/* ---------------------------------------------------------------- model */
const manager = new THREE.LoadingManager();
let loaded = 0, total = 1, assetsDone = false;
manager.onProgress = (_u, l, t) => { loaded = l; total = t; };
manager.onLoad = () => { assetsDone = true; };
setTimeout(() => { assetsDone = true; }, 10000);
const model = BUILDERS[prod.id](new THREE.TextureLoader(manager));
scene.add(model.group);
if (!manager.itemsTotal) assetsDone = true;
renderer.toneMappingExposure = model.exposure ?? 1;

/* ---------------------------------------------------------------- post */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), model.bloomStrength ?? 0.42, 0.6, model.bloomThreshold ?? 0.86);
composer.addPass(bloom);
const fx = new ShaderPass(CursorFxShader);
composer.addPass(fx);
composer.addPass(new OutputPass());

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 50 : 34;
  camera.updateProjectionMatrix();
  fx.uniforms.uAspect.value = w / h;
}
resize();
new ResizeObserver(resize).observe(canvas);

/* ---------------------------------------------------------------- camera choreography */
// Interpolate between stations on a sphere around a moving target, so the
// camera swings in arcs (with lift + roll mid-flight) instead of straight lines.
const V = (a) => new THREE.Vector3(...a);
const stations = model.cams.map((c) => {
  const pos = V(c.pos), target = V(c.target);
  if (isMobile) pos.sub(target).multiplyScalar(1.28).add(target);
  const s = new THREE.Spherical().setFromVector3(pos.clone().sub(target));
  return { s, target, roll: c.roll || 0 };
});
function lerpAngle(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
const camState = { target: new THREE.Vector3(), pos: new THREE.Vector3(), roll: 0 };
function poseAt(p) {
  const i = Math.min(Math.floor(p), stations.length - 2), f = p - i;
  const A = stations[i], B = stations[i + 1];
  const arc = Math.sin(Math.PI * f);
  const r = THREE.MathUtils.lerp(A.s.radius, B.s.radius, f) * (1 + arc * 0.18);
  const phi = THREE.MathUtils.lerp(A.s.phi, B.s.phi, f) - arc * 0.22;
  const theta = lerpAngle(A.s.theta, B.s.theta, f);
  camState.target.lerpVectors(A.target, B.target, f);
  camState.pos.setFromSpherical(new THREE.Spherical(r, THREE.MathUtils.clamp(phi, 0.05, Math.PI - 0.05), theta)).add(camState.target);
  camState.roll = THREE.MathUtils.lerp(A.roll, B.roll, f) + arc * 0.06 * (i % 2 ? -1 : 1);
  return camState;
}

/* ---------------------------------------------------------------- scroll */
const track = ScrollTrigger.create({ trigger: '#track', start: 'top bottom', end: 'bottom bottom' });
let active = true;
ScrollTrigger.create({
  trigger: '#photo', start: 'top 10%',
  onEnter: () => { active = false; canvas.style.visibility = 'hidden'; },
  onLeaveBack: () => { active = true; canvas.style.visibility = 'visible'; },
});
const holdEase = (x) => { const i = Math.floor(x), f = x - i; const t = THREE.MathUtils.clamp((f - 0.18) / 0.64, 0, 1); return i + t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- callouts */
const dot = $('#hsDot'), card = $('#hsCard'), line = $('#hsLine'), rail = [...document.querySelectorAll('#rail span')];
let shownStation = -1;
function setStation(k) {
  if (k === shownStation) return;
  shownStation = k;
  rail.forEach((r, i) => r.classList.toggle('on', i === k - 1));
  $('#rail').classList.toggle('on', k > 0);
  $('#hst').textContent = String(Math.max(0, k)).padStart(2, '0');
  if (k < 1) return;
  const st = prod.stations[k - 1];
  $('#hsTag').textContent = st.tag;
  $('#hsCount').textContent = '/005';
  $('#hsTitle').textContent = st.title;
  $('#hsText').textContent = st.text;
  gsap.fromTo(card.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
}
const proj = new THREE.Vector3();
function placeCallout(p) {
  const k = Math.round(p);
  const near = Math.abs(p - k);
  const a = k >= 1 ? 1 - THREE.MathUtils.smoothstep(near, 0.18, 0.34) : 0;
  setStation(a > 0.02 ? k : (k < 1 ? 0 : shownStation));
  dot.style.opacity = card.style.opacity = line.style.opacity = a;
  if (a <= 0.01) return;
  const hs = model.hotspots[prod.stations[k - 1].hotspot];
  hs.getWorldPosition(proj); proj.project(camera);
  const W = innerWidth, H = innerHeight;
  const x = (proj.x * 0.5 + 0.5) * W, y = (-proj.y * 0.5 + 0.5) * H;
  dot.style.transform = `translate(${x}px, ${y}px)`;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let cx, cy, lx, ly;
  if (W < 720) {
    cx = 16; cy = H - ch - 64; lx = Math.min(Math.max(x, 40), W - 40); ly = cy;
  } else {
    const right = x < W * 0.5;
    cx = right ? Math.min(W - cw - 72, Math.max(x + 140, W * 0.56)) : Math.max(56, Math.min(x - cw - 140, W * 0.44 - cw));
    cy = Math.min(Math.max(y - ch * 0.5 - 40, 110), H - ch - 90);
    lx = right ? cx : cx + cw; ly = cy + 40;
  }
  card.style.transform = `translate(${cx}px, ${cy}px)`;
  line.setAttribute('x1', x); line.setAttribute('y1', y); line.setAttribute('x2', lx); line.setAttribute('y2', ly);
}

/* ---------------------------------------------------------------- photo + loupe */
const frame = $('#photoFrame'), loupe = $('#loupe');
loupe.style.backgroundImage = `url(${prod.photo})`;
frame.addEventListener('pointermove', (e) => {
  const b = frame.getBoundingClientRect();
  const x = e.clientX - b.left, y = e.clientY - b.top, Z = 2.6;
  loupe.style.left = x + 'px'; loupe.style.top = y + 'px';
  loupe.style.backgroundSize = `${b.width * Z}px ${b.height * Z}px`;
  loupe.style.backgroundPosition = `${-(x * Z - 110)}px ${-(y * Z - 110)}px`;
});
gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: frame, start: 'top 90%', end: 'top 25%', scrub: true } });
gsap.to('#ppPhoto', { scale: 1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 90%', end: 'bottom top', scrub: true } });
gsap.utils.toArray('.pp-specs .spec-table div, .pp-specs .chips span').forEach((el, i) => {
  gsap.from(el, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', delay: (i % 6) * 0.04, scrollTrigger: { trigger: el, start: 'top 92%' } });
});

/* ---------------------------------------------------------------- loop */
const pointer = trackPointer();
const intro = { k: 1 };
const clock = new THREE.Clock();
let pSmooth = 0;
const up = new THREE.Vector3();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  pointer.decay(dt);
  if (!active) return;
  const pRaw = track.progress * 5;
  pSmooth += (holdEase(pRaw) - pSmooth) * (1 - Math.exp(-dt * 5));
  const p = pSmooth;
  model.apply(p);
  model.update(t, dt);

  const pose = poseAt(Math.min(p, 4.999));
  camera.position.copy(pose.pos);
  // intro: start wide and high, swoop in
  if (intro.k > 0) {
    const off = pose.pos.clone().sub(pose.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), intro.k * 1.2).multiplyScalar(1 + intro.k * 0.9);
    off.y += intro.k * 2.5;
    camera.position.copy(pose.target).add(off);
  }
  // pointer parallax
  const right = new THREE.Vector3().subVectors(camera.position, pose.target).cross(up.set(0, 1, 0)).normalize();
  camera.position.addScaledVector(right, -pointer.nx * 0.12).add(new THREE.Vector3(0, pointer.ny * 0.08, 0));
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.target);
  camera.rotateZ(pose.roll);
  // hero: frame the model to the right of the headline, then centre it
  const W = canvas.clientWidth, Hh = canvas.clientHeight;
  const heroShift = (1 - THREE.MathUtils.smoothstep(p, 0, 0.9));
  if (W / Hh >= 0.8) camera.setViewOffset(W, Hh, -W * 0.2 * heroShift, 0, W, Hh);
  else camera.setViewOffset(W, Hh, 0, Hh * 0.24 * heroShift, W, Hh);
  camera.updateProjectionMatrix();

  const arr = dgeo.attributes.position.array;
  for (let i = 0; i < N; i++) { arr[i * 3 + 1] += dt * 0.04; if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = 0; }
  dgeo.attributes.position.needsUpdate = true;

  fx.uniforms.uTime.value = t;
  fx.uniforms.uMouse.value.set(pointer.x, pointer.y);
  fx.uniforms.uVel.value = reduced ? 0 : pointer.vel;
  placeCallout(p);
  composer.render(dt);
}
requestAnimationFrame(tick);

/* ---------------------------------------------------------------- boot → intro */
gsap.set('#ppTitle .w > span', { yPercent: 110 });
gsap.set(['#ppName', '#ppLede', '.pp-hero .pp-cta', '.pp-crumbs'], { opacity: 0, y: 20 });
chrome.boot(BOOT[prod.id], () => (assetsDone ? 1 : loaded / Math.max(total, 1)), () => {
  chrome.reveal();
  ScrollTrigger.refresh();
  gsap.to(intro, { k: 0, duration: reduced ? 0.01 : 2.6, ease: 'expo.out' });
  gsap.to('#ppTitle .w > span', { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.09, delay: 0.25 });
  gsap.to(['.pp-crumbs', '#ppName', '#ppLede', '.pp-hero .pp-cta'], { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
});
// in-page anchor
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.lenis) chrome.lenis.scrollTo(a.getAttribute('href'), { duration: 1.8 }); else $(a.getAttribute('href')).scrollIntoView();
}));
