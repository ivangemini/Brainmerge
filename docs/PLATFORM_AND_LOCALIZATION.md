# Brainmerge Platform, Persistence and Localization

## Status
Published `main` has a working local/Yandex adapter boundary and green Yandex package/browser smoke, but the repository audit found persistence and ad-lifecycle gaps that should be fixed during reconciliation.

## Platform abstraction
Gameplay/core code must not call portal SDKs directly.

`PlatformAdapter` owns:
- platform initialization;
- Game Ready / gameplay lifecycle;
- preferred locale;
- state load/save;
- rewarded/interstitial ads;
- future payments/leaderboards.

Current production adapters:
- local browser;
- Yandex Games.

## Boot contract
Boot order:
1. select platform adapter;
2. initialize SDK/persistence;
3. resolve locale;
4. load locale resources;
5. load and sanitize save;
6. account for elapsed time;
7. render interactive game;
8. emit platform Game Ready;
9. persist canonical state.

Game Ready must not fire before the first complete interactive render.

## Canonical save
Published schema is v6. All loaded external data must pass through `sanitizeState()` before use.

No feature should create an unversioned parallel local-storage save for authoritative gameplay/meta state.

## P0 persistence issue — storage-key split
Published adapters currently use different safe local keys:
- Local adapter: `brainmerge.save.v1`;
- Yandex safe storage: `brainmerge.save.v2`.

That is dangerous when Yandex SDK initialization fails and boot falls back to the Local adapter: the player can read/write a different slot from the normal Yandex local-safe copy.

### Target
Use one canonical safe-local namespace and migrate legacy keys explicitly.

Suggested approach:
- define the safe key in one persistence module;
- read newest valid candidate from known legacy/current keys;
- sanitize;
- persist into the canonical key;
- retire legacy key only after successful migration if desired.

## P0 persistence issue — cloud/local freshness
Published Yandex load prefers any cloud object over local safe storage. This can roll back a newer local snapshot if a cloud write was delayed/failed.

### Target save metadata
Add explicit freshness metadata, for example:
- monotonic `revision` incremented on authoritative transactions/persistence snapshots;
- `updatedAt` for diagnostics/tie-breaking.

On load:
1. read cloud candidate;
2. read local candidate;
3. sanitize both;
4. select the newest valid canonical snapshot;
5. reconcile/persist the winner to both stores when safe.

Do not compare unsanitized timestamps from arbitrary input as the only trust signal.

## Autosave/lifecycle
Current periodic save plus pagehide/visibility flush strategy is valid in principle.

Requirements:
- passive accounting cursor advances exactly once;
- hide/resume cannot double-credit offline/online time;
- lifecycle flush requests latest canonical state;
- cloud debounce never causes an older queued snapshot to overwrite a newer one.

## Rewarded ads
Reward is granted only after the platform rewarded callback.

Close/error without rewarded callback must produce no gameplay reward.

Gameplay API should pause while the ad is open and resume idempotently only when the page is visible.

### P0 ad issue — no watchdog
Published adapter promises depend entirely on SDK callbacks. A missing callback can leave the caller awaiting forever and `adBusy` stuck.

Add a watchdog timeout:
- bounded duration appropriate to portal behavior;
- resolve `false` on timeout;
- clear internal ad state;
- restore gameplay only if page is visible and lifecycle state permits;
- never synthesize a reward.

Add unit/browser coverage for “SDK never calls any callback”.

## Rewarded feature policy
Rewarded Brain Box and timed rewarded boosts are separate transactions.

Published `main` supports rewarded Brain Box only.

The owner-described timed boost system is not present in published `main`; recover local work before rebuilding it.

Timed boosts must:
- persist absolute expiry in canonical save;
- derive remaining time from `now`, not decrement a mutable counter as authority;
- survive reload/background transitions;
- never extend/duplicate from repeated render ticks unless the explicit transaction says so;
- expose available/loading/active/unavailable presentation states.

## Local development / visual fixtures
Production Local adapter should not fake portal rewards.

However, hiding all rewarded UI when `rewardedAds=false` makes local visual QA impossible.

Use a deliberate fixture/dev presentation path, such as query/config test mode, that can:
- render rewarded controls/cards;
- simulate success/failure in browser tests;
- remain impossible to confuse with production capability;
- avoid writing fake production reward state unless the fixture explicitly tests that transaction.

## Yandex package
Yandex package must:
- set platform hint to `yandex`;
- include `/sdk.js` loader;
- retain only relative packaged references except the SDK loader;
- pass asset/import integrity checks;
- remain below portal size limits;
- signal LoadingAPI/Game Ready at the correct time.

## Localization
Production locales:
- English;
- Russian.

Main runtime uses `locales/en.json` / `locales/ru.json`.
Campaign runtime currently also has `campaign-en.json` / `campaign-ru.json` resources.

### Parity
The main locale checker validates EN/RU main keys. Campaign parity is currently validated by Campaign tests.

Preferred consolidation:
- one locale validation script that checks all production locale domains;
- fail on missing keys in either language;
- optionally detect obviously unused/unknown keys in code-owned domains.

## Identity rule
Stable gameplay/domain identity must never depend on translated display text.

Campaign/UI elements should carry explicit stable ids such as `data-location-id` and communicate through typed IDs/snapshots. Localized text is presentation only.

## Error/fallback policy
When portal services are unavailable:
- gameplay remains playable where possible;
- rewarded controls report unavailable without granting reward;
- safe local persistence remains coherent with the same canonical key/schema;
- failure must not silently switch to an unrelated save slot;
- no platform error may corrupt canonical in-memory state.

## Required tests after recovery
1. Yandex cloud newer than local → cloud wins.
2. Local newer than cloud → local wins and reconciles.
3. Corrupt cloud + valid local → local wins.
4. Yandex init failure → fallback still sees canonical safe-local progress.
5. Rewarded success → one reward.
6. Close/error without reward → zero reward.
7. No callbacks → watchdog resolves safely and clears busy state.
8. Hidden-page ad close → gameplay remains stopped until visible.
9. Timed boost activation/reload/expiry uses absolute time.
10. EN/RU main + Campaign parity in one gate.