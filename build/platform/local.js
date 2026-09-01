import { LEGACY_LOCAL_SAVE_KEY, SAFE_SAVE_KEY } from './storage-keys.js';
export class LocalPlatformAdapter {
    id = 'local';
    capabilities = {
        ads: false,
        rewardedAds: false,
        cloudSave: false,
        leaderboards: false,
        payments: false
    };
    async initialize() { }
    async gameReady() { }
    preferredLocale() {
        return null;
    }
    async loadState() {
        try {
            const canonical = localStorage.getItem(SAFE_SAVE_KEY);
            if (canonical)
                return JSON.parse(canonical);
            const legacy = localStorage.getItem(LEGACY_LOCAL_SAVE_KEY);
            return legacy ? JSON.parse(legacy) : null;
        }
        catch {
            return null;
        }
    }
    async saveState(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(SAFE_SAVE_KEY, serialized);
            // Keep the legacy local slot synchronized during the recovery window so old
            // browser fixtures/builds can roll forward without losing the latest state.
            localStorage.setItem(LEGACY_LOCAL_SAVE_KEY, serialized);
        }
        catch {
            // Local persistence is best-effort in private/restricted browser contexts.
        }
    }
    async showInterstitial(_reason) {
        return false;
    }
    async showRewarded(_reason) {
        return false;
    }
    setGameplayActive(_active) { }
}
