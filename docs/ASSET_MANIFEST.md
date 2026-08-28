# Brainmerge — Asset Manifest

## Runtime character presentation

Brainmerge uses one normalized Tier-1 character atlas at `public/assets/characters/character-atlas.webp`.
The eight Base/Form A families are optically centered into equal atlas cells so the board and collection use a single predictable anchor system:

- Camera Dude
- Toilet Buddy
- Sigma Rock
- Rizz Head
- Shark Sneakers
- Crocodile Bomber
- Coffee Ballerina
- Tung Wood

Legacy per-character runtime WebP files were removed from `public/assets/characters/` after the atlas migration. Source/reference art remains governed by the Art Bible and is not treated as runtime framing.

## Runtime UI kit

The production UI is packed into `public/assets/ui/ui-atlas.webp` and styled through `public/ui-kit.css`.
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

- Board characters are centered inside a common normalized atlas cell.
- Per-family `scale`, `shadowScale` and collection scale may adjust perceived visual mass; `yPercent` remains zero for Base/Form A.
- Shark Sneakers is centered as the complete quadrupedal silhouette, including all four shoes.
- Board tile states share identical atlas framing so state changes do not shift geometry.
- Desktop gameplay uses symmetric side rails around the centered board; compact layouts collapse side panels below the board instead of squeezing the board off-axis.

## Merge-chain rule

A full character render spans three gameplay tiers:
- Tiers 1–3 = Form A / Base
- Tiers 4–6 = Form B / Evolved
- Tiers 7–9 = Form C / Elite
- Tiers 10–12 = Form D / Legendary
- Tiers 13–15 = Form E / Mythic

Within a three-tier band, progression uses reusable rank marks, glow, particles and other overlays. Major form art changes occur every third tier transition.
