// "View in your space" — AR product placement at true real-world scale.
//
// Uses <model-viewer> (vendored) which picks the best AR path per device:
//   • Android Chrome  → WebXR (in-page, with hit-testing) or Scene Viewer
//   • iPhone / iPad   → AR Quick Look with our baked USDZ
// Fallbacks: live-camera preview on phones without AR, and a QR hand-off on
// desktop. Models are baked by `npm run export:ar` into assets/ar/.
const BASE = new URL('../', import.meta.url).href;            // site root (works from any page)
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

let manifestP, mvP, qrP;
const getManifest = () => (manifestP ||= fetch(BASE + 'assets/ar/manifest.json').then((r) => r.json()).then((j) => j.models));
const loadScript = (src, module) => new Promise((res, rej) => {
  const s = document.createElement('script');
  if (module) s.type = 'module';
  s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src));
  document.head.appendChild(s);
});
const loadModelViewer = () => (mvP ||= customElements.get('model-viewer') ? Promise.resolve() : loadScript(BASE + 'vendor/model-viewer.min.js', true).then(() => customElements.whenDefined('model-viewer')));
const loadQR = () => (qrP ||= window.qrcode ? Promise.resolve() : loadScript(BASE + 'vendor/qrcode.js'));

export function track(type, model, extra = {}) {
  if (!/^https?:/.test(location.protocol)) return;
  try {
    fetch(BASE + 'api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ type, model, page: location.pathname, ...extra }) }).catch(() => {});
  } catch { /* static hosting without the API */ }
}

const fmt = (m) => (m >= 1 ? `${m.toFixed(2)} m` : `${Math.round(m * 100)} cm`);
const placementCopy = (p) => (p === 'wall' ? { verb: 'Place it on your wall', hint: 'Point your phone at a wall and move it slowly side to side.' } : { verb: 'Place it on your floor', hint: 'Point your phone at the floor or a table and move it slowly.' });
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.5 3.6L12 11.5 5.5 7.9 12 4.3ZM5 9.6l6 3.3v6.8l-6-3.3V9.6Zm8 10.1v-6.8l6-3.3v6.8l-6 3.3Z" fill="currentColor"/></svg>';

let el = null, mv = null, state = { item: null, items: [], stream: null, opts: {} };

function build() {
  el = document.createElement('div');
  el.className = 'arv';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'arvTitle');
  el.innerHTML = `
    <div class="arv-backdrop" data-arv-close></div>
    <div class="arv-card">
      <header class="arv-head">
        <div>
          <p class="arv-eyebrow"><i></i> View in your space · true to size</p>
          <h3 id="arvTitle" class="arv-title"></h3>
          <p class="arv-dims" id="arvDims"></p>
        </div>
        <button class="arv-close" data-arv-close aria-label="Close">×</button>
      </header>
      <div class="arv-stage">
        <video class="arv-cam" playsinline muted></video>
        <div class="arv-loading" id="arvLoading"><span></span>Loading 3D model…</div>
      </div>
      <div class="arv-row">
        <div class="seg arv-place" id="arvPlace" role="radiogroup" aria-label="Placement" hidden>
          <button type="button" role="radio" data-place="wall">On the wall</button>
          <button type="button" role="radio" data-place="floor">On a table / floor</button>
        </div>
        <div class="arv-sizes" id="arvSizes" role="radiogroup" aria-label="Screen size"></div>
      </div>
      <div class="arv-actions">
        <div class="arv-hint" id="arvHint"></div>
        <div class="arv-buttons">
          <button class="btn btn-ghost arv-cam-btn" id="arvCamBtn" hidden><span>Live camera preview</span></button>
          <a class="btn btn-ghost" id="arvEnquire" href="#"><span>Enquire</span></a>
        </div>
      </div>
      <div class="arv-qr" id="arvQr" hidden>
        <div class="arv-qr-code" id="arvQrCode" aria-label="QR code"></div>
        <div>
          <p class="arv-qr-title">Scan with your phone</p>
          <p class="arv-qr-text">Opens this product in AR — place it on your wall or floor at its real size. Works with Safari on iPhone and Chrome on Android.</p>
          <p class="arv-qr-url" id="arvQrUrl"></p>
        </div>
      </div>
      <p class="arv-status" id="arvStatus" role="status" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => { if (e.target.closest('[data-arv-close]')) closeAR(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) closeAR(); });
  el.querySelector('#arvCamBtn').addEventListener('click', toggleCamera);
}

function makeViewer() {
  mv = document.createElement('model-viewer');
  const attrs = {
    // Native AR first: Scene Viewer (Android/ARCore) and Quick Look (iOS) render far more reliably than
    // in-page WebXR, which stays as the fallback. No 'xr-environment': light estimation can make dark
    // products almost invisible in dim rooms.
    ar: '', 'ar-modes': 'scene-viewer quick-look webxr', 'ar-scale': 'fixed', 'camera-controls': '', 'touch-action': 'pan-y',
    'shadow-intensity': '1', 'shadow-softness': '0.85', 'environment-image': 'neutral', exposure: '1.0', 'interaction-prompt': 'auto',
    'auto-rotate': '', 'auto-rotate-delay': '2500', 'rotation-per-second': '12deg', loading: 'eager',
  };
  Object.entries(attrs).forEach(([k, v]) => mv.setAttribute(k, v));
  mv.innerHTML = `
    <button slot="ar-button" class="arv-ar-btn" id="arvArBtn">${icon}<span>Place it in your room</span></button>
    <div slot="progress-bar" class="arv-progress"><i></i></div>
    <button slot="hotspot-w" class="arv-hs" data-position="0m 0m 0m" data-normal="0m 1m 0m" data-visibility-attribute="visible"><span id="arvHsW"></span></button>
    <button slot="hotspot-h" class="arv-hs" data-position="0m 0m 0m" data-normal="1m 0m 0m" data-visibility-attribute="visible"><span id="arvHsH"></span></button>
    <div class="arv-ar-prompt" slot="ar-prompt">${icon}<p></p></div>
    <div class="arv-ar-hud"><b id="arvHudName"></b><span id="arvHudSize"></span><em id="arvHudTip"></em></div>`;
  el.querySelector('.arv-stage').appendChild(mv);
  mv.querySelector('#arvArBtn').addEventListener('click', () => { stopCamera(); track('ar_launch', state.item.id, { mode: arMode() }); });
  mv.addEventListener('progress', (e) => { mv.querySelector('.arv-progress i').style.transform = `scaleX(${e.detail.totalProgress})`; });
  mv.addEventListener('load', onLoaded);
  mv.addEventListener('error', () => status('Could not load this model. Please try again.'));
  mv.addEventListener('ar-status', (e) => {
    const s = e.detail.status;
    if (s === 'object-placed') { clearTimeout(state.placeTimer); track('ar_placed', state.item.id, { mode: 'webxr' }); status('Placed at real size. Walk around it!'); el.querySelector('#arvHudTip').textContent = 'True size · walk around it'; }
    if (s === 'failed') { clearTimeout(state.placeTimer); track('ar_failed', state.item.id, { mode: arMode() }); status('AR could not start on this device — use the live camera preview below.'); showCameraFallback(true); }
    if (s === 'session-started') {
      status('');
      el.querySelector('#arvHudTip').textContent = placementCopy(state.item.placement).hint;
      clearTimeout(state.placeTimer);
      state.placeTimer = setTimeout(() => {
        el.querySelector('#arvHudTip').textContent = state.item.placement === 'wall'
          ? 'Plain walls are hard to detect — aim at a wall with a switchboard, frame or edge, 1–2 m away. Or close AR and choose “On a table”.'
          : 'Move closer to the floor or table and sweep slowly. Good light helps.';
      }, 9000);
    }
    if (s === 'not-presenting') clearTimeout(state.placeTimer);
  });
}

function onLoaded() {
  el.querySelector('#arvLoading').classList.add('done');
  const d = state.item.dims;
  const c = mv.getBoundingBoxCenter(), size = mv.getDimensions();
  const top = c.y + size.y / 2, right = c.x + size.x / 2;
  const hw = mv.querySelector('[slot="hotspot-w"]'), hh = mv.querySelector('[slot="hotspot-h"]');
  hw.dataset.position = `${c.x}m ${top + 0.02}m ${c.z + size.z / 2}m`;
  hh.dataset.position = `${right + 0.02}m ${c.y}m ${c.z + size.z / 2}m`;
  mv.updateHotspot({ name: 'hotspot-w', position: hw.dataset.position });
  mv.updateHotspot({ name: 'hotspot-h', position: hh.dataset.position });
  el.querySelector('#arvHsW').textContent = fmt(d.w);
  el.querySelector('#arvHsH').textContent = fmt(d.h);
  // AR availability decides the hand-off path
  if (mv.canActivateAR) {
    el.classList.add('has-ar');
    status('');
    if (isMobile) showCameraFallback(false);   // always give phones a guaranteed way to see it on camera
  } else if (isMobile) {
    showCameraFallback();
    track('ar_unsupported', state.item.id);
  } else {
    showQR();
  }
}

function status(t) { el.querySelector('#arvStatus').textContent = t; }

function showCameraFallback(noAR = true) {
  if (!navigator.mediaDevices?.getUserMedia) return;
  el.querySelector('#arvCamBtn').hidden = false;
  if (noAR) el.querySelector('#arvHint').textContent = 'AR placement isn’t available in this browser — preview it over your camera instead.';
}
const arMode = () => (isIOS ? 'quick-look' : /Android/i.test(navigator.userAgent) ? 'scene-viewer/webxr' : 'none');

async function toggleCamera() {
  const btn = el.querySelector('#arvCamBtn'), video = el.querySelector('.arv-cam');
  if (state.stream) { stopCamera(); btn.querySelector('span').textContent = 'Live camera preview'; return; }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = state.stream; await video.play();
    el.classList.add('on-camera');
    mv.removeAttribute('auto-rotate');
    btn.querySelector('span').textContent = 'Stop camera';
    status('Preview mode — drag to turn it, pinch to move closer. For true placement use AR on Safari (iPhone) or Chrome (Android).');
    track('camera_preview', state.item.id);
  } catch {
    status('Camera permission was blocked. You can enable it in your browser settings.');
  }
}
function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
  state.stream = null;
  el.classList.remove('on-camera');
  if (mv && state.item?.placement !== 'wall') mv.setAttribute('auto-rotate', '');
}

async function showQR() {
  const box = el.querySelector('#arvQr');
  let origin = location.origin;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    try { const n = await fetch(BASE + 'api/network').then((r) => r.json()); if (n.urls?.[0]) origin = n.urls[0]; } catch { /* static server */ }
  }
  const path = new URL('ar.html', BASE).pathname;
  const url = `${origin}${path}?m=${encodeURIComponent(state.item.id)}`;
  await loadQR();
  const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
  el.querySelector('#arvQrCode').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  el.querySelector('#arvQrUrl').textContent = url;
  box.hidden = false;
  el.classList.add('has-qr');
  el.querySelector('#arvHint').textContent = 'AR placement needs a phone or tablet camera.';
  track('qr_shown', state.item.id);
}

function renderSizes() {
  const wrap = el.querySelector('#arvSizes');
  const sizes = state.items.filter((m) => m.group === state.item.group && m.size).sort((a, b) => a.size - b.size);
  wrap.innerHTML = sizes.length > 1 ? sizes.map((m) => `<button type="button" role="radio" aria-checked="${m.id === state.item.id}" data-id="${m.id}">${m.size}″</button>`).join('') : '';
  wrap.hidden = sizes.length < 2;
  wrap.onclick = (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b || b.dataset.id === state.item.id) return;
    setItem(state.items.find((m) => m.id === b.dataset.id));
    track('size_change', b.dataset.id);
  };
}

function setItem(item) {
  state.item = item;
  const copy = placementCopy(item.placement);
  el.querySelector('#arvTitle').textContent = item.name;
  el.querySelector('#arvDims').textContent = `${fmt(item.dims.w)} wide · ${fmt(item.dims.h)} tall · ${fmt(item.dims.d)} deep`;
  el.querySelector('#arvHudName').textContent = item.name;
  el.querySelector('#arvHudSize').textContent = `${fmt(item.dims.w)} × ${fmt(item.dims.h)} · true size`;
  const place = el.querySelector('#arvPlace');
  place.hidden = !item.alt;
  place.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.place === item.placement)));
  place.onclick = (e) => {
    const b = e.target.closest('button[data-place]');
    if (!b || b.dataset.place === state.item.placement || !state.item.alt) return;
    const alt = state.items.find((m) => m.id === state.item.alt);
    if (alt) { setItem(alt); track('size_change', alt.id, { mode: 'placement:' + alt.placement }); }
  };
  el.querySelector('#arvLoading').classList.remove('done');
  el.querySelector('#arvHint').textContent = copy.hint;
  el.querySelector('#arvEnquire').href = new URL(`index.html?model=${item.id}#contact`, BASE).href;
  mv.querySelector('#arvArBtn span').textContent = copy.verb;
  mv.querySelector('.arv-ar-prompt p').textContent = copy.hint;
  mv.setAttribute('ar-placement', item.placement);
  mv.setAttribute('alt', `${item.name}, ${fmt(item.dims.w)} by ${fmt(item.dims.h)}`);
  // wall products: keep the camera in front (their backs aren't interesting); floor products can spin
  if (item.placement === 'wall') {
    mv.removeAttribute('auto-rotate');
    mv.setAttribute('camera-orbit', '-22deg 84deg auto');
    mv.setAttribute('min-camera-orbit', '-65deg 30deg auto');
    mv.setAttribute('max-camera-orbit', '65deg 110deg auto');
  } else {
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('camera-orbit', '28deg 70deg auto');
    mv.removeAttribute('min-camera-orbit'); mv.removeAttribute('max-camera-orbit');
  }
  mv.setAttribute('ios-src', BASE + item.usdz);
  const src = BASE + item.glb;
  if (mv.getAttribute('src') === src && mv.loaded) onLoaded();   // same model reopened: no new load event
  else mv.setAttribute('src', src);
  renderSizes();
}

/**
 * Open the AR viewer for a model id from assets/ar/manifest.json.
 * opts: { source, onOpen, onClose, standalone }
 */
export async function openAR(id, opts = {}) {
  if (!el) build();
  state.opts = opts;
  el.classList.toggle('standalone', !!opts.standalone);
  el.classList.add('open');
  el.classList.remove('has-ar', 'on-camera', 'has-qr');
  el.querySelector('#arvQr').hidden = true;
  el.querySelector('#arvCamBtn').hidden = true;
  status('');
  document.documentElement.classList.add('arv-lock');
  opts.onOpen?.();
  try {
    const [items] = await Promise.all([getManifest(), loadModelViewer()]);
    state.items = items;
    const item = items.find((m) => m.id === id);
    if (!item) throw new Error('Unknown AR model ' + id);
    if (!mv) makeViewer();
    setItem(item);
    track('view_3d', item.id, { mode: opts.source || null });
    setTimeout(() => el.querySelector('.arv-close').focus({ preventScroll: true }), 60);
  } catch (err) {
    console.error(err);
    el.querySelector('#arvLoading').classList.add('done');
    status('AR models are not available. Run “npm run export:ar” and serve with “npm start”.');
  }
}

export function closeAR() {
  if (!el) return;
  if (state.opts.standalone) { location.href = new URL('products.html', BASE).href; return; }
  stopCamera();
  el.classList.remove('open');
  document.documentElement.classList.remove('arv-lock');
  state.opts.onClose?.();
}

// Map storefront products to AR models.
export const AR_FOR_PRODUCT = { camera: 'camera', led: 'led', kiosk: 'kiosk', visualizer: 'visualizer', display: 'display-55' };
export const tvModelFor = (inch) => `tv-${[32, 43, 55, 65, 75, 86, 98].reduce((a, b) => (Math.abs(b - inch) < Math.abs(a - inch) ? b : a))}`;
