import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accrueOfflineIncome,
  accrueOnlineIncome,
  claimOfflineIncome,
  createInitialState,
  sanitizeState
} from '../build/core/game.js';

test('hide -> persisted snapshot -> resume -> reload does not duplicate offline production', () => {
  const start = createInitialState(0);
  const hiddenAt = 60_000;
  const hidden = accrueOnlineIncome(start, hiddenAt);
  assert.equal(hidden.coins, 112);
  assert.equal(hidden.lastAccrualAt, hiddenAt);

  // This is the canonical snapshot written with flush=true at visibility/pagehide.
  const persistedHidden = structuredClone(hidden);
  const resumedAt = 120_000;
  const resumed = accrueOfflineIncome(persistedHidden, resumedAt);
  assert.equal(resumed.pendingOfflineCoins, 12);
  assert.equal(resumed.lastAccrualAt, resumedAt);

  // Resume state is persisted before normal play. A reload at the same timestamp
  // must preserve the pending reward but must not manufacture a second minute.
  const restored = sanitizeState(structuredClone(resumed), resumedAt);
  assert.ok(restored);
  const resumedAgain = accrueOfflineIncome(restored, resumedAt);
  assert.equal(resumedAgain.pendingOfflineCoins, 12);
  assert.equal(resumedAgain.coins, 112);

  const claimed = claimOfflineIncome(resumedAgain);
  assert.equal(claimed.pendingOfflineCoins, 0);
  assert.equal(claimed.coins, 124);
  assert.deepEqual(claimOfflineIncome(claimed), claimed);
});

test('multiple lifecycle resumes only credit time after the latest accounting cursor', () => {
  let state = createInitialState(0);
  state = accrueOfflineIncome(state, 60_000);
  assert.equal(state.pendingOfflineCoins, 12);

  state = accrueOfflineIncome(state, 90_000);
  assert.equal(state.pendingOfflineCoins, 18);

  // Duplicate visibility event at identical time is idempotent.
  const duplicate = accrueOfflineIncome(state, 90_000);
  assert.deepEqual(duplicate, state);

  // Clock rollback is also ignored without moving the cursor backwards.
  const rollback = accrueOfflineIncome(state, 70_000);
  assert.deepEqual(rollback, state);

  state = accrueOfflineIncome(state, 120_000);
  assert.equal(state.pendingOfflineCoins, 24);
});
