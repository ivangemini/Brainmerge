# Brainmerge — Asset Manifest

## Character runtime
Brainmerge uses one canonical sequential T1-T18 chain. All production board/Collection identities render through:

`public/assets/characters/character-atlas.webp`

The physical atlas is 6 columns × 3 rows. Per-character board/Collection normalization remains runtime presentation data.

## Existing production UI
Core runtime UI assets:
- `public/assets/ui/ui-atlas.webp`
- `public/assets/ui/upgrade-ui-atlas.webp`
- `public/assets/ui/reward-gift.webp`
- `public/assets/ui/icon-missions.webp`
- `public/assets/ui/icon-collection.webp`
- `public/assets/ui/icon-rewards.webp`
- `public/assets/ui/icon-brain-lab.webp`

## Approved Campaign / Prestige UI pack
The approved transparent source PNGs were normalized/downsampled and encoded as runtime WebP assets.

### Meta/navigation
- `public/assets/ui/icon-campaign.webp` — Campaign entry/map icon.
- `public/assets/ui/icon-prestige.webp` — Prestige / Brain Reset icon.
- `public/assets/ui/icon-brain-cell.webp` — Brain Cell currency icon.

### Reusable Campaign marker/phase family
Legacy filenames remain for compatibility, but the old short-stage semantics are obsolete.

- `public/assets/ui/stage-normal.webp` — primary **Location map marker** and Stabilize-phase icon.
- `public/assets/ui/stage-challenge.webp` — Deliver Orders / challenge treatment.
- `public/assets/ui/stage-elite.webp` — Landmark restoration / Mastery treatment.
- `public/assets/ui/stage-boss.webp` — World Raid marker / Raid phase treatment.
- `public/assets/ui/stage-locked.webp` — locked Location/phase treatment.

Do not infer `Normal / Challenge / Elite short stage` gameplay from those filenames.

Location number, restoration %, phase state, World Restored %, Landmark level, lock state and Raid progress remain code-owned overlays/state.

## Approved World 1 / World 2 Campaign art
### World 1 — Backyard Brainrot Zone
- `public/assets/campaign/campaign-world-01.webp` — production opaque environment.
- `public/assets/campaign/boss-world-01.webp` — transparent World 1 boss.

The environment uses world-wide surreal backyard brainrot and intentionally contains no baked Location circles, player-facing text or progression UI.

### World 2 — Surreal Brainrot City
- `public/assets/campaign/campaign-world-02.webp` — normalized production opaque environment.
- `public/assets/campaign/boss-world-02.b64` — current packaged base64-backed WebP payload for the transparent World 2 boss; Campaign presentation resolves it to a data URL at runtime.

The base64-backed path is a repository transport workaround, not gameplay state. If replaced with a normal binary WebP later, update this manifest and browser/package coverage in the same pass.

The environment uses city-wide viral surrealism and contains no baked Location circles, text or progression UI.

## Current runtime integration
The Campaign runtime uses:
- `icon-campaign.webp` for the top-level Campaign entry;
- World 1 / World 2 environment assets as responsive map scenes;
- `stage-normal.webp` for persistent Location nodes;
- the reusable phase family inside Location/phase presentation;
- `stage-boss.webp` for node 8, the World Raid;
- World 1 / World 2 boss renders as decorative Raid destinations.

Sneaker Garden is now a fully playable four-phase Location. Its progression is still rendered with code-owned state/treatment rather than bespoke raster Landmark-state variants.

`icon-prestige.webp` and `icon-brain-cell.webp` are repository-ready production assets, but the actual Prestige/Brain Cell transactions are not yet implemented. Do not surface fake functional controls simply because the art exists.

## Ownership rules
Raster assets remain presentation-only. Live code owns:
- localized labels;
- Location number/name;
- Location restoration %;
- phase progress/status;
- Landmark level/restoration;
- World Restored %;
- Raid gate/phase/HP/progress;
- rewards/amounts;
- Prestige eligibility;
- Brain Cell balance;
- hit targets and interaction state.

## Campaign surrealism rule
Future worlds must not be generic casual-game environments with a few brain/meme props pasted on top.

Required formula:
**theme + environment-wide surreal infection**.

The brainrot comes from impossible physical fusion, scale, anatomy and object logic while rendering remains polished, colorful, readable and kid-friendly.

## Landmark visual strategy — current
The first full Landmark loop has now been proven in Sneaker Garden:
- Restore uses six orders in three permanent two-order batches;
- Giant Sneaker Flower Bed progresses Lv1→Lv3 in code/state;
- the Landmark perk affects Campaign Supply;
- no dedicated raster Lv1/Lv2/Lv3 Landmark pack is required for the current implementation.

For the next six World 1 Locations, continue with:
- existing world art;
- code-owned highlight/restoration treatment;
- reusable Campaign marker assets.

Generate dedicated Landmark overlays only if multi-Location playtesting demonstrates that code-owned treatment fails to communicate restoration payoff/readability.

## Later art queue
No additional generated art is required before data-driving the remaining World 1 Locations and implementing the World 1 Raid.

Potential later additions:
- dedicated Landmark state overlays where demonstrated necessary;
- World Complete treatment;
- World 3–8 environments/bosses after Worlds 1–2 validation.

Do not regenerate approved Campaign UI, Worlds 1–2 or bosses without an explicit replacement decision.

## Technical-art pipeline
For generated sources:
1. verify source dimensions/transparency;
2. remove accidental opaque background where required;
3. normalize/crop without clipping;
4. downsample to approved runtime source dimensions;
5. encode WebP appropriate to transparency/detail;
6. validate at actual UI/map size;
7. run package raster integrity and Chromium screenshot QA.

`scripts/check-package.mjs` structurally validates packaged PNG/WebP assets.

## Build/publication note
The current repository commits generated `build/` JavaScript, but runtime art continues to live under `public/assets/` and remains independent of TypeScript compilation. `build/` must not become a duplicate asset source.
