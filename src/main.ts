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

let platform: PlatformAdapter = new LocalPlatformAdapter();
let locale: Locale = detectLocale();
let state: GameState = createInitialState();
let adBusy = false;
const feedback = new AudioFeedback();

function cellElement(index: number): Element | null {
  return root.querySelector(`[data-cell="${index}"]`);
}

function settleOnline(now = Date.now()): void {
  state = accrueOnlineIncome(state, now);
}

const view = new GameView(root, {
  spawn: () => {
    settleOnline();
    const beforePaidBoxes = state.paidBoxes;
    const next = spawnUnit(state);
    if (next.paidBoxes > beforePaidBoxes) feedback.trigger('spawn');
    update(next);
  },
  rewardedSpawn: () => { void handleRewardedSpawn(); },
  claimMission: () => {
    settleOnline();
    const beforeIndex = state.missionIndex;
    const next = claimCurrentMission(state);
    if (next.missionIndex > beforeIndex) feedback.trigger('reward');
    update(next);
  },
  claimOffline: () => {
    settleOnline();
    const hadReward = state.pendingOfflineCoins > 0;
    const next = claimOfflineIncome(state);
    if (hadReward && next.pendingOfflineCoins === 0) feedback.trigger('reward');
    update(next);
  },
  purchaseUpgrade: (id: UpgradeId) => {
    settleOnline();
    const beforeLevel = state.upgrades[id];
    const next = purchaseUpgrade(state, id);
    if (next.upgrades[id] > beforeLevel) feedback.trigger('reward');
    update(next);
  },
  rescueDeadlock: () => {
    settleOnline();
    const next = rescueDeadlock(state);
    if (next !== state && next.cells.some((cell, index) => cell !== state.cells[index])) feedback.trigger('rescue');
    update(next);
  },
  select: (index) => {
    settleOnline();
    if (state.selectedIndex !== null && state.selectedIndex !== index) {
      const from = state.selectedIndex;
      const result = moveOrMerge(state, from, index);
      update(result.state);
      if (result.merged) feedback.trigger('merge', cellElement(index));
      return;
    }
    update(selectCell(state, state.selectedIndex === index ? null : index), false);
  },
  moveOrMerge: (from, to) => {
    settleOnline();
    const result = moveOrMerge(state, from, to);
    update(result.state);
    if (result.merged) feedback.trigger('merge', cellElement(to));
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
    const beforeSpawns = state.spawns;
    const next = spawnUnit(state, Math.random, true);
    update(next);
    if (next.spawns > beforeSpawns) feedback.trigger('reward');
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
  if (saved) state = accrueOfflineIncome(saved, now);
  else state = createInitialState(now);
  render();
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
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    settleOnline();
    const beforePaidBoxes = state.paidBoxes;
    const next = spawnUnit(state);
    if (next.paidBoxes > beforePaidBoxes) feedback.trigger('spawn');
    update(next);
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
  state = accrueOfflineIncome(state, now);
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
