const COPY_BY_LOCALE = {
  en: './locales/campaign-en.json',
  ru: './locales/campaign-ru.json'
};

const TARGET_WORLD = 1;
const TARGET_LOCATION = 'w1-sneaker-garden';
const BOARD_COLUMNS = 6;

let copy = null;
let locale = null;
let campaignSnapshot = null;
let selectedLocationId = null;
let shell = null;
let wantsOpen = false;
let scheduledCopyRefresh = false;
let scheduledLauncherRefresh = false;

function currentLocale() {
  return document.documentElement.lang?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function interpolate(template, params = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}

async function loadCopy() {
  const nextLocale = currentLocale();
  if (copy && locale === nextLocale) return true;
  const response = await fetch(COPY_BY_LOCALE[nextLocale]);
  if (!response.ok) return false;
  copy = await response.json();
  locale = nextLocale;
  return true;
}

function worldSnapshot() {
  return campaignSnapshot?.worlds?.find((world) => world.id === TARGET_WORLD) ?? null;
}

function locationSnapshot() {
  return worldSnapshot()?.locations?.find((location) => location.id === TARGET_LOCATION) ?? null;
}

function activeRun() {
  const run = campaignSnapshot?.activeRun;
  return run?.worldId === TARGET_WORLD && run?.locationId === TARGET_LOCATION && (run?.phase === 'stabilize' || run?.phase === 'deliver')
    ? run
    : null;
}

function dispatchCommand(detail) {
  window.dispatchEvent(new CustomEvent('brainmerge:campaign-command', { detail }));
}

function tierAtlasPosition(tier) {
  const safe = Math.max(1, Math.min(18, Math.floor(tier || 1)));
  const zero = safe - 1;
  const column = zero % 6;
  const row = Math.floor(zero / 6);
  return {
    x: `${column * 20}%`,
    y: `${row * 50}%`
  };
}

function handleBoardKeydown(event) {
  if (!(event.target instanceof HTMLElement) || !event.target.matches('[data-run-cell]')) return;
  const index = Number(event.target.dataset.runCell);
  if (!Number.isInteger(index)) return;
  let next = null;
  if (event.key === 'ArrowLeft' && index % BOARD_COLUMNS > 0) next = index - 1;
  if (event.key === 'ArrowRight' && index % BOARD_COLUMNS < BOARD_COLUMNS - 1) next = index + 1;
  if (event.key === 'ArrowUp' && index >= BOARD_COLUMNS) next = index - BOARD_COLUMNS;
  if (event.key === 'ArrowDown' && index + BOARD_COLUMNS < 30) next = index + BOARD_COLUMNS;
  if (next === null) return;
  event.preventDefault();
  shell?.querySelector(`[data-run-cell="${next}"]`)?.focus();
}

function ensureShell() {
  if (shell || !copy) return shell;
  const section = document.createElement('section');
  section.className = 'campaign-run-shell';
  section.setAttribute('role', 'dialog');
  section.setAttribute('aria-modal', 'true');
  section.setAttribute('aria-hidden', 'true');
  section.innerHTML = `
    <div class="campaign-run-backdrop" aria-hidden="true"></div>
    <div class="campaign-run-frame">
      <header class="campaign-run-header">
        <button class="campaign-run-back" type="button"></button>
        <div class="campaign-run-heading">
          <small></small>
          <strong></strong>
        </div>
        <div class="campaign-run-progress">
          <small></small>
          <strong></strong>
          <span><i></i></span>
        </div>
      </header>
      <div class="campaign-run-content">
        <section class="campaign-run-objective">
          <div class="campaign-run-objective__copy">
            <small></small>
            <strong></strong>
            <p></p>
          </div>
          <div class="campaign-run-objective__counter">
            <small></small>
            <strong></strong>
          </div>
        </section>
        <div class="campaign-run-board-wrap">
          <div class="campaign-run-board" role="grid"></div>
        </div>
        <footer class="campaign-run-footer">
          <div class="campaign-run-supply-copy"><strong></strong><small></small></div>
          <button class="campaign-run-supply" type="button"></button>
          <button class="campaign-run-deliver" type="button" hidden></button>
        </footer>
      </div>
      <div class="campaign-run-complete" aria-hidden="true">
        <div class="campaign-run-complete__card">
          <span class="campaign-run-complete__badge" aria-hidden="true">✓</span>
          <strong></strong>
          <p></p>
          <button type="button"></button>
        </div>
      </div>
    </div>`;

  section.querySelector('.campaign-run-back')?.addEventListener('click', closeRun);
  section.querySelector('.campaign-run-supply')?.addEventListener('click', () => dispatchCommand({ type: 'spawn' }));
  section.querySelector('.campaign-run-deliver')?.addEventListener('click', () => {
    const run = activeRun();
    if (run?.phase !== 'deliver' || run.selectedIndex === null || !run.canDeliverSelected) return;
    dispatchCommand({ type: 'deliver', index: run.selectedIndex });
  });
  section.querySelector('.campaign-run-complete button')?.addEventListener('click', () => {
    wantsOpen = false;
    closeRun();
    dispatchCommand({ type: 'acknowledge' });
  });
  section.addEventListener('keydown', handleBoardKeydown);
  document.body.append(section);
  shell = section;
  return section;
}

function openRun() {
  const run = activeRun();
  if (!run || !copy) return;
  const currentShell = ensureShell();
  if (!currentShell) return;
  wantsOpen = true;
  renderRun();
  currentShell.classList.add('is-open');
  currentShell.setAttribute('aria-hidden', 'false');
  document.body.classList.add('campaign-run-open');
  requestAnimationFrame(() => currentShell.querySelector('.campaign-run-back')?.focus());
}

function closeRun() {
  wantsOpen = false;
  if (!shell) return;
  shell.classList.remove('is-open');
  shell.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('campaign-run-open');
  const launcher = document.querySelector('.campaign-detail__run-button');
  if (launcher instanceof HTMLElement && launcher.offsetParent) launcher.focus();
}

function openedDetailLocationId() {
  if (!copy) return selectedLocationId;
  const detail = document.querySelector('.campaign-detail.is-open');
  if (!(detail instanceof HTMLElement)) return null;
  const title = detail.querySelector('.campaign-detail__title')?.textContent?.trim() ?? '';
  if (title === String(copy.w1Location1Name ?? '').trim()) return TARGET_LOCATION;
  return selectedLocationId;
}

function launcherLabel(run, progress) {
  const phase = run?.phase ?? progress?.currentPhase;
  if (phase === 'deliver') return run ? copy.runDeliverResume : copy.runDeliverStart;
  return run ? copy.runResume : copy.runStart;
}

function renderLauncher() {
  if (!copy) return;
  const detail = document.querySelector('.campaign-detail.is-open');
  const card = detail?.querySelector('.campaign-detail__card');
  if (!(card instanceof HTMLElement)) return;

  let launcher = card.querySelector('.campaign-detail__run-button');
  const progress = locationSnapshot();
  const run = activeRun();
  const openLocationId = openedDetailLocationId();
  const phase = run?.phase ?? progress?.currentPhase;
  const available = openLocationId === TARGET_LOCATION && (phase === 'stabilize' || phase === 'deliver');
  if (!available) {
    launcher?.remove();
    return;
  }

  if (!(launcher instanceof HTMLButtonElement)) {
    launcher = document.createElement('button');
    launcher.className = 'campaign-detail__run-button';
    launcher.type = 'button';
    launcher.addEventListener('click', () => {
      wantsOpen = true;
      if (!activeRun()) dispatchCommand({ type: 'start', worldId: TARGET_WORLD, locationId: TARGET_LOCATION });
      window.dispatchEvent(new Event('brainmerge:campaign-state-request'));
      if (activeRun()) openRun();
    });
    card.append(launcher);
  }
  const label = launcherLabel(run, progress);
  if (launcher.textContent !== label) launcher.textContent = label;
}

function scheduleLauncherRefresh() {
  if (scheduledLauncherRefresh) return;
  scheduledLauncherRefresh = true;
  queueMicrotask(() => {
    scheduledLauncherRefresh = false;
    renderLauncher();
  });
}

function unitLabel(run, index) {
  const unit = run.cells[index];
  if (run.overgrowth[index]) return copy.runBlockedCell;
  if (!unit) return copy.runEmptyCell;
  return interpolate(copy.runUnitCell, { tier: unit.tier });
}

function cellHtml(run, index) {
  const unit = run.cells[index];
  const blocked = run.overgrowth[index];
  const selected = run.selectedIndex === index;
  const selectedUnit = run.selectedIndex === null ? null : run.cells[run.selectedIndex];
  const mergeable = Boolean(selectedUnit && unit && selectedUnit.familyId === unit.familyId && run.selectedIndex !== index);
  const orderMatch = run.phase === 'deliver' && unit && unit.tier === run.activeOrderTier;
  const classes = [
    'campaign-run-cell',
    blocked ? 'is-overgrown' : '',
    unit ? 'is-occupied' : 'is-empty',
    selected ? 'is-selected' : '',
    mergeable ? 'is-mergeable' : '',
    orderMatch ? 'is-order-match' : ''
  ].filter(Boolean).join(' ');
  let inner = '<span class="campaign-run-cell__floor" aria-hidden="true"></span>';
  if (blocked) {
    inner += '<span class="campaign-run-overgrowth" aria-hidden="true"><i></i><i></i><i></i></span>';
  } else if (unit) {
    const position = tierAtlasPosition(unit.tier);
    inner += `<span class="campaign-run-unit" aria-hidden="true" style="--char-x:${position.x};--char-y:${position.y}"></span><b class="campaign-run-tier" aria-hidden="true">T${unit.tier}</b>`;
  }
  return `<button class="${classes}" type="button" role="gridcell" data-run-cell="${index}" aria-label="${unitLabel(run, index)}" ${blocked ? 'disabled' : ''}>${inner}</button>`;
}

function renderBoard(run) {
  const board = shell?.querySelector('.campaign-run-board');
  if (!(board instanceof HTMLElement)) return;
  board.setAttribute('aria-label', copy.runBoardLabel);
  board.innerHTML = run.cells.map((_, index) => cellHtml(run, index)).join('');
  board.querySelectorAll('.campaign-run-cell').forEach((cell) => {
    if (!(cell instanceof HTMLButtonElement)) return;
    cell.addEventListener('click', () => {
      const index = Number(cell.dataset.runCell);
      if (!Number.isInteger(index) || run.overgrowth[index]) return;
      if (run.selectedIndex !== null) {
        if (run.selectedIndex === index) dispatchCommand({ type: 'select', index: null });
        else dispatchCommand({ type: 'moveOrMerge', from: run.selectedIndex, to: index });
        return;
      }
      if (run.cells[index]) dispatchCommand({ type: 'select', index });
    });
  });
}

function renderRun() {
  const run = activeRun();
  if (!run || !copy) {
    if (shell?.classList.contains('is-open')) closeRun();
    return;
  }
  const currentShell = ensureShell();
  if (!currentShell) return;
  const isDeliver = run.phase === 'deliver';
  const kicker = isDeliver ? copy.runDeliverKicker : copy.runStabilizeKicker;

  currentShell.dataset.phase = run.phase;
  currentShell.setAttribute('aria-label', kicker);
  currentShell.querySelector('.campaign-run-back').textContent = `← ${copy.runBack}`;
  currentShell.querySelector('.campaign-run-heading small').textContent = copy.world1Kicker;
  currentShell.querySelector('.campaign-run-heading strong').textContent = copy.w1Location1Name;
  currentShell.querySelector('.campaign-run-progress small').textContent = isDeliver ? copy.runDeliverProgress : copy.runProgress;
  currentShell.querySelector('.campaign-run-progress strong').textContent = `${run.progressPercent}%`;
  const progressBar = currentShell.querySelector('.campaign-run-progress i');
  if (progressBar instanceof HTMLElement) progressBar.style.width = `${run.progressPercent}%`;

  currentShell.querySelector('.campaign-run-objective__copy small').textContent = kicker;
  currentShell.querySelector('.campaign-run-objective__copy strong').textContent = isDeliver ? copy.phaseDeliver : copy.phaseStabilize;
  currentShell.querySelector('.campaign-run-objective__copy p').textContent = isDeliver ? copy.runDeliverGoal : copy.runStabilizeGoal;
  if (isDeliver) {
    const currentOrder = Math.min(run.orderTotal, run.orderIndex + (run.completed ? 0 : 1));
    currentShell.querySelector('.campaign-run-objective__counter small').textContent = `${copy.runOrderLabel} ${interpolate(copy.runOrderProgress, { current: currentOrder, total: run.orderTotal })}`;
    currentShell.querySelector('.campaign-run-objective__counter strong').textContent = run.activeOrderTier === null
      ? '✓'
      : interpolate(copy.runOrderTarget, { tier: run.activeOrderTier });
  } else {
    currentShell.querySelector('.campaign-run-objective__counter small').textContent = copy.runOvergrowthLabel;
    currentShell.querySelector('.campaign-run-objective__counter strong').textContent = interpolate(copy.runRemaining, { remaining: run.overgrowthRemaining });
  }

  currentShell.querySelector('.campaign-run-supply-copy strong').textContent = copy.runSupply;
  currentShell.querySelector('.campaign-run-supply-copy small').textContent = copy.runSupplyHint;
  const supply = currentShell.querySelector('.campaign-run-supply');
  if (supply instanceof HTMLButtonElement) {
    supply.textContent = `+ ${copy.runSupply}`;
    supply.disabled = run.completed || !run.cells.some((cell, index) => !cell && !run.overgrowth[index]);
  }

  const deliver = currentShell.querySelector('.campaign-run-deliver');
  if (deliver instanceof HTMLButtonElement) {
    deliver.hidden = !isDeliver;
    deliver.disabled = !isDeliver || run.completed || !run.canDeliverSelected;
    if (isDeliver) {
      deliver.textContent = run.canDeliverSelected && run.selectedUnitTier !== null
        ? interpolate(copy.runDeliverSelected, { tier: run.selectedUnitTier })
        : interpolate(copy.runSelectForOrder, { tier: run.activeOrderTier ?? 1 });
    }
  }

  renderBoard(run);

  const complete = currentShell.querySelector('.campaign-run-complete');
  if (complete instanceof HTMLElement) {
    complete.classList.toggle('is-open', run.completed);
    complete.setAttribute('aria-hidden', run.completed ? 'false' : 'true');
    complete.querySelector('strong').textContent = isDeliver ? copy.runDeliverCompleteTitle : copy.runCompleteTitle;
    complete.querySelector('p').textContent = isDeliver ? copy.runDeliverCompleteBody : copy.runCompleteBody;
    complete.querySelector('button').textContent = copy.runReturn;
  }
}

async function refreshCopy() {
  if (!await loadCopy()) return;
  renderLauncher();
  renderRun();
}

function scheduleCopyRefresh() {
  if (scheduledCopyRefresh) return;
  scheduledCopyRefresh = true;
  queueMicrotask(async () => {
    scheduledCopyRefresh = false;
    await refreshCopy();
  });
}

window.addEventListener('brainmerge:campaign-state', (event) => {
  if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== 'object') return;
  campaignSnapshot = event.detail;
  scheduleLauncherRefresh();
  renderRun();
  if (wantsOpen && activeRun()) openRun();
});

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('.campaign-node--location') : null;
  if (target instanceof HTMLElement) {
    selectedLocationId = target.dataset.locationId ?? null;
    scheduleLauncherRefresh();
  }
}, true);

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !shell?.classList.contains('is-open')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  closeRun();
}, true);

const langObserver = new MutationObserver(scheduleCopyRefresh);
langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

const detailObserver = new MutationObserver(scheduleLauncherRefresh);
detailObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

void refreshCopy();
window.dispatchEvent(new Event('brainmerge:campaign-state-request'));
