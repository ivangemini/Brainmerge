# Brainmerge — Art Bible

## Locked visual direction
**Core style:** toy-like stylized 3D casual-game art.

### Rendering
- rounded, compact, collectible proportions;
- glossy/soft materials with tactile plastic, ceramic, stone, wood, fabric, painted metal or glass where appropriate;
- soft studio lighting and clean contact shadows;
- bright but controlled palette;
- strong silhouette/readability at actual mobile-game size;
- polished browser/mobile presentation, not neutral 3D model studies;
- kid-friendly absurd brainrot tone: playful rather than threatening.

## Character identity rule
A character joke/identity must read in roughly 0.5 seconds. Preserve the defining anatomy/concept/silhouette/signature traits, then adapt rendering/materials/proportions to the shared Brainmerge universe.

For established/reference characters:
- identity reference controls anatomy/concept/silhouette/signature traits;
- Brainmerge style references control materials, lighting, proportions and polish;
- do not copy anatomy from style references;
- avoid generic mascot redesigns that erase recognition.

## Runtime character normalization
Approved source renders do not need identical source framing. Runtime owns perceived size and placement.

- Shark Sneakers remains the perceived-mass baseline.
- Per-character presentation data may adjust board scale, vertical correction, contact-shadow scale and Collection-thumbnail scale.
- Normalize perceived mass, not raw PNG/WebP bounds.
- Default target is roughly 72–82% useful occupancy without clipping, with exceptions for wide/horizontal silhouettes.
- Presentation transforms never change hit boxes or merge rules.
- Missing/corrupt art must fail gracefully rather than showing browser broken-image chrome.

## Canonical T1-T18 progression lock
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

Two identical non-terminal characters merge into the next identity. T18 has no ordinary T19 successor. First lifetime discovery remains merge-first.

## Current character runtime art
All T1-T18 production identities are packed into one physical 6×3 `public/assets/characters/character-atlas.webp` and selected by runtime tier/presentation data.

Future rarity/prestige treatments should prefer reusable frames/auras/FX over duplicate character renders.

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
- source generation target: 512×512, transparent background;
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
- negative space for code-owned Location nodes and route;
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

World names remain localized runtime text.

## Environment-wide brainrot rule
Required formula:

**theme + environment-wide surreal infection**.

The brainrot comes from impossible object/animal/fashion/food/architecture fusion, weird scale and absurd physical logic. A normal casual-game location with a few meme props pasted on top is not acceptable.

Keep results colorful, polished, readable, kid-friendly and coherent enough for a premium casual game.

## Persistent Location map treatment
Campaign nodes 1–7 represent persistent **Locations**, not short stages.

Reusable marker family:
- `stage-normal.webp` — primary Location marker / Stabilize icon;
- `stage-challenge.webp` — Deliver Orders treatment;
- `stage-elite.webp` — Landmark/Mastery treatment;
- `stage-locked.webp` — locked treatment;
- `stage-boss.webp` — World Raid marker / Raid phase treatment.

Legacy filenames are compatibility details only. Do not visually reintroduce a Normal/Challenge/Elite short-stage structure.

Code owns Location name/number, restoration %, phase state, Landmark level, World Restored %, lock state and Raid progress.

## Landmark visual direction — current implementation
Every Location has one signature surreal Landmark integrated into the world.

Sneaker Garden has now proven the complete code/state Landmark loop through Giant Sneaker Flower Bed Lv1→Lv3. The current implementation uses existing world art plus code-owned progress/treatment; no dedicated Lv1/Lv2/Lv3 raster pack is required.

For remaining World 1 Locations:
- keep using existing world art and code-owned restoration treatment first;
- do not generate dozens of Landmark variants in advance;
- only add dedicated transparent Landmark overlays if multi-Location playtesting shows that restoration payoff/readability is insufficient;
- overlays must preserve world camera/perspective and contain no baked text/progress values.

## Boss / World Raid art direction
Bosses are large playful surreal brainrot creatures used as persistent World Raid destinations.

Source target:
- transparent 1024×1024;
- one whole boss, complete silhouette;
- stronger presence than ordinary board units;
- fused viral-surreal anatomy/object logic;
- playful rather than horror;
- no background, text, HP bars or progress UI baked into image.

Approved directions:
- World 1: flamingo + lawn machine + garden/gnome + sneaker fusion;
- World 2: pigeon + vending-machine/city-sign + sneaker fusion.

Boss state, Raid phase and progress remain code-owned.

## World modifier visual language
Each world may add one readable board modifier.

Rules:
- modifier state is obvious without long text;
- character identity remains readable;
- touch target clarity is preserved;
- use world-specific shape/material cues;
- avoid excessive particles/noise;
- modifier state is code-controlled.

Current reference implementation:
- World 1 Overgrowth in Sneaker Garden.

Next planned modifier:
- World 2 Traffic Lock.

## Prestige visual direction
Prestige communicates permanent rebirth/reset without feeling destructive.

- Prestige / Brain Reset icon uses brain + reset/up language;
- Brain Cell is visually distinct from ordinary coins;
- future confirmation UI uses live text/icons for reset vs preserved state;
- do not flatten the confirmation into generated art.

The art assets exist, but the actual Prestige/Brain Cell transactions are not yet implemented; do not present art as proof of functionality.

## Collection Rewards visual direction
Collection Rewards reuse existing Collection/Rewards visual language. Milestone state remains code-driven: locked, claimable, claimed.

## Rare / Shiny compatibility
If rarity ships later:
- preserve base T1-T18 identity;
- use reusable premium rim/sparkle/aura/tint treatment;
- do not require 18 separate rare renders;
- rarity must remain readable alongside tier/income badges.

## Style-anchor workflow
For generated additions:
1. attach the relevant identity reference when identity matters;
2. attach 2–3 approved Brainmerge assets as style anchors;
3. request controlled adaptation, not generic redesign;
4. match materials, lighting, saturation and visual weight;
5. validate at actual runtime size;
6. export transparent source where specified and optimize through the technical-art pipeline.

## Avoid
- photorealism;
- fantasy/RPG drift;
- flat developer placeholders presented as final UI;
- generic AI mascot redesign that loses identity;
- style drift between asset categories;
- baked player-facing text/progress state;
- random ornaments without semantic purpose;
- dense world backgrounds that fight Location nodes;
- boss images containing HP/progress UI;
- parallel Tier-1 families;
- new currencies visually confused with coins;
- reintroducing short-stage icon semantics.

## Current style anchors
Character anchors:
- Toilet Buddy;
- Camera Dude;
- Sigma Rock;
- Rizz Head;
- Shark Sneakers;
- Crocodile Bomber;
- Coffee Ballerina;
- Tung Wood;
- approved T9-T18 atlas cells.

UI anchors:
- Missions;
- Collection;
- Rewards;
- Brain Lab;
- Campaign;
- current Brain Box / Brain Lab / Mission / Collection production surfaces.

Campaign anchors:
- approved World 1 Backyard Brainrot Zone;
- approved World 2 Surreal Brainrot City;
- approved World 1 boss;
- approved World 2 boss.
