# Brainmerge Architecture — Current Browser Runtime

## Decision
Brainmerge is a dependency-light browser TypeScript game with DOM/CSS presentation. Deterministic gameplay, economy, save and meta rules remain separate from rendering and portal SDKs.

Current product layers:
1. main T1→T18 merge-idle run;
2. permanent Collection / Prestige metadata;
3. isolated persistent Brainverse Campaign built from Locations, Landmarks and World Raids.

The obsolete architecture based on dozens of one-shot Campaign stages is retired.

## Build/runtime boundary
Authoritative source lives in `src/`.

`tsconfig.json` compiles `src/**/*.ts` to ES2022 modules under `build/` with strict TypeScript settings. `build/` is generated output, not an independent source of game rules.

Current scripts:
- `npm run build` — TypeScript compile + locale parity validation;
- `npm test` / `npm run verify` — build + deterministic Node test suite;
- `npm run serve` — rebuild, then serve on port 4173;
- `npm run package` / `package:yandex` — build, portal package checks and release audit;
- browser smoke scripts cover runtime, Campaign, final Restore/Mastery flow, RC, motion, locale and Yandex integration.

The repository currently commits `build/` so the published GitHub state contains a current runnable compiled snapshot. Any TypeScript change must still be made in `src/` and regenerated.

## Source boundaries
- `src/core/` — deterministic merge/progression/economy/save/Campaign rules; no DOM or portal SDK calls.
- `src/ui/` — authoritative-state rendering and input wiring.
- `src/i18n/` + `locales/` — locale loading/normalization and EN/RU resources.
- `src/platform/` — local/Yandex adapters, persistence, ads and lifecycle capabilities.
- `src/feedback/` — non-authoritative audio and visual feedback.
- `public/` — browser presentation shells, Campaign map/run UI and production assets.
- `tests/` + `scripts/` — deterministic logic tests, packaging checks and browser smoke infrastructure.

## Canonical GameState — save v6
`GameState.version` is **6**.

The canonical save currently owns:
- main 6×5 board;
- coins, XP, merge/spawn counters and paid Brain Box inflation;
- lifetime `maxDiscoveredTier`;
- mission cursor;
- Brain Lab run upgrades;
- elapsed-time passive/offline accounting;
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige-upgrade levels;
- permanent `CampaignProgress`;
- optional resumable `CampaignRunState`;
- ephemeral-safe selection/message fields that are sanitized on load.

`sanitizeState()` is the single migration/sanitization boundary. Valid v1-v5 saves migrate into v6 deterministically. Campaign/meta state must not create an extra unversioned localStorage system.

## Main run ownership
The main board remains the primary account-growth loop. It owns ordinary merge/economy state and lifetime discovery.

First lifetime discovery is merge-first. Brain Box and Campaign Supply may rebuild only content allowed by lifetime discovery rules.

## Campaign domain
`src/core/campaign.ts` owns persistent Campaign semantics:
- full target world count = 8;
- 7 persistent Locations per world;
- World 1 and World 2 definitions;
- stable Location ids and Landmark identity;
- phase order and weights;
- derived Location / World restoration;
- restored-Landmark counting;
- Raid gate and world-unlock derivation;
- permanent world/location/raid progress sanitization.

Each Location uses:
1. Stabilize — 20%;
2. Deliver Orders — 25%;
3. Restore Landmark — 45%;
4. Mastery — 10%.

Initial World Raid gate:
- at least 80% World Restored;
- at least 5 restored Landmarks.

## CampaignRunState
`CampaignRunState` is implemented and serialized inside save v6.

It owns a resumable isolated encounter snapshot:
- `worldId` / `locationId` / phase;
- separate 6×5 Campaign cells;
- world-modifier state (`overgrowth` in the current World 1 slice);
- merge/spawn counters;
- deterministic order tiers and cursor;
- Campaign selection;
- completion state.

It never aliases main-board cells. Campaign actions cannot silently spend ordinary coins, mutate paid Brain Box inflation, increment main-run merge counters or consume main-board units.

## Implemented reference Location — Sneaker Garden
World 1 / Location 1 is the reference implementation for future data-driven Locations.

### Stabilize
- six Overgrowth cells;
- four starting T1 Campaign units;
- every successful merge clears exactly one nearest blocker;
- six clearing pulses commit the phase exactly once.

### Deliver
- deterministic 4-order queue capped by lifetime discovery;
- reference max-T4 queue: `T2, T2, T3, T4`;
- delivery consumes only the selected Campaign unit;
- each order commits one quarter of Deliver progress exactly once.

### Restore Landmark
- six orders in three two-order batches;
- only complete batches commit permanent restoration;
- three batches map to Giant Sneaker Flower Bed Lv1/Lv2/Lv3;
- reference max-T4 queue: `T2, T2, T3, T3, T4, T4`;
- stronger Campaign Supply chance = 25% base + 5 percentage points per Landmark level, capped at 40% at Lv3.

### Mastery
- reference max-T4 queue: `T3, T4, T4`;
- five Overgrowth cells remain permanently blocked during the phase;
- merge pulses do not clear Mastery blockers;
- completion commits the final 10% and reaches 100% Location restoration.

## Campaign presentation ownership
Campaign presentation spans current browser files under `public/` plus core presentation snapshots.

The UI may own ephemeral open/selection/focus state. It must not invent persistent percentages, Landmark levels, order completion or Raid state.

Raster assets may own appearance only. They must never own currency values, progress, localized text, hit areas or gameplay rules.

## Platform/persistence boundary
`PlatformAdapter.saveState(state, flush?)` is the persistence boundary.

Current adapters:
- local: localStorage fallback/development runtime;
- Yandex: SDK integration, local/safe fallback, player cloud save, ads, locale signal and lifecycle hooks.

Campaign, Collection and Prestige remain platform-neutral core data. Portal adapters cannot fork game rules.

## Localization boundary
EN and RU are mandatory production locales with key parity. Player-facing copy belongs in locale resources rather than gameplay/core code.

Generated world/boss/icon art remains text-free. Campaign names, objective copy, progress, rewards and lock reasons remain live localized UI.

## Character rendering
All canonical T1-T18 identities render from one physical `public/assets/characters/character-atlas.webp` (6 columns × 3 rows). Per-character visual normalization is presentation-only.

## Mobile composition
Phone default is board-first:
- main board + Brain Box remain the primary loop;
- Missions / Collection / Brain Lab use the three-item dock and modal sheets;
- Campaign is a prominent top-level destination rather than a fourth cramped dock item;
- Campaign map/detail/run UI must remain touch-safe and safe-area aware.

## Current implemented vs pending meta
Implemented storage/foundation:
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade-level fields;
- Campaign permanent state;
- active Campaign run persistence.

Still pending product transactions/UI:
- claim-once Collection Reward grants;
- actual Prestige eligibility/reset/reward transaction;
- permanent Brain Cell spend tree;
- proof that gameplay-earned Campaign progress survives the implemented Prestige transaction.

## World Raid architecture
Persistent Raid state/storage and unlock derivation exist as foundation. Full playable Raid gameplay is still pending.

Target Raid contract:
- three phases;
- progress survives sessions;
- merge/order contributions are deterministic;
- later phases intensify the world modifier;
- final high-value deliveries;
- clear unlocks the next world exactly once.

No separate combat engine is required.

## Validation baseline
Current repository contains deterministic/unit and Chromium smoke coverage for the main runtime, Campaign shell, save migration/sanitization, Campaign/main-board isolation, active run resume, Deliver exact-once behavior, Restore batch atomicity, Landmark perk and Mastery completion.

A documentation claim is not evidence that a gate passed; verification status must come from an actual test/CI run.

## Next architecture milestone
Generalize the proven Sneaker Garden implementation into data-driven World 1 Location configuration instead of authoring bespoke handlers. Then implement the remaining six World 1 Locations and the persistent three-phase World 1 Raid on the same state/persistence boundary.
