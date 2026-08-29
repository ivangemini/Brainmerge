# Active Session — Brainmerge

## Current objective
Drive Brainmerge to production-ready state using `docs/ROADMAP.md`, completing the next unfinished production block autonomously, validating it, then continuing to the next viable block.

The current gameplay direction is merge-idle rather than pure merge: characters produce coins, coins fund either more Brain Boxes or permanent efficiency upgrades, and first discovery of every new tier still happens through merging.

## Completed foundation
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge board with touch/mouse and tap/drag flows;
- one sequential T1-T8 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- identical-character merge -> exactly one next-tier identity;
- persistent `maxDiscoveredTier` Collection;
- two ready T1 pairs on fresh save;
- cumulative eight-step first-cycle mission journey;
- best-merge crowded-board hint;
- chain-aware true-deadlock Rescue;
- merge/discovery instant coin rewards;
- EN/RU localization architecture and current parity;
- local + Yandex platform adapters, rewarded/fullscreen capability paths, lifecycle calls and persistence;
- procedural merge/spawn/reward/rescue feedback;
- Yandex packaging + CI artifact/size gate;
- approved standalone T1 Toilet Buddy runtime art and shared-atlas fallback for T2-T8;
- responsive/reduced-motion presentation layers for chain, missions and existing board UI.

## Production economy / idle loop implemented
- save schema upgraded to **v5** with migration from every previous shipped schema v1-v4;
- every character now has centralized passive production:
  - T1 3/min;
  - T2 7/min;
  - T3 16/min;
  - T4 36/min;
  - T5 82/min;
  - T6 185/min;
  - T7 420/min;
  - T8 950/min;
- every next tier produces more than two previous-tier pieces combined, so a merge is always production-positive;
- paid Brain Box pricing is now `ceil(20 × 1.045 ^ paidBoxes)`;
- rewarded Brain Box is free and never increments `paidBoxes` or paid-box inflation;
- Brain Boxes can rebuild discovered tiers but are capped to `maxDiscoveredTier`, so they can never reveal a new character first;
- Brain Lab upgrade tree added:
  - Base Drop Tier: T1 -> T4, discovery-gated, costs 600 / 3000 / 15000;
  - Lucky Drop: +1-tier chance 0 / 5 / 10 / 16 / 23 / 30%, costs 200 / 500 / 1200 / 3000 / 7500;
  - Brain Income: x1 / 1.15 / 1.32 / 1.52 / 1.75 / 2 production, costs 250 / 700 / 1800 / 5000 / 14000;
  - Offline Storage: 2 / 4 / 6 / 8 / 12h cap, costs 300 / 900 / 2500 / 7000;
- online passive income uses elapsed time plus fractional `incomeRemainder` rather than frame count;
- actions settle elapsed production before changing board composition or income multiplier, preventing retroactive higher-rate earnings;
- hide/pagehide settles and persists state;
- resume/load converts elapsed time into capped `pendingOfflineCoins`;
- offline production uses an explicit Collect action and cannot be double-claimed;
- runtime accounting cursor never moves backward, blocking duplicate income after device clock rollback;
- invalid/negative paid-box, upgrade, pending-income, remainder and timestamp fields sanitize safely;
- legacy players begin at zero paid-box inflation because old schemas cannot distinguish paid/rewarded Box history;
- HUD now shows total production/min;
- occupied board cells show their individual production rate;
- paid Brain Box CTA shows dynamic price;
- Brain Box profile shows base tier, Lucky chance and paid-purchase count;
- Brain Lab displays level/effect/cost/lock/max states for all four upgrades;
- offline reward banner shows pending amount and explicit Collect CTA;
- new economy UI has responsive desktop/compact/mobile CSS in `public/economy-loop.css`;
- all new player-facing economy/upgrade/offline copy added in EN/RU.

## Validation completed
- CI #84 on commit `3673c332524ffe599e9fa111ebbb00beb981da14` completed successfully;
- TypeScript build passed;
- EN/RU locale parity passed;
- deterministic gameplay/economy tests passed;
- Yandex package passed;
- artifact upload passed;
- tests cover production-positive tier ladder, escalating paid Box price, rewarded Box non-inflation, discovery-capped upgraded drops, upgrade locks/costs, online fractional accrual, capped explicit offline reward, no double claim, clock rollback protection, v1-v5 migration/sanitization, missions, Collection, deadlock/hints and a simulated fresh-save -> T8 run without mandatory rewarded ads or negative coins.

## Canonical documents
- `docs/ROADMAP.md` — production-ready roadmap and execution order.
- `docs/GAMEPLAY_AND_PROGRESSION.md` — current merge-idle/economy contract.
- `docs/ARCHITECTURE.md` — current v5 state/time/platform architecture.
- `docs/ART_BIBLE.md` — visual source of truth together with approved Figma targets.

## Intentional limits / blockers
- T2-T8 still use the shared atlas until approved standalone assets are available; do not fabricate replacements.
- Real browser screenshot QA at 1440x900, compact landscape and narrow mobile is still required before declaring presentation production-ready.
- Automatic interstitial cadence remains disabled until real session pacing is reviewed.
- Prestige/rebirth remains deferred until the new production economy and return-session pacing are validated; do not add it merely to extend progression.
- One primary currency (coins) remains intentional.

## Next execution blocks
1. harden persistence for the new time-based economy with periodic visible-session autosave and regression coverage around save snapshots/resume boundaries;
2. update `docs/ROADMAP.md` completion state after the validated economy block;
3. perform real runtime visual/interaction QA when a browser capture path is available and correct Upgrade Lab/offline/production-label layout deltas;
4. build the return-session retention layer around offline reward + an actionable next goal without adding a second currency;
5. integrate approved standalone T2-T8 assets as they become available;
6. complete final Yandex/release hardening and fresh-save + migrated-save release-candidate smoke passes.
