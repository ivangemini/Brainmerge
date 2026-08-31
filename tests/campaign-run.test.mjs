import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SNEAKER_GARDEN_LOCATION_ID,
  acknowledgeCampaignRunCompletion,
  beginCampaignRun,
  campaignRunPresentationSnapshot,
  commitCampaignRunCompletion,
  createSneakerGardenDeliverRun,
  createSneakerGardenStabilizeRun,
  deliverCampaignBoardUnit,
  deliverCampaignRunUnit,
  moveOrMergeCampaignBoard,
  moveOrMergeCampaignRun,
  sanitizeCampaignRunState,
  sneakerGardenDeliveryOrderTiers,
  spawnCampaignRunSupply
} from '../build/core/campaign-run.js';
import {
  advanceCampaignLocationPhase,
  createInitialCampaignProgress,
  locationProgressPercent
} from '../build/core/campaign.js';
import { createInitialState, sanitizeState } from '../build/core/game.js';

function occupiedCount(cells) {
  return cells.filter(Boolean).length;
}

function blockerCount(run) {
  return run.overgrowth.filter(Boolean).length;
}

function stabilizedState(now = 10_000, maxDiscoveredTier = 4) {
  const state = createInitialState(now);
  return {
    ...state,
    maxDiscoveredTier,
    campaign: advanceCampaignLocationPhase(state.campaign, 1, SNEAKER_GARDEN_LOCATION_ID, 'stabilize', 1)
  };
}

function unitForTier(tier, suffix = 'test') {
  const familyId = {
    1: 'toilet-buddy',
    2: 'camera-dude',
    3: 'sigma-rock',
    4: 'rizz-head'
  }[tier];
  assert.ok(familyId, `test helper needs a family for tier ${tier}`);
  return { id: `deliver-${tier}-${suffix}`, familyId, tier };
}

test('Sneaker Garden starts as an isolated 6x5 campaign board with six Overgrowth blockers', () => {
  const state = createInitialState(1_000);
  const mainCellsBefore = structuredClone(state.cells);
  const coinsBefore = state.coins;
  const next = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);

  assert.ok(next.campaignRun);
  assert.equal(next.campaignRun.phase, 'stabilize');
  assert.equal(next.campaignRun.cells.length, 30);
  assert.equal(next.campaignRun.overgrowth.length, 30);
  assert.equal(blockerCount(next.campaignRun), 6);
  assert.equal(occupiedCount(next.campaignRun.cells), 4);
  assert.deepEqual(next.campaignRun.orderTiers, []);
  assert.equal(next.campaignRun.orderIndex, 0);
  assert.deepEqual(next.cells, mainCellsBefore, 'starting Campaign must not mutate the main board');
  assert.equal(next.coins, coinsBefore, 'starting Campaign must not spend main-run coins');
});

test('Campaign supply is free and capped by lifetime discovery', () => {
  let state = createInitialState(2_000);
  state = { ...state, maxDiscoveredTier: 2 };
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  const coinsBefore = state.coins;
  const paidBoxesBefore = state.paidBoxes;
  const mainCellsBefore = structuredClone(state.cells);

  state = spawnCampaignRunSupply(state, () => 0);
  assert.ok(state.campaignRun);
  assert.equal(state.coins, coinsBefore);
  assert.equal(state.paidBoxes, paidBoxesBefore);
  assert.deepEqual(state.cells, mainCellsBefore);
  assert.ok(state.campaignRun.cells.some((cell) => cell?.tier === 2));
  assert.ok(state.campaignRun.cells.every((cell) => !cell || cell.tier <= 2));
});

test('a Campaign merge clears exactly one nearest Overgrowth cell without paying main-board rewards', () => {
  const state = beginCampaignRun(createInitialState(3_000), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  const coinsBefore = state.coins;
  const xpBefore = state.xp;
  const mainMergesBefore = state.merges;
  const mainCellsBefore = structuredClone(state.cells);
  const blockersBefore = blockerCount(state.campaignRun);

  const result = moveOrMergeCampaignBoard(state, 0, 1);
  assert.equal(result.merged, true);
  assert.ok(result.state.campaignRun);
  assert.equal(blockerCount(result.state.campaignRun), blockersBefore - 1);
  assert.equal(result.state.campaignRun.merges, 1);
  assert.equal(result.state.coins, coinsBefore);
  assert.equal(result.state.xp, xpBefore);
  assert.equal(result.state.merges, mainMergesBefore);
  assert.deepEqual(result.state.cells, mainCellsBefore);
});

test('Overgrowth cells reject movement and remain unusable until a merge pulse clears them', () => {
  const run = createSneakerGardenStabilizeRun(1);
  const sourceId = run.cells[0]?.id;
  const result = moveOrMergeCampaignRun(run, 0, 2);
  assert.equal(result.changed, false);
  assert.equal(result.merged, false);
  assert.equal(result.run.cells[0]?.id, sourceId);
  assert.equal(result.run.cells[2], null);
  assert.equal(result.run.overgrowth[2], true);
});

test('six successful Campaign merges complete Stabilize and commit permanent 20% exactly once', () => {
  let campaign = createInitialCampaignProgress();
  let run = createSneakerGardenStabilizeRun(1);

  for (let step = 0; step < 6; step += 1) {
    const cells = run.cells.slice();
    cells[0] = { id: `pair-a-${step}`, familyId: 'toilet-buddy', tier: 1 };
    cells[1] = { id: `pair-b-${step}`, familyId: 'toilet-buddy', tier: 1 };
    run = { ...run, cells, completed: false };
    const result = moveOrMergeCampaignRun(run, 0, 1);
    assert.equal(result.merged, true);
    run = result.run;
  }

  assert.equal(run.completed, true);
  assert.equal(blockerCount(run), 0);
  campaign = commitCampaignRunCompletion(campaign, run);
  assert.equal(campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].stabilize, 1);
  const committedAgain = commitCampaignRunCompletion(campaign, run);
  assert.deepEqual(committedAgain, campaign, 'completion commit must be exact-once');
});

test('completed Stabilize can be acknowledged without erasing permanent progress', () => {
  let state = beginCampaignRun(createInitialState(4_000), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  state = {
    ...state,
    campaignRun: { ...state.campaignRun, overgrowth: Array(30).fill(false), completed: true }
  };
  state = acknowledgeCampaignRunCompletion(state);
  assert.equal(state.campaignRun, null);
  assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].stabilize, 1);
});

test('CampaignRun sanitization preserves legacy Stabilize v6 saves and rejects undiscovered units', () => {
  const state = beginCampaignRun(createInitialState(5_000), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  const candidate = structuredClone(state.campaignRun);
  delete candidate.orderTiers;
  delete candidate.orderIndex;
  candidate.cells[3] = { id: 'illegal-high-tier', familyId: 'shark-sneakers', tier: 5 };

  const sanitizedRun = sanitizeCampaignRunState(candidate, state.campaign, 1);
  assert.ok(sanitizedRun);
  assert.equal(sanitizedRun.cells[3], null, 'Campaign cannot smuggle undiscovered tiers through a save');
  assert.deepEqual(sanitizedRun.orderTiers, []);
  assert.equal(sanitizedRun.orderIndex, 0);

  const serialized = structuredClone({ ...state, campaignRun: sanitizedRun });
  const restored = sanitizeState(serialized, 5_000);
  assert.ok(restored?.campaignRun);
  assert.equal(blockerCount(restored.campaignRun), 6);
  assert.equal(campaignRunPresentationSnapshot(restored.campaignRun)?.overgrowthRemaining, 6);
});

test('Sneaker Garden Deliver starts after Stabilize on the same isolated Campaign board', () => {
  const state = beginCampaignRun(stabilizedState(6_000, 4), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  assert.equal(state.campaignRun.phase, 'deliver');
  assert.equal(state.campaignRun.cells.length, 30);
  assert.equal(blockerCount(state.campaignRun), 3, 'World 1 Overgrowth remains active during Deliver');
  assert.deepEqual(state.campaignRun.orderTiers, [2, 2, 3, 4]);
  assert.equal(state.campaignRun.orderIndex, 0);
  assert.equal(campaignRunPresentationSnapshot(state.campaignRun)?.activeOrderTier, 2);
});

test('delivery order targets never exceed lifetime discovery', () => {
  assert.deepEqual(sneakerGardenDeliveryOrderTiers(1), [1, 1, 1, 1]);
  assert.deepEqual(sneakerGardenDeliveryOrderTiers(2), [2, 2, 2, 2]);
  assert.deepEqual(sneakerGardenDeliveryOrderTiers(3), [2, 2, 3, 3]);
  assert.deepEqual(sneakerGardenDeliveryOrderTiers(4), [2, 2, 3, 4]);
  assert.deepEqual(sneakerGardenDeliveryOrderTiers(18), [2, 2, 3, 4]);
});

test('mismatched delivery is a no-op and never consumes a Campaign unit', () => {
  const run = createSneakerGardenDeliverRun(4);
  const cells = run.cells.slice();
  cells[0] = unitForTier(1, 'mismatch');
  const candidate = { ...run, cells };
  const result = deliverCampaignRunUnit(candidate, 0);
  assert.equal(result.changed, false);
  assert.equal(result.orderCompleted, false);
  assert.equal(result.run.cells[0]?.tier, 1);
  assert.equal(result.run.orderIndex, 0);
});

test('matching delivery consumes only the Campaign unit and commits one quarter of Deliver', () => {
  let state = beginCampaignRun(stabilizedState(7_000, 4), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  const mainCellsBefore = structuredClone(state.cells);
  const coinsBefore = state.coins;
  const xpBefore = state.xp;
  const mainMergesBefore = state.merges;
  const paidBoxesBefore = state.paidBoxes;
  const cells = state.campaignRun.cells.slice();
  cells[0] = unitForTier(2, 'first-order');
  state = { ...state, campaignRun: { ...state.campaignRun, cells, selectedIndex: 0 } };

  state = deliverCampaignBoardUnit(state, 0);
  assert.ok(state.campaignRun);
  assert.equal(state.campaignRun.cells[0], null);
  assert.equal(state.campaignRun.orderIndex, 1);
  assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].deliver, 0.25);
  assert.deepEqual(state.cells, mainCellsBefore);
  assert.equal(state.coins, coinsBefore);
  assert.equal(state.xp, xpBefore);
  assert.equal(state.merges, mainMergesBefore);
  assert.equal(state.paidBoxes, paidBoxesBefore);
});

test('four matching orders complete Deliver and raise Sneaker Garden from 20% to 45% exactly once', () => {
  let state = beginCampaignRun(stabilizedState(8_000, 4), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);

  for (let step = 0; step < 4; step += 1) {
    assert.ok(state.campaignRun);
    const tier = state.campaignRun.orderTiers[state.campaignRun.orderIndex];
    assert.ok(tier);
    const cells = state.campaignRun.cells.slice();
    cells[0] = unitForTier(tier, `order-${step}`);
    state = { ...state, campaignRun: { ...state.campaignRun, cells } };
    state = deliverCampaignBoardUnit(state, 0);
    assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].deliver, (step + 1) / 4);
  }

  assert.ok(state.campaignRun?.completed);
  const progress = state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID];
  assert.equal(locationProgressPercent(progress), 45);
  const beforeAck = structuredClone(state.campaign);
  state = acknowledgeCampaignRunCompletion(state);
  assert.equal(state.campaignRun, null);
  assert.deepEqual(state.campaign, beforeAck, 'acknowledgement must not double-commit completed orders');
});

test('partial Deliver run and exact-once order progress survive save v6 roundtrip', () => {
  let state = beginCampaignRun(stabilizedState(9_000, 4), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  const cells = state.campaignRun.cells.slice();
  cells[0] = unitForTier(2, 'persist');
  state = { ...state, campaignRun: { ...state.campaignRun, cells } };
  state = deliverCampaignBoardUnit(state, 0);

  const restored = sanitizeState(structuredClone(state), 9_000);
  assert.ok(restored?.campaignRun);
  assert.equal(restored.campaignRun.phase, 'deliver');
  assert.deepEqual(restored.campaignRun.orderTiers, [2, 2, 3, 4]);
  assert.equal(restored.campaignRun.orderIndex, 1);
  assert.equal(restored.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].deliver, 0.25);
  const presentation = campaignRunPresentationSnapshot(restored.campaignRun);
  assert.equal(presentation?.progressPercent, 25);
  assert.equal(presentation?.activeOrderTier, 2);
});
