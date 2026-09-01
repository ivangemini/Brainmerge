# Brainmerge Asset Manifest

## Repository-recovery note
The production asset inventory below remains valid for published `main`, but UI composition is being recovered. Asset existence must not be used as evidence that a legacy panel placement is still approved.

Collection and Brain Lab icons remain approved; their owner-approved current placement is top-level UI rather than a permanent right rail.

## Character runtime
Canonical T1–T18 production art:

`public/assets/characters/character-atlas.webp`

Physical atlas: 6 columns × 3 rows.

Per-character board/Collection normalization belongs to runtime presentation data. Historical 4×2/first-eight CSS routing is legacy and should be removed after recovery verification.

### Standalone compatibility character assets currently present
The repository also contains standalone WebP character files used historically/for compatibility/asset workflows. They are not a second progression source of truth.

Production identity/order comes from the canonical catalog + 6×3 atlas.

## Core UI assets
- `public/assets/ui/ui-atlas.webp`
- `public/assets/ui/upgrade-ui-atlas.webp`
- `public/assets/ui/reward-gift.webp`
- `public/assets/ui/icon-missions.webp`
- `public/assets/ui/icon-collection.webp`
- `public/assets/ui/icon-rewards.webp`
- `public/assets/ui/icon-brain-lab.webp`

## Meta/navigation assets
- `public/assets/ui/icon-campaign.webp`
- `public/assets/ui/icon-prestige.webp`
- `public/assets/ui/icon-brain-cell.webp`

### Ownership note
Icons identify systems; they do not define layout.

The current product contract treats Collection and Brain Lab as top-level systems. Do not place them permanently on the right merely because the assets were previously integrated into `.side-card` markup.

## Campaign marker/phase family
Legacy filenames remain for compatibility:
- `stage-normal.webp` — Location/Stabilize family;
- `stage-challenge.webp` — Deliver family;
- `stage-elite.webp` — Landmark/Mastery family;
- `stage-boss.webp` — World Raid family;
- `stage-locked.webp` — locked state.

Do not infer old Normal/Challenge/Elite one-shot-stage gameplay from filenames.

## World 1 Campaign art
- `public/assets/campaign/campaign-world-01.webp`
- `public/assets/campaign/boss-world-01.webp`

Environment contains no baked Location circles/player-facing text/progression state.

## World 2 Campaign art
- `public/assets/campaign/campaign-world-02.webp`
- `public/assets/campaign/boss-world-02.b64`
- `public/assets/campaign/boss-world-02.webp`

Published repository currently carries a base64-backed transport path for the World 2 boss alongside the WebP asset. Treat that as packaging compatibility, not gameplay state. Consolidate to one normal binary asset path when the transport workaround is no longer needed, with package/browser coverage updated at the same time.

## Current published runtime use
Published `main` uses:
- shared T1–T18 atlas on board/Collection;
- Campaign icon for Campaign entry;
- World 1/2 environment art for map scenes;
- reusable Location/Raid marker family;
- World 1/2 boss art as Raid destinations;
- Missions/Collection/Brain Lab icons in legacy card/mobile-sheet presentation.

The last bullet describes the **published baseline**, not the recovered current UI contract.

## Rewarded-ad asset policy
No dedicated raster is required for timers, cooldowns or reward availability.

Rewarded boost UI should reuse approved icon/toy-console language while keeping:
- benefit text;
- timer;
- active/loading/unavailable state;
- daily/cooldown counters
as code-owned presentation.

Do not generate a screenshot-like rewarded card with baked values.

## Landmark strategy
Sneaker Garden Landmark progression is currently code/state driven. No dedicated Giant Sneaker Flower Bed Lv1/Lv2/Lv3 raster set is required for the reference slice.

Continue with existing world art + code-owned restoration treatment for remaining World 1 Locations unless playtesting proves bespoke overlays are necessary.

## Asset ownership rules
Raster assets may own:
- character/world/boss/icon imagery;
- non-semantic decorative detail.

Raster assets must not own:
- localized labels;
- counts/currency amounts;
- tier/progress values;
- timers;
- lock/claim state;
- Location identity/progress;
- Raid HP/progress;
- Prestige eligibility;
- hit targets;
- responsive placement.

## Technical-art pipeline
1. verify dimensions/transparency;
2. normalize/crop without clipping;
3. downsample to intended runtime size;
4. encode WebP with appropriate alpha/detail quality;
5. validate actual render size;
6. run package raster-integrity check;
7. run desktop/mobile Chromium screenshot QA.

## Build/publication policy
Assets live under `public/assets/` and are independent from TypeScript compilation.

`build/` is generated JavaScript and must never become a duplicate asset/source-of-truth tree.

If `build/` remains committed, enforce generated parity in CI.

## Later asset queue
No broad new asset generation should happen during repository recovery.

After recovery/reconciliation, possible later additions:
- dedicated Landmark overlays only where justified;
- World Complete treatment;
- World 3–8 environments/bosses;
- rarity/shiny reusable frames/auras if the system ships.

Do not regenerate already approved T1–T18, Worlds 1–2, core icons or bosses without an explicit replacement decision.