import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const SAVE_KEY = 'brainmerge.save.v1';
const APP_URL = 'http://127.0.0.1:4174/?platform=local';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.webp', 'image/webp'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
]);

function assert(condition, message) { if (!condition) throw new Error(message); }
function cssSeconds(value) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return Number.POSITIVE_INFINITY;
  return value.trim().endsWith('ms') ? amount / 1000 : amount;
}
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

async function waitForRuntime(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  assert(await page.locator('.board-tray .cell').count() === 30, 'runtime must render 30 board cells');
}

async function assertNoPageErrors(page, errors, label) {
  const health = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    broken: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length
  }));
  assert(errors.length === 0, `${label}: page errors: ${errors.join(' | ')}`);
  assert(health.broken === 0, `${label}: broken runtime images`);
  assert(health.scrollWidth <= health.innerWidth + 1, `${label}: horizontal overflow ${health.scrollWidth}px > ${health.innerWidth}px`);
}

await new Promise((resolve) => server.listen(4174, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  // Release-candidate fresh-save accessibility behavior.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await waitForRuntime(page);

    let focusedCell = false;
    for (let index = 0; index < 80; index += 1) {
      await page.keyboard.press('Tab');
      focusedCell = await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.matches('[data-cell]'));
      if (focusedCell) break;
    }
    assert(focusedCell, 'accessibility: keyboard Tab must reach the merge board');
    const focusStyle = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle, color: style.outlineColor };
    });
    assert(focusStyle && focusStyle.width >= 3 && focusStyle.style !== 'none' && focusStyle.color !== 'rgba(0, 0, 0, 0)', 'accessibility: focused board cell needs a visible >=3px focus ring');
    await assertNoPageErrors(page, errors, 'fresh accessibility');
    await context.close();
  }

  // Reduced-motion must suppress gameplay attention loops rather than merely slowing them.
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 576 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await waitForRuntime(page);
    const motion = await page.evaluate(() => {
      const cell = document.querySelector('.cell.is-tutorial-pair');
      const spawn = document.querySelector('.spawn-dock.is-tutorial .spawn-button');
      const read = (element) => element instanceof HTMLElement ? {
        name: getComputedStyle(element).animationName,
        duration: getComputedStyle(element).animationDuration
      } : null;
      return { media: matchMedia('(prefers-reduced-motion: reduce)').matches, cell: read(cell), spawn: read(spawn) };
    });
    assert(motion.media, 'reduced-motion media query must be active');
    assert(!motion.cell || motion.cell.name === 'none' || cssSeconds(motion.cell.duration) <= 0.001, `reduced-motion: tutorial cell still animates (${JSON.stringify(motion.cell)})`);
    assert(!motion.spawn || motion.spawn.name === 'none' || cssSeconds(motion.spawn.duration) <= 0.001, `reduced-motion: spawn CTA still animates (${JSON.stringify(motion.spawn)})`);
    await assertNoPageErrors(page, errors, 'reduced motion');
    await context.close();
  }

  // Coarse-pointer phone controls must remain finger-sized in the packaged layout.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await waitForRuntime(page);
    const targets = await page.evaluate(() => {
      const selectors = ['.locale-button', '[data-cell]', '.spawn-button', '.side-action:not(:disabled)', '.upgrade-card button:not(:disabled)', '.offline-reward button'];
      return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      }).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, cls: element.className, width: rect.width, height: rect.height };
      });
    });
    const undersized = targets.filter((target) => target.width < 44 || target.height < 44);
    assert(undersized.length === 0, `touch targets below 44px: ${JSON.stringify(undersized.slice(0, 8))}`);
    await assertNoPageErrors(page, errors, 'coarse pointer');
    await context.close();
  }

  // A real legacy v2 payload must migrate through packaged boot, render, and persist as canonical v6.
  {
    const legacyCells = Array(30).fill(null);
    legacyCells[0] = { id: 'legacy-shark', familyId: 'shark-sneakers', tier: 1 };
    legacyCells[1] = { id: 'legacy-toilet-a', familyId: 'toilet-buddy', tier: 1 };
    legacyCells[2] = { id: 'legacy-toilet-b', familyId: 'toilet-buddy', tier: 1 };
    const legacy = {
      version: 2,
      cells: legacyCells,
      coins: 55,
      xp: 22,
      merges: 9,
      spawns: 4,
      missionClaimed: true,
      selectedIndex: 1,
      messageKey: 'message.moved'
    };
    const context = await browser.newContext({ viewport: { width: 1024, height: 576 } });
    await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: legacy });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await waitForRuntime(page);
    assert(await page.locator('.cell[data-family="shark-sneakers"][data-chain-tier="5"]').count() === 1, 'migration: legacy Shark must render as canonical T5');
    assert(await page.locator('.collection-chip.is-unlocked').count() >= 5, 'migration: Collection must preserve discovered T5 progress');
    const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
    assert(persisted?.version === 6, `migration: persisted save version must be 6, got ${persisted?.version}`);
    assert(persisted?.maxDiscoveredTier === 5, `migration: expected maxDiscoveredTier 5, got ${persisted?.maxDiscoveredTier}`);
    assert(persisted?.selectedIndex === null, 'migration: stale legacy selection must be cleared');
    assert(persisted?.missionIndex === 1, `migration: mission compatibility expected index 1, got ${persisted?.missionIndex}`);
    assert(Array.isArray(persisted?.collectionRewardClaims) && persisted.collectionRewardClaims.length === 0, 'migration: Collection Reward claims must initialize empty');
    assert(persisted?.prestigeCount === 0 && persisted?.brainCells === 0, 'migration: Prestige meta must initialize to zero');
    assert(persisted?.campaign?.worlds?.['1'] && persisted?.campaign?.worlds?.['2'], 'migration: Campaign v6 foundation must initialize Worlds 1-2');
    assert(persisted.campaign.worlds['1'].raidProgress === 0 && persisted.campaign.worlds['1'].raidCleared === false, 'migration: World 1 Raid must initialize clean');
    await assertNoPageErrors(page, errors, 'migrated save');
    await context.close();
  }

  console.log('Packaged RC smoke OK: focus + reduced motion + touch targets + v2->v6 migration');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
