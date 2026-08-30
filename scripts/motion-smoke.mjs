import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const APP_URL = 'http://127.0.0.1:4175/?platform=local';
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

async function openRuntime(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
  assert(errors.length === 0, `boot page errors: ${errors.join(' | ')}`);
  return { page, errors };
}

await new Promise((resolve) => server.listen(4175, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  // Normal-motion path: pointer drag, real merge and Brain Box actions must emit transient choreography.
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 576 } });
    const { page, errors } = await openRuntime(context);

    const occupied = page.locator('.cell.is-occupied');
    assert(await occupied.count() >= 4, 'fresh board must expose the starter merge pair');

    const dragCell = page.locator('[data-cell="2"]');
    const dragBox = await dragCell.boundingBox();
    assert(dragBox, 'starter drag cell must have geometry');
    const cx = dragBox.x + dragBox.width / 2;
    const cy = dragBox.y + dragBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 18, cy + 2, { steps: 3 });
    assert(await dragCell.evaluate((el) => el.classList.contains('fx-pointer-drag')), 'live pointer movement must lift and track the source unit');
    const dragTransform = await dragCell.locator('.unit-visual').evaluate((el) => getComputedStyle(el).transform);
    assert(dragTransform !== 'none', 'dragged unit must expose a non-empty transform');
    await page.mouse.move(cx, cy, { steps: 2 });
    await page.mouse.up();
    assert(await page.locator('.fx-pointer-drag').count() === 0, 'pointer drag presentation state must clean up on release');
    await page.keyboard.press('Escape');

    await page.locator('[data-cell="0"]').click({ force: true });
    await page.locator('[data-cell="1"]').click({ force: true });

    const mergeCell = page.locator('[data-cell="1"]');
    assert(await mergeCell.evaluate((el) => el.classList.contains('fx-merge-result')), 'merge result class must be emitted by the real merge transition');
    assert(await page.locator('.fx-burst').count() >= 1, 'merge must emit a transient particle burst');
    assert(await page.locator('.fx-unit-flight').count() === 1, 'merge must create one flying source-unit ghost');
    assert(await page.locator('.fx-coin-trail').count() >= 3, 'merge reward must emit a coin trail toward the HUD');
    assert(await page.locator('.fx-discovery-tier').count() === 1, 'first T2 merge must emit discovery-tier hero feedback');
    assert(await page.locator('.game-shell.fx-discovery-celebration').count() === 1, 'first discovery must animate the board-level celebration state');

    const flightBox = await page.locator('.fx-unit-flight').boundingBox();
    assert(flightBox && flightBox.width > 10 && flightBox.height > 10, 'merge flight ghost must have visible runtime geometry');
    const mergeAnimation = await mergeCell.locator('.unit-visual').evaluate((el) => getComputedStyle(el).animationName);
    assert(mergeAnimation.includes('bmMergePop'), `merge result must run bmMergePop, got ${mergeAnimation}`);

    await page.waitForTimeout(950);
    assert(await page.locator('.fx-burst').count() === 0, 'merge particle burst must clean itself up');
    assert(await page.locator('.fx-unit-flight').count() === 0, 'merge flight ghost must clean itself up');
    assert(await page.locator('.fx-coin-trail').count() === 0, 'coin trail nodes must clean themselves up');
    assert(await page.locator('.fx-discovery-tier').count() === 0, 'discovery tier badge must clean itself up');
    const idleAnimation = await mergeCell.locator('.unit-visual').evaluate((el) => getComputedStyle(el).animationName);
    assert(idleAnimation.includes('bmIdleCamera'), `Camera Dude should settle into its family-specific idle, got ${idleAnimation}`);

    const spawnButton = page.locator('[data-action="spawn"]');
    assert(await spawnButton.isEnabled(), 'fresh economy after one merge must still allow a paid Brain Box');
    await spawnButton.click({ force: true });
    assert(await page.locator('.spawn-dock.fx-spawn-dock').count() === 1, 'Brain Box action must animate the spawn dock');
    assert(await page.locator('.cell.fx-spawn').count() === 1, 'new Brain Box unit must receive spawn-pop choreography');
    const spawnAnimation = await page.locator('.cell.fx-spawn .unit-visual').evaluate((el) => getComputedStyle(el).animationName);
    assert(spawnAnimation.includes('bmSpawnPop'), `spawned unit must run bmSpawnPop, got ${spawnAnimation}`);

    await page.waitForTimeout(800);
    assert(await page.locator('.cell.fx-spawn').count() === 0, 'spawn transition class must be transient');
    assert(errors.length === 0, `motion path page errors: ${errors.join(' | ')}`);
    await context.close();
  }

  // Reduced-motion path: state transition still works while decorative choreography is suppressed.
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 576 }, reducedMotion: 'reduce' });
    const { page, errors } = await openRuntime(context);
    assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced-motion media query must be active');

    const dragCell = page.locator('[data-cell="2"]');
    const dragBox = await dragCell.boundingBox();
    assert(dragBox, 'reduced-motion drag cell must have geometry');
    await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragBox.x + dragBox.width / 2 + 18, dragBox.y + dragBox.height / 2, { steps: 2 });
    assert(await page.locator('.fx-pointer-drag').count() === 0, 'reduced motion must suppress live pointer-drag choreography');
    await page.mouse.up();

    await page.locator('[data-cell="0"]').click({ force: true });
    await page.locator('[data-cell="1"]').click({ force: true });
    assert(await page.locator('[data-cell="1"][data-chain-tier="2"]').count() === 1, 'merge gameplay must still complete with reduced motion');
    assert(await page.locator('.fx-burst').count() === 0, 'reduced motion must suppress particle DOM creation');
    assert(await page.locator('.fx-unit-flight').count() === 0, 'reduced motion must suppress flying merge ghosts');
    assert(await page.locator('.fx-coin-trail').count() === 0, 'reduced motion must suppress coin trails');
    assert(await page.locator('.fx-discovery-tier').count() === 0, 'reduced motion must suppress discovery hero badge creation');
    const duration = await page.locator('[data-cell="1"] .unit-visual').evaluate((el) => getComputedStyle(el).animationDuration);
    const seconds = duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
    assert(Number.isFinite(seconds) && seconds <= 0.001, `reduced-motion merge animation must collapse to <=1ms, got ${duration}`);
    assert(errors.length === 0, `reduced-motion path page errors: ${errors.join(' | ')}`);
    await context.close();
  }

  console.log('Packaged motion smoke OK: pointer drag + flight + merge + discovery + coin trails + spawn + cleanup + reduced motion');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
