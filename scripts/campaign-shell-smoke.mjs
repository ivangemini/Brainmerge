import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const OUTPUT = new URL('../runtime-artifacts/', import.meta.url);
const PORT = 4181;
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

async function assertHealthy(page, label) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src')),
    nodeCount: document.querySelectorAll('.campaign-node').length,
    shellOpen: document.querySelector('.campaign-shell')?.classList.contains('is-open') ?? false,
    bossWidth: document.querySelector('.campaign-boss')?.naturalWidth ?? 0,
    background: getComputedStyle(document.querySelector('.campaign-scene')).backgroundImage
  }));
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
  assert(result.brokenImages.length === 0, `${label}: broken images: ${result.brokenImages.join(', ')}`);
  assert(result.nodeCount === 8, `${label}: expected 8 campaign nodes, got ${result.nodeCount}`);
  assert(result.shellOpen, `${label}: campaign shell is not open`);
  assert(result.bossWidth > 0, `${label}: boss art failed to load`);
  assert(result.background.includes('campaign-world-'), `${label}: campaign background is missing`);
}

await mkdir(OUTPUT, { recursive: true });
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, touch: false },
    { name: 'mobile', width: 390, height: 844, touch: true }
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${PORT}/?platform=local`, { waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
    await page.locator('.campaign-entry').waitFor({ state: 'visible' });
    await page.locator('.campaign-entry').click();
    await page.locator('.campaign-shell.is-open').waitFor({ state: 'visible' });
    await page.waitForTimeout(120);
    assert(pageErrors.length === 0, `${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    await assertHealthy(page, `${viewport.name}-world1`);
    await page.screenshot({ path: new URL(`campaign-world1-${viewport.name}.png`, OUTPUT).pathname, fullPage: true });

    await page.locator('.campaign-world-tab[data-world="2"]').click();
    await page.waitForFunction(() => document.querySelector('.campaign-scene')?.dataset.world === '2');
    await page.waitForTimeout(100);
    await assertHealthy(page, `${viewport.name}-world2`);
    await page.screenshot({ path: new URL(`campaign-world2-${viewport.name}.png`, OUTPUT).pathname, fullPage: true });

    await page.keyboard.press('Escape');
    assert(!(await page.locator('.campaign-shell').evaluate((node) => node.classList.contains('is-open'))), `${viewport.name}: Escape did not close Campaign`);
    await context.close();
  }
  console.log('Campaign shell smoke passed.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
