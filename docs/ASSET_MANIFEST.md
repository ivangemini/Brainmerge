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
- `public/assets/ui/icon-campaign.webp` — Campaign entry/map icon — 512×512 transparent.
- `public/assets/ui/icon-prestige.webp` — Prestige / Brain Reset icon — 512×512 transparent.
- `public/assets/ui/icon-brain-cell.webp` — Brain Cell currency icon — 512×512 transparent.

### Campaign stage nodes
- `public/assets/ui/stage-normal.webp` — Normal stage — 512×512 transparent.
- `public/assets/ui/stage-challenge.webp` — Challenge stage — 512×512 transparent.
- `public/assets/ui/stage-elite.webp` — Elite/mastery stage — 512×512 transparent.
- `public/assets/ui/stage-boss.webp` — Boss stage — 512×512 transparent.
- `public/assets/ui/stage-locked.webp` — Locked stage — 512×512 transparent.

Node numbers, stars, completion, lock/unlock and progress remain code-owned overlays/state.

## Approved World 1 / World 2 campaign art
### World 1 — Backyard Brainrot Zone
- `public/assets/campaign/campaign-world-01.webp` — 1536×864 opaque environment.
- `public/assets/campaign/boss-world-01.webp` — 1024×1024 transparent boss.

Environment identity is surreal TikTok-style backyard brainrot: impossible garden/object/animal/fashion fusions distributed through the world. It intentionally contains no baked stage circles, text or UI.

### World 2 — Surreal Brainrot City
- `public/assets/campaign/campaign-world-02.webp` — normalized to 1536×864 opaque environment.
- `public/assets/campaign/boss-world-02.webp` — 1024×1024 transparent boss.

Environment identity is city-wide viral surrealism: architecture and infrastructure physically fused with pigeons, vending machines, fashion objects, food/household forms and other absurd elements. It contains no baked stage circles, text or UI.

## Current runtime integration
The Campaign visual shell uses:
- `icon-campaign.webp` for the top-level Campaign entry;
- World 1 / World 2 environment WebPs as responsive map scenes;
- the semantic stage-node family as code-positioned map markers;
- World 1 / World 2 boss renders as decorative map destinations.

`icon-prestige.webp` and `icon-brain-cell.webp` are production-ready repository assets but are intentionally not surfaced as fake functional controls before Prestige/Brain Cells exist in core state.

## Ownership rules
Raster assets remain presentation-only. Live code owns:
- localized labels;
- stage numbers;
- completion/stars;
- lock/unlock state;
- boss progress/HP;
- rewards and amounts;
- Prestige eligibility;
- Brain Cell balance;
- hit targets and interaction state.

## Campaign surrealism rule
Future worlds must not be generic casual-game environments with a few brain/meme props added afterward.

Required formula:
**theme + environment-wide surreal infection**.

The brainrot comes from impossible physical fusion, scale, anatomy and object logic while the rendering remains polished, colorful, readable and kid-friendly.

## Later art queue
No additional art is required before implementing stateful Worlds 1-2.

After that milestone:
- World 3–8 environments — 1536×864 each;
- World 3–8 bosses — 1024×1024 transparent each;
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
