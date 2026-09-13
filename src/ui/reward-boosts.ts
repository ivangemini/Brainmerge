import { AD_REWARDS_CONFIG, UPGRADE_DEFINITIONS } from '../core/catalog.js';
import type { AdBoostPresentation } from '../core/game.js';
import type { GameState, UpgradeId } from '../core/types.js';

export type RewardedAdAction = 'coinBoost' | 'goldenBrainBox' | 'mutation' | 'freeUpgrade';
export type Translator = (key: string, params?: Record<string, string | number>) => string;

export interface RewardBoostsPanelOptions {
  state: GameState;
  adBoosts: AdBoostPresentation;
  rewardedAds: boolean;
  adBusy: boolean;
  adBusyAction: RewardedAdAction | null;
  freeUpgradeResult: { id: UpgradeId; level: number } | null;
  t: Translator;
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function cardButton(options: RewardBoostsPanelOptions, action: RewardedAdAction, disabled: boolean, fallback: string): string {
  const label = options.adBusyAction === action ? options.t('action.adLoading') : fallback;
  return `<button type="button" data-ad-boost="${action}" ${disabled || options.adBusy ? 'disabled' : ''}>${label}</button>`;
}

function renderCoinCard(options: RewardBoostsPanelOptions): string {
  const { adBoosts, t } = options;
  const limitReached = adBoosts.coinBoostUsesToday >= adBoosts.coinBoostDailyLimit;
  const status = adBoosts.coinBoostActive
    ? `<span>${t('adBoost.active', { time: formatCountdown(adBoosts.coinBoostRemainingMs) })}</span>`
    : `<span>${t('adBoost.usesToday', { used: adBoosts.coinBoostUsesToday, limit: adBoosts.coinBoostDailyLimit })}</span>${limitReached ? `<small>${t('adBoost.comeBackTomorrow')}</small>` : ''}`;
  const fallback = adBoosts.coinBoostActive ? t('adBoost.active', { time: formatCountdown(adBoosts.coinBoostRemainingMs) }) : limitReached ? t('adBoost.comeBackTomorrow') : t('adBoost.watchAd');
  return `<article class="ad-boost-card ad-boost-card--coin ${adBoosts.coinBoostActive ? 'is-active' : ''}"><div class="ad-boost-card__heading"><span class="ad-boost-card__icon" aria-hidden="true">⚡</span><strong>${t('adBoost.coin.title')}</strong></div><small>${t('adBoost.coin.description', { minutes: AD_REWARDS_CONFIG.coinBoost.durationMinutes })}</small><div class="ad-boost-card__status">${status}</div>${cardButton(options, 'coinBoost', adBoosts.coinBoostActive || limitReached, fallback)}</article>`;
}

function renderGoldenCard(options: RewardBoostsPanelOptions): string {
  const { adBoosts, t } = options;
  const cooldown = !adBoosts.goldenBoxReady;
  const status = adBoosts.pendingGoldenBoxes > 0
    ? cooldown ? t('adBoost.golden.pendingCooldown', { time: formatCountdown(adBoosts.goldenBoxRemainingMs) }) : t('adBoost.golden.pending')
    : cooldown ? t('adBoost.cooldown', { time: formatCountdown(adBoosts.goldenBoxRemainingMs) }) : t('adBoost.ready');
  return `<article class="ad-boost-card ad-boost-card--golden ${adBoosts.goldenBoxReady ? 'is-ready' : ''}"><div class="ad-boost-card__heading"><span class="ad-boost-card__icon" aria-hidden="true">🎁</span><strong>${t('adBoost.golden.title')}</strong></div><small>${t('adBoost.golden.description', { min: AD_REWARDS_CONFIG.goldenBrainBox.minTierBonus, max: AD_REWARDS_CONFIG.goldenBrainBox.maxTierBonus })}</small><div class="ad-boost-card__status"><span>${status}</span></div>${cardButton(options, 'goldenBrainBox', cooldown, cooldown ? t('adBoost.cooldown', { time: formatCountdown(adBoosts.goldenBoxRemainingMs) }) : t('adBoost.watchAd'))}</article>`;
}

function renderMutationCard(options: RewardBoostsPanelOptions): string {
  const { adBoosts, t } = options;
  const chance = Math.round(AD_REWARDS_CONFIG.mutation.chance * 100);
  const status = adBoosts.mutationReady ? `<span>${t('adBoost.mutation.readyStatus')}</span><small>${t('adBoost.nextSpawn')}</small>` : `<span>${t('adBoost.available')}</span><small>${t('adBoost.mutationChance', { chance })}</small>`;
  return `<article class="ad-boost-card ad-boost-card--mutation ${adBoosts.mutationReady ? 'is-active' : ''}"><div class="ad-boost-card__heading"><span class="ad-boost-card__icon" aria-hidden="true">🧬</span><strong>${t('adBoost.mutation.title')}</strong></div><small>${t('adBoost.mutation.description', { bonus: AD_REWARDS_CONFIG.mutation.tierBonus })}</small><div class="ad-boost-card__status">${status}</div>${cardButton(options, 'mutation', adBoosts.mutationReady, adBoosts.mutationReady ? t('adBoost.nextSpawn') : t('adBoost.watchAd'))}</article>`;
}

function renderFreeUpgradeCard(options: RewardBoostsPanelOptions): string {
  const { adBoosts, t } = options;
  const limitReached = adBoosts.freeUpgradeUsesToday >= adBoosts.freeUpgradeDailyLimit;
  const allMaxed = adBoosts.freeUpgradeEligibleCount === 0;
  const status = allMaxed ? `<span>${t('adBoost.allMaxed')}</span>` : limitReached ? `<span>${t('adBoost.usedTodayLabel')}</span><small>${t('adBoost.usesToday', { used: adBoosts.freeUpgradeUsesToday, limit: adBoosts.freeUpgradeDailyLimit })}</small>` : `<span>${t('adBoost.available')}</span><small>${t('adBoost.usesToday', { used: adBoosts.freeUpgradeUsesToday, limit: adBoosts.freeUpgradeDailyLimit })}</small>`;
  const fallback = allMaxed ? t('adBoost.allMaxed') : limitReached ? t('adBoost.usedTodayLabel') : t('adBoost.watchAd');
  return `<article class="ad-boost-card ad-boost-card--upgrade ${limitReached ? 'is-used' : ''}><div class="ad-boost-card__heading"><span class="ad-boost-card__icon" aria-hidden="true">↗</span><strong>${t('adBoost.free.title')}</strong></div><small>${t('adBoost.free.description')}</small><div class="ad-boost-card__status">${status}</div>${cardButton(options, 'freeUpgrade', limitReached || allMaxed, fallback)}</article>`;
}

export function renderRewardBoostsPanel(options: RewardBoostsPanelOptions): string {
  if (!options.rewardedAds) return '';
  const { freeUpgradeResult, state, t } = options;
  const upgrade = freeUpgradeResult ? UPGRADE_DEFINITIONS.find((entry) => entry.id === freeUpgradeResult.id) : null;
  return `<aside class="side-card side-card--ad-boosts" aria-label="${t('adBoost.title')}"><div class="ad-boost-section"><div class="ad-boost-section__header"><div><div class="ad-boost-section__eyebrow">${t('adBoost.eyebrow')}</div><h2>${t('adBoost.title')}</h2></div><span>${t('adBoost.description')}</span></div>${freeUpgradeResult && upgrade ? `<div class="ad-boost-result" role="status" aria-live="polite"><strong>${t('adBoost.resultTitle')}</strong><span>${t('adBoost.resultText', { upgrade: t(upgrade.titleKey), level: freeUpgradeResult.level })}</span></div>` : ''}<div class="ad-boost-list">${renderCoinCard(options)}${renderGoldenCard(options)}${renderMutationCard(options)}${renderFreeUpgradeCard(options)}</div><span class="sr-only">${state.adBoosts.pendingGoldenBoxes > 0 ? t('adBoost.golden.pending') : ''}</span></div></aside>`;
}
