import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../dist/', import.meta.url).pathname;
const out = new URL('../runtime-artifacts/campaign-assets-diagnostic.png', import.meta.url).pathname;
const port = 4191;
const assets = [
  'public/assets/ui/icon-campaign.webp','public/assets/ui/icon-prestige.webp','public/assets/ui/icon-brain-cell.webp',
  'public/assets/ui/stage-normal.webp','public/assets/ui/stage-challenge.webp','public/assets/ui/stage-elite.webp','public/assets/ui/stage-boss.webp','public/assets/ui/stage-locked.webp',
  'public/assets/campaign/campaign-world-01.webp','public/assets/campaign/campaign-world-02.webp','public/assets/campaign/boss-world-01.webp','public/assets/campaign/boss-world-02.webp'
];
const server = createServer(async (req,res) => {
  try {
    const path = decodeURIComponent((req.url || '/').split('?')[0]);
    if (path === '/') {
      const cards = assets.map(src => `<figure><img src="/${src}"><figcaption>${src.split('/').pop()}</figcaption></figure>`).join('');
      res.writeHead(200, {'content-type':'text/html; charset=utf-8'});
      res.end(`<style>body{margin:0;background:#fff;font:14px Arial;color:#111}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px}figure{margin:0;border:1px solid #bbb;padding:6px}img{display:block;width:100%;height:185px;object-fit:contain;background:#eee}figcaption{margin-top:5px;word-break:break-all}</style><div class="grid">${cards}</div>`);
      return;
    }
    const body = await readFile(join(root, path.replace(/^\//,'')));
    res.writeHead(200, {'content-type':'image/webp','cache-control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(port,'127.0.0.1',r));
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(`http://127.0.0.1:${port}/`, {waitUntil:'networkidle'});
  await page.screenshot({path:out,fullPage:true});
} finally { await browser.close(); await new Promise(r => server.close(r)); }
