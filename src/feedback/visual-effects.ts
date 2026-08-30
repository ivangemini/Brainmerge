export interface FxPoint { x: number; y: number }

function motionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function centerOf(element: Element | null): FxPoint | null {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function transientClass(element: Element | null, className: string, duration = 620): void {
  if (!(element instanceof HTMLElement) || !motionAllowed()) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

export function runUnitFlight(from: HTMLElement | null, to: HTMLElement | null, merge: boolean): void {
  if (!motionAllowed() || !from || !to) return;
  const visual = from.querySelector<HTMLElement>('.unit-visual');
  if (!visual) return;
  const fromRect = visual.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  if (fromRect.width <= 0 || fromRect.height <= 0 || toRect.width <= 0 || toRect.height <= 0) return;

  const ghost = visual.cloneNode(true) as HTMLElement;
  ghost.className = `fx-unit-flight ${merge ? 'is-merge-flight' : 'is-move-flight'}`;
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    left: `${fromRect.left}px`,
    top: `${fromRect.top}px`,
    width: `${fromRect.width}px`,
    height: `${fromRect.height}px`
  });
  document.body.appendChild(ghost);

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
  const distance = Math.hypot(dx, dy);
  const lift = Math.max(14, Math.min(42, distance * 0.16));
  const duration = Math.max(220, Math.min(390, 210 + distance * 0.22));

  const animation = ghost.animate([
    { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
    { transform: `translate3d(${dx * 0.48}px,${dy * 0.48 - lift}px,0) scale(1.08) rotate(${dx >= 0 ? 3 : -3}deg)`, opacity: 1, offset: 0.52 },
    { transform: `translate3d(${dx}px,${dy}px,0) scale(${merge ? 0.78 : 1}) rotate(0deg)`, opacity: merge ? 0.15 : 0.92, offset: 1 }
  ], { duration, easing: 'cubic-bezier(.2,.82,.2,1)', fill: 'forwards' });
  animation.finished.catch(() => undefined).finally(() => ghost.remove());
}

export function runCoinTrail(from: FxPoint | null, hud: Element | null, amount: number): void {
  if (!motionAllowed() || !from || amount <= 0) return;
  const target = centerOf(hud);
  if (!target) return;

  const count = Math.max(3, Math.min(7, 3 + Math.floor(Math.log10(amount + 1))));
  for (let i = 0; i < count; i += 1) {
    const coin = document.createElement('span');
    coin.className = 'fx-coin-trail';
    coin.setAttribute('aria-hidden', 'true');
    coin.style.left = `${from.x}px`;
    coin.style.top = `${from.y}px`;
    document.body.appendChild(coin);
    const bend = (i - (count - 1) / 2) * 9;
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const animation = coin.animate([
      { transform: 'translate(-50%,-50%) scale(.55)', opacity: 0, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.18 + bend}px),calc(-50% + ${dy * 0.08 - 18}px)) scale(1.08)`, opacity: 1, offset: 0.22 },
      { transform: `translate(calc(-50% + ${dx * 0.58 - bend}px),calc(-50% + ${dy * 0.5 - 24}px)) scale(.92)`, opacity: 1, offset: 0.66 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42)`, opacity: 0, offset: 1 }
    ], { duration: 560, delay: i * 42, easing: 'cubic-bezier(.18,.72,.22,1)', fill: 'forwards' });
    animation.finished.catch(() => undefined).finally(() => coin.remove());
  }
}

function runSpawnEnergy(targetCell: HTMLElement): void {
  if (!motionAllowed()) return;
  const source = centerOf(document.querySelector('.spawn-dock'));
  const target = centerOf(targetCell);
  if (!source || !target) return;

  const orb = document.createElement('span');
  orb.className = 'fx-spawn-orb';
  orb.setAttribute('aria-hidden', 'true');
  orb.style.left = `${source.x}px`;
  orb.style.top = `${source.y}px`;
  document.body.appendChild(orb);

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const bend = Math.min(72, Math.max(28, Math.abs(dx) * 0.12 + Math.abs(dy) * 0.06));
  const animation = orb.animate([
    { transform: 'translate(-50%,-50%) scale(.55)', opacity: 0, offset: 0 },
    { transform: `translate(calc(-50% + ${dx * 0.16}px),calc(-50% + ${dy * 0.12 - bend}px)) scale(1.22)`, opacity: 1, offset: 0.22 },
    { transform: `translate(calc(-50% + ${dx * 0.62}px),calc(-50% + ${dy * 0.52 - bend * .72}px)) scale(.92)`, opacity: 1, offset: 0.7 },
    { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.28)`, opacity: 0, offset: 1 }
  ], { duration: 430, easing: 'cubic-bezier(.18,.76,.18,1)', fill: 'forwards' });
  animation.finished.catch(() => undefined).finally(() => orb.remove());

  for (let i = 0; i < 4; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'fx-spawn-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.style.left = `${target.x}px`;
    spark.style.top = `${target.y}px`;
    document.body.appendChild(spark);
    const angle = i / 4 * Math.PI * 2 + Math.PI / 4;
    const sx = Math.cos(angle) * 20;
    const sy = Math.sin(angle) * 20;
    const sparkle = spark.animate([
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0, offset: 0 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .25 },
      { transform: `translate(calc(-50% + ${sx}px),calc(-50% + ${sy}px)) scale(.45)`, opacity: 0, offset: 1 }
    ], { duration: 360, delay: 280 + i * 28, easing: 'ease-out', fill: 'forwards' });
    sparkle.finished.catch(() => undefined).finally(() => spark.remove());
  }
}

export function runDiscoveryCelebration(cell: HTMLElement | null, tier: number): void {
  if (!motionAllowed() || !cell || tier < 2) return;
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell) return;
  shell.classList.remove('fx-discovery-celebration');
  void shell.offsetWidth;
  shell.classList.add('fx-discovery-celebration');
  window.setTimeout(() => shell.classList.remove('fx-discovery-celebration'), tier >= 8 ? 1150 : 850);

  const chip = document.querySelector<HTMLElement>(`.collection-chip[data-chain-tier="${tier}"]`);
  const collection = chip?.closest<HTMLElement>('.side-card--collection') ?? null;
  chip?.classList.add('fx-collection-unlock');
  collection?.classList.add('fx-collection-card');
  window.setTimeout(() => chip?.classList.remove('fx-collection-unlock'), 980);
  window.setTimeout(() => collection?.classList.remove('fx-collection-card'), 760);

  const point = centerOf(cell);
  if (!point) return;
  const badge = document.createElement('span');
  badge.className = `fx-discovery-tier ${tier >= 8 ? 'is-max' : ''}`;
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = `T${tier}`;
  badge.style.left = `${point.x}px`;
  badge.style.top = `${point.y}px`;
  document.body.appendChild(badge);
  window.setTimeout(() => badge.remove(), tier >= 8 ? 1200 : 900);
}

export function elementFxCenter(element: Element | null): FxPoint | null {
  return centerOf(element);
}

function installPointerDragFx(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  let active: HTMLElement | null = null;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;

  const clear = (): void => {
    if (active) {
      active.classList.remove('fx-pointer-drag');
      active.style.removeProperty('--drag-x');
      active.style.removeProperty('--drag-y');
    }
    active = null;
    pointerId = null;
  };

  root.addEventListener('pointerdown', (event) => {
    if (!motionAllowed() || event.button !== 0) return;
    const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell].is-occupied') : null;
    if (!cell) return;
    active = cell;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    cell.style.setProperty('--drag-x', '0px');
    cell.style.setProperty('--drag-y', '0px');
  });

  root.addEventListener('pointermove', (event) => {
    if (!active || pointerId !== event.pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) < 7) return;
    active.classList.add('fx-pointer-drag');
    active.style.setProperty('--drag-x', `${dx}px`);
    active.style.setProperty('--drag-y', `${dy}px`);
  });

  root.addEventListener('pointerup', clear);
  root.addEventListener('pointercancel', clear);
}

function installMoveRejectFx(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;

  root.addEventListener('pointerdown', (event) => {
    if (!motionAllowed() || event.button !== 0 || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>('[data-cell]');
    const source = root.querySelector<HTMLElement>('[data-cell].is-selected');
    if (!target || !source || target === source) return;

    const targetIndex = target.dataset.cell;
    const targetOccupied = target.classList.contains('is-occupied');
    const sourceFamily = source.dataset.family ?? '';
    const targetFamily = target.dataset.family ?? '';
    const sourceTier = Number(source.dataset.chainTier ?? 0);

    if (!targetOccupied) {
      runUnitFlight(source, target, false);
      window.setTimeout(() => {
        const landed = targetIndex === undefined ? null : root.querySelector<HTMLElement>(`[data-cell="${targetIndex}"]`);
        transientClass(landed, 'fx-move-land', 520);
      }, 0);
      return;
    }

    if (sourceFamily !== targetFamily || sourceTier >= 8) {
      const maxTierReject = sourceFamily === targetFamily && sourceTier >= 8;
      window.setTimeout(() => {
        const rejected = targetIndex === undefined ? null : root.querySelector<HTMLElement>(`[data-cell="${targetIndex}"]`);
        transientClass(rejected, maxTierReject ? 'fx-max-reject' : 'fx-reject', 460);
        transientClass(root.querySelector('.board-frame'), 'fx-board-reject', 420);
      }, 0);
    }
  }, true);
}

function installPressFx(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  let pressed: HTMLElement | null = null;
  const clear = (): void => {
    pressed?.classList.remove('fx-pressed');
    pressed = null;
  };
  root.addEventListener('pointerdown', (event) => {
    if (!motionAllowed() || event.button !== 0 || !(event.target instanceof Element)) return;
    const control = event.target.closest<HTMLElement>('[data-action],.locale-button,.audio-toggle');
    if (!control || control.matches(':disabled')) return;
    pressed = control;
    control.classList.add('fx-pressed');
  });
  root.addEventListener('pointerup', clear);
  root.addEventListener('pointercancel', clear);
}

function installSpawnEnergyFx(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  const observer = new MutationObserver((records) => {
    if (!motionAllowed()) return;
    for (const record of records) {
      if (record.type !== 'attributes' || record.attributeName !== 'class' || !(record.target instanceof HTMLElement)) continue;
      const cell = record.target;
      if (cell.matches('[data-cell].fx-spawn') && cell.dataset.spawnEnergySeen !== 'true') {
        cell.dataset.spawnEnergySeen = 'true';
        runSpawnEnergy(cell);
      }
    }
  });
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['class'] });
}

function installProgressionFx(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  let initialized = false;
  let levelText = '';
  let missionSignal = '';
  let nextMoveText = '';
  let missionComplete = false;

  const snapshot = (): void => {
    const nextLevel = root.querySelector('.hud-pill--level strong')?.textContent?.trim() ?? '';
    const nextMissionSignal = `${root.querySelector('.mission-row strong')?.textContent?.trim() ?? ''}|${(root.querySelector('.mission-track i') as HTMLElement | null)?.style.width ?? ''}`;
    const nextMove = root.querySelector('.next-action strong')?.textContent?.trim() ?? '';
    const nextMissionComplete = Boolean(root.querySelector('.mission-complete'));

    if (initialized && motionAllowed()) {
      if (nextLevel && levelText && nextLevel !== levelText) transientClass(root.querySelector('.hud-pill--level'), 'fx-level-up', 860);
      if (nextMissionSignal && missionSignal && nextMissionSignal !== missionSignal) transientClass(root.querySelector('.side-card--mission'), 'fx-mission-progress', 720);
      if (nextMove && nextMoveText && nextMove !== nextMoveText) transientClass(root.querySelector('.next-action'), 'fx-next-move', 620);
      if (nextMove && !nextMoveText) transientClass(root.querySelector('.next-action'), 'fx-next-move', 620);
      if (nextMissionComplete && !missionComplete) transientClass(root.querySelector('.side-card--mission'), 'fx-mission-complete', 980);
    }

    levelText = nextLevel;
    missionSignal = nextMissionSignal;
    nextMoveText = nextMove;
    missionComplete = nextMissionComplete;
    initialized = true;
  };

  snapshot();
  const observer = new MutationObserver((records) => {
    if (!records.some((record) => record.type === 'childList')) return;
    window.queueMicrotask(snapshot);
  });
  observer.observe(root, { subtree: true, childList: true });
}

installPointerDragFx();
installMoveRejectFx();
installPressFx();
installSpawnEnergyFx();
installProgressionFx();
