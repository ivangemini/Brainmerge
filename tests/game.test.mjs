import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accrueOfflineIncome,
  accrueOnlineIncome,
  advanceFastEvents,
  activeMission,
  brainBoxBaseTier,
  brainBoxLuckyChance,
  canClaimCurrentMission,
  canClaimFirstMission,
  canPurchaseUpgrade,
  claimCurrentMission,
  claimCollectionReward,
  claimFirstMission,
  claimOfflineIncome,
  createInitialState,
  currentBrainBoxCost,
  findBestMergePair,
  hasAnyMerge,
  isDeadlocked,
  missionProgress,
  markSessionStart,
  moveOrMerge,
  onboardingPhase,
  playerLevel,
  playerLevelProgress,
  productionPerMinute,
  permanentIncomeMultiplier,
  performPrestige,
  prestigeUpgradeCost,
  purchasePrestigeUpgrade,
  recordVisitorProgress,
  purchaseUpgrade,
  newestValidState,
  rescueDeadlock,
  sanitizeState,
  spawnUnit,
  tapUnit
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
  brainBoxCostForBaseTier,
  brainBoxCostForPurchases,
  discoveryBonusForTier,
  incomeMultiplierForLevel,
  luckyDropChanceForLevel,
  mergeRewardForTier,
  nextFamilyFor,
  offlineHoursForLevel,
  tapRewardForTier
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

test('core progression is one ordered eighteen-character merge chain', () => {
  assert.deepEqual(FAMILIES.map((family) => family.id), [
    'toilet-buddy',
    'camera-dude',
    'sigma-rock',
    'rizz-head',
    'shark-sneakers',
    'crocodile-bomber',
    'coffee-ballerina',
    'tung-wood',
    'brr-brr-patapim',
    'boneca-ambalabu',
    'cappuccino-assassino',
    'frigo-camelo',
    'lirili-larila',
    'chimpanzini-bananini',
    'cocofanto-elefanto',
    'bombombini-gusini',
    'trippi-troppi',
    'la-vacca-saturno-saturnita'
  ]);
  assert.equal(MAX_RUNTIME_TIER, 18);
  assert.equal(nextFamilyFor('toilet-buddy')?.id, 'camera-dude');
  assert.equal(nextFamilyFor('coffee-ballerina')?.id, 'tung-wood');
  assert.equal(nextFamilyFor('tung-wood')?.id, 'brr-brr-patapim');
  assert.equal(nextFamilyFor('trippi-troppi')?.id, 'la-vacca-saturno-saturnita');
  assert.equal(nextFamilyFor('la-vacca-saturno-saturnita'), null);
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
  assert.deepEqual(MISSION_TRACK.slice(0, 8).map((mission) => [mission.kind, mission.target]), [
    ['merges', 6],
    ['discover', 4],
    ['spawns', 12],
    ['discover', 5],
    ['merges', 30],
    ['discover', 6],
    ['discover', 7],
    ['discover', 8]
  ]);
  assert.deepEqual(MISSION_TRACK.slice(8).map((mission) => mission.target), [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 25, 100]);
  assert.ok(MISSION_TRACK.every((mission) => mission.reward > 0));
});

test('upgrade catalog exposes six bounded coin sinks', () => {
  assert.deepEqual(UPGRADE_DEFINITIONS.map((upgrade) => upgrade.id), ['boxBaseTier', 'luckyDrop', 'income', 'offline', 'clickPower', 'clickCrit']);
  assert.ok(UPGRADE_DEFINITIONS.every((upgrade) => upgrade.costs.length > 0 && upgrade.costs.every((cost) => cost > 0)));
  assert.equal(luckyDropChanceForLevel(5), 0.15);
  assert.equal(incomeMultiplierForLevel(5), 1.25);
  assert.equal(offlineHoursForLevel(4), 12);
});

test('clicker payout scales from the occupied board tier and preserves merge state', () => {
  const state = createInitialState(0);
  const first = tapUnit(state, () => 0.99, 0);
  assert.equal(first.reward, tapRewardForTier(1));
  assert.equal(first.state.clicks, 1);
  assert.deepEqual(first.state.cells, state.cells);
  const critical = tapUnit({ ...state, upgrades: { ...state.upgrades, clickPower: 5, clickCrit: 5 }, cells: [{ id: 't9', familyId: 'brr-brr-patapim', tier: 9 }, ...state.cells.slice(1)] }, () => 0, 0);
  assert.equal(critical.reward, tapRewardForTier(9, 5) * 2);
  assert.equal(critical.critical, true);
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

test('T17 pair merges into terminal T18 identity', () => {
  const base = createInitialState(0);
  const cells = base.cells.map(() => null);
  cells[0] = { id: 't17-a', familyId: 'trippi-troppi', tier: 17 };
  cells[1] = { id: 't17-b', familyId: 'trippi-troppi', tier: 17 };
  const state = { ...base, cells, maxDiscoveredTier: 17, runMaxTier: 17 };
  const result = moveOrMerge(state, 0, 1);
  assert.equal(result.merged, true);
  assert.equal(result.state.cells[1]?.familyId, 'la-vacca-saturno-saturnita');
  assert.equal(result.state.cells[1]?.tier, 18);
  assert.equal(result.state.maxDiscoveredTier, 18);
  assert.equal(nextFamilyFor('la-vacca-saturno-saturnita'), null);
});

test('different characters do not merge', () => {
  const base = createInitialState(0);
  const camera = moveOrMerge(base, 0, 1).state;
  const result = moveOrMerge(camera, 1, 2);
  assert.equal(result.merged, false);
  assert.equal(result.reason, 'mismatch');
});

test('Brain Box price follows its base tier and ignores historical purchase count', () => {
  assert.equal(BASE_BOX_COST, 20);
  assert.equal(BOX_COST_GROWTH, 1);
  assert.equal(brainBoxCostForPurchases(0), BASE_BOX_COST);
  assert.equal(brainBoxCostForPurchases(50), BASE_BOX_COST);
  assert.equal(brainBoxCostForBaseTier(1), 20);
  assert.equal(brainBoxCostForBaseTier(2), 45);
  assert.ok(brainBoxCostForBaseTier(14) > brainBoxCostForBaseTier(8));

  const state = createInitialState(0);
  const firstCost = currentBrainBoxCost(state);
  const next = spawnUnit(state, () => 0.99);
  assert.equal(next.coins, state.coins - firstCost);
  assert.equal(next.paidBoxes, 1);
  assert.equal(next.spawns, 1);
  assert.equal(currentBrainBoxCost(next), firstCost);
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
    runMaxTier: 3,
    upgrades: { boxBaseTier: 2, luckyDrop: 5, income: 0, offline: 0 }
  };
  assert.equal(brainBoxBaseTier(state), 3);
  assert.equal(brainBoxLuckyChance(state), 0.15);
  const lucky = spawnUnit(state, () => 0);
  assert.equal(lucky.cells[4]?.tier, 3, 'lucky +1 must cap to maxDiscoveredTier');
  assert.equal(lucky.maxDiscoveredTier, 3, 'box must not discover T4');
});

test('base-drop upgrade is discovery-gated and purchases consume coins', () => {
  const locked = { ...createInitialState(0), coins: 10_000 };
  assert.equal(canPurchaseUpgrade(locked, 'boxBaseTier'), false);
  assert.equal(purchaseUpgrade(locked, 'boxBaseTier').messageKey, 'message.upgradeLocked');

  const discovered = { ...locked, maxDiscoveredTier: 6, runMaxTier: 6 };
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
  const comboExpired = { ...second, events: { ...second.events, activeMs: 10_000, comboExpiresAtActiveMs: 0 } };
  const beforeDiscovery = comboExpired.coins;
  const discovered = moveOrMerge(comboExpired, 1, 3).state;
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

test('initial state starts save v10 with immediate merge and permanent-meta defaults', () => {
  const state = createInitialState(1234);
  assert.equal(state.version, 10);
  assert.equal(state.runMaxTier, 1);
  assert.equal(state.missionIndex, 0);
  assert.equal(state.paidBoxes, 0);
  assert.deepEqual(state.upgrades, { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0, clickPower: 0, clickCrit: 0 });
  assert.equal(state.clicks, 0);
  assert.deepEqual(state.collectionRewardClaims, []);
  assert.equal(state.prestigeCount, 0);
  assert.equal(state.brainCells, 0);
  assert.deepEqual(state.prestigeUpgrades, { income: 0, boxDiscount: 0, startingCoins: 0, offline: 0, campaignPower: 0 });
  assert.deepEqual(Object.keys(state.campaign.worlds), ['1', '2']);
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

test('legacy v2 save migrates chain identity and mission completion into save v10', () => {
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
  assert.equal(migrated?.version, 10);
  assert.equal(migrated?.cells[0]?.tier, 5);
  assert.equal(migrated?.maxDiscoveredTier, 5);
  assert.equal(migrated?.runMaxTier, 5);
  assert.equal(migrated?.missionIndex, 1);
  assert.equal(migrated?.paidBoxes, 0);
  assert.deepEqual(migrated?.upgrades, { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0, clickPower: 0, clickCrit: 0 });
  assert.equal(migrated?.clicks, 0);
  assert.equal(migrated?.lastAccrualAt, 50_000);
  assert.equal(migrated?.selectedIndex, null);
  assert.equal(migrated?.prestigeCount, 0);
  assert.equal(migrated?.brainCells, 0);
  assert.deepEqual(Object.keys(migrated?.campaign.worlds ?? {}), ['1', '2']);
});

test('save v8 clamps corrupted economy and permanent-meta fields safely', () => {
  const current = createInitialState(10_000);
  const restored = sanitizeState({
    ...current,
    missionIndex: 999,
    maxDiscoveredTier: 999,
    paidBoxes: -20,
    upgrades: { boxBaseTier: 999, luckyDrop: -5, income: 999, offline: 999 },
    incomeRemainder: 99,
    lastAccrualAt: 999_999,
    pendingOfflineCoins: -40,
    collectionRewardClaims: ['collection-5', 'collection-5', 42, ''],
    prestigeCount: -7,
    brainCells: -9,
    prestigeUpgrades: { income: 999, boxDiscount: -2, startingCoins: 3.9, offline: 999, campaignPower: 2 },
    campaign: {
      worlds: {
        '1': {
          locations: {
            'w1-sneaker-garden': { stabilize: 2, deliver: -1, restore: 0.5, mastery: 999 }
          },
          raidProgress: 2,
          raidCleared: false
        }
      }
    }
  }, 20_000);
  assert.equal(restored?.missionIndex, MISSION_TRACK.length);
  assert.equal(restored?.maxDiscoveredTier, MAX_RUNTIME_TIER);
  assert.equal(restored?.paidBoxes, 0);
  assert.equal(restored?.upgrades.boxBaseTier, 13);
  assert.equal(restored?.upgrades.luckyDrop, 0);
  assert.equal(restored?.upgrades.income, 5);
  assert.equal(restored?.upgrades.offline, 4);
  assert.ok((restored?.incomeRemainder ?? 0) < 1);
  assert.equal(restored?.lastAccrualAt, 20_000);
  assert.equal(restored?.pendingOfflineCoins, 0);
  assert.deepEqual(restored?.collectionRewardClaims, ['collection-5']);
  assert.equal(restored?.prestigeCount, 0);
  assert.equal(restored?.brainCells, 0);
  assert.deepEqual(restored?.prestigeUpgrades, { income: 5, boxDiscount: 0, startingCoins: 3, offline: 5, campaignPower: 2 });
  assert.deepEqual(restored?.campaign.worlds['1'].locations['w1-sneaker-garden'], { stabilize: 1, deliver: 0, restore: 0.5, mastery: 1 });
  assert.equal(restored?.campaign.worlds['1'].raidProgress, 1);
  assert.equal(restored?.campaign.worlds['1'].raidCleared, true);
});

test('save v8 rejects non-finite economy and ordering metadata', () => {
  const current = createInitialState(10_000);
  const restored = sanitizeState({
    ...current,
    coins: Infinity,
    xp: Number.NaN,
    merges: Infinity,
    spawns: Number.NaN,
    paidBoxes: Infinity,
    maxDiscoveredTier: Number.NaN,
    runMaxTier: Number.NaN,
    saveRevision: Infinity,
    savedAt: Number.NaN
  }, 20_000);
  assert.ok(restored);
  assert.equal(restored.coins, 0);
  assert.equal(restored.xp, 0);
  assert.equal(restored.merges, 0);
  assert.equal(restored.spawns, 0);
  assert.equal(restored.paidBoxes, 0);
  assert.equal(restored.maxDiscoveredTier, 1);
  assert.equal(restored.runMaxTier, 1);
  assert.equal(restored.saveRevision, 0);
  assert.equal(restored.savedAt, 0);
});

test('newest valid save uses revision before timestamp and ignores corrupt candidates', () => {
  const base = createInitialState(1_000);
  const older = { ...base, coins: 111, saveRevision: 4, savedAt: 9_000 };
  const newer = { ...base, coins: 222, saveRevision: 5, savedAt: 2_000 };
  assert.equal(newestValidState([older, { nope: true }, newer], 10_000)?.coins, 222);
});

test('collection discovery persists after lower characters are consumed', () => {
  const first = moveOrMerge(createInitialState(0), 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const third = moveOrMerge(second, 1, 3).state;
  const restored = sanitizeState(third, 0);
  assert.equal(restored?.maxDiscoveredTier, 3);
});

test('Collection milestones grant one permanent five-percent income step exactly once', () => {
  const eligible = { ...createInitialState(0), maxDiscoveredTier: 10 };
  const first = claimCollectionReward(eligible, 5);
  const second = claimCollectionReward(first, 10);
  assert.deepEqual(second.collectionRewardClaims, ['collection-5', 'collection-10']);
  assert.equal(permanentIncomeMultiplier(second), 1.10);
  assert.equal(claimCollectionReward(second, 10), second);
  assert.equal(claimCollectionReward(second, 15), second);
});

test('Prestige awards three Brain Cells once and resets only run-scoped state', () => {
  const campaign = createInitialState(0).campaign;
  const completed = {
    ...createInitialState(0),
    runMaxTier: 18,
    maxDiscoveredTier: 18,
    coins: 999_999,
    merges: 500,
    missionIndex: MISSION_TRACK.length,
    upgrades: { boxBaseTier: 13, luckyDrop: 5, income: 5, offline: 4 },
    collectionRewardClaims: ['collection-5'],
    campaign,
    prestigeUpgrades: { income: 1, boxDiscount: 1, startingCoins: 2, offline: 1, campaignPower: 1 }
  };
  const reset = performPrestige(completed, 50_000);
  assert.equal(reset.runMaxTier, 1);
  assert.equal(reset.maxDiscoveredTier, 18);
  assert.equal(reset.coins, 300);
  assert.equal(reset.prestigeCount, 1);
  assert.equal(reset.brainCells, 3);
  assert.deepEqual(reset.collectionRewardClaims, ['collection-5']);
  assert.equal(reset.campaign, campaign);
  assert.deepEqual(reset.upgrades, { boxBaseTier: 0, luckyDrop: 0, income: 0, offline: 0, clickPower: 0, clickCrit: 0 });
  assert.equal(performPrestige(reset), reset, 'a reset run cannot award Brain Cells twice');
});

test('permanent upgrades use 1/2/3/4/5 Brain Cell costs and stay bounded', () => {
  let state = { ...createInitialState(0), brainCells: 20 };
  for (let level = 0; level < 5; level += 1) {
    assert.equal(prestigeUpgradeCost(level), level + 1);
    state = purchasePrestigeUpgrade(state, 'income');
  }
  assert.equal(state.prestigeUpgrades.income, 5);
  assert.equal(prestigeUpgradeCost(5), null);
  assert.equal(purchasePrestigeUpgrade(state, 'income').prestigeUpgrades.income, 5);
});

test('merge combo continues for eight active seconds and rewards exact 3/6/10 milestones', () => {
  let state = createInitialState(0);
  const baseCost = currentBrainBoxCost(state);
  const rewards = [];
  for (let merge = 1; merge <= 10; merge += 1) {
    const cells = state.cells.map(() => null);
    cells[0] = { id: `combo-a-${merge}`, familyId: 'toilet-buddy', tier: 1 };
    cells[1] = { id: `combo-b-${merge}`, familyId: 'toilet-buddy', tier: 1 };
    const before = state.coins;
    state = moveOrMerge({ ...state, cells }, 0, 1).state;
    rewards.push(state.coins - before);
    state = { ...state, events: { ...state.events, activeMs: state.events.activeMs + 1_000 } };
  }
  assert.equal(state.events.comboCount, 10);
  assert.ok(rewards[2] > rewards[1]);
  assert.ok(rewards[5] > rewards[4]);
  assert.ok(rewards[9] >= rewards[8] + baseCost);
  const expired = advanceFastEvents(state, 9_000, false);
  const cells = expired.cells.map(() => null);
  cells[0] = { id: 'expired-a', familyId: 'toilet-buddy', tier: 1 };
  cells[1] = { id: 'expired-b', familyId: 'toilet-buddy', tier: 1 };
  assert.equal(moveOrMerge({ ...expired, cells }, 0, 1).state.events.comboCount, 1);
});

test('Fever starts after 24 merges, discounts Boxes, doubles merge coins and pauses without active ticks', () => {
  let state = { ...createInitialState(0), runMaxTier: 5, maxDiscoveredTier: 5 };
  state = { ...state, events: { ...state.events, feverCharge: 24 } };
  const normalCost = currentBrainBoxCost(state);
  const fever = advanceFastEvents(state, 1_000, true);
  assert.equal(fever.events.feverRemainingMs, 30_000);
  assert.ok(currentBrainBoxCost(fever) < normalCost);
  assert.equal(advanceFastEvents(fever, 0).events.feverRemainingMs, 30_000, 'inactive lifecycle does not consume Fever');
  const cells = fever.cells.map(() => null);
  cells[0] = { id: 'fever-a', familyId: 'toilet-buddy', tier: 1 };
  cells[1] = { id: 'fever-b', familyId: 'toilet-buddy', tier: 1 };
  const before = fever.coins;
  const merged = moveOrMerge({ ...fever, cells }, 0, 1).state;
  assert.equal(merged.coins - before, mergeRewardForTier(2) * 2);
  assert.equal(advanceFastEvents(fever, 30_000, true).events.feverRemainingMs, 0);
});

test('persisted visitor objectives complete once for two current Boxes and reschedule', () => {
  const eligible = {
    ...createInitialState(0),
    runMaxTier: 5,
    maxDiscoveredTier: 5,
    events: { ...createInitialState(0).events, activeMs: 300_000, nextVisitorAtActiveMs: 300_000 }
  };
  const active = advanceFastEvents(eligible, 1, true, true);
  assert.equal(active.events.visitor?.kind, 'merges');
  const partial = recordVisitorProgress(active, 'merges', 5);
  const before = partial.coins;
  const complete = recordVisitorProgress(partial, 'merges');
  assert.equal(complete.events.visitor, null);
  assert.equal(complete.coins - before, currentBrainBoxCost(partial) * 2);
  assert.equal(recordVisitorProgress(complete, 'merges'), complete);
});

test('retention metrics separate foreground time and capture milestone clocks once', () => {
  let state = createInitialState(1_000);
  state = advanceFastEvents(state, 12_000, false);
  assert.equal(state.events.activeMs, 12_000);
  assert.equal(state.retention.activeAfterT18Ms, 0);
  const cells = state.cells.map(() => null);
  cells[0] = { id: 't4-a', familyId: 'rizz-head', tier: 4 };
  cells[1] = { id: 't4-b', familyId: 'rizz-head', tier: 4 };
  state = moveOrMerge({ ...state, cells, maxDiscoveredTier: 4, runMaxTier: 4 }, 0, 1).state;
  assert.equal(state.retention.tier5ActiveMs, 12_000);
  const firstMetric = state.retention.tier5ActiveMs;
  state = advanceFastEvents({ ...state, runMaxTier: 18 }, 5_000, false);
  assert.equal(state.retention.activeAfterT18Ms, 5_000);
  assert.equal(state.retention.tier5ActiveMs, firstMetric);
  const returned = markSessionStart(state, 86_401_000);
  assert.equal(returned.retention.sessionCount, 2);
  assert.equal(returned.retention.firstSeenAt, 1_000);
});

test('first mission compatibility wrapper advances into mission journey', () => {
  const state = { ...createInitialState(0), merges: 6, coins: 10 };
  assert.equal(canClaimFirstMission(state), true);
  const claimed = claimFirstMission(state);
  assert.equal(claimed.coins, 10 + FIRST_MISSION_REWARD);
  assert.equal(claimed.missionIndex, 1);
});

test('mission progress reads the correct cumulative signal', () => {
  const base = { ...createInitialState(0), merges: 11, spawns: 7, maxDiscoveredTier: 4, runMaxTier: 4 };
  assert.equal(missionProgress(base, MISSION_TRACK[0]), 6);
  assert.equal(missionProgress(base, MISSION_TRACK[1]), 4);
  assert.equal(missionProgress(base, MISSION_TRACK[2]), 7);
  assert.equal(missionProgress({ ...base, clicks: 19 }, { kind: 'clicks', target: 25, id: 'test-clicks', reward: 1, titleKey: '', textKey: '' }), 19);
});

test('idle economy can progress from fresh save to T8 first-cycle checkpoint without rewarded ads or negative coins', () => {
  const checkpointTier = 8;
  let now = 0;
  let state = createInitialState(now);
  let guard = 0;
  let waitedMs = 0;

  while (state.runMaxTier < checkpointTier && guard < 900) {
    guard += 1;
    state = claimEverythingReady(state);
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
  assert.ok(guard < 900, 'idle economy T8 checkpoint smoke loop should converge');
  assert.equal(state.maxDiscoveredTier, checkpointTier);
  assert.equal(state.missionIndex, 8);
  assert.ok(waitedMs >= 0);
});

test('deadlock rescue clears a terminal blocker before useful lower-tier progress', () => {
  const base = createInitialState(0);
  const top = FAMILIES[FAMILIES.length - 1];
  const low = FAMILIES[0];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `top-${index}`, familyId: top.id, tier: top.tier }));
  cells[0] = { id: 'valuable-low', familyId: low.id, tier: low.tier };
  const deadlocked = { ...base, cells, maxDiscoveredTier: top.tier, runMaxTier: top.tier };
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
