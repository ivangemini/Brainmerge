import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const APP_URL = 'http://127.0.0.1:4178/?platform=local';
const SAVE_KEY = 'brainmerge.save.v1';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.webp', 'image/webp'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
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

function baseState(overrides = {}) {
  return {
    version: 5,
    cells: Array(30).fill(null),
    coins: 1000,
    xp: 0,
    merges: 0,
    spawns: 0,
    paidBoxes: 0,
    maxDiscoveredTier: 1,
    missionIndex: 0,
    upgrades: { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 },
    incomeRemainder: 0,
    lastAccrualAt: Date.now(),
    pendingOfflineCoins: 0,
    selectedIndex: null,
    messageKey: null,
    ...overrides
  };
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
    res.writeHead(200, {
      'content-type': mime.get(extname(filePath)) ?? 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

async function openFixture(browser, state, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const fixture = { ...state, lastAccrualAt: Date.now(), selectedIndex: null, messageKey: null };
  await context.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: fixture });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  assert(errors.length === 0, `fixture boot page errors: ${errors.join(' | ')}`);
  return { context, page, errors };
}

await new Promise((resolve) => server.listen(4178, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  // Mission Claim must execute the transaction, not merely render as enabled.
  {
    const state = baseState({ coins: 1000, merges: 6, missionIndex: 0 });
    const { context, page, errors } = await openFixture(browser, state);
    const claim = page.locator('[data-action="claim-mission"]');
    assert(await claim.isVisible(), 'mission regression: Claim reward must be visible');
    assert(await claim.isEnabled(), 'mission regression: Claim reward must be enabled');

    const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
    assert(before?.missionIndex === 0, `mission regression: expected missionIndex 0 before claim, got ${before?.missionIndex}`);

    await claim.click({ force: true });
    await page.waitForFunction((key) => {
      const next = JSON.parse(localStorage.getItem(key) ?? 'null');
      return next?.missionIndex === 1;
    }, SAVE_KEY);

    const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
    assert(after.coins === before.coins + 80, `mission regression: expected exact +80 reward, got ${after.coins - before.coins}`);
    assert(after.missionIndex === 1, 'mission regression: mission index must advance exactly once');
    assert(await page.locator('[data-action="claim-mission"]').isDisabled(), 'mission regression: next incomplete mission must not remain claimable');

    await page.waitForTimeout(40);
    const stable = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
    assert(stable.coins === after.coins && stable.missionIndex === 1, 'mission regression: render/FX must not duplicate the reward');
    assert(errors.length === 0, `mission regression page errors: ${errors.join(' | ')}`);
    await context.close();
  }

  // A valid T8 pair is not terminal. Pointer feedback must not reject it before the real T8->T9 merge.
  {
    const cells = Array(30).fill(null);
    cells[0] = { id: 't8-a', familyId: 'tung-wood', tier: 8 };
    cells[1] = { id: 't8-b', familyId: 'tung-wood', tier: 8 };
    const state = baseState({ cells, coins: 5000, merges: 50, maxDiscoveredTier: 8, missionIndex: 8 });
    const { context, page, errors } = await openFixture(browser, state, { width: 1024, height: 700 });

    await page.locator('[data-cell="0"]').click({ force: true });
    assert(await page.locator('[data-cell="0"].is-selected').count() === 1, 'high-tier regression: T8 source must select');

    const target = page.locator('[data-cell="1"]');
    const box = await target.boundingBox();
    assert(box, 'high-tier regression: T8 target must have geometry');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(30);

    assert(await page.locator('[data-cell="1"].fx-max-reject').count() === 0, 'high-tier regression: valid T8 target must not receive max-tier reject FX');
    assert(await page.locator('.board-frame.fx-board-reject').count() === 0, 'high-tier regression: valid T8 merge must not reject the board');

    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('[data-cell="1"][data-chain-tier="9"]'));
    assert(await page.locator('[data-cell="1"][data-family="brr-brr-patapim"][data-chain-tier="9"]').count() === 1, 'high-tier regression: pointer path must complete T8->T9');
    assert(await page.locator('.fx-max-reject').count() === 0, 'high-tier regression: valid merge must never leave max-tier reject FX');
    assert(errors.length === 0, `high-tier regression page errors: ${errors.join(' | ')}`);
    await context.close();
  }

  console.log('Regression smoke OK: Mission Claim transaction + valid T8 pointer merge FX');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
