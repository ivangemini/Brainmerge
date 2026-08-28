import { createInitialState, moveOrMerge, sanitizeState, selectCell, spawnUnit } from './core/game.js';
import type { GameState } from './core/types.js';
import { detectLocale, loadLocale, translate, type Locale } from './i18n/i18n.js';
import { LocalPlatformAdapter } from './platform/local.js';
import { GameView } from './ui/game-view.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

const platform = new LocalPlatformAdapter();
let locale: Locale = detectLocale();
let state: GameState = createInitialState();

const view = new GameView(root, {
  spawn: () => update(spawnUnit(state)),
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
    render();
  }
});

function render(): void {
  view.render(state, locale, (key, params) => translate(locale, key, params));
}

function update(next: GameState, persist = true): void {
  state = next;
  render();
  if (persist) void platform.saveState(state);
}

async function boot(): Promise<void> {
  await platform.initialize();
  locale = platform.preferredLocale() ?? detectLocale();
  await Promise.all([loadLocale('en'), loadLocale('ru'), loadLocale(locale)]);
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

void boot();
