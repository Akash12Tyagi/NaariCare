// AR catalogue: every product as a real-world-scale, export-safe 3D object.
// Used by tools/ar-export.html to bake GLB (Android / WebXR) + USDZ (iOS
// Quick Look) files into assets/ar/. Units are metres; origin is at the
// bottom-centre for floor items and back-centre for wall items.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BUILDERS } from './models.js';

const IN = 0.0254;
export const panelDims = (inch) => ({ w: inch * IN * 0.8716, h: inch * IN * 0.4903 });
export const TV_SIZES = [32, 43, 55, 65, 75, 86, 98];

// Catalogue. `group` lets the viewer offer sizes of the same product.
export const AR_ITEMS = [
  ...TV_SIZES.map((s) => ({ id: `tv-${s}`, group: 'tv', size: s, alt: `tv-${s}-stand`, name: `Onfinity Smart 4K TV · ${s}″`, placement: 'wall' })),
  // same TVs on their blade feet — for a console/table (floor detection is far more reliable than walls)
  ...TV_SIZES.map((s) => ({ id: `tv-${s}-stand`, group: 'tv-stand', size: s, alt: `tv-${s}`, name: `Onfinity Smart 4K TV · ${s}″ on stand`, placement: 'floor' })),
  { id: 'ifpd-75', group: 'ifpd', size: 75, name: 'Onfinity Interactive Flat Panel · 75″', placement: 'wall' },
  { id: 'ifpd-86', group: 'ifpd', size: 86, name: 'Onfinity Interactive Flat Panel · 86″', placement: 'wall' },
  { id: 'display-55', group: 'display', size: 55, name: 'Onfinity Commercial Display · 55″', placement: 'wall' },
  { id: 'display-info', group: 'display-info', size: 55, name: 'Onfinity Information Display · 55″', placement: 'wall' },
  { id: 'led', group: 'led', name: 'Onfinity LED Video Wall · 3.4 × 1.0 m', placement: 'wall' },
  { id: 'kiosk', group: 'kiosk', name: 'Onfinity Digital Signage Kiosk · 43″', placement: 'floor' },
  { id: 'camera', group: 'camera', name: 'Onfinity PTZ Conference Camera', placement: 'floor' },
  { id: 'visualizer', group: 'visualizer', name: 'Onfinity Digital Visualizer', placement: 'floor' },
];

/* ---------------------------------------------------------------- helpers */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function load(loader, url) { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; return t; }

// Convert anything exporters can't handle into MeshStandardMaterial.
function toStandard(m) {
  if (m.isMeshStandardMaterial) {
    if (m.side === THREE.DoubleSide) { m = m.clone(); m.side = THREE.FrontSide; }
    if (m.transparent && m.opacity < 0.02) return null;
    return m;
  }
  const map = m.map || m.uniforms?.map?.value || m.uniforms?.a?.value || null;
  const color = m.color ? m.color.clone() : new THREE.Color(0xffffff);
  if (m.isShaderMaterial || m.isMeshBasicMaterial) {
    // screens & emissive bits: render as self-lit
    return new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: map ? 0xffffff : new THREE.Color(Math.min(1, color.r), Math.min(1, color.g), Math.min(1, color.b)), emissiveMap: map, emissiveIntensity: 1,
      roughness: 0.25, metalness: 0, transparent: !!m.transparent && m.opacity < 1, opacity: m.opacity ?? 1,
    });
  }
  return new THREE.MeshStandardMaterial({ color, map, roughness: 0.5 });
}
export function sanitize(root) {
  const drop = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.userData.noAR || o.isLight || o.isPoints || o.isSprite || o.isLine) { drop.push(o); return; }
    if (o.isMesh) {
      const m = toStandard(o.material);
      if (!m) drop.push(o); else {
        o.material = m;
        // GLB textures as JPEG (GLTFExporter defaults to PNG, ~10x larger)
        ['map', 'emissiveMap'].forEach((k) => { if (m[k]) m[k].userData.mimeType = 'image/jpeg'; });
      }
      if (o.scale.x < 0 || o.scale.y < 0 || o.scale.z < 0) drop.push(o);
    }
  });
  drop.forEach((o) => o.parent && o.parent.remove(o));
  return root;
}

/* ---------------------------------------------------------------- flat panels */
function panel({ inch, screen, bezel = 0.006, depth = 0.028, chin = 0, logo = true }) {
  const { w, h } = panelDims(inch);
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.55, roughness: 0.38 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xa9aeb3, metalness: 0.9, roughness: 0.28 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x24282c, metalness: 0.3, roughness: 0.55 });
  const W = w + bezel * 2, H = h + bezel * 2 + chin;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.012, 2, 0.004), metal);
  frame.position.set(0, H / 2, 0.006 + depth);
  g.add(frame);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(W + 0.008, H + 0.008, 0.008, 2, 0.004), trimMat);
  trim.position.set(0, H / 2, 0.004 + depth);
  g.add(trim);
  const back = new THREE.Mesh(new RoundedBoxGeometry(W * 0.72, H * 0.66, depth, 3, 0.01), backMat);
  back.position.set(0, H / 2 - H * 0.04, depth / 2);
  g.add(back);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screen, roughness: 0.2 }));
  scr.position.set(0, bezel + chin + h / 2, 0.0125 + depth);
  g.add(scr);
  if (logo) {
    const lt = canvasTex(512, 128, (c) => { c.fillStyle = '#17191a'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#d6dbd6'; c.font = '600 64px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Ōnfinity', 256, 68); });
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(0.12, w * 0.08), Math.min(0.03, w * 0.02)), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: lt, emissiveIntensity: 0.8 }));
    lp.position.set(0, Math.max(bezel, chin) * 0.5 + 0.0005, 0.0126 + depth);
    g.add(lp);
  }
  return g;
}

function ifpdScreen() {
  return canvasTex(1600, 900, (g, W, H) => {
    g.fillStyle = '#f7f8fb'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#105F42'; g.fillRect(0, 0, W, 110);
    g.fillStyle = '#fff'; g.font = '600 52px Inter, Arial'; g.fillText('Ōnfinity Classroom', 50, 72);
    g.fillStyle = '#231F20'; g.font = '600 64px Inter, Arial'; g.fillText('Today: The Solar System', 60, 220);
    const cols = ['#ffcb05', '#b8d433', '#5eead4', '#ff8a5c', '#8a7dff', '#105F42'];
    ['Maths', 'Science', 'English', 'History', 'Geography', 'Hindi'].forEach((s, i) => {
      const x = 60 + i * 250, y = 300;
      g.fillStyle = cols[i]; g.beginPath(); g.roundRect(x, y, 220, 160, 22); g.fill();
      g.fillStyle = '#231F20'; g.font = '600 34px Inter, Arial'; g.fillText(s, x + 24, y + 140);
    });
    g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(1180, 690, 110, 0, Math.PI * 2); g.fill();
    ['#9aa3b5', '#e8b06a', '#5aa0e0', '#d2643f'].forEach((c, i) => { g.strokeStyle = 'rgba(35,31,32,.15)'; g.lineWidth = 2; g.beginPath(); g.arc(1180, 690, 170 + i * 60, Math.PI * 0.95, Math.PI * 1.55); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(1180 + Math.cos(Math.PI * 1.2) * (170 + i * 60), 690 + Math.sin(Math.PI * 1.2) * (170 + i * 60), 18 + i * 4, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = '#d6261c'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(120, 640); g.bezierCurveTo(240, 560, 360, 760, 520, 620); g.stroke();
    g.fillStyle = '#6b6b6b'; g.font = '500 30px Inter, Arial'; g.fillText('10-point multi-touch · write, draw, share', 60, 820);
  });
}

function infoScreen() {
  return canvasTex(1600, 900, (g, W, H) => {
    g.fillStyle = '#0d3b2e'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#B8D433'; g.font = '600 54px Inter, Arial'; g.fillText('Welcome to City Care Hospital', 60, 100);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '400 34px Inter, Arial'; g.fillText('OPD · Ground floor', 60, 152);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(60, 210, 620, 600, 28); g.fill();
    g.fillStyle = '#231F20'; g.font = '600 40px Inter, Arial'; g.fillText('NOW SERVING', 110, 300);
    g.fillStyle = '#105F42'; g.font = '700 260px Inter, Arial'; g.fillText('A-27', 100, 560);
    g.fillStyle = '#6b6b6b'; g.font = '500 36px Inter, Arial'; g.fillText('Counter 3 · Dr. Mehta', 110, 640);
    const docs = [['Cardiology', 'Room 104', 'Available'], ['Orthopaedics', 'Room 112', 'In OT'], ['Paediatrics', 'Room 118', 'Available'], ['Dermatology', 'Room 121', 'Break']];
    docs.forEach(([d, r, s], i) => {
      const y = 250 + i * 140;
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(740, y - 60, 800, 110, 18); g.fill();
      g.fillStyle = '#fff'; g.font = '600 40px Inter, Arial'; g.fillText(d, 780, y);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '400 30px Inter, Arial'; g.fillText(r, 780, y + 36);
      g.fillStyle = s === 'Available' ? '#B8D433' : '#FFCB05'; g.font = '600 32px Inter, Arial'; g.fillText(s, 1300, y + 14);
    });
  });
}

// Blade feet like the real Onfinity TVs; lifts the panel 9 cm off the table.
function withStand(tv, inch) {
  const { w } = panelDims(inch);
  const g = new THREE.Group();
  tv.position.y = 0.09; g.add(tv);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.6, roughness: 0.35 });
  const blade = new RoundedBoxGeometry(0.022, 0.13, 0.014, 2, 0.005);
  [-1, 1].forEach((s) => {
    const foot = new THREE.Group();
    const a = new THREE.Mesh(blade, footMat); a.rotation.x = 0.62; a.position.set(0, 0.053, 0.06);
    const b = new THREE.Mesh(blade, footMat); b.rotation.x = -0.62; b.position.set(0, 0.053, -0.02);
    foot.add(a, b);
    foot.position.set(s * (w / 2 - Math.min(0.2, w * 0.12)), 0, 0);
    foot.rotation.z = s * -0.1;
    g.add(foot);
  });
  return g;
}

/* ---------------------------------------------------------------- product wrappers */
function fromBuilder(id, loader, { scale = 1, pose = 0, rotateY = 0 } = {}) {
  const m = BUILDERS[id](loader);
  m.apply(pose); m.update(0, 0);
  const wrap = new THREE.Group();
  m.group.rotation.y = rotateY;
  wrap.add(m.group);
  wrap.scale.setScalar(scale);
  return wrap;
}

export function buildAR(item, loader) {
  let obj;
  switch (item.group) {
    case 'tv': obj = panel({ inch: item.size, screen: load(loader, 'assets/img/screen-hummingbird.jpg'), chin: 0.006 }); break;
    case 'tv-stand': obj = withStand(panel({ inch: item.size, screen: load(loader, 'assets/img/screen-hummingbird.jpg'), chin: 0.006 }), item.size); break;
    case 'ifpd': obj = panel({ inch: item.size, screen: ifpdScreen(), bezel: 0.022, depth: 0.09 }); break;
    case 'display': obj = panel({ inch: item.size, screen: load(loader, 'assets/products/menu-4.jpg'), bezel: 0.01, depth: 0.06 }); break;
    case 'display-info': obj = panel({ inch: item.size, screen: infoScreen(), bezel: 0.01, depth: 0.06 }); break;
    case 'led': obj = fromBuilder('led', loader, { scale: 0.81 }); break;            // 4.2 m model → 3.4 m wall
    case 'kiosk': obj = fromBuilder('kiosk', loader, { scale: 0.88 }); break;        // ≈ 1.9 m tall, 43″ screen
    case 'camera': obj = fromBuilder('camera', loader, { scale: 0.1 }); break;       // ≈ 17 cm wide
    case 'visualizer': obj = fromBuilder('visualizer', loader, { scale: 0.28, pose: 5 }); break; // ≈ 42 cm base
    default: throw new Error('unknown AR item ' + item.id);
  }
  const root = new THREE.Group();
  root.name = item.id;
  root.add(obj);
  return root;
}

// Normalise origin after textures/geometry are ready: floor items sit on y=0
// centred in x/z; wall items have their back face at z=0.
export function finalize(root, item) {
  sanitize(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  const inner = root.children[0];
  inner.position.x -= c.x;
  inner.position.y -= box.min.y;
  inner.position.z -= item.placement === 'wall' ? box.min.z : c.z;
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  return { w: +size.x.toFixed(3), h: +size.y.toFixed(3), d: +size.z.toFixed(3) };
}
