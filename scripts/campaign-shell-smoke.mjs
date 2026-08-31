import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { createSneakerGardenDeliverRun } from '../build/core/campaign-run.js';
import { createInitialState } from '../build/core/game.js';

const ROOT = new URL('../dist/', import.meta.url);
const OUTPUT = new URL('../runtime-artifacts/', import.meta.url);
const PORT = 4181;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SAVE_KEY = 'brainmerge.save.v1';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.webp', 'image/webp'], ['.png', 'image/png'], ['.svg', 'image/svg+xml'],
  ['.mp3', 'audio/mpeg'], ['.wav', 'audio/wav']
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

function seededV6State() {
  const state = createInitialState(Date.now());
  const target = state.campaign.worlds['1']?.locations['w1-sneaker-garden'];
  assert(target, 'seed state is missing World 1 / Sneaker Garden');
  Object.assign(target, { stabilize: 1, deliver: 1, restore: 1, mastery: 1 });
  return state;
}

function seededDeliverV6State() {
  const state = createInitialState(Date.now());
  const target = state.campaign.worlds['1']?.locations['w1-sneaker-garden'];
  assert(target, 'deliver seed is missing World 1 / Sneaker Garden');
  target.stabilize = 1;
  state.maxDiscoveredTier = 4;
  state.campaignRun = createSneakerGardenDeliverRun(4);
  state.campaignRun.cells[0] = { id: 'browser-deliver-t2', familyId: 'camera-dude', tier: 2 };
  return state;
}

async function bootSeededStorage(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.touch
  });
  const seed = seededV6State();
  await context.addInitScript(({ origin, key, value }) => {
    if (location.origin === origin && localStorage.getItem(key) === null) {
      localStorage.setItem(key, value);
    }
  }, { origin: ORIGIN, key: SAVE_KEY, value: JSON.stringify(seed) });

  const page = await context.newPage();
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await page.waitForFunction((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    return saved?.version === 6 && saved?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.mastery === 1;
  }, SAVE_KEY);

  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

async function assertPersistedSave(page) {
  const persisted = await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      version: saved?.version,
      location: saved?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden'] ?? null
    };
  }, SAVE_KEY);
  assert(persisted.version === 6, `clean-context boot did not preserve save v6, got ${persisted.version}`);
  assert(persisted.location?.stabilize === 1, 'stabilize progress did not survive persistence handoff');
  assert(persisted.location?.deliver === 1, 'deliver progress did not survive persistence handoff');
  assert(persisted.location?.restore === 1, 'landmark progress did not survive persistence handoff');
  assert(persisted.location?.mastery === 1, 'mastery progress did not survive persistence handoff');
}

async function assertHealthy(page, label, expectedWorldProgress, expectedLandmarks) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src')),
    nodeCount: document.querySelectorAll('.campaign-node').length,
    locationNodeCount: document.querySelectorAll('.campaign-node--location').length,
    bossNodeCount: document.querySelectorAll('.campaign-node--boss').length,
    routeSvgCount: document.querySelectorAll('.campaign-route__svg').length,
    routeStrokeCount: document.querySelectorAll('.campaign-route__stroke').length,
    summaryCount: document.querySelectorAll('.campaign-world-summary > div').length,
    worldProgress: document.querySelector('.campaign-summary__progress strong')?.textContent?.trim() ?? '',
    landmarks: document.querySelector('.campaign-summary__landmarks strong')?.textContent?.trim() ?? '',
    shellOpen: document.querySelector('.campaign-shell')?.classList.contains('is-open') ?? false,
    bossWidth: document.querySelector('.campaign-boss')?.naturalWidth ?? 0,
    background: getComputedStyle(document.querySelector('.campaign-scene')).backgroundImage
  }));
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
  assert(result.brokenImages.length === 0, `${label}: broken images: ${result.brokenImages.join(', ')}`);
  assert(result.nodeCount === 8, `${label}: expected 8 map nodes, got ${result.nodeCount}`);
  assert(result.locationNodeCount === 7, `${label}: expected 7 persistent locations, got ${result.locationNodeCount}`);
  assert(result.bossNodeCount === 1, `${label}: expected 1 world raid node, got ${result.bossNodeCount}`);
  assert(result.routeSvgCount === 2, `${label}: expected desktop/mobile campaign routes, got ${result.routeSvgCount}`);
  assert(result.routeStrokeCount === 6, `${label}: expected 3 route strokes per layout, got ${result.routeStrokeCount}`);
  assert(result.summaryCount === 3, `${label}: world restoration summary is incomplete`);
  assert(result.worldProgress === expectedWorldProgress, `${label}: expected world progress ${expectedWorldProgress}, got ${result.worldProgress}`);
  assert(result.landmarks === expectedLandmarks, `${label}: expected landmarks ${expectedLandmarks}, got ${result.landmarks}`);
  assert(result.shellOpen, `${label}: campaign shell is not open`);
  assert(result.bossWidth > 0, `${label}: boss art failed to load`);
  assert(result.background.includes('campaign-world-'), `${label}: campaign background is missing`);
}

async function assertLocationOverview(page, label, expectedProgress) {
  await page.locator('.campaign-node--location').first().click();
  await page.locator('.campaign-detail.is-open').waitFor({ state: 'visible' });
  const detail = await page.evaluate(() => ({
    phaseCount: document.querySelectorAll('.campaign-detail.is-open .campaign-phase').length,
    title: document.querySelector('.campaign-detail.is-open .campaign-detail__title')?.textContent?.trim() ?? '',
    progress: document.querySelector('.campaign-detail.is-open .campaign-detail__progress-value')?.textContent?.trim() ?? '',
    completedPhases: document.querySelectorAll('.campaign-detail.is-open .campaign-phase[data-phase-status="complete"]').length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  assert(detail.phaseCount === 4, `${label}: expected 4 persistent location phases, got ${detail.phaseCount}`);
  assert(detail.title.length > 0, `${label}: location title is empty`);
  assert(detail.progress === expectedProgress, `${label}: expected location progress ${expectedProgress}, got ${detail.progress}`);
  if (expectedProgress === '100%') assert(detail.completedPhases === 4, `${label}: completed location should show four completed phases`);
  assert(!detail.horizontalOverflow, `${label}: location overview causes horizontal overflow`);
  await page.screenshot({ path: new URL(`campaign-location-${label}.png`, OUTPUT).pathname, fullPage: true });
  await page.locator('.campaign-detail__close').click();
  await page.waitForFunction(() => !document.querySelector('.campaign-detail')?.classList.contains('is-open'));
}

async function openSneakerGarden(page) {
  await page.locator('.campaign-entry').waitFor({ state: 'visible' });
  await page.locator('.campaign-entry').click();
  await page.locator('.campaign-shell.is-open').waitFor({ state: 'visible' });
  await page.locator('.campaign-node--location[data-location-id="w1-sneaker-garden"]').click();
  await page.locator('.campaign-detail.is-open').waitFor({ state: 'visible' });
  await page.locator('.campaign-detail__run-button').waitFor({ state: 'visible' });
}

async function assertPlayableRunPersistence(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  const mainOccupiedBefore = await page.locator('.board-tray .cell.is-occupied').count();

  await openSneakerGarden(page);
  await page.locator('.campaign-detail__run-button').click();
  await page.locator('.campaign-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await page.locator('.campaign-run-cell').count() === 30, 'playable run must render a separate 6x5 Campaign board');
  assert(await page.locator('.campaign-run-cell.is-overgrown').count() === 6, 'Sneaker Garden must start with six Overgrowth blockers');
  assert(await page.locator('.campaign-run-cell.is-occupied').count() === 4, 'Sneaker Garden must start with four Campaign units');
  assert(await page.locator('.board-tray .cell.is-occupied').count() === mainOccupiedBefore, 'starting Campaign must not consume main-board units');

  await page.locator('.campaign-run-cell[data-run-cell="0"]').click();
  await page.locator('.campaign-run-cell[data-run-cell="1"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.campaign-run-cell.is-overgrown').length === 5);
  assert(await page.locator('.campaign-run-progress strong').textContent() === '17%', 'one of six clearing pulses should render 17% Stabilize progress');
  assert(await page.locator('.board-tray .cell.is-occupied').count() === mainOccupiedBefore, 'Campaign merge must not mutate main-board occupancy');

  const persisted = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      version: save?.version,
      blockers: save?.campaignRun?.overgrowth?.filter(Boolean)?.length,
      runMerges: save?.campaignRun?.merges,
      permanentStabilize: save?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.stabilize
    };
  }, SAVE_KEY);
  assert(persisted.version === 6, `playable run persisted wrong save version ${persisted.version}`);
  assert(persisted.blockers === 5 && persisted.runMerges === 1, `playable run did not persist merge/Overgrowth state: ${JSON.stringify(persisted)}`);
  assert(persisted.permanentStabilize === 0, 'partial Stabilize must not prematurely commit permanent location progress');

  await page.locator('.campaign-run-back').click();
  await page.waitForFunction(() => !document.querySelector('.campaign-run-shell')?.classList.contains('is-open'));
  await page.locator('.campaign-node--location[data-location-id="w1-sneaker-garden"]').click();
  await page.locator('.campaign-detail__run-button').waitFor({ state: 'visible' });
  assert((await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase().includes('resume'), 'partial run should expose Resume on the map');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await openSneakerGarden(page);
  await page.locator('.campaign-detail__run-button').click();
  await page.locator('.campaign-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await page.locator('.campaign-run-cell.is-overgrown').count() === 5, 'reload must resume the same five remaining Overgrowth blockers');
  assert(await page.locator('.campaign-run-progress strong').textContent() === '17%', 'reload must restore Stabilize progress');
  assert(await page.locator('.board-tray .cell.is-occupied').count() === mainOccupiedBefore, 'resumed Campaign must remain isolated from main board');

  const geometry = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  assert(geometry.width <= geometry.viewport + 1, `playable run has horizontal overflow ${geometry.width}px > ${geometry.viewport}px`);
  assert(pageErrors.length === 0, `playable run page errors: ${pageErrors.join(' | ')}`);
  await page.screenshot({ path: new URL('campaign-sneaker-garden-stabilize-mobile.png', OUTPUT).pathname, fullPage: true });
  await context.close();
}

async function assertDeliverOrderPersistence(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const seed = seededDeliverV6State();
  await context.addInitScript(({ origin, key, value }) => {
    if (location.origin === origin && localStorage.getItem(key) === null) localStorage.setItem(key, value);
  }, { origin: ORIGIN, key: SAVE_KEY, value: JSON.stringify(seed) });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  const mainOccupiedBefore = await page.locator('.board-tray .cell.is-occupied').count();

  await openSneakerGarden(page);
  const launcherText = (await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase() ?? '';
  assert(launcherText.includes('orders'), `Deliver run should expose Orders launcher, got ${launcherText}`);
  await page.locator('.campaign-detail__run-button').click();
  await page.locator('.campaign-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await page.locator('.campaign-run-shell[data-phase="deliver"]').count() === 1, 'Deliver run must render phase-aware Campaign shell');
  assert(await page.locator('.campaign-run-cell').count() === 30, 'Deliver must reuse the separate 6x5 Campaign board');
  assert(await page.locator('.campaign-run-cell.is-overgrown').count() === 3, 'Deliver should retain three World 1 Overgrowth blockers');
  assert((await page.locator('.campaign-run-objective__counter strong').textContent())?.includes('T2'), 'first Deliver order should request T2');
  assert(await page.locator('.campaign-run-deliver').isDisabled(), 'Deliver action must be disabled until a matching Campaign unit is selected');

  await page.locator('.campaign-run-cell[data-run-cell="0"]').click();
  await page.waitForFunction(() => !document.querySelector('.campaign-run-deliver')?.disabled);
  assert((await page.locator('.campaign-run-deliver').textContent())?.includes('T2'), 'matching selected unit should expose Deliver T2');
  await page.locator('.campaign-run-deliver').click();
  await page.waitForFunction(() => document.querySelector('.campaign-run-progress strong')?.textContent?.trim() === '25%');
  assert(await page.locator('.campaign-run-cell[data-run-cell="0"]').evaluate((cell) => !cell.classList.contains('is-occupied')), 'delivered Campaign unit must leave the Campaign board');
  assert(await page.locator('.board-tray .cell.is-occupied').count() === mainOccupiedBefore, 'Deliver must not consume main-board units');

  await page.waitForFunction((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return save?.campaignRun?.orderIndex === 1 && save?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.deliver === 0.25;
  }, SAVE_KEY);
  const persisted = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      version: save?.version,
      phase: save?.campaignRun?.phase,
      orderIndex: save?.campaignRun?.orderIndex,
      orderTiers: save?.campaignRun?.orderTiers,
      deliver: save?.campaign?.worlds?.['1']?.locations?.['w1-sneaker-garden']?.deliver,
      blockers: save?.campaignRun?.overgrowth?.filter(Boolean)?.length
    };
  }, SAVE_KEY);
  assert(persisted.version === 6, `Deliver persisted wrong save version ${persisted.version}`);
  assert(persisted.phase === 'deliver' && persisted.orderIndex === 1, `Deliver order cursor did not persist: ${JSON.stringify(persisted)}`);
  assert(JSON.stringify(persisted.orderTiers) === JSON.stringify([2,2,3,4]), `Deliver order queue changed: ${JSON.stringify(persisted.orderTiers)}`);
  assert(persisted.deliver === 0.25, `first order must commit exactly 0.25 Deliver progress, got ${persisted.deliver}`);
  assert(persisted.blockers === 3, 'delivery itself must not silently clear Overgrowth');

  await page.locator('.campaign-run-back').click();
  await page.waitForFunction(() => !document.querySelector('.campaign-run-shell')?.classList.contains('is-open'));
  await page.locator('.campaign-node--location[data-location-id="w1-sneaker-garden"]').click();
  await page.locator('.campaign-detail.is-open').waitFor({ state: 'visible' });
  await page.locator('.campaign-detail__run-button').waitFor({ state: 'visible' });
  const resumeText = (await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase() ?? '';
  assert(resumeText.includes('resume') && resumeText.includes('orders'), `partial Deliver should expose Resume Orders, got ${resumeText}`);

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await openSneakerGarden(page);
  await page.locator('.campaign-detail__run-button').click();
  await page.locator('.campaign-run-shell.is-open').waitFor({ state: 'visible' });
  assert(await page.locator('.campaign-run-progress strong').textContent() === '25%', 'reload must restore Deliver order progress');
  assert((await page.locator('.campaign-run-objective__counter strong').textContent())?.includes('T2'), 'reload must restore the second T2 order');
  assert(await page.locator('.board-tray .cell.is-occupied').count() === mainOccupiedBefore, 'resumed Deliver must remain isolated from main board');
  const geometry = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  assert(geometry.width <= geometry.viewport + 1, `Deliver run has horizontal overflow ${geometry.width}px > ${geometry.viewport}px`);
  assert(pageErrors.length === 0, `Deliver run page errors: ${pageErrors.join(' | ')}`);
  await page.screenshot({ path: new URL('campaign-sneaker-garden-deliver-mobile.png', OUTPUT).pathname, fullPage: true });
  await context.close();
}

await mkdir(OUTPUT, { recursive: true });
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, touch: false },
    { name: 'mobile', width: 390, height: 844, touch: true }
  ]) {
    const storageState = await bootSeededStorage(browser, viewport);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      storageState
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${ORIGIN}/?platform=local`, { waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
    await assertPersistedSave(page);
    await page.locator('.campaign-entry').waitFor({ state: 'visible' });
    await page.locator('.campaign-entry').click();
    await page.locator('.campaign-shell.is-open').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.campaign-summary__progress strong')?.textContent?.trim() === '14%');
    assert(pageErrors.length === 0, `${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    await assertHealthy(page, `${viewport.name}-world1`, '14%', '1 / 7');
    assert(await page.locator('.campaign-node--location').first().locator('em').textContent() === '100%', `${viewport.name}: persisted location node did not render 100%`);
    await page.screenshot({ path: new URL(`campaign-world1-${viewport.name}.png`, OUTPUT).pathname, fullPage: true });
    await assertLocationOverview(page, `${viewport.name}-world1`, '100%');

    await page.locator('.campaign-world-tab[data-world="2"]').click();
    await page.waitForFunction(() => document.querySelector('.campaign-scene')?.dataset.world === '2');
    await page.waitForFunction(() => document.querySelector('.campaign-summary__progress strong')?.textContent?.trim() === '0%');
    await page.waitForFunction(() => document.querySelector('.campaign-boss')?.getAttribute('src')?.startsWith('data:image/webp;base64,'));
    await assertHealthy(page, `${viewport.name}-world2`, '0%', '0 / 7');
    await page.screenshot({ path: new URL(`campaign-world2-${viewport.name}.png`, OUTPUT).pathname, fullPage: true });
    await assertLocationOverview(page, `${viewport.name}-world2`, '0%');

    await page.locator('.campaign-node--boss').click();
    await page.locator('.campaign-detail.is-open').waitFor({ state: 'visible' });
    assert(await page.locator('.campaign-detail.is-open .campaign-phase').count() === 3, `${viewport.name}: raid should expose 3 persistent phases`);
    await page.locator('.campaign-detail__close').click();

    await page.keyboard.press('Escape');
    assert(!(await page.locator('.campaign-shell').evaluate((node) => node.classList.contains('is-open'))), `${viewport.name}: Escape did not close Campaign`);
    await context.close();
  }

  await assertPlayableRunPersistence(browser);
  await assertDeliverOrderPersistence(browser);
  console.log('Campaign shell smoke passed with canonical v6 persistence + Stabilize/Deliver resume.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}