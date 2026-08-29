import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accrueOfflineIncome,
  accrueOnlineIncome,
  activeMission,
  brainBoxBaseTier,
  brainBoxLuckyChance,
  canClaimCurrentMission,
  canClaimFirstMission,
  canPurchaseUpgrade,
  claimCurrentMission,
  claimFirstMission,
  claimOfflineIncome,
  createInitialState,
  currentBrainBoxCost,
  findBestMergePair,
  hasAnyMerge,
  isBoardFull,
  isDeadlocked,
  missionProgress,
  moveOrMerge,
  onboardingPhase,
  playerLevel,
  playerLevelProgress,
  productionPerMinute,
  purchaseUpgrade,
  rescueDeadlock,
  sanitizeState,
  spawnUnit
} from '../build/core/game.js';
import {
  BASE_BOX_COST,
  BOARD_SIZE,
  BOX_COST_GROWTH,
  FAMILIES,
  FIRST_MISSION_REWARD,
  MAX_RUNTIME_TIER,
  MISSION_TRACK,
  UPGRADE_DEFINITIONS,
  brainBoxCostForPurchases,
  discoveryBonusForTier,
  incomeMultiplierForLevel,
  luckyDropChanceForLevel,
  mergeRewardForTier,
  nextFamilyFor,
  offlineHoursForLevel
} from '../build/core/catalog.js';
import { localeFromLanguage } from '../build/i18n/i18n.js';

function claimEverythingReady(state) {
  let next = state;
  let guard = 0;
  while (canClaimCurrentMission(next) && guard < MISSION_TRACK.length + 1) {
    guard += 1;
    next = claimCurrentMission(next);
  }
  return next;
}

function waitUntilAffordable(state, now) {
  const cost = currentBrainBoxCost(state);
  if (state.coins >= cost) return { state, now };
  const rate = productionPerMinute(state);
  assert.ok(rate > 0, 'board must produce coins before waiting for a Brain Box');
  const missing = cost - state.coins;
  const waitMs = Math.ceil(missing / rate * 60_000) + 1_000;
  const nextNow = now + waitMs;
  return { state: accrueOnlineIncome(state, nextNow), now: nextNow };
}

test('core progression is one ordered eight-character merge chain', () => {
  assert.deepEqual(FAMILIES.map((family) => family.id), [
    'toilet-buddy',
    'camera-dude',
    'sigma-rock',
    'rizz-head',
    'shark-sneakers',
    'crocodile-bomber',
    'coffee-ballerina',
    'tung-wood'
  ]);
  assert.equal(MAX_RUNTIME_TIER, 8);
  assert.equal(nextFamilyFor('toilet-buddy')?.id, 'camera-dude');
  assert.equal(nextFamilyFor('coffee-ballerina')?.id, 'tung-wood');
  assert.equal(nextFamilyFor('tung-wood'), null);
});

test('passive production ladder makes every merge production-positive', () => {
  for (let index = 1; index < FAMILIES.length; index += 1) {
    const previous = FAMILIES[index - 1];
    const next = FAMILIES[index];
    assert.ok(next.incomePerMinute > previous.incomePerMinute * 2, `${previous.id} -> ${next.id} must increase production after merging two units`);
  }
  const initial = createInitialState(0);
  const merged = moveOrMerge(initial, 0, 1).state;
  assert.ok(productionPerMinute(merged) > productionPerMinute(initial));
});

test('first-cycle mission track remains ordered around natural chain milestones', () => {
  assert.deepEqual(MISSION_TRACK.map((mission) => [mission.kind, mission.target]), [
    ['merges', 6],
    ['discover', 4],
    ['spawns', 12],
    ['discover', 5],
    ['merges', 30],
    ['discover', 6],
    ['discover', 7],
    ['discover', 8]
  ]);
  assert.ok(MISSION_TRACK.every((mission) => mission.reward > 0));
});

test('upgrade catalog exposes four bounded coin sinks', () => {
  assert.deepEqual(UPGRADE_DEFINITIONS.map((upgrade) => upgrade.id), ['boxBaseTier', 'luckyDrop', 'income', 'offline']);
  assert.ok(UPGRADE_DEFINITIONS.every((upgrade) => upgrade.costs.length > 0 && upgrade.costs.every((cost) => cost > 0)));
  assert.equal(luckyDropChanceForLevel(5), 0.30);
  assert.equal(incomeMultiplierForLevel(5), 2);
  assert.equal(offlineHoursForLevel(4), 12);
});

test('runtime character presentation stays inside safe normalization bounds', () => {
  for (const family of FAMILIES) {
    assert.ok(family.presentation.scale >= 0.7 && family.presentation.scale <= 1.25, `${family.id} scale`);
    assert.ok(family.presentation.yPercent >= -4 && family.presentation.yPercent <= 12, `${family.id} yPercent`);
    assert.ok(family.presentation.shadowScale >= 0.65 && family.presentation.shadowScale <= 1.1, `${family.id} shadowScale`);
    assert.ok(family.presentation.collectionScale >= 0.75 && family.presentation.collectionScale <= 1.2, `${family.id} collectionScale`);
  }
});

test('two identical characters merge into the next character identity', () => {
  const state = createInitialState(0);
  const result = moveOrMerge(state, 0, 1);
  assert.equal(result.merged, true);
  assert.equal(result.state.cells[0], null);
  assert.equal(result.state.cells[1]?.familyId, 'camera-dude');
  assert.equal(result.state.cells[1]?.tier, 2);
  assert.equal(result.state.maxDiscoveredTier, 2);
  assert.equal(result.state.merges, 1);
});

test('different characters do not merge', () => {
  const base = createInitialState(0);
  const camera = moveOrMerge(base, 0, 1).state;
  const result = moveOrMerge(camera, 1, 2);
  assert.equal(result.merged, false);
  assert.equal(result.reason, 'mismatch');
});

test('Brain Box paid price escalates with paid purchases', () => {
  assert.equal(BASE_BOX_COST, 20);
  assert.ok(BOX_COST_GROWTH > 1);
  assert.equal(brainBoxCostForPurchases(0), BASE_BOX_COST);
  assert.ok(brainBoxCostForPurchases(10) > brainBoxCostForPurchases(5));
  assert.ok(brainBoxCostForPurchases(50) > brainBoxCostForPurchases(10));

  const state = createInitialState(0);
  const firstCost = currentBrainBoxCost(state);
  const next = spawnUnit(state, () => 0.99);
  assert.equal(next.coins, state.coins - firstCost);
  assert.equal(next.paidBoxes, 1);
  assert.equal(next.spawns, 1);
  assert.ok(currentBrainBoxCost(next) > firstCost);
});

test('rewarded Brain Box is free and does not inflate paid-box price', () => {
  const state = createInitialState(0);
  const beforeCost = currentBrainBoxCost(state);
  const next = spawnUnit(state, () => 0, true);
  assert.equal(next.coins, state.coins);
  assert.equal(next.paidBoxes, 0);
  assert.equal(next.spawns, 1);
  assert.equal(currentBrainBoxCost(next), beforeCost);
});

test('Brain Box upgrades can rebuild discovered tiers but never reveal a new one', () => {
  const state = {
    ...createInitialState(0),
    coins: 10_000,
    maxDiscoveredTier: 3,
    upgrades: { boxBaseTier: 2, luckyDrop: 5, income: 0, offline: 0 }
  };
  assert.equal(brainBoxBaseTier(state), 3);
  assert.equal(brainBoxLuckyChance(state), 0.30);
  const lucky = spawnUnit(state, () => 0);
  assert.equal(lucky.cells[4]?.tier, 3, 'lucky +1 must cap to maxDiscoveredTier');
  assert.equal(lucky.maxDiscoveredTier, 3, 'box must not discover T4');
});

test('base-drop upgrade is discovery-gated and purchases consume coins', () => {
  const locked = { ...createInitialState(0), coins: 10_000 };
  assert.equal(canPurchaseUpgrade(locked, 'boxBaseTier'), false);
  assert.equal(purchaseUpgrade(locked, 'boxBaseTier').messageKey, 'message.upgradeLocked');

  const discovered = moveOrMerge(locked, 0, 1).state;
  assert.equal(discovered.maxDiscoveredTier, 2);
  assert.equal(canPurchaseUpgrade(discovered, 'boxBaseTier'), true);
  const upgraded = purchaseUpgrade(discovered, 'boxBaseTier');
  assert.equal(upgraded.upgrades.boxBaseTier, 1);
  assert.ok(upgraded.coins < discovered.coins);
  assert.equal(brainBoxBaseTier(upgraded), 2);
});

test('income upgrade multiplies the whole board rather than individual merge rewards', () => {
  const base = createInitialState(0);
  const rate = productionPerMinute(base);
  const upgraded = { ...base, upgrades: { ...base.upgrades, income: 1 } };
  assert.equal(productionPerMinute(upgraded), rate * incomeMultiplierForLevel(1));
});

test('online passive income accrual is deterministic and preserves fractional remainder', () => {
  let state = createInitialState(0);
  assert.equal(productionPerMinute(state), 12);
  state = accrueOnlineIncome(state, 1_000);
  assert.equal(state.coins, 100);
  assert.ok(state.incomeRemainder > 0 && state.incomeRemainder < 1);
  state = accrueOnlineIncome(state, 5_000);
  assert.equal(state.coins, 101);
  assert.equal(state.lastAccrualAt, 5_000);
  state = accrueOnlineIncome(state, 30_000);
  assert.equal(state.coins, 106);
});

test('offline income is capped, explicit to collect, and cannot be double-claimed', () => {
  const state = createInitialState(0);
  const afterTenHours = accrueOfflineIncome(state, 10 * 60 * 60 * 1000);
  // Default cap = 2h, initial board = 12 coins/min => 1440 coins stored.
  assert.equal(afterTenHours.pendingOfflineCoins, 1_440);
  assert.equal(afterTenHours.coins, state.coins);
  const claimed = claimOfflineIncome(afterTenHours);
  assert.equal(claimed.coins, state.coins + 1_440);
  assert.equal(claimed.pendingOfflineCoins, 0);
  assert.deepEqual(claimOfflineIncome(claimed), claimed);
});

test('clock rollback does not create duplicate passive income', () => {
  const state = { ...createInitialState(10_000), coins: 100 };
  const rolledBack = accrueOnlineIncome(state, 5_000);
  assert.equal(rolledBack.coins, 100);
  assert.equal(rolledBack.lastAccrualAt, 10_000);
  const backToOriginal = accrueOnlineIncome(rolledBack, 10_000);
  assert.equal(backToOriginal.coins, 100);
});

test('first discovery bonus is paid once, then repeat merges use base reward', () => {
  const base = createInitialState(0);
  const first = moveOrMerge(base, 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const beforeDiscovery = second.coins;
  const discovered = moveOrMerge(second, 1, 3).state;
  assert.equal(discovered.maxDiscoveredTier, 3);
  assert.equal(discovered.messageKey, 'message.discovered');
  assert.equal(discovered.coins - beforeDiscovery, mergeRewardForTier(3) + discoveryBonusForTier(3));

  const repeatBase = { ...discovered, cells: discovered.cells.map(() => null), maxDiscoveredTier: 3 };
  repeatBase.cells[0] = { id: 'cam-a', familyId: 'camera-dude', tier: 2 };
  repeatBase.cells[1] = { id: 'cam-b', familyId: 'camera-dude', tier: 2 };
  const repeated = moveOrMerge(repeatBase, 0, 1).state;
  assert.equal(repeated.messageKey, 'message.merged');
  assert.equal(repeated.coins - repeatBase.coins, mergeRewardForTier(3));
});

test('initial state starts save v5 with immediate merge and economy defaults', () => {
  const state = createInitialState(1234);
  assert.equal(state.version, 5);
  assert.equal(state.missionIndex, 0);
  assert.equal(state.paidBoxes, 0);
  assert.deepEqual(state.upgrades, { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 });
  assert.equal(state.lastAccrualAt, 1234);
  assert.equal(state.cells.filter(Boolean).length, 4);
  assert.equal(hasAnyMerge(state), true);
});

test('best merge hint prefers the highest-tier available pair', () => {
  const base = createInitialState(0);
  const first = moveOrMerge(base, 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const cells = second.cells.slice();
  cells[4] = { id: 't1-a', familyId: 'toilet-buddy', tier: 1 };
  cells[5] = { id: 't1-b', familyId: 'toilet-buddy', tier: 1 };
  assert.deepEqual(findBestMergePair({ ...second, cells }), [1, 3]);
});

test('legacy v2 save migrates chain identity and mission completion into save v5', () => {
  const current = createInitialState(0);
  const cells = current.cells.slice();
  cells[0] = { id: 'legacy-shark', familyId: 'shark-sneakers', tier: 1 };
  const legacy = {
    version: 2,
    cells,
    coins: 55,
    xp: 22,
    merges: 9,
    spawns: 4,
    missionClaimed: true,
    selectedIndex: 1,
    messageKey: 'message.moved'
  };
  const migrated = sanitizeState(legacy, 50_000);
  assert.equal(migrated?.version, 5);
  assert.equal(migrated?.cells[0]?.tier, 5);
  assert.equal(migrated?.maxDiscoveredTier, 5);
  assert.equal(migrated?.missionIndex, 1);
  assert.equal(migrated?.paidBoxes, 0);
  assert.deepEqual(migrated?.upgrades, { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0 });
  assert.equal(migrated?.lastAccrualAt, 50_000);
  assert.equal(migrated?.selectedIndex, null);
});

test('save v5 clamps corrupted economy fields safely', () => {
  const current = createInitialState(10_000);
  const restored = sanitizeState({
    ...current,
    missionIndex: 999,
    maxDiscoveredTier: 999,
    paidBoxes: -20,
    upgrades: { boxBaseTier: 999, luckyDrop: -5, income: 999, offline: 999 },
    incomeRemainder: 99,
    lastAccrualAt: 999_999,
    pendingOfflineCoins: -40
  }, 20_000);
  assert.equal(restored?.missionIndex, MISSION_TRACK.length);
  assert.equal(restored?.maxDiscoveredTier, MAX_RUNTIME_TIER);
  assert.equal(restored?.paidBoxes, 0);
  assert.equal(restored?.upgrades.boxBaseTier, 3);
  assert.equal(restored?.upgrades.luckyDrop, 0);
  assert.equal(restored?.upgrades.income, 5);
  assert.equal(restored?.upgrades.offline, 4);
  assert.ok((restored?.incomeRemainder ?? 0) < 1);
  assert.equal(restored?.lastAccrualAt, 20_000);
  assert.equal(restored?.pendingOfflineCoins, 0);
});

test('collection discovery persists after lower characters are consumed', () => {
  const first = moveOrMerge(createInitialState(0), 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const third = moveOrMerge(second, 1, 3).state;
  const restored = sanitizeState(third, 0);
  assert.equal(restored?.maxDiscoveredTier, 3);
});

test('first mission compatibility wrapper advances into mission journey', () => {
  const state = { ...createInitialState(0), merges: 6, coins: 10 };
  assert.equal(canClaimFirstMission(state), true);
  const claimed = claimFirstMission(state);
  assert.equal(claimed.coins, 10 + FIRST_MISSION_REWARD);
  assert.equal(claimed.missionIndex, 1);
});

test('mission progress reads the correct cumulative signal', () => {
  const base = { ...createInitialState(0), merges: 11, spawns: 7, maxDiscoveredTier: 4 };
  assert.equal(missionProgress(base, MISSION_TRACK[0]), 6);
  assert.equal(missionProgress(base, MISSION_TRACK[1]), 4);
  assert.equal(missionProgress(base, MISSION_TRACK[2]), 7);
});

test('idle economy can progress from fresh save to T8 without rewarded ads or negative coins', () => {
  let now = 0;
  let state = createInitialState(now);
  let guard = 0;
  let waitedMs = 0;

  while ((state.maxDiscoveredTier < MAX_RUNTIME_TIER || activeMission(state)) && guard < 900) {
    guard += 1;
    state = claimEverythingReady(state);
    if (!activeMission(state) && state.maxDiscoveredTier >= MAX_RUNTIME_TIER) break;

    const pair = findBestMergePair(state);
    if (pair) {
      state = moveOrMerge(state, pair[0], pair[1]).state;
      continue;
    }

    const waited = waitUntilAffordable(state, now);
    state = waited.state;
    waitedMs += waited.now - now;
    now = waited.now;
    assert.ok(state.coins >= currentBrainBoxCost(state));
    state = spawnUnit(state, () => 0.99);
    assert.ok(state.coins >= 0);
  }

  state = claimEverythingReady(state);
  assert.ok(guard < 900, 'idle economy smoke loop should converge');
  assert.equal(state.maxDiscoveredTier, MAX_RUNTIME_TIER);
  assert.equal(state.missionIndex, MISSION_TRACK.length);
  assert.ok(waitedMs > 0, 'new economy should include meaningful production time instead of free instant T8');
});

test('deadlock rescue clears a terminal blocker before useful lower-tier progress', () => {
  const base = createInitialState(0);
  const top = FAMILIES[FAMILIES.length - 1];
  const low = FAMILIES[0];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `top-${index}`, familyId: top.id, tier: top.tier }));
  cells[0] = { id: 'valuable-low', familyId: low.id, tier: low.tier };
  const deadlocked = { ...base, cells, maxDiscoveredTier: top.tier };
  assert.equal(isDeadlocked(deadlocked), true);
  const rescued = rescueDeadlock(deadlocked);
  assert.equal(rescued.cells[0]?.familyId, low.id);
  assert.equal(isDeadlocked(rescued), false);
});

test('onboarding advances from merge to spawn to complete', () => {
  const state = createInitialState(0);
  assert.equal(onboardingPhase(state), 'merge');
  const merged = moveOrMerge(state, 0, 1).state;
  assert.equal(onboardingPhase(merged), 'spawn');
  const spawned = spawnUnit(merged, () => 0.99);
  assert.equal(onboardingPhase(spawned), 'complete');
});

test('level progress follows quadratic level thresholds', () => {
  assert.equal(playerLevel(0), 1);
  assert.equal(playerLevel(40), 2);
  assert.equal(playerLevelProgress(40), 0);
  assert.ok(playerLevelProgress(80) > 0 && playerLevelProgress(80) < 1);
});

test('locale normalization keeps EN/RU production baseline', () => {
  assert.equal(localeFromLanguage('ru-RU'), 'ru');
  assert.equal(localeFromLanguage('ru'), 'ru');
  assert.equal(localeFromLanguage('en-US'), 'en');
  assert.equal(localeFromLanguage('de-DE'), 'en');
});
