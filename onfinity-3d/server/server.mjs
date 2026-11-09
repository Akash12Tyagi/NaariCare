// Onfinity prototype server — zero dependencies (Node ≥ 18).
//
//  • Static hosting with correct MIME types for AR (.glb → model/gltf-binary,
//    .usdz → model/vnd.usdz+zip, which iOS Quick Look requires), ETags,
//    cache headers and HTTP Range support (Quick Look / Scene Viewer fetch
//    models in ranges).
//  • JSON API:
//      GET  /api/health
//      GET  /api/ar/manifest          AR model catalogue (real-world sizes)
//      GET  /api/network              LAN URLs so desktop QR codes work on phones
//      POST /api/events               AR / 3D analytics (append-only NDJSON)
//      GET  /api/events/summary       aggregated counts by event and model
//      POST /api/leads                demo / enquiry form submissions
//  • Optional HTTPS (WebXR + camera need a secure context off-localhost):
//      HTTPS_KEY=key.pem HTTPS_CERT=cert.pem node server/server.mjs
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.usdz': 'model/vnd.usdz+zip',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};
const EVENT_TYPES = new Set(['view_3d', 'ar_launch', 'ar_placed', 'ar_failed', 'ar_unsupported', 'qr_shown', 'camera_preview', 'size_change']);
const ID_RE = /^[a-z0-9-]{1,40}$/;

/* ---------------------------------------------------------------- helpers */
function send(res, status, body, headers = {}) {
  const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
  const payload = isObj ? JSON.stringify(body) : body ?? '';
  res.writeHead(status, {
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers,
  });
  res.end(payload);
}
async function readJson(req, limit = 8 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); } });
    req.on('error', reject);
  });
}
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
async function append(file, obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.appendFile(path.join(DATA_DIR, file), JSON.stringify(obj) + '\n', 'utf8');
}
async function readNdjson(file) {
  try {
    const txt = await fsp.readFile(path.join(DATA_DIR, file), 'utf8');
    return txt.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
export function lanUrls(port, proto = 'http') {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) {
    if (a.family === 'IPv4' && !a.internal) out.push(`${proto}://${a.address}:${port}`);
  }
  return out;
}

// tiny token bucket per IP for write endpoints
const buckets = new Map();
function allow(ip, cost = 1, cap = 60, refillPerSec = 1) {
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: cap, t: now };
  b.tokens = Math.min(cap, b.tokens + ((now - b.t) / 1000) * refillPerSec); b.t = now;
  if (b.tokens < cost) { buckets.set(ip, b); return false; }
  b.tokens -= cost; buckets.set(ip, b); return true;
}

/* ---------------------------------------------------------------- API */
async function api(req, res, url, ctx) {
  const ip = req.socket.remoteAddress || 'unknown';
  const route = `${req.method} ${url.pathname}`;
  switch (route) {
    case 'GET /api/health': return send(res, 200, { ok: true, time: new Date().toISOString() });
    case 'GET /api/ar/manifest': {
      try { return send(res, 200, JSON.parse(await fsp.readFile(path.join(ROOT, 'assets/ar/manifest.json'), 'utf8')), { 'Cache-Control': 'public, max-age=300' }); }
      catch { return send(res, 404, { error: 'AR manifest not built. Run: npm run export:ar' }); }
    }
    case 'GET /api/network': return send(res, 200, { urls: lanUrls(ctx.port, ctx.proto), secure: ctx.proto === 'https' });
    case 'POST /api/events': {
      if (!allow(ip, 1, 120, 2)) return send(res, 429, { error: 'Too many requests' });
      const b = await readJson(req);
      const type = clip(b.type, 32), model = clip(b.model, 40);
      if (!EVENT_TYPES.has(type)) return send(res, 400, { error: 'Unknown event type' });
      if (model && !ID_RE.test(model)) return send(res, 400, { error: 'Invalid model id' });
      await append('events.ndjson', {
        ts: new Date().toISOString(), type, model: model || null, mode: clip(b.mode, 20) || null,
        page: clip(b.page, 120) || null, ua: clip(req.headers['user-agent'], 160), ip: crypto.createHash('sha256').update(ip).digest('hex').slice(0, 12),
      });
      return send(res, 204, '');
    }
    case 'GET /api/events/summary': {
      const ev = await readNdjson('events.ndjson');
      const byType = {}, byModel = {};
      for (const e of ev) {
        byType[e.type] = (byType[e.type] || 0) + 1;
        if (e.model) { byModel[e.model] ??= {}; byModel[e.model][e.type] = (byModel[e.model][e.type] || 0) + 1; }
      }
      const launches = byType.ar_launch || 0, placed = byType.ar_placed || 0;
      return send(res, 200, { total: ev.length, byType, byModel, placementRate: launches ? +(placed / launches).toFixed(3) : null });
    }
    case 'POST /api/leads': {
      if (!allow(ip, 10, 60, 0.2)) return send(res, 429, { error: 'Too many requests' });
      const b = await readJson(req);
      const lead = {
        id: crypto.randomUUID(), ts: new Date().toISOString(),
        name: clip(b.name, 80), phone: clip(b.phone, 20), city: clip(b.city, 60), interest: clip(b.interest, 80),
        source: clip(b.source, 40) || 'website', model: ID_RE.test(clip(b.model, 40)) ? clip(b.model, 40) : null,
      };
      if (lead.name.length < 2) return send(res, 422, { error: 'Name is required' });
      if (!/^[+\d][\d\s-]{7,}$/.test(lead.phone)) return send(res, 422, { error: 'A valid phone number is required' });
      await append('leads.ndjson', lead);
      return send(res, 201, { ok: true, id: lead.id });
    }
    default: return send(res, 404, { error: 'Not found' });
  }
}

/* ---------------------------------------------------------------- static */
async function serveStatic(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  // stay inside ROOT; never expose server code, data, dotfiles or node_modules
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 403, 'Forbidden');
  const relPosix = path.relative(ROOT, file).split(path.sep);
  if (relPosix[0] === 'server' || relPosix[0] === 'node_modules' || relPosix.some((p) => p.startsWith('.'))) return send(res, 404, 'Not found');
  let st;
  try { st = await fsp.stat(file); } catch { return send(res, 404, 'Not found'); }
  if (st.isDirectory()) return serveStatic(req, res, new URL(url.pathname.replace(/\/?$/, '/'), url));
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const cache = ext === '.html' ? 'no-cache' : ['.glb', '.usdz', '.jpg', '.png', '.webp', '.woff2'].includes(ext) ? 'public, max-age=86400' : 'public, max-age=3600';
  const base = { 'Content-Type': type, ETag: etag, 'Cache-Control': cache, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, base); return res.end(); }
  const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    let start = range[1] === '' ? st.size - Number(range[2]) : Number(range[1]);
    let end = range[1] !== '' && range[2] !== '' ? Number(range[2]) : st.size - 1;
    if (Number.isNaN(start) || start < 0 || start >= st.size || end < start) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    end = Math.min(end, st.size - 1);
    res.writeHead(206, { ...base, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...base, 'Content-Length': st.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

export function createHandler(ctx) {
  return async (req, res) => {
    const url = new URL(req.url, 'http://local');
    try {
      if (url.pathname.startsWith('/api/')) return await api(req, res, url, ctx);
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
      return await serveStatic(req, res, url);
    } catch (err) {
      if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
      if (!err.status) console.error(err);
    }
  };
}

export function start({ port = Number(process.env.PORT) || 8080, host = process.env.HOST || '0.0.0.0', quiet = false } = {}) {
  const key = process.env.HTTPS_KEY, cert = process.env.HTTPS_CERT;
  const proto = key && cert ? 'https' : 'http';
  const ctx = { port, proto };
  const handler = createHandler(ctx);
  const server = proto === 'https' ? https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, handler) : http.createServer(handler);
  return new Promise((resolve) => server.listen(port, host, () => {
    ctx.port = server.address().port;
    if (!quiet) {
      console.log(`Onfinity prototype → ${proto}://localhost:${ctx.port}`);
      lanUrls(ctx.port, proto).forEach((u) => console.log(`  on your network: ${u}`));
      if (proto === 'http') console.log('  (WebXR/camera on phones need HTTPS — set HTTPS_KEY/HTTPS_CERT, or use a tunnel)');
    }
    resolve(server);
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) start();
