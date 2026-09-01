# Brainmerge Art Bible

## Status
Visual style remains locked, but the repository is currently recovering a newer product layout that is not represented by published `main`.

**Important UI contract:** Collection and Brain Lab are top-level systems in the owner-approved current product. Do not treat the published permanent right rail as visual canon and do not restore it merely because old screenshots/tests contain it.

See `REPOSITORY_AUDIT_2026-09-01.md`.

## Core visual direction
**Toy-like stylized 3D casual-game art.**

Required:
- rounded, compact, collectible proportions;
- soft/glossy materials with selective tactile texture;
- bright but controlled color;
- clean studio-style lighting and contact shadows;
- strong readability at mobile gameplay size;
- playful/kid-friendly absurd brainrot rather than horror;
- polished premium mobile-game finish.

Avoid:
- photorealism;
- generic AI mascot drift;
- fantasy/RPG drift;
- dense ornamental noise;
- baked player-facing text/progress in raster art;
- art that dictates hitbox/layout coordinates.

## Character identity
A character’s defining joke/identity should read in roughly half a second.

Identity reference controls:
- anatomy;
- defining hybrid concept;
- face/silhouette;
- signature elements.

Brainmerge style controls:
- proportions;
- material treatment;
- lighting;
- saturation;
- polish.

Do not use style references to overwrite character identity.

## Canonical T1–T18 chain
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

Runtime uses the production 6×3 shared character atlas. Per-character runtime presentation data may normalize perceived size/vertical position/shadow/Collection scale without changing hitboxes or gameplay.

Remove historical 4×2/first-eight CSS routing after recovery; it is not part of the art direction.

## UI visual language
Core palette/language:
- cream/warm background;
- cyan/teal board/economy accents;
- purple meta/collection accents;
- orange/yellow mission/reward/primary CTA accents;
- rounded toy-console construction;
- soft bevels;
- clear active/locked/claimable states.

Production icon anchors:
- Missions;
- Collection;
- Rewards;
- Brain Lab;
- Campaign;
- Prestige;
- Brain Cell.

### Top-level product composition
The current product direction uses a top-level navigation/action area for systems such as Collection and Brain Lab.

Rules:
- do not reserve a permanent desktop right rail for Collection + Brain Lab unless explicitly re-approved;
- top-level entries must remain readable without dominating the board;
- opening a system may use a panel/sheet/modal appropriate to viewport;
- desktop and mobile can use different presentation mechanics while exposing the same systems;
- panel open/closed state is code-owned, not inferred from CSS visibility;
- responsive CSS must not resurrect old card placement.

The Merge Board remains the primary toy object and visual focus.

## Rewarded-ad UI
Rewarded controls must look optional and beneficial, not mandatory.

The timed rewarded-boost card/surface described by the owner is not present in published `main`; recover the local version before redesigning it.

When present:
- show the actual benefit clearly;
- show remaining time for timed boosts;
- distinguish available/loading/active/unavailable;
- use a rewarded/video affordance without making the main progression CTA look inferior;
- never bake timers/reward amounts into raster art.

## Mission UI
Mission state hierarchy:
- title/objective;
- progress;
- reward;
- claimable CTA;
- completed journey state.

Claimable state may animate subtly, but the animation must not change hitbox or move the CTA outside its intended container.

Mission browser QA must click the real CTA; screenshots alone are not sufficient.

## Collection UI
Collection is a long-term discovery surface, not a permanent side decoration.

Rules:
- T1–T18 identity remains readable;
- locked/current/next states are code-owned;
- Collection discovery persists independent of current board occupancy;
- top-level entry uses approved Collection icon;
- detailed Collection surface may use grid/modal/sheet according to recovered current design.

## Brain Lab UI
Brain Lab is an actionable economy system.

Rules:
- use approved Brain Lab icon/material language;
- upgrade level/effect/cost/lock are live code-owned text/state;
- cards read as collectible modules rather than settings form;
- top-level entry replaces permanent right-rail ownership in current product direction.

## Small icon rules
- source target: 512×512 transparent;
- one dominant object/silhouette;
- no baked text;
- readable at 20–32 px and 48–64 px;
- consistent material/lighting/visual weight;
- avoid tiny detail that disappears in top-level navigation.

# Campaign visual direction
Campaign remains visually Brainmerge, not a separate fantasy/RPG game.

## World art
Source target:
- 1536×864;
- no text/numbers/logos/buttons;
- center-safe responsive composition;
- broad readable forms;
- negative space for code-owned route/Location UI;
- environment-wide surreal infection, not a normal landscape with a few meme props.

Working themes:
1. Backyard Brainrot Zone
2. Surreal Brainrot City
3. Meme Factory
4. Italian / Mediterranean Chaos
5. Sky Brainrot
6. Surreal Brain Lab
7. Space Brainrot
8. Brainverse Core

## Persistent Location treatment
Campaign nodes 1–7 are persistent Locations, not one-shot short stages.

Reusable assets:
- `stage-normal.webp` — Location/Stabilize family;
- `stage-challenge.webp` — Deliver treatment;
- `stage-elite.webp` — Landmark/Mastery treatment;
- `stage-locked.webp` — locked treatment;
- `stage-boss.webp` — World Raid.

Code owns Location number/name/restoration %, phase state, Landmark level, world %, locks and Raid progress.

## Landmark direction
Sneaker Garden proves the code/state Landmark loop through Giant Sneaker Flower Bed Lv1→Lv3.

For remaining World 1 Locations, prefer:
- existing world art;
- code-owned highlight/progress treatment;
- reusable marker assets.

Generate dedicated Landmark overlays only if gameplay testing proves the restoration payoff is unreadable without them.

## Boss / World Raid art
Boss target:
- transparent 1024×1024;
- one complete readable fused creature;
- stronger presence than board units;
- absurd viral-surreal fusion;
- playful, not horror;
- no HP/progress UI baked in.

Approved directions:
- World 1: flamingo + lawn machine + garden/gnome + sneaker fusion;
- World 2: pigeon + vending-machine/city-sign + sneaker fusion.

## Prestige visual direction
Prestige communicates permanent rebirth/reset, not destruction.

- Brain Cell must be distinct from coins;
- confirmation text/state remains live code;
- art existing in repository does not imply implemented Prestige transaction.

## Technical-art pipeline
1. validate source dimensions/transparency;
2. remove accidental background where needed;
3. normalize crop without clipping;
4. downsample to runtime target;
5. encode WebP appropriately;
6. validate at actual rendered size;
7. run package integrity + Chromium screenshot QA.

## Style anchors
Character anchors are the approved production T1–T18 set.

UI anchors are the approved Missions, Collection, Rewards, Brain Lab, Campaign, Prestige and Brain Cell assets plus the recovered current top-level UI once it is pushed.

Campaign anchors are approved World 1/2 environments and bosses.

During repository recovery, **do not use the stale published right-rail screenshot as a composition reference**.