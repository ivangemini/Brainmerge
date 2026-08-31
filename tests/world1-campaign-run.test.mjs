import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKYARD_CORE_LOCATION_ID,
  SNEAKER_GARDEN_LOCATION_ID,
  TOILET_POND_LOCATION_ID,
  WORLD1_LOCATION_RUN_CONFIGS,
  acknowledgeCampaignRunCompletion,
  beginCampaignRun,
  isWorld1LocationUnlocked,
  moveOrMergeCampaignBoard,
  sanitizeCampaignRunState,
  world1DeliveryOrderTiers,
  world1MasteryOrderTiers,
  world1RestoreOrderTiers
} from '../build/core/campaign-run.js';
import { createInitialState, sanitizeState } from '../build/core/game.js';

function withProgress(state, locationId, phases) {
  const campaign = structuredClone(state.campaign);
  Object.assign(campaign.worlds['1'].locations[locationId], phases);
  return { ...state, campaign };
}

function blockerCount(run) {
  return run.overgrowth.filter(Boolean).length;
}

test('World 1 route unlocks the next Location after the previous Landmark is restored, without requiring Mastery', () => {
  let state = createInitialState(1_000);
  assert.equal(isWorld1LocationUnlocked(state.campaign, SNEAKER_GARDEN_LOCATION_ID), true);
  assert.equal(isWorld1LocationUnlocked(state.campaign, TOILET_POND_LOCATION_ID), false);

  state = withProgress(state, SNEAKER_GARDEN_LOCATION_ID, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 });
  assert.equal(isWorld1LocationUnlocked(state.campaign, TOILET_POND_LOCATION_ID), true);

  const toilet = beginCampaignRun({ ...state, maxDiscoveredTier: 5 }, 1, TOILET_POND_LOCATION_ID);
  assert.ok(toilet.campaignRun);
  assert.equal(toilet.campaignRun.locationId, TOILET_POND_LOCATION_ID);
  assert.equal(toilet.campaignRun.phase, 'stabilize');
  assert.equal(blockerCount(toilet.campaignRun), 7);
});

test('Toilet Pond uses its own data-driven order range and never asks above lifetime discovery', () => {
  assert.deepEqual(world1DeliveryOrderTiers(TOILET_POND_LOCATION_ID, 5), [2, 2, 3, 5]);
  assert.deepEqual(world1RestoreOrderTiers(TOILET_POND_LOCATION_ID, 5), [2, 2, 3, 3, 5, 5]);
  assert.deepEqual(world1MasteryOrderTiers(TOILET_POND_LOCATION_ID, 5), [3, 5, 5]);
  assert.deepEqual(world1DeliveryOrderTiers(TOILET_POND_LOCATION_ID, 2), [2, 2, 2, 2]);

  for (const config of WORLD1_LOCATION_RUN_CONFIGS) {
    for (const tiers of [
      world1DeliveryOrderTiers(config.locationId, 3),
      world1RestoreOrderTiers(config.locationId, 3),
      world1MasteryOrderTiers(config.locationId, 3)
    ]) {
      assert.ok(tiers.length > 0);
      assert.ok(tiers.every((tier) => tier >= 1 && tier <= 3), `${config.locationId} requested an unseen tier`);
    }
  }
});

test('Toilet Pond Stabilize commits only Toilet Pond progress and leaves the main board/economy untouched', () => {
  let state = createInitialState(2_000);
  state = { ...state, maxDiscoveredTier: 5 };
  state = withProgress(state, SNEAKER_GARDEN_LOCATION_ID, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 });
  state = beginCampaignRun(state, 1, TOILET_POND_LOCATION_ID);
  assert.ok(state.campaignRun);

  const mainCells = structuredClone(state.cells);
  const coins = state.coins;
  const mainMerges = state.merges;

  while (state.campaignRun && !state.campaignRun.completed) {
    const occupied = state.campaignRun.cells.flatMap((cell, index) => cell?.tier === 1 ? [index] : []);
    if (occupied.length < 2) {
      // Re-seed two Campaign-only T1s for deterministic blocker clearing; this does not touch the main board.
      const cells = state.campaignRun.cells.slice();
      const free = cells.flatMap((cell, index) => !cell && !state.campaignRun.overgrowth[index] ? [index] : []);
      assert.ok(free.length >= 2);
      cells[free[0]] = { id: `toilet-a-${free[0]}`, familyId: 'toilet-buddy', tier: 1 };
      cells[free[1]] = { id: `toilet-b-${free[1]}`, familyId: 'toilet-buddy', tier: 1 };
      state = { ...state, campaignRun: { ...state.campaignRun, cells } };
      continue;
    }
    state = moveOrMergeCampaignBoard(state, occupied[0], occupied[1]).state;
  }

  assert.ok(state.campaignRun?.completed);
  assert.equal(state.campaign.worlds['1'].locations[TOILET_POND_LOCATION_ID].stabilize, 1);
  assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].mastery, 0);
  assert.deepEqual(state.cells, mainCells);
  assert.equal(state.coins, coins);
  assert.equal(state.merges, mainMerges);

  state = acknowledgeCampaignRunCompletion(state);
  assert.equal(state.campaignRun, null);
  assert.equal(state.campaign.worlds['1'].locations[TOILET_POND_LOCATION_ID].stabilize, 1);
});

test('active Toilet Pond run survives the canonical v6 sanitize/reload boundary', () => {
  let state = createInitialState(3_000);
  state = { ...state, maxDiscoveredTier: 5 };
  state = withProgress(state, SNEAKER_GARDEN_LOCATION_ID, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 });
  state = beginCampaignRun(state, 1, TOILET_POND_LOCATION_ID);
  assert.ok(state.campaignRun);

  const sanitizedRun = sanitizeCampaignRunState(state.campaignRun, state.campaign, state.maxDiscoveredTier);
  assert.equal(sanitizedRun?.locationId, TOILET_POND_LOCATION_ID);
  assert.equal(blockerCount(sanitizedRun), 7);

  const restored = sanitizeState(JSON.parse(JSON.stringify(state)), 4_000);
  assert.equal(restored?.campaignRun?.locationId, TOILET_POND_LOCATION_ID);
  assert.equal(restored?.campaignRun?.phase, 'stabilize');
  assert.equal(blockerCount(restored.campaignRun), 7);
});

test('late World 1 locations stay locked until the immediately previous Landmark is restored', () => {
  let state = createInitialState(5_000);
  assert.equal(isWorld1LocationUnlocked(state.campaign, BACKYARD_CORE_LOCATION_ID), false);
  const blocked = beginCampaignRun({ ...state, maxDiscoveredTier: 8 }, 1, BACKYARD_CORE_LOCATION_ID);
  assert.equal(blocked.campaignRun, null);

  const previousId = WORLD1_LOCATION_RUN_CONFIGS[5].locationId;
  state = withProgress(state, previousId, { stabilize: 1, deliver: 1, restore: 1, mastery: 0 });
  assert.equal(isWorld1LocationUnlocked(state.campaign, BACKYARD_CORE_LOCATION_ID), true);
});
