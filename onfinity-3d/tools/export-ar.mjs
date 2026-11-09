// Bakes every product in js/ar-models.js into real-scale GLB + USDZ files.
//   npm run export:ar            (all models)
//   npm run export:ar -- tv-55   (just some ids)
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { start, ROOT } from '../server/server.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('Playwright is required: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const outDir = path.join(ROOT, 'assets/ar');
const server = await start({ port: 0, host: '127.0.0.1', quiet: true });
const { port } = server.address();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`http://127.0.0.1:${port}/tools/ar-export.html`);
  await page.waitForFunction(() => window.exportReady === true, null, { timeout: 30000 });
  const { files, manifest } = await page.evaluate((ids) => window.exportAll(ids.length ? ids : null), only);
  await fs.mkdir(outDir, { recursive: true });
  for (const f of files) {
    const buf = Buffer.from(f.data, 'base64');
    await fs.writeFile(path.join(outDir, f.name), buf);
    console.log(`  ${f.name.padEnd(22)} ${(buf.length / 1024).toFixed(0).padStart(6)} KB`);
  }
  // merge with any existing manifest so partial exports keep other entries
  let existing = [];
  try { existing = JSON.parse(await fs.readFile(path.join(outDir, 'manifest.json'), 'utf8')).models; } catch { /* first run */ }
  const map = new Map(existing.map((m) => [m.id, m]));
  manifest.forEach((m) => map.set(m.id, m));
  const models = [...map.values()];
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify({ generated: new Date().toISOString(), units: 'metres', models }, null, 2));
  console.log(`✓ ${manifest.length} models → assets/ar (manifest: ${models.length} entries)`);
} finally {
  await browser.close();
  server.close();
}
