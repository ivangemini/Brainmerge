# Brainmerge Architecture — Browser Production Runtime

## Decision
Use dependency-light browser TypeScript + DOM/CSS. Keep deterministic gameplay/economy/save rules independent from rendering and portal SDKs so the same canonical state can run on local web, Yandex Games and future web portals through adapters.

## Boundaries
- `src/core/` — deterministic merge, progression, economy, idle-income and save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD/mission/upgrade rendering and pointer/touch interaction.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters, persistence, ads and lifecycle capability detection.
- `src/feedback/` — non-authoritative audio/particle feedback.
- `public/assets/` — runtime art derived from approved character assets.
- `public/chain-polish.css` — sequential-chain presentation states.
- `public/mission-journey.css` — first-cycle mission presentation.
- `public/economy-loop.css` — production, offline reward and Brain Lab presentation.

## Canonical state ownership
`GameState` is the only authoritative progression/economy snapshot. UI never owns currency, production, upgrade or discovery truth. Platform adapters persist the same state; they do not modify gameplay rules.

Current schema is **version 5**.

Persistent v5 economy fields include:
- `paidBoxes` — successful paid Brain Box purchases only; drives escalating paid-box price;
- `upgrades` — Base Drop Tier, Lucky Drop, Brain Income and Offline Storage levels;
- `incomeRemainder` — fractional passive income carried between deterministic accrual calls;
- `lastAccrualAt` — last timestamp already accounted for;
- `pendingOfflineCoins` — capped offline income waiting for explicit collection.

`sanitizeState()` accepts v1-v5 saves and normalizes them to v5.

Migration guarantees:
- legacy family IDs remain the same identity but normalize to canonical chain tiers;
- saved discovery is clamped to the runtime T1-T8 chain;
- old `missionClaimed=true` maps to mission step 2;
- v4 mission index is preserved/clamped;
- legacy saves begin at zero `paidBoxes` because old data cannot distinguish paid from rewarded Box history;
- new upgrades default to level 0;
- invalid/negative economy values are clamped;
- a persisted timestamp in the future is normalized on load;
- runtime-only selection/message state is never restored.

## Time / passive-income model
Passive income is computed from elapsed time, not from frame count.

Before an action changes board composition or an income multiplier, runtime settles online income up to `Date.now()`. This prevents a newly purchased upgrade or newly merged high-tier unit from retroactively earning at its new rate for earlier elapsed time.

While visible, the runtime accrues online income on a coarse interval. On hide/pagehide it settles and persists state. On resume/load, elapsed time is converted to `pendingOfflineCoins`, capped by the current Offline Storage level. Collection is explicit and zeroes the pending value, preventing double collection.

The accounting cursor never moves backward inside a running state. A device clock rollback therefore cannot create a second copy of already credited elapsed time.

## Brain Box / discovery model
The paid Brain Box price is derived from `paidBoxes`. Rewarded Brain Boxes do not increase that counter.

Box upgrades may rebuild already-discovered tiers, but `spawnTier` is always clamped to `maxDiscoveredTier`. Therefore the first copy of a new tier can only be created by merging two identical pieces from the previous tier.

This keeps the merge reveal as the progression gate while allowing late-game rebuilding to accelerate.

## Platform model
Common runtime depends only on `PlatformAdapter`.

- Local development uses `LocalPlatformAdapter`.
- Yandex Games uses `YandexPlatformAdapter` for SDK initialization, locale signal, local/cloud persistence, rewarded/fullscreen ads and LoadingAPI/GameplayAPI lifecycle reporting.
- Paid/rewarded gameplay semantics remain in `src/core/`; adapters only expose capabilities and ad/persistence primitives.

`index.html` uses an `auto` platform hint. Distribution packages may explicitly select Yandex or use `?platform=yandex` for integration testing. Future portals add adapters rather than gameplay forks.

## Current gameplay runtime
- 6x5 touch/mouse board;
- one canonical T1 -> T8 character chain;
- two identical characters merge into the next identity;
- per-tier passive coin production with every merge production-positive;
- escalating paid Brain Box cost;
- optional rewarded Brain Box that does not inflate paid price;
- Base Drop Tier / Lucky Drop / Brain Income / Offline Storage upgrades;
- merge-first character discovery;
- capped explicit offline-reward flow;
- persistent Collection discovery;
- cumulative eight-step first-cycle mission journey;
- crowded-board best-merge hint;
- chain-aware true-deadlock Rescue;
- save migration through v5;
- EN/RU player-facing string parity;
- responsive touch/mouse UI and reduced-motion handling.

## Current content boundary
The chain ends at T8 Tung Wood. Toilet Buddy has approved standalone runtime art. Camera Dude through Tung Wood still use the shared character atlas until their approved standalone assets are integrated.

Extending character content does not require changing the merge/economy architecture. Prestige/rebirth remains intentionally deferred until the production economy and return-session pacing are validated.
