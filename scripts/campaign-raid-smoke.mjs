import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { advanceCampaignLocationPhase, CAMPAIGN_WORLDS } from '../build/core/campaign.js';
import { createInitialState } from '../build/core/game.js';

const ROOT = new URL('../dist/', import.meta.url);
const PORT = 4184;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SAVE_KEY = 'brainmerge.save.v1';
const mime = new Map([['.html','text/html'],['.js','text/javascript'],['.css','text/css'],['.json','application/json'],['.webp','image/webp'],['.png','image/png']]);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const safePath = (urlPath) => join(ROOT.pathname, normalize(decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '') || 'index.html'));
const server = createServer(async (req, res) => {
  try {
    let path = safePath(req.url ?? '/');
    try { if ((await stat(path)).isDirectory()) path = join(path, 'index.html'); } catch { if (!extname(path)) path = join(ROOT.pathname, 'index.html'); }
    res.writeHead(200, { 'content-type': mime.get(extname(path)) ?? 'application/octet-stream' }); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});

let seed = { ...createInitialState(Date.now()), maxDiscoveredTier: 8, runMaxTier: 8 };
for (const location of CAMPAIGN_WORLDS[0].locations.slice(0, 6)) {
  for (const phase of ['stabilize', 'deliver', 'restore', 'mastery']) seed = { ...seed, campaign: advanceCampaignLocationPhase(seed.campaign, 1, location.id, phase, 1) };
}

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await context.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: JSON.stringify(seed) });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.campaign-entry').click();
  await page.locator('[data-raid]').click();
  try { await page.locator('[data-start-raid]').waitFor({ state: 'visible', timeout: 5_000 }); }
  catch {
    const debug = await page.evaluate(() => ({ detail: Boolean(document.querySelector('.campaign-detail.is-open')), raidButton: Boolean(document.querySelector('[data-start-raid]')), raidText: document.querySelector('[data-raid]')?.textContent }));
    throw new Error(`Raid launcher unavailable: ${JSON.stringify(debug)} errors=${errors.join(' | ')}`);
  }
  await page.locator('[data-start-raid]').click();
  await page.locator('.raid-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await page.locator('.raid-cell').count() === 30, 'Raid must render an isolated 6x5 board');
  assert(await page.locator('.raid-cell.is-blocked').count() === 8, 'Raid phase 1 must start with eight blockers');
  await page.locator('[data-raid-supply]').click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.raidRun?.phase === 1, SAVE_KEY);
  assert(errors.length === 0, `Raid browser errors: ${errors.join(' | ')}`);
  await context.close();
  console.log('World 1 Raid browser smoke OK: gate + launcher + isolated board + persisted phase 1.');
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
