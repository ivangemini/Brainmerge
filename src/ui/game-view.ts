import { assetForUnit, BOARD_COLUMNS, FAMILIES, SPAWN_COST, familyById } from '../core/catalog.js';
import { canMerge, isBoardFull, playerLevel } from '../core/game.js';
import type { GameState } from '../core/types.js';
import type { Locale } from '../i18n/i18n.js';

export interface GameViewActions {
  spawn(): void;
  select(index: number): void;
  moveOrMerge(from: number, to: number): void;
  setLocale(locale: Locale): void;
}

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export class GameView {
  private dragFrom: number | null = null;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly actions: GameViewActions
  ) {}

  render(state: GameState, locale: Locale, t: Translator): void {
    const level = playerLevel(state.xp);
    const missionTarget = 6;
    const unlocked = new Set(state.cells.flatMap((cell) => cell ? [cell.familyId] : []));
    const boardFull = isBoardFull(state);

    this.root.innerHTML = `
      <main class="game-shell">
        <header class="topbar">
          <div class="brand-block">
            <div class="brand">${t('app.title')}</div>
            <div class="tagline">${t('app.tagline')}</div>
          </div>
          <div class="hud-cluster">
            <div class="hud-pill hud-pill--coin"><span class="hud-icon">●</span><span>${state.coins}</span><small>${t('hud.coins')}</small></div>
            <div class="hud-pill"><strong>${t('hud.level', { level })}</strong><span class="xp-track"><i style="width:${Math.min(100, (state.xp % 40) / 40 * 100)}%"></i></span></div>
            <div class="hud-pill"><strong>${state.merges}</strong><small>${t('hud.merges')}</small></div>
            <div class="locale-switch" role="group" aria-label="${t('hud.language')}">
              <button class="locale-button ${locale === 'en' ? 'is-active' : ''}" data-locale="en">EN</button>
              <button class="locale-button ${locale === 'ru' ? 'is-active' : ''}" data-locale="ru">RU</button>
            </div>
          </div>
        </header>

        <section class="game-layout">
          <aside class="side-card side-card--mission">
            <div class="side-card__eyebrow">${t('action.missions')}</div>
            <h2>${t('panel.missionTitle')}</h2>
            <p>${t('panel.missionText', { count: missionTarget })}</p>
            <div class="mission-track"><i style="width:${Math.min(100, state.merges / missionTarget * 100)}%"></i></div>
            <strong>${t('panel.progress', { current: Math.min(state.merges, missionTarget), target: missionTarget })}</strong>
          </aside>

          <section class="board-zone">
            <div class="board-header">
              <div><span class="eyebrow">${t('board.title')}</span><p>${t('board.hint')}</p></div>
              <div class="message ${state.messageKey ? 'is-visible' : ''}">${state.messageKey ? t(state.messageKey) : ''}</div>
            </div>
            <div class="board-frame">
              <div class="board-rim">
                <div class="board-tray" style="--columns:${BOARD_COLUMNS}">
                  ${state.cells.map((cell, index) => {
                    const selected = state.selectedIndex === index;
                    const selectedUnit = state.selectedIndex === null ? null : state.cells[state.selectedIndex];
                    const mergeTarget = Boolean(selectedUnit && cell && index !== state.selectedIndex && canMerge(selectedUnit, cell));
                    const occupied = Boolean(cell);
                    const family = cell ? familyById.get(cell.familyId) : null;
                    const asset = cell ? assetForUnit(cell.familyId, cell.tier) : null;
                    return `<button class="cell tone-${index % 4} ${occupied ? 'is-occupied' : ''} ${selected ? 'is-selected' : ''} ${mergeTarget ? 'is-merge-target' : ''}" data-cell="${index}" aria-label="${cell && family ? `${t(family.nameKey)} ${t('tier.label', { tier: cell.tier })}` : t('board.title')}">
                      ${cell && asset ? `<img draggable="false" class="unit-art" src="${asset}" alt="" />` : ''}
                      ${cell ? `<span class="tier-badge">${t('tier.label', { tier: cell.tier })}</span>` : ''}
                    </button>`;
                  }).join('')}
                </div>
              </div>
            </div>
            ${boardFull ? `<div class="board-status">${t('status.fullBoard')}</div>` : ''}
            <div class="spawn-dock">
              <button class="spawn-button" data-action="spawn" ${state.coins < SPAWN_COST || boardFull ? 'disabled' : ''}>
                <span class="spawn-button__icon">✦</span>
                <span><strong>${t('action.spawn')}</strong><small>${t('action.spawnCost', { cost: SPAWN_COST })}</small></span>
              </button>
            </div>
          </section>

          <aside class="side-card side-card--collection">
            <div class="side-card__eyebrow">${t('action.collection')}</div>
            <h2>${t('panel.collectionTitle')}</h2>
            <p>${t('panel.collectionHint')}</p>
            <div class="collection-grid">
              ${FAMILIES.map((family) => `<div class="collection-chip ${unlocked.has(family.id) ? 'is-unlocked' : ''}" title="${t(family.nameKey)}"><img src="${family.assetByForm[1] ?? ''}" alt=""/></div>`).join('')}
            </div>
            <strong>${unlocked.size}/${FAMILIES.length}</strong>
          </aside>
        </section>
      </main>`;

    this.bindInteractions();
  }

  private bindInteractions(): void {
    this.root.querySelector('[data-action="spawn"]')?.addEventListener('click', () => this.actions.spawn());
    this.root.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      button.addEventListener('click', () => this.actions.setLocale(button.dataset.locale as Locale));
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
    });
  }
}
