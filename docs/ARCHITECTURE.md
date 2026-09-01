# Brainmerge Architecture — Recovery and Target Structure

## Status
This document distinguishes **published GitHub architecture** from the **target architecture required after recovering the actual current local product state**.

Published `main` is internally consistent but stale relative to the owner-approved UI. In particular, its permanent Collection/Brain Lab right rail is obsolete. See `REPOSITORY_AUDIT_2026-09-01.md`.

## Architectural principles
1. Deterministic gameplay is independent from DOM, CSS and portal SDKs.
2. `src/` is authoritative; generated `build/` is never edited directly.
3. Canonical save state is versioned and sanitized through one migration boundary.
4. Platform adapters own portal SDK, persistence and ad capability differences.
5. UI features own stable DOM roots and update incrementally.
6. One structural CSS owner exists per feature/layout concern.
7. Tests encode product contracts, not historical markup.
8. Presentation must consume domain identity/state rather than re-derive it from localized text.

## Current published runtime
Published `main` uses dependency-light browser TypeScript + DOM/CSS.

Current source boundaries:
- `src/core/` — deterministic main-game and Campaign logic;
- `src/ui/game-view.ts` — one large renderer for most main-game UI;
- `src/main.ts` — bootstrap, state coordination, platform calls, effects and Campaign event bridge;
- `src/platform/` — local/Yandex adapters;
- `src/feedback/` — audio/visual feedback;
- `public/` — many CSS presentation layers plus plain-JS Campaign/mobile enhancers;
- `tests/` / `scripts/` — Node tests, package checks and Playwright smoke scripts.

### Current critical weakness: destructive rendering
`GameView.render()` replaces the full `#app` HTML and rebinds controls. Normal passive-income updates can trigger that full rebuild.

This creates unnecessary lifecycle instability:
- DOM identity is lost;
- focus can reset;
- pointer capture/drag can race a timed render;
- modal/sheet scroll state can reset;
- external observers must rediscover nodes;
- feature state risks being stored indirectly in DOM rather than explicit controllers.

### Current critical weakness: override-stack CSS
The packaged page loads `src/styles.css` followed by many public CSS layers. Multiple files target the same structural selectors and rely heavily on `!important` to establish final ownership.

The old right rail is referenced by several independent layers. This is exactly the class of architecture that lets a UI move be completed visually in one file while another responsive layer silently restores old placement.

### Current critical weakness: observer-based lifecycle
Several MutationObservers in feedback/mobile/Campaign runtime compensate for frequently replaced DOM. Observers should not be the primary component lifecycle system.

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

### Save improvements required
Add an explicit snapshot freshness field such as monotonic `revision` plus `updatedAt`, then arbitrate cloud vs local using validity + freshness. Storage location alone must not decide the winner.

Unify safe local storage namespaces across Local/Yandex fallback paths and explicitly migrate legacy keys.

Timed rewarded boosts, once recovered/implemented, must use absolute expiry timestamps in canonical save rather than in-memory countdowns.

## Platform boundary
`PlatformAdapter` is the correct high-level abstraction and should remain.

Keep behind the adapter/controller boundary:
- initialization;
- preferred locale;
- load/save;
- Game Ready / Gameplay API lifecycle;
- rewarded/interstitial ads;
- future payments/leaderboards.

### Required hardening
- ad calls need watchdog timeouts;
- gameplay resume must remain idempotent;
- no reward is granted without rewarded callback;
- local dev needs an explicit fixture/dev mode to display rewarded surfaces without faking production capability;
- cloud/local conflict resolution must be freshness-aware.

## Campaign architecture
### Published main
Published `main` has a complete isolated Sneaker Garden run but the runnable engine/presentation remains strongly Sneaker-Garden-specific.

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

Presentation may separately own coordinates and art mapping, but must key everything by stable domain IDs received from the core snapshot.

Do not infer identity by comparing localized visible strings.

## Main-game deterministic core target
The current `game.ts` is still manageable logically, but further systems should not accumulate there.

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

These modules remain DOM-free and platform-free.

## Application layer target
`src/main.ts` currently coordinates too many concerns.

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

Responsibilities:
- initialize platform/locales/save;
- own canonical in-memory state;
- serialize state transitions;
- schedule passive accounting;
- request persistence;
- call feature view updates;
- bridge Campaign and main game through typed interfaces.

`main.ts` should become a thin entrypoint.

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

Each feature should expose explicit `mount()` / `update()` / optional `destroy()` behavior or equivalent stable component functions.

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

## Generated build policy
Preferred: remove committed `build/` and generate it for serve/package/CI.

If committed build is retained, CI must run a clean build then fail on:

```bash
git diff --exit-code -- build/
```

Agents must never edit `build/` to fix behavior.

## Testing architecture
Tests must follow contracts at three levels.

### Core
Pure deterministic transactions, migrations, economy, Campaign isolation/progression.

### Integration/browser
Real user actions:
- merge/move;
- Mission Claim click and exact reward;
- Collection/Brain Lab top-level navigation;
- rewarded boost activation, expiry and reload;
- ad failure/no-callback recovery;
- Campaign location/run interactions;
- keyboard/touch/focus persistence.

### Product-layout contract
Screenshots/selectors must assert the **current approved composition**, not historical `.right-rail`/three-button mobile dock assumptions.

## Immediate architecture sequence
1. Recover actual current local UI to a GitHub branch.
2. Freeze feature work temporarily.
3. Reconcile PR #5 without losing owner-approved UI.
4. Rewrite stale layout tests.
5. Fix confirmed high-tier reject FX and platform persistence/ad issues.
6. Introduce stable shell + incremental HUD/board/panel rendering.
7. Split `main.ts`, `game-view.ts`, Campaign run and CSS by ownership.
8. Remove legacy CSS/atlas overrides.
9. Re-run full package/browser matrix and approve screenshots.
10. Merge the reconciled branch to `main` only after the recovered product state is represented exactly.