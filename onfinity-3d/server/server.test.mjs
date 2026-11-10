// node --test server/server.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'onf-data-'));
const { start } = await import('./server.mjs');
let server, base;
before(async () => { server = await start({ port: 0, host: '127.0.0.1', quiet: true }); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health', async () => {
  const r = await fetch(base + '/api/health');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test('serves AR files with the MIME types Quick Look / Scene Viewer need', async () => {
  const glb = await fetch(base + '/assets/ar/tv-55.glb', { method: 'HEAD' });
  assert.equal(glb.status, 200);
  assert.equal(glb.headers.get('content-type'), 'model/gltf-binary');
  const usdz = await fetch(base + '/assets/ar/tv-55.usdz', { method: 'HEAD' });
  assert.equal(usdz.headers.get('content-type'), 'model/vnd.usdz+zip');
  assert.equal(usdz.headers.get('accept-ranges'), 'bytes');
});

test('supports byte ranges', async () => {
  const r = await fetch(base + '/assets/ar/tv-55.glb', { headers: { Range: 'bytes=0-11' } });
  assert.equal(r.status, 206);
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(buf.length, 12);
  assert.equal(buf.subarray(0, 4).toString(), 'glTF');
  assert.match(r.headers.get('content-range'), /^bytes 0-11\/\d+$/);
  const bad = await fetch(base + '/assets/ar/tv-55.glb', { headers: { Range: 'bytes=999999999-' } });
  assert.equal(bad.status, 416);
});

test('ETag revalidation returns 304', async () => {
  const r = await fetch(base + '/index.html');
  const etag = r.headers.get('etag');
  const r2 = await fetch(base + '/index.html', { headers: { 'If-None-Match': etag } });
  assert.equal(r2.status, 304);
});

test('blocks path traversal and private folders', async () => {
  // raw request so the client does not normalise "../"
  const raw = (p) => new Promise((resolve) => {
    const s = net.connect(server.address().port, '127.0.0.1', () => s.write(`GET ${p} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`));
    let d = ''; s.on('data', (c) => { d += c; }); s.on('end', () => resolve(Number(d.split(' ')[1])));
  });
  assert.ok([403, 404].includes(await raw('/../../etc/passwd')));
  assert.ok([403, 404].includes(await raw('/%2e%2e/%2e%2e/etc/passwd')));
  assert.equal((await fetch(base + '/server/server.mjs')).status, 404);
  assert.equal((await fetch(base + '/.gitignore')).status, 404);
});

test('AR manifest lists real-world dimensions', async () => {
  const r = await fetch(base + '/api/ar/manifest');
  assert.equal(r.status, 200);
  const { models, units } = await r.json();
  assert.equal(units, 'metres');
  const tv = models.find((m) => m.id === 'tv-55');
  assert.ok(Math.abs(tv.dims.w - 1.23) < 0.03, 'a 55" TV is ~1.23 m wide');
  assert.equal(tv.placement, 'wall');
  assert.equal(models.find((m) => m.id === 'kiosk').placement, 'floor');
});

test('events: validates and aggregates', async () => {
  assert.equal((await post('/api/events', { type: 'hack', model: 'tv-55' })).status, 400);
  assert.equal((await post('/api/events', { type: 'ar_launch', model: '../x' })).status, 400);
  assert.equal((await post('/api/events', { type: 'ar_launch', model: 'tv-55' })).status, 204);
  assert.equal((await post('/api/events', { type: 'ar_placed', model: 'tv-55' })).status, 204);
  const s = await (await fetch(base + '/api/events/summary')).json();
  assert.equal(s.byModel['tv-55'].ar_launch, 1);
  assert.equal(s.placementRate, 1);
});

test('events: accepts AR follow-up feedback and photo captures', async () => {
  assert.equal((await post('/api/events', { type: 'ar_feedback', model: 'tv-55', mode: 'no' })).status, 204);
  assert.equal((await post('/api/events', { type: 'photo_taken', model: 'kiosk' })).status, 204);
  const { events } = await (await fetch(base + '/api/events/recent?limit=2')).json();
  assert.deepEqual(events.map((e) => e.type), ['photo_taken', 'ar_feedback']);
  assert.equal(events[1].mode, 'no');
});

test('recent events expose device and AR mode for debugging', async () => {
  await fetch(base + '/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7)' }, body: JSON.stringify({ type: 'ar_failed', model: 'tv-55', mode: 'scene-viewer/webxr' }) });
  const { events } = await (await fetch(base + '/api/events/recent?limit=5')).json();
  assert.equal(events[0].type, 'ar_failed');
  assert.equal(events[0].mode, 'scene-viewer/webxr');
  assert.equal(events[0].device, 'Android');
});

test('leads: validates input and stores', async () => {
  assert.equal((await post('/api/leads', { name: 'A', phone: '123' })).status, 422);
  const ok = await post('/api/leads', { name: 'Asha Verma', phone: '+91 98765 43210', city: 'Noida', interest: 'LED Video Wall', model: 'led' });
  assert.equal(ok.status, 201);
  const { id } = await ok.json();
  const stored = await fs.readFile(path.join(process.env.DATA_DIR, 'leads.ndjson'), 'utf8');
  assert.match(stored, new RegExp(id));
  assert.equal((await fetch(base + '/api/leads', { method: 'POST', body: '{bad' })).status, 400);
});

test('network endpoint returns LAN URLs for QR hand-off', async () => {
  const j = await (await fetch(base + '/api/network')).json();
  assert.ok(Array.isArray(j.urls));
});
