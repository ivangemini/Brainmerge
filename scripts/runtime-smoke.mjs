import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const OUTPUT = new URL('../runtime-artifacts/', import.meta.url);

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

await mkdir(OUTPUT, { recursive: true });
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact', width: 1024, height: 576 },
  { name: 'mobile', width: 390, height: 844 }
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
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
      const brokenImages = [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute('src'));

      return {
        cells: document.querySelectorAll('.board-tray .cell').length,
        mission: isVisible('.side-card--mission'),
        collection: isVisible('.side-card--collection'),
        lab: isVisible('.side-card--lab'),
        spawn: isVisible('[data-action="spawn"]'),
        nextMove: isVisible('.next-action') || isVisible('.coach-card'),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        brokenImages,
        labRect: rect('.side-card--lab'),
        collectionRect: rect('.side-card--collection')
      };
    });

    assert(snapshot.cells === 30, `${viewport.name}: expected 30 board cells, got ${snapshot.cells}`);
    assert(snapshot.mission, `${viewport.name}: Mission panel is not visible`);
    assert(snapshot.collection, `${viewport.name}: Collection panel is not visible`);
    assert(snapshot.lab, `${viewport.name}: Brain Lab panel is not visible`);
    assert(snapshot.spawn, `${viewport.name}: Brain Box action is not visible`);
    assert(snapshot.nextMove, `${viewport.name}: onboarding/next-move guidance is not visible`);
    assert(snapshot.scrollWidth <= snapshot.innerWidth + 1, `${viewport.name}: horizontal overflow ${snapshot.scrollWidth}px > ${snapshot.innerWidth}px`);
    assert(snapshot.brokenImages.length === 0, `${viewport.name}: broken images: ${snapshot.brokenImages.join(', ')}`);
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

    // Exercise the real code-driven keyboard merge path on a fresh save.
    await page.locator('[data-cell="0"]').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('.hud-pill--merge strong')?.textContent?.trim() === '1');
    const keyboardState = await page.evaluate(() => {
      const activeCell = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.cell : null;
      const cameraVisual = document.querySelector('.cell[data-family="camera-dude"] .unit-visual');
      if (!(cameraVisual instanceof HTMLElement)) return { activeCell, cameraSprite: null };
      const pseudo = getComputedStyle(cameraVisual, '::before');
      const box = cameraVisual.getBoundingClientRect();
      return {
        activeCell,
        cameraSprite: {
          backgroundImage: pseudo.backgroundImage,
          position: pseudo.position,
          display: pseudo.display,
          width: box.width,
          height: box.height
        }
      };
    });
    assert(keyboardState.activeCell === '1', `${viewport.name}: keyboard focus was not restored to merge target`);
    assert(keyboardState.cameraSprite, `${viewport.name}: merged T2 has no board sprite slot`);
    assert(keyboardState.cameraSprite.backgroundImage !== 'none', `${viewport.name}: merged T2 sprite background is missing`);
    assert(keyboardState.cameraSprite.position === 'absolute', `${viewport.name}: merged T2 sprite is not absolutely anchored`);
    assert(keyboardState.cameraSprite.display !== 'none', `${viewport.name}: merged T2 sprite is hidden`);
    assert(keyboardState.cameraSprite.width > 0 && keyboardState.cameraSprite.height > 0, `${viewport.name}: merged T2 sprite slot has no geometry`);

    await page.screenshot({ path: new URL(`${viewport.name}.png`, OUTPUT).pathname, fullPage: true });
    await context.close();
  }
  console.log('Packaged runtime smoke OK: desktop, compact, mobile');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
