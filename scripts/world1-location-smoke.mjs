import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { createInitialState } from '../build/core/game.js';

const ROOT=new URL('../dist/',import.meta.url),OUT=new URL('../runtime-artifacts/',import.meta.url),PORT=4183,ORIGIN=`http://127.0.0.1:${PORT}`,SAVE='brainmerge.save.v1';
const mime=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.json','application/json; charset=utf-8'],['.webp','image/webp'],['.png','image/png']]);
const assert=(x,m)=>{if(!x)throw new Error(m)};
function safePath(url){const clean=decodeURIComponent((url??'/').split('?')[0]).replace(/^\/+/, '')||'index.html',n=normalize(clean);if(n.startsWith('..'))throw new Error('unsafe');return join(ROOT.pathname,n)}
const server=createServer(async(req,res)=>{try{let p=safePath(req.url);try{const s=await stat(p);if(s.isDirectory())p=join(p,'index.html')}catch{if(!extname(p))p=join(ROOT.pathname,'index.html')}const body=await readFile(p);res.writeHead(200,{'content-type':mime.get(extname(p))??'application/octet-stream','cache-control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}});
function seed(){const s=createInitialState(Date.now());s.maxDiscoveredTier=5;Object.assign(s.campaign.worlds['1'].locations['w1-sneaker-garden'],{stabilize:1,deliver:1,restore:1,mastery:0});return s}
await mkdir(OUT,{recursive:true});await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await context.addInitScript(({origin,key,value})=>{if(location.origin===origin&&localStorage.getItem(key)===null)localStorage.setItem(key,value)},{origin:ORIGIN,key:SAVE,value:JSON.stringify(seed())});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${ORIGIN}/?platform=local`,{waitUntil:'networkidle'});await page.locator('.board-tray .cell').first().waitFor({state:'visible'});const mainBefore=await page.locator('.board-tray .cell.is-occupied').count();
  await page.locator('.campaign-entry').click();await page.locator('.campaign-shell.is-open').waitFor({state:'visible'});
  const toilet=page.locator('.campaign-node--location[data-location-id="w1-toilet-pond"]'),watermelon=page.locator('.campaign-node--location[data-location-id="w1-watermelon-grill"]');
  await page.waitForFunction(()=>document.querySelector('.campaign-node--location[data-location-id="w1-toilet-pond"]')?.dataset.routeUnlocked==='true');
  assert(!(await toilet.getAttribute('class')).includes('is-locked'),'Toilet Pond should unlock after Sneaker Garden Landmark restore');
  assert((await watermelon.getAttribute('class')).includes('is-locked'),'Watermelon Grill should remain locked before Toilet Pond Landmark restore');
  assert(await watermelon.getAttribute('aria-disabled')==='true','locked World 1 location must be noninteractive');
  assert(await watermelon.getAttribute('data-route-unlocked')==='false','locked World 1 location must expose locked route state');
  await toilet.click();await page.locator('.campaign-detail.is-open').waitFor({state:'visible'});await page.locator('.campaign-detail__run-button').waitFor({state:'visible'});assert((await page.locator('.campaign-detail__title').textContent())?.trim()==='Toilet Pond','Toilet Pond detail title mismatch');
  await page.locator('.campaign-detail__run-button').click();await page.locator('.campaign-run-shell.is-open').waitFor({state:'visible'});assert(await page.locator('.campaign-run-shell[data-location="w1-toilet-pond"]').count()===1,'run shell did not bind to Toilet Pond');assert(await page.locator('.campaign-run-cell').count()===30,'Toilet Pond must use 6x5 Campaign board');assert(await page.locator('.campaign-run-cell.is-overgrown').count()===7,'Toilet Pond Stabilize should start with seven Overgrowth blockers');assert(await page.locator('.board-tray .cell.is-occupied').count()===mainBefore,'starting Toilet Pond mutated main board');
  await page.locator('.campaign-run-cell[data-run-cell="0"]').click();await page.locator('.campaign-run-cell[data-run-cell="1"]').click();await page.waitForFunction(()=>document.querySelectorAll('.campaign-run-cell.is-overgrown').length===6);
  const saved=await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)??'null');return{locationId:s?.campaignRun?.locationId,phase:s?.campaignRun?.phase,blockers:s?.campaignRun?.overgrowth?.filter(Boolean)?.length,main:s?.cells?.filter(Boolean)?.length}},SAVE);assert(saved.locationId==='w1-toilet-pond'&&saved.phase==='stabilize'&&saved.blockers===6,`Toilet Pond partial run not persisted: ${JSON.stringify(saved)}`);assert(saved.main===mainBefore,'Toilet Pond persistence changed main board');
  await page.locator('.campaign-run-back').click();await page.reload({waitUntil:'networkidle'});await page.locator('.board-tray .cell').first().waitFor({state:'visible'});await page.locator('.campaign-entry').click();await page.locator('.campaign-shell.is-open').waitFor({state:'visible'});await page.locator('.campaign-node--location[data-location-id="w1-toilet-pond"]').click();await page.locator('.campaign-detail__run-button').waitFor({state:'visible'});assert((await page.locator('.campaign-detail__run-button').textContent())?.toLowerCase().includes('resume'),'Toilet Pond should expose Resume after reload');await page.locator('.campaign-detail__run-button').click();await page.locator('.campaign-run-shell.is-open').waitFor({state:'visible'});assert(await page.locator('.campaign-run-cell.is-overgrown').count()===6,'Toilet Pond reload lost Overgrowth state');assert(errors.length===0,`page errors: ${errors.join(' | ')}`);await page.screenshot({path:new URL('campaign-toilet-pond-mobile.png',OUT).pathname,fullPage:true});await context.close();
} finally {await browser.close();await new Promise((r,j)=>server.close(e=>e?j(e):r()))}
console.log('World 1 Toilet Pond smoke passed.');
