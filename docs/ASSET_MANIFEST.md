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
The user-approved transparent source PNGs were normalized/downsampled and encoded as runtime WebP assets.

### Meta/navigation
- `public/assets/ui/icon-campaign.webp` — Campaign entry/map icon.
- `public/assets/ui/icon-prestige.webp` — Prestige / Brain Reset icon.
- `public/assets/ui/icon-brain-cell.webp` — Brain Cell currency icon.

### Reusable Campaign marker/phase family
The original files retain their production filenames for compatibility, but their product meaning changed with the persistent-Location Campaign redesign.

- `public/assets/ui/stage-normal.webp` — primary **Location map marker** and Stabilize-phase icon.
- `public/assets/ui/stage-challenge.webp` — Deliver Orders / challenge treatment.
- `public/assets/ui/stage-elite.webp` — Landmark restoration / mastery treatment.
- `public/assets/ui/stage-boss.webp` — World Raid marker / Raid phase treatment.
- `public/assets/ui/stage-locked.webp` — locked Location-phase treatment.

The old semantic meaning `Normal / Challenge / Elite short stage` is obsolete. Do not infer gameplay type from these filenames.

Location number, restoration %, phase status, World Progress, Landmark level, lock/unlock and Raid progress remain code-owned overlays/state.

## Approved World 1 / World 2 Campaign art
### World 1 — Backyard Brainrot Zone
- `public/assets/campaign/campaign-world-01.webp` — production opaque environment.
- `public/assets/campaign/boss-world-01.webp` — transparent World 1 boss.

Environment identity is surreal TikTok-style backyard brainrot: impossible garden/object/animal/fashion fusions distributed through the world. It intentionally contains no baked Location circles, text or UI.

### World 2 — Surreal Brainrot City
- `public/assets/campaign/campaign-world-02.webp` — normalized production opaque environment.
- `public/assets/campaign/boss-world-02.b64` — current packaged base64-backed WebP payload for the transparent World 2 boss; `public/campaign-map.js` resolves it to a data URL at runtime.

The base64-backed path is a repository transport workaround, not gameplay state. If replaced later with a normal binary WebP, update this manifest and browser coverage in the same pass.

Environment identity is city-wide viral surrealism: architecture/infrastructure physically fused with pigeons, vending machines, fashion objects, food/household forms and other absurd elements. It contains no baked Location circles, text or UI.

## Current runtime integration
The Campaign shell uses:
- `icon-campaign.webp` for the top-level Campaign entry;
- World 1 / World 2 environment assets as responsive map scenes;
- `stage-normal.webp` for the seven persistent Location nodes;
- the other Campaign marker assets inside Location phase overviews;
- `stage-boss.webp` for node 8, the World Raid;
- World 1 / World 2 boss renders as decorative Raid destinations.

`icon-prestige.webp` and `icon-brain-cell.webp` are production-ready repository assets but are intentionally not surfaced as fake functional controls before Prestige/Brain Cells exist in core state.

## Ownership rules
Raster assets remain presentation-only. Live code owns:
- localized labels;
- Location number/name;
- Location restoration %;
- phase progress/status;
- Landmark level/restoration;
- World Restored %;
- Raid gate/phase/HP/progress;
- rewards and amounts;
- Prestige eligibility;
- Brain Cell balance;
- hit targets and interaction state.

## Campaign surrealism rule
Future worlds must not be generic casual-game environments with a few brain/meme props added afterward.

Required formula:
**theme + environment-wide surreal infection**.

The brainrot comes from impossible physical fusion, scale, anatomy and object logic while rendering remains polished, colorful, readable and kid-friendly.

## Landmark visual strategy
No new Landmark asset pack is required for the first stateful Location vertical slice.

First prove Landmark progression with:
- existing world art;
- code-owned highlight/restoration treatment;
- existing reusable Campaign icons.

Only generate dedicated restored/upgraded Landmark overlays if the playable Sneaker Garden vertical slice proves that code-owned treatment is visually insufficient.

## Later art queue
No additional generated art is required before implementing stateful World 1.

After Worlds 1-2 validate the system:
- World 3–8 environments;
- World 3–8 bosses;
- optional Landmark state overlays where demonstrated necessary;
- optional compact world emblems only if final map layout proves a need.

Do not regenerate the approved Campaign UI pack, Worlds 1-2 or bosses without an explicit replacement decision.

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
