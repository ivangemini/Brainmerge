import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { createInitialState } from '../build/core/game.js';

const ROOT = new URL('../dist/', import.meta.url);
const PORT = 4187;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SAVE_KEY = 'brainmerge.save.v1';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.webp', 'image/webp'], ['.jpg', 'image/jpeg'], ['.mp3', 'audio/mpeg'], ['.wav', 'audio/wav']
]);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const safePath = (urlPath) => {
  const clean = decodeURIComponent((urlPath ?? '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const normalized = normalize(clean);
  if (normalized.startsWith('..')) throw new Error('unsafe path');
  return join(ROOT.pathname, normalized);
};

const server = createServer(async (req, res) => {
  try {
    let path = safePath(req.url);
    try { if ((await stat(path)).isDirectory()) path = join(path, 'index.html'); }
    catch { if (!extname(path)) path = join(ROOT.pathname, 'index.html'); }
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': mime.get(extname(path)) ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    if (res.headersSent) return;
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

function world2State({ raidReady = false } = {}) {
  const state = createInitialState(Date.now());
  state.maxDiscoveredTier = 8;
  state.campaign.worlds['1'].raidCleared = true;
  state.campaign.worlds['1'].raidProgress = 1;
  if (raidReady) {
    const locations = Object.fromEntries(Object.keys(state.campaign.worlds['2'].locations)
      .map((id) => [id, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 }]));
    state.campaign.worlds['2'] = { ...state.campaign.worlds['2'], locations };
  }
  return state;
}

async function openWithSeed(browser, seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: JSON.stringify(seed) });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.campaign-entry').click();
  await page.locator('.campaign-world-tab[data-world="2"]').click();
  return { context, page, errors };
}

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const location = await openWithSeed(browser, world2State());
  await location.page.locator('.campaign-node--location[data-location-id="w2-sneaker-transit"]').click();
  await location.page.locator('.campaign-detail__run-button').click();
  await location.page.locator('.campaign-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await location.page.locator('.campaign-run-cell').count() === 30, 'World 2 Location must use the isolated 6x5 board');
  assert(await location.page.locator('.campaign-run-cell.is-overgrown').count() === 5, 'World 2 Traffic Lock starter layout mismatch');
  await location.page.locator('.campaign-run-supply').click();
  const locationSave = await location.page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.campaignRun, SAVE_KEY);
  assert(locationSave?.worldId === 2 && locationSave?.spawns === 1, 'World 2 Location supply did not persist');
  assert(location.errors.length === 0, `World 2 Location errors: ${location.errors.join(' | ')}`);
  await location.context.close();

  const raid = await openWithSeed(browser, world2State({ raidReady: true }));
  await raid.page.locator('[data-raid]').click();
  await raid.page.locator('[data-start-raid]').click();
  await raid.page.locator('.raid-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await raid.page.locator('.raid-cell').count() === 30, 'World 2 Raid must use the isolated 6x5 board');
  assert(await raid.page.locator('.raid-cell.is-blocked').count() === 7, 'World 2 Raid phase 1 layout mismatch');
  await raid.page.locator('[data-raid-supply]').click();
  const raidSave = await raid.page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.raidRun, SAVE_KEY);
  assert(raidSave?.worldId === 2, 'World 2 Raid state did not persist');
  assert(raid.errors.length === 0, `World 2 Raid errors: ${raid.errors.join(' | ')}`);
  await raid.context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
console.log('World 2 Location + World 2 Raid smoke passed.');
