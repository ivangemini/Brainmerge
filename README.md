# Brainmerge

Brainrot-themed browser merge-idle game for Yandex Games and additional web portals.

## Current product state
The playable core is a 6×5 merge board with one canonical T1→T18 character chain, passive production, Brain Box economy, Brain Lab upgrades, missions, Collection, offline income and platform-safe persistence.

The long-term product layer is:
- **Collection Rewards** — permanent milestone rewards; save-v6 claim storage exists, claim transactions/UI are still pending;
- **Prestige / Brain Reset** — permanent-meta fields exist in save v6; the actual reset/reward transaction is still pending;
- **Brainverse Campaign** — target structure is 8 worlds × (7 persistent Locations + 1 persistent World Raid).

Each Campaign Location uses **Stabilize → Deliver Orders → Restore Landmark → Mastery**. World Progress, Landmark restoration and Raid state are permanent Campaign data. The old 64 short-stage / 3-star model is obsolete.

### Current playable Campaign slice
World 1 / Location 1 — **Sneaker Garden** is playable end-to-end on an isolated Campaign board:
- Stabilize: six Overgrowth blockers, four starting T1 units, merge pulses clear blockers;
- Deliver: four deterministic orders, reference max-T4 queue `T2, T2, T3, T4`;
- Restore: six orders in three atomic two-order batches, restoring Giant Sneaker Flower Bed Lv1→Lv3;
- Mastery: three final orders, reference max-T4 queue `T3, T4, T4`, with five non-clearing Overgrowth cells;
- Landmark perk: stronger Campaign Supply chance rises from 25% baseline to 40% at Lv3;
- active CampaignRunState resumes from canonical save v6 and never aliases the main board.

See `docs/CAMPAIGN_AND_META_PROGRESSION.md` and `docs/ROADMAP.md`.

## Repository/runtime layout
- `src/` — authoritative TypeScript source.
- `build/` — compiled ES-module output produced by `tsc`; currently committed so the published repository contains a runnable current build.
- `public/` — runtime presentation, Campaign UI, assets and browser-side shells.
- `locales/` — EN/RU production locale resources.
- `tests/` + `scripts/` — deterministic tests, packaging checks and Chromium smoke flows.
- `docs/` — product/architecture/art/platform source-of-truth documentation.

**Source of truth for behavior is `src/`, not generated `build/`.** Rebuild after TypeScript changes.

## Install / run locally
Requires Node.js 20+.

```bash
npm install
npm run serve
```

`npm run serve` runs the TypeScript/localization build first, then serves the repository on port 4173.

Open `http://localhost:4173`.

## Verify

```bash
npm test
```

Useful additional gates:

```bash
npm run smoke:runtime
npm run smoke:campaign
npm run smoke:campaign:final
npm run package
npm run package:yandex
```

Do not claim a gate passed unless it was actually run successfully.

## Current implementation baseline
- canonical save **v6**, including migration from v1-v5;
- local + Yandex persistence behind `PlatformAdapter`;
- canonical T1→T18 merge chain and unified 6×3 character atlas;
- passive coin production, paid/rewarded Brain Box and Brain Lab;
- first-cycle missions, Collection, offline reward, `Next move`, Rescue;
- EN/RU localization parity checks;
- board-first mobile layout with Missions / Collection / Brain Lab modal dock;
- responsive Campaign map for Worlds 1–2 with seven Location nodes + World Raid node;
- Campaign core domain model, permanent Location/Landmark/Raid state and save-driven presentation snapshots;
- isolated resumable CampaignRunState;
- complete four-phase Sneaker Garden vertical slice;
- browser/runtime/package/Yandex smoke infrastructure.

## Source-of-truth docs
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/PLATFORM_AND_LOCALIZATION.md`
- `docs/CHANGELOG.md`

`production/session-state/active.md` is the persistent working-context snapshot for implementation agents.
