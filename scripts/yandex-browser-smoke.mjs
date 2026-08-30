import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../dist/', import.meta.url);
const APP_URL = 'http://127.0.0.1:4176/?platform=yandex';
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

await new Promise((resolve) => server.listen(4176, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1024, height: 576 } });
  await context.addInitScript(() => {
    const probe = {
      init: 0,
      getPlayer: 0,
      getData: 0,
      setData: [],
      ready: [],
      gameplayStart: 0,
      gameplayStop: 0,
      rewarded: 0
    };
    window.__yandexProbe = probe;
    const player = {
      async getData() { probe.getData += 1; return {}; },
      async setData(data, flush = false) { probe.setData.push({ data, flush }); }
    };
    window.YaGames = {
      async init() {
        probe.init += 1;
        return {
          environment: { i18n: { lang: 'ru' } },
          async getPlayer() { probe.getPlayer += 1; return player; },
          async getStorage() { return window.localStorage; },
          adv: {
            showFullscreenAdv({ callbacks } = {}) { queueMicrotask(() => callbacks?.onClose?.(true)); },
            showRewardedVideo({ callbacks } = {}) {
              probe.rewarded += 1;
              queueMicrotask(() => { callbacks?.onRewarded?.(); callbacks?.onClose?.(true); });
            }
          },
          features: {
            LoadingAPI: {
              ready() {
                probe.ready.push({ cells: document.querySelectorAll('[data-cell]').length, lang: document.documentElement.lang });
              }
            },
            GameplayAPI: {
              start() { probe.gameplayStart += 1; },
              stop() { probe.gameplayStop += 1; }
            }
          }
        };
      }
    };
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.locator('.board-tray .cell').first().waitFor({ state: 'visible' });

  const bootProbe = await page.evaluate(() => window.__yandexProbe);
  assert(errors.length === 0, `Yandex boot page errors: ${errors.join(' | ')}`);
  assert(bootProbe.init === 1, `Yandex SDK init must run exactly once, got ${bootProbe.init}`);
  assert(bootProbe.getPlayer === 1 && bootProbe.getData === 1, 'Yandex player/cloud load path must run during packaged boot');
  assert(bootProbe.ready.length === 1, `LoadingAPI.ready must run exactly once, got ${bootProbe.ready.length}`);
  assert(bootProbe.ready[0].cells === 30, `LoadingAPI.ready fired before interactive board render: ${JSON.stringify(bootProbe.ready[0])}`);
  assert(bootProbe.ready[0].lang === 'ru', `Yandex preferred locale must be applied before Game Ready, got ${bootProbe.ready[0].lang}`);
  assert(bootProbe.gameplayStart === 1, `GameplayAPI.start must follow Game Ready exactly once at boot, got ${bootProbe.gameplayStart}`);
  assert(await page.locator('[data-action="rewarded-spawn"]').count() === 1, 'real Yandex adapter capabilities must expose rewarded Brain Box');

  const beforeOccupied = await page.locator('.cell.is-occupied').count();
  await page.locator('[data-action="rewarded-spawn"]').click({ force: true });
  await page.waitForFunction((count) => document.querySelectorAll('.cell.is-occupied').length > count, beforeOccupied);
  const rewardProbe = await page.evaluate(() => window.__yandexProbe);
  assert(rewardProbe.rewarded === 1, `rewarded SDK path must be invoked once, got ${rewardProbe.rewarded}`);
  assert(rewardProbe.gameplayStop >= 1, 'rewarded ad must stop GameplayAPI before ad presentation');
  assert(rewardProbe.gameplayStart >= 2, 'rewarded ad close must resume GameplayAPI');

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await page.waitForFunction(() => window.__yandexProbe.setData.some((entry) => entry.flush === true));
  const finalProbe = await page.evaluate(() => window.__yandexProbe);
  const flushed = finalProbe.setData.find((entry) => entry.flush === true);
  assert(flushed?.data?.brainmerge?.version === 5, 'pagehide must flush canonical save v5 through real Yandex player.setData');
  assert(errors.length === 0, `Yandex runtime page errors: ${errors.join(' | ')}`);

  await context.close();
  console.log('Packaged Yandex browser smoke OK: init + locale + Game Ready + Gameplay + rewarded + cloud flush');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
