# Brainmerge Architecture — Recovery and Target Structure

## Status
This document distinguishes **published GitHub architecture** from the **target architecture required after recovering the actual current local product state**.

Published `main` is internally consistent but stale relative to the owner-approved UI. Its permanent Collection/Brain Lab right rail is obsolete. See `REPOSITORY_AUDIT_2026-09-01.md`.

Safe architecture hardening that does not depend on the missing local UI is isolated on draft PR #6 / `hardening/repository-recovery-2026-09-01`.

## Architectural principles
1. Deterministic gameplay is independent from DOM, CSS and portal SDKs.
2. `src/` is authoritative; generated `build/` is output only.
3. Canonical save state is versioned and sanitized through one migration boundary.
4. Platform adapters own portal SDK, persistence and ad capability differences.
5. UI features own stable DOM roots and update incrementally.
6. One structural CSS owner exists per feature/layout concern.
7. Tests encode product contracts, not historical markup.
8. Presentation consumes stable domain identity/state rather than re-deriving it from localized text.

## Exact packaged-runtime measurements
A CI artifact from the recovery hardening branch was unpacked and inspected directly.

Runtime package: **76 files**.

Largest code modules:
- `build/core/campaign-run.js` — ~24.9 KB / 569 lines / ~47 functions;
- `public/campaign-map.js` — ~22.0 KB / 474 lines / ~22 functions / ~51 DOM queries;
- `build/ui/game-view.js` — ~21.0 KB / 321 lines;
- `build/core/game.js` — ~21.0 KB / 530 lines / ~44 functions;
- `build/main.js` — ~18.7 KB / 462 lines;
- `public/campaign-run-ui.js` — ~17.8 KB / 447 lines / ~36 DOM queries;
- `build/feedback/visual-effects.js` — ~14.5 KB / 314 lines.

Current presentation/lifecycle debt:
- **636** CSS `!important` declarations;
- **7** MutationObserver references;
- **11** direct `.innerHTML =` assignments;
- `.cell`: 11 CSS owners / 144 selector occurrences;
- `.game-shell`: 8 CSS owners;
- `.board-header`: 8 CSS owners;
- `.side-card--mission`: 9 CSS owners;
- `.side-card--collection`: 8 CSS owners;
- `.side-card--lab`: 6 CSS owners;
- `.right-rail`: 4 CSS owners.

The largest `!important` contributors are `code-ui.css`, `ui-icon-pass.css`, `mobile-runtime.css`, `standalone-character-art.css`, `game-feel-advanced.css` and `chain-polish.css`.

This is enough evidence to split files and consolidate ownership. The reason is not merely line count; the problem is cross-file responsibility and override coupling.

## Current published runtime
Published `main` uses dependency-light browser TypeScript + DOM/CSS.

Current source boundaries:
- `src/core/` — deterministic main-game and Campaign logic;
- `src/ui/game-view.ts` — one renderer for most main-game UI;
- `src/main.ts` — bootstrap, state coordination, platform calls, effects and Campaign event bridge;
- `src/platform/` — local/Yandex adapters;
- `src/feedback/` — audio/visual feedback;
- `public/` — many CSS presentation layers plus plain-JS Campaign/mobile enhancers;
- `tests/` / `scripts/` — Node tests, package checks and Playwright smoke scripts.

### Critical weakness: destructive rendering
`GameView.render()` replaces the full `#app` HTML and rebinds controls. Normal passive-income presentation updates can trigger that full rebuild.

Consequences:
- DOM identity is lost;
- focus can reset;
- pointer capture/drag can race a timed render;
- sheet/modal scroll state can reset;
- external observers must rediscover nodes;
- future timed rewarded cards would be especially vulnerable to unrelated render ticks.

### Critical weakness: observer-based lifecycle
Campaign map, Campaign run UI, mobile sheets and visual effects use global MutationObservers partly because the primary view recreates DOM. Observers should not be the normal component lifecycle.

### Critical weakness: override-stack CSS
The packaged page loads 22 CSS files. Structural selectors are repeatedly re-owned and later files frequently use `!important` to override earlier assumptions.

The old right rail is referenced by multiple independent layers. This is exactly how a feature can be moved in one file while another responsive/presentation layer silently restores old placement.

## Canonical save — published v6
The published canonical `GameState` includes:
- main 6×5 cells;
- coins, XP, merge/spawn counters and paid Brain Box count;
- lifetime `maxDiscoveredTier`;
- mission cursor;
- Brain Lab levels;
- passive/offline accounting cursor/remainder;
- Collection Reward claim ids;
- Prestige count, Brain Cells and permanent Prestige upgrade levels;
- permanent Campaign progress;
- optional resumable Campaign run;
- ephemeral selection/message fields.

`sanitizeState()` is the version/migration boundary and accepts v1-v6 inputs.

### Safe-key hardening on PR #6
Published `main` had Local `brainmerge.save.v1` and Yandex `brainmerge.save.v2` as separate constants.

PR #6 introduces `src/platform/storage-keys.ts`:
- canonical safe key is `brainmerge.save.v2`;
- Local reads v2 first and falls back to v1;
- Local dual-writes v2/v1 during the recovery migration window;
- Yandex consumes the same canonical constant;
- unit tests verify migration behavior.

### Save improvement still required
Cloud-vs-local conflict resolution remains storage-priority-based. Add explicit freshness metadata such as monotonic `revision` + diagnostic `updatedAt`, sanitize both candidates, select the newest valid snapshot, then reconcile stores.

Do this against the recovered current save state rather than inventing a schema change on stale `main`.

Timed rewarded boosts, once recovered/implemented, must use absolute expiry timestamps in canonical save rather than mutable countdown state.

## Platform boundary
`PlatformAdapter` remains the correct high-level abstraction.

Keep behind the adapter/controller boundary:
- initialization;
- preferred locale;
- load/save;
- Game Ready / Gameplay API lifecycle;
- rewarded/interstitial ads;
- future payments/leaderboards.

### Hardening already implemented on PR #6
- bounded rewarded/fullscreen ad watchdog;
- no synthetic reward without `onRewarded`;
- a confirmed `onRewarded` survives loss of only the later close callback;
- async GameplayAPI rejection resets cached lifecycle state and permits retry;
- canonical safe key migration;
- generated source/build parity gate.

### Still required
- freshness-aware cloud/local arbitration;
- generic controller-level `try/finally` around rewarded busy state;
- explicit dev/fixture capability for visually testing rewarded surfaces without faking production entitlement.

## Campaign architecture
### Published main
Published `main` has a complete isolated Sneaker Garden run but runnable engine/presentation remains strongly Sneaker-Garden-specific.

`src/core/campaign.ts` owns typed world/location definitions while `public/campaign-map.js` duplicates stable IDs, localization keys, art paths and coordinates. Visual coordinates/art can remain presentation config, but stable domain identity should be supplied from one typed source.

`public/campaign-run-ui.js` also contains a fallback that infers the opened Location by comparing localized title text. That must be replaced by explicit stable identity.

### Unmerged PR #5
`campaign-world1-data-driven-v1` starts the correct generalization:
- shared World 1 Location run configs;
- sequential Location unlock;
- location-specific Overgrowth pressure;
- generalized order tier ranges;
- Toilet Pond coverage.

It must be reconciled after the true current local branch is recovered.

### Target Campaign split
```text
src/core/campaign/
  definitions.ts       # stable worlds/locations/domain IDs
  progress.ts          # permanent phase/raid/world progress
  save.ts              # campaign-specific sanitizer helpers
  run-state.ts         # CampaignRun lifecycle + validation
  run-board.ts         # campaign move/merge/supply operations
  run-orders.ts        # deliver/restore/mastery order operations
  world1-config.ts     # World 1 data, overgrowth/order pressure/perks
  presentation.ts      # derived snapshots for UI
```

Presentation may own coordinates and art mapping, but everything must be keyed by stable IDs from core snapshots.

## Main-game deterministic core target
Current `game.ts` is ~530 compiled lines and contains ~44 functions. It is deterministic and broadly tested, but new systems should no longer accumulate there.

Target:
```text
src/core/game/
  state.ts
  save.ts
  merge.ts
  economy.ts
  missions.ts
  upgrades.ts
  hints.ts
  catalog.ts
```

Suggested extraction order to minimize risk:
1. `save.ts` — create/migrate/sanitize state;
2. `missions.ts` — mission progress/claim;
3. `economy.ts` — production/accrual/offline accounting;
4. `upgrades.ts` — costs/eligibility/purchase;
5. `merge.ts` — board selection/move/merge/spawn/deadlock;
6. `hints.ts` — onboarding/next-action guidance.

Preserve public exports through a temporary `src/core/game.ts` barrel while tests migrate, then remove the compatibility barrel after callers are moved.

## Application layer target
`src/main.ts` is ~462 compiled lines and currently coordinates bootstrap, state, FX, platform calls, passive scheduling, save lifecycle, keyboard controls and Campaign commands.

Target:
```text
src/app/
  bootstrap.ts
  game-controller.ts
  lifecycle.ts
  persistence.ts
  platform-controller.ts
  event-types.ts
```

`main.ts` should become a thin entrypoint.

Suggested extraction order:
1. lifecycle/persistence timers;
2. platform/rewarded controller;
3. Campaign command bridge;
4. main game transition controller;
5. FX orchestration.

Do not perform this extraction on stale right-rail markup before local UI recovery unless a change is mechanically behavior-preserving and covered by existing browser tests.

## Feature UI target
The owner-approved current composition has Collection and Brain Lab as top-level systems rather than permanent right-side cards. The exact recovered layout becomes authoritative once pushed.

Target feature boundaries:
```text
src/features/board/
  board-view.ts
  board-controller.ts

src/features/missions/
  mission-view.ts
  mission-controller.ts

src/features/collection/
  collection-view.ts

src/features/brain-lab/
  brain-lab-view.ts

src/features/rewarded/
  rewarded-state.ts
  rewarded-view.ts
  rewarded-controller.ts

src/features/campaign/
  campaign-view.ts
  campaign-controller.ts

src/features/prestige/
  prestige-view.ts
  prestige-controller.ts
```

Each feature exposes explicit mount/update/destroy behavior or equivalent stable component functions.

## Rendering contract
### Do
- mount persistent shells once;
- update only changed text/state/classes/feature subtrees;
- preserve board cell DOM identity when possible;
- preserve focused control and panel scroll position;
- update HUD/passive counters without rebuilding unrelated panels;
- use explicit controller state for open/closed panels.

### Do not
- replace the full root on every passive tick;
- use MutationObserver to reconstruct normal component state;
- infer application state from visible localized text;
- attach independent layout policy in multiple presentation files.

## CSS target
Consolidate the current layered override stack into:
```text
src/styles/
  tokens.css
  base.css
  shell.css
  top-actions.css
  board.css
  missions.css
  collection.css
  brain-lab.css
  rewarded.css
  campaign.css
  fx.css
  responsive.css
  accessibility.css
```

Rules:
- component structure belongs to the component stylesheet;
- `responsive.css` may change composition but not redefine component art internals;
- `fx.css` never owns layout/order/hit areas;
- accessibility is last and may override only accessibility-critical interaction behavior;
- `!important` should be exceptional, not the normal cascade mechanism;
- remove dead 4×2 / first-eight atlas routing after confirming 6×3 atlas parity.

### CSS migration strategy
Do not rewrite all 22 stylesheets at once.

1. Freeze baseline screenshots.
2. Introduce tokens/base/shell without visual change.
3. Move Board rules into one owner and remove superseded selectors from old layers.
4. Repeat for Missions, Collection and Brain Lab using the recovered top-level UI, not stale right rail.
5. Move motion-only rules to `fx.css`.
6. Collapse responsive composition into one owner.
7. Delete empty legacy layers only after diff/screenshot parity.
8. Track `!important` count as a decreasing architecture metric; never accept an unexplained increase.

## Generated build policy
Preferred: remove committed `build/` and generate it for serve/package/CI.

While committed build is retained, PR #6 enforces:

```bash
npm test
git diff --exit-code -- build/
```

Agents must not hand-edit `build/` as an independent source of behavior. Generated files are committed only as exact TypeScript output.

## Testing architecture
### Core
Pure deterministic transactions, migrations, economy, Campaign isolation/progression.

### Integration/browser
Real user actions:
- merge/move;
- Mission Claim click and exact reward;
- Collection/Brain Lab top-level navigation after recovery;
- rewarded boost activation, expiry and reload;
- ad failure/no-callback recovery;
- Campaign location/run interactions;
- keyboard/touch/focus persistence.

PR #6 already adds Mission Claim transaction, valid T8→T9 pointer merge, ad watchdog, GameplayAPI rejection, local save migration and build-parity regressions.

### Product-layout contract
Screenshots/selectors must assert the **current approved composition**, not historical `.right-rail`/three-button mobile dock assumptions.

## Immediate architecture sequence
1. Keep PR #6 as an isolated hardening line and require green CI.
2. Recover actual current local UI to a GitHub branch.
3. Freeze feature expansion briefly.
4. Compare/reconcile recovered UI vs PR #5 vs PR #6.
5. Rewrite stale layout tests to current product contract.
6. Integrate verified hardening from PR #6 and useful data-driven Campaign work from PR #5.
7. Introduce stable shell + incremental HUD/board/panel rendering.
8. Split `main.ts`, `game.ts`, `game-view.ts`, Campaign run and Campaign presentation by ownership.
9. Consolidate CSS one feature at a time while reducing `!important` count.
10. Remove legacy atlas/right-rail/mobile-sheet assumptions.
11. Re-run full package/browser matrix and approve screenshots.
12. Merge the reconciled branch to `main` only after the recovered product state is represented exactly.
