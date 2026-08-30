import { BOARD_COLUMNS } from './core/catalog.js';
import {
  accrueOfflineIncome,
  accrueOnlineIncome,
  claimCurrentMission,
  claimOfflineIncome,
  createInitialState,
  isBoardFull,
  moveOrMerge,
  purchaseUpgrade,
  rescueDeadlock,
  sanitizeState,
  selectCell,
  spawnUnit
} from './core/game.js';
import type { GameState, UpgradeId } from './core/types.js';
import { AudioFeedback } from './feedback/audio-feedback.js';
import { runCoinTrail, runDiscoveryCelebration, runUnitFlight } from './feedback/visual-effects.js';
import { detectLocale, loadLocale, translate, type Locale } from './i18n/i18n.js';
import type { PlatformAdapter } from './platform/adapter.js';
import { createPlatformAdapter } from './platform/factory.js';
import { LocalPlatformAdapter } from './platform/local.js';
import { GameView } from './ui/game-view.js';

const rootCandidate = document.querySelector<HTMLElement>('#app');
if (!rootCandidate) throw new Error('Missing #app root');
const root: HTMLElement = rootCandidate;

const INCOME_TICK_MS = 5_000;
const AUTOSAVE_MS = 30_000;
const OFFLINE_REWARD_MIN_MS = 60_000;

let platform: PlatformAdapter = new LocalPlatformAdapter();
let locale: Locale = detectLocale();
let state: GameState = createInitialState();
let adBusy = false;
const feedback = new AudioFeedback();

function cellElement(index: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-cell="${index}"]`);
}

function motionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function elementCenter(element: Element | null): { x: number; y: number } | null {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function transientClass(element: Element | null, className: string, duration = 700): void {
  if (!(element instanceof HTMLElement)) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function burstAtCell(index: number, particleCount = 12): void {
  if (!motionAllowed()) return;
  const cell = cellElement(index);
  const zone = root.querySelector<HTMLElement>('.board-zone');
  if (!cell || !zone) return;
  const cellRect = cell.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const burst = document.createElement('span');
  burst.className = 'fx-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.left = `${cellRect.left - zoneRect.left + cellRect.width / 2}px`;
  burst.style.top = `${cellRect.top - zoneRect.top + cellRect.height / 2}px`;
  burst.innerHTML = `<i class="fx-burst__ring"></i>${Array.from({ length: particleCount }, (_, i) => `<i class="fx-particle" style="--r:${Math.round(i * 360 / particleCount)}deg;--distance:${28 + (i % 4) * 7}px"></i>`).join('')}`;
  zone.appendChild(burst);
  window.setTimeout(() => burst.remove(), 700);
}

function floatValueAt(point: { x: number; y: number } | null, text: string): void {
  if (!point || !motionAllowed()) return;
  const value = document.createElement('span');
  value.className = 'fx-float-value';
  value.setAttribute('aria-hidden', 'true');
  value.textContent = text;
  value.style.left = `${point.x}px`;
  value.style.top = `${point.y}px`;
  document.body.appendChild(value);
  window.setTimeout(() => value.remove(), 900);
}

function insertedCellIndex(before: GameState, after: GameState): number | null {
  for (let index = 0; index < after.cells.length; index += 1) {
    if (!before.cells[index] && after.cells[index]) return index;
  }
  return null;
}

function changedCellIndexes(before: GameState, after: GameState): number[] {
  const changed: number[] = [];
  for (let index = 0; index < after.cells.length; index += 1) {
    const a = before.cells[index];
    const b = after.cells[index];
    if (a?.id !== b?.id || a?.familyId !== b?.familyId || a?.tier !== b?.tier) changed.push(index);
  }
  return changed;
}

function runSpawnFx(index: number | null): void {
  transientClass(root.querySelector('.spawn-dock'), 'fx-spawn-dock', 560);
  if (index === null) return;
  transientClass(cellElement(index), 'fx-spawn', 660);
  burstAtCell(index, 9);
}

function runMergeFx(index: number, reward: number, discoveredTier: number | null): void {
  const cell = cellElement(index);
  transientClass(cell, 'fx-merge-result', discoveredTier ? 900 : 720);
  burstAtCell(index, discoveredTier && discoveredTier >= 8 ? 24 : state.maxDiscoveredTier >= 7 ? 18 : 14);
  transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
  if (reward > 0) runCoinTrail(elementCenter(cell), root.querySelector('.hud-pill--coin'), reward);
  if (discoveredTier) {
    runDiscoveryCelebration(cell, discoveredTier);
    if (discoveredTier >= 8) {
      window.setTimeout(() => burstAtCell(index, 26), 180);
      window.setTimeout(() => burstAtCell(index, 20), 390);
    }
  }
}

function runRewardFx(selector: string, reward: number, anchor: { x: number; y: number } | null): void {
  transientClass(root.querySelector(selector), 'fx-reward', 660);
  transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
  if (reward > 0) {
    floatValueAt(anchor, `+${reward}`);
    runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
  }
}

function settleOnline(now = Date.now()): void {
  state = accrueOnlineIncome(state, now);
}

function accrueReturnIncome(current: GameState, now = Date.now()): GameState {
  const elapsedMs = Math.max(0, now - current.lastAccrualAt);
  return elapsedMs >= OFFLINE_REWARD_MIN_MS
    ? accrueOfflineIncome(current, now)
    : accrueOnlineIncome(current, now);
}

function activateCell(index: number): void {
  const restoreKeyboardFocus = document.activeElement instanceof HTMLElement && document.activeElement.matches('[data-cell]');
  settleOnline();
  if (state.selectedIndex !== null && state.selectedIndex !== index) {
    const from = state.selectedIndex;
    const sourceElement = cellElement(from);
    const targetElement = cellElement(index);
    const before = state;
    const beforeTier = state.maxDiscoveredTier;
    const result = moveOrMerge(state, from, index);
    if (result.merged) runUnitFlight(sourceElement, targetElement, true);
    update(result.state);
    if (result.merged) {
      const reward = Math.max(0, result.state.coins - before.coins);
      const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
      feedback.trigger('merge', cellElement(index));
      runMergeFx(index, reward, discoveredTier);
    }
    if (restoreKeyboardFocus) cellElement(index)?.focus();
    return;
  }
  update(selectCell(state, state.selectedIndex === index ? null : index), false);
  if (restoreKeyboardFocus) cellElement(index)?.focus();
}

const view = new GameView(root, {
  spawn: () => {
    settleOnline();
    const before = state;
    const beforePaidBoxes = state.paidBoxes;
    const next = spawnUnit(state);
    if (next.paidBoxes > beforePaidBoxes) feedback.trigger('spawn');
    update(next);
    if (next.spawns > before.spawns) runSpawnFx(insertedCellIndex(before, next));
  },
  rewardedSpawn: () => { void handleRewardedSpawn(); },
  claimMission: () => {
    settleOnline();
    const anchor = elementCenter(root.querySelector('[data-action="claim-mission"]'));
    const before = state;
    const beforeIndex = state.missionIndex;
    const next = claimCurrentMission(state);
    if (next.missionIndex > beforeIndex) feedback.trigger('reward');
    update(next);
    if (next.missionIndex > beforeIndex) runRewardFx('.side-card--mission', Math.max(0, next.coins - before.coins), anchor);
  },
  claimOffline: () => {
    settleOnline();
    const anchor = elementCenter(root.querySelector('[data-action="claim-offline"]'));
    const before = state;
    const hadReward = state.pendingOfflineCoins > 0;
    const next = claimOfflineIncome(state);
    if (hadReward && next.pendingOfflineCoins === 0) feedback.trigger('reward');
    update(next);
    if (hadReward && next.pendingOfflineCoins === 0) {
      const reward = Math.max(0, next.coins - before.coins);
      transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
      floatValueAt(anchor, `+${reward}`);
      runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
    }
  },
  purchaseUpgrade: (id: UpgradeId) => {
    settleOnline();
    const beforeLevel = state.upgrades[id];
    const next = purchaseUpgrade(state, id);
    if (next.upgrades[id] > beforeLevel) feedback.trigger('reward');
    update(next);
    if (next.upgrades[id] > beforeLevel) {
      const button = root.querySelector(`[data-upgrade="${id}"]`);
      transientClass(button?.closest('.upgrade-card') ?? button, 'fx-upgrade', 680);
      const card = button?.closest('.upgrade-card') ?? button;
      const center = elementCenter(card);
      if (center && card instanceof HTMLElement) {
        const zone = root.querySelector<HTMLElement>('.board-zone');
        const zoneRect = zone?.getBoundingClientRect();
        if (zone && zoneRect) {
          const rect = card.getBoundingClientRect();
          const burst = document.createElement('span');
          burst.className = 'fx-burst';
          burst.setAttribute('aria-hidden', 'true');
          burst.style.left = `${rect.left - zoneRect.left + rect.width / 2}px`;
          burst.style.top = `${rect.top - zoneRect.top + Math.min(58, rect.height / 2)}px`;
          burst.innerHTML = '<i class="fx-burst__ring"></i>';
          zone.appendChild(burst);
          window.setTimeout(() => burst.remove(), 650);
        }
      }
    }
  },
  rescueDeadlock: () => {
    settleOnline();
    const before = state;
    const next = rescueDeadlock(state);
    const changed = changedCellIndexes(before, next);
    if (next !== state && changed.length > 0) feedback.trigger('rescue');
    update(next);
    for (const index of changed.slice(0, 8)) transientClass(cellElement(index), 'fx-rescue', 560);
  },
  select: (index) => activateCell(index),
  moveOrMerge: (from, to) => {
    settleOnline();
    const sourceElement = cellElement(from);
    const targetElement = cellElement(to);
    const before = state;
    const beforeTier = state.maxDiscoveredTier;
    const result = moveOrMerge(state, from, to);
    if (result.merged) runUnitFlight(sourceElement, targetElement, true);
    update(result.state);
    if (result.merged) {
      const reward = Math.max(0, result.state.coins - before.coins);
      const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
      feedback.trigger('merge', cellElement(to));
      runMergeFx(to, reward, discoveredTier);
    }
  },
  setLocale: async (nextLocale) => {
    settleOnline();
    await loadLocale(nextLocale);
    locale = nextLocale;
    document.documentElement.lang = nextLocale;
    render();
  }
});

function render(): void {
  const t = (key: string, params?: Record<string, string | number>) => translate(locale, key, params);
  view.render(state, locale, t, {
    rewardedAds: platform.capabilities.rewardedAds,
    adBusy
  });
  feedback.setLabels(t('audio.mute'), t('audio.unmute'));
}

function update(next: GameState, persist = true): void {
  state = next;
  render();
  if (persist) void platform.saveState(state);
}

async function handleRewardedSpawn(): Promise<void> {
  settleOnline();
  if (adBusy || isBoardFull(state) || !platform.capabilities.rewardedAds) return;
  adBusy = true;
  render();
  const rewarded = await platform.showRewarded('brain-box');
  adBusy = false;
  settleOnline();
  if (rewarded) {
    const before = state;
    const beforeSpawns = state.spawns;
    const next = spawnUnit(state, Math.random, true);
    update(next);
    if (next.spawns > beforeSpawns) {
      feedback.trigger('reward');
      runSpawnFx(insertedCellIndex(before, next));
    }
    return;
  }
  state = { ...state, messageKey: 'message.rewardUnavailable' };
  render();
}

async function boot(): Promise<void> {
  platform = await createPlatformAdapter();
  try {
    await platform.initialize();
  } catch {
    platform = new LocalPlatformAdapter();
    await platform.initialize();
  }

  locale = platform.preferredLocale() ?? detectLocale();
  await Promise.all([loadLocale('en'), loadLocale('ru'), loadLocale(locale)]);
  document.documentElement.lang = locale;

  const now = Date.now();
  const saved = sanitizeState(await platform.loadState(), now);
  if (saved) state = accrueReturnIncome(saved, now);
  else state = createInitialState(now);
  render();
  // Platform Game Ready must be emitted only after locale/save restoration and the
  // first complete interactive render. Yandex moderation explicitly checks this timing.
  await platform.gameReady();
  void platform.saveState(state);
}

window.setInterval(() => {
  if (document.hidden) return;
  const next = accrueOnlineIncome(state, Date.now());
  if (next.coins !== state.coins || next.incomeRemainder !== state.incomeRemainder) {
    state = next;
    render();
  } else {
    state = next;
  }
}, INCOME_TICK_MS);

// Passive-only sessions still receive periodic canonical snapshots. This bounds
// cloud/local data loss without writing on every 5-second income presentation tick.
window.setInterval(() => {
  if (document.hidden) return;
  settleOnline();
  void platform.saveState(state);
}, AUTOSAVE_MS);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    settleOnline();
    update(selectCell(state, null), false);
  }
  if (event.key.toLowerCase() === 'm' && event.target === document.body) feedback.toggleMute();
});

// Board buttons are fully keyboard-operable. Enter/Space follows the exact same
// select/move/merge path as pointer input; arrow keys only move focus and never spend currency.
root.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null;
  if (!target) return;
  const index = Number(target.dataset.cell);
  if (!Number.isInteger(index) || index < 0 || index >= state.cells.length) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activateCell(index);
    return;
  }

  let nextIndex: number | null = null;
  if (event.key === 'ArrowLeft' && index % BOARD_COLUMNS > 0) nextIndex = index - 1;
  if (event.key === 'ArrowRight' && index % BOARD_COLUMNS < BOARD_COLUMNS - 1 && index + 1 < state.cells.length) nextIndex = index + 1;
  if (event.key === 'ArrowUp' && index >= BOARD_COLUMNS) nextIndex = index - BOARD_COLUMNS;
  if (event.key === 'ArrowDown' && index + BOARD_COLUMNS < state.cells.length) nextIndex = index + BOARD_COLUMNS;
  if (nextIndex !== null) {
    event.preventDefault();
    cellElement(nextIndex)?.focus();
  }
});

document.addEventListener('visibilitychange', () => {
  const now = Date.now();
  if (document.hidden) {
    settleOnline(now);
    platform.setGameplayActive(false);
    // Mobile browsers may suspend before pagehide. Flush the latest economy snapshot now.
    void platform.saveState(state, true);
    return;
  }
  state = accrueReturnIncome(state, now);
  platform.setGameplayActive(true);
  render();
  void platform.saveState(state);
});

window.addEventListener('pagehide', () => {
  settleOnline();
  platform.setGameplayActive(false);
  void platform.saveState(state, true);
});

void boot();