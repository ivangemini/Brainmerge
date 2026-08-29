import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, upgradeArt, mobileRuntime, gameView] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/upgrade-art.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/mobile-runtime.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/ui/game-view.ts', import.meta.url), 'utf8')
]);

test('responsive composition loads after art presentation layers', () => {
  const upgradeIndex = html.indexOf('./public/upgrade-art.css');
  const mobileIndex = html.indexOf('./public/mobile-runtime.css');
  const accessibilityIndex = html.indexOf('./public/accessibility.css');
  assert.ok(upgradeIndex >= 0, 'upgrade-art.css must be loaded');
  assert.ok(mobileIndex > upgradeIndex, 'mobile-runtime.css must own composition after upgrade art');
  assert.ok(accessibilityIndex > mobileIndex, 'accessibility remains the final interaction layer');
});

test('upgrade art remains presentation-only', () => {
  assert.doesNotMatch(upgradeArt, /\.side-card--mission\s*,/);
  assert.doesNotMatch(upgradeArt, /\.right-rail\s+\.side-card\s*\{\s*display:/);
  assert.doesNotMatch(upgradeArt, /order\s*:/);
  assert.match(upgradeArt, /button\[data-upgrade='boxBaseTier'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='luckyDrop'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='income'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='offline'\]/);
});

test('responsive runtime keeps all production panels reachable', () => {
  assert.match(mobileRuntime, /\.side-card--mission[\s\S]*display:block!important/);
  assert.match(mobileRuntime, /\.right-rail[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobileRuntime, /\.right-rail \.side-card--lab\{order:1!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card--collection\{order:2!important/);
});

test('Brain Lab state and actions stay code-owned', () => {
  assert.match(gameView, /UPGRADE_DEFINITIONS\.map/);
  assert.match(gameView, /canPurchaseUpgrade\(state, id\)/);
  assert.match(gameView, /upgradeRequiredDiscoveryTier\(id, currentLevel\)/);
  assert.match(gameView, /data-upgrade=\\"\$\{id\}\\"/);
  assert.match(gameView, /purchaseUpgrade\(button\.dataset\.upgrade as UpgradeId\)/);
});
