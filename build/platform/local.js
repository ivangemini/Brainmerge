import { prepareStateForSave } from '../core/game.js';
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
    persistedRevision = 0;
    async initialize() { }
    async gameReady() { }
    preferredLocale() {
        return null;
    }
    async loadState() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            const state = raw ? JSON.parse(raw) : null;
            this.persistedRevision = typeof state?.saveRevision === 'number' && Number.isFinite(state.saveRevision)
                ? Math.max(0, Math.floor(state.saveRevision))
                : 0;
            return state;
        }
        catch {
            return null;
        }
    }
    async saveState(state) {
        try {
            const snapshot = prepareStateForSave({ ...state, saveRevision: Math.max(state.saveRevision, this.persistedRevision) });
            this.persistedRevision = snapshot.saveRevision;
            localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
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
