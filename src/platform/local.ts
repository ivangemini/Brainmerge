import type { Locale } from '../i18n/i18n.js';
import type { GameState } from '../core/types.js';
import type { PlatformAdapter } from './adapter.js';
import { prepareStateForSave } from '../core/game.js';

const SAVE_KEY = 'brainmerge.save.v1';

export class LocalPlatformAdapter implements PlatformAdapter {
  readonly id = 'local';
  readonly capabilities = {
    ads: false,
    rewardedAds: false,
    cloudSave: false,
    leaderboards: false,
    payments: false
  } as const;
  private persistedRevision = 0;

  async initialize(): Promise<void> {}

  async gameReady(): Promise<void> {}

  preferredLocale(): Locale | null {
    return null;
  }

  async loadState(): Promise<unknown> {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const state = raw ? JSON.parse(raw) as Partial<GameState> : null;
      this.persistedRevision = typeof state?.saveRevision === 'number' && Number.isFinite(state.saveRevision)
        ? Math.max(0, Math.floor(state.saveRevision))
        : 0;
      return state;
    } catch {
      return null;
    }
  }

  async saveState(state: GameState): Promise<void> {
    try {
      const snapshot = prepareStateForSave({ ...state, saveRevision: Math.max(state.saveRevision, this.persistedRevision) });
      this.persistedRevision = snapshot.saveRevision;
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    } catch {
      // Local persistence is best-effort in private/restricted browser contexts.
    }
  }

  async showInterstitial(_reason: string): Promise<boolean> {
    return false;
  }

  async showRewarded(_reason: string): Promise<boolean> {
    return false;
  }

  setGameplayActive(_active: boolean): void {}
}
