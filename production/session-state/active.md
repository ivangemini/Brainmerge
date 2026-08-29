# Active Session — Brainmerge

## Objective
Drive Brainmerge to production-ready state from `docs/ROADMAP.md`. Complete the next viable unfinished gate, validate it, update project truth, and continue without changing the validated merge-idle direction unnecessarily.

## Canonical gameplay state
- browser-first TypeScript, 6x5 touch/mouse merge board;
- sequential T1-T8 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- two identical characters become exactly one next-tier character;
- first discovery remains merge-only; upgraded Brain Boxes can only rebuild already-discovered tiers;
- characters produce passive coins; each merge is production-positive;
- paid Brain Box price escalates with successful paid purchases; rewarded Box is free and does not inflate paid price;
- Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage;
- capped explicit offline income, save v5, return-session `Next move`, cumulative missions, Collection, deadlock Rescue;
- one primary currency remains intentional.

## Persistence / validation baseline
- save migrations v1-v5 and malformed economy-state sanitization are covered;
- online fractional production, offline cap/claim, duplicate resume, clock rollback, autosave and Yandex latest-snapshot/lifecycle flush behavior have deterministic tests;
- package build validates HTML/CSS/JS references, locale payloads, Yandex marker/SDK loader and accidental debugger statements;
- packaged WebP/PNG assets are structurally parsed so truncated raster files fail CI.

## Approved upgrade/offline art integration
The user supplied production artwork for Base Drop Tier, Lucky +1, Global Income, Offline Capacity and Offline Reward.

Integration follows the existing code-first UI architecture rather than flattening screens into images:
- runtime sprite: `public/assets/ui/upgrade-ui-atlas.webp`;
- verified format: 200x40 transparent RGBA WebP, five 40x40 tiles;
- tile order: Base Drop / Lucky / Income / Offline Storage / Offline Reward;
- `src/ui/game-view.ts` still owns upgrade titles, levels, effects, costs, lock reasons, affordability, max state and real buttons;
- `public/upgrade-art.css` only supplies the artwork/presentation layer;
- affordable/locked/maxed state continues to come from runtime classes;
- offline artwork decorates the existing amount/description/Collect component rather than replacing it.

## UI audit findings and fixes
Rechecking the complete CSS stack found a legacy responsive rule that hid all `.side-card` elements below 1100px. That rule predated Brain Lab and made Mission, Collection and Brain Lab inaccessible on compact/mobile despite newer responsive layout code.

The effective layout now:
- restores Mission and right-rail cards below 1100px;
- removes stale nested grid-row assumptions for Collection/Lab;
- places Brain Lab before Collection on narrow phones because upgrades are an active economy action;
- keeps existing code-driven interaction and state behavior unchanged.

Component-level browser QA with the production CSS stack passed at 1440x900, 1024x576 and 390x844. Upgrade icons do not collide with title/effect/buttons, Offline Reward remains readable, and Brain Lab is present on compact/mobile. Full packaged-runtime whole-screen QA remains a separate gate.

## Latest validated build
Brainmerge CI #115 on `5555a0e1b370bb30d3929cb84434d4a2892d10f5` completed successfully:
- TypeScript/build PASS;
- EN/RU parity PASS;
- deterministic gameplay/economy/lifecycle/platform/pacing tests PASS;
- Yandex package PASS;
- package reference + raster-structure integrity PASS;
- artifact upload PASS.

The final upgrade atlas was also downloaded from a built artifact and independently decoded successfully; byte size/hash matched the verified local runtime source.

## Remaining gates
1. Whole-screen packaged-runtime QA at desktop 1440x900, compact landscape ~1024x576 and narrow phone width, including actual board/HUD/Mission/Collection/Next move/Brain Box composition.
2. Real runtime mouse/touch/keyboard/focus/contrast interaction QA.
3. Replace T2-T8 shared character atlas entries with approved standalone assets when they are supplied; do not fabricate replacements.
4. Real Yandex SDK lifecycle/capability smoke.
5. Packaged fresh-save + migrated-save release-candidate smoke.
6. Decide on additional daily/return goals only after real session QA; no second currency is currently justified.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md` + approved Figma targets
