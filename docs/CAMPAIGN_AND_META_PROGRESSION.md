# Brainmerge Campaign and Meta Progression

## Status during repository recovery
Campaign product direction remains valid, but implementation is split across published `main` and unmerged PR #5.

Do not continue Campaign expansion until the current local product branch is recovered and PR #5 is reconciled.

## Product north star
Brainverse Campaign is long-term world restoration, not a ladder of disposable short stages.

Target structure:
- 8 worlds;
- 7 persistent Locations per world;
- 1 persistent World Raid per world;
- World Restored percentage;
- one Landmark per Location;
- persistent phase progress that survives ordinary sessions and Prestige.

Each Location progresses through:
1. Stabilize;
2. Deliver Orders;
3. Restore Landmark;
4. Mastery.

Legacy Normal/Challenge/Elite stage filenames are presentation compatibility details, not product semantics.

## Permanent progression model
Campaign progress belongs in canonical save state.

Per-Location permanent state is normalized phase progress:
- `stabilize`;
- `deliver`;
- `restore`;
- `mastery`.

World state includes:
- Location progress;
- Raid progress;
- Raid cleared state.

World/Location percentages shown in UI are derived from canonical progress, not independently stored presentation values.

## Campaign run isolation
Active `CampaignRunState` is temporary/resumable gameplay state stored inside the same canonical save.

Campaign run board must never alias the main board.

Campaign actions must not silently modify:
- main board cells;
- main coins;
- main XP;
- main merge count;
- paid Brain Box inflation.

Lifetime discovered tier may cap Campaign Supply/order targets but Campaign cannot reveal a new main-chain tier.

## Published `main` — complete Sneaker Garden reference
World 1 / Location 1, Sneaker Garden, is the reference complete four-phase slice.

### Stabilize — 0% → 20%
- isolated 6×5 board;
- four starting T1 units;
- six Overgrowth blockers;
- successful Campaign merge clears exactly one nearest eligible blocker;
- six clearing pulses commit Stabilize exactly once.

### Deliver — 20% → 45%
Reference max-T4 queue:
- T2;
- T2;
- T3;
- T4.

Matching delivery consumes only the selected Campaign unit. Partial cursor persists.

### Restore — 45% → 90%
Reference max-T4 queue:
- T2;
- T2;
- T3;
- T3;
- T4;
- T4.

Three exact-once two-order batches raise Giant Sneaker Flower Bed Lv1→Lv3.

Landmark perk:
- 25% baseline stronger Campaign Supply chance;
- +5 percentage points per Landmark level;
- 40% at Lv3.

### Mastery — 90% → 100%
Reference max-T4 queue:
- T3;
- T4;
- T4.

Five Overgrowth cells remain blocked and are not cleared by Mastery merges. Completion commits final 10% once.

## Published `main` limitation
Although Campaign domain definitions already list the first two worlds and their Locations, published runnable Campaign logic/UI remains strongly hard-coded around Sneaker Garden.

Do not implement six more copy-pasted `if locationId === ...` flows on this baseline.

## PR #5 — data-driven World 1 work
Open PR #5 / branch `campaign-world1-data-driven-v1` contains later work not merged into `main`.

It includes:
- World 1 Location run configs;
- shared order-tier derivation;
- location-specific Overgrowth layouts;
- sequential Location unlock after prior Landmark restoration;
- Toilet Pond coverage;
- generalized World 1 launcher/UI work;
- compatible save-v6 public Campaign run API direction.

The branch has passing CI at its head but has diverged from current `main`.

### Integration rule
After the true current local product branch is pushed:
1. branch from recovered product state;
2. review/cherry-pick/rebase PR #5 changes by concern;
3. preserve recovered current top-level UI architecture;
4. rerun Campaign core/browser persistence tests;
5. close/supersede PR #5 only after its useful work is safely integrated.

## Target Campaign architecture
Split by responsibility:
```text
src/core/campaign/
  definitions.ts
  progress.ts
  save.ts
  run-state.ts
  run-board.ts
  run-orders.ts
  world1-config.ts
  presentation.ts
```

World 1 config should own:
- Location ID;
- order tier range/pressure;
- phase Overgrowth layouts;
- phase order counts/config;
- Landmark identity/perk configuration;
- modifier-specific values.

Generic run engine should own:
- board creation/sanitization;
- supply;
- move/merge;
- order delivery;
- exact-once phase commits;
- presentation snapshot.

## Campaign presentation contract
Core/domain owns stable identity and unlock/progress rules.

Presentation may own:
- map coordinates;
- world environment assets;
- decorative boss placement;
- responsive layout.

Presentation must receive/use stable IDs such as world/location id. Do not determine selected identity by matching localized visible names.

## World unlock / Raid direction
World Raid is persistent and unlocks only from canonical world restoration/Landmark requirements.

Next world unlock is derived from previous world Raid completion.

If a locked world remains visually previewable, UI/ARIA must call it a preview rather than presenting contradictory “locked but selectable” semantics. If previews are not intended, disable interaction.

## World 1 next sequence after recovery
1. integrate data-driven World 1 engine;
2. validate Sneaker Garden unchanged;
3. Toilet Pond;
4. Watermelon Grill;
5. Hose Tunnels;
6. Gnome Yard;
7. Mushroom Field;
8. Backyard Core;
9. persistent three-phase World 1 Raid;
10. world-complete persistence/UX.

## Meta progression
Published save v6 already contains foundation fields for:
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades;
- Campaign progress/run.

These storage fields are not proof of complete transactions.

Still pending unless recovered current code proves otherwise:
- Collection milestone claim transaction/UI;
- Prestige eligibility/confirmation/reset/reward transaction;
- Brain Cell spend tree;
- explicit test proving Campaign progress survives actual Prestige;
- polished meta navigation integrated with the recovered top-level UI.

## Prestige preservation contract
When Prestige eventually ships, the confirmation must state what resets and what persists.

Campaign world/Location/Landmark/Raid progress is permanent meta and must survive Prestige.

## Testing requirements
Campaign changes require:
- core deterministic tests;
- save sanitize/roundtrip tests;
- main-board isolation tests;
- exact-once phase progress tests;
- unlock tests;
- browser run persistence/reload tests;
- mobile/desktop screenshot QA;
- localized identity/state checks using stable IDs rather than translated text.

Do not advance roadmap status based only on a core branch if current product UI/launcher integration is not reconciled.