import { assetForUnit, BOARD_COLUMNS, DEADLOCK_RESCUE_REFUND, FAMILIES, MISSION_TRACK, UPGRADE_DEFINITIONS, familyById, familyByTier, incomeMultiplierForLevel, luckyDropChanceForLevel, maxUpgradeLevel, offlineHoursForLevel, upgradeCost } from '../core/catalog.js';
import { activeMission, adBoostPresentation, brainBoxBaseTier, brainBoxLuckyChance, canClaimCurrentMission, canPrestige, claimableCollectionRewardTiers, canMerge, canPurchaseUpgrade, currentBrainBoxCost, findBestMergePair, findFirstMergePair, isBoardFull, isDeadlocked, missionProgress as missionProgressForState, nextActionHint, onboardingPhase, playerLevel, playerLevelProgress, productionPerMinute, unitProductionPerMinute, upgradeRequiredDiscoveryTier } from '../core/game.js';
import { prestigeUpgradeCost } from '../core/game.js';
import { renderRewardBoostsPanel } from './reward-boosts.js';
function presentationStyle(family) {
    const p = family.presentation;
    return `--unit-scale:${p.scale};--unit-y:${p.yPercent}%;--shadow-scale:${p.shadowScale};--collection-scale:${p.collectionScale}`;
}
function formatRate(value, locale) {
    if (value >= 100 || Number.isInteger(value))
        return Math.round(value).toLocaleString(locale);
    return value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function upgradeEffect(state, id, t) {
    const level = state.upgrades[id];
    if (id === 'boxBaseTier') {
        return t('upgrade.effect.boxBaseTier', { tier: Math.min(1 + level, state.runMaxTier) });
    }
    if (id === 'luckyDrop') {
        return t('upgrade.effect.luckyDrop', { chance: Math.round(luckyDropChanceForLevel(level) * 100) });
    }
    if (id === 'income') {
        return t('upgrade.effect.income', { multiplier: incomeMultiplierForLevel(level).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') });
    }
    return t('upgrade.effect.offline', { hours: offlineHoursForLevel(level) });
}
function nextActionText(hint, t) {
    if (hint.kind === 'offline')
        return t('nextAction.offline', { amount: hint.amount ?? 0 });
    if (hint.kind === 'mission')
        return t('nextAction.mission', { amount: hint.amount ?? 0 });
    if (hint.kind === 'rescue')
        return t('nextAction.rescue');
    if (hint.kind === 'merge')
        return t('nextAction.merge');
    if (hint.kind === 'upgrade')
        return t('nextAction.upgrade', { count: hint.upgradeCount ?? 1 });
    if (hint.kind === 'box')
        return t('nextAction.box', { cost: hint.cost ?? 0 });
    if (hint.kind === 'wait')
        return t('nextAction.wait', { cost: hint.cost ?? 0, minutes: hint.minutes ?? 1 });
    return t('nextAction.complete');
}
export class GameView {
    root;
    actions;
    dragFrom = null;
    dragMoved = false;
    dragStartX = 0;
    dragStartY = 0;
    lastDiscoveredTier = null;
    lastMissionIndex = null;
    constructor(root, actions) {
        this.root = root;
        this.actions = actions;
    }
    isDragging() {
        return this.dragFrom !== null && this.dragMoved;
    }
    /** Updates passive economy presentation without replacing interactive board DOM. */
    renderPassive(state, locale, t) {
        const coinValue = this.root.querySelector('.hud-pill--coin .hud-value');
        if (coinValue)
            coinValue.textContent = state.coins.toLocaleString(locale);
        const incomeValue = this.root.querySelector('.hud-pill--income strong');
        if (incomeValue)
            incomeValue.textContent = `+${formatRate(productionPerMinute(state), locale)}`;
        const message = this.root.querySelector('.message');
        if (message && state.messageKey)
            message.textContent = t(state.messageKey);
        const fever = this.root.querySelector('.fever-banner');
        if (fever) {
            fever.classList.toggle('is-active', state.events.feverRemainingMs > 0);
            const seconds = fever.querySelector('strong');
            if (seconds)
                seconds.textContent = t('fever.timer', { seconds: Math.ceil(state.events.feverRemainingMs / 1000) });
        }
    }
    render(state, locale, t, capabilities) {
        const level = playerLevel(state.xp);
        const boardFull = isBoardFull(state);
        const deadlocked = isDeadlocked(state);
        const phase = onboardingPhase(state);
        const tutorialPair = phase === 'merge' ? findFirstMergePair(state) : null;
        const tutorialIndexes = new Set(tutorialPair ?? []);
        const occupiedCount = state.cells.reduce((count, cell) => count + (cell ? 1 : 0), 0);
        const crowded = occupiedCount >= Math.floor(state.cells.length * 0.72);
        const suggestedPair = phase === 'complete' && state.selectedIndex === null && (crowded || boardFull)
            ? findBestMergePair(state)
            : null;
        const suggestedIndexes = new Set(suggestedPair ?? []);
        const mission = activeMission(state);
        const missionClaimable = canClaimCurrentMission(state);
        const missionCurrent = mission ? missionProgressForState(state, mission) : 0;
        const missionPercent = mission ? Math.min(100, missionCurrent / mission.target * 100) : 100;
        const missionAdvanced = this.lastMissionIndex !== null && state.missionIndex > this.lastMissionIndex;
        const xpProgress = Math.round(playerLevelProgress(state.xp) * 100);
        const bestFamily = familyByTier.get(state.runMaxTier) ?? FAMILIES[0];
        const nextFamily = familyByTier.get(state.runMaxTier + 1) ?? null;
        const newlyDiscovered = this.lastDiscoveredTier !== null && state.maxDiscoveredTier > this.lastDiscoveredTier
            ? bestFamily
            : null;
        const boxCost = currentBrainBoxCost(state);
        const boxBaseTier = brainBoxBaseTier(state);
        const boxLuckyPercent = Math.round(brainBoxLuckyChance(state) * 100);
        const production = productionPerMinute(state);
        const guidance = nextActionHint(state);
        const adBoosts = adBoostPresentation(state);
        const collectionReady = new Set(claimableCollectionRewardTiers(state));
        const prestigeIds = ['income', 'boxDiscount', 'startingCoins', 'offline', 'campaignPower'];
        this.root.innerHTML = `
      <main class="game-shell ${newlyDiscovered ? 'has-new-discovery' : ''} ${missionAdvanced ? 'has-mission-advance' : ''}">
        <header class="topbar">
          <div class="brand-block">
            <div class="brand">${t('app.title')}</div>
            <div class="tagline">${t('app.tagline')}</div>
          </div>
          <div class="hud-cluster">
            <div class="hud-pill hud-pill--coin"><span class="hud-icon">●</span><span class="hud-value">${state.coins.toLocaleString(locale)}</span><small>${t('hud.coins')}</small></div>
            <div class="hud-pill hud-pill--income"><strong>+${formatRate(production, locale)}</strong><small>${t('hud.perMinute')}</small></div>
            <div class="hud-pill hud-pill--level"><strong>${t('hud.level', { level })}</strong><span class="xp-track"><i style="width:${xpProgress}%"></i></span></div>
            <div class="hud-pill hud-pill--merge"><strong>${state.merges}</strong><small>${t('hud.merges')}</small></div>
            <div class="locale-switch" role="group" aria-label="${t('hud.language')}">
              <button class="locale-button ${locale === 'en' ? 'is-active' : ''}" data-locale="en">EN</button>
              <button class="locale-button ${locale === 'ru' ? 'is-active' : ''}" data-locale="ru">RU</button>
            </div>
            <button class="audio-settings-button" type="button" data-audio-settings-toggle aria-expanded="false" aria-controls="audio-settings-dialog">⚙</button>
          </div>
        </header>

        <section class="audio-settings-dialog" id="audio-settings-dialog" data-audio-settings-panel hidden aria-label="${t('audio.settings')}" role="dialog">
          <div class="audio-settings-dialog__header"><strong data-audio-settings-title>${t('audio.settings')}</strong><button type="button" data-audio-settings-close aria-label="${t('audio.close')}">×</button></div>
          <div class="audio-settings-list">
            <label><span data-audio-music-label>${t('audio.music')}</span><input data-audio-music type="checkbox"></label>
            <label><span data-audio-sfx-label>${t('audio.sfx')}</span><input data-audio-sfx type="checkbox"></label>
            <label><span>${t('audio.musicVolume')}</span><input data-audio-music-volume type="range" min="0" max="1" step="0.01"></label>
            <label><span>${t('audio.sfxVolume')}</span><input data-audio-sfx-volume type="range" min="0" max="1" step="0.01"></label>
          </div>
        </section>

        <section class="game-layout">
          <aside class="side-card side-card--mission ${mission ? '' : 'is-track-complete'}">
            <span class="panel-orb panel-orb--orange" aria-hidden="true"></span>
            <div class="side-card__eyebrow">${t('action.missions')}</div>
            <div class="mission-stage">${t('mission.stage', { current: Math.min(state.missionIndex + 1, MISSION_TRACK.length), total: MISSION_TRACK.length })}</div>
            <div class="mission-sequence" aria-label="${t('mission.journeyLabel')}">
              ${MISSION_TRACK.map((_, index) => `<span class="mission-sequence__dot ${index < state.missionIndex ? 'is-done' : ''} ${index === state.missionIndex ? 'is-current' : ''}"></span>`).join('')}
            </div>
            <h2>${mission ? t(mission.titleKey) : t('mission.trackComplete.title')}</h2>
            <p>${mission ? t(mission.textKey, { target: mission.target }) : t('mission.trackComplete.text')}</p>
            <div class="mission-track"><i style="width:${missionPercent}%"></i></div>
            <div class="mission-row">
              <strong>${mission ? t('panel.progress', { current: missionCurrent, target: mission.target }) : t('mission.allDone')}</strong>
              ${mission ? `<span class="mission-reward">+${mission.reward} ●</span>` : '<span class="mission-crown">★</span>'}
            </div>
            ${mission
            ? `<button class="side-action ${missionClaimable ? 'is-ready' : ''}" data-action="claim-mission" ${missionClaimable ? '' : 'disabled'}>${missionClaimable ? t('action.claimReward') : t('mission.inProgress')}</button>`
            : `<div class="mission-complete">${t('mission.trackComplete.badge')}</div>`}
          </aside>

          <section class="board-zone">
            <div class="fever-banner ${state.events.feverRemainingMs > 0 ? 'is-active' : ''}" role="status"><span>${t('fever.title')}</span><strong>${t('fever.timer', { seconds: Math.ceil(state.events.feverRemainingMs / 1000) })}</strong></div>
            ${newlyDiscovered ? `<div class="discovery-toast" role="status" aria-live="polite">
              <span class="discovery-toast__spark">✦</span>
              <span>${t('chain.discovery', { tier: newlyDiscovered.tier, character: t(newlyDiscovered.nameKey) })}</span>
              <span class="discovery-toast__spark">✦</span>
            </div>` : ''}

            ${missionAdvanced ? `<div class="mission-advance-toast" role="status" aria-live="polite">${state.missionIndex >= MISSION_TRACK.length ? t('mission.trackComplete.toast') : t('mission.nextUnlocked')}</div>` : ''}

            <div class="board-header">
              <div class="board-heading"><span class="eyebrow">${t('board.title')}</span><p>${t('board.hint')}</p></div>
              <div class="message ${state.messageKey ? 'is-visible' : ''}" role="status">${state.messageKey ? t(state.messageKey) : ''}</div>
            </div>

            <div class="chain-progress" aria-label="${t('chain.progressLabel')}">
              <div class="chain-progress__step chain-progress__step--current">
                <span class="chain-progress__label">${t('chain.best')}</span>
                <strong><b>T${bestFamily.tier}</b> ${t(bestFamily.nameKey)}</strong>
              </div>
              <span class="chain-progress__arrow" aria-hidden="true">→</span>
              ${nextFamily
            ? `<div class="chain-progress__step chain-progress__step--next"><span class="chain-progress__label">${t('chain.next')}</span><strong><b>T${nextFamily.tier}</b> ${t(nextFamily.nameKey)}</strong></div>`
            : `<div class="chain-progress__step chain-progress__step--complete"><span class="chain-progress__label">${t('chain.status')}</span><strong>${t('chain.complete')}</strong></div>`}
            </div>

            ${state.pendingOfflineCoins > 0 ? `<div class="offline-reward" role="status">
              <div><span class="offline-reward__eyebrow">${t('offline.title')}</span><strong>+${state.pendingOfflineCoins.toLocaleString(locale)} ${t('hud.coins')}</strong><small>${t('offline.description', { hours: offlineHoursForLevel(state.upgrades.offline) })}</small></div>
              <button data-action="claim-offline">${t('offline.collect')}</button>
            </div>` : ''}

            ${phase === 'complete' && state.pendingOfflineCoins === 0 ? `<div class="next-action next-action--${guidance.kind}" role="status">
              <span>${t('nextAction.title')}</span><strong>${nextActionText(guidance, t)}</strong>
            </div>` : ''}

            ${phase !== 'complete' ? `<div class="coach-card ${phase === 'spawn' ? 'coach-card--spawn' : ''}">
              <span class="coach-step">${phase === 'merge' ? '1/2' : '2/2'}</span>
              <div><strong>${t(`onboarding.${phase}Title`)}</strong><p>${t(`onboarding.${phase}Text`)}</p></div>
            </div>` : ''}

            ${crowded && !deadlocked && suggestedPair ? `<div class="board-nudge" role="status"><span>✦</span>${t('status.bestMergeHint')}</div>` : ''}

            <div class="board-frame">
              <div class="board-screw board-screw--tl" aria-hidden="true"></div>
              <div class="board-screw board-screw--br" aria-hidden="true"></div>
              <div class="board-rim">
                <div class="board-tray" style="--columns:${BOARD_COLUMNS}">
                  ${state.cells.map((cell, index) => {
            const selected = state.selectedIndex === index;
            const selectedUnit = state.selectedIndex === null ? null : state.cells[state.selectedIndex];
            const mergeTarget = Boolean(selectedUnit && cell && index !== state.selectedIndex && canMerge(selectedUnit, cell));
            const occupied = Boolean(cell);
            const family = cell ? familyById.get(cell.familyId) : null;
            const asset = cell ? assetForUnit(cell.familyId) : null;
            const tutorial = tutorialIndexes.has(index);
            const suggested = suggestedIndexes.has(index);
            const style = family ? presentationStyle(family) : '';
            const unitRate = family ? formatRate(unitProductionPerMinute(state, family.id), locale) : '';
            return `<button class="cell tone-${index % 4} ${occupied ? 'is-occupied' : ''} ${selected ? 'is-selected' : ''} ${mergeTarget ? 'is-merge-target' : ''} ${tutorial ? 'is-tutorial-pair' : ''} ${suggested ? 'is-suggested-pair' : ''}" data-cell="${index}" ${family ? `data-family="${family.id}" data-chain-tier="${family.tier}"` : ''} style="${style}" aria-label="${cell && family ? `${t(family.nameKey)} ${t('tier.label', { tier: family.tier })}; ${t('income.unit', { rate: unitRate })}` : t('board.emptyCell')}">
                      <span class="cell-gloss" aria-hidden="true"></span>
                      ${cell && asset ? `<span class="unit-shadow" aria-hidden="true"></span><span class="unit-visual"><img draggable="false" class="unit-art" src="${asset}" alt="" /></span>` : ''}
                      ${family ? `<span class="unit-income">${t('income.unit', { rate: unitRate })}</span><span class="tier-badge">${t('tier.label', { tier: family.tier })}</span>` : ''}
                    </button>`;
        }).join('')}
                </div>
              </div>
            </div>

            ${boardFull ? `<div class="board-status ${deadlocked ? 'board-status--danger' : 'board-status--merge-ready'}">
              <span>${deadlocked ? t('status.deadlock') : t('status.fullBoardMergeReady')}</span>
              ${deadlocked ? `<button class="rescue-button" data-action="rescue">${t('action.rescue', { refund: DEADLOCK_RESCUE_REFUND })}</button>` : ''}
            </div>` : ''}

            <div class="spawn-dock ${phase === 'spawn' ? 'is-tutorial' : ''}">
              <button class="spawn-button" data-action="spawn" ${state.coins < boxCost || boardFull || capabilities.adBusy ? 'disabled' : ''}>
                <span class="spawn-button__icon">✦</span>
                <span><strong>${t('action.spawn')}</strong><small>${t('action.spawnCost', { cost: boxCost })}</small></span>
              </button>
              ${capabilities.rewardedAds ? `<button class="rewarded-button" data-action="rewarded-spawn" ${boardFull || capabilities.adBusy ? 'disabled' : ''}>
                <span class="rewarded-button__icon">▶</span><span><strong>${capabilities.adBusy ? t('action.adLoading') : t('action.rewardedSpawn')}</strong><small>${t('action.rewardedSpawnHint')}</small></span>
              </button>` : ''}
            </div>
            <div class="box-profile">${t('brainBox.profile', { tier: boxBaseTier, chance: boxLuckyPercent, purchases: state.paidBoxes })}</div>
          </section>

          <div class="right-rail">
            ${renderRewardBoostsPanel({ state, adBoosts, rewardedAds: capabilities.rewardedAds, adBusy: capabilities.adBusy, adBusyAction: capabilities.adBusyAction, freeUpgradeResult: capabilities.freeUpgradeResult, t })}
            <aside class="side-card side-card--collection">
              <span class="panel-orb panel-orb--purple" aria-hidden="true"></span>
              <div class="side-card__eyebrow">${t('action.collection')}</div>
              <h2>${t('panel.collectionTitle')}</h2>
              <p>${t('panel.collectionHint')}</p>
              <div class="collection-grid" aria-label="${t('chain.progressLabel')}">
                ${FAMILIES.map((family) => {
            const unlocked = family.tier <= state.maxDiscoveredTier;
            const current = family.tier === state.maxDiscoveredTier;
            const next = family.tier === state.maxDiscoveredTier + 1;
            return `<div class="collection-chip ${unlocked ? 'is-unlocked' : 'is-locked'} ${current ? 'is-current' : ''} ${next ? 'is-next' : ''}" data-family="${family.id}" data-chain-tier="${family.tier}" title="${unlocked ? t(family.nameKey) : t('chain.lockedTier', { tier: family.tier })}" style="${presentationStyle(family)}">
                    <img src="${family.asset}" alt=""/>
                    <span class="collection-tier">T${family.tier}</span>
                    ${!unlocked ? `<span class="collection-lock" aria-hidden="true">?</span>` : ''}
                  </div>`;
        }).join('')}
              </div>
              <div class="collection-count"><span>${state.maxDiscoveredTier}</span>/${FAMILIES.length}</div>
              <div class="meta-rewards">
                ${[5, 10, 15, 18].map((tier) => {
            const claimed = state.collectionRewardClaims.includes(`collection-${tier}`);
            return `<button data-collection-reward="${tier}" ${collectionReady.has(tier) ? '' : 'disabled'}>${claimed ? t('collection.claimed') : t('collection.reward', { tier })}</button>`;
        }).join('')}
              </div>
            </aside>

            <aside class="side-card side-card--lab">
              <div class="side-card__eyebrow">${t('upgrade.eyebrow')}</div>
              <h2>${t('upgrade.title')}</h2>
              <p>${t('upgrade.description')}</p>
              <div class="upgrade-list">
                ${UPGRADE_DEFINITIONS.map((upgrade) => {
            const id = upgrade.id;
            const currentLevel = state.upgrades[id];
            const maxLevel = maxUpgradeLevel(id);
            const cost = upgradeCost(id, currentLevel);
            const requiredTier = upgradeRequiredDiscoveryTier(id, currentLevel);
            const discoveryLocked = requiredTier !== null && state.runMaxTier < requiredTier;
            const affordable = canPurchaseUpgrade(state, id);
            const maxed = currentLevel >= maxLevel || cost === null;
            const disabled = maxed || !affordable;
            const buttonText = maxed
                ? t('upgrade.max')
                : discoveryLocked
                    ? t('upgrade.lockedTier', { tier: requiredTier ?? 1 })
                    : t('upgrade.buy', { cost: cost ?? 0 });
            return `<div class="upgrade-card ${maxed ? 'is-maxed' : ''} ${discoveryLocked ? 'is-locked' : ''} ${affordable ? 'is-affordable' : ''}">
                    <div class="upgrade-card__top"><strong>${t(upgrade.titleKey)}</strong><span>${t('upgrade.level', { current: currentLevel, max: maxLevel })}</span></div>
                    <small>${t(upgrade.descriptionKey)}</small>
                    <div class="upgrade-effect">${upgradeEffect(state, id, t)}</div>
                    <button data-upgrade="${id}" ${disabled ? 'disabled' : ''}>${buttonText}</button>
                  </div>`;
        }).join('')}
              </div>
              <div class="prestige-panel">
                <div class="upgrade-card__top"><strong>${t('prestige.title')}</strong><span>${state.brainCells} ${t('prestige.cells')}</span></div>
                <small>${t('prestige.description')}</small>
                <button class="side-action" data-action="prestige" ${canPrestige(state) ? '' : 'disabled'}>${canPrestige(state) ? t('prestige.reset') : t('prestige.locked')}</button>
                <div class="prestige-upgrades">
                  ${prestigeIds.map((id) => {
            const level = state.prestigeUpgrades[id];
            const cost = prestigeUpgradeCost(level);
            return `<button data-prestige-upgrade="${id}" ${cost === null || state.brainCells < cost ? 'disabled' : ''}>${t(`prestige.upgrade.${id}`)} · ${level}/5${cost === null ? '' : ` · ${cost}`}</button>`;
        }).join('')}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>`;
        this.lastDiscoveredTier = state.maxDiscoveredTier;
        this.lastMissionIndex = state.missionIndex;
        this.bindInteractions();
    }
    bindInteractions() {
        this.root.querySelector('[data-action="spawn"]')?.addEventListener('click', () => this.actions.spawn());
        this.root.querySelector('[data-action="rewarded-spawn"]')?.addEventListener('click', () => this.actions.rewardedSpawn());
        this.root.querySelectorAll('[data-ad-boost]').forEach((button) => {
            button.addEventListener('click', () => this.actions.rewardedBoost(button.dataset.adBoost));
        });
        this.root.querySelector('[data-action="claim-mission"]')?.addEventListener('click', () => this.actions.claimMission());
        this.root.querySelector('[data-action="claim-offline"]')?.addEventListener('click', () => this.actions.claimOffline());
        this.root.querySelector('[data-action="prestige"]')?.addEventListener('click', () => this.actions.prestige());
        this.root.querySelector('[data-action="rescue"]')?.addEventListener('click', () => this.actions.rescueDeadlock());
        this.root.querySelectorAll('[data-upgrade]').forEach((button) => {
            button.addEventListener('click', () => this.actions.purchaseUpgrade(button.dataset.upgrade));
        });
        this.root.querySelectorAll('[data-collection-reward]').forEach((button) => {
            button.addEventListener('click', () => this.actions.claimCollectionReward(Number(button.dataset.collectionReward)));
        });
        this.root.querySelectorAll('[data-prestige-upgrade]').forEach((button) => {
            button.addEventListener('click', () => this.actions.purchasePrestigeUpgrade(button.dataset.prestigeUpgrade));
        });
        this.root.querySelectorAll('[data-locale]').forEach((button) => {
            button.addEventListener('click', () => this.actions.setLocale(button.dataset.locale));
        });
        this.root.querySelectorAll('.unit-art, .collection-chip img').forEach((image) => {
            const markMissing = () => {
                image.hidden = true;
                image.closest('.cell')?.classList.add('is-missing-art');
                image.closest('.collection-chip')?.classList.add('is-missing');
            };
            if (image.complete && image.naturalWidth === 0)
                markMissing();
            else
                image.addEventListener('error', markMissing, { once: true });
        });
        this.root.querySelectorAll('[data-cell]').forEach((cell) => {
            const index = Number(cell.dataset.cell);
            cell.addEventListener('pointerdown', (event) => {
                this.dragFrom = index;
                this.dragMoved = false;
                this.dragStartX = event.clientX;
                this.dragStartY = event.clientY;
                cell.setPointerCapture(event.pointerId);
            });
            cell.addEventListener('pointermove', (event) => {
                if (this.dragFrom === null)
                    return;
                const distance = Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY);
                if (distance > 8)
                    this.dragMoved = true;
            });
            cell.addEventListener('pointerup', (event) => {
                const from = this.dragFrom;
                this.dragFrom = null;
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]');
                const to = target ? Number(target.dataset.cell) : index;
                if (from !== null && this.dragMoved && Number.isFinite(to) && from !== to) {
                    this.actions.moveOrMerge(from, to);
                    return;
                }
                this.actions.select(index);
            });
            cell.addEventListener('pointercancel', () => {
                this.dragFrom = null;
                this.dragMoved = false;
            });
        });
    }
}
