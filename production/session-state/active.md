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
- package build validates HTML/CSS/JS references, locale payloads, Yandex marker/SDK loader and accidental debugger statements;
- packaged WebP/PNG assets are structurally parsed so truncated raster files fail CI.

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

## UI architecture cleanup completed
CSS ownership is explicit:
- `public/code-ui.css` remains the structural code-first component layer;
- feature CSS layers own feature-specific appearance/states;
- `public/upgrade-art.css` contains no Mission/right-rail composition rules;
- `public/economy-loop.css` no longer redefines compact/page rail composition;
- `public/mobile-runtime.css` is the final responsive composition authority;
- at <=1180px the board is first, Mission follows, then a reachable two-column right rail;
- nested legacy `grid-row` assignments are reset inside the compact rail;
- compact Collection uses natural content height rather than stretching to Brain Lab;
- at phone widths the rail becomes one column with Brain Lab before Collection;
- `public/accessibility.css` remains the final interaction override layer.

`tests/ui-contract.test.mjs` guards stylesheet ordering, responsive ownership, compact rail geometry assumptions, code-owned Brain Lab state/actions and shared-vs-standalone character sprite rules.

## Packaged Chromium runtime QA completed
The actual Yandex `dist/` package is now browser-smoked in CI with Playwright Chromium. Runtime uses `?platform=local` only to avoid making the technical UI/input gate depend on the external Yandex SDK; the loaded HTML/CSS/compiled JS/assets are the packaged distribution files.

Viewports:
- desktop 1440x900;
- compact 1024x576;
- phone 390x844 with touch enabled.

The gate verifies:
- exactly 30 board cells;
- Mission, Collection, Brain Lab, Brain Box and onboarding/Next Move visibility;
- no horizontal overflow, broken images or uncaught page errors;
- compact Brain Lab and Collection share a row without equal-height stretching;
- phone Brain Lab appears before Collection;
- T2 Camera Dude shared-atlas sprite has visible board geometry after merge;
- mouse merge works on desktop/compact;
- touch tap merge works on phone;
- a separate fresh-state keyboard merge works and focus returns to the target cell.

Full-page screenshots are uploaded from CI and have been visually reviewed. The review caught two issues that static tests had missed:
1. Collection was stretched to Brain Lab height / later still inherited a stale nested grid row; both responsive cascade issues are fixed.
2. Camera Dude appeared in Collection but disappeared on the board after merge because the shared-atlas pseudo sprite depended on flex-item sizing. Shared board sprites now use an absolute slot; Toilet Buddy keeps its standalone image path.

The current fresh-session screenshots show T1/T2 art plus readable per-unit production/tier labels at all three target viewports.

## Keyboard/input hardening
- global Space no longer buys a paid Brain Box;
- Enter/Space on a focused board cell uses the same select/move/merge path as pointer input;
- ArrowLeft/Right/Up/Down move focus using board geometry;
- Escape clears board selection;
- M remains a safe body-level mute toggle;
- focus is restored after code-driven DOM rerenders;
- real packaged-runtime mouse/touch/keyboard merge paths are now part of CI.

Tutorial cells pulse continuously by design. Playwright therefore uses forced mouse/touch input for those cells so the smoke does not wait for impossible visual stability; the emitted events still exercise the real pointer handlers.

## Latest validation
- CI #144 on `48e23424d41da978498497dc7492f337ccabf346`: fully green, including static tests, Yandex package, Playwright Chromium runtime smoke and screenshot artifact upload.
- CI #146 validates the expanded mouse/touch/keyboard runtime gate after adapting automation to intentionally animated tutorial cells; confirm final job conclusion before advancing the release baseline.
- static suite baseline is 49 passing tests plus packaged browser smoke.

## Remaining gates
1. Compare the full packaged runtime against approved Figma/art-direction targets and correct remaining visual hierarchy/scale/spacing deltas; technical browser geometry alone is not artistic acceptance.
2. Review complete visual states beyond the fresh T1/T2 route: higher tiers, crowded hint, discovery/reward, deadlock/Rescue, offline reward, mission completion, lock/max/affordable upgrade states.
3. Replace T2-T8 shared character atlas entries with approved standalone assets when they are supplied; do not fabricate replacements.
4. Final focus/contrast/reduced-motion visual review.
5. Real Yandex SDK lifecycle/capability smoke.
6. Packaged fresh-save + migrated-save release-candidate smoke.
7. Decide on additional daily/return goals only after real session QA; no second currency is currently justified.

## Source of truth
- `docs/ROADMAP.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md` + approved Figma targets
