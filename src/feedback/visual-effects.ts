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

export function runUnitFlight(from: HTMLElement | null, to: HTMLElement | null, merge: boolean): void {
  if (!motionAllowed() || !from || !to) return;
  const visual = from.querySelector<HTMLElement>('.unit-visual');
  if (!visual) return;
  const fromRect = visual.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  if (fromRect.width <= 0 || fromRect.height <= 0 || toRect.width <= 0 || toRect.height <= 0) return;

  const ghost = visual.cloneNode(true) as HTMLElement;
  ghost.className = 'fx-unit-flight';
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

installPointerDragFx();
