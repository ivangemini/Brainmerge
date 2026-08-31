# Brainmerge

Brainrot-themed browser merge-idle game for Yandex Games and additional web portals.

## Product direction
The playable core is a 6×5 merge board with one canonical T1→T18 character chain, passive production, Brain Box economy, Brain Lab upgrades, missions, Collection, offline income and platform-safe persistence.

The long-term product layer is now:
- **Collection Rewards** — permanent rewards for discovery milestones;
- **Prestige / Brain Reset** — T18 resets into permanent Brain Cells/meta upgrades;
- **Brainverse Campaign** — 8 worlds built from **7 persistent Locations + 1 persistent World Raid per world**.

Each Campaign Location progresses through **Stabilize → Deliver Orders → Restore Landmark → Mastery**. World Progress, landmark restoration and Raid progress persist between sessions and survive Prestige. The old 64 short-stage / star model is obsolete.

See `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Run locally

```bash
npm run build
npm run serve
```

Open `http://localhost:4173`.

## Verify

```bash
npm test
```

Production packaging / browser smoke is also exercised by CI.

## Current playable slice
- 6×5 responsive board;
- canonical T1→T18 merge chain;
- unified physical 6×3 character atlas for board + Collection;
- passive coin production and production-positive merges;
- escalating paid Brain Box + optional rewarded Box;
- Brain Lab upgrades;
- first-cycle missions, Collection, offline reward, `Next move`, Rescue;
- EN/RU localization with parity validation;
- local/Yandex save through the platform-adapter boundary;
- board-first mobile layout with Missions / Collection / Brain Lab modal dock;
- production Missions / Collection / Rewards / Brain Lab icon set;
- responsive Campaign map with World 1/2 art, connected route, seven Location nodes, World Raid node, World restoration summary and Location/Raid overview surfaces;
- Campaign core domain model for Location phases, World Progress and Raid gating;
- desktop/compact/mobile Chromium QA in CI.

## Source-of-truth docs
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/PLATFORM_AND_LOCALIZATION.md`
