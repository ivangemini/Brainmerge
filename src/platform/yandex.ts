import type { GameState } from '../core/types.js';
import { localeFromLanguage, type Locale } from '../i18n/i18n.js';
import type { PlatformAdapter } from './adapter.js';
import { SAFE_SAVE_KEY } from './storage-keys.js';

const CLOUD_FIELD = 'brainmerge';
const CLOUD_SAVE_DELAY_MS = 1200;
const AD_WATCHDOG_MS = 30_000;

type AnyRecord = Record<string, unknown>;

interface YandexPlayer {
  getData(keys?: string[]): Promise<AnyRecord>;
  setData(data: AnyRecord, flush?: boolean): Promise<void>;
}

interface YandexStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AdCallbacks {
  callbacks?: {
    onOpen?: () => void;
    onRewarded?: () => void;
    onClose?: (wasShown: boolean) => void;
    onError?: (_error: unknown) => void;
  };
}

interface YandexSdk {
  environment?: { i18n?: { lang?: string } };
  getPlayer(): Promise<YandexPlayer>;
  getStorage?(): Promise<YandexStorage>;
  adv: {
    showFullscreenAdv(options?: AdCallbacks): void;
    showRewardedVideo(options?: AdCallbacks): void;
  };
  features?: {
    LoadingAPI?: { ready(): void | Promise<void> };
    GameplayAPI?: { start(): void | Promise<void>; stop(): void | Promise<void> };
  };
}

interface YaGamesGlobal {
  init(): Promise<YandexSdk>;
}

function yaGamesGlobal(): YaGamesGlobal | null {
  const value = (window as unknown as { YaGames?: YaGamesGlobal }).YaGames;
  return value ?? null;
}

function pageIsVisible(): boolean {
  return typeof document === 'undefined' || !document.hidden;
}

export class YandexPlatformAdapter implements PlatformAdapter {
  readonly id = 'yandex';
  readonly capabilities = {
    ads: true,
    rewardedAds: true,
    cloudSave: true,
    leaderboards: false,
    payments: false
  } as const;

  private sdk: YandexSdk | null = null;
  private player: YandexPlayer | null = null;
  private storage: YandexStorage | null = null;
  private pendingCloudState: GameState | null = null;
  private cloudTimer: number | null = null;
  private readySignaled = false;
  private gameplayActive: boolean | null = null;

  async initialize(): Promise<void> {
    const yaGames = yaGamesGlobal();
    if (!yaGames) throw new Error('Yandex Games SDK is not available');
    this.sdk = await yaGames.init();

    try {
      this.storage = this.sdk.getStorage ? await this.sdk.getStorage() : window.localStorage;
    } catch {
      this.storage = window.localStorage;
    }

    try {
      this.player = await this.sdk.getPlayer();
    } catch {
      this.player = null;
    }
  }

  async gameReady(): Promise<void> {
    if (this.readySignaled) return;
    this.readySignaled = true;
    try {
      await Promise.resolve(this.sdk?.features?.LoadingAPI?.ready());
    } catch {
      // Game Ready reporting must never make an already-rendered game unusable.
    }
    if (pageIsVisible()) this.setGameplayActive(true);
  }

  preferredLocale(): Locale | null {
    const language = this.sdk?.environment?.i18n?.lang;
    return language ? localeFromLanguage(language) : null;
  }

  async loadState(): Promise<unknown> {
    if (this.player) {
      try {
        const data = await this.player.getData([CLOUD_FIELD]);
        const cloud = data[CLOUD_FIELD];
        if (cloud && typeof cloud === 'object') return cloud;
      } catch {
        // Fall back to safe/local storage below.
      }
    }

    try {
      const raw = this.storage?.getItem(SAFE_SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async saveState(state: GameState, flush = false): Promise<void> {
    try {
      this.storage?.setItem(SAFE_SAVE_KEY, JSON.stringify(state));
    } catch {
      // Safe/local persistence is best-effort; cloud save may still succeed.
    }

    if (!this.player) return;
    this.pendingCloudState = state;

    if (this.cloudTimer !== null) {
      window.clearTimeout(this.cloudTimer);
      this.cloudTimer = null;
    }

    if (flush) {
      await this.flushCloudSave(true);
      return;
    }

    this.cloudTimer = window.setTimeout(() => {
      this.cloudTimer = null;
      void this.flushCloudSave(false);
    }, CLOUD_SAVE_DELAY_MS);
  }

  async showInterstitial(_reason: string): Promise<boolean> {
    if (!this.sdk) return false;
    this.setGameplayActive(false);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      let watchdog: number | null = null;
      const finish = (shown: boolean): void => {
        if (settled) return;
        settled = true;
        if (watchdog !== null) {
          window.clearTimeout(watchdog);
          watchdog = null;
        }
        if (pageIsVisible()) this.setGameplayActive(true);
        resolve(shown);
      };
      watchdog = window.setTimeout(() => finish(false), AD_WATCHDOG_MS);
      try {
        this.sdk?.adv.showFullscreenAdv({ callbacks: { onClose: (wasShown) => finish(Boolean(wasShown)), onError: () => finish(false) } });
      } catch {
        finish(false);
      }
    });
  }

  async showRewarded(_reason: string): Promise<boolean> {
    if (!this.sdk) return false;
    this.setGameplayActive(false);
    return new Promise<boolean>((resolve) => {
      let rewarded = false;
      let settled = false;
      let watchdog: number | null = null;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (watchdog !== null) {
          window.clearTimeout(watchdog);
          watchdog = null;
        }
        if (pageIsVisible()) this.setGameplayActive(true);
        resolve(rewarded);
      };
      watchdog = window.setTimeout(() => finish(), AD_WATCHDOG_MS);
      try {
        this.sdk?.adv.showRewardedVideo({ callbacks: { onRewarded: () => { rewarded = true; }, onClose: () => finish(), onError: () => finish() } });
      } catch {
        finish();
      }
    });
  }

  setGameplayActive(active: boolean): void {
    if (this.gameplayActive === active) return;
    try {
      const api = this.sdk?.features?.GameplayAPI;
      if (!api) return;
      this.gameplayActive = active;
      void Promise.resolve(active ? api.start() : api.stop()).catch(() => {
        // Async SDK rejections must not lock the adapter into a false active state.
        if (this.gameplayActive === active) this.gameplayActive = null;
      });
    } catch {
      // Let a later lifecycle event retry if the SDK call itself throws synchronously.
      this.gameplayActive = null;
    }
  }

  private async flushCloudSave(flush: boolean): Promise<void> {
    if (!this.player || !this.pendingCloudState) return;
    const state = this.pendingCloudState;
    this.pendingCloudState = null;
    try {
      await this.player.setData({ [CLOUD_FIELD]: state }, flush);
    } catch {
      // Never let a failed older write overwrite a newer snapshot queued while it was in flight.
      if (!this.pendingCloudState) this.pendingCloudState = state;
    }
  }
}
