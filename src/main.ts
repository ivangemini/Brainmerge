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

const view = new GameView(root, {
  spawn: () => update(spawnUnit(state)),
  rewardedSpawn: () => { void handleRewardedSpawn(); },
  claimMission: () => update(claimFirstMission(state)),
  rescueDeadlock: () => update(rescueDeadlock(state)),
  select: (index) => {
    if (state.selectedIndex !== null && state.selectedIndex !== index) {
      update(moveOrMerge(state, state.selectedIndex, index).state);
      return;
    }
    update(selectCell(state, state.selectedIndex === index ? null : index), false);
  },
  moveOrMerge: (from, to) => update(moveOrMerge(state, from, to).state),
  setLocale: async (nextLocale) => {
    await loadLocale(nextLocale);
    locale = nextLocale;
    document.documentElement.lang = nextLocale;
    render();
  }
});

function render(): void {
  view.render(state, locale, (key, params) => translate(locale, key, params), {
    rewardedAds: platform.capabilities.rewardedAds,
    adBusy
  });
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
    update(spawnUnit(state, Math.random, true));
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
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    update(spawnUnit(state));
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
