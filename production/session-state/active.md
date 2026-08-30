# Active Session — Brainmerge

## Objective
Brainmerge autonomous implementation is at release-candidate stage. Preserve the validated merge-idle direction and continue only with unfinished acceptance/hardening work: approved Figma comparison, real Yandex Games Portal/debug-panel validation, and human pacing/retention sign-off.

## Canonical gameplay state
- browser-first TypeScript, 6x5 merge board;
- one sequential T1-T18 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood -> Brr Brr Patapim -> Boneca Ambalabu -> Cappuccino Assassino -> Frigo Camelo -> Lirili Larila -> Chimpanzini Bananini -> Cocofanto Elefanto -> Bombombini Gusini -> Trippi Troppi -> La Vacca Saturno Saturnita;
- two identical non-terminal characters become exactly one next-tier character; T18 is terminal;
- T8 remains a midgame checkpoint, not chain completion;
- first discovery remains merge-only; upgraded Brain Boxes rebuild only already-discovered tiers;
- passive coin production is merge-positive;
- paid Brain Box price escalates; rewarded Box is free and never inflates paid price;
- Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage;
- capped explicit offline reward, save v5, missions, Collection, `Next move`, Rescue;
- one primary currency remains intentional.

## Character / art truth
All eighteen canonical character visuals are production-bound. Toilet Buddy uses standalone art, T2-T8 use the existing production atlas, and T9-T18 use standalone packaged WebP assets. The T9-T18 board and Collection routes are contract-tested so the legacy atlas cannot override the new art.

The T18 raster was repaired after package-integrity QA caught a truncated RIFF payload. Current Yandex packaging validates all referenced character rasters structurally before browser smoke.

The Art-Bible-guided production finish is implemented across HUD, board, Mission, Brain Box, Brain Lab and Collection. `public/visual-finish.css` remains presentation-only and contract-tested not to take over production-panel ordering/grid rows/fixed visibility. Mobile keeps board first, Mission next, then Brain Lab and Collection.

Known approved Figma file key: `lIFT4QEPhnsFfSrRD8WFad`. Exact approved-frame comparison remains an external acceptance gate until the target nodes are inspected in the authenticated Figma context.

## Motion / interaction truth
The code-driven game-feel layer covers family idle motion, live drag, merge/move/reject feedback, Brain Box spawn choreography, coin trails, discovery/Collection unlock, reward/upgrade/Rescue response, CTA microinteraction and Mission/level/`Next move` progression feedback. Nonessential motion collapses under `prefers-reduced-motion`; gameplay remains functional.

## Persistence / lifecycle truth
- migrations through save v5 and malformed-state sanitization are covered;
- online/offline accrual, duplicate resume and clock rollback are deterministic;
- autosave + lifecycle flush are implemented;
- Yandex cloud latest-snapshot/local fallback/write-race behavior is covered;
- `LoadingAPI.ready()` is emitted only after locale/save restore and first interactive render;
- GameplayAPI transitions are idempotent;
- rewarded/fullscreen ads stop gameplay, resume exactly once only when visible, never grant reward without `onRewarded`, and recover from close/error safely;
- ad close while hidden does not incorrectly restart GameplayAPI; visibility resume starts it once.

## Return-session product decision
Daily/return goals remain intentionally out of release scope. Deterministic return-session QA locks the useful sequence `Offline Collect -> earned mission reward -> active merge`, so an extra synthetic daily-task layer or second currency is not justified before real retention data.

## Automated release gates
CI run #241 on commit `243b2d15edc5c92582ab50a269ee29ffd7059ca6` passed end-to-end after the T18 expansion. It validates:
- TypeScript build and EN/RU locale parity;
- 60 deterministic/static tests;
- Yandex package + raster integrity + release audit;
- packaged desktop 1440x900 / compact 1024x576 / phone 390x844 runtime matrix;
- mouse, touch and keyboard merge paths;
- all T1-T18 characters on the high-tier runtime fixture, including T9-T18 standalone image decoding/rendering;
- a genuine terminal-T18 full-board deadlock with Rescue and disabled Brain Box;
- crowded guidance, offline/mission/upgrades, maxed upgrades and T8 discovery;
- RC focus/reduced-motion/coarse-pointer/v2->v5 migration smoke;
- full motion smoke;
- packaged RU visual smoke;
- packaged Yandex-adapter smoke covering rewarded success, close-without-reward, SDK error, hidden-page lifecycle and pagehide cloud flush;
- artifact upload for the Yandex package and runtime screenshots.

Runtime screenshots from #241 were visually inspected. The T1-T18 board renders all eighteen identities with readable tier/income badges; the terminal T18 deadlock surface renders all 30 terminal units plus the actionable Rescue state without broken images or horizontal clipping.

## External acceptance gates only
1. Approved Figma node comparison for Mission / Collection / Brain Box / HUD / overall composition.
2. Real Yandex Games Portal/debug-panel run confirming actual Game Ready/Gameplay indicators, rewarded callbacks and cloud storage.
3. Human fresh-save + return-session pacing/retention sign-off.

These are intentionally not represented as missing core code features.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md`
