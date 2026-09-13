# Brainmerge — Change Log / Repository State

This file records high-signal repository-state changes for implementation agents. Product contracts remain authoritative in the dedicated source-of-truth docs.

## 2026-09-01 — Current build publication

### Compared revisions
- previous GitHub baseline: `429b2b16054516123653ffcbc1fe4c4fa786e8a1` — `feat: complete Sneaker Garden Restore and Mastery`;
- published build baseline: `d5a2b291b59a781c28bff4fb642ab89488693348` — `chore: publish current game build`.

The second revision is exactly **1 commit ahead** of the first.

### Exact repository delta
18 files changed: **3,181 additions / 3 deletions**.

Added:
- `.gitignore`;
- `package-lock.json`;
- generated compiled runtime under `build/`:
  - `build/core/campaign-run.js`
  - `build/core/campaign.js`
  - `build/core/catalog.js`
  - `build/core/game.js`
  - `build/core/types.js`
  - `build/feedback/audio-feedback.js`
  - `build/feedback/visual-effects.js`
  - `build/i18n/i18n.js`
  - `build/main.js`
  - `build/platform/adapter.js`
  - `build/platform/factory.js`
  - `build/platform/local.js`
  - `build/platform/yandex.js`
  - `build/ui/game-view.js`

Modified:
- `README.md` — local run instructions now rely on `npm run serve` rebuilding automatically;
- `package.json` — `serve` changed from a plain Python HTTP server to `npm run build && python3 -m http.server 4173`.

`.gitignore` now excludes:
- `node_modules/`;
- `dist/`;
- `runtime-artifacts/`;
- `.DS_Store`.

### Important interpretation
There were **no `src/` gameplay changes** between `429b2b1` and `d5a2b2`.

The visible game logic in the generated `build/` files is the compiled form of TypeScript source that was already present in the previous GitHub baseline. Therefore this publication commit primarily made the repository more self-contained/reproducible; it did not add a new gameplay feature after Sneaker Garden Restore/Mastery.

### Gameplay state already present at both revisions
The source already included:
- canonical save v6;
- permanent Campaign/meta fields and v1-v5 migration;
- isolated resumable `CampaignRunState`;
- full Sneaker Garden Stabilize/Deliver/Restore/Mastery flow;
- Giant Sneaker Flower Bed Lv1-Lv3 restoration;
- Campaign Supply Landmark perk (25% base → 40% at Lv3);
- Mastery completion to 100%;
- Campaign/main-board isolation and relevant deterministic/browser coverage.

## 2026-09-01 — Documentation synchronization
The documentation was audited against current `main` because several files still described older architecture.

Corrected stale statements include:
- save schema is **v6**, not v5;
- `CampaignRunState` is implemented/resumable, not merely planned;
- Sneaker Garden is playable through all four phases, not a future vertical slice;
- Campaign map/progress is save-driven rather than presentation-only defaults;
- Collection/Prestige persistent fields exist, while their actual claim/reset/spend transactions remain pending;
- `build/` is generated output from authoritative `src/` and is currently committed;
- `npm run serve` rebuilds before serving.

When evaluating future changes, compare source (`src/`, `public/`, `locales/`, save contracts) first. Generated `build/` churn alone is not evidence of new gameplay behavior.
