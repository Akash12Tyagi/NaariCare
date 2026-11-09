// "See it in your room" — a true-to-scale 3D living room.
// Everything is in metres: the TV is sized from its real diagonal (16:9),
// the sofa sits at the visitor's chosen viewing distance, and the screen
// lights the room through an area light. Day/night, three camera views.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const ROOM_W = 6.4, ROOM_D = 6.2, ROOM_H = 2.9;
const CONSOLE_TOP = 0.46;
const IN = 0.0254;
export const tvDims = (inch) => ({ w: inch * IN * 0.8716, h: inch * IN * 0.4903 });

/* ------------------------------------------------------------ textures */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

function woodFloor() {
  return canvasTex(1024, 1024, (g, W, H) => {
    const rows = 8, rh = H / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd(0, 400);
      while (x < W) {
        const len = rnd(380, 640);
        const l = rnd(38, 50), hue = rnd(26, 32);
        g.fillStyle = `hsl(${hue} 38% ${l}%)`;
        g.fillRect(x, r * rh, len, rh);
        for (let k = 0; k < 14; k++) {             // grain
          g.strokeStyle = `hsla(${hue} 40% ${l - rnd(6, 14)}% / ${rnd(0.15, 0.35)})`;
          g.lineWidth = rnd(0.6, 2);
          const y = r * rh + rnd(4, rh - 4);
          g.beginPath(); g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + rnd(-6, 6), x + len * 0.6, y + rnd(-6, 6), x + len, y + rnd(-3, 3));
          g.stroke();
        }
        g.fillStyle = 'rgba(30,18,8,.55)';
        g.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(30,18,8,.6)';
      g.fillRect(0, r * rh, W, 2);
    }
  }, [5, 5]);
}

function paint(base) {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 7;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  }, [4, 2]);
}

function rugTex() {
  return canvasTex(1024, 640, (g, W, H) => {
    g.fillStyle = '#d9cdb6'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#105F42'; g.lineWidth = 26; g.strokeRect(40, 40, W - 80, H - 80);
    g.strokeStyle = '#B8D433'; g.lineWidth = 6; g.strokeRect(84, 84, W - 168, H - 168);
    g.fillStyle = 'rgba(16,95,66,.18)';
    for (let x = 140; x < W - 120; x += 64) for (let y = 140; y < H - 120; y += 64) {
      g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y); g.fill();
    }
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 16; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    g.putImageData(img, 0, 0);
  });
}

function glowTex() {
  return canvasTex(256, 256, (g, W, H) => {
    const r = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  });
}

function skyTex() {
  return canvasTex(256, 512, (g, W, H) => {
    const s = g.createLinearGradient(0, 0, 0, H);
    s.addColorStop(0, '#9cc8ef'); s.addColorStop(0.65, '#e8f1f6'); s.addColorStop(1, '#f6efe0');
    g.fillStyle = s; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(90,120,90,.55)';                    // distant trees
    for (let x = 0; x < W; x += 18) { g.beginPath(); g.arc(x, H * 0.82, rnd(18, 34), 0, Math.PI * 2); g.fill(); }
  });
}

/* --------------------------------------------------------------- labels */
function makeLabel(scale = 1) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 160;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.renderOrder = 10;
  sprite.scale.set(0.72 * scale, 0.15 * scale, 1);
  let last = '';
  function set(text, accent = '#B8D433') {
    if (text === last) return;
    last = text;
    g.clearRect(0, 0, c.width, c.height);
    g.font = '600 64px Inter, Arial, sans-serif';
    const tw = Math.min(g.measureText(text).width + 70, c.width - 8);
    const x = (c.width - tw) / 2;
    g.beginPath(); g.roundRect(x, 24, tw, 112, 56);
    g.fillStyle = accent; g.fill();
    g.fillStyle = '#231F20'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, c.width / 2, 82);
    tex.needsUpdate = true;
  }
  return { sprite, set };
}

// Dimension line made of a bar and two end ticks (unit length along X, scaled).
function makeDimension(color = 0xb8d433) {
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 });
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 0.012), mat);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.012), mat);
  const t2 = t1.clone();
  [bar, t1, t2].forEach((m) => { m.renderOrder = 9; g.add(m); });
  function setLength(L) { bar.scale.x = Math.max(L, 0.001); t1.position.x = -L / 2; t2.position.x = L / 2; }
  return { group: g, setLength };
}

/* ---------------------------------------------------------------- scene */
export function createRoomPreview({ canvas, manager, reduced, screens }) {
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061712);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.05, 40);
  const loader = new THREE.TextureLoader(manager);

  /* ---- materials ---- */
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: woodFloor(), roughness: 0.55, metalness: 0.0 }),
    wall: new THREE.MeshStandardMaterial({ map: paint('#e4ddd0'), roughness: 0.95 }),
    cut: new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: 0.9 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x0f2a22, roughness: 0.8 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x5a3b26, roughness: 0.55 }),
    walnutDark: new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.6 }),
    backing: new THREE.MeshStandardMaterial({ color: 0x0d3328, roughness: 0.85 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xbdb3a1, roughness: 1.0 }),
    fabricDark: new THREE.MeshStandardMaterial({ color: 0xa79d8b, roughness: 1.0 }),
    mustard: new THREE.MeshStandardMaterial({ color: 0xd9a514, roughness: 1.0 }),
    green: new THREE.MeshStandardMaterial({ color: 0x105f42, roughness: 1.0 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: 0x15191a, metalness: 0.75, roughness: 0.35 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8913f, metalness: 0.9, roughness: 0.3 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.7, side: THREE.DoubleSide }),
    pot: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 }),
    person: new THREE.MeshStandardMaterial({ color: 0xd7d2c8, roughness: 0.75 }),
    rug: new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1.0 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1a1f1e, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.55 }),
  };
  const shadowy = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  /* ---- shell: floor slab + two cut-away walls (architectural model look) ---- */
  const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.14, ROOM_D), [M.slab, M.slab, M.floor, M.slab, M.slab, M.slab]);
  floor.position.set(0, -0.07, ROOM_D / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, 0.14), [M.cut, M.cut, M.cut, M.cut, M.wall, M.cut]);
  backWall.position.set(0, ROOM_H / 2, -0.07);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // left wall with a window opening (built from four pieces)
  const LX = -ROOM_W / 2 - 0.07;
  const win = { z0: 1.9, z1: 3.9, y0: 0.75, y1: 2.35 };
  const wallPiece = (z0, z1, y0, y1) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, y1 - y0, z1 - z0), [M.wall, M.cut, M.cut, M.cut, M.cut, M.cut]);
    m.position.set(LX, (y0 + y1) / 2, (z0 + z1) / 2);
    m.receiveShadow = true; m.castShadow = true;
    scene.add(m);
  };
  wallPiece(0, win.z0, 0, ROOM_H); wallPiece(win.z1, ROOM_D, 0, ROOM_H);
  wallPiece(win.z0, win.z1, 0, win.y0); wallPiece(win.z0, win.z1, win.y1, ROOM_H);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(win.z1 - win.z0, win.y1 - win.y0), new THREE.MeshBasicMaterial({ map: skyTex() }));
  sky.rotation.y = Math.PI / 2;
  sky.position.set(LX - 0.06, (win.y0 + win.y1) / 2, (win.z0 + win.z1) / 2);
  scene.add(sky);
  // window frame + mullion
  [[0.06, win.y1 - win.y0, 0.05, (win.y0 + win.y1) / 2, win.z0], [0.06, win.y1 - win.y0, 0.05, (win.y0 + win.y1) / 2, win.z1],
   [0.06, 0.05, win.z1 - win.z0, win.y0, (win.z0 + win.z1) / 2], [0.06, 0.05, win.z1 - win.z0, win.y1, (win.z0 + win.z1) / 2],
   [0.04, win.y1 - win.y0, 0.035, (win.y0 + win.y1) / 2, (win.z0 + win.z1) / 2]].forEach(([w, h, d, y, z]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.cut); f.position.set(LX + 0.02, y, z); scene.add(f);
  });
  // sheer curtains
  const sheer = new THREE.MeshStandardMaterial({ color: 0xf6f1e7, transparent: true, opacity: 0.55, roughness: 1, side: THREE.DoubleSide });
  [win.z0 - 0.25, win.z1 + 0.25].forEach((z) => {
    const geo = new THREE.PlaneGeometry(0.55, ROOM_H - 0.15, 24, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 34) * 0.03);
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, sheer);
    c.rotation.y = Math.PI / 2;
    c.position.set(LX + 0.12, (ROOM_H - 0.15) / 2, z);
    scene.add(c);
  });

  // skirting
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.08, 0.015), M.cut);
  skirt.position.set(0, 0.04, 0.008); scene.add(skirt);

  /* ---- feature wall: walnut slats on a deep-green backing ---- */
  const FEAT_W = 3.3;
  const backing = new THREE.Mesh(new THREE.BoxGeometry(FEAT_W, ROOM_H, 0.02), M.backing);
  backing.position.set(0, ROOM_H / 2, 0.01); backing.receiveShadow = true; scene.add(backing);
  const SLATS = 34;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, ROOM_H, 0.03), M.walnut, SLATS);
  const dm = new THREE.Object3D();
  for (let i = 0; i < SLATS; i++) {
    dm.position.set(-FEAT_W / 2 + 0.05 + i * ((FEAT_W - 0.1) / (SLATS - 1)), ROOM_H / 2, 0.035);
    dm.updateMatrix(); slats.setMatrixAt(i, dm.matrix);
  }
  slats.receiveShadow = true; scene.add(slats);

  /* ---- media console + soundbar ---- */
  const consoleG = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.36, 0.42, 3, 0.02), M.walnutDark);
  body.position.y = 0.28;
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.24, 0.03, 0.44, 2, 0.01), M.walnut);
  top.position.y = CONSOLE_TOP - 0.015;
  consoleG.add(body, top);
  for (let i = 0; i < 4; i++) {           // fluted doors
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.01), M.walnut);
    d.position.set(-0.81 + i * 0.54, 0.28, 0.215); consoleG.add(d);
  }
  [-1, 1].forEach((s) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.36), M.brass); leg.position.set(s * 0.95, 0.05, 0); consoleG.add(leg); });
  const soundbar = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.065, 0.1, 3, 0.025), M.blackMetal);
  soundbar.position.set(0, CONSOLE_TOP + 0.034, 0.05);
  consoleG.add(soundbar);
  // decor: books + vase
  [[0.72, 0.06, 0xb8d433], [0.72, 0.1, 0x105f42], [0.72, 0.14, 0xf3dfbe]].forEach(([x, y, c]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.19), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
    b.position.set(x, CONSOLE_TOP + y - 0.04, 0); b.rotation.y = rnd(-0.15, 0.15); consoleG.add(b);
  });
  const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.08, 0.08], [0.05, 0.2], [0.035, 0.26], [0.045, 0.28]].map(([x, y]) => new THREE.Vector2(x, y)), 24), M.pot);
  vase.position.set(-0.8, CONSOLE_TOP, 0.02); consoleG.add(vase);
  consoleG.position.set(0, 0, 0.27);
  shadowy(consoleG);
  scene.add(consoleG);

  /* ---- TV (unit geometry, scaled to real dimensions) ---- */
  const tv = new THREE.Group();
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x15191a, metalness: 0.8, roughness: 0.35, clearcoat: 0.6 }));
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), screenMat);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.12, clearcoat: 1 });
  const tvGlass = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glassMat);
  tv.add(tvFrame, tvScreen, tvGlass);
  tvFrame.castShadow = true;
  scene.add(tv);
  const wallGlowMat = new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wallGlowMat);
  scene.add(wallGlow);

  const screenTex = {};
  for (const [k, url] of Object.entries(screens)) {
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    screenTex[k] = t;
  }
  const screenColor = { hummingbird: 0xff8a3d, flower: 0xffa7c8 };

  const tvLight = new THREE.RectAreaLight(0xffffff, 4, 1, 1);
  scene.add(tvLight);

  /* ---- sofa ---- */
  const sofa = new THREE.Group();
  const rb = (w, h, d, r, mat) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);
  const base = rb(2.3, 0.3, 0.95, 0.05, M.fabricDark); base.position.set(0, 0.25, 0);
  const back = rb(2.3, 0.55, 0.22, 0.08, M.fabricDark); back.position.set(0, 0.62, 0.38);
  sofa.add(base, back);
  [-1, 1].forEach((s) => { const a = rb(0.2, 0.62, 0.95, 0.08, M.fabricDark); a.position.set(s * 1.13, 0.39, 0); sofa.add(a); });
  for (let i = 0; i < 3; i++) {
    const seat = rb(0.68, 0.15, 0.74, 0.06, M.fabric); seat.position.set(-0.69 + i * 0.69, 0.47, -0.08); sofa.add(seat);
    const bc = rb(0.66, 0.44, 0.17, 0.07, M.fabric); bc.position.set(-0.69 + i * 0.69, 0.78, 0.22); bc.rotation.x = -0.13; sofa.add(bc);
  }
  const p1 = rb(0.42, 0.4, 0.12, 0.06, M.mustard); p1.position.set(-0.86, 0.72, 0.1); p1.rotation.set(-0.25, 0.25, 0.12); sofa.add(p1);
  const p2 = rb(0.4, 0.38, 0.12, 0.06, M.green); p2.position.set(0.88, 0.72, 0.1); p2.rotation.set(-0.25, -0.3, -0.1); sofa.add(p2);
  [[-1.05, -0.4], [1.05, -0.4], [-1.05, 0.4], [1.05, 0.4]].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.1, 10), M.brass); l.position.set(x, 0.05, z); sofa.add(l);
  });
  shadowy(sofa);
  scene.add(sofa);

  /* ---- rug + coffee table ---- */
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), M.rug);
  rug.rotation.x = -Math.PI / 2; rug.position.y = 0.004; rug.receiveShadow = true;
  scene.add(rug);
  const table = new THREE.Group();
  const tt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 48), M.walnut); tt.position.y = 0.4;
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.38, 32), M.walnutDark); tb.position.y = 0.19;
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 32), M.brass); tray.position.set(0.12, 0.425, 0.05);
  const remote = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.018, 0.17, 2, 0.008), M.blackMetal); remote.position.set(-0.15, 0.427, -0.05); remote.rotation.y = 0.5;
  table.add(tt, tb, tray, remote);
  shadowy(table);
  scene.add(table);

  /* ---- plant ---- */
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.42, 32), M.pot); pot.position.y = 0.21; plant.add(pot);
  for (let i = 0; i < 14; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.leaf);
    leaf.scale.set(0.09, 0.32, 0.012);
    const a = (i / 14) * Math.PI * 2, tilt = rnd(0.25, 0.75);
    leaf.position.set(Math.cos(a) * 0.12, 0.62 + rnd(0, 0.45), Math.sin(a) * 0.12);
    leaf.rotation.set(Math.sin(a) * tilt, -a, Math.cos(a) * -tilt);
    plant.add(leaf);
  }
  plant.position.set(-2.05, 0, 0.45);
  shadowy(plant); scene.add(plant);

  /* ---- floor lamp ---- */
  const lamp = new THREE.Group();
  const lbase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 32), M.blackMetal); lbase.position.y = 0.015;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 12), M.brass); pole.position.y = 0.76;
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf4ead6, emissive: 0xffc77a, emissiveIntensity: 0, roughness: 1, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.3, 32, 1, true), shadeMat); shade.position.y = 1.58;
  lamp.add(lbase, pole, shade);
  const lampLight = new THREE.PointLight(0xffbf73, 0, 6, 1.6);
  lampLight.position.y = 1.5; lamp.add(lampLight);
  shadowy(lamp); shade.castShadow = false;
  scene.add(lamp);

  /* ---- person for scale (1.75 m) ---- */
  const person = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.18, 8, 20), M.person); torso.position.y = 0.75; torso.scale.set(1, 1, 0.72);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 16), M.person); head.position.y = 1.64;
  person.add(torso, head);
  person.position.set(-2.25, 0, 2.2); person.rotation.y = 0.9;
  shadowy(person); scene.add(person);

  /* ---- dimensions ---- */
  const widthDim = makeDimension(); scene.add(widthDim.group);
  const distDim = makeDimension(); distDim.group.rotation.y = Math.PI / 2; scene.add(distDim.group);
  const sizeLabel = makeLabel(1.7); scene.add(sizeLabel.sprite);
  const distLabel = makeLabel(1.9); scene.add(distLabel.sprite);
  const personLabel = makeLabel(1.1); scene.add(personLabel.sprite);
  personLabel.set('1.75 m', '#EEF1EA');
  personLabel.sprite.position.set(-2.25, 1.92, 2.2);

  /* ---- lighting ---- */
  const hemi = new THREE.HemisphereLight(0xfff4e2, 0x3a2a1c, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.5);
  sun.position.set(-7, 4.2, 3.4); sun.target.position.set(0.5, 0, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4, bottom: -2, near: 1, far: 16 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  /* ---- state ---- */
  const S = { size: 55, dist: 2.6, night: 0 };
  const T = { size: 55, dist: 2.6, night: 0 };
  let screenKey = 'hummingbird';
  const lightColor = new THREE.Color(screenColor.hummingbird);
  const targetLight = lightColor.clone();

  function layout() {
    const { w, h } = tvDims(S.size);
    const cy = Math.max(1.08, CONSOLE_TOP + 0.16 + h / 2);
    tv.position.set(0, cy, 0.075);
    tvFrame.scale.set(w + 0.012, h + 0.012, 0.03);
    tvScreen.scale.set(w, h, 1); tvScreen.position.z = 0.0155;
    tvGlass.scale.set(w, h, 1); tvGlass.position.z = 0.016;
    wallGlow.scale.set(w * 1.9, h * 2.1, 1); wallGlow.position.set(0, cy, 0.052);
    tvLight.width = w; tvLight.height = h;
    tvLight.position.set(0, cy, 0.095);
    tvLight.lookAt(0, cy, 5);

    const cw = Math.max(1.0, Math.min(2.2, w + 0.25)) / 2.2;
    consoleG.scale.set(cw, 1, 1);

    const d = S.dist;
    sofa.position.set(0, 0, d + 0.12);
    const gap = d - 0.4 - 0.45;                       // free floor between console and sofa front
    const showTable = gap > 1.15;
    table.visible = showTable;
    table.position.set(0, 0, d - 0.42 - 0.62);
    rug.position.set(0, 0.004, d - 0.6);
    rug.scale.set(1, Math.min(1, Math.max(0.5, (gap + 0.4) / 1.7)), 1);
    lamp.position.set(-1.5, 0, d + 0.35);

    widthDim.setLength(w);
    widthDim.group.position.set(0, cy + h / 2 + 0.11, 0.09);
    sizeLabel.sprite.position.set(0, cy + h / 2 + 0.33, 0.12);
    sizeLabel.set(`${Math.round(S.size)}″ · ${w.toFixed(2)} m wide`);

    distDim.setLength(d - 0.06);
    distDim.group.position.set(1.7, 0.02, (d + 0.06) / 2);
    distLabel.sprite.position.set(1.7, 0.28, d / 2);
    distLabel.set(`${d.toFixed(1)} m to your eyes`, '#FFCB05');
  }

  function applyLighting() {
    const n = S.night;
    hemi.intensity = THREE.MathUtils.lerp(1.1, 0.06, n);
    sun.intensity = THREE.MathUtils.lerp(2.6, 0.0, n);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.45, 0.05, n);
    lampLight.intensity = THREE.MathUtils.lerp(0.0, 2.2, n);
    shadeMat.emissiveIntensity = THREE.MathUtils.lerp(0.0, 1.2, n);
    const { w, h } = tvDims(S.size);
    tvLight.intensity = THREE.MathUtils.lerp(2.5, 22, n) * Math.min(1.4, 0.7 / Math.sqrt(w * h));
    tvLight.color.copy(lightColor);
    wallGlowMat.color.copy(lightColor);
    wallGlowMat.opacity = THREE.MathUtils.lerp(0.08, 0.55, n);
    sky.material.color.setScalar(THREE.MathUtils.lerp(1, 0.08, n)).lerp(new THREE.Color(0x1a2a55), n * 0.6);
    screenMat.color.setScalar(THREE.MathUtils.lerp(1.0, 0.92, n));
    scene.background.setRGB(THREE.MathUtils.lerp(0.025, 0.006, n), THREE.MathUtils.lerp(0.07, 0.02, n), THREE.MathUtils.lerp(0.055, 0.016, n));
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 1.15, n);
  }

  /* ---- camera views ---- */
  // fov: the sofa view uses a wider, human-eye-like field of view
  let portrait = false;
  const presets = {
    room: () => portrait
      ? { pos: [1.7, 2.7, S.dist + 3.9], target: [-0.25, 0.85, S.dist * 0.4], fov: 52 }
      : { pos: [2.75, 2.05, S.dist + 2.55], target: [-0.25, 0.95, S.dist * 0.36], fov: 38 },
    sofa: () => ({ pos: [0.18, 1.1, S.dist + 0.1], target: [0, tv.position.y, 0], fov: portrait ? 64 : 52 }),
    side: () => ({ pos: [portrait ? 2.6 : 3.1, 1.45, S.dist * 0.55], target: [-0.6, 0.95, S.dist * 0.5], fov: portrait ? 60 : 40 }),
  };
  let view = 'room';
  const cam = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 38 };
  function snapCam() {
    const p = presets[view]();
    Object.assign(cam, { px: p.pos[0], py: p.pos[1], pz: p.pos[2], tx: p.target[0], ty: p.target[1], tz: p.target[2], fov: p.fov });
  }
  snapCam();
  camera.position.set(cam.px, cam.py, cam.pz);

  const controls = isTouch ? null : new OrbitControls(camera, canvas);
  if (controls) {
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enableZoom: false, enablePan: false, rotateSpeed: 0.55 });
    controls.target.set(cam.tx, cam.ty, cam.tz);
    controls.minPolarAngle = 0.7; controls.maxPolarAngle = 1.62;
  }
  let camTween = null;
  function goTo(name, instant) {
    view = name;
    const p = presets[name]();
    camTween?.kill();
    const from = { px: camera.position.x, py: camera.position.y, pz: camera.position.z, tx: controls ? controls.target.x : cam.tx, ty: controls ? controls.target.y : cam.ty, tz: controls ? controls.target.z : cam.tz, fov: camera.fov };
    const to = { px: p.pos[0], py: p.pos[1], pz: p.pos[2], tx: p.target[0], ty: p.target[1], tz: p.target[2], fov: p.fov };
    if (instant || reduced) { Object.assign(cam, to); applyCam(); return; }
    Object.assign(cam, from);
    if (controls) controls.enabled = false;
    camTween = window.gsap.to(cam, { ...to, duration: 1.6, ease: 'power3.inOut', onUpdate: applyCam, onComplete: () => { if (controls) controls.enabled = true; camTween = null; } });
  }
  function applyCam() {
    camera.position.set(cam.px, cam.py, cam.pz);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    if (controls) controls.target.set(cam.tx, cam.ty, cam.tz);
    else camera.lookAt(cam.tx, cam.ty, cam.tz);
  }
  applyCam();
  // in sofa view, hide dimension clutter
  const setAnnotations = (v) => { [widthDim.group, distDim.group, sizeLabel.sprite, distLabel.sprite, personLabel.sprite].forEach((o) => { o.visible = v; }); };

  /* ---- resize + visibility ---- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wasPortrait = portrait;
    portrait = w / h < 1;
    camera.updateProjectionMatrix();
    if (wasPortrait !== portrait && !camTween) { snapCam(); applyCam(); }
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);

  /* ---- loop ---- */
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 5);
    let changed = false;
    for (const key of ['size', 'dist', 'night']) {
      if (Math.abs(T[key] - S[key]) > 1e-4) { S[key] += (T[key] - S[key]) * k; changed = true; }
    }
    lightColor.lerp(targetLight, 1 - Math.exp(-dt * 4));
    if (changed) { layout(); if (!camTween && view !== 'room') { snapCam(); applyCam(); } }
    applyLighting();
    setAnnotations(view !== 'sofa');
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  layout(); applyLighting();
  requestAnimationFrame(tick);

  return {
    setSize(inch) { T.size = inch; },
    setDistance(m) { T.dist = m; },
    setNight(on) { T.night = on ? 1 : 0; },
    setScreen(key) {
      if (!screenTex[key]) return;
      screenKey = key;
      screenMat.map = screenTex[key]; screenMat.needsUpdate = true;
      targetLight.set(screenColor[key] || 0xffffff);
    },
    setView: (name) => goTo(name),
    get view() { return view; },
    get screen() { return screenKey; },
  };
}
