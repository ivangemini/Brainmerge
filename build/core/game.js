import { BOARD_SIZE, AD_REWARDS_CONFIG, DEADLOCK_RESCUE_REFUND, FAMILIES, MAX_BOX_BASE_TIER_LEVEL, MAX_RUNTIME_TIER, MISSION_TRACK, UPGRADE_DEFINITIONS, brainBoxCostForBaseTier, discoveryBonusForTier, familyById, familyByTier, incomeMultiplierForLevel, luckyDropChanceForLevel, maxUpgradeLevel, mergeRewardForTier, nextFamilyFor, offlineHoursForLevel, upgradeCost } from './catalog.js';
import { sanitizeCampaignRunState } from './campaign-run.js';
import { sanitizeCampaignRaidRun } from './campaign-raid.js';
import { createInitialCampaignProgress, sanitizeCampaignProgress } from './campaign.js';
import { calendarDateForTimestamp, reconcileDailyUsage } from './daily-reset.js';
let sequence = 0;
const DEFAULT_UPGRADES = {
    boxBaseTier: 0,
    luckyDrop: 0,
    income: 0,
    offline: 0
};
const DEFAULT_PRESTIGE_UPGRADES = {
    income: 0,
    boxDiscount: 0,
    startingCoins: 0,
    offline: 0,
    campaignPower: 0
};
const DEFAULT_AD_BOOSTS = {
    coinBoostExpiresAt: null,
    coinBoostUsesToday: 0,
    coinBoostUsageDate: null,
    goldenBoxAvailableAt: null,
    mutationCharge: false,
    freeUpgradeUsesToday: 0,
    freeUpgradeUsageDate: null,
    pendingGoldenBoxes: 0,
    lastObservedAt: 0
};
export const COLLECTION_REWARD_TIERS = [5, 10, 15, 18];
export const PRESTIGE_REWARD_CELLS = 3;
export const MAX_PRESTIGE_UPGRADE_LEVEL = 5;
export const COMBO_WINDOW_MS = 8_000;
export const FEVER_DURATION_MS = 30_000;
export const FEVER_COOLDOWN_MS = 4 * 60_000;
export const FEVER_MERGES_REQUIRED = 24;
export const VISITOR_DURATION_MS = 90_000;
const DEFAULT_EVENTS = {
    activeMs: 0,
    comboCount: 0,
    comboExpiresAtActiveMs: 0,
    feverCharge: 0,
    feverRemainingMs: 0,
    feverCooldownRemainingMs: 0,
    nextVisitorAtActiveMs: 5 * 60_000,
    visitorSequence: 0,
    visitor: null
};
function defaultRetention(now) {
    const safeNow = Math.max(0, Math.floor(now));
    return { firstSeenAt: safeNow, lastSessionAt: safeNow, sessionCount: 1, tier5ActiveMs: null, tier8ActiveMs: null, tier18ActiveMs: null, activeAfterT18Ms: 0, firstPrestigeActiveMs: null, world1RaidClearActiveMs: null };
}
function createUnit(familyId) {
    const family = familyById.get(familyId);
    if (!family)
        throw new Error(`Unknown family: ${familyId}`);
    sequence += 1;
    return { id: `${familyId}-${Date.now().toString(36)}-${sequence.toString(36)}`, familyId, tier: family.tier };
}
function normalizeLegacyUnit(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return null;
    const unit = candidate;
    if (typeof unit.id !== 'string' || typeof unit.familyId !== 'string')
        return null;
    const family = FAMILIES.find((entry) => entry.id === unit.familyId);
    if (!family)
        return null;
    return { id: unit.id, familyId: family.id, tier: family.tier };
}
function sanitizeUpgradeLevel(id, candidate) {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate))
        return 0;
    return Math.max(0, Math.min(maxUpgradeLevel(id), Math.floor(candidate)));
}
function sanitizeUpgrades(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return { ...DEFAULT_UPGRADES };
    const raw = candidate;
    return {
        boxBaseTier: Math.min(MAX_BOX_BASE_TIER_LEVEL, sanitizeUpgradeLevel('boxBaseTier', raw.boxBaseTier)),
        luckyDrop: sanitizeUpgradeLevel('luckyDrop', raw.luckyDrop),
        income: sanitizeUpgradeLevel('income', raw.income),
        offline: sanitizeUpgradeLevel('offline', raw.offline)
    };
}
function sanitizeNonnegativeInt(candidate, cap = Number.MAX_SAFE_INTEGER) {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate))
        return 0;
    return Math.max(0, Math.min(cap, Math.floor(candidate)));
}
function sanitizeCollectionRewardClaims(candidate) {
    if (!Array.isArray(candidate))
        return [];
    return [...new Set(candidate.filter((entry) => typeof entry === 'string' && entry.length > 0 && entry.length <= 80))].slice(0, 64);
}
function sanitizePrestigeUpgrades(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return { ...DEFAULT_PRESTIGE_UPGRADES };
    const raw = candidate;
    return {
        income: sanitizeNonnegativeInt(raw.income, MAX_PRESTIGE_UPGRADE_LEVEL),
        boxDiscount: sanitizeNonnegativeInt(raw.boxDiscount, MAX_PRESTIGE_UPGRADE_LEVEL),
        startingCoins: sanitizeNonnegativeInt(raw.startingCoins, MAX_PRESTIGE_UPGRADE_LEVEL),
        offline: sanitizeNonnegativeInt(raw.offline, MAX_PRESTIGE_UPGRADE_LEVEL),
        campaignPower: sanitizeNonnegativeInt(raw.campaignPower, MAX_PRESTIGE_UPGRADE_LEVEL)
    };
}
function sanitizeNullableTimestamp(candidate) {
    if (candidate === null || candidate === undefined)
        return null;
    if (typeof candidate !== 'number' || !Number.isFinite(candidate))
        return null;
    return Math.max(0, Math.floor(candidate));
}
function sanitizeDateKey(candidate) {
    return typeof candidate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}
function sanitizeAdBoosts(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return { ...DEFAULT_AD_BOOSTS };
    const raw = candidate;
    return {
        coinBoostExpiresAt: sanitizeNullableTimestamp(raw.coinBoostExpiresAt),
        coinBoostUsesToday: sanitizeNonnegativeInt(raw.coinBoostUsesToday, AD_REWARDS_CONFIG.coinBoost.dailyLimit),
        coinBoostUsageDate: sanitizeDateKey(raw.coinBoostUsageDate),
        goldenBoxAvailableAt: sanitizeNullableTimestamp(raw.goldenBoxAvailableAt),
        mutationCharge: raw.mutationCharge === true,
        freeUpgradeUsesToday: sanitizeNonnegativeInt(raw.freeUpgradeUsesToday, AD_REWARDS_CONFIG.freeUpgrade.dailyLimit),
        freeUpgradeUsageDate: sanitizeDateKey(raw.freeUpgradeUsageDate),
        pendingGoldenBoxes: sanitizeNonnegativeInt(raw.pendingGoldenBoxes, 1_000_000),
        lastObservedAt: sanitizeNonnegativeInt(raw.lastObservedAt)
    };
}
function sanitizeEvents(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return { ...DEFAULT_EVENTS };
    const raw = candidate;
    const activeMs = sanitizeNonnegativeInt(raw.activeMs, 9_000_000_000_000_000);
    const visitorRaw = raw.visitor && typeof raw.visitor === 'object' ? raw.visitor : null;
    const kind = visitorRaw?.kind;
    const character = visitorRaw?.character;
    const visitor = visitorRaw
        && (kind === 'merges' || kind === 'boxes' || kind === 'campaignDelivery')
        && (character === 'sneakerCourier' || character === 'pigeonInspector' || character === 'watermelonCook')
        ? {
            id: typeof visitorRaw.id === 'string' ? visitorRaw.id.slice(0, 80) : 'visitor-restored',
            character,
            kind,
            target: Math.max(1, sanitizeNonnegativeInt(visitorRaw.target, 100)),
            progress: sanitizeNonnegativeInt(visitorRaw.progress, 100),
            remainingMs: sanitizeNonnegativeInt(visitorRaw.remainingMs, VISITOR_DURATION_MS)
        }
        : null;
    return {
        activeMs,
        comboCount: sanitizeNonnegativeInt(raw.comboCount, 10),
        comboExpiresAtActiveMs: sanitizeNonnegativeInt(raw.comboExpiresAtActiveMs, 9_000_000_000_000_000),
        feverCharge: sanitizeNonnegativeInt(raw.feverCharge, FEVER_MERGES_REQUIRED),
        feverRemainingMs: sanitizeNonnegativeInt(raw.feverRemainingMs, FEVER_DURATION_MS),
        feverCooldownRemainingMs: sanitizeNonnegativeInt(raw.feverCooldownRemainingMs, FEVER_COOLDOWN_MS),
        nextVisitorAtActiveMs: Math.max(activeMs, sanitizeNonnegativeInt(raw.nextVisitorAtActiveMs, 9_000_000_000_000_000)),
        visitorSequence: sanitizeNonnegativeInt(raw.visitorSequence, 1_000_000),
        visitor
    };
}
function nullableMetric(candidate) {
    return typeof candidate === 'number' && Number.isFinite(candidate) ? sanitizeNonnegativeInt(candidate, 9_000_000_000_000_000) : null;
}
function sanitizeRetention(candidate, now) {
    if (!candidate || typeof candidate !== 'object')
        return defaultRetention(now);
    const raw = candidate;
    const firstSeenAt = typeof raw.firstSeenAt === 'number' && Number.isFinite(raw.firstSeenAt) ? sanitizeNonnegativeInt(raw.firstSeenAt, now) : now;
    return {
        firstSeenAt,
        lastSessionAt: typeof raw.lastSessionAt === 'number' && Number.isFinite(raw.lastSessionAt) ? Math.max(firstSeenAt, sanitizeNonnegativeInt(raw.lastSessionAt, now)) : firstSeenAt,
        sessionCount: Math.max(1, sanitizeNonnegativeInt(raw.sessionCount, 1_000_000)),
        tier5ActiveMs: nullableMetric(raw.tier5ActiveMs), tier8ActiveMs: nullableMetric(raw.tier8ActiveMs), tier18ActiveMs: nullableMetric(raw.tier18ActiveMs),
        activeAfterT18Ms: sanitizeNonnegativeInt(raw.activeAfterT18Ms, 9_000_000_000_000_000),
        firstPrestigeActiveMs: nullableMetric(raw.firstPrestigeActiveMs),
        world1RaidClearActiveMs: nullableMetric(raw.world1RaidClearActiveMs)
    };
}
export function createInitialState(now = Date.now()) {
    const cells = Array.from({ length: BOARD_SIZE }, () => null);
    for (let index = 0; index < 4; index += 1)
        cells[index] = createUnit('toilet-buddy');
    return {
        version: 10,
        saveRevision: 0,
        savedAt: Math.max(0, Math.floor(now)),
        cells,
        coins: 100,
        xp: 0,
        merges: 0,
        spawns: 0,
        paidBoxes: 0,
        maxDiscoveredTier: 1,
        runMaxTier: 1,
        missionIndex: 0,
        upgrades: { ...DEFAULT_UPGRADES },
        incomeRemainder: 0,
        lastAccrualAt: Math.max(0, Math.floor(now)),
        pendingOfflineCoins: 0,
        collectionRewardClaims: [],
        prestigeCount: 0,
        brainCells: 0,
        prestigeUpgrades: { ...DEFAULT_PRESTIGE_UPGRADES },
        events: { ...DEFAULT_EVENTS },
        retention: defaultRetention(now),
        adBoosts: { ...DEFAULT_AD_BOOSTS },
        campaign: createInitialCampaignProgress(),
        campaignRun: null,
        raidRun: null,
        selectedIndex: null,
        messageKey: 'message.welcome'
    };
}
export function sanitizeState(candidate, now = Date.now()) {
    if (!candidate || typeof candidate !== 'object')
        return null;
    const state = candidate;
    const version = typeof state.version === 'number' ? state.version : 0;
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(version)
        || !Array.isArray(state.cells)
        || state.cells.length !== BOARD_SIZE)
        return null;
    if (typeof state.coins !== 'number' || typeof state.xp !== 'number' || typeof state.merges !== 'number')
        return null;
    const cells = [];
    for (const cell of state.cells) {
        if (cell === null) {
            cells.push(null);
            continue;
        }
        const normalized = normalizeLegacyUnit(cell);
        if (!normalized)
            return null;
        cells.push(normalized);
    }
    const discoveredFromBoard = cells.reduce((highest, cell) => Math.max(highest, cell?.tier ?? 1), 1);
    const savedDiscovered = version >= 3 && typeof state.maxDiscoveredTier === 'number' && Number.isFinite(state.maxDiscoveredTier)
        ? Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(state.maxDiscoveredTier)))
        : discoveredFromBoard;
    const maxDiscoveredTier = Math.max(discoveredFromBoard, savedDiscovered);
    const savedRunMaxTier = version >= 8 && typeof state.runMaxTier === 'number' && Number.isFinite(state.runMaxTier)
        ? Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(state.runMaxTier)))
        : maxDiscoveredTier;
    const runMaxTier = Math.max(discoveredFromBoard, Math.min(savedRunMaxTier, maxDiscoveredTier));
    const spawns = version >= 2 ? sanitizeNonnegativeInt(state.spawns) : 0;
    let missionIndex = 0;
    if (version >= 4 && typeof state.missionIndex === 'number' && Number.isFinite(state.missionIndex)) {
        missionIndex = Math.max(0, Math.min(MISSION_TRACK.length, Math.floor(state.missionIndex)));
    }
    else if ((version === 2 || version === 3) && state.missionClaimed === true) {
        missionIndex = 1;
    }
    const safeNow = Math.max(0, Math.floor(now));
    const rawLastAccrual = version >= 5 && typeof state.lastAccrualAt === 'number' && Number.isFinite(state.lastAccrualAt)
        ? Math.max(0, Math.floor(state.lastAccrualAt))
        : safeNow;
    const lastAccrualAt = rawLastAccrual > safeNow ? safeNow : rawLastAccrual;
    const incomeRemainder = version >= 5 && typeof state.incomeRemainder === 'number' && Number.isFinite(state.incomeRemainder)
        ? Math.max(0, Math.min(0.999999, state.incomeRemainder))
        : 0;
    const pendingOfflineCoins = version >= 5 && typeof state.pendingOfflineCoins === 'number' && Number.isFinite(state.pendingOfflineCoins)
        ? Math.max(0, Math.floor(state.pendingOfflineCoins))
        : 0;
    const campaign = version >= 6 ? sanitizeCampaignProgress(state.campaign) : createInitialCampaignProgress();
    const campaignRun = version >= 6
        ? sanitizeCampaignRunState(state.campaignRun, campaign, maxDiscoveredTier)
        : null;
    const raidRun = version >= 10
        ? sanitizeCampaignRaidRun(state.raidRun, { campaign, maxDiscoveredTier })
        : null;
    const adBoosts = sanitizeAdBoosts(state.adBoosts);
    return {
        version: 10,
        saveRevision: version >= 7 ? sanitizeNonnegativeInt(state.saveRevision, 9_000_000_000_000_000) : 0,
        savedAt: version >= 7 ? sanitizeNonnegativeInt(state.savedAt, 9_000_000_000_000_000) : safeNow,
        cells,
        coins: sanitizeNonnegativeInt(state.coins),
        xp: sanitizeNonnegativeInt(state.xp),
        merges: sanitizeNonnegativeInt(state.merges),
        spawns,
        paidBoxes: version >= 5 && typeof state.paidBoxes === 'number' && Number.isFinite(state.paidBoxes)
            ? Math.max(0, Math.floor(state.paidBoxes))
            : 0,
        maxDiscoveredTier,
        runMaxTier,
        missionIndex,
        upgrades: version >= 5 ? sanitizeUpgrades(state.upgrades) : { ...DEFAULT_UPGRADES },
        incomeRemainder,
        lastAccrualAt,
        pendingOfflineCoins,
        collectionRewardClaims: version >= 6 ? sanitizeCollectionRewardClaims(state.collectionRewardClaims) : [],
        prestigeCount: version >= 6 ? sanitizeNonnegativeInt(state.prestigeCount, 1_000_000) : 0,
        brainCells: version >= 6 ? sanitizeNonnegativeInt(state.brainCells, 1_000_000_000) : 0,
        prestigeUpgrades: version >= 6 ? sanitizePrestigeUpgrades(state.prestigeUpgrades) : { ...DEFAULT_PRESTIGE_UPGRADES },
        events: version >= 9 ? sanitizeEvents(state.events) : { ...DEFAULT_EVENTS },
        retention: version >= 10 ? sanitizeRetention(state.retention, safeNow) : defaultRetention(safeNow),
        adBoosts,
        campaign,
        campaignRun,
        raidRun,
        selectedIndex: null,
        messageKey: null
    };
}
/** Creates a persistence snapshot without mutating live gameplay state. */
export function prepareStateForSave(state, now = Date.now()) {
    return {
        ...state,
        version: 10,
        saveRevision: Math.min(9_000_000_000_000_000, state.saveRevision + 1),
        savedAt: Math.max(state.savedAt, Math.max(0, Math.floor(now)))
    };
}
export function newestValidState(candidates, now = Date.now()) {
    let newest = null;
    for (const candidate of candidates) {
        const state = sanitizeState(candidate, now);
        if (!state)
            continue;
        if (!newest || state.saveRevision > newest.saveRevision ||
            (state.saveRevision === newest.saveRevision && state.savedAt > newest.savedAt))
            newest = state;
    }
    return newest;
}
export function currentBrainBoxCost(state) {
    const discount = Math.min(0.25, state.prestigeUpgrades.boxDiscount * 0.05);
    const feverDiscount = state.events.feverRemainingMs > 0 ? 0.25 : 0;
    return Math.max(1, Math.ceil(brainBoxCostForBaseTier(brainBoxBaseTier(state)) * (1 - discount) * (1 - feverDiscount)));
}
export function brainBoxBaseTier(state) {
    return Math.max(1, Math.min(1 + state.upgrades.boxBaseTier, state.runMaxTier, state.maxDiscoveredTier, 14));
}
export function brainBoxLuckyChance(state) {
    return luckyDropChanceForLevel(state.upgrades.luckyDrop);
}
function effectiveAdNow(state, now) {
    return Math.max(0, Math.floor(now), state.adBoosts.lastObservedAt);
}
export function reconcileAdBoostState(state, now = Date.now()) {
    const observedAt = effectiveAdNow(state, now);
    const coinUsage = reconcileDailyUsage(state.adBoosts.coinBoostUsesToday, state.adBoosts.coinBoostUsageDate, observedAt, AD_REWARDS_CONFIG.coinBoost.dailyLimit);
    const freeUpgradeUsage = reconcileDailyUsage(state.adBoosts.freeUpgradeUsesToday, state.adBoosts.freeUpgradeUsageDate, observedAt, AD_REWARDS_CONFIG.freeUpgrade.dailyLimit);
    const adBoosts = {
        ...state.adBoosts,
        lastObservedAt: observedAt,
        coinBoostUsesToday: coinUsage.count,
        coinBoostUsageDate: coinUsage.date,
        freeUpgradeUsesToday: freeUpgradeUsage.count,
        freeUpgradeUsageDate: freeUpgradeUsage.date
    };
    if (Object.keys(adBoosts).every((key) => adBoosts[key] === state.adBoosts[key]))
        return state;
    return { ...state, adBoosts };
}
function coinBoostIsActive(state, now) {
    return state.adBoosts.coinBoostExpiresAt !== null && state.adBoosts.coinBoostExpiresAt > effectiveAdNow(state, now);
}
export function coinBoostMultiplier(state, now = Date.now()) {
    return coinBoostIsActive(state, now) ? AD_REWARDS_CONFIG.coinBoost.multiplier : 1;
}
export function adBoostPresentation(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    const effectiveNow = effectiveAdNow(current, now);
    const coinBoostRemainingMs = Math.max(0, (current.adBoosts.coinBoostExpiresAt ?? 0) - effectiveNow);
    const goldenBoxRemainingMs = Math.max(0, (current.adBoosts.goldenBoxAvailableAt ?? 0) - effectiveNow);
    return {
        coinBoostActive: coinBoostRemainingMs > 0,
        coinBoostRemainingMs,
        coinBoostUsesToday: current.adBoosts.coinBoostUsesToday,
        coinBoostDailyLimit: AD_REWARDS_CONFIG.coinBoost.dailyLimit,
        goldenBoxReady: goldenBoxRemainingMs <= 0,
        goldenBoxRemainingMs,
        mutationReady: current.adBoosts.mutationCharge,
        freeUpgradeUsesToday: current.adBoosts.freeUpgradeUsesToday,
        freeUpgradeDailyLimit: AD_REWARDS_CONFIG.freeUpgrade.dailyLimit,
        freeUpgradeEligibleCount: eligibleFreeUpgradeIds(current).length,
        pendingGoldenBoxes: current.adBoosts.pendingGoldenBoxes
    };
}
export function canActivateCoinBoost(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    return !coinBoostIsActive(current, now)
        && current.adBoosts.coinBoostUsesToday < AD_REWARDS_CONFIG.coinBoost.dailyLimit;
}
export function activateCoinBoost(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    const effectiveNow = effectiveAdNow(current, now);
    if (!canActivateCoinBoost(current, effectiveNow))
        return current;
    return {
        ...current,
        adBoosts: {
            ...current.adBoosts,
            coinBoostExpiresAt: effectiveNow + AD_REWARDS_CONFIG.coinBoost.durationMinutes * 60_000,
            coinBoostUsesToday: current.adBoosts.coinBoostUsesToday + 1,
            coinBoostUsageDate: calendarDateForTimestamp(effectiveNow)
        },
        messageKey: 'message.coinBoostActivated'
    };
}
function randomInteger(random, minimum, maximum) {
    const roll = Math.max(0, Math.min(0.999999999, random()));
    return minimum + Math.floor(roll * (maximum - minimum + 1));
}
function goldenBrainBoxTier(state, random) {
    const bonus = randomInteger(random, AD_REWARDS_CONFIG.goldenBrainBox.minTierBonus, AD_REWARDS_CONFIG.goldenBrainBox.maxTierBonus);
    return Math.max(1, Math.min(brainBoxBaseTier(state) + bonus, state.maxDiscoveredTier, MAX_RUNTIME_TIER));
}
export function settlePendingGoldenBoxes(state, random = Math.random) {
    if (state.adBoosts.pendingGoldenBoxes <= 0)
        return state;
    const target = state.cells.findIndex((cell) => cell === null);
    if (target < 0)
        return state;
    const family = familyByTier.get(goldenBrainBoxTier(state, random)) ?? FAMILIES[0];
    const cells = state.cells.slice();
    cells[target] = createUnit(family.id);
    return recordVisitorProgress({
        ...state,
        cells,
        spawns: state.spawns + 1,
        adBoosts: { ...state.adBoosts, pendingGoldenBoxes: state.adBoosts.pendingGoldenBoxes - 1 },
        selectedIndex: null,
        messageKey: 'message.goldenBoxOpened'
    }, 'boxes');
}
export function canClaimGoldenBrainBox(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    return current.adBoosts.goldenBoxAvailableAt === null
        || current.adBoosts.goldenBoxAvailableAt <= effectiveAdNow(current, now);
}
export function grantGoldenBrainBox(state, random = Math.random, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    const effectiveNow = effectiveAdNow(current, now);
    if (!canClaimGoldenBrainBox(current, effectiveNow))
        return current;
    const queued = {
        ...current,
        adBoosts: {
            ...current.adBoosts,
            goldenBoxAvailableAt: effectiveNow + AD_REWARDS_CONFIG.goldenBrainBox.cooldownMinutes * 60_000,
            pendingGoldenBoxes: current.adBoosts.pendingGoldenBoxes + 1
        },
        messageKey: 'message.goldenBoxReceived'
    };
    return settlePendingGoldenBoxes(queued, random);
}
export function canActivateMutationCharge(state) {
    return !state.adBoosts.mutationCharge;
}
export function activateMutationCharge(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    if (!canActivateMutationCharge(current))
        return current;
    return { ...current, adBoosts: { ...current.adBoosts, mutationCharge: true }, messageKey: 'message.mutationReady' };
}
function canRaiseUpgradeForFree(state, id) {
    const currentLevel = state.upgrades[id];
    return upgradeCost(id, currentLevel) !== null && currentLevel < maxUpgradeLevel(id)
        && (upgradeRequiredDiscoveryTier(id, currentLevel) === null || state.maxDiscoveredTier >= (upgradeRequiredDiscoveryTier(id, currentLevel) ?? 0));
}
export function eligibleFreeUpgradeIds(state) {
    return UPGRADE_DEFINITIONS.map((upgrade) => upgrade.id).filter((id) => canRaiseUpgradeForFree(state, id));
}
export function canActivateFreeUpgrade(state, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    return current.adBoosts.freeUpgradeUsesToday < AD_REWARDS_CONFIG.freeUpgrade.dailyLimit
        && eligibleFreeUpgradeIds(current).length > 0;
}
export function grantFreeUpgrade(state, random = Math.random, now = Date.now()) {
    const current = reconcileAdBoostState(state, now);
    const eligible = eligibleFreeUpgradeIds(current);
    if (current.adBoosts.freeUpgradeUsesToday >= AD_REWARDS_CONFIG.freeUpgrade.dailyLimit || eligible.length === 0) {
        return { ...current, messageKey: 'message.allUpgradesMaxed' };
    }
    const id = eligible[randomInteger(random, 0, eligible.length - 1)];
    if (!id)
        return current;
    return {
        ...current,
        upgrades: { ...current.upgrades, [id]: current.upgrades[id] + 1 },
        adBoosts: {
            ...current.adBoosts,
            freeUpgradeUsesToday: current.adBoosts.freeUpgradeUsesToday + 1,
            freeUpgradeUsageDate: calendarDateForTimestamp(effectiveAdNow(current, now))
        },
        messageKey: 'message.freeUpgradeApplied'
    };
}
function visitorScheduleDelay(sequence) {
    return (4 + (Math.abs(sequence) % 3)) * 60_000;
}
export function advanceFastEvents(state, elapsedActiveMs, canStart = true, visitorsEnabled = false) {
    const elapsed = Math.max(0, Math.min(60_000, Math.floor(elapsedActiveMs)));
    if (elapsed <= 0)
        return state;
    let events = {
        ...state.events,
        activeMs: state.events.activeMs + elapsed,
        feverRemainingMs: Math.max(0, state.events.feverRemainingMs - elapsed),
        feverCooldownRemainingMs: Math.max(0, state.events.feverCooldownRemainingMs - elapsed),
        visitor: state.events.visitor
            ? { ...state.events.visitor, remainingMs: Math.max(0, state.events.visitor.remainingMs - elapsed) }
            : null
    };
    if (events.visitor?.remainingMs === 0) {
        events = {
            ...events,
            visitor: null,
            nextVisitorAtActiveMs: events.activeMs + visitorScheduleDelay(events.visitorSequence)
        };
    }
    if (canStart && state.runMaxTier >= 5 && events.feverRemainingMs === 0
        && events.feverCooldownRemainingMs === 0 && events.feverCharge >= FEVER_MERGES_REQUIRED) {
        events = { ...events, feverCharge: 0, feverRemainingMs: FEVER_DURATION_MS, feverCooldownRemainingMs: FEVER_COOLDOWN_MS };
    }
    if (visitorsEnabled && canStart && state.runMaxTier >= 5 && !events.visitor && events.activeMs >= events.nextVisitorAtActiveMs) {
        const index = events.visitorSequence % 3;
        const kinds = ['merges', 'boxes', 'campaignDelivery'];
        const characters = ['sneakerCourier', 'pigeonInspector', 'watermelonCook'];
        const targets = [6, 3, 1];
        events = {
            ...events,
            visitorSequence: events.visitorSequence + 1,
            visitor: {
                id: `visitor-${events.visitorSequence + 1}`,
                character: characters[index],
                kind: kinds[index],
                target: targets[index],
                progress: 0,
                remainingMs: VISITOR_DURATION_MS
            }
        };
    }
    const retention = state.runMaxTier >= 18
        ? { ...state.retention, activeAfterT18Ms: state.retention.activeAfterT18Ms + elapsed }
        : state.retention;
    return { ...state, events, retention };
}
export function markSessionStart(state, now = Date.now()) {
    const safeNow = Math.max(state.retention.firstSeenAt, Math.floor(now));
    return { ...state, retention: { ...state.retention, lastSessionAt: safeNow, sessionCount: state.retention.sessionCount + 1 } };
}
export function recordVisitorProgress(state, kind, amount = 1) {
    const visitor = state.events.visitor;
    if (!visitor || visitor.kind !== kind || visitor.remainingMs <= 0 || amount <= 0)
        return state;
    const progress = Math.min(visitor.target, visitor.progress + Math.floor(amount));
    if (progress < visitor.target)
        return { ...state, events: { ...state.events, visitor: { ...visitor, progress } } };
    const reward = currentBrainBoxCost(state) * 2;
    return {
        ...state,
        coins: state.coins + reward,
        events: {
            ...state.events,
            visitor: null,
            nextVisitorAtActiveMs: state.events.activeMs + visitorScheduleDelay(state.events.visitorSequence)
        },
        messageKey: 'message.visitorComplete'
    };
}
export function spawnUnit(state, random = Math.random, free = false) {
    const current = reconcileAdBoostState(state);
    const cost = free ? 0 : currentBrainBoxCost(current);
    if (current.coins < cost)
        return { ...current, messageKey: 'message.notEnoughCoins' };
    const emptyIndexes = current.cells.flatMap((cell, index) => (cell === null ? [index] : []));
    if (emptyIndexes.length === 0)
        return { ...current, messageKey: 'message.boardFull' };
    const target = emptyIndexes[0];
    if (target === undefined)
        return state;
    const baseTier = brainBoxBaseTier(current);
    const luckyTier = random() < brainBoxLuckyChance(current) ? baseTier + 1 : baseTier;
    const normalSpawnTier = Math.max(1, Math.min(luckyTier, current.maxDiscoveredTier, MAX_RUNTIME_TIER));
    const mutationAttempted = !free && current.adBoosts.mutationCharge;
    const mutated = mutationAttempted && random() < AD_REWARDS_CONFIG.mutation.chance;
    const spawnTier = Math.max(1, Math.min(normalSpawnTier + (mutated ? AD_REWARDS_CONFIG.mutation.tierBonus : 0), current.maxDiscoveredTier, MAX_RUNTIME_TIER));
    const family = familyByTier.get(spawnTier) ?? FAMILIES[0];
    const cells = current.cells.slice();
    cells[target] = createUnit(family.id);
    return recordVisitorProgress({
        ...current,
        cells,
        coins: current.coins - cost,
        spawns: current.spawns + 1,
        paidBoxes: current.paidBoxes + (free ? 0 : 1),
        adBoosts: mutationAttempted ? { ...current.adBoosts, mutationCharge: false } : current.adBoosts,
        selectedIndex: null,
        messageKey: mutated
            ? 'message.mutationSuccess'
            : mutationAttempted
                ? 'message.mutationFailed'
                : free
                    ? (spawnTier > 1 ? 'message.rewardedSpawnBoosted' : 'message.rewardedSpawn')
                    : (spawnTier > 1 ? 'message.spawnedBoosted' : 'message.spawned')
    }, 'boxes');
}
export function moveOrMerge(state, from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= state.cells.length || to >= state.cells.length) {
        return { state, changed: false, merged: false, reason: 'empty-source' };
    }
    if (from === to)
        return { state: { ...state, selectedIndex: null }, changed: false, merged: false, reason: 'same-cell' };
    const source = state.cells[from];
    if (!source)
        return { state, changed: false, merged: false, reason: 'empty-source' };
    const target = state.cells[to] ?? null;
    const cells = state.cells.slice();
    if (target === null) {
        cells[to] = source;
        cells[from] = null;
        return {
            state: { ...state, cells, selectedIndex: null, messageKey: 'message.moved' },
            changed: true,
            merged: false
        };
    }
    if (target.familyId !== source.familyId) {
        return {
            state: { ...state, selectedIndex: null, messageKey: 'message.cannotMerge' },
            changed: false,
            merged: false,
            reason: 'mismatch'
        };
    }
    const nextFamily = nextFamilyFor(source.familyId);
    if (!nextFamily) {
        return {
            state: { ...state, selectedIndex: null, messageKey: 'message.nextFormNeeded' },
            changed: false,
            merged: false,
            reason: 'max-tier'
        };
    }
    const firstDiscovery = nextFamily.tier > state.maxDiscoveredTier;
    const comboCount = state.events.activeMs <= state.events.comboExpiresAtActiveMs ? Math.min(10, state.events.comboCount + 1) : 1;
    const comboBonusScale = comboCount === 3 ? 0.25 : comboCount === 6 ? 0.5 : comboCount === 10 ? 1 : 0;
    const feverMultiplier = state.events.feverRemainingMs > 0 ? 2 : 1;
    const baseCoinReward = mergeRewardForTier(nextFamily.tier) + (firstDiscovery ? discoveryBonusForTier(nextFamily.tier) : 0);
    const coinReward = Math.ceil(baseCoinReward * feverMultiplier + currentBrainBoxCost(state) * comboBonusScale);
    cells[from] = null;
    cells[to] = createUnit(nextFamily.id);
    return {
        state: recordVisitorProgress({
            ...state,
            cells,
            selectedIndex: null,
            merges: state.merges + 1,
            xp: state.xp + nextFamily.tier * 8,
            coins: state.coins + coinReward,
            maxDiscoveredTier: Math.max(state.maxDiscoveredTier, nextFamily.tier),
            runMaxTier: Math.max(state.runMaxTier, nextFamily.tier),
            events: {
                ...state.events,
                comboCount,
                comboExpiresAtActiveMs: state.events.activeMs + COMBO_WINDOW_MS,
                feverCharge: Math.min(FEVER_MERGES_REQUIRED, state.events.feverCharge + (state.events.feverRemainingMs > 0 ? 0 : 1))
            },
            retention: {
                ...state.retention,
                tier5ActiveMs: nextFamily.tier >= 5 && state.retention.tier5ActiveMs === null ? state.events.activeMs : state.retention.tier5ActiveMs,
                tier8ActiveMs: nextFamily.tier >= 8 && state.retention.tier8ActiveMs === null ? state.events.activeMs : state.retention.tier8ActiveMs,
                tier18ActiveMs: nextFamily.tier >= 18 && state.retention.tier18ActiveMs === null ? state.events.activeMs : state.retention.tier18ActiveMs
            },
            messageKey: firstDiscovery ? 'message.discovered' : 'message.merged'
        }, 'merges'),
        changed: true,
        merged: true
    };
}
export function productionPerMinute(state) {
    const base = state.cells.reduce((sum, cell) => {
        if (!cell)
            return sum;
        return sum + (familyById.get(cell.familyId)?.incomePerMinute ?? 0);
    }, 0);
    return base * incomeMultiplierForLevel(state.upgrades.income) * permanentIncomeMultiplier(state);
}
export function unitProductionPerMinute(state, familyId) {
    const family = familyById.get(familyId);
    if (!family)
        return 0;
    return family.incomePerMinute * incomeMultiplierForLevel(state.upgrades.income) * permanentIncomeMultiplier(state);
}
export function permanentIncomeMultiplier(state) {
    const claimedMilestones = COLLECTION_REWARD_TIERS.filter((tier) => state.collectionRewardClaims.includes(`collection-${tier}`)).length;
    return 1 + claimedMilestones * 0.05 + state.prestigeUpgrades.income * 0.10;
}
export function claimableCollectionRewardTiers(state) {
    return COLLECTION_REWARD_TIERS.filter((tier) => tier <= state.maxDiscoveredTier && !state.collectionRewardClaims.includes(`collection-${tier}`));
}
export function claimCollectionReward(state, tier) {
    if (!COLLECTION_REWARD_TIERS.includes(tier))
        return state;
    const id = `collection-${tier}`;
    if (tier > state.maxDiscoveredTier || state.collectionRewardClaims.includes(id))
        return state;
    return { ...state, collectionRewardClaims: [...state.collectionRewardClaims, id], messageKey: 'message.collectionRewardClaimed' };
}
export function canPrestige(state) {
    return state.runMaxTier >= MAX_RUNTIME_TIER;
}
export function prestigeUpgradeCost(level) {
    return level >= MAX_PRESTIGE_UPGRADE_LEVEL ? null : Math.max(1, Math.floor(level) + 1);
}
export function purchasePrestigeUpgrade(state, id) {
    if (!(id in state.prestigeUpgrades))
        return state;
    const level = state.prestigeUpgrades[id];
    const cost = prestigeUpgradeCost(level);
    if (cost === null)
        return { ...state, messageKey: 'message.upgradeMaxed' };
    if (state.brainCells < cost)
        return { ...state, messageKey: 'message.notEnoughBrainCells' };
    return {
        ...state,
        brainCells: state.brainCells - cost,
        prestigeUpgrades: { ...state.prestigeUpgrades, [id]: level + 1 },
        messageKey: 'message.prestigeUpgradePurchased'
    };
}
export function performPrestige(state, now = Date.now()) {
    if (!canPrestige(state))
        return state;
    const reset = createInitialState(now);
    return {
        ...reset,
        saveRevision: state.saveRevision,
        savedAt: state.savedAt,
        coins: reset.coins + state.prestigeUpgrades.startingCoins * 100,
        maxDiscoveredTier: state.maxDiscoveredTier,
        collectionRewardClaims: [...state.collectionRewardClaims],
        prestigeCount: state.prestigeCount + 1,
        brainCells: state.brainCells + PRESTIGE_REWARD_CELLS,
        prestigeUpgrades: { ...state.prestigeUpgrades },
        campaign: state.campaign,
        campaignRun: state.campaignRun,
        raidRun: state.raidRun,
        retention: {
            ...state.retention,
            firstPrestigeActiveMs: state.retention.firstPrestigeActiveMs ?? state.events.activeMs
        },
        messageKey: 'message.prestigeComplete'
    };
}
function accrueForSeconds(state, elapsedSeconds, destination, multiplier = 1) {
    const seconds = Math.max(0, elapsedSeconds);
    const gross = productionPerMinute(state) / 60 * multiplier * seconds + state.incomeRemainder;
    const wholeCoins = Math.max(0, Math.floor(gross));
    const incomeRemainder = Math.max(0, Math.min(0.999999, gross - wholeCoins));
    if (destination === 'offline') {
        return {
            ...state,
            pendingOfflineCoins: state.pendingOfflineCoins + wholeCoins,
            incomeRemainder
        };
    }
    return {
        ...state,
        coins: state.coins + wholeCoins,
        incomeRemainder
    };
}
function accrueAcrossCoinBoostWindow(state, startAt, endAt, destination) {
    const start = Math.max(0, Math.floor(startAt));
    const end = Math.max(start, Math.floor(endAt));
    const expiry = state.adBoosts.coinBoostExpiresAt;
    if (expiry === null || expiry <= start)
        return accrueForSeconds(state, (end - start) / 1000, destination);
    const boostedEnd = Math.min(end, expiry);
    let accrued = accrueForSeconds(state, (boostedEnd - start) / 1000, destination, AD_REWARDS_CONFIG.coinBoost.multiplier);
    if (end > boostedEnd)
        accrued = accrueForSeconds(accrued, (end - boostedEnd) / 1000, destination);
    return accrued;
}
export function accrueOnlineIncome(state, now = Date.now()) {
    const safeNow = Math.max(0, Math.floor(now));
    const current = reconcileAdBoostState(state, safeNow);
    if (safeNow <= current.lastAccrualAt)
        return current;
    const accrued = accrueAcrossCoinBoostWindow(current, current.lastAccrualAt, safeNow, 'coins');
    return { ...accrued, lastAccrualAt: safeNow };
}
export function accrueOfflineIncome(state, now = Date.now()) {
    const safeNow = Math.max(0, Math.floor(now));
    const current = reconcileAdBoostState(state, safeNow);
    if (safeNow <= current.lastAccrualAt)
        return current;
    const elapsedSeconds = (safeNow - current.lastAccrualAt) / 1000;
    const capSeconds = (offlineHoursForLevel(current.upgrades.offline) + current.prestigeUpgrades.offline) * 60 * 60;
    const creditedSeconds = Math.min(elapsedSeconds, capSeconds);
    const creditedEnd = current.lastAccrualAt + Math.floor(creditedSeconds * 1000);
    const next = accrueAcrossCoinBoostWindow(current, current.lastAccrualAt, creditedEnd, 'offline');
    return {
        ...next,
        lastAccrualAt: safeNow,
        messageKey: next.pendingOfflineCoins > current.pendingOfflineCoins ? 'message.offlineReady' : current.messageKey
    };
}
export function claimOfflineIncome(state) {
    if (state.pendingOfflineCoins <= 0)
        return state;
    return {
        ...state,
        coins: state.coins + state.pendingOfflineCoins,
        pendingOfflineCoins: 0,
        messageKey: 'message.offlineClaimed'
    };
}
export function upgradeRequiredDiscoveryTier(id, currentLevel) {
    if (id !== 'boxBaseTier')
        return null;
    // The purchased base tier is currentLevel + 2. Keep it four tiers behind
    // current run progress so Boxes accelerate rebuilding without replacing merges.
    return Math.min(18, Math.max(6, Math.floor(currentLevel) + 6));
}
export function canPurchaseUpgrade(state, id) {
    const currentLevel = state.upgrades[id];
    const cost = upgradeCost(id, currentLevel);
    if (cost === null || state.coins < cost)
        return false;
    const requiredTier = upgradeRequiredDiscoveryTier(id, currentLevel);
    return requiredTier === null || state.runMaxTier >= requiredTier;
}
export function affordableUpgradeIds(state) {
    return UPGRADE_DEFINITIONS
        .map((upgrade) => upgrade.id)
        .filter((id) => canPurchaseUpgrade(state, id));
}
export function purchaseUpgrade(state, id) {
    const currentLevel = state.upgrades[id];
    const cost = upgradeCost(id, currentLevel);
    if (cost === null)
        return { ...state, messageKey: 'message.upgradeMaxed' };
    const requiredTier = upgradeRequiredDiscoveryTier(id, currentLevel);
    if (requiredTier !== null && state.runMaxTier < requiredTier) {
        return { ...state, messageKey: 'message.upgradeLocked' };
    }
    if (state.coins < cost)
        return { ...state, messageKey: 'message.notEnoughCoins' };
    return {
        ...state,
        coins: state.coins - cost,
        upgrades: { ...state.upgrades, [id]: currentLevel + 1 },
        messageKey: 'message.upgradePurchased'
    };
}
export function selectCell(state, index) {
    if (index === null || index < 0 || index >= state.cells.length || state.cells[index] == null)
        return { ...state, selectedIndex: null };
    return { ...state, selectedIndex: index };
}
export function canMerge(a, b) {
    return Boolean(a && b && a.familyId === b.familyId && nextFamilyFor(a.familyId));
}
export function findFirstMergePair(state) {
    for (let i = 0; i < state.cells.length; i += 1) {
        const a = state.cells[i];
        if (!a)
            continue;
        for (let j = i + 1; j < state.cells.length; j += 1) {
            if (canMerge(a, state.cells[j] ?? null))
                return [i, j];
        }
    }
    return null;
}
export function findBestMergePair(state) {
    let best = null;
    let bestTier = -1;
    for (let i = 0; i < state.cells.length; i += 1) {
        const a = state.cells[i];
        if (!a)
            continue;
        for (let j = i + 1; j < state.cells.length; j += 1) {
            const b = state.cells[j] ?? null;
            if (!canMerge(a, b))
                continue;
            if (a.tier > bestTier) {
                best = [i, j];
                bestTier = a.tier;
            }
        }
    }
    return best;
}
export function hasAnyMerge(state) {
    return findFirstMergePair(state) !== null;
}
export function isBoardFull(state) {
    return state.cells.every(Boolean);
}
export function isDeadlocked(state) {
    return isBoardFull(state) && !hasAnyMerge(state);
}
export function rescueDeadlock(state) {
    if (!isDeadlocked(state))
        return state;
    const terminalIndex = state.cells.findIndex((cell) => cell?.tier === MAX_RUNTIME_TIER);
    let targetIndex = terminalIndex;
    if (targetIndex < 0) {
        let highestTier = Number.NEGATIVE_INFINITY;
        state.cells.forEach((cell, index) => {
            if (cell && cell.tier > highestTier) {
                highestTier = cell.tier;
                targetIndex = index;
            }
        });
    }
    if (targetIndex < 0)
        return state;
    const cells = state.cells.slice();
    cells[targetIndex] = null;
    return {
        ...state,
        cells,
        coins: state.coins + DEADLOCK_RESCUE_REFUND,
        selectedIndex: null,
        messageKey: 'message.rescued'
    };
}
export function activeMission(state) {
    return MISSION_TRACK[state.missionIndex] ?? null;
}
export function missionValue(state, mission) {
    if (mission.kind === 'merges')
        return state.merges;
    if (mission.kind === 'spawns')
        return state.spawns;
    return state.runMaxTier;
}
export function missionProgress(state, mission) {
    return Math.min(mission.target, missionValue(state, mission));
}
export function canClaimCurrentMission(state) {
    const mission = activeMission(state);
    return Boolean(mission && missionValue(state, mission) >= mission.target);
}
export function claimCurrentMission(state) {
    const mission = activeMission(state);
    if (!mission || !canClaimCurrentMission(state))
        return state;
    return {
        ...state,
        coins: state.coins + mission.reward,
        missionIndex: Math.min(MISSION_TRACK.length, state.missionIndex + 1),
        messageKey: state.missionIndex + 1 >= MISSION_TRACK.length ? 'message.missionTrackComplete' : 'message.missionClaimed'
    };
}
export function nextActionHint(state) {
    if (state.pendingOfflineCoins > 0)
        return { kind: 'offline', amount: state.pendingOfflineCoins };
    const mission = activeMission(state);
    if (mission && canClaimCurrentMission(state))
        return { kind: 'mission', amount: mission.reward };
    if (isDeadlocked(state))
        return { kind: 'rescue' };
    if (findBestMergePair(state))
        return { kind: 'merge' };
    const readyUpgrades = affordableUpgradeIds(state);
    if (readyUpgrades.length > 0)
        return { kind: 'upgrade', upgradeCount: readyUpgrades.length };
    if (state.runMaxTier >= MAX_RUNTIME_TIER && mission === null)
        return { kind: 'complete' };
    const cost = currentBrainBoxCost(state);
    if (!isBoardFull(state) && state.coins >= cost)
        return { kind: 'box', cost };
    const rate = productionPerMinute(state);
    if (!isBoardFull(state) && rate > 0) {
        const missing = Math.max(0, cost - state.coins);
        return { kind: 'wait', cost, minutes: Math.max(1, Math.ceil(missing / rate)) };
    }
    return { kind: 'complete', nextTier: Math.min(MAX_RUNTIME_TIER, state.maxDiscoveredTier + 1) };
}
export function canClaimFirstMission(state) {
    return state.missionIndex === 0 && canClaimCurrentMission(state);
}
export function claimFirstMission(state) {
    if (state.missionIndex !== 0)
        return state;
    return claimCurrentMission(state);
}
export function onboardingPhase(state) {
    if (state.merges === 0)
        return 'merge';
    if (state.spawns === 0)
        return 'spawn';
    return 'complete';
}
export function xpForLevel(level) {
    const safeLevel = Math.max(1, Math.floor(level));
    return 40 * (safeLevel - 1) ** 2;
}
export function playerLevel(xp) {
    return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1);
}
export function playerLevelProgress(xp) {
    const level = playerLevel(xp);
    const current = xpForLevel(level);
    const next = xpForLevel(level + 1);
    if (next <= current)
        return 0;
    return Math.max(0, Math.min(1, (Math.max(0, xp) - current) / (next - current)));
}
