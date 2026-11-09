// "The Infinite Showroom" — an endless corridor of Onfinity screens.
// Scroll (scrubbed) and drag (inertial) walk you through it; screens are
// clickable. A CRT-flavoured finishing pass nods to the reference site.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SPACING = 4.6;
const HALF_W = 3.0;
const EYE = 1.62;
const BEHIND = 6;

const screenVert = /* glsl */`
  varying vec2 vUv; varying vec3 vW;
  void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const screenFrag = /* glsl */`
  precision highp float;
  uniform sampler2D map; uniform float uHover, uOn, uTime, uSeed, uCover, uMirror;
  varying vec2 vUv;
  float hash(float n){ return fract(sin(n)*43758.5453); }
  void main(){
    vec2 uv = vUv;
    // cover-fit when the panel is capped
    uv.x = 0.5 + (uv.x - 0.5) * uCover;
    // switch-on flicker as you approach
    float flick = step(0.5, hash(floor(uTime*24.0) + uSeed)) * (1.0 - smoothstep(0.6, 1.0, uOn));
    uv.x += (hash(floor(uv.y*60.0) + floor(uTime*30.0)) - 0.5) * 0.03 * (1.0 - uOn);
    vec3 c = texture2D(map, uv).rgb;
    // fine scanlines + subpixel texture
    float scan = 0.92 + 0.08 * sin(vUv.y * 900.0);
    c *= scan;
    c *= mix(0.06, 1.0, uOn) * (1.0 - flick*0.6);
    c *= 1.0 + uHover * 0.35;
    // hover edge glow
    vec2 e = min(vUv, 1.0 - vUv);
    float edge = smoothstep(0.025, 0.0, min(e.x, e.y));
    c += vec3(0.48, 0.66, 0.03) * edge * uHover * 2.0;
    if (uMirror > 0.5) c *= 0.35 * smoothstep(0.0, 0.7, vUv.y);
    gl_FragColor = vec4(c, 1.0);
  }
`;

const floorFrag = /* glsl */`
  precision highp float;
  varying vec3 vW;
  uniform float uTime;
  void main(){
    vec2 p = vW.xz;
    vec2 g = abs(fract(p / vec2(1.0, 1.0)) - 0.5);
    float line = smoothstep(0.015, 0.0, min(g.x, g.y));
    vec3 col = vec3(0.004, 0.018, 0.014) + vec3(0.48, 0.66, 0.03) * line * 0.05;
    // lime guide lines along the edges
    float guide = smoothstep(0.03, 0.0, abs(abs(p.x) - 2.6));
    col += vec3(0.48, 0.66, 0.03) * guide * 0.9;
    gl_FragColor = vec4(col, 0.84);
  }
`;
const stripFrag = /* glsl */`
  precision highp float;
  varying vec3 vW; uniform vec3 uColor; uniform float uDash;
  void main(){
    float d = fract(vW.z / uDash);
    float on = smoothstep(0.0, 0.04, d) * smoothstep(0.7, 0.66, d);
    gl_FragColor = vec4(uColor * on * 2.2, 1.0);
  }
`;

const crtShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uSpeed: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uSpeed; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      uv = 0.5 + c * (1.0 + 0.035 * dot(c, c));           // slight barrel
      float k = dot(c, c);
      vec2 off = c * (0.004 + uSpeed * 0.01) * (0.5 + k * 3.0);
      vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
      col *= 0.94 + 0.06 * sin(uv.y * uRes.y * 1.5);         // scanlines
      col += (hash(uv * uRes + uTime) - 0.5) * 0.045;           // noise
      col *= 1.0 - smoothstep(0.2, 0.75, k * 1.9) * 0.85;      // vignette
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createCorridor({ canvas, section, items, manager, onSelect, onFocus, reduced }) {
  const isMobile = matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.5));
  renderer.setClearColor(0x010605, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010605, 0.055);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 80);

  const loader = new THREE.TextureLoader(manager);
  const L = items.length * SPACING;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111614, metalness: 0.8, roughness: 0.35 });
  const screens = [];
  const pickables = [];

  items.forEach((item, i) => {
    const tex = loader.load(item.img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const left = i % 2 === 0;
    const h = item.aspect < 1 ? 2.0 : 1.55;
    const wRaw = h * item.aspect;
    const w = Math.min(wRaw, 2.9);
    const uniforms = {
      map: { value: tex }, uHover: { value: 0 }, uOn: { value: 0 }, uTime: { value: 0 }, uSeed: { value: i * 7.13 },
      uCover: { value: w / wRaw }, uMirror: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: screenVert, fragmentShader: screenFrag });
    const g = new THREE.Group();
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.userData.index = i;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.04), frameMat);
    frame.position.z = -0.025;
    g.add(frame, plane);
    const cy = item.aspect < 1 ? 1.25 : 1.75;
    g.position.set((left ? -1 : 1) * (HALF_W - 0.75), cy, 0);
    g.rotation.y = left ? 0.95 : -0.95;
    scene.add(g);

    // fake floor reflection
    const mirrorU = { ...uniforms, uMirror: { value: 1 } };
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({ uniforms: mirrorU, vertexShader: screenVert, fragmentShader: screenFrag, side: THREE.DoubleSide }));
    mirror.scale.y = -1;
    mirror.position.copy(g.position); mirror.position.y = -cy;
    mirror.rotation.y = g.rotation.y;
    scene.add(mirror);

    // small light bar under each screen
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8d433).multiplyScalar(2.5) }));
    bar.position.set(0, -h / 2 - 0.12, 0.05);
    g.add(bar);

    screens.push({ i, g, mirror, uniforms, hover: 0, base: i * SPACING + 5.5 });
    pickables.push(plane);
  });

  // floor + ceiling strips follow the camera; patterns are world-space so they feel infinite
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_W * 2 + 4, 120),
    new THREE.ShaderMaterial({
      transparent: true, uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: floorFrag,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const strips = [];
  [[-1.3, 0xeef1ea], [1.3, 0xeef1ea], [0, 0xb8d433]].forEach(([x, col], k) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(k === 2 ? 0.02 : 0.06, 0.02, 120),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(col).multiplyScalar(k === 2 ? 0.8 : 0.55) }, uDash: { value: k === 2 ? 0.9 : 2.3 } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: stripFrag,
      })
    );
    m.position.set(x, 3.7, 0);
    scene.add(m);
    strips.push(m);
  });
  // walls (dark, slightly reflective)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x030b09, metalness: 0.4, roughness: 0.7 });
  [-1, 1].forEach((s) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(120, 4), wallMat);
    wall.rotation.y = s * -Math.PI / 2;
    wall.position.set(s * HALF_W, 2, 0);
    scene.add(wall);
    strips.push(wall);
  });

  scene.add(new THREE.AmbientLight(0x8fb5a5, 0.4));
  const camLight = new THREE.PointLight(0xdfffd0, 6, 9, 1.6);
  scene.add(camLight);

  /* ---- post ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.7, 0.55);
  composer.addPass(bloom);
  const crt = new ShaderPass(crtShader);
  composer.addPass(crt);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 70 : 55;
    camera.updateProjectionMatrix();
    crt.uniforms.uRes.value.set(w, h);
  }
  resize();
  addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas);

  /* ---- input ---- */
  const { ScrollTrigger } = window;
  const st = ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom' });
  let visible = false;
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });

  let drag = 0, dragVel = 0, dragging = false, lastX = 0, lastY = 0, moved = 0;
  const pointer = new THREE.Vector2(9, 9);
  const look = { x: 0, y: 0, sx: 0, sy: 0 };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    look.x = pointer.x; look.y = pointer.y;
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      const delta = (dy * 0.02 + dx * -0.012);
      drag += delta; dragVel = delta * 60;
      lastX = e.clientX; lastY = e.clientY;
    }
    tagEl.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -140%)`;
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', (e) => { end(); if (moved < 6 && hovered >= 0) onSelect(hovered); });
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { pointer.set(9, 9); end(); });

  const tagEl = document.getElementById('screenTag');
  const ray = new THREE.Raycaster();
  let hovered = -1;

  /* ---- loop ---- */
  const clock = new THREE.Clock();
  let travel = 0, prevTravel = 0, speed = 0, focused = -1;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!dragging) { drag += dragVel * dt; dragVel *= Math.exp(-dt * 3); }
    const target = st.progress * L * 1.1 + drag;
    travel += (target - travel) * (1 - Math.exp(-dt * 4));
    speed += (Math.abs(travel - prevTravel) / Math.max(dt, 1e-3) - speed) * 0.1;
    prevTravel = travel;

    const camZ = -travel;
    look.sx += (look.x - look.sx) * (1 - Math.exp(-dt * 2.5));
    look.sy += (look.y - look.sy) * (1 - Math.exp(-dt * 2.5));
    const bob = reduced ? 0 : Math.sin(travel * 1.6) * 0.025;
    camera.position.set(look.sx * 0.35, EYE + bob, camZ);
    camera.rotation.set(look.sy * 0.12, -look.sx * 0.28, 0, 'YXZ');
    camLight.position.set(0, 2.6, camZ - 2);

    floor.position.z = camZ;
    strips.forEach((s) => { s.position.z = camZ; });

    // place screens on the infinite loop
    let bestD = Infinity, best = 0;
    screens.forEach((s) => {
      const fd = ((((s.base - travel + BEHIND) % L) + L) % L) - BEHIND;
      const z = camZ - fd;
      s.g.position.z = z; s.mirror.position.z = z;
      const on = THREE.MathUtils.clamp(1 - (fd - 6) / 10, 0, 1);
      s.uniforms.uOn.value += (on - s.uniforms.uOn.value) * (1 - Math.exp(-dt * 4));
      s.uniforms.uTime.value = t;
      if (fd > 1.2 && fd < bestD) { bestD = fd; best = s.i; }
    });
    if (best !== focused) { focused = best; onFocus(best); }

    // hover
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    const h = hit ? hit.object.userData.index : -1;
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h >= 0 ? 'pointer' : 'grab';
      tagEl.classList.toggle('on', h >= 0);
      if (h >= 0) tagEl.firstElementChild.textContent = 'View · ' + items[h].title;
      document.dispatchEvent(new CustomEvent('cursor:label', { detail: h >= 0 ? 'View' : 'Drag' }));
    }
    screens.forEach((s) => {
      s.hover += ((s.i === hovered ? 1 : 0) - s.hover) * (1 - Math.exp(-dt * 8));
      s.uniforms.uHover.value = s.hover;
      s.g.scale.setScalar(1 + s.hover * 0.04);
    });

    crt.uniforms.uTime.value = t;
    crt.uniforms.uSpeed.value = Math.min(speed / 12, 1);
    composer.render(dt);
  }
  requestAnimationFrame(tick);

  section.addEventListener('pointerenter', () => document.dispatchEvent(new CustomEvent('cursor:label', { detail: 'Drag' })));
  section.addEventListener('pointerleave', () => document.dispatchEvent(new CustomEvent('cursor:label', { detail: '' })));

  return { resize };
}
