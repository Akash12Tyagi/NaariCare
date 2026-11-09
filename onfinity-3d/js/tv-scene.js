// Hero / story WebGL scene: a procedurally modelled Onfinity TV whose screen
// is a live shader (infinity aurora, 4K pixel zoom, QLED, OLED, smart home UI).
// Camera + TV pose are driven by scroll through the #story chapters.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const MODES = { infinity: 0, '4k': 1, qled: 2, oled: 3, smart: 4 };
// Light the screen spills on the floor, per mode (sRGB hex).
const GLOW = { infinity: 0xb8d433, '4k': 0xff7a2a, qled: 0xff9ac8, oled: 0x7d6bff, smart: 0x2fd3a5 };

const W55 = 1.218, H55 = 0.685;          // 55" panel in metres
const FOOT = 0.085;                       // stand height

/* ---------------------------------------------------------------- shaders */
const glslCommon = /* glsl */`
  vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }
  // Lemniscate of Bernoulli: distance estimate
  float lemni(vec2 p, float a){
    float r2 = dot(p,p);
    float f = r2*r2 - a*a*(p.x*p.x - p.y*p.y);
    vec2 g = 4.0*r2*p - 2.0*a*a*vec2(p.x, -p.y);
    return abs(f) / max(length(g), 1e-3);
  }
  vec2 lemniPt(float t, float a){ float s = sin(t), c = cos(t); float d = 1.0 + s*s; return vec2(a*c/d, a*s*c/d); }
`;

const screenFrag = /* glsl */`
  precision highp float;
  uniform float uTime, uPower, uModeA, uModeB, uMix, uAspect, uTilt;
  uniform sampler2D uHum, uFlower, uUI;
  varying vec2 vUv;
  ${glslCommon}

  vec3 brandAurora(vec2 uv, float t){
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    vec2 q = vec2(fbm(p*1.6 + t*0.05), fbm(p*1.6 - t*0.04 + 3.1));
    float f = fbm(p*2.2 + q*1.8 + vec2(t*0.06, -t*0.03));
    vec3 deep = toLin(vec3(0.004,0.10,0.07));
    vec3 green = toLin(vec3(0.06,0.37,0.26));
    vec3 lime = toLin(vec3(0.72,0.83,0.20));
    vec3 sun = toLin(vec3(1.0,0.80,0.02));
    vec3 col = mix(deep, green, smoothstep(0.25, 0.65, f));
    col = mix(col, lime, smoothstep(0.58, 0.85, f + q.x*0.25) * 0.85);
    col = mix(col, sun, smoothstep(0.78, 0.98, f + q.y*0.2) * 0.6);
    return col;
  }

  vec3 infinityMode(vec2 uv){
    float t = uTime;
    vec3 col = brandAurora(uv, t) * 0.75;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * 2.2;
    float a = 1.15;
    float d = lemni(p, a);
    col += toLin(vec3(0.85,0.95,0.55)) * (0.0035 / (d*d*40.0 + 0.004)) * 0.06;
    col += toLin(vec3(0.72,0.83,0.20)) * smoothstep(0.03, 0.0, d) * 0.9;
    // travelling light along the curve
    for (int i = 0; i < 10; i++) {
      float fi = float(i);
      vec2 h = lemniPt(t*1.1 - fi*0.07, a);
      float k = length(p - h);
      col += toLin(vec3(1.0,0.86,0.25)) * (0.0009 / (k*k + 0.0009)) * (1.0 - fi/10.0) * 0.55;
    }
    return col;
  }

  vec3 fourKMode(vec2 uv){
    float cyc = 0.5 - 0.5*cos(uTime*0.45);
    float z = 1.0 + 9.0 * pow(cyc, 2.2);
    vec2 focus = vec2(0.36, 0.42);
    vec2 zuv = focus + (uv - focus) / z;
    float cells = mix(1400.0, 48.0, pow(cyc, 1.6));
    vec2 grid = vec2(cells, cells / uAspect);
    vec2 cid = floor(zuv * grid);
    vec2 cuv = fract(zuv * grid);
    vec3 tex = texture2D(uHum, (cid + 0.5) / grid).rgb;
    float showSub = smoothstep(220.0, 90.0, cells);
    vec3 sub = vec3(step(cuv.x, 0.333), step(0.333, cuv.x) * step(cuv.x, 0.666), step(0.666, cuv.x));
    float gap = smoothstep(0.0, 0.08, cuv.y) * smoothstep(1.0, 0.92, cuv.y) * smoothstep(0.0, 0.04, cuv.x) * smoothstep(1.0, 0.96, cuv.x);
    vec3 pix = mix(tex, tex * sub * 2.6 * gap, showSub);
    vec3 full = texture2D(uHum, zuv).rgb;
    return mix(full, pix, smoothstep(1.4, 2.6, z)) * 1.08;
  }

  vec3 qledMode(vec2 uv){
    float t = uTime;
    vec2 kuv = 0.5 + (uv - 0.5) * (0.92 - 0.04*sin(t*0.2)) + vec2(0.02*sin(t*0.13), 0.015*cos(t*0.11));
    vec3 c = texture2D(uFlower, kuv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, 1.35) * 1.18;
    // quantum-dot shimmer
    vec2 g = uv * vec2(uAspect, 1.0) * 70.0;
    vec2 id = floor(g);
    float h = hash(id);
    float tw = pow(max(0.0, sin(t*2.0 + h*40.0)), 24.0) * step(0.92, h);
    float dotm = smoothstep(0.35, 0.0, length(fract(g) - 0.5));
    vec3 hue = 0.5 + 0.5*cos(6.2831*(h + vec3(0.0, 0.33, 0.67)));
    c += hue * tw * dotm * 1.2;
    return max(c, 0.0);
  }

  vec3 oledMode(vec2 uv){
    float t = uTime;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    float r = length(p);
    float ang = atan(p.y, p.x);
    // spiral nebula: most pixels stay absolutely black
    float arm = sin(ang*2.0 - log(r + 0.02)*5.0 + t*0.25);
    float neb = fbm(vec2(ang*1.2, r*6.0 - t*0.1)) ;
    float m = pow(max(0.0, arm*0.5 + 0.5) * neb * smoothstep(0.75, 0.05, r), 2.6) * 4.0;
    vec3 c = mix(toLin(vec3(0.30,0.20,0.95)), toLin(vec3(1.0,0.45,0.75)), smoothstep(0.0, 0.5, r));
    c = mix(c, toLin(vec3(1.0,0.86,0.55)), smoothstep(0.12, 0.0, r));
    vec3 col = c * m;
    // stars: individual self-lit pixels
    vec2 g = uv * vec2(uAspect, 1.0) * 180.0;
    vec2 id = floor(g);
    float h = hash(id);
    float star = step(0.985, h) * smoothstep(0.25, 0.0, length(fract(g) - 0.5));
    col += vec3(star) * (0.6 + 0.4*sin(t*3.0 + h*90.0));
    col += toLin(vec3(1.0,0.9,0.7)) * (0.0006 / (r*r + 0.0006));
    return col;
  }

  vec3 content(float m, vec2 uv){
    if (m < 0.5) return infinityMode(uv);
    if (m < 1.5) return fourKMode(uv);
    if (m < 2.5) return qledMode(uv);
    if (m < 3.5) return oledMode(uv);
    return texture2D(uUI, uv).rgb * 1.05;
  }

  void main(){
    vec2 uv = vUv;
    vec3 a = content(uModeA, uv);
    vec3 col = a;
    if (uMix > 0.001) {
      vec3 b = content(uModeB, uv);
      float edge = uMix * 1.4 - 0.2;
      float s = uv.x * 0.8 + (1.0 - uv.y) * 0.2;
      float k = smoothstep(edge + 0.06, edge - 0.06, s);
      col = mix(a, b, k);
      col += toLin(vec3(0.72,0.83,0.20)) * smoothstep(0.03, 0.0, abs(s - edge)) * 2.0 * (1.0 - uMix);
    }

    // power-on: line, then vertical open
    vec2 c = uv - 0.5;
    float w = smoothstep(0.0, 0.32, uPower);
    float h = smoothstep(0.3, 1.0, uPower);
    float inside = step(abs(c.x), w*0.5) * step(abs(c.y), max(h*0.5, 0.004));
    float flash = (1.0 - h) * inside * step(0.001, uPower);
    vec3 off = vec3(0.004, 0.008, 0.007) + toLin(vec3(0.05,0.08,0.07)) * smoothstep(0.9, 0.0, length(c*vec2(1.0,1.6)));
    col = mix(off, col, inside * h) + vec3(flash) * 3.0;

    // glass sheen that follows the tilt
    float sheen = smoothstep(0.08, 0.0, abs((uv.x + uv.y*0.6) - (0.6 + uTilt*0.8))) * 0.06;
    col += vec3(sheen);
    // subtle vignette inside the panel
    col *= 1.0 - 0.25 * pow(length(c*vec2(1.0, 1.2))*1.25, 3.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const floorFrag = /* glsl */`
  precision highp float;
  uniform vec3 uGlow; uniform float uGlowAmt; uniform vec2 uTv; uniform float uTvW;
  varying vec2 vW;
  ${glslCommon}
  void main(){
    vec3 base = toLin(vec3(0.010,0.045,0.035));
    vec2 rel = vW - vec2(uTv.x, uTv.y + 0.35);
    float d = length(rel * vec2(1.0/(uTvW*0.9), 1.4));
    vec3 col = base + uGlow * exp(-d*1.6) * uGlowAmt;
    // contact shadow below the panel
    vec2 sh = (vW - uTv) * vec2(1.0/(uTvW*0.55), 1.0/0.12);
    col *= 1.0 - 0.75 * exp(-dot(sh, sh));
    // fine showroom grid
    vec2 g = abs(fract(vW / 0.5) - 0.5);
    float line = smoothstep(0.012, 0.0, min(g.x, g.y));
    col += toLin(vec3(0.72,0.83,0.20)) * line * 0.035 * exp(-length(vW)*0.28);
    float fade = smoothstep(14.0, 3.0, length(vW));
    gl_FragColor = vec4(col * fade, 1.0);
  }
`;

const wallFrag = /* glsl */`
  precision highp float;
  uniform float uTime; varying vec2 vUv;
  ${glslCommon}
  void main(){
    vec2 p = (vUv - vec2(0.5, 0.42)) * vec2(2.0, 1.0);
    float r = length(p);
    vec3 col = mix(toLin(vec3(0.03,0.20,0.15)), toLin(vec3(0.008,0.05,0.04)), smoothstep(0.0, 0.75, r));
    col *= 0.85 + 0.15*fbm(p*3.0 + uTime*0.02);
    // giant faint infinity on the back wall
    float d = lemni((vUv - vec2(0.5, 0.55)) * vec2(2.0, 1.0) * 2.2, 0.9);
    col += toLin(vec3(0.72,0.83,0.20)) * smoothstep(0.012, 0.0, d) * 0.12;
    col += toLin(vec3(0.72,0.83,0.20)) * (0.00004 / (d*d + 0.0004)) * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const finishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAberr: { value: 0.0015 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uAberr; varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float k = dot(c, c);
      vec2 off = c * k * uAberr * 40.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= 1.0 - smoothstep(0.25, 0.9, k * 2.2) * 0.65;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* ------------------------------------------------------------ helpers */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function logoTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c9cfc9';
  g.font = '600 72px Inter, Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Ōnfinity', 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function personTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 640;
  const g = c.getContext('2d');
  const s = 640 / 175; // px per cm
  g.translate(128, 0);
  g.fillStyle = 'rgba(238,241,234,0.10)';
  g.strokeStyle = 'rgba(184,212,51,0.55)';
  g.lineWidth = 3;
  const P = new Path2D();
  P.arc(0, 12 * s, 11 * s, 0, Math.PI * 2);
  P.moveTo(-21 * s, 34 * s);
  P.quadraticCurveTo(0, 26 * s, 21 * s, 34 * s);
  P.lineTo(24 * s, 92 * s); P.lineTo(17 * s, 94 * s); P.lineTo(14 * s, 60 * s);
  P.lineTo(13 * s, 172 * s); P.lineTo(3 * s, 172 * s); P.lineTo(0, 100 * s);
  P.lineTo(-3 * s, 172 * s); P.lineTo(-13 * s, 172 * s); P.lineTo(-14 * s, 60 * s);
  P.lineTo(-17 * s, 94 * s); P.lineTo(-24 * s, 92 * s); P.closePath();
  g.fill(P); g.stroke(P);
  g.fillStyle = 'rgba(238,241,234,0.7)';
  g.font = '500 28px Inter, Arial';
  g.textAlign = 'center';
  g.fillText('1.75 m', 0, 600);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Animated "smart home" launcher, drawn on a canvas.
function createSmartUI(humImg) {
  const c = document.createElement('canvas');
  c.width = 1280; c.height = 720;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const apps = [
    ['YouTube', '#d6261c', '#fff'], ['Netflix', '#141414', '#e50914'], ['Prime Video', '#0f79af', '#fff'],
    ['Live TV', '#105F42', '#B8D433'], ['Screen Share', '#B8D433', '#231F20'], ['Music', '#3b2a6b', '#fff'], ['Browser', '#2f3634', '#fff'],
  ];
  let focus = 0;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function draw() {
    const bg = g.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, '#0b1f19'); bg.addColorStop(1, '#030c09');
    g.fillStyle = bg; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#EEF1EA';
    g.font = '600 30px Inter, Arial'; g.textBaseline = 'middle';
    g.fillText('Ōnfinity', 64, 60);
    g.font = '400 24px Inter, Arial'; g.fillStyle = 'rgba(238,241,234,.6)';
    const now = new Date();
    g.textAlign = 'right';
    g.fillText(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 1216, 60);
    g.textAlign = 'left';
    ['Home', 'Movies', 'Shows', 'Apps', 'Live'].forEach((t, i) => {
      g.fillStyle = i === 0 ? '#EEF1EA' : 'rgba(238,241,234,.5)';
      g.fillText(t, 300 + i * 120, 60);
    });
    // hero banner
    g.save(); rr(64, 110, 1152, 330, 22); g.clip();
    if (humImg && humImg.complete && humImg.naturalWidth) g.drawImage(humImg, 64, 30, 1152, 648 * 1152 / 1024);
    const sh = g.createLinearGradient(64, 0, 760, 0);
    sh.addColorStop(0, 'rgba(3,12,9,.92)'); sh.addColorStop(1, 'rgba(3,12,9,0)');
    g.fillStyle = sh; g.fillRect(64, 110, 1152, 330);
    g.restore();
    g.fillStyle = '#B8D433'; g.font = '600 20px Inter, Arial';
    g.fillText('FEATURED IN 4K', 108, 190);
    g.fillStyle = '#EEF1EA'; g.font = '500 54px Inter, Arial';
    g.fillText('Wild India', 108, 252);
    g.font = 'italic 500 40px "Cormorant Garamond", Georgia';
    g.fillText('in every feather', 108, 304);
    rr(108, 345, 150, 52, 26); g.fillStyle = '#EEF1EA'; g.fill();
    g.fillStyle = '#231F20'; g.font = '600 22px Inter, Arial'; g.fillText('▶  Play', 134, 372);
    // app row
    g.fillStyle = 'rgba(238,241,234,.6)'; g.font = '500 22px Inter, Arial';
    g.fillText('Your apps', 64, 495);
    apps.forEach(([name, bgc, fg], i) => {
      const x = 64 + i * 166, y = 525, w = 150, h = 120;
      const f = i === focus;
      g.save();
      if (f) { g.translate(x + w / 2, y + h / 2); g.scale(1.08, 1.08); g.translate(-(x + w / 2), -(y + h / 2)); }
      rr(x, y, w, h, 16); g.fillStyle = bgc; g.fill();
      if (f) { g.lineWidth = 5; g.strokeStyle = '#EEF1EA'; g.stroke(); }
      g.fillStyle = fg; g.font = '600 21px Inter, Arial'; g.textAlign = 'center';
      g.fillText(name, x + w / 2, y + h / 2);
      g.restore(); g.textAlign = 'left';
    });
    tex.needsUpdate = true;
  }
  draw();
  setInterval(() => { focus = (focus + 1) % apps.length; draw(); }, 1300);
  return { tex, draw };
}

/* --------------------------------------------------------- the scene */
export function createTVStory({ canvas, manager, reduced }) {
  const isMobile = matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
  renderer.setClearColor(0x020d0a, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x020d0a, 7, 18);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const loader = new THREE.TextureLoader(manager);
  const humTex = loader.load('assets/img/screen-hummingbird.jpg');
  const flowerTex = loader.load('assets/img/screen-flower.jpg');
  [humTex, flowerTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const humImg = new Image();
  humImg.src = 'assets/img/screen-hummingbird.jpg';
  const smartUI = createSmartUI(humImg);
  humImg.onload = () => smartUI.draw();
  document.fonts && document.fonts.ready.then(() => smartUI.draw());

  /* ---- TV model ---- */
  const tv = new THREE.Group();       // origin at floor, centre of stand
  const tvBody = new THREE.Group();   // panel + stand, scaled by size
  tv.add(tvBody);
  scene.add(tv);

  const metal = new THREE.MeshPhysicalMaterial({ color: 0x1a1f1d, metalness: 0.85, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const darkBack = new THREE.MeshStandardMaterial({ color: 0x0c0f0e, metalness: 0.3, roughness: 0.65 });
  const portMat = new THREE.MeshStandardMaterial({ color: 0x020303, metalness: 0.2, roughness: 0.9 });
  const panelY = FOOT + H55 / 2 + 0.006;

  // frame (bezel-less: 6 mm all round)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W55 + 0.012, H55 + 0.014, 0.012), metal);
  frame.position.set(0, panelY, 0);
  tvBody.add(frame);

  const screenUniforms = {
    uTime: { value: 0 }, uPower: { value: 0 }, uModeA: { value: 0 }, uModeB: { value: 0 }, uMix: { value: 0 },
    uAspect: { value: W55 / H55 }, uTilt: { value: 0 },
    uHum: { value: humTex }, uFlower: { value: flowerTex }, uUI: { value: smartUI.tex },
  };
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(W55, H55),
    new THREE.ShaderMaterial({
      uniforms: screenUniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: screenFrag,
    })
  );
  screen.position.set(0, panelY, 0.0062);
  tvBody.add(screen);

  // logo on the bottom bezel + tab
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.0125), new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true }));
  logo.position.set(0, panelY - H55 / 2 - 0.0035, 0.0062);
  logo.scale.setScalar(0.55);
  tvBody.add(logo);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.01), metal);
  tab.position.set(0, panelY - H55 / 2 - 0.009, 0.002);
  tvBody.add(tab);

  // back housing (rounded, extruded)
  const backShape = roundedRectShape(W55 * 0.74, H55 * 0.66, 0.05);
  const backGeo = new THREE.ExtrudeGeometry(backShape, { depth: 0.032, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 4, curveSegments: 10 });
  const back = new THREE.Mesh(backGeo, darkBack);
  back.position.set(0, panelY - 0.04, -0.006 - 0.044);
  tvBody.add(back);

  // port cluster on the right flank of the housing
  const ports = new THREE.Group();
  const portSpec = [[0.018, 0.008], [0.018, 0.008], [0.018, 0.008], [0.012, 0.006], [0.012, 0.006], [0.01, 0.01], [0.016, 0.014]];
  portSpec.forEach(([h, w], i) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.004, h, w * 1.6), portMat);
    p.position.set(0, i * 0.03, 0);
    ports.add(p);
  });
  ports.position.set(W55 * 0.37 + 0.0145, panelY - 0.14, -0.034);
  tvBody.add(ports);

  // blade feet (Λ shape) near both ends
  const footGeo = new THREE.BoxGeometry(0.018, 0.12, 0.012);
  [-1, 1].forEach((sx) => {
    const foot = new THREE.Group();
    const a = new THREE.Mesh(footGeo, metal); a.rotation.x = 0.62; a.position.set(0, 0.048, 0.03);
    const b = new THREE.Mesh(footGeo, metal); b.rotation.x = -0.62; b.position.set(0, 0.048, -0.03);
    foot.add(a, b);
    foot.position.set(sx * (W55 / 2 - 0.13), 0, -0.006);
    foot.rotation.z = sx * -0.12;
    tvBody.add(foot);
  });

  /* ---- environment ---- */
  const floorU = { uGlow: { value: new THREE.Color(GLOW.infinity) }, uGlowAmt: { value: 0 }, uTv: { value: new THREE.Vector2() }, uTvW: { value: W55 } };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShaderMaterial({
      uniforms: floorU,
      vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: floorFrag,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallU = { uTime: { value: 0 } };
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 14),
    new THREE.ShaderMaterial({
      uniforms: wallU, fog: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: wallFrag,
    })
  );
  wall.position.set(0, 5.5, -9);
  scene.add(wall);

  // dust motes
  const N = isMobile ? 220 : 480;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 1] = Math.random() * 4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xdfeec0, size: 0.012, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // person for scale (sizes chapter)
  const person = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1.75),
    new THREE.MeshBasicMaterial({ map: personTexture(), transparent: true, opacity: 0, depthWrite: false })
  );
  person.position.set(1.6, 0.875, 0.2);
  scene.add(person);

  // lights
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb8d433, 2.2); rim.position.set(-3, 2, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x5eead4, 1.2); rim2.position.set(3.5, 1.2, -2.5); scene.add(rim2);

  /* ---- post ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.65, 0.8);
  composer.addPass(bloom);
  const finish = new ShaderPass(finishShader);
  composer.addPass(finish);
  composer.addPass(new OutputPass());

  /* ---- layout + keyframes ---- */
  let aspect = 1, portrait = false;
  const hfovDist = (worldW) => {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    return worldW / 2 / Math.tan(hfov / 2);
  };
  const vfovDist = (worldH) => worldH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const fit = (w, h) => Math.max(hfovDist(w), vfovDist(h));

  // Each key: TV pose + camera. Built per layout on resize.
  let KEYS = [];
  function buildKeys() {
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * aspect);
    const halfW = (d) => d * Math.tan(hfov / 2);
    const ty = portrait ? 0.75 : 0;               // look lower => TV sits higher, above the copy (portrait)
    const fW = portrait ? 1.25 : 2.1;               // frame width multiplier
    const base = fit(W55 * fW, H55 * 2.6);
    // push the TV into the half of the viewport not covered by the copy panel
    const side = portrait ? 0 : Math.max(0.42, halfW(base * 0.7) * 0.4);
    KEYS = [
      // hero
      { rotY: -0.28, rotX: 0, x: 0, y: 0, scale: 1, sizeMode: 0, camX: 0.1, camY: 0.72, camD: base * 0.98, lookY: panelY - 0.02 },
      // design (side profile)
      { rotY: -1.18, rotX: 0.04, x: portrait ? 0.05 : -side * 0.95, y: 0.02, scale: 1, sizeMode: 0, camX: 0.15, camY: 0.78, camD: base * 0.62, lookY: panelY - ty * 0.4 },
      // sizes
      { rotY: 0, rotX: 0, x: portrait ? -0.25 : -0.25, y: 0, scale: 1, sizeMode: 1, camX: portrait ? 0.35 : 0.5, camY: 1.15, camD: fit(4.1, 3.0) * (portrait ? 1.0 : 0.92), lookY: portrait ? 0.35 : 0.72 },
      // 4k
      { rotY: 0.34, rotX: 0, x: side, y: 0, scale: 1, sizeMode: 0, camX: side * 0.2, camY: 0.7, camD: base * 0.7, lookY: panelY - ty * 0.4 },
      // qled
      { rotY: -0.34, rotX: 0, x: -side, y: 0, scale: 1, sizeMode: 0, camX: -side * 0.2, camY: 0.7, camD: base * 0.7, lookY: panelY - ty * 0.4 },
      // oled
      { rotY: 0.34, rotX: 0, x: side, y: 0, scale: 1, sizeMode: 0, camX: side * 0.2, camY: 0.7, camD: base * 0.7, lookY: panelY - ty * 0.4 },
      // smart
      { rotY: -0.22, rotX: 0, x: -side * 0.9, y: 0, scale: 1, sizeMode: 0, camX: -0.1, camY: 0.82, camD: base * 0.8, lookY: panelY - ty * 0.4 },
    ];
    // on narrow screens never let the panel overflow the viewport
    if (portrait) KEYS.forEach((k) => { if (!k.sizeMode) k.camD = Math.max(k.camD, hfovDist(W55 * 1.18)); });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    aspect = w / h; portrait = aspect < 0.85;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    buildKeys();
  }
  resize();
  addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas);

  /* ---- scroll wiring ---- */
  const { ScrollTrigger } = window;
  const chapters = [...document.querySelectorAll('#story .chapter')];
  const triggers = chapters.slice(1).map((el) => ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top 25%' }));
  const ease = (t) => t * t * (3 - 2 * t);

  const SIZES = [32, 43, 55, 65, 75, 86, 98];
  const sizeEl = document.getElementById('sizeNum');
  const sizeDist = document.getElementById('sizeDist');
  const railSpans = [...document.querySelectorAll('#sizeRail span')];
  let sizeNow = 32, lastShown = 0;
  const sizeST = ScrollTrigger.create({ trigger: '#ch-sizes', start: 'top 30%', end: 'bottom 70%' });
  function readSize() {
    const p = sizeST.progress;
    const f = p * (SIZES.length - 1);
    const i = Math.min(Math.floor(f), SIZES.length - 2);
    const fr = ease(THREE.MathUtils.clamp((f - i - 0.25) / 0.5, 0, 1));
    return THREE.MathUtils.lerp(SIZES[i], SIZES[i + 1], fr);
  }

  // screen mode switching
  let curMode = 'infinity', mixTween = null;
  const glowTarget = new THREE.Color(GLOW.infinity);
  function setScreen(mode) {
    if (mode === curMode || !(mode in MODES)) return;
    const u = screenUniforms;
    if (mixTween) { mixTween.kill(); if (u.uMix.value > 0.5) u.uModeA.value = u.uModeB.value; }
    u.uModeB.value = MODES[mode];
    u.uMix.value = 0;
    curMode = mode;
    glowTarget.set(GLOW[mode]);
    mixTween = window.gsap.to(u.uMix, {
      value: 1, duration: reduced ? 0.01 : 1.1, ease: 'power2.inOut',
      onComplete: () => { u.uModeA.value = u.uModeB.value; u.uMix.value = 0; mixTween = null; },
    });
  }
  chapters.forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) setScreen(el.dataset.screen); },
    });
  });

  // stop rendering once the showroom covers the stage
  let active = true;
  ScrollTrigger.create({
    trigger: '#story', start: 'top top', end: 'bottom top',
    onLeave: () => { active = false; canvas.style.visibility = 'hidden'; },
    onEnterBack: () => { active = true; canvas.style.visibility = 'visible'; },
  });

  /* ---- pointer ---- */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---- intro ---- */
  const intro = { lift: -0.25, spin: -0.9, dolly: 1.35, glow: 0 };

  function powerOn() {
    const gsap = window.gsap;
    const tl = gsap.timeline();
    tl.to(intro, { lift: 0, spin: 0, dolly: 1, duration: reduced ? 0.01 : 2.4, ease: 'expo.out' }, 0)
      .to(screenUniforms.uPower, { value: 1, duration: reduced ? 0.01 : 1.5, ease: 'power2.inOut' }, 0.5)
      .to(intro, { glow: 1, duration: 1.6, ease: 'power2.out' }, 1.1);
    return tl;
  }

  /* ---- loop ---- */
  const S = { ...KEYS[0] };
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();

  function tick() {
    requestAnimationFrame(tick);
    if (!active) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // compose target pose from chapter progress
    const target = { ...KEYS[0] };
    triggers.forEach((st, i) => {
      const k = ease(st.progress);
      if (k <= 0) return;
      const to = KEYS[i + 1];
      for (const key in target) target[key] = THREE.MathUtils.lerp(target[key], to[key], k);
    });
    const damp = 1 - Math.exp(-dt * 5);
    for (const key in S) S[key] += (target[key] - S[key]) * damp;

    // sizes
    const sz = readSize();
    sizeNow += (sz - sizeNow) * (1 - Math.exp(-dt * 8));
    const shown = Math.round(sizeNow);
    if (shown !== lastShown) {
      lastShown = shown;
      sizeEl.textContent = shown;
      const near = SIZES.reduce((a, b) => (Math.abs(b - sizeNow) < Math.abs(a - sizeNow) ? b : a));
      railSpans.forEach((s) => s.classList.toggle('on', +s.textContent === near));
      sizeDist.textContent = `Ideal viewing distance ≈ ${(shown * 0.0254 * 1.2).toFixed(1)} m`;
    }
    const scale = THREE.MathUtils.lerp(1, sizeNow / 55, S.sizeMode);
    person.material.opacity = S.sizeMode * 0.95;
    person.position.x = S.x + (W55 * scale) / 2 + 0.55;

    // pointer smoothing
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));

    tvBody.scale.setScalar(scale);
    tv.position.set(S.x, S.y + intro.lift, 0);
    tv.rotation.y = S.rotY + intro.spin + pointer.sx * 0.12;
    tv.rotation.x = S.rotX + pointer.sy * 0.04;
    tv.position.y += Math.sin(t * 0.8) * 0.006 * (1 - S.sizeMode);

    const d = S.camD * intro.dolly;
    camera.position.set(S.camX + pointer.sx * 0.12, S.camY - pointer.sy * 0.06, d);
    camera.lookAt(tmp.set(S.camX * 0.4, S.lookY, 0));

    // uniforms
    screenUniforms.uTime.value = t;
    screenUniforms.uTilt.value = pointer.sx * 0.3 + Math.sin(tv.rotation.y) * 0.4;
    wallU.uTime.value = t;
    floorU.uGlow.value.lerp(glowTarget, 1 - Math.exp(-dt * 3));
    floorU.uGlowAmt.value = 0.22 * intro.glow * screenUniforms.uPower.value;
    floorU.uTv.value.set(tv.position.x, 0);
    floorU.uTvW.value = W55 * scale;

    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += dt * 0.03;
      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dust.rotation.y = t * 0.01;

    composer.render(dt);
  }
  requestAnimationFrame(tick);

  return { powerOn, setScreen, resize };
}
