# Active Session — Brainmerge

## Current objective
Drive Brainmerge to production-ready state using `docs/ROADMAP.md`: complete the next unfinished production block autonomously, validate it, update the roadmap/session truth, then continue to the next viable block.

The canonical gameplay direction is now **merge-idle** rather than pure merge. Characters produce coins, coins create a choice between immediate Brain Box feed and permanent Brain Lab efficiency, and first discovery of every new tier still happens through merging.

## Completed foundation
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge board with touch/mouse and tap/drag flows;
- one sequential T1-T8 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- identical-character merge -> exactly one next-tier identity;
- persistent `maxDiscoveredTier` Collection;
- two ready T1 pairs on fresh save;
- cumulative eight-step first-cycle mission journey;
- best-merge crowded-board hint;
- chain-aware true-deadlock Rescue;
- merge/discovery instant coin rewards;
- EN/RU localization architecture and current parity;
- local + Yandex platform adapters, rewarded/fullscreen capability paths, lifecycle calls and persistence;
- procedural merge/spawn/reward/rescue feedback;
- approved standalone T1 Toilet Buddy runtime art and shared-atlas source for T2-T8 until standalone replacements are available;
- responsive/reduced-motion presentation layers for chain, missions and existing board UI.

## Production economy / idle loop
- save schema **v5** with migration from every previous shipped schema v1-v4;
- passive production by tier:
  - T1 3/min;
  - T2 7/min;
  - T3 16/min;
  - T4 36/min;
  - T5 82/min;
  - T6 185/min;
  - T7 420/min;
  - T8 950/min;
- every merge is production-positive because the next tier produces more than both consumed previous-tier pieces combined;
- paid Brain Box price: `ceil(20 × 1.045 ^ paidBoxes)`;
- rewarded Brain Box stays free and does not increase paid Box inflation;
- Brain Box spawn tier is capped to `maxDiscoveredTier`, preserving merge-first discovery;
- Brain Lab permanent upgrades:
  - Base Drop Tier T1 -> T4: 600 / 3000 / 15000;
  - Lucky Drop +1-tier chance 0 / 5 / 10 / 16 / 23 / 30%: 200 / 500 / 1200 / 3000 / 7500;
  - Brain Income x1 / 1.15 / 1.32 / 1.52 / 1.75 / 2: 250 / 700 / 1800 / 5000 / 14000;
  - Offline Storage 2 / 4 / 6 / 8 / 12h: 300 / 900 / 2500 / 7000;
- online passive income uses elapsed time + fractional remainder;
- actions settle time before changing board production or global multiplier;
- offline income is capped, stored in `pendingOfflineCoins`, explicitly collected and cannot be double-claimed;
- invalid economy/timestamp/upgrade data sanitizes safely;
- clock rollback cannot move the accounting cursor backward.

## Persistence / lifecycle hardening
- `PlatformAdapter.saveState(state, flush?)` supports explicit lifecycle flushes;
- visible passive-only sessions receive a canonical autosave every 30 seconds;
- presentation income still updates on a coarser 5-second tick without cloud-writing every tick;
- `visibilitychange -> hidden` settles economy and immediately requests a flush save;
- `pagehide` repeats the flush-safe boundary;
- Yandex ordinary saves continue to debounce cloud writes;
- a lifecycle flush cancels the debounce timer and writes the latest queued snapshot with `setData(..., true)`;
- a failed older in-flight cloud write cannot overwrite a newer pending snapshot;
- platform tests cover newest-snapshot debounce, lifecycle flush, safe/local latest copy, cloud-first load and local fallback;
- lifecycle economy tests cover hide -> persisted snapshot -> resume -> reload, duplicate resume, double claim and clock rollback.

## Session / retention layer
- deterministic `Next move` guidance added after onboarding without creating another saved progression field or currency;
- priority: offline collect -> mission claim -> Rescue -> free merge -> affordable permanent upgrades -> affordable Box -> estimated wait to Box -> current-chain complete;
- affordable Brain Lab cards receive an explicit ready visual state;
- current-chain completion stops presenting another paid Box as mandatory progression;
- first-session balance guardrails are automated:
  - T4 reachable in a compact active opening with no passive wait;
  - T4 makes Lucky Drop + Brain Income affordable while another Box remains a competing option;
  - T5 remains in the early active loop;
  - baseline no-upgrade T8 route is constrained to roughly 90-240 simulated passive minutes, avoiding instant completion and an extreme hard wall;
- Prestige/rebirth evaluated and intentionally deferred until real-session data exists.

## Economy / retention presentation implemented
- HUD total production/minute;
- individual unit production labels;
- dynamic paid Brain Box price;
- Brain Box base-tier / Lucky chance / paid-purchase profile;
- explicit offline reward banner and Collect CTA;
- Brain Lab with level/effect/cost/lock/max/affordable states;
- return-session `Next move` bar;
- EN/RU copy for all economy, upgrade, offline and return guidance states;
- `public/economy-loop.css` and `public/return-loop.css` responsive layers.

## Input / accessibility hardening implemented
- `:focus-visible` treatment for board and primary controls;
- coarse-pointer minimum touch targets for locale, mission, Rescue, offline and upgrade controls;
- `touch-action:none` on merge cells to reduce browser gesture conflicts during drag;
- `touch-action:manipulation` on regular buttons;
- existing reduced-motion support retained and extended through presentation layers;
- final real-runtime contrast/layout/input review remains pending.

## Package / CI hardening
- Yandex package still enforces package-size limit;
- new `scripts/check-package.mjs` validates packaged runtime integrity after portal packaging;
- integrity gate checks required runtime files, `index.html` local refs, CSS `url()` refs, compiled relative JS imports, Yandex platform marker + `/sdk.js`, non-empty packaged locales and accidental `debugger` statements;
- both local and Yandex package scripts run integrity validation.

## Latest validated state
- **Brainmerge CI #108** on commit `affdcad09e7bb7287d1987f4fa7aa96c13114e2b` completed successfully;
- TypeScript build: PASS;
- EN/RU locale parity: PASS;
- all deterministic gameplay/economy/lifecycle/platform/pacing/return-guidance tests: PASS;
- Yandex package: PASS;
- package integrity gate: PASS;
- artifact upload: PASS.

## Canonical documents
- `docs/ROADMAP.md` — production-ready gates and current completion state.
- `docs/GAMEPLAY_AND_PROGRESSION.md` — merge-idle economy, pacing and return-guidance contract.
- `docs/ARCHITECTURE.md` — v5 state, passive-time, persistence/flush and platform architecture.
- `docs/ART_BIBLE.md` + approved Figma frames — visual source of truth.

## Remaining blockers / unfinished gates
- real browser screenshot QA at desktop 1440x900, compact landscape ~1024x576 and narrow phone width;
- runtime verification that unit income labels, Upgrade Lab, Next move, Mission, Collection and Brain Box profile do not clip or obscure approved character presentation;
- real-runtime touch/mouse/keyboard/focus/contrast validation;
- T2-T8 standalone character asset integration when approved files become available; do not fabricate replacements;
- real Yandex SDK lifecycle/capability smoke before release candidate;
- final fresh-save + migrated-save RC smoke in the packaged runtime;
- decision on any additional daily/return goal should wait for real session QA; no second currency is currently justified.

## Next execution order
1. obtain/use an actual browser runtime capture path and perform desktop/compact/mobile screenshot + interaction QA;
2. correct responsive visual/game-feel deltas found there;
3. integrate approved standalone T2-T8 assets when available;
4. run real Yandex lifecycle/capability smoke;
5. run final packaged fresh-save + migrated-save release-candidate smoke;
6. mark production-ready only when the remaining roadmap gates are actually verified.
