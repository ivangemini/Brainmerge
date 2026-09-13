# Active Session — Brainmerge

## Current objective
Brainmerge is in post-RC retention/meta development. The long-term product objective is **Brainverse world restoration**, not a ladder of short Campaign stages.

Each Campaign world contains:
- 7 persistent Locations;
- 1 persistent multi-phase World Raid;
- a World Restored percentage;
- Location landmarks;
- four Location phases: Stabilize -> Deliver Orders -> Restore Landmark -> Mastery.

## Normalized full build pass — 2026-09-13

Working branch: `codex/normalized-full-build-20260913`, based on recovery commit `ca39fb2`. The recovery branch and all historical branches remain untouched.

- Recovery remains canonical for save v10, Raid, retention, analytics, combo/Fever and visitor state.
- The unique audio layer from `codex/world1-location-completion` is now adapted to the current runtime: five tracks, gesture unlock, fade, visibility/ad pause, independent Music/SFX settings under `brainmerge.audio.v1`, and `brainmerge:music-request` routing.
- Rewarded ad boosts are restored as additive save-v10 state with safe defaults: Coin Boost, Golden Brain Box cooldown/queue, Mutation Charge and Free Upgrade daily limit.
- Current typed Campaign/Raid engines now cover all seven World 1 layouts, World 2 Traffic Lock supply lanes, World 2 Location runs and World 2 Raid layouts. Campaign and Raid remain isolated from the main board.
- A branch feature matrix is recorded in `docs/BRANCH_FEATURE_MATRIX.md`; old branches are comparison sources only and are not deleted or rewritten.

The validated T1-T18 merge-idle board remains the primary account-growth loop.

State ranking continuation (2026-09-13): historical max source group
`02e38af8`/`e195b42b`/`1ef9c70d` was compared against canonical `9536cfc6`.
The only confirmed production gap was the additive clicker/progression slice:
click counter, tier-scaled tap payout, critical taps, Click Power/Critical Click
upgrades and click missions. These are now adapted to save v10 and the current
unified GameState. Old split Campaign/Prestige engines and standalone character
rasters remain intentionally excluded by the architecture/art-bible contracts.
Validation: 127 tests, build/locales, local+Yandex package audits, runtime,
Campaign, Raid, locale and Yandex browser smokes passed.

Audit implementation status (2026-09-05): Phases 1–4 in `docs/CODE_AUDIT_PLAN.md` are implemented. Save v8 adds current-run tier ownership; bounded base-tier Box pricing and T9–T18 missions meet the first-run pacing model; Collection milestone rewards and the five-category Brain Cell Prestige layer are production-wired with exact-once reset behavior.

Phase 5/6 continuation (2026-09-05): save v9 persists active-time combo/Fever/visitor state. Combo and Fever are live; visitor production scheduling waits for approved art while its exact-once core is tested. The Campaign run engine and launcher now support all seven data-driven World 1 Locations with stable per-Location blocker layouts and discovered-tier-capped orders. Raid gameplay and dual order choices remain next.

Phase 6 completion (2026-09-05): save v10 persists a separate World Raid board. Later World 1 Locations provide two stable delivery choices. The World 1 gate remains >=80% restoration plus >=5 restored Landmarks; its three resumable phases commit one third each, escalate blockers from 8 to 12, end in three high-tier deliveries and unlock World 2 exactly once.

Retention instrumentation (2026-09-05): save v10 also owns identifier-free session metrics and one-time active clocks for T5/T8/T18, post-T18 continuation, first Prestige and World 1 Raid clear. D1/D7 cohort conclusions remain blocked on real player data rather than inferred from tests.

## Current production baseline
- browser-first TypeScript runtime;
- 6x5 main merge board;
- one sequential T1-T18 chain;
- passive income, Brain Box economy, Brain Lab, missions, offline reward, Collection, Rescue and `Next move`;
- canonical save v7 with ordered Yandex/local persistence and v1-v6 migration;
- permanent Campaign Location / Landmark / Raid progress in save v7;
- resumable isolated `CampaignRunState` in the same canonical save;
- permanent Collection/Prestige metadata slots in save v7;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU runtime parity;
- browser/motion/accessibility/Yandex CI gates.

## Code audit Phase 1 — complete
- audit/retention implementation plan is tracked in `docs/CODE_AUDIT_PLAN.md`;
- canonical save v7 adds monotonic revision and save timestamp metadata while migrating v1-v6;
- Yandex selects the newest valid local/cloud snapshot and serializes cloud writes;
- boot-time timers/lifecycle handlers cannot persist the temporary initial state before save restoration;
- legal Campaign merge results above lifetime discovery survive reload without advancing main discovery;
- Campaign Supply remains able to produce a persisted T1 order after lifetime discovery increases;
- non-finite economy/progression/save-order values are normalized safely;
- validation: 101 tests, Yandex package/integrity/release audit, Campaign smoke, RC smoke and Yandex browser smoke passed.

## Campaign direction
The obsolete `8 short stages per world / 64 one-shot stages / 3 stars` plan is retired.

Target full Campaign:
- 8 worlds;
- 7 persistent Locations per world;
- 1 World Raid per world;
- 56 Locations + 8 Raids;
- Campaign progress survives Prestige.

Initial Location phase weighting:
- Stabilize 20%;
- Deliver Orders 25%;
- Restore Landmark 45%;
- Mastery 10%.

Initial World Raid gate:
- >=80% World Restored;
- >=5 restored landmarks.

World Raids are persistent 3-phase bosses whose progress survives sessions.

## Implemented Campaign foundation
- `src/core/campaign.ts` owns persistent Campaign domain state;
- first two production worlds each define seven stable Location ids;
- pure Location/World progress calculations;
- restored-landmark counting;
- Raid unlock calculation;
- Campaign map reads canonical save-v6 presentation snapshots;
- World Restored / Landmarks / Raid-gate summary;
- Location overview with four persistent phases and landmark;
- Raid overview with three persistent phases;
- EN/RU Campaign copy;
- browser smoke verifies Campaign progress survives a clean storage handoff.

## First complete Campaign Location vertical slice
World 1 / Location 1 — **Sneaker Garden** now has all four playable phases on one isolated 6x5 Campaign board.

### Stabilize — 20%
- six Overgrowth cells start blocked;
- four T1 Campaign units create an immediate merge decision;
- free Campaign Supply never spends main-board coins or paid Brain Box inflation;
- supply tiers are capped by lifetime `maxDiscoveredTier`;
- each successful merge clears exactly one nearest Overgrowth blocker;
- six clearing pulses commit `stabilize = 1` exactly once.

### Deliver Orders — +25%
- deterministic four-order queue `[T2, T2, T3, T4]`, capped by lifetime discovery;
- delivery consumes only the matching Campaign-board unit;
- each order commits one quarter of Deliver exactly once;
- partial order cursor survives exit/reload;
- completing all four raises Sneaker Garden from 20% to 45%.

### Restore Landmark — +45%
- six restoration orders are grouped into three two-order batches;
- only a completed two-order batch commits permanent Landmark progress;
- batches map to Giant Sneaker Flower Bed levels 1, 2 and 3;
- Landmark level permanently increases stronger Campaign Supply chance from 25% baseline up to 40% at level 3;
- completing all three levels raises Sneaker Garden from 45% to 90%.

### Mastery — +10%
- three final high-pressure orders;
- stronger five-cell Overgrowth remains locked during the phase and cannot be cleared by merge pulses;
- Landmark Supply bonus remains active;
- completing all Mastery orders commits the final 10%, taking Sneaker Garden to 100%.

### Isolation / persistence contract
- Campaign board never aliases or consumes main-board cells;
- Campaign actions do not change main-board coins, XP, main merge count or paid Brain Box inflation;
- active Stabilize/Deliver/Restore/Mastery runs are persisted in save v7 and resume after reload;
- completed temporary run state can be dismissed without erasing permanent Location progress.

Validation status:
- unit/integration suite covers Stabilize, Deliver, Restore batch atomicity, Landmark perk and Mastery completion;
- packaged runtime smoke passes;
- Campaign shell smoke covers save/reload + Stabilize/Deliver resume;
- dedicated Restore + Mastery Chromium smoke verifies Landmark Lv1 persistence and final 100% completion;
- packaged RC, motion, RU runtime and Yandex adapter smokes pass;
- package/release audit passes.

## Approved Campaign Art Pack
Repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- Normal / Challenge / Elite / Boss / Locked reusable Campaign UI assets;
- World 1 Backyard Brainrot Zone environment + boss;
- World 2 Surreal Brainrot City environment + boss.

## Completed audit implementation sequence
1. The Sneaker Garden engine is data-driven across all seven World 1 Locations.
2. Later Locations expose stable two-choice delivery orders within discovered tiers.
3. The persistent three-phase World 1 Raid uses its own saved board and unlocks World 2 exactly once.
4. Collection Rewards and Prestige are integrated with bounded permanent upgrades.
5. Combo and Fever use foreground active-time accounting; visitor logic is complete but remains production-disabled pending approved art.
6. Provider-neutral analytics and save-v10 retention clocks cover T5/T8/T18, post-T18 continuation, first Prestige and World 1 Raid clear.

## Current validation boundary
- Do not expand World 2 from its approved foundation until World 1 and Prestige have real cohort evidence.
- D1/D7 and milestone instrumentation is ready; analysis requires production cohort data.
- Remaining implementation work from the audit is the visitor presentation after the required character states and sounds are supplied, plus gradual migration of touched Campaign controllers from `public/*.js` into typed ownership.
- Latest verification: 115 tests, EN/RU parity, local package/release audit, World 1 Raid, packaged RC and packaged Yandex browser smokes pass.

Normalized-build final gate on `codex/normalized-full-build-20260913`:
- exhaustive audit covers every named local/remote ref; exact duplicate branch groups and `origin/HEAD` alias are recorded in `docs/BRANCH_AUDIT.md`;
- missing unique behavior from the audited branches is represented by the current typed engines: all World 1/2 Landmark Perks, safe Campaign-run abandon, World 2 Location/Raid persistence and high-resolution Campaign backgrounds;
- `npm run build`: passed, EN/RU parity 224/224;
- `npm test`: passed, 126/126 tests;
- runtime, Campaign shell, Restore + Mastery, World 1 Raid, World 2 Location/Raid, RC, motion, RU and Yandex browser smokes: passed;
- local package: passed integrity and release audit; Yandex package verification is part of the final gate;
- browser verification on `localhost:4173`: main board, audio settings persistence, Campaign seven-location map, World 2 routing and touch merge passed with no page errors.

The recovery snapshot remains `codex/recovery-full-build-20260913` at `ca39fb2`; historical feature branches remain untouched.

## Forensic source audit — 2026-09-13

- Added `docs/COMPLETE_BRAINMERGE_AUDIT.md` and `docs/COMPLETE_BRAINMERGE_FEATURE_MATRIX.md` after inspecting all refs, reflogs, stashes, worktrees, Codex checkpoint refs, local candidate copies, and `git fsck` unreachable/dangling objects.
- `git fsck --full --no-reflogs --unreachable` found one source-irrelevant build-only commit, 343 trees and 523 blobs. Fifty-three complete post-RC Brainmerge root trees were compared by source paths; no production behavior exists only outside the normalized HEAD.
- One invalid, truncated 1.6 MiB `.git/objects/da/tmp_obj_hvf1gd` cannot be decompressed or classified and was left untouched; the audit records this as the only inaccessible potential source.
- Current HEAD `9536cfc6` is the recommended canonical base. Historical `world1-campaign-run.ts`, split collection/prestige modules, old character assets, and save-v6 forms are recovery references only and must not be mechanically restored.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
