const COPY_BY_LOCALE = {
  en: './locales/campaign-en.json',
  ru: './locales/campaign-ru.json'
};

const WORLD_CONFIG = {
  1: {
    background: './public/assets/campaign/campaign-world-01.webp',
    boss: './public/assets/campaign/boss-world-01.webp',
    kickerKey: 'world1Kicker',
    nameKey: 'world1Name',
    nodes: [
      ['normal', 12, 79, 18, 82], ['normal', 27, 66, 39, 72], ['challenge', 41, 56, 64, 65],
      ['normal', 55, 46, 39, 55], ['elite', 68, 37, 66, 45], ['challenge', 79, 28, 42, 35],
      ['elite', 87, 19, 68, 25], ['boss', 93, 10, 42, 12]
    ]
  },
  2: {
    background: './public/assets/campaign/campaign-world-02.webp',
    boss: './public/assets/campaign/boss-world-02.webp',
    kickerKey: 'world2Kicker',
    nameKey: 'world2Name',
    nodes: [
      ['normal', 10, 80, 17, 83], ['normal', 23, 69, 39, 73], ['challenge', 38, 58, 64, 66],
      ['normal', 54, 49, 38, 56], ['elite', 67, 39, 66, 46], ['challenge', 78, 29, 41, 36],
      ['elite', 87, 19, 68, 26], ['boss', 94, 10, 41, 12]
    ]
  }
};

const NODE_ART = {
  normal: './public/assets/ui/stage-normal.webp',
  challenge: './public/assets/ui/stage-challenge.webp',
  elite: './public/assets/ui/stage-elite.webp',
  boss: './public/assets/ui/stage-boss.webp'
};

let copy = null;
let locale = null;
let activeWorld = 1;
let overlay = null;
let scheduled = false;
let entryButton = null;

function currentLocale() {
  return document.documentElement.lang?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function interpolate(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
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

function campaignEntryHost() {
  return document.querySelector('.brand-block');
}

function ensureEntry() {
  if (!copy) return;
  const host = campaignEntryHost();
  if (!host) return;
  const existing = host.querySelector('.campaign-entry');
  if (existing instanceof HTMLButtonElement) {
    entryButton = existing;
    const label = existing.querySelector('span');
    if (label) label.textContent = copy.entry;
    existing.setAttribute('aria-label', copy.entry);
    return;
  }

  const button = document.createElement('button');
  button.className = 'campaign-entry';
  button.type = 'button';
  button.setAttribute('aria-label', copy.entry);
  button.innerHTML = '<img src="./public/assets/ui/icon-campaign.webp" alt="" aria-hidden="true"><span></span>';
  button.querySelector('span').textContent = copy.entry;
  button.addEventListener('click', openCampaign);
  host.append(button);
  entryButton = button;
}

function nodeLabel(type, stage) {
  if (type === 'boss') return interpolate(copy.bossStageLabel, { stage });
  return interpolate(copy.stageLabel, { stage });
}

function renderWorld() {
  if (!overlay || !copy) return;
  const config = WORLD_CONFIG[activeWorld];
  const scene = overlay.querySelector('.campaign-scene');
  const kicker = overlay.querySelector('.campaign-world__kicker');
  const name = overlay.querySelector('.campaign-world__name');
  const boss = overlay.querySelector('.campaign-boss');
  const nodes = overlay.querySelector('.campaign-nodes');
  if (!(scene instanceof HTMLElement) || !(kicker instanceof HTMLElement) || !(name instanceof HTMLElement) || !(boss instanceof HTMLImageElement) || !(nodes instanceof HTMLElement)) return;

  scene.dataset.world = String(activeWorld);
  scene.style.backgroundImage = `url('${config.background}')`;
  kicker.textContent = copy[config.kickerKey];
  name.textContent = copy[config.nameKey];
  boss.src = config.boss;
  boss.alt = '';
  nodes.innerHTML = config.nodes.map(([type, x, y, mx, my], index) => {
    const stage = index + 1;
    return `<span class="campaign-node campaign-node--${type}" role="img" aria-label="${nodeLabel(type, stage)}" style="--x:${x}%;--y:${y}%;--mx:${mx}%;--my:${my}%"><img src="${NODE_ART[type]}" alt="" aria-hidden="true"><b>${stage}</b></span>`;
  }).join('');

  overlay.querySelectorAll('.campaign-world-tab').forEach((tab) => {
    if (!(tab instanceof HTMLButtonElement)) return;
    const selected = Number(tab.dataset.world) === activeWorld;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}

function createOverlay() {
  const section = document.createElement('section');
  section.className = 'campaign-shell';
  section.setAttribute('role', 'dialog');
  section.setAttribute('aria-modal', 'true');
  section.setAttribute('aria-label', copy.title);
  section.innerHTML = `
    <div class="campaign-shell__inner">
      <header class="campaign-header">
        <button class="campaign-back" type="button" aria-label="${copy.back}"><span aria-hidden="true">←</span><b>${copy.back}</b></button>
        <div class="campaign-heading">
          <span>${copy.title}</span>
          <strong>${copy.subtitle}</strong>
        </div>
        <img class="campaign-header__icon" src="./public/assets/ui/icon-campaign.webp" alt="" aria-hidden="true">
      </header>
      <nav class="campaign-world-tabs" aria-label="${copy.worldSwitchLabel}">
        <button class="campaign-world-tab is-active" type="button" data-world="1" aria-pressed="true"><small>${copy.world1Kicker}</small><strong>${copy.world1Name}</strong></button>
        <button class="campaign-world-tab" type="button" data-world="2" aria-pressed="false"><small>${copy.world2Kicker}</small><strong>${copy.world2Name}</strong></button>
      </nav>
      <div class="campaign-world" aria-label="${copy.mapLabel}">
        <div class="campaign-world__title"><small class="campaign-world__kicker"></small><strong class="campaign-world__name"></strong></div>
        <div class="campaign-scene" data-world="1">
          <div class="campaign-scene__veil" aria-hidden="true"></div>
          <div class="campaign-nodes"></div>
          <img class="campaign-boss" alt="" aria-hidden="true">
        </div>
      </div>
    </div>`;

  section.querySelector('.campaign-back').addEventListener('click', closeCampaign);
  section.querySelectorAll('.campaign-world-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeWorld = Number(tab.dataset.world) === 2 ? 2 : 1;
      renderWorld();
    });
  });
  return section;
}

function openCampaign() {
  if (!copy) return;
  if (!overlay) {
    overlay = createOverlay();
    document.body.append(overlay);
  }
  renderWorld();
  document.body.classList.add('campaign-open');
  overlay.classList.add('is-open');
  requestAnimationFrame(() => overlay.querySelector('.campaign-back')?.focus());
}

function closeCampaign() {
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.classList.remove('campaign-open');
  entryButton?.focus();
}

async function refresh() {
  if (!await loadCopy()) return;
  ensureEntry();
  if (overlay?.classList.contains('is-open')) {
    overlay.setAttribute('aria-label', copy.title);
    const heading = overlay.querySelector('.campaign-heading');
    if (heading) heading.innerHTML = `<span>${copy.title}</span><strong>${copy.subtitle}</strong>`;
    const back = overlay.querySelector('.campaign-back');
    if (back) back.setAttribute('aria-label', copy.back);
    renderWorld();
  }
}

function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(async () => {
    scheduled = false;
    await refresh();
  });
}

const appRoot = document.querySelector('#app');
if (appRoot) {
  const appObserver = new MutationObserver(scheduleRefresh);
  appObserver.observe(appRoot, { childList: true, subtree: true });
}
const langObserver = new MutationObserver(scheduleRefresh);
langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && overlay?.classList.contains('is-open')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeCampaign();
  }
}, true);

void refresh();
