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
  /**
   * Persist canonical state. `flush=true` is reserved for lifecycle boundaries
   * such as pagehide where a debounced cloud write may otherwise never run.
   */
  saveState(state: GameState, flush?: boolean): Promise<void>;
  showInterstitial(reason: string): Promise<boolean>;
  showRewarded(reason: string): Promise<boolean>;
  setGameplayActive(active: boolean): void;
}
