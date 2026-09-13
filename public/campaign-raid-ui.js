let snapshot = null;
let copy = null;
let raidSelected = false;
let shell = null;
let returnFocus = null;

const command = (detail) => window.dispatchEvent(new CustomEvent('brainmerge:campaign-command', { detail }));
const locale = () => document.documentElement.lang?.startsWith('ru') ? 'ru' : 'en';
function setBackgroundInert(active) {
  for (const child of document.body.children) if (child !== shell) child.inert = active;
}
function closeRaid() {
  const wasOpen = shell?.classList.contains('is-open') === true;
  shell?.classList.remove('is-open');
  if (!wasOpen) return;
  const campaignShell = document.querySelector('.campaign-shell.is-open');
  if (campaignShell instanceof HTMLElement) {
    for (const child of document.body.children) child.inert = child !== campaignShell;
  } else setBackgroundInert(false);
  if (returnFocus instanceof HTMLElement) returnFocus.focus();
}

async function ensureCopy() {
  const response = await fetch(`./locales/campaign-${locale()}.json`);
  if (response.ok) copy = await response.json();
}

function ensureShell() {
  if (shell) return shell;
  shell = document.createElement('section');
  shell.className = 'raid-run-shell';
  shell.setAttribute('role', 'dialog');
  shell.setAttribute('aria-modal', 'true');
  shell.innerHTML = `<div class="raid-run-card"><header><button data-raid-close>←</button><div><small></small><strong></strong></div><b data-raid-progress></b></header><p data-raid-goal></p><div class="raid-run-board" role="grid"></div><footer><button data-raid-supply></button><button data-raid-deliver hidden></button></footer><div class="raid-run-complete" hidden><strong></strong><button data-raid-next></button></div></div>`;
  document.body.append(shell);
  shell.querySelector('[data-raid-close]').addEventListener('click', closeRaid);
  shell.querySelector('[data-raid-supply]').addEventListener('click', () => command({ type: 'raidSpawn' }));
  shell.querySelector('[data-raid-deliver]').addEventListener('click', () => {
    const index = snapshot?.activeRaid?.selectedIndex;
    if (Number.isInteger(index)) command({ type: 'raidDeliver', index });
  });
  shell.querySelector('[data-raid-next]').addEventListener('click', () => command({ type: 'raidAcknowledge' }));
  return shell;
}

function renderBoard(run) {
  const board = ensureShell().querySelector('.raid-run-board');
  board.innerHTML = run.cells.map((unit, index) => {
    const tier = unit?.tier ?? 1;
    const column = (tier - 1) % 6;
    const row = Math.floor((tier - 1) / 6);
    return `<button class="raid-cell ${run.overgrowth[index] ? 'is-blocked' : ''} ${run.selectedIndex === index ? 'is-selected' : ''}" data-raid-cell="${index}" ${run.overgrowth[index] ? 'disabled' : ''}>${unit ? `<span style="background-position:${column * 20}% ${row * 50}%"></span><b>T${tier}</b>` : ''}</button>`;
  }).join('');
  board.querySelectorAll('[data-raid-cell]').forEach((cell) => cell.addEventListener('click', () => {
    const index = Number(cell.dataset.raidCell);
    const selected = snapshot?.activeRaid?.selectedIndex;
    command(Number.isInteger(selected) && selected !== index
      ? { type: 'raidMoveOrMerge', from: selected, to: index }
      : { type: 'raidSelect', index });
  }));
}

function render() {
  const run = snapshot?.activeRaid;
  if (!run || !copy) { closeRaid(); return; }
  const current = ensureShell();
  const wasOpen = current.classList.contains('is-open');
  current.classList.add('is-open');
  setBackgroundInert(true);
  if (!wasOpen) requestAnimationFrame(() => current.querySelector('[data-raid-close]')?.focus());
  current.querySelector('header small').textContent = copy.world1Kicker;
  current.querySelector('header strong').textContent = `${copy.raidLabel} · ${copy[`raidPhase${run.phase}`]}`;
  current.querySelector('[data-raid-progress]').textContent = `${run.progressPercent}%`;
  current.querySelector('[data-raid-goal]').textContent = copy[`raidPhase${run.phase}Desc`];
  current.querySelector('[data-raid-supply]').textContent = `+ ${copy.runSupply}`;
  const deliver = current.querySelector('[data-raid-deliver]');
  deliver.hidden = run.phase !== 3;
  deliver.disabled = run.phase !== 3 || !Number.isInteger(run.selectedIndex) || run.cells[run.selectedIndex]?.tier !== run.targetTier;
  deliver.textContent = run.targetTier ? `${copy.runOrderTarget.replace('{tier}', run.targetTier)}` : copy.runReturn;
  const complete = current.querySelector('.raid-run-complete');
  complete.hidden = !run.completed;
  complete.querySelector('strong').textContent = run.phase === 3 ? copy.raidUnlocked : copy[`raidPhase${run.phase + 1}`];
  complete.querySelector('button').textContent = run.phase === 3 ? copy.runReturn : copy.runContinue;
  renderBoard(run);
}

function installLauncher() {
  const detail = document.querySelector('.campaign-detail.is-open .campaign-detail__card');
  if (!raidSelected || !detail || !copy) return;
  let button = detail.querySelector('[data-start-raid]');
  if (!button) {
    button = document.createElement('button');
    button.dataset.startRaid = 'true';
    button.className = 'campaign-raid-start';
    button.addEventListener('click', () => {
      returnFocus = document.querySelector('[data-raid]');
      if (!snapshot?.activeRaid) command({ type: 'startRaid', worldId: 1 });
      else render();
    });
    detail.append(button);
  }
  const world = snapshot?.worlds?.find((entry) => entry.id === 1);
  button.hidden = !(world?.raidUnlocked && !world?.raidCleared);
  button.textContent = snapshot?.activeRaid ? copy.runResume : copy.raidUnlocked;
}

document.addEventListener('click', async (event) => {
  raidSelected = Boolean(event.target instanceof Element && event.target.closest('[data-raid]'));
  if (raidSelected) {
    await ensureCopy();
    window.dispatchEvent(new Event('brainmerge:campaign-state-request'));
    window.setTimeout(installLauncher, 0);
  }
}, true);
window.addEventListener('brainmerge:campaign-state', async (event) => {
  snapshot = event.detail;
  if (!copy) await ensureCopy();
  installLauncher();
  render();
});
window.addEventListener('keydown', (event) => {
  if (!shell?.classList.contains('is-open')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeRaid(); return; }
  if (event.key !== 'Tab') return;
  const controls = [...shell.querySelectorAll('button:not(:disabled):not([hidden])')].filter((item) => item.offsetParent !== null);
  if (!controls.length) return;
  const first = controls[0]; const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}, true);
new MutationObserver(async () => { await ensureCopy(); installLauncher(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
window.setTimeout(() => window.dispatchEvent(new Event('brainmerge:campaign-state-request')), 0);
