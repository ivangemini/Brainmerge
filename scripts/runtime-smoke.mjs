import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const OUTPUT = new URL('../runtime-artifacts/', import.meta.url);
const SAVE_KEY = 'brainmerge.save.v1';
const FAMILIES = [
  ['toilet-buddy', 1],
  ['camera-dude', 2],
  ['sigma-rock', 3],
  ['rizz-head', 4],
  ['shark-sneakers', 5],
  ['crocodile-bomber', 6],
  ['coffee-ballerina', 7],
  ['tung-wood', 8]
];

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav']
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const normalized = normalize(clean);
  if (normalized.startsWith('..')) throw new Error('Unsafe path');
  return join(ROOT.pathname, normalized);
}

function unit(familyId, tier, suffix) {
  return { id: `smoke-${familyId}-${suffix}`, familyId, tier };
}

function baseState(overrides = {}) {
  return {
    version: 5,
    cells: Array(30).fill(null),
    coins: 1000,
    xp: 500,
    merges: 10,
    spawns: 10,
    paidBoxes: 5,
    maxDiscoveredTier: 4,
    missionIndex: 1,
    upgrades: { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 },
    incomeRemainder: 0,
    lastAccrualAt: Date.now(),
    pendingOfflineCoins: 0,
    selectedIndex: null,
    messageKey: null,
    ...overrides
  };
}

function highTierState() {
  const cells = Array(30).fill(null);
  FAMILIES.forEach(([familyId, tier], index) => { cells[index] = unit(familyId, tier, index); });
  return baseState({ cells, coins: 50000, xp: 4000, merges: 80, spawns: 45, paidBoxes: 30, maxDiscoveredTier: 8, missionIndex: 7, upgrades: { boxBaseTier: 2, luckyDrop: 3, income: 3, offline: 2 } });
}

function crowdedState() {
  const cells = Array(30).fill(null);
  for (let i = 0; i < 21; i += 1) {
    const [familyId, tier] = FAMILIES[i % 5];
    cells[i] = unit(familyId, tier, i);
  }
  cells[19] = unit('shark-sneakers', 5, 'best-a');
  cells[20] = unit('shark-sneakers', 5, 'best-b');
  return baseState({ cells, maxDiscoveredTier: 5, merges: 35, spawns: 25, missionIndex: 4 });
}

function deadlockState() {
  return baseState({ cells: Array.from({ length: 30 }, (_, i) => unit('tung-wood', 8, i)), coins: 777, maxDiscoveredTier: 8, merges: 100, spawns: 50, missionIndex: 8, upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 } });
}

function rewardAndUpgradeState() {
  const cells = Array(30).fill(null);
  cells[0] = unit('toilet-buddy', 1, 0);
  cells[1] = unit('camera-dude', 2, 1);
  return baseState({ cells, coins: 99999, merges: 6, spawns: 12, maxDiscoveredTier: 1, missionIndex: 0, pendingOfflineCoins: 12345, upgrades: { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 } });
}

function maxedUpgradeState() {
  const cells = Array(30).fill(null);
  cells[0] = unit('tung-wood', 8, 0);
  return baseState({ cells, coins: 250000, merges: 120, spawns: 90, paidBoxes: 60, maxDiscoveredTier: 8, missionIndex: 8, upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 } });
}

function discoveryState() {
  const cells = Array(30).fill(null);
  cells[0] = unit('coffee-ballerina', 7, 'a');
  cells[1] = unit('coffee-ballerina', 7, 'b');
  return baseState({ cells, coins: 5000, merges: 60, spawns: 30, maxDiscoveredTier: 7, missionIndex: 6, upgrades: { boxBaseTier: 2, luckyDrop: 2, income: 2, offline: 2 } });
}

const server = createServer(async (req, res) => {
  try {
    let filePath = safePath(req.url ?? '/');
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
      if (!extname(filePath)) filePath = join(ROOT.pathname, 'index.html');
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': mime.get(extname(filePath)) ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
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
  const tier = await page.locator('.cell[data-family="camera-dude"]').count();
  assert(tier === 1, `${label}: merge did not create exactly one Camera Dude`);
}

async function loadState(page, state) {
  await page.goto('http://127.0.0.1:4173/?platform=local', { waitUntil: 'networkidle' });
  // Wait for the first boot to finish its initial save before replacing local state;
  // otherwise its async boot tail can race and overwrite the controlled fixture.
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  const fixture = { ...state, lastAccrualAt: Date.now(), selectedIndex: null, messageKey: null };
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [SAVE_KEY, fixture]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  await page.waitForFunction(([key, expectedTier]) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try { return JSON.parse(raw).maxDiscoveredTier === expectedTier; } catch { return false; }
  }, [SAVE_KEY, fixture.maxDiscoveredTier]);
}

async function assertHealthyPage(page, label) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src'))
  }));
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
  assert(result.brokenImages.length === 0, `${label}: broken images: ${result.brokenImages.join(', ')}`);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('http://127.0.0.1:4173/?platform=local', { waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });

    const snapshot = await page.evaluate(() => {
      const isVisible = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return null;
        const box = element.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
      };
      return { cells: document.querySelectorAll('.board-tray .cell').length, mission: isVisible('.side-card--mission'), collection: isVisible('.side-card--collection'), lab: isVisible('.side-card--lab'), spawn: isVisible('[data-action="spawn"]'), nextMove: isVisible('.next-action') || isVisible('.coach-card'), labRect: rect('.side-card--lab'), collectionRect: rect('.side-card--collection') };
    });

    assert(snapshot.cells === 30, `${viewport.name}: expected 30 board cells, got ${snapshot.cells}`);
    assert(snapshot.mission, `${viewport.name}: Mission panel is not visible`);
    assert(snapshot.collection, `${viewport.name}: Collection panel is not visible`);
    assert(snapshot.lab, `${viewport.name}: Brain Lab panel is not visible`);
    assert(snapshot.spawn, `${viewport.name}: Brain Box action is not visible`);
    assert(snapshot.nextMove, `${viewport.name}: onboarding/next-move guidance is not visible`);
    await assertHealthyPage(page, viewport.name);
    assert(pageErrors.length === 0, `${viewport.name}: page errors: ${pageErrors.join(' | ')}`);

    if (viewport.name === 'compact') {
      assert(snapshot.labRect && snapshot.collectionRect, 'compact: missing rail geometry');
      assert(Math.abs(snapshot.labRect.top - snapshot.collectionRect.top) <= 2, `compact: Brain Lab and Collection must share the same rail row (${snapshot.labRect.top} vs ${snapshot.collectionRect.top})`);
      assert(snapshot.collectionRect.height < snapshot.labRect.height, `compact: Collection still stretches to Brain Lab height (${snapshot.collectionRect.height} >= ${snapshot.labRect.height})`);
    }
    if (viewport.name === 'mobile') {
      assert(snapshot.labRect && snapshot.collectionRect, 'mobile: missing rail geometry');
      assert(snapshot.labRect.top < snapshot.collectionRect.top, 'mobile: Brain Lab must appear before Collection');
    }

    if (viewport.touch) {
      await page.locator('[data-cell="0"]').tap({ force: true });
      await page.locator('[data-cell="1"]').tap({ force: true });
      await waitForOneMerge(page, `${viewport.name} touch`);
    } else {
      await page.locator('[data-cell="0"]').click({ force: true });
      await page.locator('[data-cell="1"]').click({ force: true });
      await waitForOneMerge(page, `${viewport.name} mouse`);
    }

    const pointerSprite = await page.evaluate(() => {
      const cameraVisual = document.querySelector('.cell[data-family="camera-dude"] .unit-visual');
      if (!(cameraVisual instanceof HTMLElement)) return null;
      const pseudo = getComputedStyle(cameraVisual, '::before');
      const box = cameraVisual.getBoundingClientRect();
      return { backgroundImage: pseudo.backgroundImage, position: pseudo.position, display: pseudo.display, width: box.width, height: box.height };
    });
    assert(pointerSprite, `${viewport.name}: merged T2 has no board sprite slot`);
    assert(pointerSprite.backgroundImage !== 'none', `${viewport.name}: merged T2 sprite background is missing`);
    assert(pointerSprite.position === 'absolute', `${viewport.name}: merged T2 sprite is not absolutely anchored`);
    assert(pointerSprite.display !== 'none', `${viewport.name}: merged T2 sprite is hidden`);
    assert(pointerSprite.width > 0 && pointerSprite.height > 0, `${viewport.name}: merged T2 sprite slot has no geometry`);

    await page.screenshot({ path: new URL(`${viewport.name}.png`, OUTPUT).pathname, fullPage: true });

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
    await page.locator('[data-cell="0"]').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await waitForOneMerge(page, `${viewport.name} keyboard`);
    const activeCell = await page.evaluate(() => document.activeElement instanceof HTMLElement ? document.activeElement.dataset.cell : null);
    assert(activeCell === '1', `${viewport.name}: keyboard focus was not restored to merge target`);
    await context.close();
  }

  const stateContext = await browser.newContext({ viewport: { width: 1024, height: 576 } });
  const statePage = await stateContext.newPage();

  await loadState(statePage, highTierState());
  for (const [familyId] of FAMILIES) assert((await statePage.locator(`.cell[data-family="${familyId}"]`).count()) >= 1, `high-tier: missing ${familyId} board unit`);
  assert((await statePage.locator('.collection-chip.is-unlocked').count()) === 8, 'high-tier: Collection must unlock all eight tiers');
  for (const [familyId] of FAMILIES.slice(1)) {
    const sprite = await statePage.locator(`.cell[data-family="${familyId}"] .unit-visual`).evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      return { bg: pseudo.backgroundImage, display: pseudo.display, width: element.getBoundingClientRect().width };
    });
    assert(sprite.bg !== 'none' && sprite.display !== 'none' && sprite.width > 0, `high-tier: ${familyId} board sprite is missing`);
  }
  await assertHealthyPage(statePage, 'high-tier');
  await statePage.screenshot({ path: new URL('state-high-tiers.png', OUTPUT).pathname, fullPage: true });

  await loadState(statePage, crowdedState());
  assert(await statePage.locator('.board-nudge').isVisible(), 'crowded: best-merge guidance is not visible');
  assert((await statePage.locator('.cell.is-suggested-pair').count()) === 2, 'crowded: exactly one suggested pair should be highlighted');
  await assertHealthyPage(statePage, 'crowded');
  await statePage.screenshot({ path: new URL('state-crowded.png', OUTPUT).pathname, fullPage: true });

  await loadState(statePage, deadlockState());
  assert(await statePage.locator('.board-status--danger').isVisible(), 'deadlock: danger state is not visible');
  assert(await statePage.locator('[data-action="rescue"]').isVisible(), 'deadlock: Rescue action is not visible');
  assert(await statePage.locator('[data-action="spawn"]').isDisabled(), 'deadlock: Brain Box must be disabled on a full board');
  await assertHealthyPage(statePage, 'deadlock');
  await statePage.screenshot({ path: new URL('state-deadlock.png', OUTPUT).pathname, fullPage: true });

  await loadState(statePage, rewardAndUpgradeState());
  assert(await statePage.locator('.offline-reward').isVisible(), 'reward-state: offline reward is not visible');
  assert(await statePage.locator('[data-action="claim-offline"]').isVisible(), 'reward-state: offline Collect action is missing');
  assert(await statePage.locator('[data-action="claim-mission"]').isEnabled(), 'reward-state: completed mission is not claimable');
  assert((await statePage.locator('.upgrade-card.is-locked').count()) >= 1, 'reward-state: discovery-locked upgrade state is missing');
  assert((await statePage.locator('.upgrade-card.is-affordable').count()) >= 1, 'reward-state: affordable upgrade state is missing');
  await assertHealthyPage(statePage, 'reward-state');
  await statePage.screenshot({ path: new URL('state-rewards-upgrades.png', OUTPUT).pathname, fullPage: true });

  await loadState(statePage, maxedUpgradeState());
  assert((await statePage.locator('.upgrade-card.is-maxed').count()) === 4, 'maxed-state: all four upgrades should be maxed');
  assert(await statePage.locator('.mission-complete').isVisible(), 'maxed-state: mission journey complete badge is missing');
  await assertHealthyPage(statePage, 'maxed-state');
  await statePage.screenshot({ path: new URL('state-maxed.png', OUTPUT).pathname, fullPage: true });

  await loadState(statePage, discoveryState());
  await statePage.locator('[data-cell="0"]').click({ force: true });
  await statePage.locator('[data-cell="1"]').click({ force: true });
  await statePage.waitForFunction(() => document.querySelector('.cell[data-chain-tier="8"]'));
  assert(await statePage.locator('.discovery-toast').isVisible(), 'discovery: T8 discovery toast is missing');
  assert((await statePage.locator('.collection-chip.is-unlocked').count()) === 8, 'discovery: Collection did not unlock T8');
  await assertHealthyPage(statePage, 'discovery');
  await statePage.screenshot({ path: new URL('state-t8-discovery.png', OUTPUT).pathname, fullPage: true });

  await stateContext.close();
  console.log('Packaged runtime smoke OK: fresh viewports + production state matrix');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
