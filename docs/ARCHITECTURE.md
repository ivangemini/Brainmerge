# Brainmerge Architecture — Browser Production Runtime

## Decision
Use dependency-light browser TypeScript + DOM/CSS. Deterministic gameplay/economy/save/meta rules stay independent from rendering and portal SDKs so the same canonical state can run on local web, Yandex Games and future portals through adapters.

The architecture has three product layers:

1. core T1-T18 merge-idle run;
2. permanent Collection/Prestige meta;
3. isolated persistent Campaign worlds made from Locations, Landmarks and World Raids.

The old architecture assumption of dozens of isolated short Campaign stages is obsolete.

## Boundaries
- `src/core/` — deterministic merge, progression, economy, idle income, Collection, Prestige, Campaign definitions/state transitions and save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD/mission/upgrade/Collection/Campaign/Prestige rendering and input wiring.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters, persistence, ads and lifecycle capabilities.
- `src/feedback/` — non-authoritative audio/particle/game-feel feedback.
- `public/assets/characters/` — production character atlas plus retained source/reference renders.
- `public/assets/ui/` — production UI icons/atlases and Campaign/meta art.
- `public/assets/campaign/` — world environments and boss renders.

## Campaign domain foundation
`src/core/campaign.ts` is now the first authoritative Campaign domain module.

It currently owns:
- full target world count = 8;
- 7 persistent Locations per world;
- first production definitions for Worlds 1-2;
- stable Location ids;
- Location phase ordering;
- phase weighting;
- initial World Raid gate;
- pure Location/World progress calculations;
- restored-landmark counting;
- World Raid unlock derivation.

The UI shell must not invent different Campaign semantics.

## Campaign macro model
Every world is:

`7 persistent Locations -> World Progress / Landmarks -> persistent World Raid`

Each Location progresses through:

1. Stabilize — 20%;
2. Deliver Orders — 25%;
3. Restore Landmark — 45%;
4. Mastery — 10%.

Initial World Raid gate:
- >=80% World Restored;
- >=5 restored landmarks.

The current map shell displays 0% defaults until save v6 is wired. Presentation defaults are not authoritative save state.

## Campaign state separation
Campaign must not mutate the persistent main idle board accidentally.

Target ownership:

### `GameState`
Persistent ordinary run state:
- main 6x5 board;
- coins;
- paid Brain Box count;
- Brain Lab run upgrades;
- lifetime discovery;
- missions;
- passive/offline accounting;
- other current canonical run counters.

### `CampaignProgress`
Permanent account-level Campaign state planned for save v6:
- world unlock/clear state;
- per-Location Stabilize progress;
- per-Location Deliver/order progress;
- per-Location Landmark restoration/level;
- per-Location Mastery progress;
- World Raid phase/progress/clear state;
- exact-once Campaign reward markers where needed.

World Restored percentage should normally be derived from Location progress rather than maintained as an independent mutable source of truth.

### `CampaignRunState`
Temporary isolated encounter state:
- Campaign 6x5 board;
- stage-local/campaign-local counters;
- active orders;
- active world modifier state;
- local Box/action restrictions if any;
- current Location or Raid context.

Entering Campaign never converts the main board into Campaign state.

## Deliver Orders architecture
Deliver Orders are a core Campaign mechanic, not UI flavor.

Rules:
- an order references stable tier requirements;
- eligible requested units are created on the Campaign board;
- delivering consumes only the Campaign-board unit;
- delivering never consumes a main-board unit;
- completed order progress commits to permanent CampaignProgress exactly once;
- Campaign orders initially cannot request a lifetime-undiscovered tier;
- order tables are data/configuration, not bespoke handlers per Location.

The implementation should expose pure core functions for eligibility, delivery, progress commit and sanitization before UI handlers are considered authoritative.

## Landmark architecture
Every Location owns one stable Landmark definition.

Landmark state is permanent Campaign progression. It should include enough data to support:
- restoration threshold / level;
- visual map state;
- bounded Campaign/world perk;
- exact-once milestone reward if one exists.

Landmarks must not become an unversioned localStorage side system.

## World modifier architecture
Each world may define one reusable board modifier that changes Campaign decisions without changing canonical merge identity rules.

First production targets:
- World 1 `overgrowth`;
- World 2 `traffic-lock`.

Modifier state belongs inside `CampaignRunState`. Modifier rendering belongs in UI. Modifier definitions/config belong in core data.

A modifier may affect usable cells, action rules, spawn lanes or order pressure, but it must not:
- alter T1-T18 identity rules unpredictably;
- mutate the main board;
- depend on frame rate;
- require a separate physics engine.

## World Raid architecture
World Raids are persistent multi-session boss encounters.

Initial contract:
- 3 phases;
- code-owned phase/progress/HP;
- progress survives sessions;
- merge/order contributions are deterministic;
- later phases may intensify the world modifier;
- final phase can require high-tier deliveries;
- clear unlocks the next world exactly once.

Boss art is decorative. Boss HP, phase, orders, rewards and unlock logic are never baked into raster art.

## Current presentation layers
Campaign presentation currently lives in:
- `public/campaign-map.js`;
- `public/campaign-map.css`;
- `locales/campaign-en.json`;
- `locales/campaign-ru.json`.

The Campaign shell currently provides:
- top-level Campaign entry;
- World 1/2 switcher;
- World Restored / Landmarks / Raid-gate summary;
- connected route;
- seven Location nodes + one Raid node;
- Location overview with four phases;
- Raid overview with three phases;
- responsive desktop/mobile layout;
- approved world/boss art.

This shell is still presentation-only for progress. It must be replaced/wired to core/save state rather than allowed to evolve into an independent state owner.

## UI ownership contract
`GameView` and future Campaign controllers render authoritative data. UI may own ephemeral selection/focus/open state only.

Raster assets may provide:
- character art;
- icons;
- world backgrounds;
- boss renders;
- decorative reward/landmark art.

Raster assets must never own:
- currency values;
- Location progress;
- order requirements;
- Landmark levels;
- World Restored percentage;
- Raid HP/phase;
- Prestige reset/preserve lists;
- localized text;
- prices/upgrade levels;
- hit areas.

## Character rendering contract
All canonical T1-T18 identities resolve through one physical **6x3 `public/assets/characters/character-atlas.webp`**.

Board and Collection select slots through presentation data. The atlas is a rendering optimization, not gameplay state.

## Mobile composition contract
Phone default remains board-first.

- main board and Brain Box remain primary flow;
- Missions / Collection / Brain Lab open from the three-item bottom dock as modal sheets;
- Campaign uses a prominent top-level entry rather than a fourth cramped dock item;
- Campaign map and detail surfaces respect safe areas;
- Location detail is a bottom sheet on narrow screens;
- touch targets remain at least practical mobile size;
- Collection Rewards stay inside Collection;
- Prestige appears only when eligible or as a clearly locked meta entry.

## Current save state
Production schema remains **v5**.

Current v5 includes the main run/economy/discovery/mission/passive state and is sanitized/migrated through `sanitizeState()`.

Do not add Campaign progress through ad-hoc localStorage keys.

## Planned save v6
Campaign + Collection Rewards + Prestige must move together into one coherent v6 migration.

Required permanent categories:
- Collection reward claim state;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- world unlock/clear state;
- Location phase progress;
- Landmark state;
- World Raid progress/phase/clear state.

Optional active CampaignRunState may be persisted only if resume is explicitly supported.

Migration v1-v5 -> v6 must preserve all valid current run data and initialize Campaign/meta state deterministically.

## Main run vs permanent meta
Expected Prestige reset:
- main board units;
- coins;
- paid Brain Box inflation;
- Brain Lab run upgrades;
- run-level fractional/pending income state.

Expected Prestige preserve:
- lifetime Collection discovery;
- claimed Collection Rewards;
- Campaign Worlds/Locations/Landmarks/Raids;
- Prestige count;
- Brain Cells;
- permanent meta upgrades.

Reset/preserve behavior belongs in deterministic core transitions with tests.

## Collection Rewards architecture
Collection milestones remain immutable data records with:
- stable id;
- discovery threshold;
- reward definition;
- localization keys.

Claiming must be transactional/idempotent and survive rerender/reload/cloud retry without duplicate grants.

## Prestige architecture
Prestige remains a pure core transition:
- derive eligibility from run milestone;
- compute Brain Cell award from data;
- produce a new run state;
- preserve permanent meta exactly;
- return reset/preserve/reward summary for UI.

Brain Cells are permanent-meta-only. Ordinary Brain Box/Brain Lab code must not accept them.

## Time / passive-income model
Passive income remains elapsed-time based, not frame-count based.

Campaign opening must not accidentally duplicate/erase main-board elapsed-time accounting. Whether main passive income continues while Campaign is active must be deterministic in core lifecycle logic.

Prestige must normalize old-run passive fields so elapsed time from an old run cannot credit a new run.

## Persistence boundary
`PlatformAdapter.saveState(state, flush?)` remains the persistence boundary.

Local and Yandex adapters persist the same canonical versioned save. Campaign/Prestige cannot create platform-specific gameplay forks.

## Validation
Current CI already covers the core runtime and Campaign presentation shell.

Campaign expansion must add deterministic coverage for:
- v5 -> v6 migration;
- corrupt Campaign meta sanitization;
- Location phase calculations;
- World Progress;
- restored landmark counting;
- Raid gate;
- Campaign/main-board isolation;
- delivery consuming Campaign units only;
- exact-once order/Landmark progress;
- persistent Raid progress;
- Raid clear/world unlock;
- Campaign progress surviving Prestige;
- EN/RU parity;
- desktop/mobile Location and Raid geometry.

## Next architecture milestone
Implement save v6 permanent Campaign/meta fields, then isolated `CampaignRunState`, then make **World 1 Location 1 — Sneaker Garden** playable end-to-end through Stabilize -> Deliver -> Restore -> Mastery.

Do not author 56 bespoke levels. Additional Locations should be mostly data + world modifier + approved art.
