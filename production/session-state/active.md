# Active Session — Brainmerge

## Current objective
The project is in **repository recovery and architecture stabilization**, not normal feature expansion.

The published GitHub `main` does not match the owner-approved current product layout. Published `main` still places Collection and Brain Lab in a permanent right rail, while the newer intended product moved those systems to top-level UI. Rewarded-ad boost work described by the owner is also absent from every GitHub branch inspected.

Do not implement more product work on top of the stale layout until the actual current local state is recovered.

## Published GitHub baseline
`main` baseline audited:

`9c2dadbf9be01d424a7ba41447a4a14206524f57`

That baseline is internally green but its product-layout assertions are stale.

## Recovery / hardening branch
Safe GitHub-side hardening is being performed on:

`hardening/repository-recovery-2026-09-01`

Draft PR:

`#6 — recovery: harden published baseline without restoring stale UI`

Do **not** merge PR #6 into `main` until the visually current local product state has been recovered and reconciled. The PR exists to preserve and CI-test fixes that are independent of the stale right-rail composition.

## Verified hardening completed on PR #6
- fixed false max-tier reject FX for valid T8→T9 through T17→T18 pointer merges by deriving terminal status from `MAX_RUNTIME_TIER`;
- added real Chromium regression coverage for a valid T8→T9 pointer merge with no reject FX;
- added real Chromium Mission Claim transaction coverage: click, exact reward delta, mission advance, and no duplicate reward;
- added 30-second Yandex rewarded/interstitial watchdogs so lost SDK close/error callbacks cannot leave gameplay/ad state stuck forever;
- preserved a confirmed `onRewarded` event if only the later close callback is lost;
- made GameplayAPI lifecycle state retryable after asynchronous SDK rejection;
- introduced one canonical safe-storage key (`brainmerge.save.v2`) shared by Local/Yandex, while Local continues reading and dual-writing legacy `brainmerge.save.v1` during the recovery migration window;
- added local save migration regressions;
- added a committed `build/` parity gate (`git diff --exit-code -- build/`) after TypeScript compilation;
- expanded packaged release-audit scanning to CSS as well as HTML/JS/JSON;
- added `smoke:regression` to packaged CI.

The first PR #6 CI pass completed successfully with build parity, packaging and all browser smokes including the new Mission/T8 regression. Later hardening commits must pass a fresh PR CI run before being treated as verified.

## Exact packaged architecture metrics from CI artifact
The audited packaged runtime contains 76 files.

Largest runtime code files include:
- `build/core/campaign-run.js` — ~24.9 KB / 569 lines;
- `public/campaign-map.js` — ~22.0 KB / 474 lines;
- `build/ui/game-view.js` — ~21.0 KB / 321 lines;
- `build/core/game.js` — ~21.0 KB / 530 lines;
- `build/main.js` — ~18.7 KB / 462 lines;
- `public/campaign-run-ui.js` — ~17.8 KB / 447 lines;
- `build/feedback/visual-effects.js` — ~14.5 KB / 314 lines.

CSS debt in the packaged runtime:
- 636 `!important` declarations;
- `.cell` is modified by 11 CSS files / 144 selector occurrences;
- `.side-card--mission` by 9 CSS files;
- `.side-card--collection` by 8;
- `.side-card--lab` by 6;
- `.right-rail` by 4.

Runtime lifecycle glue:
- 7 `MutationObserver` references;
- 11 direct `.innerHTML =` assignments;
- Campaign map/run and mobile sheets rely on global DOM discovery after the main view recreates nodes.

These metrics confirm that file/ownership refactoring is warranted; line count alone is not the reason.

## Unmerged Campaign work
PR #5 / `campaign-world1-data-driven-v1` remains open.
It contains useful World 1 Campaign generalization, sequential Location unlocking and Toilet Pond work. Preserve it for reconciliation; do not blindly merge or reimplement it.

## P0 recovery sequence still required
GitHub contains no branch with the owner-approved newer top-level Collection/Brain Lab UI or the described rewarded-boost implementation. Therefore the unpushed local Mac state cannot be reconstructed from GitHub.

When the machine containing that state is available:
1. inspect `git status`, branches and worktrees;
2. commit that exact current state to `recovery/local-current-2026-09-01`;
3. push only the recovery branch;
4. compare recovery vs `main` vs PR #5 vs PR #6;
5. create a reconciliation branch from the recovered product state;
6. replace obsolete right-rail/mobile-dock tests with the actual top-level product contract;
7. selectively integrate verified hardening from PR #6 and useful Campaign work from PR #5;
8. only then resume feature delivery.

## Remaining high-priority technical debt
- `GameView.render()` still rebuilds the entire `#app` tree on ordinary state changes and passive-income presentation updates;
- global MutationObservers remain lifecycle glue for Campaign/mobile/FX;
- CSS structural ownership is fragmented across many override layers;
- Yandex cloud-vs-safe-local conflict resolution is still location-priority-based rather than revision/freshness-based;
- generic `main.ts` rewarded flow should eventually guard `adBusy` with `try/finally` even though the Yandex adapter now contains its own watchdog/error containment;
- Campaign definition/state is duplicated between typed core and presentation JS;
- Campaign run/detail presentation remains Sneaker-Garden-specific on published main;
- campaign detail identity must stop depending on localized visible text;
- obsolete first-eight/4×2 character-atlas rules should be deleted after the current UI is recovered;
- old layout tests must not be rewritten until the actual current UI source is available.

## Refactor direction
Split by ownership, not arbitrary line count:
- deterministic game core: state/save/merge/economy/missions/upgrades/hints;
- Campaign: definitions/progress/run-state/run-board/orders/world config/presentation;
- app controllers: bootstrap/game/lifecycle/persistence/platform;
- feature UI: Board, Missions, Collection, Brain Lab, Rewarded, Campaign, Prestige;
- CSS: tokens/base/shell/feature/responsive/accessibility with one structural owner per feature.

Avoid full-root `innerHTML` replacement for passive ticks and avoid global MutationObservers as the primary component lifecycle.

## Source-of-truth order during recovery
1. owner-approved current product behavior/layout;
2. recovered local branch once pushed;
3. deterministic core contracts that remain valid;
4. reconciled documentation/tests;
5. generated `build/` only as output, never as independent source.

The detailed findings are recorded in `docs/REPOSITORY_AUDIT_2026-09-01.md`.
