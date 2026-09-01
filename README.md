# Brainmerge

Brainrot-themed browser merge-idle game targeting Yandex Games and additional web portals.

## Repository status — recovery in progress
As of 2026-09-01, the published GitHub `main` is internally buildable/tested but **does not represent the latest owner-approved product layout**.

Known mismatch:
- published `main` still renders Collection and Brain Lab in a permanent right rail;
- the newer intended product moved those systems to top-level UI;
- rewarded-ad boost work described by the owner is not present in published `main`;
- a separate data-driven World 1 Campaign refactor remains unmerged in PR #5.

Do not use old layout tests as authority for new UI work. See `docs/REPOSITORY_AUDIT_2026-09-01.md` before making structural changes.

## Published baseline
The pre-audit published baseline is:

`9c2dadbf9be01d424a7ba41447a4a14206524f57`

Its CI passed 96 Node tests plus packaged runtime, Campaign, RC/accessibility, motion, locale and Yandex browser smokes. Those gates validate that baseline only.

## Current stable gameplay contracts
The published baseline contains:
- 6×5 main merge board;
- one canonical T1→T18 character chain;
- passive production and explicit offline collection;
- paid Brain Box plus rewarded Brain Box on supported portals;
- four Brain Lab upgrades;
- first-cycle mission journey;
- Collection discovery state;
- deadlock Rescue and Next Move guidance;
- canonical save v6 with v1-v5 migration;
- local/Yandex persistence adapters;
- permanent Campaign progress plus isolated resumable `CampaignRunState`;
- complete Sneaker Garden Stabilize → Deliver → Restore → Mastery slice.

Collection Reward transactions, Prestige reset/spend transactions and the newer rewarded-boost system are not complete in published `main`.

## Campaign state
Published `main` has a full Sneaker Garden vertical slice.

PR #5 / `campaign-world1-data-driven-v1` contains later unmerged work that generalizes World 1 Locations and adds Toilet Pond coverage. Reconcile that branch after the true current local product state is recovered; do not recreate it from scratch.

## Source-of-truth policy
- `src/` — authoritative TypeScript gameplay/application source.
- `public/` — browser presentation/runtime helpers and assets.
- `locales/` — EN/RU production copy.
- `tests/` and `scripts/` — deterministic and packaged/browser gates.
- `docs/` — product/architecture contracts.
- `build/` — generated JavaScript output only.

Never hand-edit `build/`. If it remains committed, CI should enforce that a clean TypeScript build produces no `build/` diff.

## Install / run
Requires Node.js 20+.

```bash
npm install
npm run serve
```

Open `http://localhost:4173`.

`npm run serve` rebuilds before serving.

## Verification
Core tests:

```bash
npm test
```

Useful packaged/browser gates:

```bash
npm run package
npm run package:yandex
npm run smoke:runtime
npm run smoke:campaign
npm run smoke:campaign:final
npm run smoke:rc
npm run smoke:motion
npm run smoke:locale
npm run smoke:yandex
```

Do not claim a gate passed unless it was actually executed successfully on the revision being discussed.

## Recovery workflow
Before more structural UI work, push the actual local current game to a dedicated recovery branch, for example:

```bash
git status --short
git branch -vv
git worktree list
git log --graph --decorate --oneline --all -40

git switch -c recovery/local-current-2026-09-01
git add -A
git commit -m "chore: recover current local Brainmerge state"
git push -u origin recovery/local-current-2026-09-01
```

Do not force-push `main` during recovery.

Then compare:
1. published `main`;
2. the recovered current local branch;
3. PR #5 / `campaign-world1-data-driven-v1`.

## Refactor direction
The project has reached the point where structural decomposition is justified. Split by ownership, not arbitrary line count:
- `src/core/game/*` for deterministic merge/economy/missions/upgrades/save logic;
- `src/core/campaign/*` for Campaign definitions/progress/run board/orders/presentation;
- `src/app/*` for bootstrap/lifecycle/persistence/platform coordination;
- `src/features/*` for Board, Missions, Collection, Brain Lab, Rewarded, Campaign and Prestige UI/controllers;
- a consolidated style tree with one structural owner per feature.

The main UI should move away from rebuilding the entire `#app` DOM on passive ticks and away from MutationObserver-driven component recovery.

## Documentation
Start with:
- `docs/REPOSITORY_AUDIT_2026-09-01.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/PLATFORM_AND_LOCALIZATION.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/CHANGELOG.md`

`production/session-state/active.md` records the current implementation-agent objective.