# Active Session — Brainmerge

## Objective
Brainmerge autonomous implementation roadmap is complete. Preserve the validated merge-idle direction and treat remaining work as external acceptance only: approved Figma comparison, real Yandex Games Portal/debug-panel validation, and human pacing/retention sign-off.

## Canonical gameplay state
- browser-first TypeScript, 6x5 merge board;
- one sequential T1-T8 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- two identical characters become exactly one next-tier character;
- first discovery remains merge-only; upgraded Brain Boxes rebuild only already-discovered tiers;
- passive coin production is merge-positive;
- paid Brain Box price escalates; rewarded Box is free and never inflates paid price;
- Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage;
- capped explicit offline reward, save v5, missions, Collection, `Next move`, Rescue;
- one primary currency remains intentional.

## Character / art truth
All eight canonical character visuals are production-bound. Toilet Buddy uses the approved standalone WebP; T2-T8 use the existing production atlas. No standalone T2-T8 asset blocker exists.

The Art-Bible-guided production finish is implemented across HUD, board, Mission, Brain Box, Brain Lab and Collection. `public/visual-finish.css` is presentation-only and contract-tested not to take over production-panel ordering/grid rows/fixed visibility. Mobile keeps board first, Mission next, then Brain Lab and Collection; Brain Lab uses a compact 2x2 module layout on phone.

Exact approved-Figma matching is not claimed because authenticated Figma MCP reads currently return the Starter-plan call-limit error. Known file key: `lIFT4QEPhnsFfSrRD8WFad`.

## Motion / interaction truth
The code-driven game-feel layer covers:
- family-specific idle motion;
- live pointer drag;
- select/merge-target anticipation;
- merge and ordinary-move flights;
- mismatch/max-tier reject feedback;
- merge landing/burst and coin trails;
- Brain Box dock + spawn-energy trajectory + spawn pop;
- discovery/T8 and Collection unlock treatment;
- Mission/offline/upgrade/Rescue/HUD feedback;
- CTA press/release microinteraction;
- Mission, level and `Next move` progression feedback.

All nonessential motion collapses under `prefers-reduced-motion`; gameplay behavior remains unchanged.

## Persistence / lifecycle truth
- migrations through save v5 and malformed-state sanitization are covered;
- online/offline accrual, duplicate resume and clock rollback are deterministic;
- autosave + lifecycle flush are implemented;
- Yandex cloud latest-snapshot/local fallback/write-race behavior is covered;
- `LoadingAPI.ready()` is emitted only after locale/save restore and first interactive render;
- GameplayAPI state transitions are idempotent;
- rewarded/fullscreen ads stop gameplay, resume exactly once only when visible, never grant reward without `onRewarded`, and recover from close/error safely;
- ad close while hidden does not incorrectly restart GameplayAPI; visibility resume starts it once.

## Return-session product decision
Daily/return goals are intentionally out of release scope rather than unfinished. Deterministic return-session QA locks the useful sequence `Offline Collect -> earned mission reward -> active merge`, so an extra synthetic daily-task layer or second currency is not justified before real retention data.

## Automated release gates
Current CI includes:
- TypeScript build;
- 131-key EN/RU locale parity;
- 58 deterministic/static tests;
- Yandex package + integrity + release audit;
- packaged desktop 1440x900 / compact 1024x576 / phone 390x844 runtime matrix;
- mouse, touch and keyboard merge paths;
- production state matrix: high tiers, crowded, deadlock, offline/mission/upgrades, maxed, T8 discovery;
- RC focus/reduced-motion/coarse-pointer/v2->v5 migration smoke;
- full motion smoke;
- packaged RU visual smoke on desktop and phone, including no horizontal overflow, non-empty critical labels and panel-header clearance;
- packaged real-adapter Yandex smoke covering rewarded success, close-without-reward, SDK error, hidden-page ad lifecycle and pagehide cloud flush;
- artifact upload for Yandex package and runtime screenshots.

Implementation HEAD `44a00e9fe3d3eba209534a23a2aa9811e0798e31` passed CI #226 end-to-end before final source-of-truth documentation updates.

## External acceptance gates only
1. Approved Figma node comparison for Mission / Collection / Brain Box / HUD / overall composition once MCP reads are available.
2. Real Yandex Games Portal/debug-panel run confirming actual Game Ready/Gameplay indicators, rewarded callbacks and cloud storage.
3. Human fresh-save + return-session pacing/retention sign-off.

These are intentionally not represented as missing code features.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md`
