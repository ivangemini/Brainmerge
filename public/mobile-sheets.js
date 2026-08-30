const MOBILE_QUERY = '(max-width: 700px)';
const app = document.querySelector('#app');
const media = window.matchMedia(MOBILE_QUERY);
let activePanel = null;
let scheduled = false;

const PANELS = [
  { id: 'missions', selector: '.side-card--mission', icon: './public/assets/ui/icon-missions.webp' },
  { id: 'collection', selector: '.side-card--collection', icon: './public/assets/ui/icon-collection.webp' },
  { id: 'lab', selector: '.side-card--lab', icon: './public/assets/ui/icon-brain-lab.webp' }
];

function panelStatus(id, panel) {
  if (id === 'missions') {
    const claim = panel.querySelector('[data-action="claim-mission"]');
    if (claim instanceof HTMLButtonElement && !claim.disabled) return '!';
    if (panel.querySelector('.mission-complete')) return '✓';
    const progress = panel.querySelector('.mission-row strong')?.textContent?.match(/\d+\s*\/\s*\d+/)?.[0];
    return progress ?? '•';
  }
  if (id === 'collection') {
    return panel.querySelector('.collection-count')?.textContent?.replace(/\s+/g, '') ?? '•';
  }
  const affordable = panel.querySelectorAll('.upgrade-card.is-affordable:not(.is-maxed):not(.is-locked)').length;
  return String(affordable);
}

function panelLabel(panel) {
  return panel.querySelector('.side-card__eyebrow')?.textContent?.trim() || document.title;
}

function applyState(shell) {
  const mobile = media.matches;
  shell.classList.toggle('mobile-panel-open', mobile && activePanel !== null);

  for (const config of PANELS) {
    const panel = shell.querySelector(config.selector);
    const button = shell.querySelector(`[data-mobile-panel="${config.id}"]`);
    if (!(panel instanceof HTMLElement)) continue;
    const open = mobile && activePanel === config.id;
    shell.classList.toggle(`mobile-panel-${config.id}`, open);
    panel.inert = mobile && !open;
    if (mobile) panel.setAttribute('aria-hidden', String(!open));
    else panel.removeAttribute('aria-hidden');
    if (button instanceof HTMLButtonElement) {
      button.classList.toggle('is-active', open);
      button.setAttribute('aria-expanded', String(open));
    }
  }
}

function setPanel(shell, id) {
  activePanel = activePanel === id ? null : id;
  applyState(shell);
  if (activePanel) {
    const target = shell.querySelector(PANELS.find((panel) => panel.id === activePanel)?.selector ?? '');
    target?.querySelector('button, [tabindex]')?.focus({ preventScroll: true });
  }
}

function enhance() {
  scheduled = false;
  if (!(app instanceof HTMLElement)) return;
  const shell = app.querySelector('.game-shell');
  if (!(shell instanceof HTMLElement)) return;
  if (shell.querySelector('.mobile-dock')) {
    applyState(shell);
    return;
  }

  const resolved = PANELS.map((config) => {
    const panel = shell.querySelector(config.selector);
    return panel instanceof HTMLElement ? { ...config, panel, label: panelLabel(panel) } : null;
  }).filter(Boolean);
  if (resolved.length !== PANELS.length) return;

  for (const item of resolved) {
    item.panel.dataset.mobileSheet = item.id;
    item.panel.classList.add('mobile-sheet');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mobile-sheet__close';
    close.dataset.mobileClose = '';
    close.setAttribute('aria-label', `× ${item.label}`);
    close.textContent = '×';
    close.addEventListener('click', () => {
      activePanel = null;
      applyState(shell);
    });
    item.panel.prepend(close);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-sheet-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.addEventListener('click', () => {
    activePanel = null;
    applyState(shell);
  });

  const nav = document.createElement('nav');
  nav.className = 'mobile-dock';
  nav.setAttribute('aria-label', resolved.map((item) => item.label).join(' · '));

  for (const item of resolved) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-dock__button';
    button.dataset.mobilePanel = item.id;
    button.setAttribute('aria-controls', `mobile-sheet-${item.id}`);
    button.setAttribute('aria-expanded', 'false');
    item.panel.id = `mobile-sheet-${item.id}`;

    const icon = document.createElement('img');
    icon.className = 'mobile-dock__icon';
    icon.src = item.icon;
    icon.alt = '';
    icon.decoding = 'async';
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('strong');
    label.textContent = item.label;

    const status = document.createElement('small');
    status.textContent = panelStatus(item.id, item.panel);

    button.append(icon, label, status);
    button.addEventListener('click', () => setPanel(shell, item.id));
    nav.append(button);
  }

  shell.append(backdrop, nav);
  shell.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activePanel !== null) {
      activePanel = null;
      applyState(shell);
      shell.querySelector(`[data-mobile-panel]`)?.focus({ preventScroll: true });
    }
  });
  applyState(shell);
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(enhance);
}

if (app instanceof HTMLElement) {
  new MutationObserver(scheduleEnhance).observe(app, { childList: true, subtree: true });
  media.addEventListener?.('change', scheduleEnhance);
  scheduleEnhance();
}
