import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, moveOrMerge, spawnUnit, hasAnyMerge, isBoardFull } from '../build/core/game.js';
import { visualFormForTier } from '../build/core/catalog.js';

test('visual form changes every three tiers', () => {
  assert.equal(visualFormForTier(1), 1);
  assert.equal(visualFormForTier(3), 1);
  assert.equal(visualFormForTier(4), 2);
  assert.equal(visualFormForTier(6), 2);
  assert.equal(visualFormForTier(7), 3);
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

test('spawn consumes coins and fills first empty cell', () => {
  const state = createInitialState();
  const next = spawnUnit(state, () => 0);
  assert.equal(next.coins, 90);
  assert.equal(next.cells[8]?.familyId, 'camera-dude');
});

test('initial state always has a merge', () => {
  const state = createInitialState();
  assert.equal(hasAnyMerge(state), true);
  assert.equal(isBoardFull(state), false);
});
