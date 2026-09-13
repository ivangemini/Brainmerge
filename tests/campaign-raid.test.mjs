import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeCampaignRaidPhase,
  beginCampaignRaid,
  campaignRaidPresentation,
  deliverCampaignRaidUnit,
  moveOrMergeCampaignRaid
} from '../build/core/campaign-raid.js';
import { advanceCampaignLocationPhase, CAMPAIGN_WORLDS, isCampaignWorldUnlocked } from '../build/core/campaign.js';
import { createInitialState, sanitizeState } from '../build/core/game.js';

function raidUnlockedState() {
  let state = { ...createInitialState(0), maxDiscoveredTier: 8, runMaxTier: 8 };
  for (const location of CAMPAIGN_WORLDS[0].locations.slice(0, 6)) {
    for (const phase of ['stabilize', 'deliver', 'restore', 'mastery']) {
      state = { ...state, campaign: advanceCampaignLocationPhase(state.campaign, 1, location.id, phase, 1) };
    }
  }
  return state;
}

function completeMergePhase(state, count) {
  let next = state;
  for (let index = 0; index < count; index += 1) {
    const cells = next.raidRun.cells.slice();
    cells[0] = { id: `raid-a-${index}`, familyId: 'toilet-buddy', tier: 1 };
    cells[4] = { id: `raid-b-${index}`, familyId: 'toilet-buddy', tier: 1 };
    next = moveOrMergeCampaignRaid({ ...next, raidRun: { ...next.raidRun, cells } }, 0, 4);
  }
  return next;
}

test('World 1 Raid persists through three phases and unlocks World 2 exactly once', () => {
  let state = beginCampaignRaid(raidUnlockedState(), 1);
  assert.equal(state.raidRun?.phase, 1);
  assert.equal(state.raidRun?.overgrowth.filter(Boolean).length, 8);
  state = completeMergePhase(state, 8);
  assert.equal(state.raidRun?.completed, true);
  state = sanitizeState(state, 1_000);
  assert.equal(state?.raidRun?.phase, 1, 'completed phase survives reload before acknowledgement');
  state = acknowledgeCampaignRaidPhase(state);
  assert.equal(state.campaign.worlds['1'].raidProgress, 1 / 3);

  state = beginCampaignRaid(state, 1);
  assert.equal(state.raidRun?.phase, 2);
  assert.equal(state.raidRun?.overgrowth.filter(Boolean).length, 12);
  state = acknowledgeCampaignRaidPhase(completeMergePhase(state, 12));

  state = beginCampaignRaid(state, 1);
  assert.equal(state.raidRun?.phase, 3);
  for (const target of state.raidRun.orderTiers) {
    const cells = state.raidRun.cells.slice();
    const familyId = CAMPAIGN_WORLDS && ['toilet-buddy', 'camera-dude', 'sigma-rock', 'rizz-head', 'shark-sneakers', 'crocodile-bomber', 'coffee-ballerina', 'tung-wood'][target - 1];
    cells[0] = { id: `final-${target}`, familyId, tier: target };
    state = deliverCampaignRaidUnit({ ...state, raidRun: { ...state.raidRun, cells } }, 0);
  }
  assert.equal(state.raidRun.completed, true);
  state = acknowledgeCampaignRaidPhase(state);
  assert.equal(state.campaign.worlds['1'].raidCleared, true);
  assert.equal(isCampaignWorldUnlocked(state.campaign, 2), true);
  assert.equal(acknowledgeCampaignRaidPhase(state), state, 'cleared raid cannot award progress twice');
  assert.equal(campaignRaidPresentation(state.raidRun), null);
});

test('World 2 Raid uses its own Traffic Lock layout and order pressure', () => {
  let state = raidUnlockedState();
  state = {
    ...state,
    campaign: {
      ...state.campaign,
      worlds: {
        ...state.campaign.worlds,
        '1': { ...state.campaign.worlds['1'], raidCleared: true, raidProgress: 1 }
      }
    }
  };
  for (const location of CAMPAIGN_WORLDS[1].locations.slice(0, 6)) {
    for (const phase of ['stabilize', 'deliver', 'restore', 'mastery']) {
      state = { ...state, campaign: advanceCampaignLocationPhase(state.campaign, 2, location.id, phase, 1) };
    }
  }
  state = beginCampaignRaid(state, 2);
  assert.equal(state.raidRun?.worldId, 2);
  assert.equal(state.raidRun?.overgrowth.filter(Boolean).length, 7);
  assert.deepEqual(state.raidRun?.orderTiers, []);
});
