# Brainmerge — Asset Manifest

## Runtime character presentation

Brainmerge uses a normalized Tier-1/Form-A character presentation system. The shared baseline atlas remains at `public/assets/characters/character-atlas.webp`, while approved standalone replacements can override an individual family when a cleaner production source is supplied.

Current Base/Form A families:

- Camera Dude — shared atlas
- Toilet Buddy — approved standalone `public/assets/characters/toilet-buddy-form-a.webp`
- Sigma Rock — shared atlas
- Rizz Head — shared atlas
- Shark Sneakers — shared atlas
- Crocodile Bomber — shared atlas
- Coffee Ballerina — shared atlas
- Tung Wood — shared atlas

The approved Toilet Buddy source was cleaned to transparent background, normalized to a 256x256 runtime canvas, and exported as WebP for browser delivery. It is the canonical Form A render for tiers 1–3 unless a later explicit user approval replaces it.

Legacy per-character runtime WebP files were removed after the atlas migration; new standalone files are added only for explicitly approved production art. Source/reference art remains governed by the Art Bible and is not treated as runtime framing.

## Runtime UI kit

The production UI is packed into `public/assets/ui/ui-atlas.webp` and styled through the runtime UI CSS layers.
The atlas contains the approved Brainmerge UI family:

- yellow, blue, purple, green and red candy buttons;
- Mission, Collection and general popup panel art;
- base, selected, merge-target and locked board-cell states;
- coin, gem, energy and gift icons;
- Brain Box;
- progress-bar frame;
- collection slot.

The runtime currently uses only UI elements backed by existing game systems. Gem/Energy remain available art assets and are not introduced as new currencies/mechanics until corresponding gameplay is implemented.

## Alignment contract

- Board characters are centered inside a common normalized 256x256 presentation canvas.
- Per-family `scale`, `shadowScale` and collection scale may adjust perceived visual mass; `yPercent` remains zero for Base/Form A unless runtime screenshot QA proves a correction is required.
- Shark Sneakers is centered as the complete quadrupedal silhouette, including all four shoes.
- Board tile states share identical framing so state changes do not shift geometry.
- Desktop gameplay uses symmetric side rails around the centered board; compact layouts collapse side panels below the board instead of squeezing the board off-axis.

## Merge-chain rule

A full character render spans three gameplay tiers:
- Tiers 1–3 = Form A / Base
- Tiers 4–6 = Form B / Evolved
- Tiers 7–9 = Form C / Elite
- Tiers 10–12 = Form D / Legendary
- Tiers 13–15 = Form E / Mythic

Within a three-tier band, progression uses reusable rank marks, glow, particles and other overlays. Major form art changes occur every third tier transition.
