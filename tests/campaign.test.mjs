import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPAIGN_LOCATION_PHASES,
  CAMPAIGN_PHASE_WEIGHTS,
  CAMPAIGN_WORLDS,
  FULL_CAMPAIGN_WORLD_COUNT,
  LOCATIONS_PER_WORLD,
  campaignLocationById,
  createInitialLocationProgress,
  createInitialWorldProgress,
  currentLocationPhase,
  isWorldFullyRestored,
  isWorldRaidUnlocked,
  locationProgressPercent,
  restoredLandmarkCount,
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
