import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, runtime] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/mobile-sheets.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/mobile-sheets.js', import.meta.url), 'utf8')
]);

test('mobile sheet layer loads after visual/game-feel CSS but before accessibility', () => {
  const visual = html.indexOf('./public/visual-finish.css');
  const advanced = html.indexOf('./public/game-feel-advanced.css');
  const sheets = html.indexOf('./public/mobile-sheets.css');
  const accessibility = html.indexOf('./public/accessibility.css');
  assert.ok(sheets > visual);
  assert.ok(sheets > advanced);
  assert.ok(accessibility > sheets);
  assert.match(html, /<script type="module" src="\.\/public\/mobile-sheets\.js"><\/script>/);
});

test('phone keeps Mission Collection and Brain Lab out of document flow while retaining desktop cards', () => {
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /position:fixed!important/);
  assert.match(css, /\.right-rail\{display:contents!important\}/);
  assert.match(css, /\.mobile-dock\{[\s\S]*position:fixed/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /mobile-panel-missions/);
  assert.match(css, /mobile-panel-collection/);
  assert.match(css, /mobile-panel-lab/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('mobile controller reflects existing localized DOM instead of owning game state', () => {
  assert.match(runtime, /\.side-card__eyebrow/);
  assert.match(runtime, /\.collection-count/);
  assert.match(runtime, /\.upgrade-card\.is-affordable/);
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /panel\.inert = mobile && !open/);
  assert.match(runtime, /aria-hidden/);
  assert.match(runtime, /aria-expanded/);
  assert.doesNotMatch(runtime, /coins\s*=|merges\s*=|maxDiscoveredTier\s*=/);
});
