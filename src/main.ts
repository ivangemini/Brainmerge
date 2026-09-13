import { BOARD_COLUMNS } from './core/catalog.js';
import { Analytics, BrowserEventAnalyticsSink } from './analytics/analytics.js';
import {
  acknowledgeCampaignRunCompletion,
  abandonCampaignRun,
  beginCampaignRun,
  campaignRunPresentationSnapshot,
  deliverCampaignBoardUnit,
  moveOrMergeCampaignBoard,
  restartCampaignRunPhase,
  selectCampaignBoardCell,
  spawnCampaignRunSupply
} from './core/campaign-run.js';
import { campaignPresentationSnapshot } from './core/campaign.js';
import {
  acknowledgeCampaignRaidPhase,
  beginCampaignRaid,
  campaignRaidPresentation,
  deliverCampaignRaidUnit,
  moveOrMergeCampaignRaid,
  selectCampaignRaidCell,
  spawnCampaignRaidSupply
} from './core/campaign-raid.js';
import {
  accrueOfflineIncome,
  accrueOnlineIncome,
  advanceFastEvents,
  claimCurrentMission,
  claimCollectionReward,
  claimOfflineIncome,
  createInitialState,
  activateCoinBoost,
  activateMutationCharge,
  grantFreeUpgrade,
  grantGoldenBrainBox,
  isBoardFull,
  markSessionStart,
  moveOrMerge,
  performPrestige,
  purchasePrestigeUpgrade,
  purchaseUpgrade,
  recordVisitorProgress,
  rescueDeadlock,
  sanitizeState,
  selectCell,
  spawnUnit,
  tapUnit
} from './core/game.js';
import type { GameState, PrestigeUpgradeId, UpgradeId } from './core/types.js';
import { MusicManager, type MusicTrack } from './audio/music-manager.js';
import { AudioFeedback } from './feedback/audio-feedback.js';
import { runCoinTrail, runDiscoveryCelebration, runUnitFlight } from './feedback/visual-effects.js';
import { detectLocale, loadLocale, translate, type Locale } from './i18n/i18n.js';
import type { PlatformAdapter } from './platform/adapter.js';
import { createPlatformAdapter } from './platform/factory.js';
import { LocalPlatformAdapter } from './platform/local.js';
import { GameView } from './ui/game-view.js';
import type { RewardedAdAction } from './ui/reward-boosts.js';

const rootCandidate = document.querySelector<HTMLElement>('#app');
if (!rootCandidate) throw new Error('Missing #app root');
const root: HTMLElement = rootCandidate;

const INCOME_TICK_MS = 5_000;
const AUTOSAVE_MS = 30_000;
const OFFLINE_REWARD_MIN_MS = 60_000;

let platform: PlatformAdapter = new LocalPlatformAdapter();
let locale: Locale = detectLocale();
let state: GameState = createInitialState();
let adBusy = false;
let adBusyAction: RewardedAdAction | null = null;
let freeUpgradeResult: { id: UpgradeId; level: number } | null = null;
let bootComplete = false;
let lastActiveEventTickAt = Date.now();
const feedback = new AudioFeedback();
const music = new MusicManager();
const analytics = new Analytics(new BrowserEventAnalyticsSink());

function requestMusic(track: MusicTrack | null): void {
  window.dispatchEvent(new CustomEvent('brainmerge:music-request', { detail: { track } }));
}

function campaignWorldTrack(world: unknown): MusicTrack {
  return Number(world) === 2 ? 'world2' : 'world1';
}

window.addEventListener('brainmerge:campaign-open', () => requestMusic('campaign'));
window.addEventListener('brainmerge:campaign-close', () => requestMusic('main'));
window.addEventListener('brainmerge:campaign-world-change', (event) => {
  requestMusic(campaignWorldTrack((event as CustomEvent<{ world?: unknown }>).detail?.world));
});
window.addEventListener('brainmerge:campaign-run', (event) => {
  const detail = (event as CustomEvent<{ world?: unknown; raid?: boolean }>).detail;
  requestMusic(detail?.raid ? 'raid' : campaignWorldTrack(detail?.world));
});
window.addEventListener('brainmerge:campaign-run-close', () => requestMusic('campaign'));
window.addEventListener('brainmerge:raid-open', () => requestMusic('raid'));
window.addEventListener('brainmerge:raid-close', () => requestMusic('campaign'));

function cellElement(index: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-cell="${index}"]`);
}

function motionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function elementCenter(element: Element | null): { x: number; y: number } | null {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function transientClass(element: Element | null, className: string, duration = 700): void {
  if (!(element instanceof HTMLElement)) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function burstAtCell(index: number, particleCount = 12): void {
  if (!motionAllowed()) return;
  const cell = cellElement(index);
  const zone = root.querySelector<HTMLElement>('.board-zone');
  if (!cell || !zone) return;
  const cellRect = cell.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const burst = document.createElement('span');
  burst.className = 'fx-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.left = `${cellRect.left - zoneRect.left + cellRect.width / 2}px`;
  burst.style.top = `${cellRect.top - zoneRect.top + cellRect.height / 2}px`;
  burst.innerHTML = `<i class="fx-burst__ring"></i>${Array.from({ length: particleCount }, (_, i) => `<i class="fx-particle" style="--r:${Math.round(i * 360 / particleCount)}deg;--distance:${28 + (i % 4) * 7}px"></i>`).join('')}`;
  zone.appendChild(burst);
  window.setTimeout(() => burst.remove(), 700);
}

function floatValueAt(point: { x: number; y: number } | null, text: string): void {
  if (!point || !motionAllowed()) return;
  const value = document.createElement('span');
  value.className = 'fx-float-value';
  value.setAttribute('aria-hidden', 'true');
  value.textContent = text;
  value.style.left = `${point.x}px`;
  value.style.top = `${point.y}px`;
  document.body.appendChild(value);
  window.setTimeout(() => value.remove(), 900);
}

function insertedCellIndex(before: GameState, after: GameState): number | null {
  for (let index = 0; index < after.cells.length; index += 1) {
    if (!before.cells[index] && after.cells[index]) return index;
  }
  return null;
}

function changedCellIndexes(before: GameState, after: GameState): number[] {
  const changed: number[] = [];
  for (let index = 0; index < after.cells.length; index += 1) {
    const a = before.cells[index];
    const b = after.cells[index];
    if (a?.id !== b?.id || a?.familyId !== b?.familyId || a?.tier !== b?.tier) changed.push(index);
  }
  return changed;
}

function runSpawnFx(index: number | null): void {
  transientClass(root.querySelector('.spawn-dock'), 'fx-spawn-dock', 560);
  if (index === null) return;
  transientClass(cellElement(index), 'fx-spawn', 660);
  burstAtCell(index, 9);
}

function runMergeFx(index: number, reward: number, discoveredTier: number | null): void {
  const cell = cellElement(index);
  transientClass(cell, 'fx-merge-result', discoveredTier ? 900 : 720);
  burstAtCell(index, discoveredTier && discoveredTier >= 8 ? 24 : state.maxDiscoveredTier >= 7 ? 18 : 14);
  transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
  if (reward > 0) runCoinTrail(elementCenter(cell), root.querySelector('.hud-pill--coin'), reward);
  if (discoveredTier) {
    runDiscoveryCelebration(cell, discoveredTier);
    if (discoveredTier >= 8) {
      window.setTimeout(() => burstAtCell(index, 26), 180);
      window.setTimeout(() => burstAtCell(index, 20), 390);
    }
  }
}

function runRewardFx(selector: string, reward: number, anchor: { x: number; y: number } | null): void {
  transientClass(root.querySelector(selector), 'fx-reward', 660);
  transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
  if (reward > 0) {
    floatValueAt(anchor, `+${reward}`);
    runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
  }
}

function settleOnline(now = Date.now()): void {
  const feverWasActive = state.events.feverRemainingMs > 0;
  const elapsed = Math.max(0, now - lastActiveEventTickAt);
  const canStartEvent = !adBusy && !view.isDragging() && !document.querySelector('[role="dialog"]');
  state = advanceFastEvents(state, elapsed, canStartEvent, false);
  if (!feverWasActive && state.events.feverRemainingMs > 0) {
    analytics.track('fever_started', { tier: state.runMaxTier, activeSeconds: Math.floor(state.events.activeMs / 1000) });
  }
  lastActiveEventTickAt = now;
  state = accrueOnlineIncome(state, now);
}

function accrueReturnIncome(current: GameState, now = Date.now()): GameState {
  const elapsedMs = Math.max(0, now - current.lastAccrualAt);
  return elapsedMs >= OFFLINE_REWARD_MIN_MS
    ? accrueOfflineIncome(current, now)
    : accrueOnlineIncome(current, now);
}

function activateCell(index: number): void {
  const restoreKeyboardFocus = document.activeElement instanceof HTMLElement && document.activeElement.matches('[data-cell]');
  settleOnline();
  if (state.selectedIndex !== null && state.selectedIndex !== index) {
    const from = state.selectedIndex;
    const sourceElement = cellElement(from);
    const targetElement = cellElement(index);
    const before = state;
    const beforeTier = state.maxDiscoveredTier;
    const result = moveOrMerge(state, from, index);
    if (result.merged) runUnitFlight(sourceElement, targetElement, true);
    update(result.state);
    if (result.merged) {
      const reward = Math.max(0, result.state.coins - before.coins);
      const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
      if (discoveredTier) analytics.track('tier_discovered', { tier: discoveredTier, activeSeconds: Math.floor(result.state.events.activeMs / 1000) });
      feedback.trigger('merge', cellElement(index));
      runMergeFx(index, reward, discoveredTier);
    }
    if (restoreKeyboardFocus) cellElement(index)?.focus();
    return;
  }
  update(selectCell(state, state.selectedIndex === index ? null : index), false);
  if (restoreKeyboardFocus) cellElement(index)?.focus();
}

const view = new GameView(root, {
  clicker: () => {
    settleOnline();
    const click = tapUnit(state, Math.random, Date.now());
    if (!click.rewarded) return;
    state = click.state;
    update(state);
    feedback.trigger('reward');
    const anchor = elementCenter(root.querySelector('[data-action="clicker"]'));
    floatValueAt(anchor, `+${click.reward}`);
    if (click.critical) transientClass(root.querySelector('[data-action="clicker"]'), 'fx-critical-tap', 620);
  },
  spawn: () => {
    settleOnline();
    const before = state;
    const beforePaidBoxes = state.paidBoxes;
    const next = spawnUnit(state);
    if (next.paidBoxes > beforePaidBoxes) feedback.trigger('spawn');
    update(next);
    if (next.spawns > before.spawns) runSpawnFx(insertedCellIndex(before, next));
  },
  rewardedSpawn: () => { void handleRewardedSpawn(); },
  rewardedBoost: (action) => { void handleRewardedBoost(action); },
  claimMission: () => {
    settleOnline();
    const anchor = elementCenter(root.querySelector('[data-action="claim-mission"]'));
    const before = state;
    const beforeIndex = state.missionIndex;
    const next = claimCurrentMission(state);
    if (next.missionIndex > beforeIndex) feedback.trigger('reward');
    if (next.missionIndex > beforeIndex) analytics.track('reward_claimed', { source: 'mission', missionIndex: beforeIndex });
    update(next);
    if (next.missionIndex > beforeIndex) runRewardFx('.side-card--mission', Math.max(0, next.coins - before.coins), anchor);
  },
  claimOffline: () => {
    settleOnline();
    const anchor = elementCenter(root.querySelector('[data-action="claim-offline"]'));
    const before = state;
    const hadReward = state.pendingOfflineCoins > 0;
    const next = claimOfflineIncome(state);
    if (hadReward && next.pendingOfflineCoins === 0) feedback.trigger('reward');
    if (hadReward && next.pendingOfflineCoins === 0) analytics.track('reward_claimed', { source: 'offline', amount: next.coins - before.coins });
    update(next);
    if (hadReward && next.pendingOfflineCoins === 0) {
      const reward = Math.max(0, next.coins - before.coins);
      transientClass(root.querySelector('.hud-pill--coin'), 'fx-coin', 480);
      floatValueAt(anchor, `+${reward}`);
      runCoinTrail(anchor, root.querySelector('.hud-pill--coin'), reward);
    }
  },
  claimCollectionReward: (tier: number) => {
    settleOnline();
    const next = claimCollectionReward(state, tier);
    if (next !== state) feedback.trigger('reward');
    if (next !== state) analytics.track('reward_claimed', { source: 'collection', tier });
    update(next);
  },
  prestige: () => {
    if (!window.confirm(translate(locale, 'prestige.confirm'))) return;
    settleOnline();
    const next = performPrestige(state, Date.now());
    if (next !== state) feedback.trigger('reward');
    if (next !== state) analytics.track('prestige_completed', { count: next.prestigeCount, activeSeconds: Math.floor(state.events.activeMs / 1000) });
    update(next);
  },
  purchasePrestigeUpgrade: (id: PrestigeUpgradeId) => {
    settleOnline();
    const before = state.prestigeUpgrades[id];
    const next = purchasePrestigeUpgrade(state, id);
    if (next.prestigeUpgrades[id] > before) feedback.trigger('reward');
    if (next.prestigeUpgrades[id] > before) analytics.track('upgrade_purchased', { kind: `prestige_${id}`, level: next.prestigeUpgrades[id] });
    update(next);
  },
  purchaseUpgrade: (id: UpgradeId) => {
    settleOnline();
    const beforeLevel = state.upgrades[id];
    const next = purchaseUpgrade(state, id);
    if (next.upgrades[id] > beforeLevel) feedback.trigger('reward');
    if (next.upgrades[id] > beforeLevel) analytics.track('upgrade_purchased', { kind: id, level: next.upgrades[id] });
    update(next);
    if (next.upgrades[id] > beforeLevel) {
      const button = root.querySelector(`[data-upgrade="${id}"]`);
      transientClass(button?.closest('.upgrade-card') ?? button, 'fx-upgrade', 680);
      const card = button?.closest('.upgrade-card') ?? button;
      const center = elementCenter(card);
      if (center && card instanceof HTMLElement) {
        const zone = root.querySelector<HTMLElement>('.board-zone');
        const zoneRect = zone?.getBoundingClientRect();
        if (zone && zoneRect) {
          const rect = card.getBoundingClientRect();
          const burst = document.createElement('span');
          burst.className = 'fx-burst';
          burst.setAttribute('aria-hidden', 'true');
          burst.style.left = `${rect.left - zoneRect.left + rect.width / 2}px`;
          burst.style.top = `${rect.top - zoneRect.top + Math.min(58, rect.height / 2)}px`;
          burst.innerHTML = '<i class="fx-burst__ring"></i>';
          zone.appendChild(burst);
          window.setTimeout(() => burst.remove(), 650);
        }
      }
    }
  },
  rescueDeadlock: () => {
    settleOnline();
    const before = state;
    const next = rescueDeadlock(state);
    const changed = changedCellIndexes(before, next);
    if (next !== state && changed.length > 0) feedback.trigger('rescue');
    update(next);
    for (const index of changed.slice(0, 8)) transientClass(cellElement(index), 'fx-rescue', 560);
  },
  select: (index) => activateCell(index),
  moveOrMerge: (from, to) => {
    settleOnline();
    const sourceElement = cellElement(from);
    const targetElement = cellElement(to);
    const before = state;
    const beforeTier = state.maxDiscoveredTier;
    const result = moveOrMerge(state, from, to);
    if (result.merged) runUnitFlight(sourceElement, targetElement, true);
    update(result.state);
    if (result.merged) {
      const reward = Math.max(0, result.state.coins - before.coins);
      const discoveredTier = result.state.maxDiscoveredTier > beforeTier ? result.state.maxDiscoveredTier : null;
      if (discoveredTier) analytics.track('tier_discovered', { tier: discoveredTier, activeSeconds: Math.floor(result.state.events.activeMs / 1000) });
      feedback.trigger('merge', cellElement(to));
      runMergeFx(to, reward, discoveredTier);
    }
  },
  setLocale: async (nextLocale) => {
    settleOnline();
    await loadLocale(nextLocale);
    locale = nextLocale;
    document.documentElement.lang = nextLocale;
    render();
  }
});

function publishCampaignSnapshot(): void {
  window.dispatchEvent(new CustomEvent('brainmerge:campaign-state', {
    detail: {
      ...campaignPresentationSnapshot(state.campaign),
      activeRun: campaignRunPresentationSnapshot(state.campaignRun),
      activeRaid: campaignRaidPresentation(state.raidRun)
    }
  }));
}

function render(): void {
  const t = (key: string, params?: Record<string, string | number>) => translate(locale, key, params);
  view.render(state, locale, t, {
    rewardedAds: platform.capabilities.rewardedAds,
    adBusy,
    adBusyAction,
    freeUpgradeResult
  });
  feedback.setLabels(t('audio.mute'), t('audio.unmute'));
  music.setLabels({
    settings: t('audio.settings'),
    music: t('audio.music'),
    sfx: t('audio.sfx'),
    close: t('audio.close')
  });
  if (!document.body.classList.contains('campaign-open')
    && !document.body.classList.contains('campaign-run-open')
    && !document.body.classList.contains('raid-run-open')) music.playMusic('main');
  publishCampaignSnapshot();
}

function update(next: GameState, persist = true): void {
  state = next;
  render();
  if (persist) void platform.saveState(state);
}

async function handleRewardedSpawn(): Promise<void> {
  settleOnline();
  if (adBusy || isBoardFull(state) || !platform.capabilities.rewardedAds) return;
  adBusy = true;
  feedback.setActive(false);
  music.setActive(false);
  render();
  const rewarded = await platform.showRewarded('brain-box');
  lastActiveEventTickAt = Date.now();
  if (!document.hidden) {
    feedback.setActive(true);
    music.setActive(true);
  }
  adBusy = false;
  settleOnline();
  if (rewarded) {
    const before = state;
    const beforeSpawns = state.spawns;
    const next = spawnUnit(state, Math.random, true);
    update(next);
    if (next.spawns > beforeSpawns) {
      feedback.trigger('reward');
      runSpawnFx(insertedCellIndex(before, next));
    }
    return;
  }
  state = { ...state, messageKey: 'message.rewardUnavailable' };
  render();
}

async function handleRewardedBoost(action: RewardedAdAction): Promise<void> {
  if (adBusy || !platform.capabilities.rewardedAds) return;
  adBusy = true;
  adBusyAction = action;
  feedback.setActive(false);
  music.setActive(false);
  render();
  let rewarded = false;
  try {
    rewarded = await platform.showRewarded(`boost-${action}`);
  } catch {
    rewarded = false;
  }
  lastActiveEventTickAt = Date.now();
  if (!document.hidden) {
    feedback.setActive(true);
    music.setActive(true);
  }
  adBusy = false;
  adBusyAction = null;
  if (!rewarded) {
    state = { ...state, messageKey: 'message.rewardUnavailable' };
    render();
    return;
  }

  const now = Date.now();
  const beforeUpgrade = state.upgrades;
  let next = state;
  if (action === 'coinBoost') next = activateCoinBoost(state, now);
  else if (action === 'goldenBrainBox') next = grantGoldenBrainBox(state, Math.random, now);
  else if (action === 'mutation') next = activateMutationCharge(state, now);
  else if (action === 'freeUpgrade') {
    next = grantFreeUpgrade(state, Math.random, now);
    const changed = (Object.keys(next.upgrades) as UpgradeId[]).find((id) => next.upgrades[id] > beforeUpgrade[id]);
    freeUpgradeResult = changed ? { id: changed, level: next.upgrades[changed] } : null;
  }
  update(next);
  if (freeUpgradeResult) {
    window.setTimeout(() => {
      freeUpgradeResult = null;
      render();
    }, 4_000);
  }
}

async function boot(): Promise<void> {
  platform = await createPlatformAdapter();
  try {
    await platform.initialize();
  } catch {
    platform = new LocalPlatformAdapter();
    await platform.initialize();
  }

  locale = platform.preferredLocale() ?? detectLocale();
  await Promise.all([loadLocale('en'), loadLocale('ru'), loadLocale(locale)]);
  document.documentElement.lang = locale;

  const now = Date.now();
  const saved = sanitizeState(await platform.loadState(), now);
  if (saved) {
    const returned = accrueReturnIncome(saved, now);
    const elapsedDays = Math.floor(Math.max(0, now - returned.retention.firstSeenAt) / 86_400_000);
    state = markSessionStart(returned, now);
    analytics.track('session_return', {
      session: state.retention.sessionCount,
      elapsedDays,
      d1: elapsedDays >= 1,
      d7: elapsedDays >= 7,
      activeSeconds: Math.floor(state.events.activeMs / 1000),
      afterT18Seconds: Math.floor(state.retention.activeAfterT18Ms / 1000)
    });
  }
  else state = createInitialState(now);
  render();
  // Platform Game Ready must be emitted only after locale/save restoration and the
  // first complete interactive render. Yandex moderation explicitly checks this timing.
  await platform.gameReady();
  void platform.saveState(state);
  bootComplete = true;
  lastActiveEventTickAt = Date.now();
}

window.setInterval(() => {
  if (!bootComplete || document.hidden) return;
  const before = state;
  settleOnline(Date.now());
  const next = state;
  if (next.coins !== before.coins || next.incomeRemainder !== before.incomeRemainder
    || next.events.feverRemainingMs !== before.events.feverRemainingMs) {
    const t = (key: string, params?: Record<string, string | number>) => translate(locale, key, params);
    view.renderPassive(state, locale, t);
  }
}, INCOME_TICK_MS);

// Passive-only sessions still receive periodic canonical snapshots. This bounds
// cloud/local data loss without writing on every 5-second income presentation tick.
window.setInterval(() => {
  if (!bootComplete || document.hidden) return;
  settleOnline();
  void platform.saveState(state);
}, AUTOSAVE_MS);

window.addEventListener('brainmerge:campaign-state-request', publishCampaignSnapshot);

window.addEventListener('brainmerge:campaign-command', (event) => {
  if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== 'object') return;
  const command = event.detail as Record<string, unknown>;
  const type = command.type;
  if (typeof type !== 'string') return;

  if (type === 'start') {
    const worldId = typeof command.worldId === 'number' ? command.worldId : Number.NaN;
    const locationId = typeof command.locationId === 'string' ? command.locationId : '';
    if (!Number.isInteger(worldId) || !locationId) return;
    settleOnline();
    const next = beginCampaignRun(state, worldId, locationId);
    if (next.campaignRun !== state.campaignRun) analytics.track('campaign_started', { worldId, location: locationId });
    update(next);
    return;
  }

  if (type === 'spawn') {
    settleOnline();
    update(spawnCampaignRunSupply(state));
    return;
  }

  if (type === 'select') {
    const index = command.index === null ? null : typeof command.index === 'number' ? command.index : Number.NaN;
    if (index !== null && !Number.isInteger(index)) return;
    update(selectCampaignBoardCell(state, index), false);
    return;
  }

  if (type === 'moveOrMerge') {
    const from = typeof command.from === 'number' ? command.from : Number.NaN;
    const to = typeof command.to === 'number' ? command.to : Number.NaN;
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    settleOnline();
    update(moveOrMergeCampaignBoard(state, from, to).state);
    return;
  }

  if (type === 'deliver') {
    const index = typeof command.index === 'number' ? command.index : Number.NaN;
    if (!Number.isInteger(index)) return;
    settleOnline();
    const beforeOrder = state.campaignRun?.orderIndex ?? 0;
    let next = deliverCampaignBoardUnit(state, index);
    if ((next.campaignRun?.orderIndex ?? 0) > beforeOrder) next = recordVisitorProgress(next, 'campaignDelivery');
    if ((next.campaignRun?.orderIndex ?? 0) > beforeOrder) analytics.track('campaign_order_delivered', { worldId: next.campaignRun?.worldId ?? 0, tier: next.campaignRun?.orderTiers[beforeOrder] ?? 0 });
    update(next);
    return;
  }

  if (type === 'acknowledge') {
    settleOnline();
    update(acknowledgeCampaignRunCompletion(state));
    return;
  }

  if (type === 'restart') {
    settleOnline();
    update(restartCampaignRunPhase(state));
    return;
  }

  if (type === 'abandon') {
    settleOnline();
    update(abandonCampaignRun(state));
    return;
  }

  if (type === 'startRaid') {
    const worldId = typeof command.worldId === 'number' ? command.worldId : Number.NaN;
    if (!Number.isInteger(worldId)) return;
    settleOnline();
    update(beginCampaignRaid(state, worldId));
    return;
  }
  if (type === 'raidSpawn') { settleOnline(); update(spawnCampaignRaidSupply(state)); return; }
  if (type === 'raidSelect') {
    const index = command.index === null ? null : Number(command.index);
    if (index !== null && !Number.isInteger(index)) return;
    update(selectCampaignRaidCell(state, index), false);
    return;
  }
  if (type === 'raidMoveOrMerge') {
    const from = Number(command.from); const to = Number(command.to);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    settleOnline(); update(moveOrMergeCampaignRaid(state, from, to)); return;
  }
  if (type === 'raidDeliver') {
    const index = Number(command.index); if (!Number.isInteger(index)) return;
    settleOnline(); update(deliverCampaignRaidUnit(state, index)); return;
  }
  if (type === 'raidAcknowledge') {
    settleOnline(); update(acknowledgeCampaignRaidPhase(state));
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    settleOnline();
    update(selectCell(state, null), false);
  }
  if (event.key.toLowerCase() === 'm' && event.target === document.body) feedback.toggleMute();
});

// Board buttons are fully keyboard-operable. Enter/Space follows the exact same
// select/move/merge path as pointer input; arrow keys only move focus and never spend currency.
root.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null;
  if (!target) return;
  const index = Number(target.dataset.cell);
  if (!Number.isInteger(index) || index < 0 || index >= state.cells.length) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activateCell(index);
    return;
  }

  let nextIndex: number | null = null;
  if (event.key === 'ArrowLeft' && index % BOARD_COLUMNS > 0) nextIndex = index - 1;
  if (event.key === 'ArrowRight' && index % BOARD_COLUMNS < BOARD_COLUMNS - 1 && index + 1 < state.cells.length) nextIndex = index + 1;
  if (event.key === 'ArrowUp' && index >= BOARD_COLUMNS) nextIndex = index - BOARD_COLUMNS;
  if (event.key === 'ArrowDown' && index + BOARD_COLUMNS < state.cells.length) nextIndex = index + BOARD_COLUMNS;
  if (nextIndex !== null) {
    event.preventDefault();
    cellElement(nextIndex)?.focus();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!bootComplete) return;
  const now = Date.now();
  if (document.hidden) {
    settleOnline(now);
    platform.setGameplayActive(false);
    feedback.setActive(false);
    music.setActive(false);
    // Mobile browsers may suspend before pagehide. Flush the latest economy snapshot now.
    void platform.saveState(state, true);
    return;
  }
  state = accrueReturnIncome(state, now);
  lastActiveEventTickAt = now;
  platform.setGameplayActive(true);
  feedback.setActive(true);
  music.setActive(true);
  render();
  void platform.saveState(state);
});

window.addEventListener('pagehide', () => {
  if (!bootComplete) return;
  settleOnline();
  platform.setGameplayActive(false);
  music.setActive(false);
  void platform.saveState(state, true);
});

void boot();
