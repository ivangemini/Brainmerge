import { BOARD_SIZE, DEADLOCK_RESCUE_REFUND, FAMILIES, MAX_BOX_BASE_TIER_LEVEL, MAX_RUNTIME_TIER, MISSION_TRACK, UPGRADE_DEFINITIONS, brainBoxCostForPurchases, discoveryBonusForTier, familyById, familyByTier, incomeMultiplierForLevel, luckyDropChanceForLevel, maxUpgradeLevel, mergeRewardForTier, nextFamilyFor, offlineHoursForLevel, upgradeCost } from './catalog.js';
import { sanitizeCampaignRunState } from './campaign-run.js';
import { createInitialCampaignProgress, sanitizeCampaignProgress } from './campaign.js';
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
        income: sanitizeNonnegativeInt(raw.income, 20),
        boxDiscount: sanitizeNonnegativeInt(raw.boxDiscount, 20),
        startingCoins: sanitizeNonnegativeInt(raw.startingCoins, 20),
        offline: sanitizeNonnegativeInt(raw.offline, 20),
        campaignPower: sanitizeNonnegativeInt(raw.campaignPower, 20)
    };
}
export function createInitialState(now = Date.now()) {
    const cells = Array.from({ length: BOARD_SIZE }, () => null);
    for (let index = 0; index < 4; index += 1)
        cells[index] = createUnit('toilet-buddy');
    return {
        version: 6,
        cells,
        coins: 100,
        xp: 0,
        merges: 0,
        spawns: 0,
        paidBoxes: 0,
        maxDiscoveredTier: 1,
        missionIndex: 0,
        upgrades: { ...DEFAULT_UPGRADES },
        incomeRemainder: 0,
        lastAccrualAt: Math.max(0, Math.floor(now)),
        pendingOfflineCoins: 0,
        collectionRewardClaims: [],
        prestigeCount: 0,
        brainCells: 0,
        prestigeUpgrades: { ...DEFAULT_PRESTIGE_UPGRADES },
        campaign: createInitialCampaignProgress(),
        campaignRun: null,
        selectedIndex: null,
        messageKey: 'message.welcome'
    };
}
export function sanitizeState(candidate, now = Date.now()) {
    if (!candidate || typeof candidate !== 'object')
        return null;
    const state = candidate;
    const version = typeof state.version === 'number' ? state.version : 0;
    if (![1, 2, 3, 4, 5, 6].includes(version)
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
    const savedDiscovered = version >= 3 && typeof state.maxDiscoveredTier === 'number'
        ? Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(state.maxDiscoveredTier)))
        : discoveredFromBoard;
    const maxDiscoveredTier = Math.max(discoveredFromBoard, savedDiscovered);
    const spawns = version >= 2 && typeof state.spawns === 'number'
        ? Math.max(0, Math.floor(state.spawns))
        : 0;
    let missionIndex = 0;
    if (version >= 4 && typeof state.missionIndex === 'number') {
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
    return {
        version: 6,
        cells,
        coins: Math.max(0, Math.floor(state.coins)),
        xp: Math.max(0, Math.floor(state.xp)),
        merges: Math.max(0, Math.floor(state.merges)),
        spawns,
        paidBoxes: version >= 5 && typeof state.paidBoxes === 'number' && Number.isFinite(state.paidBoxes)
            ? Math.max(0, Math.floor(state.paidBoxes))
            : 0,
        maxDiscoveredTier,
        missionIndex,
        upgrades: version >= 5 ? sanitizeUpgrades(state.upgrades) : { ...DEFAULT_UPGRADES },
        incomeRemainder,
        lastAccrualAt,
        pendingOfflineCoins,
        collectionRewardClaims: version >= 6 ? sanitizeCollectionRewardClaims(state.collectionRewardClaims) : [],
        prestigeCount: version >= 6 ? sanitizeNonnegativeInt(state.prestigeCount, 1_000_000) : 0,
        brainCells: version >= 6 ? sanitizeNonnegativeInt(state.brainCells, 1_000_000_000) : 0,
        prestigeUpgrades: version >= 6 ? sanitizePrestigeUpgrades(state.prestigeUpgrades) : { ...DEFAULT_PRESTIGE_UPGRADES },
        campaign,
        campaignRun,
        selectedIndex: null,
        messageKey: null
    };
}
export function currentBrainBoxCost(state) {
    return brainBoxCostForPurchases(state.paidBoxes);
}
export function brainBoxBaseTier(state) {
    return Math.max(1, Math.min(1 + state.upgrades.boxBaseTier, state.maxDiscoveredTier, MAX_RUNTIME_TIER));
}
export function brainBoxLuckyChance(state) {
    return luckyDropChanceForLevel(state.upgrades.luckyDrop);
}
export function spawnUnit(state, random = Math.random, free = false) {
    const cost = free ? 0 : currentBrainBoxCost(state);
    if (state.coins < cost)
        return { ...state, messageKey: 'message.notEnoughCoins' };
    const emptyIndexes = state.cells.flatMap((cell, index) => (cell === null ? [index] : []));
    if (emptyIndexes.length === 0)
        return { ...state, messageKey: 'message.boardFull' };
    const target = emptyIndexes[0];
    if (target === undefined)
        return state;
    const baseTier = brainBoxBaseTier(state);
    const luckyTier = random() < brainBoxLuckyChance(state) ? baseTier + 1 : baseTier;
    const spawnTier = Math.max(1, Math.min(luckyTier, state.maxDiscoveredTier, MAX_RUNTIME_TIER));
    const family = familyByTier.get(spawnTier) ?? FAMILIES[0];
    const cells = state.cells.slice();
    cells[target] = createUnit(family.id);
    return {
        ...state,
        cells,
        coins: state.coins - cost,
        spawns: state.spawns + 1,
        paidBoxes: state.paidBoxes + (free ? 0 : 1),
        selectedIndex: null,
        messageKey: free
            ? (spawnTier > 1 ? 'message.rewardedSpawnBoosted' : 'message.rewardedSpawn')
            : (spawnTier > 1 ? 'message.spawnedBoosted' : 'message.spawned')
    };
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
    const coinReward = mergeRewardForTier(nextFamily.tier)
        + (firstDiscovery ? discoveryBonusForTier(nextFamily.tier) : 0);
    cells[from] = null;
    cells[to] = createUnit(nextFamily.id);
    return {
        state: {
            ...state,
            cells,
            selectedIndex: null,
            merges: state.merges + 1,
            xp: state.xp + nextFamily.tier * 8,
            coins: state.coins + coinReward,
            maxDiscoveredTier: Math.max(state.maxDiscoveredTier, nextFamily.tier),
            messageKey: firstDiscovery ? 'message.discovered' : 'message.merged'
        },
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
    return base * incomeMultiplierForLevel(state.upgrades.income);
}
export function unitProductionPerMinute(state, familyId) {
    const family = familyById.get(familyId);
    if (!family)
        return 0;
    return family.incomePerMinute * incomeMultiplierForLevel(state.upgrades.income);
}
function accrueForSeconds(state, elapsedSeconds, destination) {
    const seconds = Math.max(0, elapsedSeconds);
    const gross = productionPerMinute(state) / 60 * seconds + state.incomeRemainder;
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
export function accrueOnlineIncome(state, now = Date.now()) {
    const safeNow = Math.max(0, Math.floor(now));
    if (safeNow <= state.lastAccrualAt)
        return state;
    const elapsedSeconds = (safeNow - state.lastAccrualAt) / 1000;
    return { ...accrueForSeconds(state, elapsedSeconds, 'coins'), lastAccrualAt: safeNow };
}
export function accrueOfflineIncome(state, now = Date.now()) {
    const safeNow = Math.max(0, Math.floor(now));
    if (safeNow <= state.lastAccrualAt)
        return state;
    const elapsedSeconds = (safeNow - state.lastAccrualAt) / 1000;
    const capSeconds = offlineHoursForLevel(state.upgrades.offline) * 60 * 60;
    const creditedSeconds = Math.min(elapsedSeconds, capSeconds);
    const next = accrueForSeconds(state, creditedSeconds, 'offline');
    return {
        ...next,
        lastAccrualAt: safeNow,
        messageKey: next.pendingOfflineCoins > state.pendingOfflineCoins ? 'message.offlineReady' : state.messageKey
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
    return Math.min(MAX_RUNTIME_TIER, Math.max(2, Math.floor(currentLevel) + 2));
}
export function canPurchaseUpgrade(state, id) {
    const currentLevel = state.upgrades[id];
    const cost = upgradeCost(id, currentLevel);
    if (cost === null || state.coins < cost)
        return false;
    const requiredTier = upgradeRequiredDiscoveryTier(id, currentLevel);
    return requiredTier === null || state.maxDiscoveredTier >= requiredTier;
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
    if (requiredTier !== null && state.maxDiscoveredTier < requiredTier) {
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
    return state.maxDiscoveredTier;
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
    if (state.maxDiscoveredTier >= MAX_RUNTIME_TIER && mission === null)
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
