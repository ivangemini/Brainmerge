import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, upgradeArt, chainPolish, economyLoop, mobileRuntime, visualFinish, gameView, main] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/upgrade-art.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/chain-polish.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/economy-loop.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/mobile-runtime.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/visual-finish.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/ui/game-view.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.ts', import.meta.url), 'utf8')
]);

test('responsive composition loads after art presentation layers', () => {
  const upgradeIndex = html.indexOf('./public/upgrade-art.css');
  const mobileIndex = html.indexOf('./public/mobile-runtime.css');
  const finishIndex = html.indexOf('./public/visual-finish.css');
  const accessibilityIndex = html.indexOf('./public/accessibility.css');
  assert.ok(upgradeIndex >= 0, 'upgrade-art.css must be loaded');
  assert.ok(mobileIndex > upgradeIndex, 'mobile-runtime.css must own composition after upgrade art');
  assert.ok(finishIndex > mobileIndex, 'visual-finish.css may refine appearance only after responsive composition is established');
  assert.ok(accessibilityIndex > finishIndex, 'accessibility remains the final interaction layer');
});

test('upgrade art remains presentation-only', () => {
  assert.doesNotMatch(upgradeArt, /\.side-card--mission/);
  assert.doesNotMatch(upgradeArt, /\.right-rail/);
  assert.doesNotMatch(upgradeArt, /grid-template-columns/);
  assert.match(upgradeArt, /button\[data-upgrade='boxBaseTier'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='luckyDrop'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='income'\]/);
  assert.match(upgradeArt, /button\[data-upgrade='offline'\]/);
});

test('visual finish cannot re-own responsive panel ordering or visibility', () => {
  assert.doesNotMatch(visualFinish, /\border\s*:/);
  assert.doesNotMatch(visualFinish, /\bgrid-row\s*:/);
  assert.doesNotMatch(visualFinish, /display\s*:\s*none/);
  assert.doesNotMatch(visualFinish, /position\s*:\s*fixed/);
  assert.match(visualFinish, /\.board-frame/);
  assert.match(visualFinish, /\.side-card/);
  assert.match(visualFinish, /\.upgrade-card/);
});

test('responsive runtime keeps all production panels reachable without legacy row or height stretching', () => {
  assert.match(mobileRuntime, /\.side-card--mission[\s\S]*display:block!important/);
  assert.match(mobileRuntime, /\.right-rail[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobileRuntime, /grid-auto-rows:max-content!important/);
  assert.match(mobileRuntime, /align-items:start!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card[\s\S]*grid-row:auto!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card[\s\S]*height:auto!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card[\s\S]*align-self:start!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card--lab\{order:1!important/);
  assert.match(mobileRuntime, /\.right-rail \.side-card--collection\{order:2!important/);
});

test('economy layer does not re-own responsive page composition', () => {
  assert.doesNotMatch(economyLoop, /\.right-rail\{width:min\(720px/);
  assert.doesNotMatch(economyLoop, /\.right-rail\{width:100%/);
  assert.doesNotMatch(economyLoop, /\.side-card--lab\{width:min\(330px/);
  assert.match(economyLoop, /\.unit-income[\s\S]*font-size:8px/);
  assert.match(economyLoop, /white-space:nowrap/);
});

test('shared board sprites use an absolute atlas slot while Toilet Buddy keeps standalone art', () => {
  assert.match(chainPolish, /\.cell:not\(\[data-family='toilet-buddy'\]\) \.unit-visual::before/);
  assert.match(chainPolish, /position:absolute!important/);
  assert.match(chainPolish, /inset:0!important/);
  assert.match(chainPolish, /\.cell\[data-family='toilet-buddy'\] \.unit-visual::before\{display:none!important\}/);
  assert.match(chainPolish, /\.cell\[data-family='toilet-buddy'\] \.unit-art[\s\S]*opacity:1!important/);
});

test('named discovery toast suppresses duplicate generic discovery feedback without collapsing header geometry', () => {
  assert.match(gameView, /class="discovery-toast"/);
  assert.match(chainPolish, /\.has-new-discovery \.board-header \.message\{visibility:hidden\}/);
});

test('Brain Lab state and actions stay code-owned', () => {
  assert.match(gameView, /UPGRADE_DEFINITIONS\.map/);
  assert.match(gameView, /canPurchaseUpgrade\(state, id\)/);
  assert.match(gameView, /upgradeRequiredDiscoveryTier\(id, currentLevel\)/);
  assert.match(gameView, /data-upgrade="\$\{id\}"/);
  assert.match(gameView, /purchaseUpgrade\(button\.dataset\.upgrade as UpgradeId\)/);
});

test('keyboard board controls reuse gameplay actions without hidden spending shortcut', () => {
  assert.match(main, /function activateCell\(index: number\)/);
  assert.match(main, /restoreKeyboardFocus/);
  assert.match(main, /cellElement\(index\)\?\.focus\(\)/);
  assert.match(main, /root\.addEventListener\('keydown'/);
  assert.match(main, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(main, /ArrowLeft/);
  assert.match(main, /ArrowRight/);
  assert.match(main, /ArrowUp/);
  assert.match(main, /ArrowDown/);
  assert.doesNotMatch(main, /event\.code === 'Space'/, 'global Space must not buy a paid Brain Box');
});
