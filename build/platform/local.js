const SAVE_KEY = 'brainmerge.save.v1';
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
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
    async saveState(state) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
