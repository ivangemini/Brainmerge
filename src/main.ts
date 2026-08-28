import {
  claimFirstMission,
  createInitialState,
  isBoardFull,
  moveOrMerge,
  rescueDeadlock,
  sanitizeState,
  selectCell,
  spawnUnit
} from './core/game.js';
import type { GameState } from './core/types.js';
import { AudioFeedback } from './feedback/audio-feedback.js';
import { detectLocale, loadLocale, translate, type Locale } from './i18n/i18n.js';
import type { PlatformAdapter } from './platform/adapter.js';
import { createPlatformAdapter } from './platform/factory.js';
import { LocalPlatformAdapter } from './platform/local.js';
import { GameView } from './ui/game-view.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

let platform: PlatformAdapter = new LocalPlatformAdapter();
let locale: Locale = detectLocale();
let state: GameState = createInitialState();
let adBusy = false;
const feedback = new AudioFeedback();

function cellElement(index: number): Element | null {
  return root.querySelector(`[data-cell="${index}"]`);
}

const view = new GameView(root, {
  spawn: () => {
    const next = spawnUnit(state);
    if (next !== state && next.coins !== state.coins) feedback.trigger('spawn');
    update(next);
  },
  rewardedSpawn: () => { void handleRewardedSpawn(); },
  claimMission: () => {
    const next = claimFirstMission(state);
    if (!state.missionClaimed && next.missionClaimed) feedback.trigger('reward');
    update(next);
  },
  rescueDeadlock: () => {
    const next = rescueDeadlock(state);
    if (next !== state && next.cells.some((cell, index) => cell !== state.cells[index])) feedback.trigger('rescue');
    update(next);
  },
  select: (index) => {
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
    const result = moveOrMerge(state, from, to);
    update(result.state);
    if (result.merged) feedback.trigger('merge', cellElement(to));
  },
  setLocale: async (nextLocale) => {
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
  if (adBusy || isBoardFull(state) || !platform.capabilities.rewardedAds) return;
  adBusy = true;
  render();
  const rewarded = await platform.showRewarded('brain-box');
  adBusy = false;
  if (rewarded) {
    const next = spawnUnit(state, Math.random, true);
    update(next);
    feedback.trigger('reward');
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

  const saved = sanitizeState(await platform.loadState());
  if (saved) state = saved;
  render();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') update(selectCell(state, null), false);
  if (event.key.toLowerCase() === 'm' && event.target === document.body) feedback.toggleMute();
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    const next = spawnUnit(state);
    if (next !== state && next.coins !== state.coins) feedback.trigger('spawn');
    update(next);
  }
});

document.addEventListener('visibilitychange', () => {
  platform.setGameplayActive(!document.hidden);
});

window.addEventListener('pagehide', () => {
  platform.setGameplayActive(false);
  void platform.saveState(state);
});

void boot();
