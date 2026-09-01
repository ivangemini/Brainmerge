# Brainmerge Repository Audit — 2026-09-01

## Executive status
The audit found that the repository had stopped representing one coherent product state. There are three independent lines that must not be conflated:

1. **published `main`** — internally consistent, packaged and tested, but stale relative to the owner-approved UI;
2. **open Campaign PR #5 / `campaign-world1-data-driven-v1`** — useful later World 1 generalization that is not merged;
3. **the newer local product state** — Collection and Brain Lab moved to top-level UI and additional rewarded-ad boost work described by the owner, but not present in any GitHub branch inspected.

The GitHub-side recovery/hardening work is isolated on draft PR #6 / `hardening/repository-recovery-2026-09-01`. It fixes defects that are independent of the missing newer UI and must remain separate from `main` until the real local product state is recovered.

## Verified hardening follow-up — PR #6
Current hardening head validated by GitHub Actions:

`129a12103292bcfd99ef12138afd7553f77ac7c9`

Workflow `Brainmerge CI` run 381 completed successfully for that head.

Verified fixes/gates on the recovery line:
- valid T8→T9 through T17→T18 pointer merges no longer receive historical max-tier reject FX; terminal state is derived from `MAX_RUNTIME_TIER`;
- packaged Chromium regression performs a real T8→T9 pointer merge and asserts that no reject FX is emitted;
- packaged Chromium regression clicks Mission Claim and verifies exact reward delta, one mission advance and no duplicate reward;
- Yandex rewarded/fullscreen ads have a bounded 30-second watchdog so a lost SDK close/error callback cannot leave the caller waiting forever;
- a confirmed `onRewarded` event remains valid if the later close callback is the callback that is lost;
- asynchronous GameplayAPI rejection clears the cached lifecycle state and permits a later retry;
- Local and Yandex use the same canonical safe key `brainmerge.save.v2`;
- Local reads legacy `brainmerge.save.v1` when needed and dual-writes v2/v1 during the recovery migration window;
- Local save migration has dedicated unit coverage;
- committed generated `build/` must match a fresh TypeScript compile in CI;
- packaged release audit scans CSS as well as HTML/JS/JSON;
- the new recovery regression browser smoke is part of CI.

These fixes do **not** make published `main` the current product design. PR #6 intentionally leaves the obsolete right-rail composition untouched so it does not invent or overwrite the missing newer local UI.

## Published baseline audited
Published `main` before recovery work:

`9c2dadbf9be01d424a7ba41447a4a14206524f57`

That baseline passed its configured Node/package/Chromium/Yandex/Campaign gates. Green CI proves internal consistency of that baseline, not product freshness.

## P0 — repository/product state split

### 1. Published main still contains the obsolete right rail
`src/ui/game-view.ts` on published `main` renders:
- Missions on the left;
- Merge Board in the center;
- Collection and Brain Lab inside `.right-rail`.

The owner-approved newer composition moved Collection and Brain Lab to top-level UI. No GitHub branch inspected contains that newer composition.

**Conclusion:** do not rebuild the product from `main` screenshots or old layout tests.

### 2. Tests encode the old composition
Existing tests in the published line explicitly expect:
- desktop Collection/Brain Lab cards in the right rail;
- compact right-rail cards in a row;
- phone Missions / Collection / Brain Lab through the old three-button mobile dock/sheet model;
- `.right-rail` to remain part of responsive composition.

An implementation agent can therefore regress the intended UI while making CI greener.

**Required after local recovery:** replace those assertions with tests for the actual top-level Collection/Brain Lab contract and approved mobile composition.

### 3. Timed rewarded boosts are absent from GitHub
Published `main` contains rewarded Brain Box support only. The owner-described timed boost/card system is not present in canonical source/save state or any inspected GitHub branch.

Missing GitHub-side pieces include:
- canonical boost expiry state;
- x2 timed income/click transaction;
- dedicated boost presentation states;
- remaining-time UI.

If that implementation exists on the Mac, recover it before re-specifying it.

### 4. Significant Campaign work is stranded in PR #5
Open PR #5 / `campaign-world1-data-driven-v1` contains:
- data-driven World 1 Location run configuration;
- sequential Location unlock after the previous Restore milestone;
- location-specific Overgrowth pressure;
- location-specific order tier ranges;
- Toilet Pond persistence/isolation coverage;
- generalized World 1 run presentation work.

The PR changes `src/core/campaign-run.ts` into a compatibility barrel over `world1-campaign-run.ts` and adds generalized World 1 runtime UI/lock helpers.

**Rule:** preserve it, but do not blindly merge it into stale `main`. Reconcile it onto the recovered current product branch together with verified PR #6 hardening.

## Architecture measurements from the exact packaged runtime
A CI-built Yandex artifact from the hardening line was downloaded and inspected directly.

Package inventory:
- 76 runtime files;
- 22 CSS stylesheets loaded by `index.html`;
- 636 `!important` declarations;
- 7 MutationObserver references;
- 11 direct `.innerHTML =` assignments.

Largest runtime code modules:
- `build/core/campaign-run.js` — ~24.9 KB / 569 lines;
- `public/campaign-map.js` — ~22.0 KB / 474 lines;
- `build/ui/game-view.js` — ~21.0 KB / 321 lines;
- `build/core/game.js` — ~21.0 KB / 530 lines;
- `build/main.js` — ~18.7 KB / 462 lines;
- `public/campaign-run-ui.js` — ~17.8 KB / 447 lines;
- `build/feedback/visual-effects.js` — ~14.5 KB / 314 lines.

Cross-file CSS ownership:
- `.cell` — 11 CSS files / 144 selector occurrences;
- `.game-shell` — 8 files;
- `.board-header` — 8 files;
- `.side-card--mission` — 9 files;
- `.side-card--collection` — 8 files;
- `.side-card--lab` — 6 files;
- `.right-rail` — 4 files.

Largest `!important` contributors include `code-ui.css`, `ui-icon-pass.css`, `mobile-runtime.css`, `standalone-character-art.css`, `game-feel-advanced.css` and `chain-polish.css`.

**Conclusion:** files should be split and CSS consolidated, but by ownership boundaries rather than arbitrary line count.

## P1 — rendering/lifecycle risks

### 5. The primary view destroys the full app tree
`GameView.render()` replaces `#app.innerHTML` and rebinds controls. `main.ts` invokes rendering for normal gameplay and for passive-income presentation updates.

Consequences:
- focus/DOM identity can be lost;
- pointer capture and drag can race a timed render;
- panel/sheet scroll state can reset;
- external DOM enhancers must rediscover nodes;
- unrelated state updates can disturb active UI controls.

This architecture becomes increasingly risky for Missions, modals, Campaign, top-level Collection/Brain Lab and timed rewarded boosts.

**Target:** mount stable feature roots once and update only changed state/classes/text/subtrees. Passive income must not recreate the board and all panels.

### 6. MutationObservers are acting as lifecycle glue
Campaign map, Campaign run UI, mobile sheets and visual FX use global observers partly because the main view continually recreates DOM.

Observers are valid for genuinely external changes, but they should not be the ordinary component mount/update mechanism.

### 7. CSS ownership is fragmented
Twenty-two CSS files form an override stack, and later layers frequently rely on `!important` to win against earlier assumptions.

This makes layout migration fragile: Collection can be moved in one layer while old mobile/runtime/economy CSS still repositions a legacy node.

**Target:** one structural owner per feature plus one responsive composition owner. Motion/art layers must not silently own position/order/visibility.

### 8. Legacy atlas rules remain under the current atlas
Older first-eight / 4×2 character routing remains in CSS while later `standalone-character-art.css` establishes the production 6×3 T1–T18 atlas using higher specificity/`!important`.

The final output currently works, but this is dead compatibility debt and should be removed after recovered-UI screenshot parity is frozen.

## Confirmed gameplay/feedback defect — fixed on PR #6
### 9. High-tier false reject FX
Published feedback code treated same-family `sourceTier >= 8` as a max-tier reject even though the actual terminal tier is T18.

Result: valid T8→T9 through T17→T18 pointer merges could visually reject while the deterministic core accepted the merge.

PR #6 derives terminal state from `MAX_RUNTIME_TIER` and includes a real browser regression.

## Mission Claim audit — transaction now browser-tested
Core Mission Claim on the published line was already correct:
- claimability comes from active mission progress;
- reward is added exactly once;
- mission cursor advances once;
- a claimed mission cannot be immediately claimed again through the same state.

DOM wiring was also present. The gap was test coverage: old browser smoke only checked that the button was enabled.

PR #6 now physically clicks Claim Reward and verifies:
- exact +80 fixture reward;
- `missionIndex` advances from 0 to 1;
- next incomplete mission is not claimable;
- rerender/FX does not duplicate the reward.

The previously suspected `translateX(-50%)` is not inherently a bug in published `main`: that button is intentionally centered from `left:50%`. Any real-device failure in the newer UI must be reproduced against the recovered current CSS stack.

## Platform/persistence audit

### 10. Safe-storage key split — hardened on PR #6
Published Local used `brainmerge.save.v1` while Yandex safe storage used `brainmerge.save.v2`.

PR #6 introduces shared key ownership:
- canonical: `brainmerge.save.v2`;
- Local fallback reads legacy v1;
- Local dual-writes v2/v1 during migration;
- Yandex consumes the shared canonical constant.

This removes the immediate fallback-to-unrelated-slot risk while preserving old local progress.

### 11. Cloud/local freshness arbitration — still unresolved
Yandex still prefers any cloud object over local safe storage. A newer safe-local snapshot may therefore lose to older cloud state after a failed/delayed cloud write.

**Target after local recovery:** add validated snapshot freshness metadata, preferably monotonic `revision` plus diagnostic `updatedAt`; sanitize both candidates; select the newest valid one; reconcile both stores.

Do not trust arbitrary unsanitized client timestamps as the sole conflict signal.

### 12. Lost ad callback — hardened on PR #6
Published ad promises depended entirely on SDK callbacks and could leave `adBusy`/gameplay waiting indefinitely.

PR #6 adds a bounded watchdog and tests normal close/error, no callbacks and confirmed reward followed by lost close.

### 13. Async GameplayAPI rejection — hardened on PR #6
Published lifecycle code recovered from synchronous throws only. A rejected promise could leave cached lifecycle state incorrect and emit an unhandled rejection.

PR #6 catches asynchronous rejection, clears the matching cached state and allows a later lifecycle signal to retry.

### 14. Controller-level rewarded cleanup should still use `try/finally`
`main.ts` currently performs `adBusy = true` → await platform ad → `adBusy = false` without a generic `try/finally` boundary.

The hardened Yandex adapter contains its own error/watchdog containment, but future adapters should not be able to strand application-level busy state. Move this guarantee into the application/platform controller during the architecture split.

### 15. Local rewarded UI cannot be visually exercised in production Local mode
`LocalPlatformAdapter.rewardedAds` is false, which correctly prevents fake production rewards but also hides capability-gated rewarded surfaces during local visual QA.

Add a clearly separated fixture/dev presentation mode after the current rewarded UI is recovered.

## Campaign audit

### 16. Published runnable Campaign remains Sneaker-Garden-specific
The typed Campaign model defines Worlds 1–2 and seven Locations per world, but the runnable published engine/UI targets only World 1 / Sneaker Garden.

PR #5 is the correct starting point for World 1 data-driving, subject to reconciliation.

### 17. Domain data is duplicated in presentation JavaScript
`src/core/campaign.ts` owns typed world/location definitions while `public/campaign-map.js` repeats stable IDs, copy keys, asset paths and map coordinates.

Coordinates/art may remain presentation-owned, but stable domain IDs/progression semantics should originate from one typed definition/snapshot.

### 18. Published Campaign run detail has localized-text identity coupling
`public/campaign-run-ui.js` contains fallback selection logic that compares the rendered detail title to localized `w1Location1Name`.

Stable application identity must use `data-location-id` / typed IDs, never visible translated text.

### 19. Campaign progress sanitization does not fully canonicalize phase ordering
Individual phase values are clamped, but malformed/tampered progress can contain later-phase progress while an earlier phase is incomplete. Normal transactional APIs enforce progression order, but the canonical sanitizer should eventually decide whether to normalize or reject impossible phase combinations.

Do this deliberately with migration tests; do not silently rewrite current saves during unrelated recovery work.

### 20. Published core does not enforce sequential Location unlock globally
The published phase-advance API validates world unlock and phase order but not previous-Location completion. Because published runnable UI only exposes Sneaker Garden, current user-facing impact is bounded. PR #5 adds sequential World 1 run unlock logic and should inform the final rule.

## Additional lower-priority findings
- Campaign dialogs use `role="dialog"`/`aria-modal` and initial focus/escape handling, but a complete focus trap/background-inert contract is not obvious; verify after UI recovery.
- Campaign locale refresh can recreate the open overlay, potentially losing nested detail/focus state.
- `AudioFeedback` appends its toggle to `<body>` while one press-FX listener is rooted at `#app`, so the audio control does not necessarily receive the same press class as in-app controls.
- locale loading caches completed dictionaries but not an explicit in-flight promise; duplicate concurrent fetches are possible in edge cases.
- dynamic Yandex SDK loading has no explicit script-load watchdog in the factory path; evaluate whether the portal loader contract makes this necessary.

## Generated build policy — enforced on PR #6
`src/` is authoritative and `build/` is generated.

While generated JS remains committed, CI now runs a TypeScript build and then:

```bash
git diff --exit-code -- build/
```

Any source/output drift fails CI. Long term, remove committed `build/` if publication requirements allow it.

## Target module split
Split by responsibility, preserving compatibility exports during migration.

### Deterministic game core
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

Suggested extraction order: save → missions → economy → upgrades → merge → hints.

### Campaign core
```text
src/core/campaign/
  definitions.ts
  progress.ts
  save.ts
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
  event-types.ts
```

Suggested extraction order: lifecycle/persistence → platform/rewarded → Campaign bridge → game transitions → FX orchestration.

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

Each feature should mount a stable root and expose explicit update behavior.

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

Migrate one feature at a time against frozen screenshots. Track `!important` count as a decreasing architecture metric; an unexplained increase is a regression signal.

## Test-system changes required after current UI recovery
Keep the strong deterministic/package checks, then replace stale layout contracts and add current-product coverage:
1. top-level Collection/Brain Lab desktop composition;
2. approved mobile composition without restoring old right rail/dock semantics;
3. recovered timed rewarded-boost activation/reload/expiry using absolute expiry time;
4. local-vs-cloud freshness conflict matrix;
5. Campaign generalized Location launch/persistence after integrating PR #5;
6. Campaign identity based on stable IDs;
7. keyboard/touch/focus behavior in the recovered UI;
8. screenshot checkpoints for intended desktop/mobile states.

PR #6 already covers Mission Claim transaction, valid high-tier pointer merge, ad watchdog, async GameplayAPI retry, save-key migration and build parity.

## Mandatory reconciliation sequence
1. Keep PR #6 draft and green; do not merge it into stale `main`.
2. Recover the exact visually current Mac working state to a dedicated GitHub branch without resetting it from `main`.
3. Compare recovered state vs `main` vs PR #5 vs PR #6.
4. Create reconciliation branch **from the recovered product state**.
5. Replace obsolete right-rail/mobile-dock tests with the actual product contract.
6. Integrate verified, UI-independent PR #6 hardening.
7. Selectively integrate PR #5 data-driven Campaign work.
8. Freeze screenshot baselines for the approved current UI.
9. Perform ownership-based TS/CSS refactor incrementally with behavior-preserving gates.
10. Merge to `main` only when GitHub represents the actual current game exactly.

## Hard boundary of this audit
The GitHub repository, all inspected branches/PRs and exact CI artifacts have been audited. Files that exist only on the user's Mac and have never been pushed are not remotely accessible and cannot be reconstructed faithfully from GitHub history.

That local state is the only remaining P0 source needed before the actual product UI can be reconciled. Until then, recovery work must preserve rather than overwrite the published branch.