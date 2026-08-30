import test from 'node:test';
import assert from 'node:assert/strict';
import {
  affordableUpgradeIds,
  claimCurrentMission,
  claimOfflineIncome,
  createInitialState,
  nextActionHint
} from '../build/core/game.js';
import { BOARD_SIZE, FAMILIES, MISSION_TRACK } from '../build/core/catalog.js';

function singleUnitState(tier = 1, coins = 0) {
  const family = FAMILIES[tier - 1];
  const state = createInitialState(0);
  const cells = Array.from({ length: BOARD_SIZE }, () => null);
  cells[0] = { id: `single-${tier}`, familyId: family.id, tier: family.tier };
  return { ...state, cells, coins, maxDiscoveredTier: Math.max(state.maxDiscoveredTier, tier) };
}

test('next-action guidance starts with a free merge rather than telling player to spend', () => {
  const state = createInitialState(0);
  assert.equal(nextActionHint(state).kind, 'merge');
});

test('offline collection and ready mission outrank other economy actions', () => {
  const withOffline = { ...createInitialState(0), pendingOfflineCoins: 77, merges: 6 };
  assert.deepEqual(nextActionHint(withOffline), { kind: 'offline', amount: 77 });

  const afterCollect = claimOfflineIncome(withOffline);
  const mission = nextActionHint(afterCollect);
  assert.equal(mission.kind, 'mission');
  assert.equal(mission.amount, MISSION_TRACK[0].reward);
});

test('return session exposes a deterministic sequence of useful decisions without a synthetic daily task layer', () => {
  const returned = { ...createInitialState(0), pendingOfflineCoins: 120, merges: 6 };
  assert.equal(nextActionHint(returned).kind, 'offline', 'return value must be collected before unrelated spending');

  const collected = claimOfflineIncome(returned);
  assert.equal(nextActionHint(collected).kind, 'mission', 'an already-earned mission reward becomes the next explicit decision');

  const claimed = claimCurrentMission(collected);
  assert.equal(claimed.missionIndex, 1, 'claim must advance the journey');
  assert.equal(nextActionHint(claimed).kind, 'merge', 'after return rewards, the player is routed back into active merge play');
});

test('true deadlock outranks spending recommendations', () => {
  const top = FAMILIES[FAMILIES.length - 1];
  const cells = Array.from({ length: BOARD_SIZE }, (_, index) => ({ id: `top-${index}`, familyId: top.id, tier: top.tier }));
  const state = { ...createInitialState(0), cells, coins: 999, maxDiscoveredTier: top.tier };
  assert.equal(nextActionHint(state).kind, 'rescue');
});

test('when there is no free merge, permanent affordable upgrades are surfaced before another Box', () => {
  const state = singleUnitState(1, 300);
  const ready = affordableUpgradeIds(state);
  assert.deepEqual(ready, ['luckyDrop', 'income', 'offline']);
  const hint = nextActionHint(state);
  assert.equal(hint.kind, 'upgrade');
  assert.equal(hint.upgradeCount, 3);
});

test('Box and wait guidance use the current escalating price and production rate', () => {
  const affordable = singleUnitState(1, 100);
  const box = nextActionHint(affordable);
  assert.equal(box.kind, 'box');
  assert.equal(box.cost, 20);

  const waiting = singleUnitState(1, 0);
  const wait = nextActionHint(waiting);
  assert.equal(wait.kind, 'wait');
  assert.equal(wait.cost, 20);
  assert.equal(wait.minutes, 7);
});

test('completed T8 journey stops presenting another Box as mandatory progression', () => {
  const state = {
    ...singleUnitState(8, 0),
    missionIndex: MISSION_TRACK.length,
    upgrades: { boxBaseTier: 3, luckyDrop: 5, income: 5, offline: 4 }
  };
  assert.equal(nextActionHint(state).kind, 'complete');
});
