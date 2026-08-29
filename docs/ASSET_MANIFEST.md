# Brainmerge — Asset Manifest

## Runtime character presentation

Brainmerge now uses one canonical sequential character chain. Each core merge tier has one character identity; characters are no longer parallel Tier-1 families.

Current core chain:

1. Toilet Buddy — approved standalone `public/assets/characters/toilet-buddy-form-a.webp`
2. Camera Dude — shared atlas source pending standalone replacement
3. Sigma Rock — shared atlas source pending standalone replacement
4. Rizz Head — shared atlas source pending standalone replacement
5. Shark Sneakers — shared atlas source pending standalone replacement
6. Crocodile Bomber — shared atlas source pending standalone replacement
7. Coffee Ballerina — shared atlas source pending standalone replacement
8. Tung Wood — shared atlas source pending standalone replacement

The approved Toilet Buddy source is cleaned to transparent background, normalized to a 256x256 runtime canvas, and exported as WebP. It is the canonical Tier-1 source character for the core chain.

Legacy per-character runtime WebP files were removed after the atlas migration; new standalone files are added only for explicitly approved production art. Source/reference art remains governed by the Art Bible and is not treated as runtime framing.

## Runtime UI kit

The production UI is packed into `public/assets/ui/ui-atlas.webp` and styled through the runtime UI CSS layers. The atlas contains the approved Brainmerge UI family: candy buttons, Mission/Collection/general popup panels, board-cell states, coin/gem/energy/gift icons, Brain Box, progress-bar frame and collection slot.

The runtime uses only UI elements backed by existing game systems. Gem/Energy remain art assets only until corresponding gameplay exists.

## Alignment contract

- Board characters are centered inside a common normalized 256x256 presentation canvas.
- Per-character `scale`, `shadowScale` and collection scale may adjust perceived visual mass; `yPercent` remains zero unless runtime screenshot QA proves a correction is required.
- Shark Sneakers remains the perceived-mass baseline and must preserve the complete quadrupedal silhouette including all four shoes.
- Board tile states share identical framing so state changes do not shift geometry.
- Desktop gameplay uses symmetric side rails around the centered board; compact layouts collapse side panels below the board instead of squeezing the board off-axis.

## Core merge-chain rule

The primary merge loop is now strictly sequential:

`2x Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood`

More precisely, two identical characters at one chain tier merge into one character at the next chain tier. Brain Box feeds only Tier 1. Higher characters are earned through merging, and Collection discovery persists once a tier has been reached.

Future alternate forms, prestige skins or evolved variants are separate progression systems and must not replace the readability of this core chain.
