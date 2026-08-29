# Brainmerge — Art Bible

## Locked visual direction

**Core style:** toy-like stylized 3D casual-game art.

### Rendering
- Rounded, compact, collectible proportions.
- Glossy/soft materials; tactile plastic, ceramic, stone, wood, fabric, or painted metal where appropriate.
- Soft studio lighting and clean contact shadows.
- Bright but controlled palette; avoid muddy or monochrome renders.
- High silhouette readability at merge-board cell size.
- Polished mobile/browser-game presentation, not a neutral 3D model study.

### Character rule
The joke/identity must read in roughly 0.5 seconds. Preserve the few defining visual traits that make the archetype recognizable, then adapt the rest to the shared game style.

### Runtime presentation normalization
Approved source renders do not need identical source framing. Runtime owns final perceived size and placement.

- Shark Sneakers is the current perceived-mass baseline for board-cell presentation.
- Each character has an explicit presentation contract: `scale`, vertical correction, contact-shadow scale, and collection-thumbnail scale.
- Normalize **perceived mass**, not raw PNG/WebP bounds. Tall/skinny and wide/low characters should feel equally important on the board.
- Default target is roughly 72–82% useful visual occupancy without clipping, with exceptions for inherently horizontal silhouettes.
- Character art must use a shared ground/contact-shadow language even when the source render included its own lighting.
- Per-character runtime transforms are presentation data, not gameplay data, and must not change hit boxes or merge rules.
- Missing/corrupt art must fail gracefully in UI rather than showing browser broken-image chrome.

Re-tune normalization only from real runtime captures, not from isolated asset previews.

### Style-anchor workflow
For generated replacements or future variants:
1. Attach the approved character image as **identity reference**.
2. Attach 2–3 approved Brainmerge characters as **style references**.
3. Ask for a controlled game-style adaptation, not a generic redesign.
4. Keep the same material language, lighting, level of stylization, and compact silhouette.

## Core merge progression lock

The main game uses **one sequential chain**, not several parallel character families.

- Tier 1 — Toilet Buddy
- Tier 2 — Camera Dude
- Tier 3 — Sigma Rock
- Tier 4 — Rizz Head
- Tier 5 — Shark Sneakers
- Tier 6 — Crocodile Bomber
- Tier 7 — Coffee Ballerina
- Tier 8 — Tung Wood

Two identical characters merge into the next character in the chain. A successful merge must therefore produce a visibly new identity, making discovery itself the reward.

The Brain Box feeds Tier 1 only. Higher-tier characters are earned through merging. Do not dilute the core loop by spawning arbitrary high-tier characters from the standard Brain Box.

### Future visual escalation
Alternate forms, prestige skins, event variants, auras and rarity treatments may be added later, but they are secondary systems layered on top of the readable core chain. They must not make two different merge tiers look like the same base character.

### Avoid
- Generic AI/casual mascot redesign that destroys recognition.
- Photorealism.
- Flat placeholder UI art.
- Random ornaments/accessories without gameplay purpose.
- Style drift between characters.
- Overly detailed backgrounds in character assets.
- Parallel Tier-1 character families in the core merge loop.
- Reusing one character identity across several core merge tiers.

## Current style anchors
- Toilet Buddy
- Camera Dude
- Sigma Rock
- Rizz Head
- Shark Sneakers
- Crocodile Bomber
- Coffee Ballerina
- Tung Wood
