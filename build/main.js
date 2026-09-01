import { BOARD_COLUMNS } from './core/catalog.js';
import { acknowledgeCampaignRunCompletion, beginCampaignRun, campaignRunPresentationSnapshot, deliverCampaignBoardUnit, moveOrMergeCampaignBoard, selectCampaignBoardCell, spawnCampaignRunSupply } from './core/campaign-run.js';
import { campaignPresentationSnapshot } from './core/campaign.js';
import { accrueOfflineIncome, accrueOnlineIncome, claimCurrentMission, claimOfflineIncome, createInitialState, isBoardFull, moveOrMerge, purchaseUpgrade, rescueDeadlock, sanitizeState, selectCell, spawnUnit } from './core/game.js';
import { AudioFeedback } from './feedback/audio-feedback.js';
import { runCoinTrail, runDiscoveryCelebration, runUnitFlight } from './feedback/visual-effects.js';
import { detectLocale, loadLocale, translate } from './i18n/i18n.js';
import { createPlatformAdapter } from './platform/factory.js';
import { LocalPlatformAdapter } from './platform/local.js';
import { GameView } from './ui/game-view.js';
const rootCandidate = document.querySelector('#app');
if (!rootCandidate)
    throw new Error('Missing #app root');
const root = rootCandidate;
const INCOME_TICK_MS = 5_000;
const AUTOSAVE_MS = 30_000;
const OFFLINE_REWARD_MIN_MS = 60_000;
let platform = new LocalPlatformAdapter();
let locale = detectLocale();
let state = createInitialState();
let adBusy = false;
const feedback = new AudioFeedback();
function cellElement(index) {
    return root.querySelector(`[data-cell="${index}"]`);
}
function motionAllowed() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function elementCenter(element) {
    if (!(element instanceof HTMLElement))
        return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0)
        return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
function transientClass(element, className, duration = 700) {
    if (!(element instanceof HTMLElement))
        return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
}
function burstAtCell(index, particleCount = 12) {
    if (!motionAllowed())
        return;
    const cell = cellElement(index);
    const zone = root.querySelector('.board-zone');
    if (!cell || !zone)
        return;
    const cellRect = cell.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    const burst = document.createElement('span');
    burst.className = 'fx-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = `${cellRect.left - zoneRect.left + cellRect.width / 2}px`;
    burst.style.top = `${cellRect.top - zoneRect.top + cellRect.height / 2}px`;
    burst.innerHTML = `<i class="fx-burst__ring"></i>${Array.from({ length: particleCount }, (_, i) => `<i class="fx-particle" style="--r:${Math.round(i * 360 / particleCount)}deg;--distance:${28 + (i % 4) * 7}px"></i>`).join('')}`;
    zone.appendChild(burst);
    window.setTimeout(() => burst.remove(), 700);
}
function floatValueAt(point, text) {
    if (!point || !motionAllowed())
        return;
    const value = document.createElement('span');
    value.className = 'fx-float-value';
    value.setAttribute('aria-hidden', 'true');
    value.textContent = text;
    value.style.left = `${point.x}px`;
    value.style.top = `${point.y}px`;
    document.body.appendChild(value);
    window.setTimeout(() => value.remove(), 900);
}
function insertedCellIndex(before, after) {
    for (let index = 0; index < after.cells.length; index += 1) {
        if (!before.cells[index] && after.cells[index])
            return index;
    }
    return null;
}
function changedCellIndexes(before, after) {
    const changed = [];
    for (let index = 0; index < after.cells.length; index += 1) {
        const a = before.cells[index];
        const b = after.cells[index];
        if (a?.id !== b?.id || a?.familyId !== b?.familyId || a?.tier !== b?.tier)
            changed.push(index);
    }
    return changed;
}
function runSpawnFx(index) {
    transientClass(root.querySelector('.spawn-dock'), 'fx-spawn-dock', 560);
    if (index === null)
        return;
    transientClass(cellElement(index), 'fx-spawn', 660);
    burstAtCell(index, 9);
}
function runMergeFx(index, reward, discoveredTier) {
    const cell = cellElement(index);
    transientClass(cell, 'fx-merge-result', discoveredTier ? 900 : 720);
    burstAtCell(index, discoveredTier && discoveredTier >= 8 ? 24 : state.maxDiscoveredTier >= 7 ? 18 : 14);
    transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
    if (reward > 0)
        runCoinTrail(elementCenter(cell), root.querySelector('.hud-pill--coin'), reward);
    if (discoveredTier) {
        runDiscoveryCelebration(cell, discoveredTier);
        if (discoveredTier >= 8) {
            window.setTimeout(() => burstAtCell(index, 26), 180);
            window.setTimeout(() => burstAtCell(index, 20), 390);
        }
    }
}
function runRewardFx(selector, reward, anchor) {
    transientClass(root.querySelector(selector), 'fx-reward', 660);
    transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
    if (reward > 0) {
        floatValueAt(anchor, `+${reward}`);
        runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
    }
}
function settleOnline(now = Date.now()) {
    state = accrueOnlineIncome(state, now);
}
function accrueReturnIncome(current, now = Date.now()) {
    const elapsedMs = Math.max(0, now - current.lastAccrualAt);
    return elapsedMs >= OFFLINE_REWARD_MIN_MS
        ? accrueOfflineIncome(current, now)
        : accrueOnlineIncome(current, now);
}
function activateCell(index) {
    const restoreKeyboardFocus = document.activeElement instanceof HTMLElement && document.activeElement.matches('[data-cell]');
    settleOnline();
    if (state.selectedIndex !== null && state.selectedIndex !== index) {
        const from = state.selectedIndex;
        const sourceElement = cellElement(from);
        const targetElement = cellElement(index);
        const before = state;
        const beforeTier = state.maxDiscoveredTier;
        const result = moveOrMerge(state, from, index);
        if (result.merged)
            runUnitFlight(sourceElement, targetElement, true);
        update(result.state);
        if (result.merged) {
            const reward = Math.max(0, result.state.coins - before.coins);
            const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
            feedback.trigger('merge', cellElement(index));
            runMergeFx(index, reward, discoveredTier);
        }
        if (restoreKeyboardFocus)
            cellElement(index)?.focus();
        return;
    }
    update(selectCell(state, state.selectedIndex === index ? null : index), false);
    if (restoreKeyboardFocus)
        cellElement(index)?.focus();
}
const view = new GameView(root, {
    spawn: () => {
        settleOnline();
        const before = state;
        const beforePaidBoxes = state.paidBoxes;
        const next = spawnUnit(state);
        if (next.paidBoxes > beforePaidBoxes)
            feedback.trigger('spawn');
        update(next);
        if (next.spawns > before.spawns)
            runSpawnFx(insertedCellIndex(before, next));
    },
    rewardedSpawn: () => { void handleRewardedSpawn(); },
    claimMission: () => {
        settleOnline();
        const anchor = elementCenter(root.querySelector('[data-action="claim-mission"]'));
        const before = state;
        const beforeIndex = state.missionIndex;
        const next = claimCurrentMission(state);
        if (next.missionIndex > beforeIndex)
            feedback.trigger('reward');
        update(next);
        if (next.missionIndex > beforeIndex)
            runRewardFx('.side-card--mission', Math.max(0, next.coins - before.coins), anchor);
    },
    claimOffline: () => {
        settleOnline();
        const anchor = elementCenter(root.querySelector('[data-action="claim-offline"]'));
        const before = state;
        const hadReward = state.pendingOfflineCoins > 0;
        const next = claimOfflineIncome(state);
        if (hadReward && next.pendingOfflineCoins === 0)
            feedback.trigger('reward');
        update(next);
        if (hadReward && next.pendingOfflineCoins === 0) {
            const reward = Math.max(0, next.coins - before.coins);
            transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
            floatValueAt(anchor, `+${reward}`);
            runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
        }
    },
    purchaseUpgrade: (id) => {
        settleOnline();
        const beforeLevel = state.upgrades[id];
        const next = purchaseUpgrade(state, id);
        if (next.upgrades[id] > beforeLevel)
            feedback.trigger('reward');
        update(next);
        if (next.upgrades[id] > beforeLevel) {
            const button = root.querySelector(`[data-upgrade="${id}"]`);
            transientClass(button?.closest('.upgrade-card') ?? button, 'fx-upgrade', 680);
            const card = button?.closest('.upgrade-card') ?? button;
            const center = elementCenter(card);
            if (center && card instanceof HTMLElement) {
                const zone = root.querySelector('.board-zone');
                const zoneRect = zone?.getBoundingClientRect();
                if (zone && zoneRect) {
                    const rect = card.getBoundingClientRect();
                    const burst = document.createElement('span');
                    burst.className = 'fx-burst';
                    burst.setAttribute('aria-hidden', 'true');
                    burst.style.left = `${rect.left - zoneRect.left + rect.width / 2}px`;
                    burst.style.top = `${rect.top - zoneRect.top + Math.min(58, rect.height / 2)}px`;
                    burst.innerHTML = '<i class="fx-burst__ring"></i>';
                    zone.appendChild(burst);
                    window.setTimeout(() => burst.remove(), 650);
                }
            }
        }
    },
    rescueDeadlock: () => {
        settleOnline();
        const before = state;
        const next = rescueDeadlock(state);
        const changed = changedCellIndexes(before, next);
        if (next !== state && changed.length > 0)
            feedback.trigger('rescue');
        update(next);
        for (const index of changed.slice(0, 8))
            transientClass(cellElement(index), 'fx-rescue', 560);
    },
    select: (index) => activateCell(index),
    moveOrMerge: (from, to) => {
        settleOnline();
        const sourceElement = cellElement(from);
        const targetElement = cellElement(to);
        const before = state;
        const beforeTier = state.maxDiscoveredTier;
        const result = moveOrMerge(state, from, to);
        if (result.merged)
            runUnitFlight(sourceElement, targetElement, true);
        update(result.state);
        if (result.merged) {
            const reward = Math.max(0, result.state.coins - before.coins);
            const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
            feedback.trigger('merge', cellElement(to));
            runMergeFx(to, reward, discoveredTier);
        }
    },
    setLocale: async (nextLocale) => {
        settleOnline();
        await loadLocale(nextLocale);
        locale = nextLocale;
        document.documentElement.lang = nextLocale;
        render();
    }
});
function publishCampaignSnapshot() {
    window.dispatchEvent(new CustomEvent('brainmerge:campaign-state', {
        detail: {
            ...campaignPresentationSnapshot(state.campaign),
            activeRun: campaignRunPresentationSnapshot(state.campaignRun)
        }
    }));
}
function render() {
    const t = (key, params) => translate(locale, key, params);
    view.render(state, locale, t, {
        rewardedAds: platform.capabilities.rewardedAds,
        adBusy
    });
    feedback.setLabels(t('audio.mute'), t('audio.unmute'));
    publishCampaignSnapshot();
}
function update(next, persist = true) {
    state = next;
    render();
    if (persist)
        void platform.saveState(state);
}
async function handleRewardedSpawn() {
    settleOnline();
    if (adBusy || isBoardFull(state) || !platform.capabilities.rewardedAds)
        return;
    adBusy = true;
    render();
    const rewarded = await platform.showRewarded('brain-box');
    adBusy = false;
    settleOnline();
    if (rewarded) {
        const before = state;
        const beforeSpawns = state.spawns;
        const next = spawnUnit(state, Math.random, true);
        update(next);
        if (next.spawns > beforeSpawns) {
            feedback.trigger('reward');
            runSpawnFx(insertedCellIndex(before, next));
        }
        return;
    }
    state = { ...state, messageKey: 'message.rewardUnavailable' };
    render();
}
async function boot() {
    platform = await createPlatformAdapter();
    try {
        await platform.initialize();
    }
    catch {
        platform = new LocalPlatformAdapter();
        await platform.initialize();
    }
    locale = platform.preferredLocale() ?? detectLocale();
    await Promise.all([loadLocale('en'), loadLocale('ru'), loadLocale(locale)]);
    document.documentElement.lang = locale;
    const now = Date.now();
    const saved = sanitizeState(await platform.loadState(), now);
    if (saved)
        state = accrueReturnIncome(saved, now);
    else
        state = createInitialState(now);
    render();
    // Platform Game Ready must be emitted only after locale/save restoration and the
    // first complete interactive render. Yandex moderation explicitly checks this timing.
    await platform.gameReady();
    void platform.saveState(state);
}
window.setInterval(() => {
    if (document.hidden)
        return;
    const next = accrueOnlineIncome(state, Date.now());
    if (next.coins !== state.coins || next.incomeRemainder !== state.incomeRemainder) {
        state = next;
        render();
    }
    else {
        state = next;
    }
}, INCOME_TICK_MS);
// Passive-only sessions still receive periodic canonical snapshots. This bounds
// cloud/local data loss without writing on every 5-second income presentation tick.
window.setInterval(() => {
    if (document.hidden)
        return;
    settleOnline();
    void platform.saveState(state);
}, AUTOSAVE_MS);
window.addEventListener('brainmerge:campaign-state-request', publishCampaignSnapshot);
window.addEventListener('brainmerge:campaign-command', (event) => {
    if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== 'object')
        return;
    const command = event.detail;
    const type = command.type;
    if (typeof type !== 'string')
        return;
    if (type === 'start') {
        const worldId = typeof command.worldId === 'number' ? command.worldId : Number.NaN;
        const locationId = typeof command.locationId === 'string' ? command.locationId : '';
        if (!Number.isInteger(worldId) || !locationId)
            return;
        settleOnline();
        update(beginCampaignRun(state, worldId, locationId));
        return;
    }
    if (type === 'spawn') {
        settleOnline();
        update(spawnCampaignRunSupply(state));
        return;
    }
    if (type === 'select') {
        const index = command.index === null ? null : typeof command.index === 'number' ? command.index : Number.NaN;
        if (index !== null && !Number.isInteger(index))
            return;
        update(selectCampaignBoardCell(state, index), false);
        return;
    }
    if (type === 'moveOrMerge') {
        const from = typeof command.from === 'number' ? command.from : Number.NaN;
        const to = typeof command.to === 'number' ? command.to : Number.NaN;
        if (!Number.isInteger(from) || !Number.isInteger(to))
            return;
        settleOnline();
        update(moveOrMergeCampaignBoard(state, from, to).state);
        return;
    }
    if (type === 'deliver') {
        const index = typeof command.index === 'number' ? command.index : Number.NaN;
        if (!Number.isInteger(index))
            return;
        settleOnline();
        update(deliverCampaignBoardUnit(state, index));
        return;
    }
    if (type === 'acknowledge') {
        settleOnline();
        update(acknowledgeCampaignRunCompletion(state));
    }
});
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        settleOnline();
        update(selectCell(state, null), false);
    }
    if (event.key.toLowerCase() === 'm' && event.target === document.body)
        feedback.toggleMute();
});
// Board buttons are fully keyboard-operable. Enter/Space follows the exact same
// select/move/merge path as pointer input; arrow keys only move focus and never spend currency.
root.addEventListener('keydown', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-cell]') : null;
    if (!target)
        return;
    const index = Number(target.dataset.cell);
    if (!Number.isInteger(index) || index < 0 || index >= state.cells.length)
        return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateCell(index);
        return;
    }
    let nextIndex = null;
    if (event.key === 'ArrowLeft' && index % BOARD_COLUMNS > 0)
        nextIndex = index - 1;
    if (event.key === 'ArrowRight' && index % BOARD_COLUMNS < BOARD_COLUMNS - 1 && index + 1 < state.cells.length)
        nextIndex = index + 1;
    if (event.key === 'ArrowUp' && index >= BOARD_COLUMNS)
        nextIndex = index - BOARD_COLUMNS;
    if (event.key === 'ArrowDown' && index + BOARD_COLUMNS < state.cells.length)
        nextIndex = index + BOARD_COLUMNS;
    if (nextIndex !== null) {
        event.preventDefault();
        cellElement(nextIndex)?.focus();
    }
});
document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.hidden) {
        settleOnline(now);
        platform.setGameplayActive(false);
        // Mobile browsers may suspend before pagehide. Flush the latest economy snapshot now.
        void platform.saveState(state, true);
        return;
    }
    state = accrueReturnIncome(state, now);
    platform.setGameplayActive(true);
    render();
    void platform.saveState(state);
});
window.addEventListener('pagehide', () => {
    settleOnline();
    platform.setGameplayActive(false);
    void platform.saveState(state, true);
});
void boot();
