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

### Brain Lab / economy art

Approved economy artwork supplied for the production upgrade pass is normalized into one transparent runtime sprite strip:

`public/assets/ui/upgrade-ui-atlas.webp` — 200x40 RGBA WebP, five 40x40 tiles.

Tile order and semantic ownership are locked:

1. Base Drop Tier — Brain Box + upward tier cue;
2. Lucky Drop — lucky/clover + upward bonus cue;
3. Brain Income — production/growth cue;
4. Offline Storage — clock/moon/storage cue;
5. Offline Reward — overflowing Brain Box / return reward cue.

The source renders are **presentation assets, not complete UI components**. Brain Lab remains DOM/CSS-driven in `src/ui/game-view.ts`: title, level, description, effect, price, lock reason, affordability, max state and purchase interaction all remain live code. `public/upgrade-art.css` maps atlas tiles onto the existing `.upgrade-card` states and decorates the existing `.offline-reward` component. Do not replace these stateful components with flattened screenshots or image-only buttons.

Runtime state treatment is also code-owned:
- affordable upgrades retain the existing actionable highlight and slightly lift/saturate the art;
- discovery-locked upgrades desaturate/dim the art while preserving the real lock reason;
- maxed upgrades keep the actual max state and add a lightweight completion mark;
- Offline Reward artwork never replaces the real amount, description or Collect button.

Compact/mobile behavior is part of the component contract. Legacy CSS that hid all side cards below 1100px is overridden for Mission, Collection and Brain Lab so the systems remain accessible. On narrow phone layouts Brain Lab is intentionally ordered before Collection after the board, because upgrades are an active economy action while Collection is informational.

Packaged PNG/WebP files are structurally validated by `scripts/check-package.mjs`; malformed/truncated raster files must fail the portal package gate instead of reaching runtime.

## Alignment contract

- Board characters are centered inside a common normalized 256x256 presentation canvas.
- Per-character `scale`, `shadowScale` and collection scale may adjust perceived visual mass; `yPercent` remains zero unless runtime screenshot QA proves a correction is required.
- Shark Sneakers remains the perceived-mass baseline and must preserve the complete quadrupedal silhouette including all four shoes.
- Board tile states share identical framing so state changes do not shift geometry.
- Desktop gameplay uses symmetric side rails around the centered board; compact layouts collapse side panels below the board instead of squeezing the board off-axis.
- Raster UI art decorates code-owned geometry/state; it must not become the source of hit areas, prices, progress, locks or localized text.

## Core merge-chain rule

The primary merge loop is now strictly sequential:

`2x Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood`

More precisely, two identical characters at one chain tier merge into one character at the next chain tier. Brain Box feeds only Tier 1. Higher characters are earned through merging, and Collection discovery persists once a tier has been reached.

Future alternate forms, prestige skins or evolved variants are separate progression systems and must not replace the readability of this core chain.
