import type { Locale } from '../i18n/i18n.js';
import type { GameState } from '../core/types.js';

export interface PlatformCapabilities {
  ads: boolean;
  rewardedAds: boolean;
  cloudSave: boolean;
  leaderboards: boolean;
  payments: boolean;
}

export interface PlatformAdapter {
  readonly id: string;
  readonly capabilities: PlatformCapabilities;
  initialize(): Promise<void>;
  preferredLocale(): Locale | null;
  loadState(): Promise<unknown>;
  saveState(state: GameState): Promise<void>;
  showInterstitial(reason: string): Promise<boolean>;
  showRewarded(reason: string): Promise<boolean>;
  setGameplayActive(active: boolean): void;
}
