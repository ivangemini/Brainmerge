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
import { BOARD_SIZE, FAMILIES, FIRST_MISSION_REWARD, MAX_RUNTIME_TIER, nextFamilyFor } from '../build/core/catalog.js';
import { localeFromLanguage } from '../build/i18n/i18n.js';

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

test('paid Brain Box always spawns the bottom of the chain', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0.99);
  assert.equal(next.coins, 90);
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

test('initial state always has an immediate merge', () => {
  const state = createInitialState();
  assert.equal(state.cells.filter(Boolean).length, 4);
  assert.ok(state.cells.filter(Boolean).every((cell) => cell?.familyId === 'toilet-buddy'));
  assert.equal(hasAnyMerge(state), true);
  assert.equal(isBoardFull(state), false);
});

test('legacy v2 save migrates families onto canonical chain tiers', () => {
  const current = createInitialState();
  const cells = current.cells.slice();
  cells[0] = { id: 'legacy-shark', familyId: 'shark-sneakers', tier: 1 };
  const legacy = {
    version: 2,
    cells,
    coins: 55,
    xp: 22,
    merges: 3,
    spawns: 4,
    missionClaimed: false,
    selectedIndex: 1,
    messageKey: 'message.moved'
  };
  const migrated = sanitizeState(legacy);
  assert.equal(migrated?.version, 3);
  assert.equal(migrated?.coins, 55);
  assert.equal(migrated?.spawns, 4);
  assert.equal(migrated?.cells[0]?.familyId, 'shark-sneakers');
  assert.equal(migrated?.cells[0]?.tier, 5);
  assert.equal(migrated?.maxDiscoveredTier, 5);
  assert.equal(migrated?.selectedIndex, null);
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
  const top = FAMILIES[FAMILIES.length - 1];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `top-${index}`, familyId: top.id, tier: top.tier }));
  const deadlocked = { ...base, cells, maxDiscoveredTier: top.tier };
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
