# Brainmerge Repository Audit — 2026-09-01

## Purpose
This audit separates three different things that had started to be treated as one project state:

1. **published `main`** — the version currently present on GitHub and packaged by CI;
2. **unmerged GitHub work** — especially PR #5 / `campaign-world1-data-driven-v1`;
3. **the newer product state described by the owner** — including Collection and Brain Lab moved to the top-level UI and rewarded-ad boost work that is not present in published `main`.

Until the newer local state is recovered and pushed to a dedicated branch, **do not treat `main` as the latest product design** and do not rewrite the newer UI to satisfy tests that encode the old layout.

## Published baseline
Published `main` before this audit branch is:

`9c2dadbf9be01d424a7ba41447a4a14206524f57`

The last gameplay source baseline on that line is effectively the completed Sneaker Garden slice from `429b2b1`; later `main` commits publish generated `build/` output and synchronize documentation.

GitHub Actions for that published baseline was green:
- 96/96 Node tests;
- local/Yandex packaging;
- runtime Chromium smoke;
- Campaign shell smoke;
- Sneaker Garden Restore/Mastery smoke;
- RC/accessibility smoke;
- motion smoke;
- RU locale smoke;
- Yandex adapter smoke.

**Important:** green CI does not prove this is the intended current game. Several tests explicitly require the obsolete right-rail/mobile-sheet composition and therefore protect the wrong product state.

## P0 — repository state is split

### 1. `main` still contains the old right rail
`src/ui/game-view.ts` renders:
- Missions at the left;
- Merge Board in the center;
- Collection and Brain Lab inside `.right-rail`.

The packaged CI screenshots confirm that composition.

The owner-approved newer composition has Collection and Brain Lab moved to top-level UI rather than permanently occupying the right side. That newer composition is not in published `main`.

### 2. Tests encode the obsolete layout
Current tests assert that:
- desktop retains Collection and Brain Lab cards;
- compact layout puts the right-rail cards in a row;
- phone exposes Missions / Collection / Brain Lab through a three-button bottom dock;
- `.right-rail` remains part of responsive composition.

Those assertions must be replaced with tests for the recovered current design. Otherwise an implementation agent can make CI green by restoring UI that the product owner already removed.

### 3. Rewarded boost feature is missing from `main`
Published `main` contains rewarded Brain Box support but no complete rewarded-boost system/card:
- no canonical boost state/expiry fields;
- no x2 timed income/click boost transaction;
- no separate boost presentation with remaining time.

If that work exists locally, it must be recovered rather than reimplemented from memory.

### 4. Significant Campaign work is stranded in PR #5
PR #5, `campaign-world1-data-driven-v1`, is open and diverged from `main`.
It:
- generalizes World 1 Campaign runs;
- adds data-driven Location configs;
- adds sequential Location unlocks;
- includes Toilet Pond work;
- replaces the old monolithic `campaign-run.ts` entry with a World 1 implementation module;
- has passing CI at its head.

Do not discard or blindly merge it. Rebase/reconcile it after the actual current product branch is recovered.

## P1 — architecture risks that cause intermittent UI regressions

### 5. The entire app DOM is rebuilt during normal state updates
`GameView.render()` replaces `#app.innerHTML` and then rebinds interactions.
`main.ts` calls render on passive-income updates, gameplay actions, lifecycle changes and locale changes.

Consequences:
- focused controls are destroyed and recreated;
- pointer capture/drag can be interrupted by a timed render;
- sheet scroll/focus state can reset;
- external DOM enhancers must rediscover/redecorate nodes;
- a click can race with an unrelated render.

This architecture is especially risky for Mission Claim, modal/sheet controls and future timed rewarded boosts.

**Target:** stable feature roots and incremental rendering. Passive income should update HUD/economy presentation without recreating the board and all panels.

### 6. Multiple MutationObservers compensate for destructive rendering
The packaged runtime contains several global DOM observers across:
- visual effects;
- mobile sheets;
- Campaign map;
- Campaign run UI.

Observers are useful for isolated integration, but here they are acting as lifecycle glue because the main view continually destroys DOM. Replace this with explicit mount/update/unmount boundaries.

### 7. CSS ownership is fragmented
The packaged runtime loads more than twenty CSS files after `src/styles.css`.
The same structural selectors are owned by many layers, for example:
- `.cell`;
- `.game-shell`;
- `.board-header`;
- `.side-card--mission`;
- `.side-card--collection`;
- `.side-card--lab`;
- `.right-rail`.

The package contains hundreds of `!important` declarations. Later files frequently exist to override assumptions from earlier files.

This makes a layout move — such as moving Collection/Brain Lab upward — easy to partially implement while old responsive/presentation rules continue to reposition or restyle the legacy nodes.

**Target:** one structural owner per component, with tokens/base/layout/feature/responsive/accessibility layers and minimal `!important`.

### 8. Legacy character-atlas rules remain under the current atlas layer
Older CSS still contains first-eight / 4×2-era routing and family overrides, while `standalone-character-art.css` later overrides those rules for the production 6×3 T1–T18 atlas.

The final output currently works, but the dead routing should be removed so future character/UI changes do not depend on specificity wars.

### 9. Main Campaign run remains Sneaker-Garden-specific
Published `main` hardcodes the runnable Campaign Location to World 1 / Sneaker Garden in core/runtime UI. PR #5 starts the correct generalization and should be used as the integration base after repository recovery.

### 10. Campaign domain data is duplicated in presentation JS
`src/core/campaign.ts` owns Campaign definitions while `public/campaign-map.js` repeats world/location identity, keys, coordinates and assets in plain JavaScript.

Keep visual coordinates/assets in presentation config if needed, but stable domain IDs, unlock semantics and progress contracts should not be redefined independently in two runtimes.

### 11. Campaign detail selection is coupled to localized visible text
Parts of Campaign presentation infer the selected Location by comparing rendered/localized names. Use explicit `data-location-id` / typed identity throughout instead.

## Confirmed code bug

### 12. Valid high-tier merges can receive reject FX
The pointer feedback layer treats a same-family source with `sourceTier >= 8` as a max-tier reject. The actual terminal tier is T18.

Therefore valid T8→T9 through T17→T18 pointer merges can receive a rejection animation even though core gameplay accepts the merge.

Fix the feedback rule to derive terminal status from the catalog (`nextFamilyFor` / `MAX_RUNTIME_TIER`) rather than a historical hard-coded T8 threshold.

Add a browser regression covering a valid T8+ pointer merge.

## Platform / persistence findings

### 13. Local and Yandex safe-storage keys differ
Local adapter uses `brainmerge.save.v1`; Yandex safe storage uses `brainmerge.save.v2`.

If Yandex initialization fails and boot falls back to the Local adapter, the player may read/write a different local slot from the normal Yandex safe copy.

**Target:** one canonical local-safe save key/version namespace behind the adapter boundary, with explicit migration from old keys.

### 14. Cloud/local conflict resolution is not freshness-aware
Yandex load prefers any cloud object over local safe storage. A newer local save can therefore lose to an older cloud snapshot after a failed/deferred write.

Add a canonical save revision or `updatedAt`/monotonic sequence and choose the newest valid snapshot. Never resolve by storage location alone.

### 15. Ad callbacks have no watchdog timeout
Rewarded/interstitial promises resolve only when the SDK invokes close/error callbacks. If the platform never calls back, `adBusy` can remain stuck indefinitely.

Add a bounded watchdog that safely returns unavailable/no-reward and restores gameplay state without granting a reward.

### 16. Local development cannot visually exercise rewarded surfaces
`LocalPlatformAdapter.rewardedAds` is false, so rewarded controls gated directly by capability disappear.

Keep production reward grants capability-gated, but provide an explicit dev/fixture presentation mode for visual/browser testing of rewarded cards and timers.

## Mission Claim audit

### Core state
The current published core implementation is correct:
- claimability is derived from the active mission and cumulative signal;
- claim adds exactly the configured reward;
- mission index advances once;
- an already-claimed mission cannot be claimed again through the same state.

### DOM wiring
Published `GameView` binds `[data-action="claim-mission"]` to `claimMission()`.
The CI reward-state screenshot shows a visible enabled `Claim reward` button.

### Missing regression
The packaged runtime smoke only checks that the button is enabled. It does **not** click it and verify:
- exact coin delta;
- `missionIndex + 1`;
- next mission rendered;
- no duplicate reward;
- behavior inside the recovered current top/sheet/modal composition.

Add this as a real browser test.

### Correction to a previous diagnosis
The `translateX(-50%)` used by the current published Mission button is not inherently wrong: `code-ui.css` intentionally positions that button with `left:50%`. Do not “fix” that transform in isolation. The reported real-device failure must be reproduced against the recovered newer UI and its complete CSS stack.

## Test-system audit

### What is strong
- deterministic core tests are broad;
- packaging integrity checks assets/imports;
- Yandex lifecycle/reward callbacks are unit-tested;
- browser smoke covers multiple viewport classes;
- reduced-motion and touch-target gates exist;
- Campaign persistence/isolation has meaningful coverage.

### What must change
1. Remove obsolete layout assertions.
2. Add product-contract tests for the recovered top navigation/panels.
3. Add Mission Claim click-through regression.
4. Add rewarded-boost activation/expiry/reload tests.
5. Add valid T8–T17 pointer merge regression.
6. Add cloud-vs-local freshness tests.
7. Add rewarded-ad no-callback watchdog test.
8. Add a generated-build parity gate if `build/` remains committed.
9. Add screenshot assertions/checkpoints for the intended desktop/mobile composition.

## `build/` policy
`src/` is authoritative. `build/` is generated.

Committing generated JS while implementation agents also edit TypeScript creates two visible representations of the same logic and encourages accidental edits to the wrong one.

Preferred option: stop committing `build/` and always build in local serve/package/CI.

If repository publication requires committed `build/`, add a CI gate:
1. clean build;
2. `git diff --exit-code -- build/`;
3. fail if generated output differs from the committed snapshot.

Never hand-edit `build/`.

## Recommended module split
Do not split files only by line count. Split by ownership and state boundaries.

### Deterministic core
```text
src/core/game/
  state.ts
  save.ts
  merge.ts
  economy.ts
  missions.ts
  upgrades.ts
  hints.ts

src/core/campaign/
  definitions.ts
  progress.ts
  run-state.ts
  run-board.ts
  run-orders.ts
  world1-config.ts
  presentation.ts
```

### Application/controllers
```text
src/app/
  bootstrap.ts
  game-controller.ts
  lifecycle.ts
  persistence.ts
  platform-controller.ts
```

### Feature UI
```text
src/features/board/
src/features/missions/
src/features/collection/
src/features/brain-lab/
src/features/rewarded/
src/features/campaign/
src/features/prestige/
```

Each feature should expose an explicit mount/update API. Avoid global DOM discovery as the primary integration contract.

### CSS
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

One file/layer owns structural layout for a feature. Presentation layers must not silently re-own position/order/visibility.

## Recovery procedure — mandatory before major implementation
Do **not** force-push or overwrite `main` yet.

On the machine that contains the visually current game:

```bash
git status --short
git branch -vv
git worktree list
git log --graph --decorate --oneline --all -40
git remote -v
```

Then create a recovery branch from exactly that working state:

```bash
git switch -c recovery/local-current-2026-09-01
git add -A
git commit -m "chore: recover current local Brainmerge state"
git push -u origin recovery/local-current-2026-09-01
```

Before committing, inspect secrets/build/cache files and do not add accidental generated/temp content.

After that, compare:
- published `main`;
- `recovery/local-current-2026-09-01`;
- `campaign-world1-data-driven-v1` / PR #5.

Create a reconciliation branch from the recovered current product state. Selectively integrate the useful PR #5 Campaign refactor, then update source tests and screenshots to the intended UI contract.

Only merge to `main` after:
- Collection and Brain Lab are in the approved top-level composition;
- no stale right rail remains unless explicitly required for another feature;
- rewarded boost UI/state is recovered or deliberately rebuilt;
- Mission Claim is click-tested in Chromium/mobile layout;
- full tests/package/smoke pass;
- screenshots match the approved current design.

## Audit status
This audit validates the GitHub repository and the exact CI package produced from published `main`. It cannot validate local files that have never been pushed. Recovering that local state is the next P0 action.