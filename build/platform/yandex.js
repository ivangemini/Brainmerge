import { localeFromLanguage } from '../i18n/i18n.js';
const SAVE_KEY = 'brainmerge.save.v2';
const CLOUD_FIELD = 'brainmerge';
const CLOUD_SAVE_DELAY_MS = 1200;
const AD_WATCHDOG_MS = 30_000;
function yaGamesGlobal() {
    const value = window.YaGames;
    return value ?? null;
}
function pageIsVisible() {
    return typeof document === 'undefined' || !document.hidden;
}
export class YandexPlatformAdapter {
    id = 'yandex';
    capabilities = {
        ads: true,
        rewardedAds: true,
        cloudSave: true,
        leaderboards: false,
        payments: false
    };
    sdk = null;
    player = null;
    storage = null;
    pendingCloudState = null;
    cloudTimer = null;
    readySignaled = false;
    gameplayActive = null;
    async initialize() {
        const yaGames = yaGamesGlobal();
        if (!yaGames)
            throw new Error('Yandex Games SDK is not available');
        this.sdk = await yaGames.init();
        try {
            this.storage = this.sdk.getStorage ? await this.sdk.getStorage() : window.localStorage;
        }
        catch {
            this.storage = window.localStorage;
        }
        try {
            this.player = await this.sdk.getPlayer();
        }
        catch {
            this.player = null;
        }
    }
    async gameReady() {
        if (this.readySignaled)
            return;
        this.readySignaled = true;
        try {
            await Promise.resolve(this.sdk?.features?.LoadingAPI?.ready());
        }
        catch {
            // Game Ready reporting must never make an already-rendered game unusable.
        }
        if (pageIsVisible())
            this.setGameplayActive(true);
    }
    preferredLocale() {
        const language = this.sdk?.environment?.i18n?.lang;
        return language ? localeFromLanguage(language) : null;
    }
    async loadState() {
        if (this.player) {
            try {
                const data = await this.player.getData([CLOUD_FIELD]);
                const cloud = data[CLOUD_FIELD];
                if (cloud && typeof cloud === 'object')
                    return cloud;
            }
            catch {
                // Fall back to safe/local storage below.
            }
        }
        try {
            const raw = this.storage?.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
    async saveState(state, flush = false) {
        try {
            this.storage?.setItem(SAVE_KEY, JSON.stringify(state));
        }
        catch {
            // Safe/local persistence is best-effort; cloud save may still succeed.
        }
        if (!this.player)
            return;
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
    async showInterstitial(_reason) {
        if (!this.sdk)
            return false;
        this.setGameplayActive(false);
        return new Promise((resolve) => {
            let settled = false;
            let watchdog = null;
            const finish = (shown) => {
                if (settled)
                    return;
                settled = true;
                if (watchdog !== null) {
                    window.clearTimeout(watchdog);
                    watchdog = null;
                }
                if (pageIsVisible())
                    this.setGameplayActive(true);
                resolve(shown);
            };
            watchdog = window.setTimeout(() => finish(false), AD_WATCHDOG_MS);
            try {
                this.sdk?.adv.showFullscreenAdv({ callbacks: { onClose: (wasShown) => finish(Boolean(wasShown)), onError: () => finish(false) } });
            }
            catch {
                finish(false);
            }
        });
    }
    async showRewarded(_reason) {
        if (!this.sdk)
            return false;
        this.setGameplayActive(false);
        return new Promise((resolve) => {
            let rewarded = false;
            let settled = false;
            let watchdog = null;
            const finish = () => {
                if (settled)
                    return;
                settled = true;
                if (watchdog !== null) {
                    window.clearTimeout(watchdog);
                    watchdog = null;
                }
                if (pageIsVisible())
                    this.setGameplayActive(true);
                resolve(rewarded);
            };
            watchdog = window.setTimeout(() => finish(), AD_WATCHDOG_MS);
            try {
                this.sdk?.adv.showRewardedVideo({ callbacks: { onRewarded: () => { rewarded = true; }, onClose: () => finish(), onError: () => finish() } });
            }
            catch {
                finish();
            }
        });
    }
    setGameplayActive(active) {
        if (this.gameplayActive === active)
            return;
        try {
            const api = this.sdk?.features?.GameplayAPI;
            if (!api)
                return;
            this.gameplayActive = active;
            void Promise.resolve(active ? api.start() : api.stop());
        }
        catch {
            // Let a later lifecycle event retry if the SDK call itself throws synchronously.
            this.gameplayActive = null;
        }
    }
    async flushCloudSave(flush) {
        if (!this.player || !this.pendingCloudState)
            return;
        const state = this.pendingCloudState;
        this.pendingCloudState = null;
        try {
            await this.player.setData({ [CLOUD_FIELD]: state }, flush);
        }
        catch {
            // Never let a failed older write overwrite a newer snapshot queued while it was in flight.
            if (!this.pendingCloudState)
                this.pendingCloudState = state;
        }
    }
}
