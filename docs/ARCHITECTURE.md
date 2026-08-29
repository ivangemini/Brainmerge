# Brainmerge Architecture — Browser Production Runtime

## Decision
Use dependency-light browser TypeScript + DOM/CSS. Keep deterministic gameplay/economy/save rules independent from rendering and portal SDKs so the same canonical state can run on local web, Yandex Games and future web portals through adapters.

## Boundaries
- `src/core/` — deterministic merge, progression, economy, idle-income, next-action guidance and save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD/mission/upgrade rendering and pointer/touch interaction.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters, persistence, ads and lifecycle capability detection.
- `src/feedback/` — non-authoritative audio/particle feedback.
- `public/assets/` — runtime art derived from approved character/UI assets.
- `public/code-ui.css` — primary code-first component geometry and structural skin.
- `public/chain-polish.css` — sequential-chain presentation states.
- `public/mission-journey.css` — first-cycle mission presentation.
- `public/economy-loop.css` — production, offline reward and Brain Lab component styling.
- `public/upgrade-art.css` — approved Brain Lab/offline raster presentation only; it must not own responsive panel visibility/order or live state.
- `public/return-loop.css` — computed return-session/next-action presentation.
- `public/mobile-runtime.css` — final responsive composition authority for compact/tablet/phone layouts.
- `public/accessibility.css` — final focus-visible, coarse-pointer, touch-gesture and reduced-motion interaction layer.

## UI ownership contract
`GameView` owns live DOM structure and derives visible state from `GameState`: prices, levels, progress, lock reasons, affordability, labels, buttons and hit areas remain code-owned. Raster assets decorate those components; they never replace live UI with flattened screenshots.

CSS responsibilities are intentionally layered:
1. base/component geometry is code-driven;
2. feature/polish layers may change appearance and feature-specific states;
3. art layers may size/crop/filter approved raster assets but must not decide whether production components exist or where whole panels are ordered;
4. `mobile-runtime.css` owns final responsive panel composition and ordering;
5. `accessibility.css` is last so interaction affordances cannot be accidentally hidden by visual polish.

`tests/ui-contract.test.mjs` protects this contract. It verifies stylesheet order, keeps upgrade art out of responsive composition, requires Mission/Collection/Brain Lab to remain reachable at compact breakpoints, and checks that Brain Lab state/actions still originate from code.

The board is keyboard-operable without hidden economy actions. Enter/Space on a focused cell reuses the same select/move/merge path as pointer input; arrow keys move focus by board geometry; focus is restored after code-driven DOM rerenders; Escape clears selection. There is no global Space shortcut that spends coins.

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

While visible:
- presentation accrues income on a 5-second coarse tick;
- a 30-second autosave persists canonical foreground state without writing on every display tick.

At lifecycle boundaries:
- `visibilitychange -> hidden` settles income, stops GameplayAPI and requests `saveState(state, true)`;
- `pagehide` repeats the flush-safe boundary in case the browser closes instead of suspending;
- resume/load converts only elapsed time after `lastAccrualAt` into capped `pendingOfflineCoins`;
- duplicate resume events and clock rollback do not move the cursor backward and therefore cannot duplicate elapsed-time credit.

Offline collection is explicit. Claiming transfers `pendingOfflineCoins` once and zeroes it before persistence.

## Persistence model
`PlatformAdapter.saveState(state, flush?)` supports two write modes:

- normal saves are safe/local immediately and may debounce remote/cloud work;
- `flush=true` is reserved for lifecycle boundaries where a deferred cloud timer may never execute.

### Local
`LocalPlatformAdapter` stores the canonical snapshot synchronously through localStorage inside a best-effort async wrapper.

### Yandex
`YandexPlatformAdapter` writes safe/local storage immediately and debounces cloud `player.setData()` during ordinary activity. A flush save cancels any pending debounce timer and writes the newest queued snapshot with the Yandex flush flag.

If an older in-flight cloud write fails after a newer snapshot has already been queued, the failed old snapshot is not allowed to overwrite the newer pending state.

Automated platform tests cover:
- ordinary debounce;
- newest-snapshot replacement;
- immediate lifecycle flush;
- safe/local latest snapshot;
- cloud-first load with local fallback.

## Brain Box / discovery model
The paid Brain Box price is derived from `paidBoxes`. Rewarded Brain Boxes do not increase that counter.

Box upgrades may rebuild already-discovered tiers, but `spawnTier` is always clamped to `maxDiscoveredTier`. Therefore the first copy of a new tier can only be created by merging two identical pieces from the previous tier.

This keeps the merge reveal as the progression gate while allowing late-game rebuilding to accelerate.

## Return-session guidance
`nextActionHint(state)` is pure derived state. It does not add a save field or hidden progression counter.

Its priority is:
1. pending offline collection;
2. ready mission reward;
3. true deadlock Rescue;
4. free production-positive merge;
5. currently affordable permanent upgrades;
6. affordable Brain Box;
7. estimated minutes until the next Brain Box at current production;
8. completed-current-chain state.

The UI renders this as advisory `Next move` guidance after onboarding. The player remains free to ignore it.

## Platform model
Common runtime depends only on `PlatformAdapter`.

- Local development uses `LocalPlatformAdapter`.
- Yandex Games uses `YandexPlatformAdapter` for SDK initialization, locale signal, safe/local + cloud persistence, rewarded/fullscreen ads and LoadingAPI/GameplayAPI lifecycle reporting.
- Paid/rewarded gameplay semantics remain in `src/core/`; adapters only expose capabilities and ad/persistence primitives.

`index.html` uses an `auto` platform hint. Distribution packages may explicitly select Yandex or use `?platform=yandex` for integration testing. Future portals add adapters rather than gameplay forks.

## Current gameplay runtime
- 6x5 touch/mouse/keyboard board;
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
- computed return-session `Next move` guidance;
- crowded-board best-merge hint;
- chain-aware true-deadlock Rescue;
- save migration through v5;
- periodic autosave and lifecycle cloud flush;
- EN/RU player-facing string parity;
- responsive code-driven UI, focus-visible/coarse-pointer hardening and reduced-motion handling.

## Current content boundary
The chain ends at T8 Tung Wood. Toilet Buddy has approved standalone runtime art. Camera Dude through Tung Wood still use the shared character atlas until their approved standalone assets are integrated.

Extending character content does not require changing the merge/economy architecture. Prestige/rebirth remains intentionally deferred until the production economy is validated in real player sessions.
