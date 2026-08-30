# Active Session — Brainmerge

## Objective
Drive Brainmerge to production-ready state from `docs/ROADMAP.md`. Complete the next viable unfinished gate, validate it, update project truth, and continue without changing the validated merge-idle direction unnecessarily.

## Canonical gameplay state
- browser-first TypeScript, 6x5 merge board;
- sequential T1-T8 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- two identical characters become exactly one next-tier character;
- first discovery remains merge-only; upgraded Brain Boxes can only rebuild already-discovered tiers;
- characters produce passive coins; each merge is production-positive;
- paid Brain Box price escalates with successful paid purchases; rewarded Box is free and does not inflate paid price;
- Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage;
- capped explicit offline income, save v5, return-session `Next move`, cumulative missions, Collection, deadlock Rescue;
- one primary currency remains intentional.

## Character asset truth
All eight canonical character visuals already exist in runtime. Toilet Buddy uses `public/assets/characters/toilet-buddy-form-a.webp`; Camera Dude through Tung Wood use the existing production `character-atlas.webp`. Splitting T2-T8 into separate files is not a release requirement and there is no outstanding missing-character-art blocker.

## Persistence / validation baseline
- save migrations v1-v5 and malformed economy-state sanitization are covered;
- online fractional production, offline cap/claim, duplicate resume, clock rollback, autosave and Yandex latest-snapshot/lifecycle flush behavior have deterministic tests;
- package build validates HTML/CSS/JS references, locale payloads, Yandex marker/SDK loader and raster structure;
- short boot/resume gaps under 60 seconds use normal online accrual rather than surfacing tiny fake offline rewards; meaningful gaps still use capped explicit Collect;
- packaged release audit rejects TODO/FIXME/HACK markers, placeholder/sample copy, debug-only attributes/flags and common secret/token formats.

## UI / art architecture baseline
The user-supplied Brain Lab/offline artwork remains integrated into existing code-driven UI rather than flattened screens. Runtime state owns prices, levels, progress, locks, buttons and localization; raster layers decorate them.

CSS ownership:
- `public/code-ui.css` = structural code-first component layer;
- feature CSS = feature-specific appearance/states;
- `public/upgrade-art.css` = Brain Lab/offline presentation only;
- `public/mobile-runtime.css` = responsive composition authority;
- `public/game-feel.css` = transient motion/presentation only;
- `public/accessibility.css` = final interaction override layer.

At <=1180px board is first, Mission follows, then reachable supporting panels. Compact Collection keeps natural height rather than stretching to Brain Lab. At phone widths Brain Lab precedes Collection.

## Packaged Chromium runtime QA
CI opens the actual packaged Yandex `dist/` for browser validation.

Base viewports:
- desktop 1440x900;
- compact 1024x576;
- phone 390x844 with touch enabled.

Fresh-session and controlled-state gates verify 30 cells, key panels, overflow/broken-image/page-error health, responsive rail geometry, mouse/touch/keyboard merge, T1-T8 rendering, crowded guidance, deadlock/Rescue, offline reward, mission state, upgrade states and T8 discovery.

## Packaged RC accessibility/migration gate
`scripts/rc-smoke.mjs` verifies:
- keyboard Tab reaches a board cell with a visible >=3px focus outline;
- reduced-motion attention animations collapse to <=1 ms effective duration;
- visible checked phone/coarse-pointer controls are at least 44x44 px;
- a real legacy v2 localStorage payload migrates through packaged boot to canonical persisted v5 while preserving T5 discovery/Collection/mission compatibility and clearing stale selection.

## Game-feel animation layer
`public/game-feel.css` plus event choreography in `src/main.ts` now provides:
- asynchronous character idle motion;
- selected/merge-target lift;
- Brain Box kick + spawned-unit pop;
- merge result squash/overshoot + transient particle burst;
- mission/offline/HUD reward feedback;
- upgrade-card response;
- Rescue cell response;
- stronger discovery/high-tier treatment;
- complete reduced-motion suppression for nonessential event motion and particles.

`scripts/motion-smoke.mjs` exercises real packaged merge and Brain Box actions. It asserts emitted transition classes, `bmMergePop`/`bmSpawnPop`, particle creation and cleanup, then repeats merge under reduced motion and confirms gameplay still completes with no particle DOM creation.

## Yandex SDK lifecycle hardening
The adapter contract separates SDK initialization from Game Ready:
- `initialize()` initializes SDK/storage/player only;
- locale/save restoration and first interactive render happen before Game Ready;
- `gameReady()` emits `LoadingAPI.ready()` once and starts `GameplayAPI`;
- visibility/ad lifecycle pairs Gameplay start/stop;
- cloud debounce/latest-state flush/storage fallback/write-race protections remain intact.

`scripts/yandex-browser-smoke.mjs` now boots the packaged build through the real `YandexPlatformAdapter` using an instrumented SDK contract. It verifies:
- one SDK init and player/cloud-load path;
- Yandex preferred RU locale is applied before Game Ready;
- 30 interactive board cells exist when `LoadingAPI.ready()` fires;
- Gameplay starts after Ready;
- rewarded Brain Box invokes the SDK, stops/resumes Gameplay and delivers a spawn;
- `pagehide` flushes canonical save v5 via `player.setData(..., true)`.

This substantially hardens the portal path but does not replace a final run inside the real Yandex Games portal/debug panel.

## Latest validation
- deterministic/static suite: 51 passing tests;
- CI #180 validated the complete game-feel runtime without regressing existing package/runtime/RC gates;
- CI #187 on `6ac717efc03121592ae2e2b0d13e09a8721d584c` passed TypeScript/tests, EN/RU parity, Yandex package/integrity/release audit, full packaged state-matrix smoke, RC focus/reduced-motion/touch/migration smoke, packaged motion smoke, packaged real-adapter Yandex smoke and both artifact uploads;
- documentation commits after #187 do not alter runtime behavior and receive normal CI separately.

## Figma source of truth
Known Brainmerge Figma file key: `lIFT4QEPhnsFfSrRD8WFad`.
The connector previously identified page `Characters — Approved`. A fresh attempt still returns the authenticated Starter-plan MCP call-limit error. Therefore exact approved-target Mission/Collection/Brain Box/HUD comparison and final artistic acceptance remain externally blocked; technical screenshots must not be mislabeled as Figma acceptance.

## Remaining gates
1. Full approved-Figma/art-direction comparison once MCP reads are available; align remaining Mission/Collection/Brain Box/HUD deltas and perform final artistic contrast/focus acceptance.
2. Real Yandex Games portal/debug-panel lifecycle/capability smoke, including actual Game Ready/Gameplay indicators, ads and storage behavior.
3. Final release-candidate HEAD CI after those externally blocked gates are complete.
4. Decide on daily/return goals only if real-session QA shows they create a useful decision; no second currency is currently justified.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md` + approved Figma targets
