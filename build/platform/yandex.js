import { newestValidState, prepareStateForSave } from '../core/game.js';
import { localeFromLanguage } from '../i18n/i18n.js';
const SAVE_KEY = 'brainmerge.save.v2';
const CLOUD_FIELD = 'brainmerge';
const CLOUD_SAVE_DELAY_MS = 1200;
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
    persistedRevision = 0;
    cloudWriteChain = Promise.resolve();
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
        let cloud = null;
        if (this.player) {
            try {
                const data = await this.player.getData([CLOUD_FIELD]);
                cloud = data[CLOUD_FIELD];
            }
            catch {
                // Resolve from safe/local storage below.
            }
        }
        let local = null;
        try {
            const raw = this.storage?.getItem(SAVE_KEY);
            local = raw ? JSON.parse(raw) : null;
        }
        catch {
            local = null;
        }
        // Keep cloud first for equal-revision legacy saves, matching the previous
        // cross-device behavior while allowing a newer local snapshot to win.
        const selected = newestValidState([cloud, local]);
        this.persistedRevision = selected?.saveRevision ?? 0;
        return selected;
    }
    async saveState(state, flush = false) {
        const snapshot = prepareStateForSave({ ...state, saveRevision: Math.max(state.saveRevision, this.persistedRevision) });
        this.persistedRevision = snapshot.saveRevision;
        try {
            this.storage?.setItem(SAVE_KEY, JSON.stringify(snapshot));
        }
        catch {
            // Safe/local persistence is best-effort; cloud save may still succeed.
        }
        if (!this.player)
            return;
        this.pendingCloudState = snapshot;
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
            const finish = (shown) => {
                if (settled)
                    return;
                settled = true;
                if (pageIsVisible())
                    this.setGameplayActive(true);
                resolve(shown);
            };
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
            const finish = () => {
                if (settled)
                    return;
                settled = true;
                if (pageIsVisible())
                    this.setGameplayActive(true);
                resolve(rewarded);
            };
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
        const write = async () => {
            try {
                await this.player?.setData({ [CLOUD_FIELD]: state }, flush);
            }
            catch {
                if (!this.pendingCloudState || this.pendingCloudState.saveRevision < state.saveRevision)
                    this.pendingCloudState = state;
            }
        };
        this.cloudWriteChain = this.cloudWriteChain.then(write, write);
        await this.cloudWriteChain;
    }
}
