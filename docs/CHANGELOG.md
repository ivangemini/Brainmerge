# Brainmerge — Change Log / Repository State

This file records high-signal repository-state changes. Product contracts live in the dedicated docs.

## 2026-09-01 — Recovery hardening branch / PR #6
Safe fixes that do not depend on the missing newer local UI were isolated on:

`hardening/repository-recovery-2026-09-01`

Draft PR #6 exists only for preservation and CI validation; it must not be merged into stale `main` before product-state reconciliation.

### Hardening completed
- terminal merge-reject FX now derives from `MAX_RUNTIME_TIER` instead of the historical T8 cap;
- packaged regression smoke now executes a real T8→T9 pointer merge and rejects any false max-tier FX;
- packaged regression smoke now clicks Mission Claim and verifies exact reward, mission advance and no duplicate reward;
- Yandex rewarded/interstitial flows now have bounded watchdog recovery when SDK close/error callbacks are lost;
- a confirmed reward event is preserved if only the later close callback is lost;
- asynchronous GameplayAPI rejection clears cached lifecycle state so a later lifecycle signal can retry;
- Local and Yandex now share canonical safe key `brainmerge.save.v2`; Local still reads and dual-writes legacy `brainmerge.save.v1` during recovery migration;
- local save-key migration has dedicated unit coverage;
- committed generated `build/` is now checked against a fresh TypeScript compile in CI;
- packaged release audit now scans CSS in addition to HTML/JS/JSON;
- `smoke:regression` is wired into CI.

### Runtime architecture measurements
The exact packaged PR artifact contains 76 files. Static inspection measured:
- 636 CSS `!important` declarations;
- 7 MutationObserver references;
- 11 direct `.innerHTML =` assignments;
- `.cell` owned by 11 CSS files / 144 selector occurrences;
- Missions structural selectors spread across 9 CSS files;
- Collection across 8;
- Brain Lab across 6;
- right rail across 4.

Largest runtime modules are already large enough to justify ownership-based splitting: CampaignRun ~569 compiled lines, game core ~530, Campaign map ~474, app main ~462, Campaign run UI ~447, GameView ~321, FX ~314.

### Verification
The first PR #6 workflow passed TypeScript/tests, generated-build parity, Yandex packaging, runtime/Campaign/RC/motion/regression/RU/Yandex Chromium smokes and artifact publication. Later commits on the same PR require their own fresh green run before being considered verified.

## 2026-09-01 — Repository audit / recovery mode
A full repository audit found that the published GitHub `main` is **not the latest owner-approved product state**.

### Published baseline audited
`9c2dadbf9be01d424a7ba41447a4a14206524f57`

Its GitHub Actions package is healthy and all configured gates passed, including 96 Node tests and packaged runtime/Campaign/RC/motion/locale/Yandex smokes.

### Critical discovery
Published `main` still renders Collection and Brain Lab in `.right-rail`, and mobile tests/runtime retain the old three-panel mobile-sheet/dock model.

The owner-approved newer product had already moved Collection and Brain Lab to top-level UI. Therefore the GitHub baseline and tests are stale relative to the real product.

### Rewarded boost discovery
Published `main` has rewarded Brain Box support only. The separate timed rewarded-boost/card system described by the owner is not present in canonical source/save state. Any local implementation must be recovered before reimplementation.

### Test-system discovery
Several green tests explicitly assert the old right-rail/mobile composition. They can cause an implementation agent to regress the product while keeping CI green.

### Branch-state discovery
Open PR #5 / `campaign-world1-data-driven-v1` contains significant later Campaign work:
- data-driven World 1 Location run config;
- sequential unlock;
- location-specific Overgrowth/order pressure;
- Toilet Pond coverage;
- generalized Campaign UI work.

It is unmerged and diverged from the current published branch. Preserve/reconcile it after the actual current local product branch is recovered.

### Confirmed technical findings
- full `#app` DOM is rebuilt on normal renders, including passive income updates;
- several MutationObservers compensate for destructive DOM replacement;
- CSS structural ownership is spread across many files with extensive `!important` overrides;
- dead 4×2/first-eight atlas rules remain below the current 6×3 atlas layer;
- valid T8–T17 pointer merges can receive historical max-tier reject FX;
- Local and Yandex fallback safe-storage keys differ;
- cloud/local load is not freshness-aware;
- ad SDK calls have no watchdog timeout;
- Mission Claim core/wiring is correct in published main, but browser smoke does not click and verify the transaction;
- committed generated `build/` needs an enforced source/output parity policy.

### Documentation action
Created `docs/REPOSITORY_AUDIT_2026-09-01.md` and moved project documentation to recovery-first status on branch:

`audit/repository-recovery-2026-09-01`

Published `main` is intentionally not force-rewritten during recovery.

## 2026-09-01 — Current build publication
### Compared revisions
- previous gameplay GitHub baseline: `429b2b16054516123653ffcbc1fe4c4fa786e8a1` — `feat: complete Sneaker Garden Restore and Mastery`;
- published build baseline: `d5a2b291b59a781c28bff4fb642ab89488693348` — `chore: publish current game build`.

The publication revision was one commit ahead of the gameplay baseline.

### Exact repository delta
18 files changed: 3,181 additions / 3 deletions.

Added:
- `.gitignore`;
- `package-lock.json`;
- generated compiled runtime under `build/`.

Modified:
- `README.md` run instructions;
- `package.json` so `serve` rebuilds before the HTTP server starts.

### Interpretation
There were no new `src/` gameplay changes between `429b2b1` and `d5a2b2`. The large addition count primarily published generated build output and repository infrastructure.

### Gameplay already present
The source already contained:
- save v6 and v1-v5 migration;
- permanent Campaign/meta fields;
- isolated resumable CampaignRunState;
- full Sneaker Garden Stabilize/Deliver/Restore/Mastery;
- Giant Sneaker Flower Bed Lv1-Lv3;
- Campaign Supply Landmark perk;
- 100% Sneaker Garden completion;
- Campaign/main-board isolation.

## 2026-09-01 — Documentation synchronization
The first documentation sync corrected stale claims such as save v5, CampaignRunState being only planned and Sneaker Garden being incomplete.

The later repository audit supersedes the assumption that this synchronized `main` represents the latest product UI. From this point, documentation must distinguish:
- published baseline;
- recovered current product state;
- unmerged feature branches.

## Recovery rule for future entries
Until reconciliation is complete, every meaningful change log entry should identify which line it belongs to:
- `main`;
- recovery/reconciliation branch;
- feature PR branch.

Do not describe branch-only or local-only work as shipped/current `main`.
