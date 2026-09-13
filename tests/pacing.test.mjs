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
  purchaseUpgrade,
  spawnUnit,
  accrueOnlineIncome
} from '../build/core/game.js';
import { MISSION_TRACK, upgradeCost } from '../build/core/catalog.js';

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

function simulateT18Route(actionSeconds) {
  let now = 0;
  let state = createInitialState(now);
  let guard = 0;

  while (state.runMaxTier < 18 && guard < 3_000) {
    guard += 1;
    state = claimReady(state);

    const desiredBaseLevel = Math.min(13, Math.max(0, state.runMaxTier - 5));
    if (state.upgrades.boxBaseTier < desiredBaseLevel) {
      let upgraded = purchaseUpgrade(state, 'boxBaseTier');
      if (upgraded.upgrades.boxBaseTier === state.upgrades.boxBaseTier) {
        const cost = upgradeCost('boxBaseTier', state.upgrades.boxBaseTier);
        const rate = productionPerMinute(state);
        assert.ok(cost !== null && rate > 0);
        now += Math.ceil((cost - state.coins) / rate * 60_000) + 1_000;
        state = accrueOnlineIncome(state, now);
        upgraded = purchaseUpgrade(state, 'boxBaseTier');
      }
      if (upgraded.upgrades.boxBaseTier > state.upgrades.boxBaseTier) {
        state = upgraded;
        now += actionSeconds * 1_000;
        state = accrueOnlineIncome(state, now);
        continue;
      }
    }

    const pair = findBestMergePair(state);
    if (pair) {
      state = moveOrMerge(state, pair[0], pair[1]).state;
    } else {
      const cost = currentBrainBoxCost(state);
      if (state.coins < cost) {
        const rate = productionPerMinute(state);
        assert.ok(rate > 0);
        now += Math.ceil((cost - state.coins) / rate * 60_000) + 1_000;
        state = accrueOnlineIncome(state, now);
      }
      state = spawnUnit(state, () => 0.99);
    }

    now += actionSeconds * 1_000;
    state = accrueOnlineIncome(state, now);
  }

  assert.ok(guard < 3_000, 'T18 pacing route should converge without ads');
  assert.equal(state.runMaxTier, 18);
  return { minutes: now / 60_000, actions: guard, state };
}

test('T18 route stays finite across fast 2/4/6-second action cadences', () => {
  const routes = [2, 4, 6].map(simulateT18Route);
  assert.ok(routes.every((route) => route.minutes > 0 && route.minutes <= 120));
  assert.ok(routes[0].minutes <= routes[1].minutes && routes[1].minutes <= routes[2].minutes);
  assert.ok(routes.every((route) => route.state.coins >= 0));
});

test('modeled normal no-ad T18 route lands in the 80-100 active-minute target', () => {
  // The cadence simulations above isolate input speed. This route adds the
  // observed scan/decision time between atomic actions on a 6x5 board.
  const route = simulateT18Route(12);
  assert.ok(route.minutes >= 80, `normal T18 route is too short: ${route.minutes.toFixed(1)}m`);
  assert.ok(route.minutes <= 100, `normal T18 route is too long: ${route.minutes.toFixed(1)}m`);
});
