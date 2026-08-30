# Brainmerge — Platform & Localization Contract

## Distribution
Brainmerge is browser-first and portal-agnostic. Yandex Games is the first implemented production adapter, not a gameplay dependency.

Platform integrations expose capabilities for ads, rewarded ads, cloud save, leaderboards, payments and lifecycle. Current adapters:
- `local` — localStorage development fallback, no monetization capabilities;
- `yandex` — Yandex SDK, safe storage fallback, player cloud save, rewarded/fullscreen ads, locale signal and Loading/Gameplay lifecycle.

Yandex cloud writes remain debounced during ordinary activity; safe/local storage is written immediately so progress does not depend on a cloud round-trip.

Campaign, Collection Rewards and Prestige are **platform-neutral core systems**. They must persist inside the same versioned game save and must not call Yandex SDK APIs directly.

## Save evolution
Current runtime schema is v5. The planned Campaign/Prestige/Collection Rewards expansion should migrate coherently to v6.

New permanent meta fields must travel through the existing `PlatformAdapter.saveState()` path:
- Collection Reward claims;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- Campaign stage/world/star progress;
- optional active Campaign run snapshot if resumable stages are explicitly supported.

Do not create portal-specific or unversioned localStorage state for these systems.

## Localization
English (`en`) and Russian (`ru`) are mandatory production locales with 100% key parity. Player-facing source uses localization keys instead of hardcoded sentences.

The new meta/campaign layer must localize:
- Campaign/world/stage names;
- objective names/descriptions;
- star/mastery conditions;
- boss names and objective cards;
- reward/claim states;
- Collection Rewards copy;
- Prestige eligibility/confirmation/result copy;
- Brain Cell/meta-upgrade names/effects;
- reset/preserve explanations and lock reasons.

Generated Campaign environments, bosses, icons and emblems must contain **no baked player-facing text**. World names and numbers remain live localized DOM/UI so EN/RU and future languages can share the same art.

The localization architecture remains extensible to future languages without gameplay/screen forks. Platform locale signals normalize into supported locales and fall back to English.

Current automated parity validation must remain green after every new key. Campaign/Prestige runtime screenshot QA should include Russian at phone width because longer objective/reward text is a likely overflow risk.

## Input baseline
Touch + mouse are first-class. Keyboard remains additive desktop UX. Gamepad stays optional unless a future portal requires it.

Campaign requirements:
- map/stage selection must be touch-friendly;
- stage board uses the same pointer/touch/keyboard interaction primitives as the main board;
- Prestige confirmation cannot be accidentally triggered by a global shortcut;
- Campaign sheets/dialogs must preserve visible keyboard focus and Escape/back behavior where applicable;
- all coarse-pointer production controls stay at least 44×44 CSS px where practical.

## Ads / progression safety
Rewarded ads remain optional acceleration. Campaign stage completion, boss unlocks, Collection Rewards and Prestige must never require an ad callback to progress.

If future Campaign rewards offer an optional rewarded multiplier, the base earned reward must commit correctly without the ad and must never double-claim on close/error/reload.
