# Brainmerge Architecture — Browser Production Runtime

## Decision
Use dependency-light browser TypeScript + DOM/CSS. Keep deterministic gameplay/economy/save/meta rules independent from rendering and portal SDKs so the same canonical state can run on local web, Yandex Games and future web portals through adapters.

The architecture now supports three product layers:

1. core T1-T18 merge-idle run;
2. permanent Collection/Prestige meta;
3. isolated data-driven Campaign stages and bosses.

## Boundaries
- `src/core/` — deterministic merge, progression, economy, idle income, Collection, Prestige, Campaign definitions/state transitions and save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD/mission/upgrade/Collection/Campaign/Prestige rendering and input wiring.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters, persistence, ads and lifecycle capabilities.
- `src/feedback/` — non-authoritative audio/particle/game-feel feedback.
- `public/assets/characters/` — production character atlas plus retained source/reference renders.
- `public/assets/ui/` — production UI icons/atlases and future campaign/meta art.

## Current presentation layers
The shipped page intentionally layers CSS by responsibility:

- `src/styles.css` — base app geometry;
- `public/polish.css` / `viewport-fit.css` / `character-fit.css` — legacy/base presentation normalization;
- `public/code-ui.css` — primary code-first component geometry and structural skin;
- `public/sprite-art.css` — atlas variables;
- `public/chain-polish.css` — sequential-chain states and discovery/Collection polish;
- `public/standalone-character-art.css` — retained compatibility layer; current T1-T18 production rendering is unified through the shared atlas and this file must not reintroduce standalone routing;
- `public/mission-journey.css` — first-cycle mission presentation;
- `public/economy-loop.css` — production/offline/Brain Lab styling;
- `public/upgrade-art.css` — approved economy raster decoration only;
- `public/return-loop.css` — computed `Next move` presentation;
- `public/mobile-runtime.css` — responsive board/rail base composition;
- `public/visual-finish.css` / `game-feel*.css` — production finish and motion;
- `public/mobile-sheets.css` — phone-only overlay ownership for Missions / Collection / Brain Lab, keeping them out of the default document flow;
- `public/ui-icon-pass.css` — production Missions / Collection / Rewards / Brain Lab icon integration and compact alignment corrections;
- `public/accessibility.css` — final focus/coarse-pointer/reduced-motion interaction layer.

Future Campaign/Prestige presentation should follow the same contract: state/geometry is code-owned, art is decorative, and mobile navigation must not regress to a long vertical pile of full panels.

## UI ownership contract
`GameView` owns live gameplay DOM and derives visible state from authoritative data: prices, levels, progress, lock reasons, affordability, labels, buttons and hit areas remain code-owned.

Raster assets may provide:
- character art;
- icons;
- world/environment backgrounds;
- boss renders;
- decorative reward art.

Raster assets must never flatten or own:
- currency values;
- stage objectives;
- star counts;
- boss HP/progress;
- Prestige reset/preserve lists;
- localized text;
- prices/upgrade levels;
- hit areas.

## Character rendering contract
All canonical T1-T18 identities currently resolve through one physical **6x3 `public/assets/characters/character-atlas.webp`**.

Board and Collection select the correct slot through tier/family presentation data. The atlas is a production optimization, not gameplay state. Per-character scale/shadow/collection normalization remains presentation data.

Standalone character WebPs may remain in the repository as approved source/reference material but are not the ordinary production rendering path.

## Mobile composition contract
Phone default is board-first.

- main board and Brain Box remain in the primary flow;
- Missions / Collection / Brain Lab are opened from the fixed bottom dock as modal sheets;
- inactive sheets are inert/aria-hidden;
- sheets respect safe-area insets and reduced-motion rules;
- desktop card composition remains separate and unchanged by the phone controller;
- Campaign should get a prominent map/goal CTA outside the three-item dock rather than squeezing a fourth item into it by default;
- Collection Rewards live inside Collection;
- Prestige entry appears only when eligible or as a clearly locked meta entry.

## Canonical state ownership
The main persistent save remains the only authority for account progression. UI and platform adapters never invent progression state.

### Current v5 runtime state
Current production schema is **v5** and includes:
- main board;
- coins;
- paid Brain Box count;
- current Brain Lab upgrade levels;
- lifetime discovered tier;
- mission progress/history;
- passive-income remainder/timestamps/offline pending coins;
- other current canonical counters.

`sanitizeState()` currently migrates v1-v5 into v5.

### Planned v6 meta state
Collection Rewards + Prestige + Campaign should ship as one coherent **v6** migration.

Planned permanent fields:
- collection reward claim state;
- Prestige count;
- Brain Cell balance;
- permanent Prestige upgrade levels;
- campaign stage completion;
- campaign star totals;
- world unlock/completion data.

Optional active `CampaignRunState` persistence may be added only if campaign-stage resume is explicitly supported.

Do not add one-off unversioned localStorage keys for these systems.

## Main run vs permanent meta
The architecture must distinguish run-level economy from permanent account progression.

### Run-level state
Expected to reset on Prestige:
- main board units;
- coins;
- `paidBoxes` inflation;
- Brain Lab run upgrades;
- run-level fractional/pending income state.

### Permanent state
Must survive Prestige:
- lifetime Collection discovery;
- claimed Collection Rewards;
- campaign progress/stars/world clears;
- Prestige count;
- Brain Cells;
- permanent meta upgrade levels.

Reset/preserve behavior belongs in deterministic core functions with regression tests, not scattered UI handlers.

## Campaign architecture
Campaign reuses merge primitives but must not mutate the main idle board accidentally.

Target separation:

- `CampaignDefinition` / `WorldDefinition` / `StageDefinition` — immutable content tables;
- `CampaignProgress` — permanent world/stage/star completion in the save;
- `CampaignRunState` — temporary stage board, counters, objective progress and stage-local economy;
- pure core functions — start/restart/abandon/act/complete/claim stage reward;
- UI — renders current stage and map; does not own objective truth.

A stage definition should provide configuration rather than custom code:
- starting board;
- allowed/limited actions;
- objective type/target;
- mastery conditions;
- reward table;
- optional boss configuration.

## Campaign/main-board isolation
Entering a Campaign stage must not convert or overwrite the main board.

The main board remains a separate persistent structure. If passive main-board production continues while a Campaign stage is active, that behavior must be deterministic and settled through existing time-accounting logic. If it is paused, the pause must also be explicit in core state/time rules.

Leaving or restarting a stage cannot consume main-board units or coins unless a product rule explicitly says so. The first campaign implementation should prefer full isolation.

## Boss architecture
Bosses are stage configuration plus presentation.

Code-owned boss state can include:
- total/current progress or HP;
- objective queue;
- progress contribution per ordinary merge;
- larger contribution for requested orders;
- completion reward/unlock action.

Boss art is a decorative large render. No separate combat simulation, physics engine or real-time 3D system is required.

## Collection Rewards architecture
Collection milestones should be immutable data records with:
- threshold;
- reward definition;
- localization keys;
- stable milestone id.

Claiming must be transactional/idempotent: eligibility is derived from lifetime discovery, claim state persists, and the reward cannot be granted twice across rerender/reload/cloud retry.

## Prestige architecture
Prestige is a pure core transition with explicit eligibility/result output.

Recommended interface responsibilities:
- derive eligibility from current run milestone (first implementation: T18 reached);
- compute Brain Cell award from data-driven rules;
- produce a new run-level state;
- preserve permanent fields exactly;
- return a summary for the confirmation/result UI.

The UI must preview reset/preserve categories before calling the transition.

Brain Cells are a permanent-meta-only currency. Ordinary Brain Box/Brain Lab code should not accept Brain Cells.

## Time / passive-income model
Passive income remains elapsed-time based, not frame-count based.

Before actions that change board production or multipliers, runtime settles online income up to `Date.now()`.

While visible:
- presentation accrues on the existing coarse tick;
- periodic autosave persists canonical foreground state.

Lifecycle boundaries settle/flush state. Clock rollback and duplicate resume remain non-duplicating.

Prestige must zero/normalize old-run passive fields so elapsed time from a previous run cannot be credited under a new run state.

## Persistence model
`PlatformAdapter.saveState(state, flush?)` remains the only persistence boundary.

### Local
`LocalPlatformAdapter` persists the canonical versioned save to localStorage.

### Yandex
`YandexPlatformAdapter` writes safe/local state immediately and debounces cloud `player.setData()` during normal activity. Lifecycle flush writes the latest snapshot.

Campaign/Prestige fields ride inside the same versioned save. No platform-specific gameplay fork is allowed.

## Return-session guidance
`nextActionHint(state)` remains derived/advisory.

Current priority still covers offline reward, mission, deadlock, free merge, upgrades, Box and wait. After the meta systems ship, T18/completed-run states should point toward eligible Collection Reward / Prestige / Campaign objective rather than implying a nonexistent T19.

## Platform model
Common runtime depends only on `PlatformAdapter`.

- Local: localStorage development fallback.
- Yandex: SDK locale, safe/cloud persistence, rewarded/fullscreen ads and Loading/Gameplay lifecycle.
- Future portals: new adapters, not gameplay branches.

Campaign and Prestige are platform-neutral core systems.

## Packaged-runtime browser gate
CI packages the real Yandex distribution and opens packaged output in Chromium.

Current viewports:
- desktop 1440x900;
- compact 1024x576;
- phone 390x844 touch-capable.

The existing gate covers 30-cell board geometry, Missions/Collection/Brain Lab/Brain Box, shared atlas rendering, mouse/touch/keyboard merge paths, focus, reduced motion, locale, release audit and Yandex adapter behavior.

The campaign expansion must extend this gate with:
- Campaign map/navigation screenshots;
- a normal stage;
- a boss stage;
- Prestige confirmation/result;
- Collection Rewards state;
- v5 -> v6 migration;
- campaign progress surviving Prestige.

## Current gameplay runtime
- 6x5 board;
- one canonical T1 -> T18 chain;
- unified 6x3 character atlas;
- passive production and production-positive merges;
- escalating paid Brain Box + optional rewarded Box;
- Base Drop Tier / Lucky Drop / Brain Income / Offline Storage;
- merge-first discovery;
- persistent Collection;
- first-cycle mission journey to T8;
- capped explicit offline reward;
- `Next move` guidance;
- deadlock Rescue;
- save v5 + migrations;
- EN/RU parity;
- board-first mobile dock/sheets;
- production UI icon set;
- packaged Chromium/Yandex CI gates.

## Next architecture milestone
Implement Collection Rewards + Prestige + save v6 first, then the Campaign framework and Worlds 1-2.

Do not build 64 hardcoded levels. The success criterion is that additional stages/worlds are mostly data + approved art, not new gameplay branches.
