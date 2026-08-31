import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SNEAKER_GARDEN_LOCATION_ID,
  acknowledgeCampaignRunCompletion,
  beginCampaignRun,
  campaignRunPresentationSnapshot,
  campaignSupplyLuckyChanceForLandmarkLevel,
  createSneakerGardenMasteryRun,
  createSneakerGardenRestoreRun,
  deliverCampaignBoardUnit,
  moveOrMergeCampaignRun,
  sneakerGardenLandmarkLevel,
  sneakerGardenMasteryOrderTiers,
  sneakerGardenRestoreOrderTiers,
  spawnCampaignRunSupply
} from '../build/core/campaign-run.js';
import { createInitialCampaignProgress, locationProgressPercent } from '../build/core/campaign.js';
import { createInitialState, sanitizeState } from '../build/core/game.js';

const FAMILY_BY_TIER = new Map([
  [1, 'toilet-buddy'],
  [2, 'camera-dude'],
  [3, 'sigma-rock'],
  [4, 'rizz-head']
]);

function unitForTier(tier, suffix = 'x') {
  const familyId = FAMILY_BY_TIER.get(tier);
  assert.ok(familyId, `missing test family for T${tier}`);
  return { id: `campaign-test-${tier}-${suffix}`, familyId, tier };
}

function withSneakerGardenProgress(state, { stabilize = 0, deliver = 0, restore = 0, mastery = 0 } = {}) {
  const campaign = structuredClone(state.campaign);
  Object.assign(campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID], { stabilize, deliver, restore, mastery });
  return { ...state, campaign };
}

function blockerCount(run) {
  return run.overgrowth.filter(Boolean).length;
}

test('Restore starts after Deliver with three two-order Landmark batches on the isolated board', () => {
  let state = createInitialState(10_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1 });
  const mainBoard = structuredClone(state.cells);
  const coins = state.coins;

  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  assert.equal(state.campaignRun.phase, 'restore');
  assert.deepEqual(state.campaignRun.orderTiers, [2, 2, 3, 3, 4, 4]);
  assert.equal(blockerCount(state.campaignRun), 2);
  assert.equal(state.campaignRun.cells.length, 30);
  assert.deepEqual(state.cells, mainBoard);
  assert.equal(state.coins, coins);

  const presentation = campaignRunPresentationSnapshot(state.campaignRun);
  assert.equal(presentation?.restoreBatchTotal, 3);
  assert.equal(presentation?.restoreBatchIndex, 0);
});

test('Restore and Mastery order targets never exceed lifetime discovery', () => {
  assert.deepEqual(sneakerGardenRestoreOrderTiers(1), [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(sneakerGardenRestoreOrderTiers(3), [2, 2, 3, 3, 3, 3]);
  assert.deepEqual(sneakerGardenMasteryOrderTiers(1), [1, 1, 1]);
  assert.deepEqual(sneakerGardenMasteryOrderTiers(3), [3, 3, 3]);
  assert.deepEqual(sneakerGardenMasteryOrderTiers(4), [3, 4, 4]);
});

test('Restore commits permanent progress only when a full two-order batch is complete', () => {
  let state = createInitialState(11_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1 });
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);

  state = {
    ...state,
    campaignRun: { ...state.campaignRun, cells: state.campaignRun.cells.map((cell, index) => index === 0 ? unitForTier(2, 'a') : cell) }
  };
  state = deliverCampaignBoardUnit(state, 0);
  assert.equal(state.campaignRun?.orderIndex, 1);
  assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].restore, 0, 'half a batch must not commit Landmark progress');

  state = {
    ...state,
    campaignRun: { ...state.campaignRun, cells: state.campaignRun.cells.map((cell, index) => index === 0 ? unitForTier(2, 'b') : cell) }
  };
  state = deliverCampaignBoardUnit(state, 0);
  assert.equal(state.campaignRun?.orderIndex, 2);
  assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].restore, 1 / 3);
  assert.equal(sneakerGardenLandmarkLevel(state.campaign), 1);
});

test('three completed Restore batches raise Sneaker Garden from 45% to 90% exactly once', () => {
  let state = createInitialState(12_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1 });
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  const mainBoard = structuredClone(state.cells);
  const coins = state.coins;

  for (let index = 0; index < 6; index += 1) {
    assert.ok(state.campaignRun);
    const tier = state.campaignRun.orderTiers[state.campaignRun.orderIndex];
    assert.ok(tier);
    const cells = state.campaignRun.cells.slice();
    cells[0] = unitForTier(tier, String(index));
    state = { ...state, campaignRun: { ...state.campaignRun, cells } };
    state = deliverCampaignBoardUnit(state, 0);
    const expectedBatches = Math.floor((index + 1) / 2);
    assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].restore, expectedBatches / 3);
  }

  assert.equal(state.campaignRun?.completed, true);
  assert.equal(sneakerGardenLandmarkLevel(state.campaign), 3);
  const location = state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID];
  assert.equal(locationProgressPercent(location), 90);
  assert.deepEqual(state.cells, mainBoard, 'Landmark deliveries must never consume main-board units');
  assert.equal(state.coins, coins, 'Landmark deliveries must not spend main-board coins');

  const acknowledged = acknowledgeCampaignRunCompletion(state);
  assert.equal(acknowledged.campaignRun, null);
  assert.equal(acknowledged.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].restore, 1);
  assert.deepEqual(acknowledgeCampaignRunCompletion(acknowledged), acknowledged, 'acknowledgement must be exact-once');
});

test('Landmark levels provide a bounded permanent Campaign Supply lucky-tier perk', () => {
  assert.equal(campaignSupplyLuckyChanceForLandmarkLevel(0), 0.25);
  assert.equal(campaignSupplyLuckyChanceForLandmarkLevel(1), 0.30);
  assert.equal(campaignSupplyLuckyChanceForLandmarkLevel(2), 0.35);
  assert.equal(campaignSupplyLuckyChanceForLandmarkLevel(3), 0.40);
  assert.equal(campaignSupplyLuckyChanceForLandmarkLevel(99), 0.40);

  let state = createInitialState(13_000);
  state = { ...state, maxDiscoveredTier: 3 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1 });
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  state = spawnCampaignRunSupply(state, () => 0.27);
  const noLandmarkTier = state.campaignRun?.cells[2]?.tier;
  assert.equal(noLandmarkTier, 2, '0.27 must miss the base 25% lucky-tier chance');

  let boosted = createInitialState(13_500);
  boosted = { ...boosted, maxDiscoveredTier: 3 };
  boosted = withSneakerGardenProgress(boosted, { stabilize: 1, deliver: 1, restore: 1 / 3 });
  boosted = { ...boosted, campaignRun: createSneakerGardenRestoreRun(3) };
  boosted = spawnCampaignRunSupply(boosted, () => 0.27);
  assert.equal(boosted.campaignRun?.cells[2]?.tier, 3, 'Landmark Lv1 must turn 0.27 into a lucky T3 supply');
});

test('partial Restore batch state and permanent Landmark level survive save v6 roundtrip', () => {
  let state = createInitialState(14_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1, restore: 1 / 3 });
  const run = createSneakerGardenRestoreRun(4);
  state = { ...state, campaignRun: { ...run, orderIndex: 3 } };

  const restored = sanitizeState(structuredClone(state), 14_000);
  assert.ok(restored?.campaignRun);
  assert.equal(restored.campaignRun.phase, 'restore');
  assert.equal(restored.campaignRun.orderIndex, 3);
  assert.equal(restored.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].restore, 1 / 3);
  assert.equal(sneakerGardenLandmarkLevel(restored.campaign), 1);
  const snapshot = campaignRunPresentationSnapshot(restored.campaignRun);
  assert.equal(snapshot?.restoreBatchIndex, 1);
  assert.equal(snapshot?.restoreBatchOrderIndex, 1);
});

test('Mastery unlocks after Landmark Lv3 with a stronger immutable Overgrowth layout', () => {
  let state = createInitialState(15_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1, restore: 1 });
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.ok(state.campaignRun);
  assert.equal(state.campaignRun.phase, 'mastery');
  assert.deepEqual(state.campaignRun.orderTiers, [3, 4, 4]);
  assert.equal(blockerCount(state.campaignRun), 5);

  const cells = state.campaignRun.cells.slice();
  cells[0] = unitForTier(1, 'merge-a');
  cells[1] = unitForTier(1, 'merge-b');
  const result = moveOrMergeCampaignRun({ ...state.campaignRun, cells }, 0, 1);
  assert.equal(result.merged, true);
  assert.equal(result.clearedIndex, null, 'Mastery merges must not clear locked Overgrowth');
  assert.equal(blockerCount(result.run), 5, 'Mastery Overgrowth must remain fully locked');
});

test('three Mastery orders commit the final 10% and produce a 100% restored Location', () => {
  let state = createInitialState(16_000);
  state = { ...state, maxDiscoveredTier: 4 };
  state = withSneakerGardenProgress(state, { stabilize: 1, deliver: 1, restore: 1 });
  state = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  const mainBoard = structuredClone(state.cells);

  for (let index = 0; index < 3; index += 1) {
    assert.ok(state.campaignRun);
    const tier = state.campaignRun.orderTiers[state.campaignRun.orderIndex];
    const cells = state.campaignRun.cells.slice();
    cells[0] = unitForTier(tier, `mastery-${index}`);
    state = { ...state, campaignRun: { ...state.campaignRun, cells } };
    state = deliverCampaignBoardUnit(state, 0);
    assert.equal(state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID].mastery, (index + 1) / 3);
  }

  assert.equal(state.campaignRun?.completed, true);
  const location = state.campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID];
  assert.equal(locationProgressPercent(location), 100);
  assert.deepEqual(state.cells, mainBoard);

  state = acknowledgeCampaignRunCompletion(state);
  assert.equal(state.campaignRun, null);
  const restarted = beginCampaignRun(state, 1, SNEAKER_GARDEN_LOCATION_ID);
  assert.equal(restarted.campaignRun, null, 'fully mastered location must not create another mandatory run');
});

test('corrupted Mastery save cannot remove locked Overgrowth or smuggle undiscovered targets', () => {
  const campaign = createInitialCampaignProgress();
  Object.assign(campaign.worlds['1'].locations[SNEAKER_GARDEN_LOCATION_ID], { stabilize: 1, deliver: 1, restore: 1 });
  const run = createSneakerGardenMasteryRun(4);
  run.overgrowth.fill(false);
  run.orderTiers = [4, 4, 9];

  const state = createInitialState(17_000);
  const candidate = { ...state, maxDiscoveredTier: 4, campaign, campaignRun: run };
  const restored = sanitizeState(structuredClone(candidate), 17_000);
  assert.ok(restored?.campaignRun);
  assert.equal(blockerCount(restored.campaignRun), 5);
  assert.deepEqual(restored.campaignRun.orderTiers, [3, 4, 4]);
});
