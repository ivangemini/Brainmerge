import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const OUTPUT = new URL('../runtime-artifacts/', import.meta.url);
const SAVE_KEY = 'brainmerge.save.v1';
const FAMILIES = [
  ['toilet-buddy', 1], ['camera-dude', 2], ['sigma-rock', 3], ['rizz-head', 4],
  ['shark-sneakers', 5], ['crocodile-bomber', 6], ['coffee-ballerina', 7], ['tung-wood', 8],
  ['brr-brr-patapim', 9], ['boneca-ambalabu', 10], ['cappuccino-assassino', 11], ['frigo-camelo', 12],
  ['lirili-larila', 13], ['chimpanzini-bananini', 14], ['cocofanto-elefanto', 15], ['bombombini-gusini', 16],
  ['trippi-troppi', 17], ['la-vacca-saturno-saturnita', 18]
];

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
function unit(familyId, tier, suffix) { return { id: `smoke-${familyId}-${suffix}`, familyId, tier }; }
function baseState(overrides = {}) {
  return {
    version: 5, cells: Array(30).fill(null), coins: 1000, xp: 500, merges: 10, spawns: 10, paidBoxes: 5,
    maxDiscoveredTier: 4, missionIndex: 1, upgrades: { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 },
    incomeRemainder: 0, lastAccrualAt: Date.now(), pendingOfflineCoins: 0, selectedIndex: null, messageKey: null, ...overrides
  };
}
function highTierState() {
  const cells = Array(30).fill(null);
  FAMILIES.forEach(([familyId, tier], index) => { cells[index] = unit(familyId, tier, index); });
  return baseState({ cells, coins: 50000, xp: 12000, merges: 180, spawns: 95, paidBoxes: 60, maxDiscoveredTier: 18, missionIndex: 8, upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 } });
}
function crowdedState() {
  const cells = Array(30).fill(null);
  for (let i = 0; i < 21; i += 1) { const [familyId, tier] = FAMILIES[i % 5]; cells[i] = unit(familyId, tier, i); }
  cells[19] = unit('shark-sneakers', 5, 'best-a'); cells[20] = unit('shark-sneakers', 5, 'best-b');
  return baseState({ cells, maxDiscoveredTier: 5, merges: 35, spawns: 25, missionIndex: 4 });
}
function deadlockState() {
  return baseState({ cells: Array.from({ length: 30 }, (_, i) => unit('la-vacca-saturno-saturnita', 18, i)), coins: 777, maxDiscoveredTier: 18, merges: 220, spawns: 120, missionIndex: 8, upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 } });
}
function rewardAndUpgradeState() {
  const cells = Array(30).fill(null); cells[0] = unit('toilet-buddy', 1, 0);
  return baseState({ cells, coins: 99999, merges: 6, spawns: 12, maxDiscoveredTier: 1, missionIndex: 0, pendingOfflineCoins: 12345 });
}
function maxedUpgradeState() {
  const cells = Array(30).fill(null); cells[0] = unit('tung-wood', 8, 0);
  return baseState({ cells, coins: 250000, merges: 120, spawns: 90, paidBoxes: 60, maxDiscoveredTier: 8, missionIndex: 8, upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 } });
}
function discoveryState() {
  const cells = Array(30).fill(null); cells[0] = unit('coffee-ballerina', 7, 'a'); cells[1] = unit('coffee-ballerina', 7, 'b');
  return baseState({ cells, coins: 5000, merges: 60, spawns: 30, maxDiscoveredTier: 7, missionIndex: 6, upgrades: { boxBaseTier: 2, luckyDrop: 2, income: 2, offline: 2 } });
}

const server = createServer(async (req, res) => {
  try {
    let filePath = safePath(req.url ?? '/');
    try { const info = await stat(filePath); if (info.isDirectory()) filePath = join(filePath, 'index.html'); }
    catch { if (!extname(filePath)) filePath = join(ROOT.pathname, 'index.html'); }
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': mime.get(extname(filePath)) ?? 'application/octet-stream', 'cache-control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
});

await mkdir(OUTPUT, { recursive: true });
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: 'desktop', width: 1440, height: 900, touch: false },
  { name: 'compact', width: 1024, height: 576, touch: false },
  { name: 'mobile', width: 390, height: 844, touch: true }
];

async function waitForOneMerge(page, label) {
  await page.waitForFunction(() => document.querySelector('.hud-pill--merge strong')?.textContent?.trim() === '1');
  assert((await page.locator('.cell[data-family="camera-dude"]').count()) === 1, `${label}: merge did not create exactly one Camera Dude`);
}
async function assertHealthyPage(page, label) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src'))
  }));
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
  assert(result.brokenImages.length === 0, `${label}: broken images: ${result.brokenImages.join(', ')}`);
}
async function openFixture(state, name, options = {}) {
  const context = await browser.newContext({ viewport: { width: options.width ?? 1024, height: options.height ?? 576 }, hasTouch: options.touch ?? false });
  const fixture = { ...state, lastAccrualAt: Date.now(), selectedIndex: null, messageKey: null };
  await context.addInitScript(({ key, value }) => {
    if (location.hostname === '127.0.0.1') localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: fixture });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/?platform=local', { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  assert(errors.length === 0, `${name}: page errors: ${errors.join(' | ')}`);
  return { context, page };
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch });
    const page = await context.newPage(); const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:4173/?platform=local', { waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });

    const snapshot = await page.evaluate(() => {
      const isVisible = (selector) => { const e = document.querySelector(selector); if (!(e instanceof HTMLElement)) return false; const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      const rect = (selector) => { const e = document.querySelector(selector); if (!(e instanceof HTMLElement)) return null; const r = e.getBoundingClientRect(); return { top: r.top, height: r.height }; };
      return { cells: document.querySelectorAll('.board-tray .cell').length, mission: isVisible('.side-card--mission'), collection: isVisible('.side-card--collection'), lab: isVisible('.side-card--lab'), spawn: isVisible('[data-action="spawn"]'), nextMove: isVisible('.next-action') || isVisible('.coach-card'), labRect: rect('.side-card--lab'), collectionRect: rect('.side-card--collection') };
    });
    assert(snapshot.cells === 30, `${viewport.name}: expected 30 board cells`); assert(snapshot.mission && snapshot.collection && snapshot.lab && snapshot.spawn && snapshot.nextMove, `${viewport.name}: required production surface missing`);
    await assertHealthyPage(page, viewport.name); assert(pageErrors.length === 0, `${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    if (viewport.name === 'compact') { assert(Math.abs(snapshot.labRect.top - snapshot.collectionRect.top) <= 2, 'compact: rail cards must share row'); assert(snapshot.collectionRect.height < snapshot.labRect.height, 'compact: Collection must keep natural height'); }
    if (viewport.name === 'mobile') assert(snapshot.labRect.top < snapshot.collectionRect.top, 'mobile: Brain Lab must precede Collection');

    if (viewport.touch) { await page.locator('[data-cell="0"]').tap({ force: true }); await page.locator('[data-cell="1"]').tap({ force: true }); await waitForOneMerge(page, `${viewport.name} touch`); }
    else { await page.locator('[data-cell="0"]').click({ force: true }); await page.locator('[data-cell="1"]').click({ force: true }); await waitForOneMerge(page, `${viewport.name} mouse`); }
    const pointerSprite = await page.evaluate(() => { const e = document.querySelector('.cell[data-family="camera-dude"] .unit-visual'); if (!(e instanceof HTMLElement)) return null; const p = getComputedStyle(e, '::before'); return { backgroundImage: p.backgroundImage, position: p.position, display: p.display, width: e.getBoundingClientRect().width }; });
    assert(pointerSprite && pointerSprite.backgroundImage !== 'none' && pointerSprite.position === 'absolute' && pointerSprite.display !== 'none' && pointerSprite.width > 0, `${viewport.name}: merged T2 sprite slot invalid`);
    await page.screenshot({ path: new URL(`${viewport.name}.png`, OUTPUT).pathname, fullPage: true });

    await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
    await page.locator('[data-cell="0"]').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await waitForOneMerge(page, `${viewport.name} keyboard`);
    assert((await page.evaluate(() => document.activeElement instanceof HTMLElement ? document.activeElement.dataset.cell : null)) === '1', `${viewport.name}: keyboard focus was not restored`);
    await context.close();
  }

  {
    const { context, page } = await openFixture(highTierState(), 'high-tier');
    for (const [familyId] of FAMILIES) assert((await page.locator(`.cell[data-family="${familyId}"]`).count()) >= 1, `high-tier: missing ${familyId}`);
    assert((await page.locator('.collection-chip.is-unlocked').count()) === 18, 'high-tier: Collection must unlock all 18 tiers');
    assert((await page.locator('.offline-reward').count()) === 0, 'high-tier: trivial boot gap must not surface offline reward');
    for (const [familyId] of FAMILIES.slice(1, 8)) {
      const sprite = await page.locator(`.cell[data-family="${familyId}"] .unit-visual`).evaluate((e) => { const p = getComputedStyle(e, '::before'); return { bg: p.backgroundImage, display: p.display, width: e.getBoundingClientRect().width }; });
      assert(sprite.bg !== 'none' && sprite.display !== 'none' && sprite.width > 0, `high-tier: ${familyId} atlas sprite missing`);
    }
    for (const [familyId] of FAMILIES.slice(8)) {
      const art = await page.locator(`.cell[data-family="${familyId}"] .unit-art`).evaluate((e) => ({ complete: e.complete, naturalWidth: e.naturalWidth, width: e.getBoundingClientRect().width, display: getComputedStyle(e).display, opacity: getComputedStyle(e).opacity }));
      assert(art.complete && art.naturalWidth > 0 && art.width > 0 && art.display !== 'none' && Number(art.opacity) > 0, `high-tier: ${familyId} standalone art missing`);
    }
    await assertHealthyPage(page, 'high-tier'); await page.screenshot({ path: new URL('state-high-tiers.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }
  {
    const { context, page } = await openFixture(crowdedState(), 'crowded');
    assert(await page.locator('.board-nudge').isVisible(), 'crowded: best-merge guidance missing'); assert((await page.locator('.cell.is-suggested-pair').count()) === 2, 'crowded: expected exactly one suggested pair');
    await assertHealthyPage(page, 'crowded'); await page.screenshot({ path: new URL('state-crowded.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }
  {
    const { context, page } = await openFixture(deadlockState(), 'deadlock');
    assert(await page.locator('.board-status--danger').isVisible(), 'deadlock: danger state missing'); assert(await page.locator('[data-action="rescue"]').isVisible(), 'deadlock: Rescue missing'); assert(await page.locator('[data-action="spawn"]').isDisabled(), 'deadlock: Brain Box must be disabled');
    await assertHealthyPage(page, 'deadlock'); await page.screenshot({ path: new URL('state-deadlock.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }
  {
    const { context, page } = await openFixture(rewardAndUpgradeState(), 'reward-state');
    assert(await page.locator('.offline-reward').isVisible(), 'reward-state: offline reward missing'); assert(await page.locator('[data-action="claim-offline"]').isVisible(), 'reward-state: Collect missing'); assert(await page.locator('[data-action="claim-mission"]').isEnabled(), 'reward-state: mission not claimable');
    assert((await page.locator('.upgrade-card.is-locked').count()) >= 1, 'reward-state: locked upgrade missing'); assert((await page.locator('.upgrade-card.is-affordable').count()) >= 1, 'reward-state: affordable upgrade missing');
    await assertHealthyPage(page, 'reward-state'); await page.screenshot({ path: new URL('state-rewards-upgrades.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }
  {
    const { context, page } = await openFixture(maxedUpgradeState(), 'maxed-state');
    assert((await page.locator('.upgrade-card.is-maxed').count()) === 4, 'maxed-state: expected four maxed upgrades'); assert(await page.locator('.mission-complete').isVisible(), 'maxed-state: mission complete badge missing');
    await assertHealthyPage(page, 'maxed-state'); await page.screenshot({ path: new URL('state-maxed.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }
  {
    const { context, page } = await openFixture(discoveryState(), 'discovery');
    await page.locator('[data-cell="0"]').click({ force: true }); await page.locator('[data-cell="1"]').click({ force: true }); await page.waitForFunction(() => document.querySelector('.cell[data-chain-tier="8"]'));
    assert(await page.locator('.discovery-toast').isVisible(), 'discovery: T8 toast missing'); assert((await page.locator('.collection-chip.is-unlocked').count()) === 8, 'discovery: Collection did not unlock T8');
    await assertHealthyPage(page, 'discovery'); await page.screenshot({ path: new URL('state-t8-discovery.png', OUTPUT).pathname, fullPage: true }); await context.close();
  }

  console.log('Packaged runtime smoke OK: fresh viewports + production state matrix');
} finally {
  await browser.close(); await new Promise((resolve) => server.close(resolve));
}
