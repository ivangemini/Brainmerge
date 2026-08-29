import test from 'node:test';
import assert from 'node:assert/strict';
import {
  affordableUpgradeIds,
  canClaimCurrentMission,
  claimCurrentMission,
  createInitialState,
  currentBrainBoxCost,
  findBestMergePair,
  moveOrMerge,
  productionPerMinute,
  spawnUnit,
  accrueOnlineIncome
} from '../build/core/game.js';
import { MAX_RUNTIME_TIER, MISSION_TRACK } from '../build/core/catalog.js';

function claimReady(state) {
  let next = state;
  let guard = 0;
  while (canClaimCurrentMission(next) && guard < MISSION_TRACK.length + 1) {
    next = claimCurrentMission(next);
    guard += 1;
  }
  return next;
}

function advanceWithoutWaiting(state, targetTier) {
  let next = state;
  let actions = 0;
  while (next.maxDiscoveredTier < targetTier && actions < 200) {
    actions += 1;
    next = claimReady(next);
    const pair = findBestMergePair(next);
    if (pair) {
      next = moveOrMerge(next, pair[0], pair[1]).state;
      continue;
    }
    const cost = currentBrainBoxCost(next);
    assert.ok(next.coins >= cost, `T${targetTier} should be reachable in opening active loop without passive wait`);
    next = spawnUnit(next, () => 0.99);
  }
  return { state: claimReady(next), actions };
}

test('opening loop reaches T4 quickly enough to expose a real spend-vs-upgrade decision', () => {
  const result = advanceWithoutWaiting(createInitialState(0), 4);
  assert.equal(result.state.maxDiscoveredTier, 4);
  assert.ok(result.actions <= 16, `T4 should arrive within a compact opening sequence, got ${result.actions} actions`);
  const ready = affordableUpgradeIds(result.state);
  assert.ok(ready.includes('luckyDrop'));
  assert.ok(ready.includes('income'));
  assert.ok(currentBrainBoxCost(result.state) < result.state.coins, 'player should also still be able to choose immediate Box feed');
});

test('T5 remains an active-play milestone before the longer idle/return curve takes over', () => {
  const result = advanceWithoutWaiting(createInitialState(0), 5);
  assert.equal(result.state.maxDiscoveredTier, 5);
  assert.ok(result.actions <= 40, `T5 should remain in the early active loop, got ${result.actions} actions`);
});

test('baseline no-upgrade route to T8 lands in a multi-session passive-time band rather than instant completion or a hard wall', () => {
  let now = 0;
  let waitedMs = 0;
  let state = createInitialState(now);
  let guard = 0;

  while (state.maxDiscoveredTier < MAX_RUNTIME_TIER && guard < 900) {
    guard += 1;
    state = claimReady(state);
    const pair = findBestMergePair(state);
    if (pair) {
      state = moveOrMerge(state, pair[0], pair[1]).state;
      continue;
    }

    const cost = currentBrainBoxCost(state);
    if (state.coins < cost) {
      const rate = productionPerMinute(state);
      assert.ok(rate > 0);
      const missing = cost - state.coins;
      const waitMs = Math.ceil(missing / rate * 60_000) + 1_000;
      now += waitMs;
      waitedMs += waitMs;
      state = accrueOnlineIncome(state, now);
    }
    state = spawnUnit(state, () => 0.99);
  }

  assert.ok(guard < 900);
  assert.equal(state.maxDiscoveredTier, MAX_RUNTIME_TIER);
  const waitedMinutes = waitedMs / 60_000;
  assert.ok(waitedMinutes >= 90, `baseline T8 should not be instant; got ${waitedMinutes.toFixed(1)} passive minutes`);
  assert.ok(waitedMinutes <= 240, `baseline T8 should not become a hard wall; got ${waitedMinutes.toFixed(1)} passive minutes`);
});
