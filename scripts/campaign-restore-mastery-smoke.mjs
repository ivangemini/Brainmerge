import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { createSneakerGardenMasteryRun, createSneakerGardenRestoreRun } from '../build/core/campaign-run.js';
import { createInitialState } from '../build/core/game.js';

const ROOT = new URL('../dist/', import.meta.url);
const PORT = 4182;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SAVE_KEY = 'brainmerge.save.v1';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.webp', 'image/webp'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
]);

function assert(condition, message) { if (!condition) throw new Error(message); }
function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const normalized = normalize(clean);
  if (normalized.startsWith('..')) throw new Error('Unsafe path');
  return join(ROOT.pathname, normalized);
}

const server = createServer(async (req, res) => {
  try {
    let filePath = safePath(req.url ?? '/');
    try { const info = await stat(filePath); if (info.isDirectory()) filePath = join(filePath, 'index.html'); }
    catch { if (!extname(filePath)) filePath = join(ROOT.pathname, 'index.html'); }
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': mime.get(extname(filePath)) ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

function unit(id, tier) {
  const familyId = tier === 2 ? 'camera-dude' : tier === 3 ? 'sigma-rock' : 'rizz-head';
  return { id, familyId, tier };
}

function restoreSeed() {
  const state = createInitialState(Date.now());
  const location = state.campaign.worlds['1']?.locations['w1-sneaker-garden'];
  assert(location, 'restore seed missing Sneaker Garden');
  Object.assign(location, { stabilize: 1, deliver: 1, restore: 0, mastery: 0 });
  state.maxDiscoveredTier = 4;
  state.campaignRun = createSneakerGardenRestoreRun(4);
  state.campaignRun.cells[0] = unit('restore-t2-a', 2);
  state.campaignRun.cells[1] = unit('restore-t2-b', 2);
  return state;
}

function masterySeed() {
  const state = createInitialState(Date.now());
  const location = state.campaign.worlds['1']?.locations['w1-sneaker-garden'];
  assert(location, 'mastery seed missing Sneaker Garden');
  Object.assign(location, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 });
  state.maxDiscoveredTier = 4;
  state.campaignRun = createSneakerGardenMasteryRun(4);
  state.campaignRun.cells[0] = unit('mastery-t3', 3);
  state.campaignRun.cells[1] = unit('mastery-t4-a', 4);
  state.campaignRun.cells[6] = unit('mastery-t4-b', 4);
  return state;
}

async function contextWithSeed(browser, seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addInitScript(({ origin, key, value }) => {
    if (location.origin === origin && localStorage.getItem(key) === null) localStorage.setItem(key, value);
  }, { origin: ORIGIN, key: SAVE_KEY, value: JSON.stringify(seed) });
  return context;
}

async function openSeededRun(page, expectedLauncher, expectedPhase) {
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await page.locator('.campaign-entry').click();
  await page.locator('.campaign-shell.is-open').waitFor({ state: 'visible' });
  await page.locator('.campaign-node--location[data-location-id="w1-sneaker-garden"]').click();
  await page.locator('.campaign-detail.is-open').waitFor({ state: 'visible' });
  await page.locator('.campaign-detail__run-button').waitFor({ state: 'visible' });
  const label = (await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase() ?? '';
  assert(label.includes(expectedLauncher), `expected launcher to include ${expectedLauncher}, got ${label}`);
  await page.locator('.campaign-detail__run-button').click();
  await page.locator(`.campaign-run-shell.is-open[data-phase="${expectedPhase}"]`).waitFor({ state: 'visible' });
}

async function deliverAt(page, index, expectedTier) {
  const cell = page.locator(`.campaign-run-cell[data-run-cell="${index}"]`);
  await cell.click();
  await page.waitForFunction(() => !document.querySelector('.campaign-run-deliver')?.disabled);
  assert((await page.locator('.campaign-run-deliver').textContent())?.includes(`T${expectedTier}`), `delivery button did not expose T${expectedTier}`);
  await page.locator('.campaign-run-deliver').click();
}

async function assertRestore(browser) {
  const context = await contextWithSeed(browser, restoreSeed());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openSeededRun(page, 'restor', 'restore');
  assert(await page.locator('.campaign-run-cell.is-overgrown').count() === 2, 'Restore should use two Overgrowth blockers');
  assert((await page.locator('.campaign-run-progress small').textContent())?.toLowerCase().includes('landmark'), 'Restore progress label missing');

  await deliverAt(page, 0, 2);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.campaignRun?.orderIndex === 1, SAVE_KEY);
  const afterOne = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  assert(afterOne.campaign.worlds['1'].locations['w1-sneaker-garden'].restore === 0, 'one restore order must not commit a partial landmark level');

  await deliverAt(page, 1, 2);
  await page.waitForFunction((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return save?.campaignRun?.orderIndex === 2 && save?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.restore > 0.33;
  }, SAVE_KEY);
  const afterBatch = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  const restore = afterBatch.campaign.worlds['1'].locations['w1-sneaker-garden'].restore;
  assert(Math.abs(restore - 1 / 3) < 1e-9, `first two-order batch must commit Landmark Lv1, got restore=${restore}`);
  assert(afterBatch.campaignRun.orderIndex === 2, 'restore order cursor must remain at second completed order');

  await page.locator('.campaign-run-back').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await page.locator('.campaign-entry').click();
  await page.locator('.campaign-node--location[data-location-id="w1-sneaker-garden"]').click();
  await page.locator('.campaign-detail__run-button').waitFor({ state: 'visible' });
  const resume = (await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase() ?? '';
  assert(resume.includes('resume') && resume.includes('restor'), `Restore must resume after reload, got ${resume}`);
  assert(errors.length === 0, `Restore browser errors: ${errors.join(' | ')}`);
  await context.close();
}

async function assertMastery(browser) {
  const context = await contextWithSeed(browser, masterySeed());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openSeededRun(page, 'mastery', 'mastery');
  assert(await page.locator('.campaign-run-cell.is-overgrown').count() === 5, 'Mastery must keep five stronger permanent Overgrowth blockers');

  await deliverAt(page, 0, 3);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.campaignRun?.orderIndex === 1, SAVE_KEY);
  await deliverAt(page, 1, 4);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.campaignRun?.orderIndex === 2, SAVE_KEY);
  await deliverAt(page, 6, 4);
  await page.locator('.campaign-run-complete.is-open').waitFor({ state: 'visible' });
  await page.waitForFunction((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return save?.campaignRun?.completed === true && save?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.mastery === 1;
  }, SAVE_KEY);
  assert((await page.locator('.campaign-run-complete strong').textContent())?.toLowerCase().includes('master'), 'Mastery completion card missing');

  await page.locator('.campaign-run-complete button').click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.campaignRun === null, SAVE_KEY);
  await page.waitForFunction(() => document.querySelector('.campaign-node--location[data-location-id="w1-sneaker-garden"] em')?.textContent?.trim() === '100%');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  const location = saved.campaign.worlds['1'].locations['w1-sneaker-garden'];
  assert(location.stabilize === 1 && location.deliver === 1 && location.restore === 1 && location.mastery === 1, 'Mastery must leave Sneaker Garden at 100% permanent progress');
  assert(errors.length === 0, `Mastery browser errors: ${errors.join(' | ')}`);
  await context.close();
}

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  await assertRestore(browser);
  await assertMastery(browser);
  console.log('Sneaker Garden Restore + Mastery smoke passed with save v6 persistence and 100% completion.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
