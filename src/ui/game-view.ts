import {
  assetForUnit,
  BOARD_COLUMNS,
  DEADLOCK_RESCUE_REFUND,
  FAMILIES,
  FIRST_MISSION_REWARD,
  FIRST_MISSION_TARGET,
  SPAWN_COST,
  familyById,
  type FamilyDefinition
} from '../core/catalog.js';
import {
  canClaimFirstMission,
  canMerge,
  findFirstMergePair,
  isBoardFull,
  isDeadlocked,
  onboardingPhase,
  playerLevel,
  playerLevelProgress
} from '../core/game.js';
import type { GameState } from '../core/types.js';
import type { Locale } from '../i18n/i18n.js';

export interface GameViewActions {
  spawn(): void;
  rewardedSpawn(): void;
  claimMission(): void;
  rescueDeadlock(): void;
  select(index: number): void;
  moveOrMerge(from: number, to: number): void;
  setLocale(locale: Locale): void;
}

export interface GameViewCapabilities {
  rewardedAds: boolean;
  adBusy: boolean;
}

export type Translator = (key: string, params?: Record<string, string | number>) => string;

function presentationStyle(family: FamilyDefinition): string {
  const p = family.presentation;
  return `--unit-scale:${p.scale};--unit-y:${p.yPercent}%;--shadow-scale:${p.shadowScale};--collection-scale:${p.collectionScale}`;
}

export class GameView {
  private dragFrom: number | null = null;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly actions: GameViewActions
  ) {}

  render(state: GameState, locale: Locale, t: Translator, capabilities: GameViewCapabilities): void {
    const level = playerLevel(state.xp);
    const unlocked = new Set(state.cells.flatMap((cell) => cell ? [cell.familyId] : []));
    const boardFull = isBoardFull(state);
    const deadlocked = isDeadlocked(state);
    const phase = onboardingPhase(state);
    const tutorialPair = phase === 'merge' ? findFirstMergePair(state) : null;
    const tutorialIndexes = new Set(tutorialPair ?? []);
    const missionClaimable = canClaimFirstMission(state);
    const missionProgress = Math.min(state.merges, FIRST_MISSION_TARGET);
    const xpProgress = Math.round(playerLevelProgress(state.xp) * 100);

    this.root.innerHTML = `
      <main class="game-shell">
        <header class="topbar">
          <div class="brand-block">
            <div class="brand">${t('app.title')}</div>
            <div class="tagline">${t('app.tagline')}</div>
          </div>
          <div class="hud-cluster">
            <div class="hud-pill hud-pill--coin"><span class="hud-icon">●</span><span class="hud-value">${state.coins}</span><small>${t('hud.coins')}</small></div>
            <div class="hud-pill hud-pill--level"><strong>${t('hud.level', { level })}</strong><span class="xp-track"><i style="width:${xpProgress}%"></i></span></div>
            <div class="hud-pill hud-pill--merge"><strong>${state.merges}</strong><small>${t('hud.merges')}</small></div>
            <div class="locale-switch" role="group" aria-label="${t('hud.language')}">
              <button class="locale-button ${locale === 'en' ? 'is-active' : ''}" data-locale="en">EN</button>
              <button class="locale-button ${locale === 'ru' ? 'is-active' : ''}" data-locale="ru">RU</button>
            </div>
          </div>
        </header>

        <section class="game-layout">
          <aside class="side-card side-card--mission">
            <span class="panel-orb panel-orb--orange" aria-hidden="true"></span>
            <div class="side-card__eyebrow">${t('action.missions')}</div>
            <h2>${t('panel.missionTitle')}</h2>
            <p>${t('panel.missionText', { count: FIRST_MISSION_TARGET })}</p>
            <div class="mission-track"><i style="width:${Math.min(100, state.merges / FIRST_MISSION_TARGET * 100)}%"></i></div>
            <div class="mission-row">
              <strong>${t('panel.progress', { current: missionProgress, target: FIRST_MISSION_TARGET })}</strong>
              <span class="mission-reward">+${FIRST_MISSION_REWARD} ●</span>
            </div>
            ${state.missionClaimed
              ? `<div class="mission-complete">${t('panel.missionComplete')}</div>`
              : `<button class="side-action" data-action="claim-mission" ${missionClaimable ? '' : 'disabled'}>${t('action.claimReward')}</button>`}
          </aside>

          <section class="board-zone">
            <div class="board-header">
              <div class="board-heading"><span class="eyebrow">${t('board.title')}</span><p>${t('board.hint')}</p></div>
              <div class="message ${state.messageKey ? 'is-visible' : ''}" role="status">${state.messageKey ? t(state.messageKey) : ''}</div>
            </div>

            ${phase !== 'complete' ? `<div class="coach-card ${phase === 'spawn' ? 'coach-card--spawn' : ''}">
              <span class="coach-step">${phase === 'merge' ? '1/2' : '2/2'}</span>
              <div><strong>${t(`onboarding.${phase}Title`)}</strong><p>${t(`onboarding.${phase}Text`)}</p></div>
            </div>` : ''}

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
                    const asset = cell ? assetForUnit(cell.familyId, cell.tier) : null;
                    const tutorial = tutorialIndexes.has(index);
                    const style = family ? presentationStyle(family) : '';
                    return `<button class="cell tone-${index % 4} ${occupied ? 'is-occupied' : ''} ${selected ? 'is-selected' : ''} ${mergeTarget ? 'is-merge-target' : ''} ${tutorial ? 'is-tutorial-pair' : ''}" data-cell="${index}" ${family ? `data-family="${family.id}"` : ''} style="${style}" aria-label="${cell && family ? `${t(family.nameKey)} ${t('tier.label', { tier: cell.tier })}` : t('board.emptyCell')}">
                      <span class="cell-gloss" aria-hidden="true"></span>
                      ${cell && asset ? `<span class="unit-shadow" aria-hidden="true"></span><span class="unit-visual"><img draggable="false" class="unit-art" src="${asset}" alt="" /></span>` : ''}
                      ${cell ? `<span class="tier-badge">${t('tier.label', { tier: cell.tier })}</span>` : ''}
                    </button>`;
                  }).join('')}
                </div>
              </div>
            </div>

            ${boardFull ? `<div class="board-status ${deadlocked ? 'board-status--danger' : ''}">
              <span>${deadlocked ? t('status.deadlock') : t('status.fullBoard')}</span>
              ${deadlocked ? `<button class="rescue-button" data-action="rescue">${t('action.rescue', { refund: DEADLOCK_RESCUE_REFUND })}</button>` : ''}
            </div>` : ''}

            <div class="spawn-dock ${phase === 'spawn' ? 'is-tutorial' : ''}">
              <button class="spawn-button" data-action="spawn" ${state.coins < SPAWN_COST || boardFull || capabilities.adBusy ? 'disabled' : ''}>
                <span class="spawn-button__icon">✦</span>
                <span><strong>${t('action.spawn')}</strong><small>${t('action.spawnCost', { cost: SPAWN_COST })}</small></span>
              </button>
              ${capabilities.rewardedAds ? `<button class="rewarded-button" data-action="rewarded-spawn" ${boardFull || capabilities.adBusy ? 'disabled' : ''}>
                <span class="rewarded-button__icon">▶</span><span><strong>${capabilities.adBusy ? t('action.adLoading') : t('action.rewardedSpawn')}</strong><small>${t('action.rewardedSpawnHint')}</small></span>
              </button>` : ''}
            </div>
          </section>

          <aside class="side-card side-card--collection">
            <span class="panel-orb panel-orb--purple" aria-hidden="true"></span>
            <div class="side-card__eyebrow">${t('action.collection')}</div>
            <h2>${t('panel.collectionTitle')}</h2>
            <p>${t('panel.collectionHint')}</p>
            <div class="collection-grid">
              ${FAMILIES.map((family) => `<div class="collection-chip ${unlocked.has(family.id) ? 'is-unlocked' : ''}" title="${t(family.nameKey)}" style="${presentationStyle(family)}"><img src="${family.assetByForm[1] ?? ''}" alt=""/></div>`).join('')}
            </div>
            <div class="collection-count"><span>${unlocked.size}</span>/${FAMILIES.length}</div>
          </aside>
        </section>
      </main>`;

    this.bindInteractions();
  }

  private bindInteractions(): void {
    this.root.querySelector('[data-action="spawn"]')?.addEventListener('click', () => this.actions.spawn());
    this.root.querySelector('[data-action="rewarded-spawn"]')?.addEventListener('click', () => this.actions.rewardedSpawn());
    this.root.querySelector('[data-action="claim-mission"]')?.addEventListener('click', () => this.actions.claimMission());
    this.root.querySelector('[data-action="rescue"]')?.addEventListener('click', () => this.actions.rescueDeadlock());
    this.root.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      button.addEventListener('click', () => this.actions.setLocale(button.dataset.locale as Locale));
    });

    this.root.querySelectorAll<HTMLImageElement>('.unit-art, .collection-chip img').forEach((image) => {
      const markMissing = () => {
        image.hidden = true;
        image.closest('.cell')?.classList.add('is-missing-art');
        image.closest('.collection-chip')?.classList.add('is-missing');
      };
      if (image.complete && image.naturalWidth === 0) markMissing();
      else image.addEventListener('error', markMissing, { once: true });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((cell) => {
      const index = Number(cell.dataset.cell);
      cell.addEventListener('pointerdown', (event) => {
        this.dragFrom = index;
        this.dragMoved = false;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        cell.setPointerCapture(event.pointerId);
      });
      cell.addEventListener('pointermove', (event) => {
        if (this.dragFrom === null) return;
        const distance = Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY);
        if (distance > 8) this.dragMoved = true;
      });
      cell.addEventListener('pointerup', (event) => {
        const from = this.dragFrom;
        this.dragFrom = null;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-cell]');
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
