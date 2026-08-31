import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SNEAKER_GARDEN_LOCATION_ID,
  acknowledgeCampaignRunCompletion,
  beginCampaignRun,
  campaignRunPresentationSnapshot,
  commitCampaignRunCompletion,
  createSneakerGardenStabilizeRun,
  moveOrMergeCampaignBoard,
  moveOrMergeCampaignRun,
  sanitizeCampaignRunState,
  spawnCampaignRunSupply
} from '../build/core/campaign-run.js';
import { createInitialCampaignProgress } from '../build/core/campaign.js';
import { createInitialState, sanitizeState } from '../build/core/game.js';

function occupiedCount(cells) {
  return cells.filter(Boolean).length;
}

function blockerCount(run) {
  return run.overgrowth.filter(Boolean).length;
}

test('Sneaker Garden starts as an isolated 6x5 campaign board with six Overgrowth blockers', () => {
  const state = createInitialState(1_000);
  const mainCellsBefore = structuredClone(state.cells);
  const coinsBefore = state.coins;
  const next = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);

  assert.ok(next.campaignRun);
  assert.equal(next.campaignRun.cells.length, 30);
  assert.equal(next.campaignRun.overgrowth.length, 30);
  assert.equal(blockerCount(next.campaignRun), 6);
  assert.equal(occupiedCount(next.campaignRun.cells), 4);
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

test('completed run can be acknowledged without erasing permanent Stabilize progress', () => {
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

test('CampaignRun sanitization enforces lifetime discovery and survives save v6 roundtrip', () => {
  const state = beginCampaignRun(createInitialState(5_000), 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  const candidate = structuredClone(state.campaignRun);
  candidate.cells[3] = { id: 'illegal-high-tier', familyId: 'shark-sneakers', tier: 5 };

  const sanitizedRun = sanitizeCampaignRunState(candidate, state.campaign, 1);
  assert.ok(sanitizedRun);
  assert.equal(sanitizedRun.cells[3], null, 'Campaign cannot smuggle undiscovered tiers through a save');

  const serialized = structuredClone({ ...state, campaignRun: sanitizedRun });
  const restored = sanitizeState(serialized, 5_000);
  assert.ok(restored?.campaignRun);
  assert.equal(blockerCount(restored.campaignRun), 6);
  assert.equal(campaignRunPresentationSnapshot(restored.campaignRun)?.overgrowthRemaining, 6);
});
