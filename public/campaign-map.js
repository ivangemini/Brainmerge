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
    locations: [
      ['w1Location1Name', 'w1Landmark1Name', 12, 79, 18, 82],
      ['w1Location2Name', 'w1Landmark2Name', 27, 66, 39, 72],
      ['w1Location3Name', 'w1Landmark3Name', 41, 56, 64, 65],
      ['w1Location4Name', 'w1Landmark4Name', 55, 46, 39, 55],
      ['w1Location5Name', 'w1Landmark5Name', 68, 37, 66, 45],
      ['w1Location6Name', 'w1Landmark6Name', 79, 28, 42, 35],
      ['w1Location7Name', 'w1Landmark7Name', 87, 19, 68, 25]
    ],
    raid: [93, 10, 42, 12]
  },
  2: {
    background: './public/assets/campaign/campaign-world-02.webp',
    boss: './public/assets/campaign/boss-world-02.b64',
    kickerKey: 'world2Kicker',
    nameKey: 'world2Name',
    locations: [
      ['w2Location1Name', 'w2Landmark1Name', 10, 80, 17, 83],
      ['w2Location2Name', 'w2Landmark2Name', 23, 69, 39, 73],
      ['w2Location3Name', 'w2Landmark3Name', 38, 58, 64, 66],
      ['w2Location4Name', 'w2Landmark4Name', 54, 49, 38, 56],
      ['w2Location5Name', 'w2Landmark5Name', 67, 39, 66, 46],
      ['w2Location6Name', 'w2Landmark6Name', 78, 29, 41, 36],
      ['w2Location7Name', 'w2Landmark7Name', 87, 19, 68, 26]
    ],
    raid: [94, 10, 41, 12]
  }
};

const NODE_ART = {
  location: './public/assets/ui/stage-normal.webp',
  stabilize: './public/assets/ui/stage-normal.webp',
  deliver: './public/assets/ui/stage-challenge.webp',
  restore: './public/assets/ui/stage-elite.webp',
  mastery: './public/assets/ui/stage-locked.webp',
  raid: './public/assets/ui/stage-boss.webp'
};

let copy = null;
let locale = null;
let activeWorld = 1;
let overlay = null;
let scheduled = false;
let entryButton = null;
let detailReturnTarget = null;

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
    if (label && label.textContent !== copy.entry) label.textContent = copy.entry;
    if (existing.getAttribute('aria-label') !== copy.entry) existing.setAttribute('aria-label', copy.entry);
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

function routePoints(config, xIndex, yIndex) {
  const points = config.locations.map((location) => [location[xIndex], location[yIndex]]);
  points.push([config.raid[xIndex - 2], config.raid[yIndex - 2]]);
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function routeSvg(points, mode) {
  return `
    <svg class="campaign-route__svg campaign-route__svg--${mode}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline class="campaign-route__stroke campaign-route__stroke--shadow" points="${points}" vector-effect="non-scaling-stroke"></polyline>
      <polyline class="campaign-route__stroke campaign-route__stroke--road" points="${points}" vector-effect="non-scaling-stroke"></polyline>
      <polyline class="campaign-route__stroke campaign-route__stroke--center" points="${points}" vector-effect="non-scaling-stroke"></polyline>
    </svg>`;
}

async function setBossSource(image, source) {
  image.dataset.source = source;
  if (!source.endsWith('.b64')) {
    image.src = source;
    return;
  }
  image.removeAttribute('src');
  const response = await fetch(source);
  if (!response.ok) return;
  const encoded = (await response.text()).trim();
  if (image.dataset.source !== source) return;
  image.src = `data:image/webp;base64,${encoded}`;
}

function phaseCard(type, statusKey) {
  const titleKey = `phase${type[0].toUpperCase()}${type.slice(1)}`;
  return `
    <div class="campaign-phase campaign-phase--${type}">
      <img src="${NODE_ART[type]}" alt="" aria-hidden="true">
      <div>
        <small>${copy[statusKey]}</small>
        <strong>${copy[titleKey]}</strong>
        <p>${copy[`${titleKey}Desc`]}</p>
      </div>
    </div>`;
}

function raidPhaseCard(index) {
  return `
    <div class="campaign-phase campaign-phase--raid">
      <img src="${NODE_ART.raid}" alt="" aria-hidden="true">
      <div>
        <small>${copy.phaseLocked}</small>
        <strong>${copy[`raidPhase${index}`]}</strong>
        <p>${copy[`raidPhase${index}Desc`]}</p>
      </div>
    </div>`;
}

function closeDetail({ restoreFocus = true } = {}) {
  if (!overlay) return;
  const detail = overlay.querySelector('.campaign-detail');
  if (!(detail instanceof HTMLElement)) return;
  detail.classList.remove('is-open');
  detail.setAttribute('aria-hidden', 'true');
  if (restoreFocus && detailReturnTarget instanceof HTMLElement) detailReturnTarget.focus();
  detailReturnTarget = null;
}

function openLocation(index, trigger) {
  if (!overlay || !copy) return;
  const config = WORLD_CONFIG[activeWorld];
  const location = config.locations[index];
  if (!location) return;
  const detail = overlay.querySelector('.campaign-detail');
  const kicker = overlay.querySelector('.campaign-detail__kicker');
  const title = overlay.querySelector('.campaign-detail__title');
  const progressLabel = overlay.querySelector('.campaign-detail__progress-label');
  const progressValue = overlay.querySelector('.campaign-detail__progress-value');
  const landmarkLabel = overlay.querySelector('.campaign-detail__landmark-label');
  const landmark = overlay.querySelector('.campaign-detail__landmark');
  const body = overlay.querySelector('.campaign-detail__body');
  const note = overlay.querySelector('.campaign-detail__note');
  if (!(detail instanceof HTMLElement) || !(kicker instanceof HTMLElement) || !(title instanceof HTMLElement) ||
      !(progressLabel instanceof HTMLElement) || !(progressValue instanceof HTMLElement) ||
      !(landmarkLabel instanceof HTMLElement) || !(landmark instanceof HTMLElement) ||
      !(body instanceof HTMLElement) || !(note instanceof HTMLElement)) return;

  detailReturnTarget = trigger;
  kicker.textContent = interpolate(copy.locationLabel, { location: index + 1 });
  title.textContent = copy[location[0]];
  progressLabel.textContent = copy.locationProgressLabel;
  progressValue.textContent = '0%';
  landmarkLabel.textContent = copy.landmarkLabel;
  landmark.textContent = copy[location[1]];
  body.innerHTML =
    phaseCard('stabilize', 'phaseReady') +
    phaseCard('deliver', 'phaseLocked') +
    phaseCard('restore', 'phaseLocked') +
    phaseCard('mastery', 'phaseLocked');
  note.textContent = copy.locationLongLoop;
  detail.classList.add('is-open');
  detail.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => detail.querySelector('.campaign-detail__close')?.focus());
}

function openRaid(trigger) {
  if (!overlay || !copy) return;
  const detail = overlay.querySelector('.campaign-detail');
  const kicker = overlay.querySelector('.campaign-detail__kicker');
  const title = overlay.querySelector('.campaign-detail__title');
  const progressLabel = overlay.querySelector('.campaign-detail__progress-label');
  const progressValue = overlay.querySelector('.campaign-detail__progress-value');
  const landmarkLabel = overlay.querySelector('.campaign-detail__landmark-label');
  const landmark = overlay.querySelector('.campaign-detail__landmark');
  const body = overlay.querySelector('.campaign-detail__body');
  const note = overlay.querySelector('.campaign-detail__note');
  if (!(detail instanceof HTMLElement) || !(kicker instanceof HTMLElement) || !(title instanceof HTMLElement) ||
      !(progressLabel instanceof HTMLElement) || !(progressValue instanceof HTMLElement) ||
      !(landmarkLabel instanceof HTMLElement) || !(landmark instanceof HTMLElement) ||
      !(body instanceof HTMLElement) || !(note instanceof HTMLElement)) return;

  detailReturnTarget = trigger;
  kicker.textContent = copy.raidGateLabel;
  title.textContent = copy.raidLabel;
  progressLabel.textContent = copy.raidProgressLabel;
  progressValue.textContent = '0%';
  landmarkLabel.textContent = copy.raidGateLabel;
  landmark.textContent = copy.raidLocked;
  body.innerHTML = raidPhaseCard(1) + raidPhaseCard(2) + raidPhaseCard(3);
  note.textContent = copy.raidLongLoop;
  detail.classList.add('is-open');
  detail.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => detail.querySelector('.campaign-detail__close')?.focus());
}

function renderWorld() {
  if (!overlay || !copy) return;
  const config = WORLD_CONFIG[activeWorld];
  const scene = overlay.querySelector('.campaign-scene');
  const kicker = overlay.querySelector('.campaign-world__kicker');
  const name = overlay.querySelector('.campaign-world__name');
  const boss = overlay.querySelector('.campaign-boss');
  const route = overlay.querySelector('.campaign-route');
  const nodes = overlay.querySelector('.campaign-nodes');
  const worldProgressLabel = overlay.querySelector('.campaign-summary__progress small');
  const worldProgressValue = overlay.querySelector('.campaign-summary__progress strong');
  const landmarksLabel = overlay.querySelector('.campaign-summary__landmarks small');
  const landmarksValue = overlay.querySelector('.campaign-summary__landmarks strong');
  const raidLabel = overlay.querySelector('.campaign-summary__raid small');
  const raidValue = overlay.querySelector('.campaign-summary__raid strong');
  if (!(scene instanceof HTMLElement) || !(kicker instanceof HTMLElement) || !(name instanceof HTMLElement) ||
      !(boss instanceof HTMLImageElement) || !(route instanceof HTMLElement) || !(nodes instanceof HTMLElement) ||
      !(worldProgressLabel instanceof HTMLElement) || !(worldProgressValue instanceof HTMLElement) ||
      !(landmarksLabel instanceof HTMLElement) || !(landmarksValue instanceof HTMLElement) ||
      !(raidLabel instanceof HTMLElement) || !(raidValue instanceof HTMLElement)) return;

  closeDetail({ restoreFocus: false });
  scene.dataset.world = String(activeWorld);
  scene.style.backgroundImage = `url('${config.background}')`;
  kicker.textContent = copy[config.kickerKey];
  name.textContent = copy[config.nameKey];
  void setBossSource(boss, config.boss);
  boss.alt = '';

  worldProgressLabel.textContent = copy.worldProgressLabel;
  worldProgressValue.textContent = '0%';
  landmarksLabel.textContent = copy.landmarksLabel;
  landmarksValue.textContent = `0 / ${config.locations.length}`;
  raidLabel.textContent = copy.raidGateLabel;
  raidValue.textContent = copy.raidLocked;

  const desktopPoints = routePoints(config, 2, 3);
  const mobilePoints = routePoints(config, 4, 5);
  route.innerHTML = routeSvg(desktopPoints, 'desktop') + routeSvg(mobilePoints, 'mobile');

  const locationNodes = config.locations.map((location, index) => {
    const [, , x, y, mx, my] = location;
    const label = interpolate(copy.locationLabel, { location: index + 1 });
    return `<button class="campaign-node campaign-node--location" type="button" data-location-index="${index}" aria-label="${label}" style="--x:${x}%;--y:${y}%;--mx:${mx}%;--my:${my}%"><img src="${NODE_ART.location}" alt="" aria-hidden="true"><b>${index + 1}</b><em>0%</em></button>`;
  }).join('');

  const [bx, by, bmx, bmy] = config.raid;
  const raidNode = `<button class="campaign-node campaign-node--boss is-locked" type="button" data-raid="true" aria-label="${copy.raidLabel}" style="--x:${bx}%;--y:${by}%;--mx:${bmx}%;--my:${bmy}%"><img src="${NODE_ART.raid}" alt="" aria-hidden="true"><b>8</b><em>0%</em></button>`;
  nodes.innerHTML = locationNodes + raidNode;

  nodes.querySelectorAll('.campaign-node--location').forEach((node) => {
    node.addEventListener('click', () => openLocation(Number(node.dataset.locationIndex), node));
  });
  nodes.querySelector('.campaign-node--boss')?.addEventListener('click', (event) => openRaid(event.currentTarget));

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
      <div class="campaign-world-summary">
        <div class="campaign-summary__progress"><small></small><strong></strong><span><i></i></span></div>
        <div class="campaign-summary__landmarks"><small></small><strong></strong></div>
        <div class="campaign-summary__raid"><small></small><strong></strong></div>
      </div>
      <div class="campaign-world" aria-label="${copy.mapLabel}">
        <div class="campaign-world__title"><small class="campaign-world__kicker"></small><strong class="campaign-world__name"></strong></div>
        <div class="campaign-scene" data-world="1">
          <div class="campaign-scene__veil" aria-hidden="true"></div>
          <div class="campaign-route" aria-hidden="true"></div>
          <div class="campaign-nodes"></div>
          <img class="campaign-boss" alt="" aria-hidden="true">
        </div>
      </div>
    </div>
    <div class="campaign-detail" aria-hidden="true">
      <button class="campaign-detail__backdrop" type="button" aria-label="${copy.close}"></button>
      <aside class="campaign-detail__card" aria-label="${copy.locationProgressLabel}">
        <button class="campaign-detail__close" type="button" aria-label="${copy.close}">×</button>
        <small class="campaign-detail__kicker"></small>
        <strong class="campaign-detail__title"></strong>
        <div class="campaign-detail__metrics">
          <div><small class="campaign-detail__progress-label"></small><b class="campaign-detail__progress-value"></b></div>
          <div><small class="campaign-detail__landmark-label"></small><b class="campaign-detail__landmark"></b></div>
        </div>
        <div class="campaign-detail__body"></div>
        <p class="campaign-detail__note"></p>
      </aside>
    </div>`;

  section.querySelector('.campaign-back').addEventListener('click', closeCampaign);
  section.querySelector('.campaign-detail__close').addEventListener('click', () => closeDetail());
  section.querySelector('.campaign-detail__backdrop').addEventListener('click', () => closeDetail());
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
  closeDetail({ restoreFocus: false });
  overlay.classList.remove('is-open');
  document.body.classList.remove('campaign-open');
  entryButton?.focus();
}

async function refresh() {
  if (!await loadCopy()) return;
  ensureEntry();
  if (overlay?.classList.contains('is-open')) {
    overlay.remove();
    overlay = createOverlay();
    document.body.append(overlay);
    overlay.classList.add('is-open');
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
  appObserver.observe(appRoot, { childList: true });
}
const langObserver = new MutationObserver(scheduleRefresh);
langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !overlay?.classList.contains('is-open')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (overlay.querySelector('.campaign-detail')?.classList.contains('is-open')) {
    closeDetail();
    return;
  }
  closeCampaign();
}, true);

void refresh();
