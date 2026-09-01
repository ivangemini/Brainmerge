# Active Session — Brainmerge

## Current objective
Brainmerge is in post-RC retention/meta development. The long-term product objective is **Brainverse world restoration**, not a ladder of short Campaign stages.

Each Campaign world contains:
- 7 persistent Locations;
- 1 persistent multi-phase World Raid;
- a World Restored percentage;
- Location Landmarks;
- four Location phases: Stabilize → Deliver Orders → Restore Landmark → Mastery.

The validated T1→T18 merge-idle board remains the primary account-growth loop.

## Current repository baseline
Published game-build baseline before the documentation sync:
`d5a2b291b59a781c28bff4fb642ab89488693348` — `chore: publish current game build`.

Documentation sync commit:
`c065523d614147ad3ac4ebd6a872a5261ebc0ac7` — `docs: sync documentation with current v6 campaign runtime`.

The publication commit added the generated `build/`, `package-lock.json`, `.gitignore`, and rebuild-before-serve behavior. It did not change `src/` gameplay relative to `429b2b1`.

Authoritative behavior remains in TypeScript `src/`; `build/` is generated ES-module output.

## Current production baseline
- browser-first TypeScript runtime;
- 6×5 main merge board;
- one sequential T1→T18 chain;
- passive income, Brain Box economy, Brain Lab, missions, offline reward, Collection, Rescue and `Next move`;
- canonical save v6 with local/Yandex persistence and v1-v5 migration;
- permanent Campaign Location/Landmark/Raid progress in save v6;
- resumable isolated `CampaignRunState` in the same canonical save;
- permanent Collection/Prestige metadata slots in save v6;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU runtime architecture/parity tooling;
- browser/motion/accessibility/package/Yandex QA infrastructure.

## Implemented Campaign foundation
- `src/core/campaign.ts` owns persistent Campaign domain semantics;
- first two production worlds define seven stable Location ids each;
- pure Location/World restoration calculations;
- restored-Landmark counting;
- Raid gate and next-world unlock derivation;
- Campaign map reads canonical save-v6 presentation snapshots;
- World Restored / Landmarks / Raid-gate summary;
- Location overview with four persistent phases and Landmark;
- Raid overview shell with three persistent phases;
- EN/RU Campaign resources;
- active CampaignRunState persists/resumes through canonical save v6.

## First complete Campaign Location — Sneaker Garden
World 1 / Location 1 is playable end-to-end on one isolated 6×5 Campaign board.

### Stabilize — 20%
- six Overgrowth cells start blocked;
- four T1 Campaign units provide the initial merge state;
- free Campaign Supply never spends main-board coins or paid Brain Box inflation;
- supply tiers are capped by lifetime discovery;
- each successful merge clears exactly one nearest Overgrowth blocker;
- six clearing pulses commit Stabilize exactly once.

### Deliver Orders — +25%
- deterministic four-order queue, reference max-T4: `T2, T2, T3, T4`;
- delivery consumes only the matching Campaign-board unit;
- each order commits one quarter of Deliver exactly once;
- partial order cursor survives exit/reload;
- completing all four raises Sneaker Garden to 45%.

### Restore Landmark — +45%
- six restoration orders in three atomic two-order batches;
- reference max-T4: `T2, T2, T3, T3, T4, T4`;
- batches map to Giant Sneaker Flower Bed Lv1, Lv2 and Lv3;
- stronger Campaign Supply chance is 25% base + 5 percentage points per level, reaching 40% at Lv3;
- completing all three levels raises Sneaker Garden to 90%.

### Mastery — +10%
- reference max-T4 queue: `T3, T4, T4`;
- five Overgrowth cells remain blocked and merge pulses do not clear them;
- Landmark Supply bonus remains active;
- completion commits the final 10% and reaches 100%.

### Isolation / persistence contract
- Campaign board never aliases or consumes main-board cells;
- Campaign actions do not change main-board coins, XP, main merge count or paid Brain Box inflation;
- active Stabilize/Deliver/Restore/Mastery runs persist in save v6 and resume after reload;
- completed temporary run state can be acknowledged without erasing permanent Location progress.

## Meta implementation status
Storage/foundation exists:
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- Campaign progress and active Campaign run.

Still pending:
- actual Collection Reward claim transaction/UI;
- Prestige unlock/reset/reward transaction;
- Brain Cell spend tree;
- gameplay proof that Campaign progress survives the implemented Prestige transaction.

## Next implementation sequence
1. Generalize Sneaker Garden into data-driven World 1 Location configs.
2. Implement Toilet Pond on the shared engine.
3. Implement Watermelon Grill, Hose Tunnels, Gnome Yard, Mushroom Field and Backyard Core.
4. Build persistent three-phase World 1 Raid on the same isolated Campaign state boundary.
5. Implement Collection Rewards + Prestige transactions using the existing save-v6 meta fields.
6. Implement World 2 Traffic Lock + seven Locations + Raid.

## Documentation status
Documentation was synchronized with the current code/runtime state on 2026-09-01. `docs/CHANGELOG.md` records the exact `429b2b1 → d5a2b2` repository delta and explains that the publication commit contains infrastructure/generated-build changes rather than new gameplay source changes.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/PLATFORM_AND_LOCALIZATION.md`
- `docs/CHANGELOG.md`
