import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPAIGN_LOCATION_PHASES,
  CAMPAIGN_PHASE_WEIGHTS,
  CAMPAIGN_WORLDS,
  FULL_CAMPAIGN_WORLD_COUNT,
  LOCATIONS_PER_WORLD,
  advanceCampaignLocationPhase,
  advanceCampaignRaid,
  campaignLocationById,
  campaignPresentationSnapshot,
  createInitialCampaignProgress,
  createInitialLocationProgress,
  createInitialWorldProgress,
  currentLocationPhase,
  isCampaignWorldUnlocked,
  isWorldFullyRestored,
  isWorldRaidUnlocked,
  locationProgressPercent,
  restoredLandmarkCount,
  sanitizeCampaignProgress,
  worldProgressPercent
} from '../build/core/campaign.js';

test('campaign north star is eight worlds built from seven locations plus a world raid', () => {
  assert.equal(FULL_CAMPAIGN_WORLD_COUNT, 8);
  assert.equal(LOCATIONS_PER_WORLD, 7);
  assert.equal(CAMPAIGN_WORLDS.length, 2, 'only Worlds 1-2 are production-authored so far');
  for (const world of CAMPAIGN_WORLDS) {
    assert.equal(world.locations.length, LOCATIONS_PER_WORLD);
    assert.equal(world.raid.phaseCount, 3);
    assert.equal(world.raid.unlockWorldProgressPercent, 80);
    assert.equal(world.raid.unlockRestoredLandmarks, 5);
  }
});

test('location progression is four persistent phases rather than one-shot stage stars', () => {
  assert.deepEqual(CAMPAIGN_LOCATION_PHASES, ['stabilize', 'deliver', 'restore', 'mastery']);
  const totalWeight = Object.values(CAMPAIGN_PHASE_WEIGHTS).reduce((sum, value) => sum + value, 0);
  assert.equal(totalWeight, 1);

  const initial = createInitialLocationProgress();
  assert.equal(locationProgressPercent(initial), 0);
  assert.equal(currentLocationPhase(initial), 'stabilize');

  const stabilized = { ...initial, stabilize: 1 };
  assert.equal(locationProgressPercent(stabilized), 20);
  assert.equal(currentLocationPhase(stabilized), 'deliver');

  const delivered = { ...stabilized, deliver: 1 };
  assert.equal(locationProgressPercent(delivered), 45);
  assert.equal(currentLocationPhase(delivered), 'restore');

  const restored = { ...delivered, restore: 1 };
  assert.equal(locationProgressPercent(restored), 90);
  assert.equal(currentLocationPhase(restored), 'mastery');

  const mastered = { ...restored, mastery: 1 };
  assert.equal(locationProgressPercent(mastered), 100);
  assert.equal(currentLocationPhase(mastered), 'complete');
});

test('world raid unlock requires both world restoration and restored landmarks', () => {
  const world = CAMPAIGN_WORLDS[0];
  assert.ok(world);
  const progress = createInitialWorldProgress(world);
  assert.equal(worldProgressPercent(world, progress), 0);
  assert.equal(restoredLandmarkCount(world, progress), 0);
  assert.equal(isWorldRaidUnlocked(world, progress), false);

  for (const location of world.locations) {
    progress.locations[location.id] = { stabilize: 1, deliver: 1, restore: 1, mastery: 0 };
  }

  assert.equal(worldProgressPercent(world, progress), 90);
  assert.equal(restoredLandmarkCount(world, progress), 7);
  assert.equal(isWorldRaidUnlocked(world, progress), true);
  assert.equal(isWorldFullyRestored(world, progress), false);

  for (const location of world.locations) {
    progress.locations[location.id].mastery = 1;
  }
  progress.raidCleared = true;
  assert.equal(worldProgressPercent(world, progress), 100);
  assert.equal(isWorldFullyRestored(world, progress), true);
});

test('campaign locations have stable ids and increasing order-tier pressure', () => {
  for (const world of CAMPAIGN_WORLDS) {
    const ids = new Set(world.locations.map((location) => location.id));
    assert.equal(ids.size, LOCATIONS_PER_WORLD);
    for (let index = 0; index < world.locations.length; index += 1) {
      const location = world.locations[index];
      assert.equal(location.index, index + 1);
      assert.ok(location.orderTierMin >= 1);
      assert.ok(location.orderTierMax >= location.orderTierMin);
      assert.equal(campaignLocationById(world, location.id)?.id, location.id);
    }
    for (let index = 1; index < world.locations.length; index += 1) {
      assert.ok(world.locations[index].orderTierMax >= world.locations[index - 1].orderTierMax);
    }
  }
});

test('persistent phase transactions enforce phase order and never regress', () => {
  let campaign = createInitialCampaignProgress();
  const locationId = CAMPAIGN_WORLDS[0].locations[0].id;

  const blockedDeliver = advanceCampaignLocationPhase(campaign, 1, locationId, 'deliver', 0.5);
  assert.deepEqual(blockedDeliver, campaign, 'deliver cannot advance before stabilize is complete');

  campaign = advanceCampaignLocationPhase(campaign, 1, locationId, 'stabilize', 0.5);
  assert.equal(campaign.worlds['1'].locations[locationId].stabilize, 0.5);
  campaign = advanceCampaignLocationPhase(campaign, 1, locationId, 'stabilize', 0.75);
  assert.equal(campaign.worlds['1'].locations[locationId].stabilize, 1, 'phase progress clamps to 100%');

  campaign = advanceCampaignLocationPhase(campaign, 1, locationId, 'deliver', 1);
  campaign = advanceCampaignLocationPhase(campaign, 1, locationId, 'restore', 1);
  assert.equal(locationProgressPercent(campaign.worlds['1'].locations[locationId]), 90);
});

test('world 2 remains locked until world 1 raid is cleared', () => {
  let campaign = createInitialCampaignProgress();
  assert.equal(isCampaignWorldUnlocked(campaign, 1), true);
  assert.equal(isCampaignWorldUnlocked(campaign, 2), false);

  const world = CAMPAIGN_WORLDS[0];
  for (const location of world.locations) {
    for (const phase of CAMPAIGN_LOCATION_PHASES) {
      campaign = advanceCampaignLocationPhase(campaign, 1, location.id, phase, 1);
    }
  }
  assert.equal(isWorldRaidUnlocked(world, campaign.worlds['1']), true);
  campaign = advanceCampaignRaid(campaign, 1, 0.4);
  assert.equal(campaign.worlds['1'].raidCleared, false);
  campaign = advanceCampaignRaid(campaign, 1, 0.7);
  assert.equal(campaign.worlds['1'].raidProgress, 1);
  assert.equal(campaign.worlds['1'].raidCleared, true);
  assert.equal(isCampaignWorldUnlocked(campaign, 2), true);
});

test('campaign sanitization drops unknown fields and clamps persistent progress', () => {
  const sanitized = sanitizeCampaignProgress({
    worlds: {
      '1': {
        locations: {
          'w1-sneaker-garden': { stabilize: 99, deliver: -2, restore: 0.4, mastery: 3 },
          'unknown-location': { stabilize: 1, deliver: 1, restore: 1, mastery: 1 }
        },
        raidProgress: 4,
        raidCleared: false
      },
      '99': { raidProgress: 1, raidCleared: true }
    }
  });

  assert.deepEqual(sanitized.worlds['1'].locations['w1-sneaker-garden'], {
    stabilize: 1,
    deliver: 0,
    restore: 0.4,
    mastery: 1
  });
  assert.equal(sanitized.worlds['1'].raidProgress, 1);
  assert.equal(sanitized.worlds['1'].raidCleared, true);
  assert.equal(sanitized.worlds['1'].locations['unknown-location'], undefined);
  assert.equal(sanitized.worlds['99'], undefined);
});

test('presentation snapshot exposes only derived campaign truth for UI', () => {
  const campaign = createInitialCampaignProgress();
  const snapshot = campaignPresentationSnapshot(campaign);
  assert.equal(snapshot.worlds.length, 2);
  assert.equal(snapshot.worlds[0].unlocked, true);
  assert.equal(snapshot.worlds[0].percent, 0);
  assert.equal(snapshot.worlds[0].restoredLandmarks, 0);
  assert.equal(snapshot.worlds[0].raidUnlocked, false);
  assert.equal(snapshot.worlds[0].locations.length, 7);
  assert.equal(snapshot.worlds[0].locations[0].currentPhase, 'stabilize');
  assert.equal(snapshot.worlds[1].unlocked, false);
});
