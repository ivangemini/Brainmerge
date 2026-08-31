# Brainmerge — Art Bible

## Locked visual direction
**Core style:** toy-like stylized 3D casual-game art.

### Rendering
- Rounded, compact, collectible proportions.
- Glossy/soft materials; tactile plastic, ceramic, stone, wood, fabric, painted metal or glass where appropriate.
- Soft studio lighting and clean contact shadows.
- Bright but controlled palette; avoid muddy or monochrome renders.
- Strong silhouette/readability at actual mobile-game size.
- Premium polished browser/mobile presentation, not neutral 3D model studies.
- Kid-friendly absurd brainrot tone; playful rather than threatening.

## Character identity rule
A character joke/identity must read in roughly 0.5 seconds. Preserve the few defining traits that make the archetype recognizable, then adapt the rest to the shared Brainmerge visual universe.

For established/reference characters:
- identity reference controls anatomy/concept/silhouette/signature traits;
- Brainmerge style references control materials, lighting, proportions and polish;
- do not copy anatomy from style references;
- avoid generic mascot redesigns that erase recognition.

## Runtime character normalization
Approved source renders do not need identical source framing. Runtime owns perceived size and placement.

- Shark Sneakers remains the perceived-mass baseline.
- Each character has presentation data for board scale, vertical correction, contact-shadow scale and Collection-thumbnail scale.
- Normalize perceived mass, not raw PNG/WebP bounds.
- Default target is roughly 72–82% useful occupancy without clipping, with exceptions for wide/horizontal silhouettes.
- Per-character transforms are presentation data only and never change hit boxes or merge rules.
- Missing/corrupt art must fail gracefully rather than exposing browser broken-image chrome.

## Canonical T1-T18 progression lock
The main game uses one sequential chain:

1. T1 — Toilet Buddy
2. T2 — Camera Dude
3. T3 — Sigma Rock
4. T4 — Rizz Head
5. T5 — Shark Sneakers
6. T6 — Crocodile Bomber
7. T7 — Coffee Ballerina
8. T8 — Tung Wood
9. T9 — Brr Brr Patapim
10. T10 — Boneca Ambalabu
11. T11 — Cappuccino Assassino
12. T12 — Frigo Camelo
13. T13 — Lirili Larila
14. T14 — Chimpanzini Bananini
15. T15 — Cocofanto Elefanto
16. T16 — Bombombini Gusini
17. T17 — Trippi Troppi
18. T18 — La Vacca Saturno Saturnita

Two identical non-terminal characters merge into the next identity. T18 has no ordinary T19 successor.

Brain Box may rebuild already-discovered tiers according to live upgrade rules, but first lifetime discovery above T1 remains merge-only.

## Current character runtime art
All T1-T18 production identities are packed into one physical **6x3 `character-atlas.webp`** and selected by runtime tier/family data on board and Collection.

Future rarity/prestige visual treatments should prefer reusable frames/auras/FX over duplicate renders.

## UI visual language
Current production UI uses cream + cyan/teal + purple + orange/yellow with rounded toy-like construction, soft bevels and clear state hierarchy.

Production icon anchors:
- Missions;
- Collection;
- Rewards;
- Brain Lab;
- Campaign;
- Prestige;
- Brain Cell.

### Small-icon rules
- source generation: 512×512, transparent background;
- one dominant object/silhouette;
- no baked text;
- readable at 20–32 px and 48–64 px;
- avoid tiny secondary detail;
- consistent visual weight, lighting and material language.

# Campaign visual direction
Campaign must look like Brainmerge, not a separate fantasy/RPG game.

## World environment art
World art establishes theme and restoration space while code owns live progression.

Generation/source target:
- 1536×864;
- no text, numbers, logos or UI buttons;
- center-safe composition for desktop/mobile crop;
- broad readable shapes rather than dense scenery;
- same toy-like 3D material/lighting language;
- natural negative space for code-owned **Location nodes** and route;
- no baked node circles, progress %, locks, Raid HP or Landmark levels.

Working world themes:
1. Backyard Brainrot Zone
2. Surreal Brainrot City
3. Meme Factory
4. Italian / Mediterranean Chaos
5. Sky Brainrot
6. Surreal Brain Lab
7. Space Brainrot
8. Brainverse Core

World names stay localized runtime text.

## Environment-wide brainrot rule
Future worlds must use:

**theme + environment-wide surreal infection**.

The brainrot comes from impossible object/animal/fashion/food/architecture fusion, weird scale and absurd physical logic. A normal casual-game location with a few meme props pasted on top is not acceptable.

Keep the result:
- colorful;
- polished;
- readable;
- kid-friendly;
- coherent enough for a premium mobile game.

## Persistent Location map treatment
Campaign nodes 1–7 now represent **Locations**, not short stages.

Current reusable marker family:
- `stage-normal.webp` — primary Location marker / Stabilize icon;
- `stage-challenge.webp` — Deliver Orders treatment;
- `stage-elite.webp` — Landmark/Mastery treatment;
- `stage-locked.webp` — locked phase treatment;
- `stage-boss.webp` — World Raid marker / Raid phase treatment.

The legacy filenames remain for compatibility only. Do not visually imply a separate `Normal / Challenge / Elite stage` campaign structure.

Code owns:
- Location number/name;
- restoration %;
- phase state;
- Landmark level;
- World Restored %;
- lock/unlock state;
- Raid progress.

Map marker art should remain compact and subordinate to world art. Progress labels must remain legible at mobile size.

## Landmark visual direction
Every Location has one signature surreal Landmark.

Landmarks should feel like integrated parts of the world, not detached upgrade-menu props.

Initial implementation should reuse approved world backgrounds and code-owned treatments. Do not generate dozens of Landmark variants before the playable vertical slice proves a need.

If dedicated Landmark states are later required:
- use transparent overlay/state assets where practical;
- preserve the same camera/perspective as the world art;
- no baked progress numbers/text;
- upgrades should produce a clearly visible but controlled restoration change;
- avoid turning Landmark progression into fantasy castle-building aesthetics.

## Boss / World Raid art direction
Bosses are large playful surreal brainrot creatures used as persistent World Raid destinations.

Source target:
- transparent 1024×1024;
- one whole boss, complete silhouette;
- stronger presence than ordinary board units;
- viral-surreal fused anatomy/object logic;
- playful rather than horror;
- no background, text, HP bars or UI baked into image.

Boss state, Raid phase and progress are code-owned.

Approved World 1 boss direction: flamingo + lawn machine + garden/gnome + sneaker fusion.

Approved World 2 boss direction: pigeon + vending-machine/city-sign + sneaker fusion.

Future bosses should continue broad TikTok/internet surrealism; they do not need to be limited to Italian Brainrot archetypes.

## World modifier visual language
Each world may add one readable board modifier.

Visual rules:
- modifier state must be obvious without long text;
- do not hide character identity;
- do not reduce touch target clarity;
- use world-specific shape/material cues;
- avoid excessive particles/noise;
- modifier art/state remains code-controlled.

Initial targets:
- World 1 Overgrowth;
- World 2 Traffic Lock.

## Prestige visual direction
Prestige communicates permanent rebirth/reset without feeling destructive.

- Prestige / Brain Reset icon uses brain + reset/up language;
- Brain Cell is visually distinct from ordinary coins;
- confirmation screen uses live text/icons for reset vs preserved state;
- do not flatten confirmation into generated art.

## Collection Rewards visual direction
Collection Rewards reuse existing Collection/Rewards visual language.

Milestone states remain code-driven:
- locked;
- claimable;
- claimed.

## Rare / Shiny compatibility
If rarity ships later:
- preserve base T1-T18 identity;
- use reusable premium rim/sparkle/aura/tint treatment;
- do not require 18 separate rare renders;
- rarity must remain readable with tier/income badges.

## Style-anchor workflow
For generated additions:
1. attach relevant approved identity/reference when identity matters;
2. attach 2–3 approved Brainmerge assets as style anchors;
3. request controlled adaptation, not generic redesign;
4. match materials, lighting, saturation and visual weight;
5. validate at actual runtime size;
6. export transparent source where specified and optimize through technical-art pipeline.

## Avoid
- Photorealism.
- Fantasy/RPG drift.
- Flat developer placeholders presented as final UI.
- Generic AI mascot redesign that loses identity.
- Style drift between asset categories.
- Baked player-facing text or progress state.
- Random ornaments without semantic purpose.
- Dense world backgrounds that fight Location nodes.
- Boss images containing HP/progress UI.
- Parallel Tier-1 families.
- New currencies visually confused with coins.
- Reintroducing short-stage icon semantics after the persistent-Location redesign.

## Current style anchors
Character anchors:
- Toilet Buddy
- Camera Dude
- Sigma Rock
- Rizz Head
- Shark Sneakers
- Crocodile Bomber
- Coffee Ballerina
- Tung Wood
- approved T9-T18 atlas cells

UI anchors:
- Missions icon
- Collection icon
- Rewards icon
- Brain Lab icon
- Campaign icon
- current Brain Box / Brain Lab / Mission / Collection production surfaces

Campaign anchors:
- approved World 1 Backyard Brainrot Zone
- approved World 2 Surreal Brainrot City
- approved World 1 boss
- approved World 2 boss
