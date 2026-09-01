# Brainmerge Roadmap — Recovery First

## Current phase
Brainmerge is temporarily in **P0 repository recovery / architecture stabilization**.

Do not continue normal feature expansion until the actual owner-approved current local build is recovered into GitHub and reconciled with existing branches.

## P0.0 — Recover the real current product state
### Goal
Establish one canonical branch containing the game the owner is actually using now.

### Required actions
- inspect local `git status`, branches and worktrees;
- create `recovery/local-current-2026-09-01` from the exact current working state;
- commit all intended source/assets/docs, excluding secrets/cache/temp output;
- push the recovery branch without force-pushing `main`;
- compare recovery vs published `main` vs PR #5.

### Acceptance
- GitHub contains the current UI where Collection and Brain Lab are top-level systems rather than permanent right-side cards;
- any existing rewarded-ad boost work is present or explicitly confirmed absent;
- no local intended changes remain stranded in another worktree;
- screenshots from the recovery branch match the game the owner expects.

## P0.1 — Reconcile branch history
### Inputs
- published `main` (`9c2dad...` pre-audit baseline);
- recovered local-current branch;
- PR #5 / `campaign-world1-data-driven-v1`.

### Goal
Create one reconciliation branch from the recovered current product state.

### Rules
- do not reset the recovered UI back to old `main` merely to satisfy tests;
- selectively integrate useful data-driven Campaign work from PR #5;
- do not reimplement PR #5 from memory;
- keep save compatibility deliberate;
- generated `build/` never decides source behavior.

## P0.2 — Replace stale UI contracts/tests
Remove tests that require the obsolete permanent right rail or obsolete three-button mobile dock if those are not part of the recovered design.

Add browser/product contract coverage for:
- Collection top-level entry and panel;
- Brain Lab top-level entry and panel;
- intended desktop and mobile composition;
- no stale `.right-rail` layout unless explicitly retained for another feature;
- focus/scroll preservation during passive state updates.

## P0.3 — Mission Claim regression
Published main core/wiring is correct but browser coverage is incomplete.

Add a real Chromium transaction test:
1. create/earn a claimable mission;
2. open Missions in the recovered current UI;
3. click Claim Reward;
4. verify exact coin delta;
5. verify `missionIndex + 1`;
6. verify next mission rendering;
7. verify previous reward cannot be duplicated;
8. repeat on mobile/touch composition.

Do not diagnose/fix isolated CSS transforms without reproducing against the recovered full stylesheet stack.

## P0.4 — Rewarded-ad boost recovery/implementation
Rewarded boost functionality described by the owner is absent from published `main`.

First recover any existing local implementation. If none exists, implement after reconciliation.

Minimum contract for the timed income boost:
- rewarded-only activation;
- x2 passive income and click/clicker income for 15 minutes where click income exists in the recovered game;
- absolute expiry timestamp in canonical save;
- remaining-time display;
- active / available / loading / unavailable states;
- reload resumes remaining duration rather than resetting;
- no reward on ad close/error without rewarded callback;
- watchdog timeout prevents permanent `adBusy` lock;
- visual dev fixture can render the card without granting fake production rewards;
- EN/RU parity;
- never mandatory for base progression.

Other approved ad rewards can be layered after the timer foundation is correct.

## P0.5 — Fix confirmed technical defects
- correct high-tier pointer reject FX so only actual terminal/non-mergeable states reject;
- unify Local/Yandex safe-save key/migration behavior;
- add cloud/local freshness arbitration;
- add ad callback watchdog;
- enforce generated `build/` parity or stop committing generated output;
- replace localized-text identity lookup with stable data IDs in Campaign UI.

## P1 — Stabilize rendering architecture
### Goal
Stop rebuilding the entire application DOM on normal passive ticks.

### Work
- introduce stable app shell;
- split HUD update from board/panel rendering;
- preserve board DOM/focus/pointer identity;
- make panels explicit feature components/controllers;
- reduce MutationObserver lifecycle glue;
- serialize state transitions through an app controller.

### Acceptance
- a passive income tick does not replace board/panel nodes;
- dragging cannot be interrupted by unrelated passive re-render;
- open panel and scroll position survive passive updates;
- Mission/Brain Lab controls remain stable under repeated ticks.

## P1.1 — Split large source modules by ownership
Do not split merely because a file exceeds a line threshold.

### Main game
Split `game.ts` into state/save/merge/economy/missions/upgrades/hints.

### Application
Split `main.ts` into bootstrap/controller/lifecycle/persistence/platform coordination.

### UI
Split `game-view.ts` into Board, Missions, Collection, Brain Lab, Rewarded and shell/top-actions feature views.

### Campaign
Use the PR #5 generalization as input, then split World 1 Campaign run concerns into config/state/board/orders/progression/presentation.

## P1.2 — CSS consolidation
Current CSS has overlapping structural ownership and extensive `!important` use.

Target one structural owner per concern:
- tokens/base;
- shell/top actions;
- board;
- missions;
- collection;
- brain lab;
- rewarded;
- campaign;
- FX;
- responsive composition;
- accessibility.

Remove dead legacy 4×2/first-eight atlas rules after visual verification of the current 6×3 T1–T18 atlas.

## P2 — World 1 Campaign expansion
After repository/UI stability is restored:
1. integrate/generalize World 1 Location engine;
2. Sneaker Garden remains the reference complete Location;
3. Toilet Pond;
4. Watermelon Grill;
5. Hose Tunnels;
6. Gnome Yard;
7. Mushroom Field;
8. Backyard Core;
9. persistent three-phase World 1 Raid;
10. World 1 completion/persistence QA.

Sequential Location unlock should use permanent prior-Location restoration state. Campaign remains isolated from the main board/economy except explicitly designed permanent meta interactions.

## P3 — Collection Rewards and Prestige transactions
Storage fields exist in published save v6, but actual product transactions remain pending.

Implement:
- Collection milestone claim definitions and exact-once claims;
- Prestige eligibility;
- confirmation showing reset vs preserved state;
- Brain Cell award;
- reset transaction;
- permanent Brain Cell spend tree;
- proof that Campaign progress survives Prestige;
- save migration only if the schema actually changes.

## P4 — World 2 validation
After World 1 and meta loop are stable:
- validate World 2 map/state semantics;
- Traffic Lock modifier;
- seven persistent Locations;
- World 2 Raid;
- world unlock from World 1 Raid completion.

## P5 — Later worlds / live product systems
Only after the above loops are proven:
- Worlds 3–8;
- rarity/shiny treatment if justified;
- additional rewarded placements based on retention/economy data;
- analytics/live-ops surfaces;
- leaderboards/payments if portal/product requirements justify them.

## Verification gates for every structural merge
At minimum, relevant work must run:
- TypeScript build;
- locale parity;
- deterministic tests;
- local/Yandex package integrity;
- runtime Chromium smoke;
- RC/accessibility smoke;
- motion smoke when interaction/FX changed;
- Campaign smoke when Campaign changed;
- Yandex smoke when platform/ads/save changed.

For UI architecture changes also require approved desktop + mobile screenshots from CI artifacts.

## Current do-not-do list
Until recovery/reconciliation completes:
- do not force-push `main`;
- do not delete PR #5;
- do not restore right-rail Collection/Brain Lab to make old tests pass;
- do not implement new major features on stale `main`;
- do not hand-edit `build/`;
- do not add another CSS override layer as a permanent fix;
- do not claim Mission Claim or rewarded boosts fixed without a real browser transaction test.