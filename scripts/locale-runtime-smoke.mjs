import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const APP_URL = 'http://127.0.0.1:4177/?platform=local';
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

async function inspectRu(page, label) {
  await page.locator('[data-locale="ru"]').click({ force: true });
  await page.waitForFunction(() => document.documentElement.lang === 'ru');
  const result = await page.evaluate(() => {
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const critical = [...document.querySelectorAll('.side-card h2,.side-card p,.side-card__eyebrow,.spawn-button,.upgrade-card button,.collection-count,.hud-pill')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { cls: element.className, text: element.textContent?.trim() ?? '', left: rect.left, right: rect.right, width: rect.width };
      });
    const sideCards = [...document.querySelectorAll('.side-card')].filter(visible).map((card) => {
      const eyebrow = card.querySelector('.side-card__eyebrow');
      const heading = card.querySelector('h2');
      if (!(eyebrow instanceof HTMLElement) || !(heading instanceof HTMLElement)) return null;
      const a = eyebrow.getBoundingClientRect();
      const h = heading.getBoundingClientRect();
      return { eyebrowBottom: a.bottom, headingTop: h.top, className: card.className };
    }).filter(Boolean);
    return {
      lang: document.documentElement.lang,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      cells: document.querySelectorAll('[data-cell]').length,
      cyrillic: /[А-Яа-яЁё]/.test(document.body.innerText),
      emptyCritical: critical.filter((item) => item.text.length === 0),
      outsideViewport: critical.filter((item) => item.left < -1 || item.right > window.innerWidth + 1),
      sideCards
    };
  });
  assert(result.lang === 'ru', `${label}: UI did not switch to RU`);
  assert(result.cyrillic, `${label}: RU locale contains no Cyrillic player-facing copy`);
  assert(result.cells === 30, `${label}: locale switch changed board cell count`);
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: RU introduced horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
  assert(result.emptyCritical.length === 0, `${label}: empty critical labels after RU switch`);
  assert(result.outsideViewport.length === 0, `${label}: critical RU UI extends outside viewport: ${JSON.stringify(result.outsideViewport.slice(0, 3))}`);
  for (const card of result.sideCards) {
    assert(card.headingTop >= card.eyebrowBottom + 4, `${label}: ${card.className} eyebrow overlaps its heading (${card.eyebrowBottom} > ${card.headingTop})`);
  }
}

await new Promise((resolve) => server.listen(4177, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [
    { label: 'desktop RU', width: 1440, height: 900, touch: false },
    { label: 'phone RU', width: 390, height: 844, touch: true }
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });
    await inspectRu(page, viewport.label);
    assert(errors.length === 0, `${viewport.label}: page errors: ${errors.join(' | ')}`);
    await context.close();
  }
  console.log('Packaged RU runtime smoke OK: locale switch + critical copy + panel clearance + no overflow');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
