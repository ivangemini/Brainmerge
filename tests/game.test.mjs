import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canClaimFirstMission,
  claimFirstMission,
  createInitialState,
  hasAnyMerge,
  isBoardFull,
  isDeadlocked,
  moveOrMerge,
  onboardingPhase,
  playerLevel,
  playerLevelProgress,
  rescueDeadlock,
  sanitizeState,
  spawnUnit
} from '../build/core/game.js';
import { BOARD_SIZE, FAMILIES, FIRST_MISSION_REWARD, visualFormForTier } from '../build/core/catalog.js';
import { localeFromLanguage } from '../build/i18n/i18n.js';

test('visual form changes every three tiers', () => {
  assert.equal(visualFormForTier(1), 1);
  assert.equal(visualFormForTier(3), 1);
  assert.equal(visualFormForTier(4), 2);
  assert.equal(visualFormForTier(6), 2);
  assert.equal(visualFormForTier(7), 3);
});

test('runtime character presentation stays inside safe normalization bounds', () => {
  for (const family of FAMILIES) {
    assert.ok(family.presentation.scale >= 0.7 && family.presentation.scale <= 1.25, `${family.id} scale`);
    assert.ok(family.presentation.yPercent >= -4 && family.presentation.yPercent <= 12, `${family.id} yPercent`);
    assert.ok(family.presentation.shadowScale >= 0.65 && family.presentation.shadowScale <= 1.1, `${family.id} shadowScale`);
    assert.ok(family.presentation.collectionScale >= 0.75 && family.presentation.collectionScale <= 1.2, `${family.id} collectionScale`);
  }
});

test('matching family and tier merge into next tier', () => {
  const state = createInitialState();
  const result = moveOrMerge(state, 0, 1);
  assert.equal(result.merged, true);
  assert.equal(result.state.cells[0], null);
  assert.equal(result.state.cells[1]?.tier, 2);
  assert.equal(result.state.merges, 1);
});

test('different units do not merge', () => {
  const state = createInitialState();
  const result = moveOrMerge(state, 0, 2);
  assert.equal(result.merged, false);
  assert.equal(result.reason, 'mismatch');
  assert.equal(result.state.cells[0]?.familyId, 'shark-sneakers');
  assert.equal(result.state.cells[2]?.familyId, 'tung-wood');
});

test('unit can move into empty cell', () => {
  const state = createInitialState();
  const result = moveOrMerge(state, 0, 10);
  assert.equal(result.changed, true);
  assert.equal(result.state.cells[0], null);
  assert.equal(result.state.cells[10]?.familyId, 'shark-sneakers');
});

test('paid spawn consumes coins and increments spawn count', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0);
  assert.equal(next.coins, 90);
  assert.equal(next.spawns, 1);
  assert.equal(next.cells[8]?.familyId, 'camera-dude');
});

test('rewarded spawn is free but still counts as spawn', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0, true);
  assert.equal(next.coins, state.coins);
  assert.equal(next.spawns, 1);
  assert.equal(next.cells[8]?.familyId, 'camera-dude');
});

test('initial state always has a merge', () => {
  const state = createInitialState();
  assert.equal(hasAnyMerge(state), true);
  assert.equal(isBoardFull(state), false);
});

test('version 1 save migrates to version 2 defaults', () => {
  const current = createInitialState();
  const legacy = {
    version: 1,
    cells: current.cells,
    coins: 55,
    xp: 22,
    merges: 3,
    selectedIndex: 1,
    messageKey: 'message.moved'
  };
  const migrated = sanitizeState(legacy);
  assert.equal(migrated?.version, 2);
  assert.equal(migrated?.coins, 55);
  assert.equal(migrated?.spawns, 0);
  assert.equal(migrated?.missionClaimed, false);
  assert.equal(migrated?.selectedIndex, null);
});

test('first mission reward can only be claimed once', () => {
  const state = { ...createInitialState(), merges: 6, coins: 10 };
  assert.equal(canClaimFirstMission(state), true);
  const claimed = claimFirstMission(state);
  assert.equal(claimed.coins, 10 + FIRST_MISSION_REWARD);
  assert.equal(claimed.missionClaimed, true);
  assert.equal(canClaimFirstMission(claimed), false);
  assert.deepEqual(claimFirstMission(claimed), claimed);
});

test('deadlock rescue only activates on a full board with no merge', () => {
  const base = createInitialState();
  const families = ['camera-dude', 'toilet-buddy', 'sigma-rock', 'rizz-head', 'shark-sneakers', 'crocodile-bomber', 'coffee-ballerina', 'tung-wood'];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `u-${index}`, familyId: families[index % families.length], tier: 3 }));
  const deadlocked = { ...base, cells };
  assert.equal(isDeadlocked(deadlocked), true);
  const rescued = rescueDeadlock(deadlocked);
  assert.equal(rescued.cells.filter(Boolean).length, BOARD_SIZE - 1);
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
