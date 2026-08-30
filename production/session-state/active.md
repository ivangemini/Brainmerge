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

## Persistence / validation baseline
- save migrations v1-v5 and malformed economy-state sanitization are covered;
- online fractional production, offline cap/claim, duplicate resume, clock rollback, autosave and Yandex latest-snapshot/lifecycle flush behavior have deterministic tests;
- package build validates HTML/CSS/JS references, locale payloads, Yandex marker/SDK loader and raster structure;
- short boot/resume gaps under 60 seconds use normal online accrual rather than surfacing tiny fake offline rewards; meaningful gaps still use capped explicit Collect;
- packaged release audit rejects TODO/FIXME/HACK markers, placeholder/sample copy, debug-only attributes/flags and common secret/token formats.

## Approved upgrade/offline art integration
The user supplied production artwork for Base Drop Tier, Lucky +1, Global Income, Offline Capacity and Offline Reward.

Integration follows the existing code-first UI architecture rather than flattening screens into images:
- runtime sprite: `public/assets/ui/upgrade-ui-atlas.webp`;
- five atlas tiles: Base Drop / Lucky / Income / Offline Storage / Offline Reward;
- `src/ui/game-view.ts` owns upgrade titles, levels, effects, costs, lock reasons, affordability, max state and real buttons;
- `public/upgrade-art.css` owns only Brain Lab/offline visual treatment and raster presentation;
- semantic icon binding follows the existing `data-upgrade` controls so card reordering cannot silently swap artwork;
- affordable/locked/maxed presentation is driven by runtime classes;
- offline artwork decorates the existing amount/description/Collect component rather than replacing it.

## UI architecture baseline
CSS ownership remains explicit:
- `public/code-ui.css` = structural code-first component layer;
- feature CSS = feature-specific appearance/states;
- `public/upgrade-art.css` = Brain Lab/offline presentation only;
- `public/mobile-runtime.css` = responsive composition authority;
- `public/accessibility.css` = final interaction override layer.

At <=1180px board is first, Mission follows, then a reachable two-column right rail. Compact Collection keeps natural height rather than stretching to Brain Lab. At phone widths Brain Lab precedes Collection.

`tests/ui-contract.test.mjs` guards stylesheet ordering, responsive ownership, compact rail geometry, code-owned Brain Lab state/actions, character sprite contracts, keyboard safety and discovery-feedback deduplication.

## Packaged Chromium runtime QA
CI opens the actual packaged Yandex `dist/` with `?platform=local` solely to avoid external SDK dependence while testing the packaged HTML/CSS/compiled JS/assets.

Viewports:
- desktop 1440x900;
- compact 1024x576;
- phone 390x844 with touch enabled.

Fresh-session gate verifies 30 cells, key panels, overflow/broken-image/page-error health, responsive rail geometry, mouse/touch/keyboard merge and focus restoration.

Controlled-state matrix additionally verifies:
- complete T1-T8 board/Collection sprite range;
- crowded-board best-pair guidance;
- true deadlock + Rescue + disabled Brain Box;
- real offline reward + Collect;
- mission-ready state;
- locked + affordable upgrades;
- all four maxed upgrades + completed mission track;
- T7 -> T8 discovery and Collection unlock.

## Runtime visual review corrections
Real CI screenshots, not isolated asset previews, drove the latest corrections:
1. Compact Collection no longer stretches to Brain Lab height or inherits stale grid-row placement.
2. Shared-atlas Camera Dude now uses an absolute board sprite slot and remains visible after merge.
3. A named `NEW Tn: Character` discovery toast suppresses the duplicate generic discovery message while reserving header geometry.
4. On phone, the fixed audio control moved from the bottom viewport anchor that overlapped Mission into a free system-control pocket below the HUD.
5. Per-character `presentation.scale`, shadow scale and Collection scale were moderately re-tuned from runtime captures toward the Art Bible 72-82% useful visual-occupancy target. Gameplay hitboxes/rules are unchanged.
6. Trivial sub-minute reload/resume gaps no longer produce +1/+2-style offline reward banners.

## Keyboard/input hardening
- global Space cannot buy a paid Brain Box;
- Enter/Space on focused board cells uses the same select/move/merge path as pointer input;
- ArrowLeft/Right/Up/Down move focus using board geometry;
- Escape clears selection;
- M remains a safe body-level mute toggle;
- focus is restored after DOM rerenders;
- real packaged mouse/touch/keyboard merge paths are CI-gated.

Tutorial cells pulse continuously by design. Playwright uses forced pointer input for those cells so it exercises the real handlers without waiting for impossible visual stability.

## Latest validation
- static suite: 50 passing tests after discovery-feedback contract coverage;
- CI #155: first complete controlled-state matrix green;
- CI #157: sub-minute offline-reward suppression green;
- CI #163 on `1a3141ddd3e2a09ac20116834ddb8f85f7778bac`: fully green — TypeScript/tests, EN/RU parity, Yandex package/integrity, packaged release audit, Playwright Chromium fresh + state-matrix smoke, package artifact and screenshot artifact uploads.
- latest documentation commit follows #163 and does not alter runtime behavior.

## Figma source of truth
Known Brainmerge Figma file key: `lIFT4QEPhnsFfSrRD8WFad`.
The connector successfully identified page `Characters — Approved`. Deeper node inspection is currently blocked by the authenticated Starter/View MCP read quota, so technical screenshots must not be mislabeled as final Figma artistic acceptance.

## Remaining gates
1. Full approved-Figma/art-direction comparison once node reads are available; align remaining Mission/Collection/Brain Box/HUD deltas and record final visual acceptance.
2. Replace T2-T8 shared atlas entries with approved standalone assets when actual files are supplied; do not fabricate replacements.
3. Final focus-visible/contrast/reduced-motion/coarse-pointer visual review.
4. Real Yandex SDK lifecycle/capability smoke.
5. Full packaged fresh-save + migrated-save release-candidate smoke.
6. Final RC HEAD CI after all remaining gates.
7. Decide on additional daily/return goals only if real session QA justifies them; no second currency is currently justified.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md` + approved Figma targets
