import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activeMission,
  canClaimCurrentMission,
  canClaimFirstMission,
  claimCurrentMission,
  claimFirstMission,
  createInitialState,
  findBestMergePair,
  hasAnyMerge,
  isBoardFull,
  isDeadlocked,
  missionProgress,
  moveOrMerge,
  onboardingPhase,
  playerLevel,
  playerLevelProgress,
  rescueDeadlock,
  sanitizeState,
  spawnUnit
} from '../build/core/game.js';
import {
  BOARD_SIZE,
  FAMILIES,
  FIRST_MISSION_REWARD,
  MAX_RUNTIME_TIER,
  MISSION_TRACK,
  SPAWN_COST,
  discoveryBonusForTier,
  mergeRewardForTier,
  nextFamilyFor
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

test('first-cycle mission track is ordered around natural chain milestones', () => {
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

test('runtime character presentation stays inside safe normalization bounds', () => {
  for (const family of FAMILIES) {
    assert.ok(family.presentation.scale >= 0.7 && family.presentation.scale <= 1.25, `${family.id} scale`);
    assert.ok(family.presentation.yPercent >= -4 && family.presentation.yPercent <= 12, `${family.id} yPercent`);
    assert.ok(family.presentation.shadowScale >= 0.65 && family.presentation.shadowScale <= 1.1, `${family.id} shadowScale`);
    assert.ok(family.presentation.collectionScale >= 0.75 && family.presentation.collectionScale <= 1.2, `${family.id} collectionScale`);
  }
});

test('two identical characters merge into the next character identity', () => {
  const state = createInitialState();
  const result = moveOrMerge(state, 0, 1);
  assert.equal(result.merged, true);
  assert.equal(result.state.cells[0], null);
  assert.equal(result.state.cells[1]?.familyId, 'camera-dude');
  assert.equal(result.state.cells[1]?.tier, 2);
  assert.equal(result.state.maxDiscoveredTier, 2);
  assert.equal(result.state.merges, 1);
});

test('different characters do not merge', () => {
  const base = createInitialState();
  const camera = moveOrMerge(base, 0, 1).state;
  const result = moveOrMerge(camera, 1, 2);
  assert.equal(result.merged, false);
  assert.equal(result.reason, 'mismatch');
  assert.equal(result.state.cells[1]?.familyId, 'camera-dude');
  assert.equal(result.state.cells[2]?.familyId, 'toilet-buddy');
});

test('unit can move into empty cell', () => {
  const state = createInitialState();
  const result = moveOrMerge(state, 0, 10);
  assert.equal(result.changed, true);
  assert.equal(result.state.cells[0], null);
  assert.equal(result.state.cells[10]?.familyId, 'toilet-buddy');
});

test('paid Brain Box always spawns the bottom of the chain at tuned cost', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0.99);
  assert.equal(SPAWN_COST, 12);
  assert.equal(next.coins, state.coins - SPAWN_COST);
  assert.equal(next.spawns, 1);
  assert.equal(next.cells[4]?.familyId, 'toilet-buddy');
  assert.equal(next.cells[4]?.tier, 1);
});

test('rewarded spawn is free but still feeds Tier 1', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0.5, true);
  assert.equal(next.coins, state.coins);
  assert.equal(next.spawns, 1);
  assert.equal(next.cells[4]?.familyId, 'toilet-buddy');
});

test('first discovery bonus is paid once, then repeat merges use base reward', () => {
  const base = createInitialState();
  const first = moveOrMerge(base, 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const beforeDiscovery = second.coins;
  const discovered = moveOrMerge(second, 1, 3).state;
  assert.equal(discovered.maxDiscoveredTier, 3);
  assert.equal(discovered.messageKey, 'message.discovered');
  assert.equal(discovered.coins - beforeDiscovery, mergeRewardForTier(3) + discoveryBonusForTier(3));

  const repeatBase = {
    ...discovered,
    cells: discovered.cells.map(() => null),
    maxDiscoveredTier: 3
  };
  repeatBase.cells[0] = { id: 'cam-a', familyId: 'camera-dude', tier: 2 };
  repeatBase.cells[1] = { id: 'cam-b', familyId: 'camera-dude', tier: 2 };
  const repeated = moveOrMerge(repeatBase, 0, 1).state;
  assert.equal(repeated.messageKey, 'message.merged');
  assert.equal(repeated.coins - repeatBase.coins, mergeRewardForTier(3));
});

test('initial state always has an immediate merge', () => {
  const state = createInitialState();
  assert.equal(state.version, 4);
  assert.equal(state.missionIndex, 0);
  assert.equal(state.cells.filter(Boolean).length, 4);
  assert.ok(state.cells.filter(Boolean).every((cell) => cell?.familyId === 'toilet-buddy'));
  assert.equal(hasAnyMerge(state), true);
  assert.equal(isBoardFull(state), false);
});

test('best merge hint prefers the highest-tier available pair', () => {
  const base = createInitialState();
  const first = moveOrMerge(base, 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const cells = second.cells.slice();
  cells[4] = { id: 't1-a', familyId: 'toilet-buddy', tier: 1 };
  cells[5] = { id: 't1-b', familyId: 'toilet-buddy', tier: 1 };
  const withTwoPairs = { ...second, cells };
  assert.deepEqual(findBestMergePair(withTwoPairs), [1, 3]);
});

test('legacy v2 save migrates chain identity and old mission completion into save v4', () => {
  const current = createInitialState();
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
  const migrated = sanitizeState(legacy);
  assert.equal(migrated?.version, 4);
  assert.equal(migrated?.coins, 55);
  assert.equal(migrated?.spawns, 4);
  assert.equal(migrated?.cells[0]?.familyId, 'shark-sneakers');
  assert.equal(migrated?.cells[0]?.tier, 5);
  assert.equal(migrated?.maxDiscoveredTier, 5);
  assert.equal(migrated?.missionIndex, 1);
  assert.equal(migrated?.selectedIndex, null);
});

test('save v4 clamps mission and discovery progress safely', () => {
  const current = createInitialState();
  const restored = sanitizeState({ ...current, missionIndex: 999, maxDiscoveredTier: 999 });
  assert.equal(restored?.missionIndex, MISSION_TRACK.length);
  assert.equal(restored?.maxDiscoveredTier, MAX_RUNTIME_TIER);
});

test('collection discovery persists after lower characters are consumed', () => {
  const first = moveOrMerge(createInitialState(), 0, 1).state;
  const second = moveOrMerge(first, 2, 3).state;
  const third = moveOrMerge(second, 1, 3).state;
  assert.equal(third.cells[3]?.familyId, 'sigma-rock');
  assert.equal(third.maxDiscoveredTier, 3);
  const restored = sanitizeState(third);
  assert.equal(restored?.maxDiscoveredTier, 3);
});

test('first mission compatibility wrapper advances into the new mission journey', () => {
  const state = { ...createInitialState(), merges: 6, coins: 10 };
  assert.equal(canClaimFirstMission(state), true);
  const claimed = claimFirstMission(state);
  assert.equal(claimed.coins, 10 + FIRST_MISSION_REWARD);
  assert.equal(claimed.missionIndex, 1);
  assert.equal(canClaimFirstMission(claimed), false);
  assert.deepEqual(claimFirstMission(claimed), claimed);
});

test('mission progress reads the correct cumulative signal', () => {
  const base = { ...createInitialState(), merges: 11, spawns: 7, maxDiscoveredTier: 4 };
  assert.equal(missionProgress(base, MISSION_TRACK[0]), 6);
  assert.equal(missionProgress(base, MISSION_TRACK[1]), 4);
  assert.equal(missionProgress(base, MISSION_TRACK[2]), 7);
});

test('full paid first cycle reaches T8, clears all eight goals and never requires rewarded ads', () => {
  let state = createInitialState();
  let guard = 0;
  let minimumCoins = state.coins;

  while ((state.maxDiscoveredTier < MAX_RUNTIME_TIER || activeMission(state)) && guard < 700) {
    guard += 1;
    state = claimEverythingReady(state);
    if (!activeMission(state) && state.maxDiscoveredTier >= MAX_RUNTIME_TIER) break;

    const pair = findBestMergePair(state);
    if (pair) {
      state = moveOrMerge(state, pair[0], pair[1]).state;
      minimumCoins = Math.min(minimumCoins, state.coins);
      continue;
    }

    assert.ok(state.coins >= SPAWN_COST, `coin starvation before T${state.maxDiscoveredTier + 1}; mission ${state.missionIndex}`);
    state = spawnUnit(state, () => 0);
    minimumCoins = Math.min(minimumCoins, state.coins);
  }

  state = claimEverythingReady(state);
  assert.ok(guard < 700, 'full-cycle smoke loop should converge');
  assert.equal(state.maxDiscoveredTier, MAX_RUNTIME_TIER);
  assert.equal(state.missionIndex, MISSION_TRACK.length);
  assert.equal(activeMission(state), null);
  assert.ok(minimumCoins >= 0);
  assert.ok(state.coins >= 0);
});

test('deadlock rescue clears a terminal blocker before useful lower-tier progress', () => {
  const base = createInitialState();
  const top = FAMILIES[FAMILIES.length - 1];
  const low = FAMILIES[0];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `top-${index}`, familyId: top.id, tier: top.tier }));
  cells[0] = { id: 'valuable-low', familyId: low.id, tier: low.tier };
  const deadlocked = { ...base, cells, maxDiscoveredTier: top.tier };
  assert.equal(isDeadlocked(deadlocked), true);
  const rescued = rescueDeadlock(deadlocked);
  assert.equal(rescued.cells.filter(Boolean).length, BOARD_SIZE - 1);
  assert.equal(rescued.cells[0]?.familyId, low.id);
  assert.equal(rescued.coins, deadlocked.coins + 5);
  assert.equal(isDeadlocked(rescued), false);
});

test('onboarding advances from merge to spawn to complete', () => {
  const state = createInitialState();
  assert.equal(onboardingPhase(state), 'merge');
  const merged = moveOrMerge(state, 0, 1).state;
  assert.equal(onboardingPhase(merged), 'spawn');
  const spawned = spawnUnit(merged, () => 0);
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
