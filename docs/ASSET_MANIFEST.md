# Brainmerge — Asset Manifest

## Runtime character presentation
Brainmerge uses one canonical sequential T1-T18 character chain. Every core merge tier has one identity.

Current production path:

`public/assets/characters/character-atlas.webp`

- physical layout: 6 columns × 3 rows;
- contains all T1-T18 production identities;
- board and Collection use the same atlas pipeline;
- tier/family CSS/runtime presentation data selects the atlas cell;
- per-character scale/shadow/Collection normalization remains runtime presentation data.

Canonical order:
1. Toilet Buddy
2. Camera Dude
3. Sigma Rock
4. Rizz Head
5. Shark Sneakers
6. Crocodile Bomber
7. Coffee Ballerina
8. Tung Wood
9. Brr Brr Patapim
10. Boneca Ambalabu
11. Cappuccino Assassino
12. Frigo Camelo
13. Lirili Larila
14. Chimpanzini Bananini
15. Cocofanto Elefanto
16. Bombombini Gusini
17. Trippi Troppi
18. La Vacca Saturno Saturnita

Standalone character WebPs may remain in `public/assets/characters/` as approved source/reference material. They are not the ordinary production board/Collection rendering path after the unified atlas migration.

## Current production UI assets
### Core UI atlases
- `public/assets/ui/ui-atlas.webp` — existing Brainmerge UI sprites such as Brain Box / coin / legacy general UI objects.
- `public/assets/ui/upgrade-ui-atlas.webp` — Brain Lab + offline-reward sprite strip.
- `public/assets/ui/reward-gift.webp` — generic reward/gift art.

### Approved standalone UI icons
- `public/assets/ui/icon-missions.webp`
- `public/assets/ui/icon-collection.webp`
- `public/assets/ui/icon-rewards.webp`
- `public/assets/ui/icon-brain-lab.webp`

These four were integrated into the production mobile dock/panel headers/reward treatment and are style anchors for future meta icons.

Do **not** regenerate these four unless a future controlled polish pass explicitly replaces the approved set.

## UI asset ownership
Raster assets are decorative/presentation-only. Live code owns:
- labels/localized text;
- prices;
- progress values;
- stars;
- boss HP/progress;
- reward amounts;
- lock/claim/max/affordability state;
- hit targets and button geometry.

No generated full-screen image should replace a stateful DOM component.

## Campaign asset queue
Campaign is the next major art dependency. See `docs/CAMPAIGN_AND_META_PROGRESSION.md` and `docs/ART_BIBLE.md`.

### P0 — generate before the first campaign UI pass
#### A01 — Campaign / World Map icon
- purpose: prominent Campaign entry point;
- source: new Brainmerge UI icon;
- source canvas: 512×512;
- background: transparent;
- runtime: typically 24–64 px depending on entry point;
- required readability: obvious map/world/progression concept at small size;
- naming target: `icon-campaign.webp`;
- status: **missing / generate**.

#### A02 — Prestige / Brain Reset icon
- purpose: Prestige eligibility/meta screen;
- source canvas: 512×512;
- background: transparent;
- concept: brain + reset/rebirth/upward permanent-power cue;
- runtime: 24–96 px;
- naming target: `icon-prestige.webp`;
- status: **missing / generate**.

#### A03 — Brain Cell currency icon
- purpose: permanent Prestige currency;
- source canvas: 512×512;
- background: transparent;
- concept: premium stylized brain cell/token, clearly distinct from ordinary coin/gem art;
- runtime: 16–48 px and larger reward displays;
- naming target: `icon-brain-cell.webp`;
- status: **missing / generate**.

#### A04–A08 — Campaign stage-node icon family
Required semantic concepts:
1. Normal stage;
2. Challenge stage;
3. Elite/mastery stage;
4. Boss stage;
5. Locked/completed base treatment if not fully code-drawn.

Spec:
- source canvas: 512×512 each, transparent;
- may be delivered as separate sources and packed later;
- same construction/material/light language across the family;
- no numbers/text baked in;
- star/check/lock overlays should remain code-owned where practical;
- naming targets: `stage-normal`, `stage-challenge`, `stage-elite`, `stage-boss`, `stage-lock`;
- status: **missing / generate**.

### P1 — World 1 + World 2 campaign milestone
#### A09 — World 1 environment/banner
- working theme: Backyard / Meme Yard;
- source canvas: 1536×864;
- background: full image;
- no text/UI/map nodes;
- center-safe focal composition for responsive `object-fit: cover`;
- naming target: `campaign-world-01.webp`;
- status: **missing / generate**.

#### A10 — World 2 environment/banner
- working theme: Brainrot City;
- source canvas: 1536×864;
- same responsive/text-free rules as World 1;
- naming target: `campaign-world-02.webp`;
- status: **missing / generate**.

#### A11 — World 1 boss render
- source canvas: 1024×1024;
- transparent background;
- one whole boss, complete silhouette;
- stronger presence than board units but same Brainmerge visual universe;
- no health bar/text/background;
- naming target: `boss-world-01.webp`;
- status: **missing / generate**.

#### A12 — World 2 boss render
- source canvas: 1024×1024;
- same rules as World 1 boss;
- naming target: `boss-world-02.webp`;
- status: **missing / generate**.

#### A13–A14 — Optional compact World 1/2 emblems
Only generate if the Campaign map design needs a small world identity separate from the environment banner.

- source canvas: 512×512;
- transparent;
- one iconic symbol per world;
- no text;
- naming targets: `world-emblem-01.webp`, `world-emblem-02.webp`;
- status: **optional / defer until map layout proves need**.

## Full campaign later-art queue
After the Worlds 1-2 framework is validated:

### Environment/banner art
- A15 World 3 — Meme Factory — 1536×864.
- A16 World 4 — Italian Chaos — 1536×864.
- A17 World 5 — Sky Kingdom — 1536×864.
- A18 World 6 — Neon Brain Lab — 1536×864.
- A19 World 7 — Space Brainrot — 1536×864.
- A20 World 8 — Brainverse Core — 1536×864.

### Boss renders
- A21–A26 World 3–8 bosses — 1024×1024 transparent each.

### Optional world emblems
- A27–A32 World 3–8 emblems — 512×512 transparent each, only if the final map design uses the compact-emblem pattern.

Working world names/themes are provisional until approved. Do not bake these names into generated art.

## Collection Rewards art
No new generic Collection Reward icon is currently required.

Reuse:
- `icon-collection.webp` for Collection context;
- `icon-rewards.webp` for claim/reward semantics;
- code-owned progress/milestone frames for locked/claimable/claimed states.

Generate a new asset only if a later reward type has genuinely distinct semantics.

## Prestige UI art beyond P0
The first Prestige implementation should be possible with:
- `icon-prestige.webp`;
- `icon-brain-cell.webp`;
- code-drawn permanent-upgrade nodes/panels;
- existing reward/Brainmerge UI language.

Do not require a generated full Prestige tree screenshot.

## Rare / Shiny future assets
If rarity ships later, do **not** generate 18 duplicate characters.

Preferred asset model:
- one reusable rare rim/frame;
- small reusable sparkle/aura particles;
- optional rare badge;
- runtime tint/brightness treatment where readable.

The unified T1-T18 atlas stays the base identity source.

## Alignment / runtime contract
- Board characters remain centered and normalized by perceived visual mass.
- Character labels/tier/income badges must not overlap artwork or one another at phone scale.
- Campaign world art must leave readable negative space for live stage nodes/labels.
- Boss renders cannot cover the merge-board hit area.
- Small UI icons should be validated at actual 20–32 px use, not only at 512 px source size.
- Board/mobile layout remains code-driven; raster art cannot decide responsive order/visibility.

## Technical-art pipeline
For generated sources:
1. receive PNG/source render at the specified source canvas;
2. verify transparency where required;
3. remove accidental white/opaque background if present;
4. crop/normalize without clipping silhouette;
5. compare visual weight with existing Brainmerge anchors;
6. downsample/encode to WebP for runtime;
7. pack into an atlas only where it reduces requests without harming quality/maintenance;
8. run package raster integrity and Chromium visual QA.

Source generation dimensions are not necessarily runtime dimensions.

## Package integrity
`scripts/check-package.mjs` structurally validates packaged PNG/WebP resources. Any new Campaign/Prestige raster must be referenced through the normal package graph and pass the same integrity gate before release.
