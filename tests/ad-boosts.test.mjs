import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateCoinBoost,
  activateMutationCharge,
  accrueOfflineIncome,
  accrueOnlineIncome,
  canActivateCoinBoost,
  canClaimGoldenBrainBox,
  createInitialState,
  eligibleFreeUpgradeIds,
  grantFreeUpgrade,
  grantGoldenBrainBox,
  moveOrMerge,
  reconcileAdBoostState,
  sanitizeState,
  settlePendingGoldenBoxes,
  spawnUnit
} from '../build/core/game.js';
import { AD_REWARDS_CONFIG, MAX_RUNTIME_TIER, UPGRADE_DEFINITIONS, maxUpgradeLevel, mergeRewardForTier } from '../build/core/catalog.js';
import { formatCountdown, renderRewardBoostsPanel } from '../build/ui/reward-boosts.js';

test('Coin Boost doubles passive income during its active window, but not merge rewards', () => {
  const base = createInitialState(0);
  const boosted = activateCoinBoost(base, 0);
  assert.equal(accrueOnlineIncome(boosted, 60_000).coins - boosted.coins, 24);
  const merged = moveOrMerge(boosted, 0, 1).state;
  assert.equal(merged.coins - boosted.coins, mergeRewardForTier(2));
});

test('Coin Boost splits income at expiry and resets the daily limit on the next date', () => {
  const boosted = activateCoinBoost(createInitialState(0), 0);
  const afterExpiry = accrueOnlineIncome(boosted, 16 * 60_000);
  assert.equal(afterExpiry.coins - boosted.coins, 12 * 15 * 2 + 12);
  let state = boosted;
  for (let index = 1; index < AD_REWARDS_CONFIG.coinBoost.dailyLimit; index += 1) {
    state = activateCoinBoost({ ...state, adBoosts: { ...state.adBoosts, coinBoostExpiresAt: null } }, index * 900_000);
  }
  assert.equal(state.adBoosts.coinBoostUsesToday, 3);
  assert.equal(canActivateCoinBoost({ ...state, adBoosts: { ...state.adBoosts, coinBoostExpiresAt: null } }, 2_700_000), false);
  const reset = activateCoinBoost({ ...state, adBoosts: { ...state.adBoosts, coinBoostExpiresAt: null } }, 86_400_000);
  assert.equal(reset.adBoosts.coinBoostUsesToday, 1);
});

test('Golden Brain Box respects cooldown, caps to discovery, and queues on a full board', () => {
  const base = { ...createInitialState(0), maxDiscoveredTier: 5, runMaxTier: 5, upgrades: { ...createInitialState(0).upgrades, boxBaseTier: 2 } };
  const opened = grantGoldenBrainBox(base, () => 0, 0);
  assert.equal(opened.cells[4]?.tier, 4);
  assert.equal(opened.paidBoxes, base.paidBoxes);
  assert.equal(canClaimGoldenBrainBox(opened, 1), false);
  assert.equal(canClaimGoldenBrainBox(opened, 30 * 60_000), true);
  const full = { ...base, cells: base.cells.map((cell, index) => cell ?? { id: `unit-${index}`, familyId: 'toilet-buddy', tier: 1 }) };
  const queued = grantGoldenBrainBox(full, () => 0, 0);
  assert.equal(queued.adBoosts.pendingGoldenBoxes, 1);
  const placed = settlePendingGoldenBoxes({ ...queued, cells: [null, ...queued.cells.slice(1)] }, () => 0);
  assert.equal(placed.adBoosts.pendingGoldenBoxes, 0);
});

test('Mutation Charge only applies to the next paid spawn', () => {
  const base = { ...createInitialState(0), coins: 1_000, maxDiscoveredTier: 5, adBoosts: { ...createInitialState(0).adBoosts, mutationCharge: true } };
  const successful = spawnUnit(base, () => 0, false);
  assert.equal(successful.cells[4]?.tier, 3);
  assert.equal(successful.adBoosts.mutationCharge, false);
  const free = spawnUnit(base, () => 0, true);
  assert.equal(free.cells[4]?.tier, 1);
  assert.equal(free.adBoosts.mutationCharge, true);
});

test('Free Upgrade uses the daily limit without spending coins', () => {
  const base = { ...createInitialState(0), coins: 0, maxDiscoveredTier: MAX_RUNTIME_TIER };
  assert.ok(eligibleFreeUpgradeIds(base).length > 0);
  const upgraded = grantFreeUpgrade(base, () => 0, 0);
  const changed = UPGRADE_DEFINITIONS.filter((upgrade) => upgraded.upgrades[upgrade.id] > base.upgrades[upgrade.id]);
  assert.equal(changed.length, 1);
  assert.equal(upgraded.coins, 0);
  const maxed = { ...base, upgrades: Object.fromEntries(UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, maxUpgradeLevel(upgrade.id)])) };
  assert.deepEqual(eligibleFreeUpgradeIds(maxed), []);
});

test('Old saves without adBoosts receive defaults and active boosts round-trip', () => {
  const base = createInitialState(0);
  const legacy = sanitizeState({ ...base, adBoosts: undefined }, 1234);
  assert.ok(legacy);
  assert.equal(legacy.adBoosts.pendingGoldenBoxes, 0);
  const active = activateMutationCharge(activateCoinBoost(base, 0), 0);
  const restored = sanitizeState(structuredClone(active), 0);
  assert.deepEqual(restored?.adBoosts, active.adBoosts);
  const observed = reconcileAdBoostState({ ...active, adBoosts: { ...active.adBoosts, goldenBoxAvailableAt: 1_800_000 } }, 1_000);
  const rolledBack = reconcileAdBoostState(observed, 100);
  assert.equal(rolledBack.adBoosts.lastObservedAt, observed.adBoosts.lastObservedAt);
});

test('Reward Boosts panel exposes four localized actions and countdown formatting', () => {
  assert.equal(formatCountdown(58_001), '00:59');
  const state = createInitialState(0);
  const adBoosts = { coinBoostActive: true, coinBoostRemainingMs: 12 * 60_000 + 38_000, coinBoostUsesToday: 1, coinBoostDailyLimit: 3, goldenBoxReady: false, goldenBoxRemainingMs: 18 * 60_000 + 26_000, mutationReady: true, freeUpgradeUsesToday: 0, freeUpgradeDailyLimit: 1, freeUpgradeEligibleCount: 2, pendingGoldenBoxes: 0 };
  const t = (key, params = {}) => ({
    'adBoost.title': 'Rewarded boosts', 'adBoost.eyebrow': 'AD BOOSTS', 'adBoost.description': 'Optional boosts',
    'adBoost.coin.title': '2X COINS', 'adBoost.coin.description': 'Passive · {minutes} MIN', 'adBoost.golden.title': 'GOLDEN BOX', 'adBoost.golden.description': '+{min}–{max}', 'adBoost.golden.pendingCooldown': 'PENDING · {time}', 'adBoost.golden.pending': 'PENDING', 'adBoost.mutation.title': 'MUTATION', 'adBoost.mutation.description': '+{bonus}', 'adBoost.mutation.readyStatus': 'READY', 'adBoost.nextSpawn': 'NEXT SPAWN', 'adBoost.mutationChance': '{chance}%', 'adBoost.free.title': 'FREE UPGRADE', 'adBoost.free.description': '+1', 'adBoost.active': 'ACTIVE · {time}', 'adBoost.cooldown': 'COOLDOWN · {time}', 'adBoost.available': 'AVAILABLE', 'adBoost.usesToday': '{used}/{limit}', 'adBoost.watchAd': 'WATCH AD', 'adBoost.resultTitle': 'BOOSTED', 'adBoost.resultText': '{upgrade} {level}', 'adBoost.allMaxed': 'MAXED', 'adBoost.usedTodayLabel': 'USED', 'action.adLoading': 'LOADING'
  }[key]?.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`)) ?? key);
  const html = renderRewardBoostsPanel({ state, adBoosts, rewardedAds: true, adBusy: false, adBusyAction: null, freeUpgradeResult: null, t });
  assert.equal((html.match(/data-ad-boost=/g) ?? []).length, 4);
  assert.match(html, /ACTIVE · 12:38/);
});
