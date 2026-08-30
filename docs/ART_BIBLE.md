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
- Normalize **perceived mass**, not raw PNG/WebP bounds.
- Default target is roughly 72–82% useful occupancy without clipping, with exceptions for wide/horizontal silhouettes.
- Per-character transforms are presentation data only and never change hit boxes or merge rules.
- Missing/corrupt art must fail gracefully rather than exposing browser broken-image chrome.

Re-tune normalization from real runtime captures, not isolated asset previews.

## Canonical T1-T18 progression lock
The main game uses **one sequential chain**, not parallel Tier-1 families:

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

Brain Box may rebuild already-discovered tiers according to the live upgrade rules, but **first lifetime discovery of every tier above T1 remains merge-only**. Art must not imply that an unseen high tier is directly purchasable/spawnable.

## Current character runtime art
All T1-T18 production identities are packed into one physical **6x3 `character-atlas.webp`** and selected by runtime tier/family data on both board and Collection.

Standalone approved WebPs may remain as source/reference material, but the production presentation path is the shared atlas. Future rarity/prestige visual treatments should prefer reusable frames/auras/FX over 18 duplicate renders.

## UI visual language
Current production UI uses cream + cyan/teal + purple + orange/yellow with rounded toy-like construction, soft bevels and clear state hierarchy.

Production icon family already includes:
- Missions — chunky checklist/clipboard;
- Collection — collectible album/book;
- Rewards — overflowing reward chest;
- Brain Lab — brain laboratory/upgrader.

These four icons are current style anchors for future top-level/meta icons.

### Small-icon rules
- source generation: 512×512, transparent background;
- one dominant object/silhouette;
- no baked text;
- readable at 20–32 px in dock/header use and 48–64 px in larger UI;
- avoid tiny secondary details that disappear at runtime;
- consistent visual weight, lighting and material language across the icon family.

## Campaign visual direction
Campaign is the new long-term presentation layer but must still look like Brainmerge, not a separate game.

### World environment/banner art
World art should establish theme and progression while leaving UI/state code-readable.

Generation/source target:
- 1536×864;
- no text, numbers, logos or UI buttons;
- center-safe focal composition so `object-fit: cover` can crop for desktop/mobile cards;
- broad readable shapes rather than dense scenery;
- same toy-like 3D material/lighting language as the game;
- enough calmer negative space for code-owned stage nodes and labels;
- no fake baked map nodes, stars, locks or progress counters unless an asset is explicitly a decorative background only.

Working world themes are provisional:
1. Backyard / Meme Yard
2. Brainrot City
3. Meme Factory
4. Italian Chaos
5. Sky Kingdom
6. Neon Brain Lab
7. Space Brainrot
8. Brainverse Core

World names must remain localized runtime text, not painted into art.

### World emblems
If compact world identity is needed, use a separate 512×512 transparent emblem per world rather than cropping the full environment art into a tiny unreadable thumbnail.

## Boss art direction
Bosses are large playful campaign presentation pieces, not realistic combat characters.

Source target:
- transparent 1024×1024;
- one whole boss, centered, complete silhouette;
- readable at roughly 160–320 px in the campaign stage header;
- stronger scale/presence than ordinary board units without horror/gore;
- no background, text, health bars or UI baked into the image;
- no weapon detail that overwhelms the brainrot/toy tone;
- boss state/progress remains code-owned.

Bosses can be original Brainverse characters or clearly separated boss variants, but they must not make the ordinary T1-T18 merge identities ambiguous on the board.

## Campaign stage-node icon family
Campaign map nodes should use a cohesive icon family, generated as transparent 512×512 sources and downsampled/optimized for runtime.

Required semantic states:
- Normal stage;
- Challenge stage;
- Elite/mastery stage;
- Boss stage;
- Locked/completed treatment.

Prefer one base construction with controlled semantic changes rather than five unrelated illustration styles. Completion stars/checkmarks/locks can remain code overlays where practical.

## Prestige visual direction
Prestige should communicate a powerful permanent reset without looking destructive/scary.

Required visual concepts:
- **Prestige / Brain Reset icon:** transformed/reborn brain, reset loop, ascending energy or crown-like upgrade cue;
- **Brain Cell currency:** one simple premium brain-cell/token object, distinct from ordinary coins and gems;
- optional permanent-upgrade node frame can be code-drawn around the Brain Cell/meta icon language.

Prestige confirmation UI must communicate reset/preserve through live text/icons. Do not flatten the confirmation into a generated screenshot.

## Collection Rewards visual direction
Collection Rewards reuse the existing Collection and Rewards icon family. Do **not** generate a redundant fifth generic reward icon unless a later mechanic needs a distinct semantic.

Milestone states should be code-driven:
- locked;
- eligible/claimable;
- claimed.

Art decorates the state; thresholds and reward numbers remain live/localized UI.

## Rare / Shiny compatibility
If rarity is implemented later:
- preserve the base T1-T18 identity;
- use reusable premium rim, sparkle/particle, aura and restrained tint treatment;
- do not require 18 separately generated rare characters;
- rarity must read at board size without obscuring tier/income badges.

## Style-anchor workflow
For generated additions:
1. attach the most relevant approved identity/reference when identity must be preserved;
2. attach 2–3 approved Brainmerge assets as style anchors;
3. request controlled adaptation, not generic redesign;
4. match material language, lighting, saturation and visual weight;
5. validate against the actual intended runtime size;
6. export source with transparent background where specified, then optimize to runtime WebP/atlas through the technical-art pipeline.

## Avoid
- Photorealism.
- Flat developer-dashboard placeholders presented as final UI.
- Generic AI mascot redesign that loses identity.
- Style drift between asset categories.
- Baked player-facing text in generated UI/world/boss art.
- Random ornaments without semantic purpose.
- Dense world backgrounds that fight stage nodes/text.
- Boss images containing health bars/progress UI.
- Parallel Tier-1 families in the main chain.
- Reusing one ordinary character identity across several core merge tiers.
- New currencies that visually resemble coins closely enough to confuse spend context.

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
- approved T9-T18 production renders/atlas cells

UI anchors:
- Missions icon
- Collection icon
- Rewards icon
- Brain Lab icon
- current Brain Box / Brain Lab / Mission / Collection production surfaces
