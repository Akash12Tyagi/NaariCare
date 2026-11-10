// "View in your space" — AR product placement at true real-world scale.
//
// A guided flow, so nobody is dropped into a camera without knowing what to do:
//   1. Choose      — 3D preview, size + placement, one clear primary button
//   2. Coach       — a 10-second "here's what happens next" sheet with an animated demo
//   3. Camera      — native AR (Quick Look on iPhone, Scene Viewer / WebXR on Android),
//                    or a full-screen live-camera preview with gesture hints and a photo button
//   4. Welcome back— "Did it appear?" → next step, or targeted fixes if it didn't
// Desktop gets a QR hand-off. The phone's Back button closes the top layer instead of leaving the page.
// Models are baked by `npm run export:ar` into assets/ar/.
const BASE = new URL('../', import.meta.url).href;            // site root (works from any page)
const UA = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
const isAndroid = /Android/i.test(UA);
const isMobile = isIOS || isAndroid;
const isInApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|; wv\)/i.test(UA);
const canPreview = () => !!navigator.mediaDevices?.getUserMedia;   // needs https (or localhost)

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

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const fmt = (m) => (m >= 1 ? `${m.toFixed(2)} m` : `${Math.round(m * 100)} cm`);
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.5 3.6L12 11.5 5.5 7.9 12 4.3ZM5 9.6l6 3.3v6.8l-6-3.3V9.6Zm8 10.1v-6.8l6-3.3v6.8l-6 3.3Z" fill="currentColor"/></svg>';
const camIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="currentColor"/></svg>';

// Animated "how it works": the phone sweeps, tracking dots appear, the product lands.
const illo = `
<svg viewBox="0 0 320 170" aria-hidden="true">
  <g class="v-wall">
    <rect x="18" y="8" width="284" height="140" rx="6" class="plane"/>
    <line x1="18" y1="148" x2="302" y2="148" class="edge"/>
    ${[[70, 40], [120, 30], [180, 44], [240, 34], [90, 90], [150, 76], [210, 96], [262, 82], [120, 122], [200, 128]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" class="dot" style="animation-delay:${(i * 0.16).toFixed(2)}s"/>`).join('')}
    <g class="obj"><rect x="98" y="38" width="124" height="72" rx="3" class="tv"/><rect x="104" y="44" width="112" height="60" class="tv-scr"/><text x="160" y="126" class="dim">true size</text></g>
  </g>
  <g class="v-floor">
    <polygon points="20,162 300,162 252,74 68,74" class="plane"/>
    ${[[80, 150], [140, 154], [210, 150], [262, 146], [100, 118], [170, 124], [228, 116], [120, 90], [196, 92]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" class="dot" style="animation-delay:${(i * 0.16).toFixed(2)}s"/>`).join('')}
    <g class="obj"><rect x="140" y="30" width="40" height="92" rx="4" class="tv"/><rect x="145" y="36" width="30" height="50" class="tv-scr"/><ellipse cx="160" cy="124" rx="34" ry="6" class="shadow"/></g>
  </g>
  <g class="phone"><rect x="137" y="58" width="46" height="84" rx="9" class="ph"/><rect x="141" y="66" width="38" height="66" rx="3" class="ph-scr"/><circle cx="160" cy="62" r="1.4" class="ph-cam"/></g>
</svg>`;

let el = null, mv = null;
const state = { item: null, items: [], stream: null, opts: {}, awaitReturn: false, sessionStarted: false, placed: false, ready: false };
const $ = (s) => el.querySelector(s);

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
        <div class="arv-loading" id="arvLoading"><span></span><p>Loading 3D model <b id="arvPct">0%</b></p></div>
        <p class="arv-toast" id="arvStatus" role="status" aria-live="polite"></p>
        <div class="arv-camui">
          <div class="arv-camtop">
            <button type="button" class="arv-pill" data-cam-exit aria-label="Back to product">‹ Back</button>
            <p><b id="arvCamName"></b><small id="arvCamNote">Camera preview · size is approximate</small></p>
          </div>
          <p class="arv-gestures" id="arvGestures"><span>☝ Drag to turn</span><span>🤏 Pinch to resize</span><span>✌ Two fingers to move</span></p>
          <div class="arv-cambar">
            <button type="button" class="arv-pill" data-cam-exit>Done</button>
            <button type="button" class="arv-shutter" id="arvShot" aria-label="Take a photo"><i></i></button>
            <button type="button" class="arv-pill" id="arvCamAR" hidden>True size AR</button>
          </div>
          <div class="arv-flash" id="arvFlash"></div>
        </div>
      </div>
      <div class="arv-body">
        <div class="arv-row">
          <div class="arv-field" id="arvPlaceField" hidden>
            <span class="arv-label">Where will it go?</span>
            <div class="seg arv-place" id="arvPlace" role="radiogroup" aria-label="Placement">
              <button type="button" role="radio" data-place="wall">On the wall</button>
              <button type="button" role="radio" data-place="floor">On a table / floor</button>
            </div>
          </div>
          <div class="arv-field" id="arvSizeField" hidden>
            <span class="arv-label">Screen size</span>
            <div class="arv-sizes" id="arvSizes" role="radiogroup" aria-label="Screen size"></div>
          </div>
        </div>
        <ol class="arv-steps" id="arvSteps" aria-label="How it works">
          <li class="on"><i>1</i><span>Choose size</span></li>
          <li><i>2</i><span id="arvStep2">Open camera</span></li>
          <li><i>3</i><span>Place it</span></li>
        </ol>
        <div class="arv-cta" id="arvCta">
          <button type="button" class="btn btn-primary btn-lg arv-go" id="arvGo" disabled>${icon}<span>Preparing…</span></button>
          <p class="arv-sub" id="arvSub"></p>
          <div class="arv-links">
            <button type="button" class="arv-link" id="arvPreviewLink" hidden>Trouble with AR? Use the simple camera preview</button>
            <button type="button" class="arv-link" id="arvCopy" hidden>Copy link</button>
            <a class="arv-link" id="arvEnquire" href="#">Enquire about this product →</a>
          </div>
        </div>
        <div class="arv-qr" id="arvQr" hidden>
          <div class="arv-qr-code" id="arvQrCode" aria-label="QR code"></div>
          <div>
            <p class="arv-qr-title">Scan with your phone camera</p>
            <p class="arv-qr-text">It opens this product on your phone. Then tap <b>“Open camera”</b>, point at your wall or floor, and it appears at its real size. Works with Safari on iPhone and Chrome on Android.</p>
            <p class="arv-qr-url" id="arvQrUrl"></p>
          </div>
        </div>
      </div>
    </div>

    <section class="arv-sheet" id="arvCoach" hidden aria-labelledby="arvCoachTitle">
      <div class="arv-illo" id="arvIllo">${illo}</div>
      <p class="arv-eyebrow"><i></i> Takes about 10 seconds</p>
      <h4 class="arv-sheet-title" id="arvCoachTitle">Here’s what happens next</h4>
      <ol class="arv-howto" id="arvHowto"></ol>
      <p class="arv-note" id="arvCoachNote"></p>
      <div class="arv-sheet-actions">
        <button type="button" class="btn btn-primary" id="arvCoachGo">${camIcon}<span>Open camera</span></button>
        <button type="button" class="btn btn-ghost" data-sheet-close><span>Not now</span></button>
      </div>
      <label class="arv-check"><input type="checkbox" id="arvCoachSkip" /> Don’t show this again</label>
    </section>

    <section class="arv-sheet" id="arvBack" hidden aria-labelledby="arvBackTitle">
      <div data-pane="ask">
        <p class="arv-eyebrow"><i></i> Welcome back</p>
        <h4 class="arv-sheet-title" id="arvBackTitle">Did it appear in your room?</h4>
        <div class="arv-sheet-actions">
          <button type="button" class="btn btn-primary" data-answer="yes"><span>Yes, I saw it</span></button>
          <button type="button" class="btn btn-ghost" data-answer="no"><span>No, it didn’t show</span></button>
        </div>
      </div>
      <div data-pane="yes" hidden>
        <p class="arv-eyebrow"><i></i> Looks good</p>
        <h4 class="arv-sheet-title">That was its exact size.</h4>
        <p class="arv-note" id="arvYesText"></p>
        <div class="arv-sheet-actions">
          <a class="btn btn-primary" id="arvYesEnquire" href="#"><span>Book a free demo</span></a>
          <button type="button" class="btn btn-ghost" data-sheet-close><span>Try another size</span></button>
        </div>
      </div>
      <div data-pane="no" hidden>
        <p class="arv-eyebrow"><i></i> Let’s fix that</p>
        <h4 class="arv-sheet-title">Three things that usually help</h4>
        <ol class="arv-howto" id="arvFixes"></ol>
        <div class="arv-sheet-actions">
          <button type="button" class="btn btn-primary" id="arvRetry">${icon}<span>Try again</span></button>
          <button type="button" class="btn btn-ghost" id="arvSwitch" hidden><span>Try “On a table” instead</span></button>
          <button type="button" class="btn btn-ghost" id="arvBackPreview" hidden><span>Simple camera preview</span></button>
        </div>
      </div>
    </section>

    <section class="arv-sheet arv-photo" id="arvPhoto" hidden aria-label="Your photo">
      <img id="arvPhotoImg" alt="Photo of the product in your room" />
      <div class="arv-sheet-actions">
        <button type="button" class="btn btn-primary" id="arvShare" hidden><span>Share</span></button>
        <a class="btn btn-primary" id="arvSave" download="onfinity-in-my-room.jpg" href="#"><span>Save photo</span></a>
        <button type="button" class="btn btn-ghost" data-sheet-close><span>Back to camera</span></button>
      </div>
    </section>`;
  document.body.appendChild(el);

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-arv-close]')) closeAR();
    else if (e.target.closest('[data-sheet-close]')) hideSheets();
    else if (e.target.closest('[data-cam-exit]')) stopCamera();
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !el.classList.contains('open')) return;
    if (!closeTopLayer()) closeAR();
  });
  // Android Back / browser back closes the camera or sheet first, then the viewer — never the page.
  addEventListener('popstate', () => {
    // Scene Viewer's failure fallback is a hash change — model-viewer handles that one itself.
    if (!el.classList.contains('open') || location.hash.includes('model-viewer-no-ar-fallback')) return;
    if (closeTopLayer()) history.pushState({ arv: 1 }, '');
    else closeAR(true);
  });

  $('#arvGo').addEventListener('click', onPrimary);
  $('#arvCoachGo').addEventListener('click', () => {
    if ($('#arvCoachSkip').checked) store.set('arv-coach-skip', '1');
    if (state.coachFor === 'preview') startCamera(); else launchAR();
  });
  $('#arvPreviewLink').addEventListener('click', () => openCoach('preview'));
  $('#arvBackPreview').addEventListener('click', () => openCoach('preview'));
  $('#arvRetry').addEventListener('click', launchAR);
  $('#arvCamAR').addEventListener('click', () => { stopCamera(); openCoach('ar'); });
  $('#arvSwitch').addEventListener('click', () => {
    const alt = state.items.find((m) => m.id === state.item.alt);
    hideSheets();
    if (alt) { setItem(alt); toast('Switched to “On a table / floor” — floors are much easier for phones to find.'); }
  });
  $('#arvCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied — paste it into Chrome or Safari.'); }
    catch { toast('Copy this page’s link and open it in Chrome or Safari.'); }
  });
  $('#arvBack').addEventListener('click', (e) => {
    const b = e.target.closest('[data-answer]');
    if (!b) return;
    track('ar_feedback', state.item.id, { mode: b.dataset.answer });
    showBackPane(b.dataset.answer);
  });
  $('#arvShot').addEventListener('click', takePhoto);
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
  // The built-in AR button is replaced by our own primary button (which coaches first).
  mv.innerHTML = `
    <button slot="ar-button" hidden></button>
    <div slot="progress-bar" class="arv-progress"><i></i></div>
    <button slot="hotspot-w" class="arv-hs" data-position="0m 0m 0m" data-normal="0m 1m 0m" data-visibility-attribute="visible"><span id="arvHsW"></span></button>
    <button slot="hotspot-h" class="arv-hs" data-position="0m 0m 0m" data-normal="1m 0m 0m" data-visibility-attribute="visible"><span id="arvHsH"></span></button>
    <div class="arv-ar-prompt" slot="ar-prompt">${icon}<p></p></div>
    <div class="arv-ar-hud"><b id="arvHudName"></b><span id="arvHudSize"></span><em id="arvHudTip"></em></div>`;
  $('.arv-stage').appendChild(mv);
  mv.addEventListener('progress', (e) => {
    const p = e.detail.totalProgress;
    mv.querySelector('.arv-progress i').style.transform = `scaleX(${p})`;
    $('#arvPct').textContent = `${Math.round(p * 100)}%`;
  });
  mv.addEventListener('load', onLoaded);
  mv.addEventListener('error', () => { $('#arvLoading').classList.add('done'); toast('Could not load this model. Check your connection and try again.', 0); });
  mv.addEventListener('ar-status', (e) => {
    const s = e.detail.status;
    if (s === 'session-started') {                      // in-page WebXR
      state.sessionStarted = true; clearTimeout(state.returnTimer); hideSheets();
      $('#arvHudTip').textContent = placeHint(state.item.placement);
      clearTimeout(state.placeTimer);
      state.placeTimer = setTimeout(() => {
        $('#arvHudTip').textContent = state.item.placement === 'wall'
          ? 'Still looking… aim at a wall with a frame, switchboard or edge, 1–2 m away.'
          : 'Still looking… move closer to the floor and sweep slowly. Good light helps.';
      }, 9000);
    }
    if (s === 'object-placed') { state.placed = true; clearTimeout(state.placeTimer); track('ar_placed', state.item.id, { mode: 'webxr' }); $('#arvHudTip').textContent = 'True size · walk around it'; }
    if (s === 'failed') {
      clearTimeout(state.placeTimer); clearTimeout(state.returnTimer);
      track('ar_failed', state.item.id, { mode: arMode() });
      state.awaitReturn = false;
      showBack('no');
    }
    if (s === 'not-presenting' && state.sessionStarted) {
      clearTimeout(state.placeTimer);
      state.sessionStarted = false; state.awaitReturn = false;
      showBack(state.placed ? 'yes' : null);
    }
  });
}

// Studio framing for the 3D preview; in camera mode the product sits smaller and lower, as if standing in the room.
function frame() {
  const wall = state.item.placement === 'wall', cam = !!state.stream;
  if (wall) {
    mv.removeAttribute('auto-rotate');
    mv.setAttribute('camera-orbit', cam ? '0deg 88deg 175%' : '-22deg 84deg auto');
    mv.setAttribute('min-camera-orbit', '-65deg 30deg auto');
    mv.setAttribute('max-camera-orbit', '65deg 110deg 320%');
  } else {
    if (cam) mv.removeAttribute('auto-rotate'); else mv.setAttribute('auto-rotate', '');
    mv.setAttribute('camera-orbit', cam ? '20deg 78deg 175%' : '28deg 70deg auto');
    mv.removeAttribute('min-camera-orbit');
    mv.setAttribute('max-camera-orbit', 'Infinity 180deg 320%');
  }
  if (cam && mv.loaded) {
    const c = mv.getBoundingBoxCenter(), d = mv.getDimensions();
    mv.setAttribute('camera-target', `${c.x}m ${c.y + d.y * 0.3}m ${c.z}m`);
  } else mv.removeAttribute('camera-target');
  mv.jumpCameraToGoal?.();
}

const placeHint = (p) => (p === 'wall' ? 'Point at your wall, 1–2 m away, and move your phone slowly side to side.' : 'Point at the floor and move your phone slowly in a small circle.');
const arMode = () => (isIOS ? 'quick-look' : isAndroid ? 'scene-viewer/webxr' : 'none');

function onLoaded() {
  $('#arvLoading').classList.add('done');
  const d = state.item.dims;
  const c = mv.getBoundingBoxCenter(), size = mv.getDimensions();
  const top = c.y + size.y / 2, right = c.x + size.x / 2;
  const hw = mv.querySelector('[slot="hotspot-w"]'), hh = mv.querySelector('[slot="hotspot-h"]');
  hw.dataset.position = `${c.x}m ${top + 0.02}m ${c.z + size.z / 2}m`;
  hh.dataset.position = `${right + 0.02}m ${c.y}m ${c.z + size.z / 2}m`;
  mv.updateHotspot({ name: 'hotspot-w', position: hw.dataset.position });
  mv.updateHotspot({ name: 'hotspot-h', position: hh.dataset.position });
  $('#arvHsW').textContent = fmt(d.w);
  $('#arvHsH').textContent = fmt(d.h);
  state.ready = true;
  configureCta();
}

// One primary action, chosen for this device.
function configureCta() {
  const go = $('#arvGo'), label = go.querySelector('span'), sub = $('#arvSub');
  const wall = state.item.placement === 'wall';
  go.disabled = false; go.hidden = false;
  $('#arvPreviewLink').hidden = true; $('#arvCopy').hidden = true; $('#arvQr').hidden = true;
  el.classList.remove('has-qr');
  if (mv.canActivateAR) {
    state.cta = 'ar';
    label.textContent = wall ? 'Open camera · place on wall' : 'Open camera · place on floor';
    sub.textContent = `Shows the ${fmt(state.item.dims.w)}-wide product at its exact size, through your camera.`;
    $('#arvPreviewLink').hidden = !canPreview();
  } else if (isMobile && canPreview()) {
    state.cta = 'preview';
    label.textContent = 'Open camera preview';
    sub.textContent = isInApp
      ? 'For true-size AR, open this page in Chrome or Safari. Here you can preview it over your camera.'
      : 'Your browser can’t do true-size AR, but you can preview it over your camera.';
    $('#arvCopy').hidden = !isInApp;
    track('ar_unsupported', state.item.id);
  } else if (isMobile) {
    state.cta = 'copy';
    go.hidden = true;
    sub.textContent = 'To see it in your room, open this page in Chrome (Android) or Safari (iPhone).';
    $('#arvCopy').hidden = false;
    track('ar_unsupported', state.item.id);
  } else {
    state.cta = 'qr';
    go.hidden = true;
    sub.textContent = '';
    $('#arvStep2').textContent = 'Scan with phone';
    showQR();
    return;
  }
  $('#arvStep2').textContent = 'Open camera';
}

function onPrimary() {
  if (state.cta === 'ar') openCoach('ar');
  else if (state.cta === 'preview') openCoach('preview');
}

/* ---------------------------------------------------------------- sheets */
function showSheet(id) {
  el.querySelectorAll('.arv-sheet').forEach((s) => { s.hidden = s.id !== id; });
  el.classList.add('sheet-open');
  setTimeout(() => el.querySelector(`#${id} .btn`)?.focus({ preventScroll: true }), 80);
}
function hideSheets() {
  const had = el.classList.contains('sheet-open');
  el.querySelectorAll('.arv-sheet').forEach((s) => { s.hidden = true; });
  el.classList.remove('sheet-open');
  setStep(1);
  return had;
}
function closeTopLayer() {
  if (hideSheets()) return true;
  if (state.stream) { stopCamera(); return true; }
  return false;
}
function setStep(n) {
  el.querySelectorAll('#arvSteps li').forEach((li, i) => { li.classList.toggle('on', i === n - 1); li.classList.toggle('done', i < n - 1); });
}

function openCoach(kind) {
  const wall = state.item.placement === 'wall';
  if (kind === 'ar' && store.get('arv-coach-skip')) { launchAR(); return; }   // returning visitor: go straight in
  state.coachFor = kind;
  $('#arvIllo').dataset.variant = wall ? 'wall' : 'floor';
  const viewer = isIOS ? 'Apple’s AR view' : 'Google’s AR view';
  const steps = kind === 'ar'
    ? [
      ['Your camera opens', `${viewer} opens full screen. Tap <b>Allow</b> if your phone asks to use the camera.`],
      [wall ? 'Scan your wall' : 'Scan your floor', wall
        ? 'Stand 1–2 m from the wall and move your phone <b>slowly side to side</b> for a few seconds.'
        : 'Point down at the floor and move your phone <b>slowly in a small circle</b> for a few seconds.'],
      ['It appears at real size', `Drag it into place — it’s already ${fmt(state.item.dims.w)} wide. Tap <b>${isIOS ? '✕' : '←'}</b> to come back here.`],
    ]
    : [
      ['Allow the camera', 'Tap <b>Allow</b> when asked. Nothing is recorded or uploaded — it stays on your screen.'],
      ['Point at the spot', wall ? 'Hold your phone up to the wall where it would hang.' : 'Point at the floor where it would stand.'],
      ['Adjust and snap', 'Drag to turn, pinch to resize, then tap the round button to save a photo.'],
    ];
  $('#arvHowto').innerHTML = steps.map(([t, d], i) => `<li><i>${i + 1}</i><div><b>${t}</b><span>${d}</span></div></li>`).join('');
  $('#arvCoachTitle').textContent = kind === 'ar' ? 'Here’s what happens next' : 'Preview it over your camera';
  $('#arvCoachGo span').textContent = kind === 'ar' ? 'Open camera' : 'Allow camera';
  $('#arvCoachNote').innerHTML = kind === 'ar'
    ? (isAndroid ? 'If your phone asks to install <b>Google Play Services for AR</b>, accept — it’s a free, one-time install.' : 'Works best in good light. Plain white walls are harder for phones to see.')
    : 'This preview isn’t exact size. For true size, use Safari on iPhone or Chrome on Android.';
  $('#arvCoachSkip').parentElement.hidden = kind !== 'ar';
  $('#arvCoachSkip').checked = false;
  showSheet('arvCoach');
  setStep(2);
}

function launchAR() {
  hideSheets();
  if (state.stream) stopCamera();
  state.awaitReturn = true; state.sessionStarted = false; state.placed = false;
  setStep(2);
  track('ar_launch', state.item.id, { mode: arMode() });
  mv.activateAR();   // must run inside the tap — Quick Look and intents need the user gesture
  // Native viewers (Quick Look / Scene Viewer) cover this page. Have the follow-up waiting when they come back.
  clearTimeout(state.returnTimer);
  state.returnTimer = setTimeout(() => { if (state.awaitReturn && !state.sessionStarted) showBack(); }, 1500);
}

function showBack(pane) {
  state.awaitReturn = false;
  const wall = state.item.placement === 'wall';
  const d = state.item.dims;
  $('#arvYesText').textContent = `${state.item.name} — ${fmt(d.w)} wide × ${fmt(d.h)} tall. Our team can bring it to your home or office for a free demo.`;
  const fixes = wall
    ? [
      ['Give the phone something to see', 'Aim at a wall with a frame, switchboard or door edge. Plain white walls are hard to detect.'],
      ['Turn the lights on', 'Phones need a well-lit room to find surfaces.'],
      ['Slow down', 'Stand 1–2 m away and sweep side to side for 5–10 seconds.'],
    ]
    : [
      ['Aim at a textured floor', 'Rugs, tiles or wooden floors work best. Glossy or plain floors are harder.'],
      ['Turn the lights on', 'Phones need a well-lit room to find surfaces.'],
      ['Slow down', 'Point down at the floor and move in a small circle for 5–10 seconds.'],
    ];
  $('#arvFixes').innerHTML = fixes.map(([t, dd], i) => `<li><i>${i + 1}</i><div><b>${t}</b><span>${dd}</span></div></li>`).join('');
  $('#arvSwitch').hidden = !(wall && state.item.alt);
  $('#arvBackPreview').hidden = !canPreview();
  showBackPane(pane || 'ask');
  showSheet('arvBack');
  setStep(3);
}
function showBackPane(p) { el.querySelectorAll('#arvBack [data-pane]').forEach((x) => { x.hidden = x.dataset.pane !== p; }); }

/* ---------------------------------------------------------------- live camera preview */
async function startCamera() {
  hideSheets();
  const video = $('.arv-cam');
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    video.srcObject = state.stream; await video.play();
    el.classList.add('on-camera');
    setStep(3);
    frame();
    $('#arvCamName').textContent = state.item.name;
    $('#arvCamAR').hidden = !mv.canActivateAR;
    const g = $('#arvGestures');
    g.classList.remove('gone'); clearTimeout(state.gTimer);
    state.gTimer = setTimeout(() => g.classList.add('gone'), 5000);
    track('camera_preview', state.item.id);
  } catch (err) {
    const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
    toast(denied
      ? (isIOS ? 'Camera is blocked. Open Settings › Safari › Camera and choose Allow, then try again.' : 'Camera is blocked. Tap the lock icon next to the address, allow Camera, then try again.')
      : 'Could not start the camera. Close other apps using it and try again.', 0);
  }
}
function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
  state.stream = null;
  if (!el) return;
  el.classList.remove('on-camera');
  setStep(1);
  if (mv && state.item) frame();
}

async function takePhoto() {
  const video = $('.arv-cam');
  if (!state.stream || !video.videoWidth) return;
  const flash = $('#arvFlash');
  flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  try {
    const shot = await createImageBitmap(await mv.toBlob({ idealAspect: false }));
    const W = shot.width, H = shot.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const s = Math.max(W / video.videoWidth, H / video.videoHeight);
    g.drawImage(video, (W - video.videoWidth * s) / 2, (H - video.videoHeight * s) / 2, video.videoWidth * s, video.videoHeight * s);
    g.drawImage(shot, 0, 0);
    // caption, shrunk to fit narrow (portrait) photos
    const pad = Math.round(W * 0.045), label = state.item.name.replace(/^Onfinity\s*/i, 'Ōnfinity ');
    let fs = Math.max(14, Math.round(W * 0.034));
    g.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    while (fs > 10 && g.measureText(label).width > W - pad * 2) { fs -= 1; g.font = `600 ${fs}px Inter, system-ui, sans-serif`; }
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(0, H - fs * 2.8, W, fs * 2.8);
    g.fillStyle = '#fff'; g.fillText(label, pad, H - fs * 1.05);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
    const url = URL.createObjectURL(blob);
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = url;
    $('#arvPhotoImg').src = url;
    $('#arvSave').href = url;
    const file = new File([blob], 'onfinity-in-my-room.jpg', { type: 'image/jpeg' });
    const share = $('#arvShare');
    share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    share.onclick = () => navigator.share({ files: [file], title: state.item.name, text: `How the ${state.item.name} looks in my room` }).catch(() => {});
    showSheet('arvPhoto');
    track('photo_taken', state.item.id);
  } catch (err) {
    console.error(err);
    toast('Could not save the photo — try taking a screenshot instead.');
  }
}

async function showQR() {
  const box = $('#arvQr');
  let origin = location.origin;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    try { const n = await fetch(BASE + 'api/network').then((r) => r.json()); if (n.urls?.[0]) origin = n.urls[0]; } catch { /* static server */ }
  }
  const path = new URL('ar.html', BASE).pathname;
  const url = `${origin}${path}?m=${encodeURIComponent(state.item.id)}`;
  await loadQR();
  const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
  $('#arvQrCode').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  $('#arvQrUrl').textContent = url;
  box.hidden = false;
  el.classList.add('has-qr');
  track('qr_shown', state.item.id);
}

function toast(t, ms = 5200) {
  const n = $('#arvStatus');
  n.textContent = t; n.classList.toggle('show', !!t);
  clearTimeout(state.toastTimer);
  if (t && ms) state.toastTimer = setTimeout(() => n.classList.remove('show'), ms);
}

function renderSizes() {
  const wrap = $('#arvSizes');
  const sizes = state.items.filter((m) => m.group === state.item.group && m.size).sort((a, b) => a.size - b.size);
  wrap.innerHTML = sizes.length > 1 ? sizes.map((m) => `<button type="button" role="radio" aria-checked="${m.id === state.item.id}" data-id="${m.id}">${m.size}″</button>`).join('') : '';
  $('#arvSizeField').hidden = sizes.length < 2;
  wrap.onclick = (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b || b.dataset.id === state.item.id) return;
    setItem(state.items.find((m) => m.id === b.dataset.id));
    track('size_change', b.dataset.id);
  };
}

function setItem(item) {
  state.item = item; state.ready = false;
  $('#arvTitle').textContent = item.name;
  $('#arvDims').textContent = `${fmt(item.dims.w)} wide · ${fmt(item.dims.h)} tall · ${fmt(item.dims.d)} deep`;
  $('#arvHudName').textContent = item.name;
  $('#arvHudSize').textContent = `${fmt(item.dims.w)} × ${fmt(item.dims.h)} · true size`;
  $('#arvPlaceField').hidden = !item.alt;
  $('#arvPlace').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.place === item.placement)));
  $('#arvPlace').onclick = (e) => {
    const b = e.target.closest('button[data-place]');
    if (!b || b.dataset.place === state.item.placement || !state.item.alt) return;
    const alt = state.items.find((m) => m.id === state.item.alt);
    if (alt) { setItem(alt); track('size_change', alt.id, { mode: 'placement:' + alt.placement }); }
  };
  $('#arvLoading').classList.remove('done');
  $('#arvPct').textContent = '0%';
  const go = $('#arvGo'); go.disabled = true; go.querySelector('span').textContent = 'Preparing…';
  const enquire = new URL(`index.html?model=${item.id}#contact`, BASE).href;
  $('#arvEnquire').href = enquire; $('#arvYesEnquire').href = enquire;
  mv.querySelector('.arv-ar-prompt p').textContent = placeHint(item.placement);
  mv.setAttribute('ar-placement', item.placement);
  mv.setAttribute('alt', `${item.name}, ${fmt(item.dims.w)} by ${fmt(item.dims.h)}`);
  frame();
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
  const wasOpen = el.classList.contains('open');
  state.opts = opts;
  el.classList.toggle('standalone', !!opts.standalone);
  el.classList.add('open');
  el.classList.remove('on-camera', 'has-qr');
  hideSheets();
  toast('');
  if (!wasOpen) history.pushState({ arv: 1 }, '');
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
    setTimeout(() => $('.arv-close').focus({ preventScroll: true }), 60);
  } catch (err) {
    console.error(err);
    $('#arvLoading').classList.add('done');
    toast('AR models are not available. Run “npm run export:ar” and serve with “npm start”.', 0);
  }
}

export function closeAR(fromHistory = false) {
  if (!el) return;
  if (state.opts.standalone) { location.href = new URL('products.html', BASE).href; return; }
  stopCamera();
  hideSheets();
  clearTimeout(state.returnTimer); state.awaitReturn = false;
  el.classList.remove('open');
  document.documentElement.classList.remove('arv-lock');
  state.opts.onClose?.();
  if (!fromHistory && history.state?.arv) history.back();
}

// Map storefront products to AR models.
export const AR_FOR_PRODUCT = { camera: 'camera', led: 'led', kiosk: 'kiosk', visualizer: 'visualizer', display: 'display-55' };
export const tvModelFor = (inch) => `tv-${[32, 43, 55, 65, 75, 86, 98].reduce((a, b) => (Math.abs(b - inch) < Math.abs(a - inch) ? b : a))}`;
