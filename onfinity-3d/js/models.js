// Procedural, animatable models of Onfinity products.
// Each builder returns:
//   group      – THREE.Group to add to the scene (sits on y = 0)
//   hotspots   – { name: Object3D } anchors for the scroll callouts
//   cams       – 6 camera stations [hero, s1..s5]: { pos, target, roll }
//   apply(p)   – p = continuous station progress 0..5 (scrubbed by scroll)
//   update(t, dt)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const P = 'assets/products/';
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const bell = (p, c, w = 0.6) => smooth(c - w, c, p) * (1 - smooth(c, c + w, p));
const lerp = THREE.MathUtils.lerp;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function loadTex(loader, url) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function powerIcon(g, cx, cy, r, color, lw) {
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy + r * 0.12, r, -Math.PI / 2 + 0.75, -Math.PI / 2 - 0.75 + Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - r * 0.95); g.lineTo(cx, cy + r * 0.05); g.stroke();
  g.beginPath(); g.moveTo(cx - r * 0.55, cy - r * 0.95); g.lineTo(cx + r * 0.55, cy - r * 0.95); g.stroke();
}
function wordmark(text = 'Ōnfinity', fg = '#ffffff', bg = '#050607', w = 1024, h = 256, size = 120) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `500 ${size}px Inter, Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(255,255,255,.35)'; g.shadowBlur = 8;
    g.fillText(text, w / 2, h / 2 + 6);
  });
}
const anchor = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
const shadowed = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
const cam = (pos, target, roll = 0) => ({ pos, target, roll });

function person(mat, h = 1.75) {
  const g = new THREE.Group();
  const s = h / 1.75;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17 * s, 1.15 * s, 6, 16), mat);
  body.position.y = 0.75 * s; body.scale.z = 0.7;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 20, 14), mat);
  head.position.y = 1.63 * s;
  g.add(body, head);
  return g;
}

/* ===================================================================== PTZ CAMERA */
function buildCamera(loader) {
  const group = new THREE.Group();
  const graphite = new THREE.MeshPhysicalMaterial({ color: 0x2b2e31, metalness: 0.65, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x060708, metalness: 0.2, roughness: 0.08, clearcoat: 1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xbfc4c7, metalness: 1, roughness: 0.25 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.85 });

  // base (lathe, slightly oval)
  const prof = [[0, 0], [0.76, 0], [0.82, 0.04], [0.85, 0.2], [0.82, 0.36], [0.72, 0.47], [0.56, 0.52], [0, 0.52]].map(([x, y]) => new THREE.Vector2(x, y));
  const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), graphite);
  base.scale.z = 0.86;
  group.add(base);
  // glossy front band with logo
  const bandTex = wordmark('Ōnfinity', '#f4f6f5', '#040506', 1024, 256, 96);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.858, 0.858, 0.25, 64, 1, true, -0.72, 1.44), new THREE.MeshPhysicalMaterial({ map: bandTex, roughness: 0.1, clearcoat: 1, metalness: 0.1 }));
  band.scale.z = 0.86; band.position.y = 0.2;
  group.add(band);
  // top disc + silver ring
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.03, 64), gloss); top.position.y = 0.535; group.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.515, 0.012, 12, 96), silver); ring.rotation.x = Math.PI / 2; ring.position.y = 0.535; group.add(ring);
  // rear ports
  for (let i = 0; i < 4; i++) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.03), rubber);
    port.position.set(-0.24 + i * 0.16, 0.2, -0.72); group.add(port);
  }

  // pan group (yoke + head)
  const pan = new THREE.Group(); pan.position.y = 0.55; group.add(pan);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.07, 0.3, 3, 0.03), graphite); foot.position.set(0.02, 0.035, 0.06); pan.add(foot);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.04, 0.0), new THREE.Vector3(0.38, 0.16, 0), new THREE.Vector3(0.5, 0.45, 0), new THREE.Vector3(0.52, 0.78, 0), new THREE.Vector3(0.5, 0.95, 0),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.085, 20), graphite); arm.scale.z = 1.5; pan.add(arm);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.16, 48), graphite); hub.rotation.z = Math.PI / 2; hub.position.set(0.48, 0.95, 0); pan.add(hub);
  const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 48), gloss); hubCap.rotation.z = Math.PI / 2; hubCap.position.set(0.565, 0.95, 0); pan.add(hubCap);

  // tilt group (head)
  const tilt = new THREE.Group(); tilt.position.set(0, 0.95, 0); pan.add(tilt);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 72), graphite); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.02; tilt.add(barrel);
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), graphite); back.rotation.x = -Math.PI / 2; back.scale.y = 0.35; back.position.z = -0.43; tilt.add(back);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.401, 0.004, 8, 96), rubber); seam.position.z = 0.1; tilt.add(seam);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.022, 16, 96), silver); rim.position.z = 0.47; tilt.add(rim);
  const face = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.39, 72), gloss); face.position.z = 0.468; tilt.add(face);
  // lens rings recess
  const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.2, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })); recess.rotation.x = Math.PI / 2; recess.position.z = 0.37; tilt.add(recess);
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.205 - i * 0.012, 0.005, 8, 64), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x55595e : 0x2a2d30, metalness: 0.9, roughness: 0.25 }));
    r.position.z = 0.45 - i * 0.03; tilt.add(r);
  }
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0, roughness: 0.02, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600] });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 3.2), glassMat); glass.rotation.x = Math.PI / 2; glass.position.z = 0.27; tilt.add(glass);
  const coat = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.15, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2fd3a5).multiplyScalar(0.55), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); coat.position.z = 0.3; tilt.add(coat);
  const coat2 = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.12, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8a5cff).multiplyScalar(0.6), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); coat2.position.z = 0.305; tilt.add(coat2);
  const zoomEl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5), glassMat); zoomEl.rotation.x = Math.PI / 2; zoomEl.position.z = 0.2; tilt.add(zoomEl);
  const sensorGlow = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3cff9e).multiplyScalar(1.5) })); sensorGlow.position.z = 0.19; tilt.add(sensorGlow);
  // tally light
  const tally = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8d433).multiplyScalar(3) }));
  tally.position.set(0.2, 0.3, 0.42); tilt.add(tally);

  // field-of-view frustum + tracking reticle
  const fovGeo = new THREE.ConeGeometry(1.4, 3.2, 4, 1, true); fovGeo.rotateX(-Math.PI / 2); fovGeo.translate(0, 0, 1.6 + 0.47);
  const fovMat = new THREE.MeshBasicMaterial({ color: 0xb8d433, transparent: true, opacity: 0, wireframe: true, depthWrite: false });
  const fov = new THREE.Mesh(fovGeo, fovMat); fov.rotation.z = Math.PI / 4; tilt.add(fov);
  const reticle = new THREE.Group();
  const retMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8d433).multiplyScalar(2), transparent: true, opacity: 0 });
  reticle.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 8, 64), retMat));
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), retMat); t.rotation.z = (i * Math.PI) / 2; t.position.set(Math.cos(i * Math.PI / 2) * 0.3, Math.sin(i * Math.PI / 2) * 0.3, 0); reticle.add(t); }
  const target = person(new THREE.MeshStandardMaterial({ color: 0xd8d3c9, roughness: 0.8, transparent: true, opacity: 0 }), 1.0);
  group.add(reticle, target);

  shadowed(group);
  const hotspots = { lens: anchor(tilt, 0, 0.2, 0.5), yoke: anchor(pan, 0.52, 0.55, 0), base: anchor(group, 0, 0.22, 0.75) };
  const cams = [
    cam([2.3, 1.55, 3.6], [0, 0.95, 0]),
    cam([0.35, 1.5, 1.55], [0, 1.45, 0.4], 0.04),
    cam([-3.0, 2.6, 1.4], [0, 0.95, 0], -0.05),
    cam([1.1, 1.0, 3.2], [0, 1.2, 0.5], 0.02),
    cam([3.3, 2.1, -0.6], [0, 1.0, 0.6], 0.03),
    cam([-1.6, 0.55, -2.4], [0, 0.4, -0.2], -0.04),
  ];
  let P = 0;
  function apply(p) { P = p; }
  function update(t) {
    const ptz = smooth(1.3, 1.8, P) * (1 - smooth(2.4, 2.9, P));
    const track = smooth(3.4, 3.8, P) * (1 - smooth(4.4, 4.8, P));
    // reticle target wandering in front of the camera
    const tx = Math.sin(t * 0.7) * 1.4, ty = 1.1 + Math.sin(t * 1.1) * 0.25, tz = 2.6;
    reticle.position.set(tx, ty + 0.6, tz); reticle.lookAt(0, 1.5, 0);
    target.position.set(tx, 0, tz);
    retMat.opacity = track; target.children.forEach((c) => { c.material.opacity = track * 0.8; });
    const trackPan = Math.atan2(tx, tz), trackTilt = -Math.atan2(ty + 0.6 - 1.5, tz) * 0.8;
    const idlePan = Math.sin(t * 0.35) * 0.08;
    pan.rotation.y = idlePan + ptz * Math.sin(t * 0.9) * 0.75 + track * (trackPan - idlePan);
    tilt.rotation.x = ptz * Math.sin(t * 0.6) * 0.3 + track * trackTilt;
    const zoom = smooth(0.4, 1.0, P) * (1 - smooth(1.3, 1.7, P));
    zoomEl.position.z = 0.2 - zoom * 0.1 * (0.5 + 0.5 * Math.sin(t * 1.4));
    fovMat.opacity = (smooth(2.4, 2.9, P) * (1 - smooth(3.5, 3.9, P))) * 0.35 + track * 0.15;
    tally.material.color.setScalar(0).add(new THREE.Color(0xb8d433).multiplyScalar(1.5 + Math.sin(t * 4) * 1.5));
  }
  return { group, hotspots, cams, apply, update, floor: 0 };
}

/* ===================================================================== LED WALL */
function buildLED(loader) {
  const group = new THREE.Group();
  const COLS = 10, ROWS = 3, C = 0.42;
  const W = COLS * C, H = ROWS * C;
  const tex = loadTex(loader, P + 'led-screen.jpg');
  const ledMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uTime: { value: 0 }, uWall: { value: new THREE.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float uTime; uniform vec2 uWall; varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        float imgA = 922.0/260.0, wallA = uWall.x/uWall.y;
        uv.x = 0.5 + (uv.x - 0.5) * (wallA / imgA);
        vec3 c = texture2D(map, uv).rgb;
        vec2 g = vUv * vec2(720.0, 720.0 / wallA);
        vec2 f = fract(g) - 0.5;
        float w = fwidth(g.x);
        float dotm = smoothstep(0.42, 0.22, length(f));
        float m = mix(dotm * 1.45, 1.0, smoothstep(0.08, 0.35, w));
        // per-dot RGB sub-LEDs when very close
        vec3 sub = vec3(step(f.x, -0.12), step(-0.12, f.x) * step(f.x, 0.12), step(0.12, f.x));
        vec3 rgb = mix(c * sub * 2.6, c, smoothstep(0.02, 0.06, w));
        gl_FragColor = vec4(mix(c, rgb, 1.0 - smoothstep(0.02, 0.06, w)) * m * 0.92, 1.0);
      }`,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x15181a, metalness: 0.7, roughness: 0.4 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x24282b, metalness: 0.6, roughness: 0.5 });
  const wall = new THREE.Group(); wall.position.y = 1.0 + H / 2; group.add(wall);
  const cabinets = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cab = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(C - 0.004, C - 0.004, 0.09), frameMat); box.position.z = -0.046;
    const geo = new THREE.PlaneGeometry(C - 0.006, C - 0.006);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (c + uv.getX(i)) / COLS, (r + uv.getY(i)) / ROWS);
    const face = new THREE.Mesh(geo, ledMat);
    // rear bracing visible when exploded
    const brace = new THREE.Mesh(new THREE.BoxGeometry(C * 0.7, 0.03, 0.04), backMat); brace.position.z = -0.1;
    cab.add(box, face, brace);
    const home = new THREE.Vector3(-W / 2 + C / 2 + c * C, -H / 2 + C / 2 + r * C, 0);
    cab.position.copy(home);
    const seed = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random());
    cabinets.push({ cab, home, seed, rx: (Math.random() - 0.5) * 0.6, ry: (Math.random() - 0.5) * 0.8 });
    wall.add(cab);
  }
  // support truss + floor feet
  const truss = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.06, 0.06), backMat); truss.position.set(0, -H / 2 - 0.05, -0.12); wall.add(truss);
  [-1, 1].forEach((s) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0 + H / 2 - 0.05, 0.08), backMat); leg.position.set(s * W * 0.42, -(1.0 + H / 2 - 0.05) / 2 - H / 2 - 0.05 + 0.0, -0.14); wall.add(leg); });
  const logoTex = wordmark('Ōnfinity', '#c9cfc9', '#0b0d0e', 512, 128, 60);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.08), new THREE.MeshBasicMaterial({ map: logoTex })); logo.position.set(0, -H / 2 - 0.05, 0.01); wall.add(logo);
  // people for scale
  const pm = new THREE.MeshStandardMaterial({ color: 0x0b0d0e, roughness: 0.9 });
  const p1 = person(pm, 1.78); p1.position.set(2.75, 0, 0.9); group.add(p1);
  const p2 = person(pm, 1.65); p2.position.set(3.2, 0, 0.6); group.add(p2);
  const glow = new THREE.RectAreaLight(0xbcd6ff, 6, W, H); glow.position.set(0, wall.position.y, 0.05); glow.lookAt(0, wall.position.y, 5); group.add(glow);

  shadowed(group);
  const hotspots = {
    cabinet: anchor(cabinets[COLS * 2 + COLS - 1].cab, 0, 0, 0.02),
    pixel: anchor(wall, -0.6, 0.15, 0.02),
    center: anchor(wall, 0, 0, 0.02),
    edge: anchor(cabinets[COLS - 1].cab, C / 2, -C / 2, 0),
  };
  const cams = [
    cam([4.2, 2.4, 6.2], [0, 1.6, 0]),
    cam([3.6, 2.9, 3.2], [1.0, 1.7, 0], 0.05),
    cam([-0.45, 1.83, 0.42], [-0.6, 1.75, 0], 0.0),
    cam([-4.8, 1.2, 4.6], [0, 1.6, 0], -0.04),
    cam([3.9, 0.35, 1.3], [1.8, 1.4, 0], 0.08),
    cam([0, 1.7, 6.8], [0, 1.6, 0]),
  ];
  let Pv = 0;
  return {
    group, hotspots, cams, floor: 0,
    apply(p) { Pv = p; },
    update(t) {
      ledMat.uniforms.uTime.value = t;
      const e = bell(Pv, 1, 0.7);
      cabinets.forEach(({ cab, home, seed, rx, ry }, i) => {
        cab.position.set(home.x + seed.x * e * 0.5, home.y + seed.y * e * 0.4, home.z + (0.25 + seed.z * 1.4) * e + Math.sin(t * 1.3 + i) * 0.02 * e);
        cab.rotation.set(rx * e, ry * e, 0);
      });
    },
  };
}

/* ===================================================================== KIOSK */
function buildKiosk(loader) {
  const group = new THREE.Group();
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0c0d, metalness: 0.3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd5d9db, metalness: 1, roughness: 0.22 });
  const BW = 0.78, BH = 2.0, BY = 0.14;
  const edge = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.024, BH + 0.024, 0.06, 4, 0.04), silver); edge.position.set(0, BY + BH / 2, -0.012); group.add(edge);
  const body = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.075, 4, 0.035), black); body.position.set(0, BY + BH / 2, 0); group.add(body);
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.02, 0.12, 0.42, 3, 0.02), black); plinth.position.set(0, 0.06, 0); group.add(plinth);
  const plinthTop = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.04, 0.01, 0.36), silver); plinthTop.position.set(0, 0.125, 0); group.add(plinthTop);

  const poster = loadTex(loader, P + 'kiosk-screen.jpg');
  const wayfinding = canvasTex(512, 932, (g, W, H) => {
    g.fillStyle = '#F5F3EE'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#105F42'; g.fillRect(0, 0, W, 120);
    g.fillStyle = '#fff'; g.font = '600 40px Inter, Arial'; g.fillText('You are here', 34, 76);
    powerIcon(g, W - 60, 60, 24, '#FFCB05', 7);
    g.strokeStyle = '#d8d2c6'; g.lineWidth = 3;
    const rooms = [[40, 170, 200, 160, 'Food court'], [270, 170, 200, 240, 'Electronics'], [40, 360, 200, 200, 'Fashion'], [270, 440, 200, 120, 'Pharmacy'], [40, 590, 430, 140, 'Atrium']];
    rooms.forEach(([x, y, w, h, n]) => { g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); g.fillStyle = '#231F20'; g.font = '500 26px Inter, Arial'; g.fillText(n, x + 16, y + 40); });
    g.strokeStyle = '#B8D433'; g.lineWidth = 10; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(255, 820); g.lineTo(255, 580); g.lineTo(370, 580); g.lineTo(370, 420); g.stroke();
    g.fillStyle = '#FFCB05'; g.beginPath(); g.arc(255, 820, 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#231F20'; g.font = '600 30px Inter, Arial'; g.fillText('Electronics · 2 min walk', 34, 890);
  });
  const SW = 0.66, SH = SW / 0.549;
  const screenMat = new THREE.ShaderMaterial({
    uniforms: { a: { value: poster }, b: { value: wayfinding }, uMix: { value: 0 }, uTouch: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D a, b; uniform float uMix, uTouch, uTime; varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        vec2 tp = vec2(0.5, 0.36);
        float d = distance(uv * vec2(0.549, 1.0), tp * vec2(0.549, 1.0));
        float ph = fract(uTime * 0.6);
        float ring = smoothstep(0.012, 0.0, abs(d - ph * 0.35)) * (1.0 - ph) * uTouch;
        uv += normalize(uv - tp + 1e-4) * ring * 0.01;
        float k = smoothstep(uMix - 0.04, uMix + 0.04, 1.0 - uv.y);
        vec3 c = mix(texture2D(a, uv).rgb, texture2D(b, uv).rgb, k);
        c += vec3(0.72, 0.83, 0.2) * ring * 1.5;
        c += vec3(1.0) * smoothstep(0.03, 0.0, d) * uTouch * 0.6;
        gl_FragColor = vec4(c * 0.9, 1.0);
      }`,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  const screenY = BY + BH - 0.07 - SH / 2;
  screen.position.set(0, screenY, 0.039); group.add(screen);
  const glassP = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.02, BH - 0.02), new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: 0.1, roughness: 0.02, clearcoat: 1 }));
  glassP.position.set(0, BY + BH / 2, 0.0395); group.add(glassP);
  const logoTex = canvasTex(256, 256, (g) => { g.fillStyle = '#105F42'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); powerIcon(g, 128, 128, 60, '#E9D21A', 18); });
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.075, 48), new THREE.MeshBasicMaterial({ map: logoTex }));
  logo.position.set(0, BY + 0.42, 0.04); group.add(logo);

  // wifi waves (remote updates)
  const waves = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.15 + i * 0.12, 0.01, 8, 48, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcb05).multiplyScalar(2), transparent: true, opacity: 0 }));
    m.rotation.z = Math.PI / 2 - Math.PI * 0.3; m.position.set(0, BY + BH + 0.12, 0);
    group.add(m); waves.push(m);
  }
  // OPS slot on the back
  const ops = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a1d1e, emissive: 0xb8d433, emissiveIntensity: 0 }));
  ops.position.set(0, BY + 0.7, -0.045); group.add(ops);
  const screenLight = new THREE.RectAreaLight(0xffe2b8, 1.4, SW, SH); screenLight.position.set(0, screenY, 0.05); screenLight.lookAt(0, screenY, 3); group.add(screenLight);

  shadowed(group);
  const hotspots = { screen: anchor(group, 0.22, screenY + 0.2, 0.05), logo: anchor(group, 0, BY + 0.42, 0.05), top: anchor(group, 0, BY + BH + 0.05, 0), base: anchor(group, 0.3, 0.1, 0.2) };
  const cams = [
    cam([2.2, 1.7, 3.9], [0, 1.15, 0]),
    cam([-1.5, 2.2, 1.7], [0, 1.4, 0], -0.06),
    cam([0.25, 1.15, 1.05], [0, 1.15, 0], 0.02),
    cam([-1.2, 0.9, -1.9], [0, 0.85, 0], 0.04),
    cam([0.9, 3.1, 1.6], [0, 1.9, 0], -0.03),
    cam([2.0, 0.35, 1.3], [0, 0.5, 0], 0.06),
  ];
  let Pv = 0;
  return {
    group, hotspots, cams, floor: 0,
    apply(p) { Pv = p; },
    update(t) {
      screenMat.uniforms.uTime.value = t;
      screenMat.uniforms.uTouch.value = bell(Pv, 2, 0.6);
      screenMat.uniforms.uMix.value = lerp(1.06, -0.06, smooth(3.6, 4.2, Pv) * (1 - smooth(4.6, 5.0, Pv)));
      waves.forEach((w, i) => { const ph = (t * 0.8 + i * 0.33) % 1; w.material.opacity = bell(Pv, 4, 0.6) * (1 - ph) * (ph > 0.05 ? 1 : 0); w.scale.setScalar(0.8 + ph * 0.6); });
      ops.material.emissiveIntensity = bell(Pv, 3, 0.6) * (1.2 + Math.sin(t * 5) * 0.4);
    },
  };
}

/* ===================================================================== VISUALIZER */
function buildVisualizer(loader) {
  const group = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xcfd4d8, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const grey = new THREE.MeshStandardMaterial({ color: 0xc9ced2, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.4 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.07, 1.25, 4, 0.03), white); base.position.y = 0.035; group.add(base);
  const stageMat = new THREE.MeshStandardMaterial({ color: 0xb9c3d8, emissive: 0xdfe6ff, emissiveIntensity: 0.02, roughness: 0.6 });
  const stage = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.72), stageMat); stage.rotation.x = -Math.PI / 2; stage.position.set(-0.05, 0.072, 0.12); group.add(stage);
  // control strip
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.004, 0.2), new THREE.MeshStandardMaterial({ color: 0xe9ecee, roughness: 0.4 })); strip.position.set(0, 0.072, -0.45); group.add(strip);
  const btns = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(i === 0 ? new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24) : new RoundedBoxGeometry(0.035, 0.012, 0.09, 2, 0.006), i === 0 ? grey : grey);
    b.position.set(-0.5 + i * 0.12, 0.08, -0.45); group.add(b); btns.push(b);
  }
  // side lamp bars (hinged)
  const lamps = [];
  [-1, 1].forEach((s) => {
    const hinge = new THREE.Group(); hinge.position.set(s * 0.72, 0.07, 0.1);
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.07, 0.9, 3, 0.02), white); bar.position.y = 0.035; hinge.add(bar);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff })); led.position.set(-s * 0.036, 0.04, 0); hinge.add(led);
    group.add(hinge); lamps.push({ hinge, led, s });
  });
  // document on the stage
  const doc = canvasTex(700, 960, (g, W, H) => {
    g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#105F42'; g.font = '700 48px Inter, Arial'; g.fillText('Photosynthesis', 50, 90);
    g.fillStyle = '#6b6b6b'; g.font = '400 24px Inter, Arial'; g.fillText('Chapter 6 · Life processes', 50, 130);
    // leaf
    g.save(); g.translate(350, 380); g.rotate(-0.5);
    g.fillStyle = '#5fae4e'; g.beginPath(); g.ellipse(0, 0, 200, 90, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2f6b3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-210, 0); g.lineTo(200, 0); g.stroke();
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 50, 0); g.lineTo(i * 50 + 40, -60); g.moveTo(i * 50, 0); g.lineTo(i * 50 + 40, 60); g.stroke(); }
    g.restore();
    g.fillStyle = '#FFCB05'; g.beginPath(); g.arc(590, 200, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#231F20'; g.font = '500 26px Inter, Arial';
    g.fillText('CO₂ + H₂O  →  C₆H₁₂O₆ + O₂', 50, 600);
    g.fillStyle = '#9a9a9a';
    for (let i = 0; i < 9; i++) g.fillRect(50, 650 + i * 32, 600 - (i % 3) * 90, 10);
  });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.685), new THREE.MeshStandardMaterial({ map: doc, roughness: 0.9, transparent: true, opacity: 0 }));
  paper.rotation.x = -Math.PI / 2; paper.position.set(-0.05, 0.075, 0.12); group.add(paper);

  // arm: root hinge at front-right, two segments, camera head
  const root = new THREE.Group(); root.position.set(0.48, 0.08, 0.6); group.add(root);
  const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 24), white); knuckle.rotation.z = Math.PI / 2; root.add(knuckle);
  const seg1 = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.62, 0.08, 3, 0.03), white); seg1.position.y = 0.31; root.add(seg1);
  const j2 = new THREE.Group(); j2.position.y = 0.62; root.add(j2);
  const j2k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 12), white); j2.add(j2k);
  const seg2 = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.5, 0.075, 3, 0.03), white); seg2.position.y = 0.25; j2.add(seg2);
  const j3 = new THREE.Group(); j3.position.y = 0.5; j2.add(j3);
  const head = new THREE.Group(); j3.add(head);
  const headBox = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.17, 0.2, 3, 0.03), white); head.add(headBox);
  for (let i = 0; i < 5; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.004), grey); v.position.set(0, -0.04 + i * 0.02, 0.101); head.add(v); }
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.07, 32), dark); lens.position.y = -0.11; head.add(lens);
  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), new THREE.MeshPhysicalMaterial({ color: 0x05060a, roughness: 0.02, iridescence: 1, clearcoat: 1 })); lensGlass.rotation.x = Math.PI / 2; lensGlass.position.y = -0.146; head.add(lensGlass);
  const camLed = new THREE.PointLight(0xffffff, 0, 1.5, 2); camLed.position.y = -0.2; head.add(camLed);

  // floating live feed
  const feedGroup = new THREE.Group(); feedGroup.position.set(-0.2, 1.55, -0.9); group.add(feedGroup);
  const feedFrame = new THREE.Mesh(new RoundedBoxGeometry(1.62, 0.95, 0.03, 3, 0.012), dark); feedGroup.add(feedFrame);
  const feedMat = new THREE.MeshBasicMaterial({ map: doc, transparent: true, opacity: 0 });
  const feed = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.85), feedMat); feed.position.z = 0.017; feedGroup.add(feed);
  const liveTex = canvasTex(256, 80, (g) => { g.fillStyle = '#d6261c'; g.beginPath(); g.roundRect(0, 0, 256, 80, 40); g.fill(); g.fillStyle = '#fff'; g.font = '700 40px Inter, Arial'; g.fillText('● LIVE', 44, 54); });
  const live = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.0625), new THREE.MeshBasicMaterial({ map: liveTex, transparent: true, opacity: 0 })); live.position.set(-0.64, 0.38, 0.018); feedGroup.add(live);
  feedFrame.material = dark.clone(); feedFrame.material.transparent = true;
  const beamCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8d433).multiplyScalar(2), transparent: true, opacity: 0 });
  let beam = new THREE.Mesh(new THREE.TubeGeometry(beamCurve, 40, 0.006, 6), beamMat); group.add(beam);

  shadowed(group);
  const hotspots = { arm: anchor(seg1, 0, 0.1, 0.05), head: anchor(head, 0, 0.05, 0.1), lamp: anchor(lamps[0].hinge, 0, 0.08, 0.3), panel: anchor(group, -0.38, 0.09, -0.45) };
  const cams = [
    cam([2.1, 1.7, 2.4], [0, 0.45, 0]),
    cam([-2.0, 1.2, 1.8], [0.1, 0.55, 0.2], -0.05),
    cam([0.95, 1.55, 1.35], [0.0, 0.45, 0.15], 0.04),
    cam([-1.35, 0.5, 1.2], [-0.3, 0.2, 0.2], 0.05),
    cam([1.5, 1.9, 3.0], [-0.15, 1.1, -0.4], -0.02),
    cam([0.3, 3.1, 0.9], [0, 0.1, -0.05], 0),
  ];
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpM = new THREE.Vector3();
  let Pv = 0;
  return {
    group, hotspots, cams, floor: 0, exposure: 0.6, bloomThreshold: 1.0, bloomStrength: 0.12,
    apply(p) { Pv = p; },
    update(t) {
      const u = smooth(0.15, 1.0, Pv);                     // unfold
      root.rotation.x = lerp(-1.45, -0.42, u);
      j2.rotation.x = lerp(-1.6, 1.62, u);
      j3.rotation.x = lerp(3.0, 0.38, u);
      head.rotation.y = lerp(0, 0, u);
      lamps.forEach(({ hinge, s }) => { hinge.rotation.z = s * lerp(0, 0.85, smooth(2.1, 2.8, Pv)); });
      const lampOn = smooth(2.2, 2.9, Pv);
      lamps.forEach(({ led }) => { led.material.color.setScalar(0.35 + lampOn * 1.3); });
      stageMat.emissiveIntensity = 0.02 + lampOn * 0.3;
      camLed.intensity = smooth(1.5, 2.0, Pv) * 0.8;
      const slide = smooth(1.2, 1.9, Pv);
      paper.position.z = lerp(0.42, 0.12, slide);
      paper.position.y = 0.075 + (1 - slide) * 0.12;
      paper.material.opacity = slide;
      const show = smooth(3.4, 3.9, Pv) * (1 - smooth(4.7, 5.0, Pv) * 0.0);
      feedMat.opacity = show; live.material.opacity = show * (0.6 + 0.4 * Math.sin(t * 4));
      feedFrame.material.opacity = show; feedGroup.visible = show > 0.01;
      feedGroup.position.y = 1.55 + Math.sin(t * 0.9) * 0.03;
      // data beam from head to feed
      head.getWorldPosition(tmpA); group.worldToLocal(tmpA);
      tmpB.copy(feedGroup.position).add(new THREE.Vector3(0.5, -0.3, 0));
      tmpM.copy(tmpA).lerp(tmpB, 0.5).add(new THREE.Vector3(0, 0.45, 0));
      beamCurve.v0.copy(tmpA); beamCurve.v1.copy(tmpM); beamCurve.v2.copy(tmpB);
      beam.geometry.dispose(); beam.geometry = new THREE.TubeGeometry(beamCurve, 40, 0.006, 6);
      beamMat.opacity = show * (0.5 + 0.5 * Math.sin(t * 6));
      btns.forEach((b, i) => { b.position.y = 0.08 - bell(Pv, 5, 0.5) * (Math.sin(t * 6 - i) > 0.8 ? 0.006 : 0); });
    },
  };
}

/* ===================================================================== MENU-BOARD DISPLAYS */
function buildDisplays(loader) {
  const group = new THREE.Group();
  const wood = canvasTex(1024, 512, (g, W, H) => {
    for (let x = 0; x < W; x += 64) {
      const l = 34 + Math.random() * 10;
      g.fillStyle = `hsl(28 45% ${l}%)`; g.fillRect(x, 0, 64, H);
      for (let k = 0; k < 10; k++) { g.strokeStyle = `hsla(26 50% ${l - 10}% / .35)`; g.lineWidth = 1 + Math.random() * 2; const xx = x + Math.random() * 64; g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + 6, H * 0.3, xx - 6, H * 0.6, xx + 3, H); g.stroke(); }
      g.fillStyle = 'rgba(20,10,4,.6)'; g.fillRect(x, 0, 3, H);
    }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(3, 1);
  const wallMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.4), wallMat); backWall.position.set(0, 1.7, -0.06); backWall.receiveShadow = true; group.add(backWall);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.6 })); shelf.position.set(0, 0.95, 0.09); group.add(shelf);

  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x0c0d0e, metalness: 0.4, roughness: 0.3, clearcoat: 0.8 });
  const H = 1.12;
  const specs = [['menu-1.jpg', 124 / 223], ['menu-2.jpg', 124 / 223], ['menu-3.jpg', 124 / 223], ['menu-4.jpg', 413 / 223], ['menu-5.jpg', 126 / 223], ['menu-6.jpg', 126 / 223]];
  const texes = specs.map(([f]) => loadTex(loader, P + f));
  const gap = 0.07;
  const widths = specs.map(([, a]) => H * a);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (specs.length - 1);
  let x = -total / 2;
  const screens = [];
  specs.forEach(([, a], i) => {
    const w = widths[i];
    const pivot = new THREE.Group(); pivot.position.set(x + w / 2, 1.7, 0.03); group.add(pivot);
    const flip = new THREE.Group(); pivot.add(flip);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.03, H + 0.03, 0.05, 2, 0.008), frameMat); frame.position.z = -0.01; flip.add(frame);
    const mat = new THREE.MeshBasicMaterial({ map: texes[i] });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, H), mat); scr.position.z = 0.016; flip.add(scr);
    const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshBasicMaterial({ map: texes[(i + 3) % texes.length] })); backPanel.rotation.y = Math.PI; backPanel.position.z = -0.036; flip.add(backPanel);
    screens.push({ pivot, flip, w, mat, i });
    x += w + gap;
  });
  // pendant lamps
  const lamps = [];
  [-2.4, -0.9, 0.9, 2.4].forEach((lx) => {
    const g = new THREE.Group(); g.position.set(lx, 3.4, 0.7);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 6), frameMat); cord.position.y = -0.35; g.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, side: THREE.DoubleSide })); shade.position.y = -0.82; g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(3) })); bulb.position.y = -0.92; g.add(bulb);
    const pl = new THREE.PointLight(0xffbf73, 2.5, 4, 1.6); pl.position.y = -1.0; g.add(pl);
    group.add(g); lamps.push(g);
  });
  // counter + diners for scale
  const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 0.7), new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.6 })); counter.position.set(0, 0.5, 1.4); group.add(counter);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.05, 0.78), new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.65 })); counterTop.position.set(0, 1.02, 1.4); group.add(counterTop);
  const pm = new THREE.MeshStandardMaterial({ color: 0x26292b, roughness: 0.9 });


  shadowed(group);
  backWall.castShadow = false;
  const hotspots = {};
  screens.forEach(({ flip, w }, i) => { hotspots['screen' + i] = anchor(flip, w * 0.3, H * 0.32, 0.03); });
  const cams = [
    cam([2.6, 1.9, 5.6], [0, 1.6, 0]),
    cam([-3.2, 1.6, 2.6], [-1.4, 1.7, 0], -0.05),
    cam([0.2, 3.1, 3.0], [0.3, 1.5, 0], 0.03),
    cam([0.9, 1.75, 2.2], [0.5, 1.7, 0], 0),
    cam([4.2, 1.2, 2.2], [1.6, 1.6, 0], 0.06),
    cam([-3.7, 2.05, 2.7], [-1.8, 1.65, 0.3], -0.04),
  ];
  let Pv = 0, flipped = false, flipTween = null;
  return {
    group, hotspots, cams, floor: 0, hideFloorGlow: true, exposure: 0.85, bloomThreshold: 0.97, bloomStrength: 0.25,
    apply(p) {
      Pv = p;
      const shouldFlip = p > 3.55 && p < 4.6;
      if (shouldFlip !== flipped && window.gsap) {
        flipped = shouldFlip;
        flipTween?.kill();
        flipTween = window.gsap.to(screens.map((s) => s.flip.rotation), { y: shouldFlip ? Math.PI : 0, duration: 1.1, ease: 'power3.inOut', stagger: 0.09 });
      }
    },
    update(t) {
      // screen 0 rotates portrait -> landscape around its centre (station 1)
      const rot = bell(Pv, 1, 0.55);
      screens[0].pivot.rotation.z = rot * Math.PI / 2;
      screens[0].pivot.position.z = 0.03 + rot * 0.6;
      screens[0].pivot.position.y = 1.7 + rot * 0.1;
      // screen 1 detaches to show its slim profile (station 5)
      const det = smooth(4.5, 5.0, Pv);
      screens[1].pivot.position.z = 0.03 + det * 0.9;
      screens[1].pivot.rotation.y = det * -1.15;
      // "always on" pulse
      const pulse = bell(Pv, 2, 0.5);
      screens.forEach((s, i) => s.mat.color.setScalar(1 + pulse * 0.35 * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.7))));
      lamps.forEach((l, i) => { l.rotation.z = Math.sin(t * 0.6 + i) * 0.02; });
    },
  };
}

export const BUILDERS = { camera: buildCamera, led: buildLED, kiosk: buildKiosk, visualizer: buildVisualizer, display: buildDisplays };
