import type { Locale } from '../i18n/i18n.js';
import type { GameState } from '../core/types.js';
import type { PlatformAdapter } from './adapter.js';

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

  async initialize(): Promise<void> {}

  preferredLocale(): Locale | null {
    return null;
  }

  async loadState(): Promise<unknown> {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async saveState(state: GameState): Promise<void> {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  async showInterstitial(_reason: string): Promise<boolean> {
    return false;
  }

  async showRewarded(_reason: string): Promise<boolean> {
    return false;
  }
}
