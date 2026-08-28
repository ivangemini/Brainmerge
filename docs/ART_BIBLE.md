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

- Shark Sneakers is the current Tier-1 baseline for perceived board-cell mass.
- Each family has an explicit presentation contract: `scale`, vertical correction, contact-shadow scale, and collection-thumbnail scale.
- Normalize **perceived mass**, not raw PNG/WebP bounds. Tall/skinny and wide/low characters should feel equally important on the board.
- Default target is roughly 72–82% useful visual occupancy without clipping, with exceptions for inherently horizontal silhouettes.
- Character art must use a shared ground/contact-shadow language even when the source render included its own lighting.
- Per-family runtime transforms are presentation data, not gameplay data, and must not change hit boxes or merge rules.
- Missing/corrupt art must fail gracefully in UI rather than showing browser broken-image chrome.

Current Tier-1 runtime normalization intentionally reduces Tung Wood and increases Camera Dude/Coffee Ballerina relative to their source framing. Re-tune only from real runtime captures, not from isolated asset previews.

### Style-anchor workflow
For Gemini generations:
1. Attach the approved character image as **identity reference**.
2. Attach 2–3 approved Brainmerge characters as **style references**.
3. Ask for a controlled game-style evolution, not a 1:1 redraw and not a generic redesign.
4. Keep the same material language, lighting, level of stylization, and compact silhouette.

## Tier-to-form progression lock
A new full character render is **not** created for every tier. One visual form spans three gameplay tiers.

- Tiers 1–3 = Form A / Base
- Tiers 4–6 = Form B / Evolved
- Tiers 7–9 = Form C / Elite
- Tiers 10–12 = Form D / Legendary
- Tiers 13–15 = Form E / Mythic

Within each three-tier band, reuse the same base character art and communicate progression with lightweight reusable treatment rather than a new character model/sprite:
- first tier in band: clean form;
- second tier in band: subtle rank mark / small aura / one star;
- third tier in band: stronger rank mark / aura / two stars.

The transitions 3→4, 6→7, 9→10, and 12→13 are major evolution moments and receive a genuinely new character form plus stronger merge/reveal feedback.

This cadence can continue beyond Tier 15 in additional three-tier bands if the progression design requires it. Avoid committing to an arbitrary maximum tier in the art pipeline.

### Evolution budget
- Each new form should preserve the family identity and introduce only a few major upgrades.
- Do not spend all possible visual escalation in early forms; later forms must still have room to become more absurd, rare, and desirable.
- Prefer reusable auras, badges, particles, frames, and rank marks for within-form progression.
- Reserve full Gemini-generated character renders for genuine form changes.

### Avoid
- Generic AI/casual mascot redesign that destroys recognition.
- Photorealism.
- Flat placeholder UI art.
- Random ornaments/accessories without gameplay purpose.
- Style drift between characters.
- Overly detailed backgrounds in character assets.
- One unique full character render for every gameplay tier.

## Current style anchors
- Camera Dude
- Toilet Buddy
- Sigma Rock
- Rizz Head
- Shark Sneakers
- Crocodile Bomber
- Coffee Ballerina
- Tung Wood
