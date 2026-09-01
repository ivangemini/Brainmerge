# Brainmerge — Platform & Localization Contract

## Distribution
Brainmerge is browser-first and portal-agnostic. Yandex Games is the first implemented production adapter, not a gameplay dependency.

Current adapters:
- `local` — localStorage development/runtime fallback, no monetization capabilities;
- `yandex` — Yandex SDK integration with safe/local storage fallback, player cloud save, rewarded/fullscreen ads, locale signal and loading/gameplay lifecycle.

Platform-specific behavior stays behind `src/platform/` adapters and capability checks. Core gameplay/Campaign/meta code must not call Yandex APIs directly.

## Canonical persistence
Current runtime schema is **save v6**.

The same versioned `GameState` travels through `PlatformAdapter.saveState(state, flush?)` for local and Yandex persistence.

Save v6 currently includes:
- main run/economy/discovery/mission/passive state;
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade-level fields;
- permanent Campaign world/Location/Landmark/Raid progress;
- optional resumable `CampaignRunState`.

Valid v1-v5 data migrates into v6 through core sanitization. Do not create portal-specific or unversioned localStorage side state for Campaign, Prestige or Collection.

## Campaign platform neutrality
Campaign is an isolated core system:
- Campaign board state is separate from the main board;
- delivery consumes Campaign units only;
- Campaign Supply does not spend ordinary coins or alter paid Brain Box inflation;
- persistent Campaign progress is stored in the same canonical save;
- Campaign progress must remain valid regardless of whether the save came from local or Yandex storage.

The first complete playable Location is World 1 / Sneaker Garden through Stabilize, Deliver, Restore and Mastery.

## Build / published repository contract
Authoritative source is TypeScript under `src/`.

`npm run build` compiles to `build/` and validates locale parity. The current repository also commits the generated `build/` output so the published GitHub state contains a current runnable snapshot.

`npm run serve` rebuilds before starting the local HTTP server. Generated output must never be hand-edited as the source of product behavior.

Packaging commands:
- `npm run package` — local portal package + structural checks + release audit;
- `npm run package:yandex` — Yandex package + structural checks + release audit.

`node_modules/`, `dist/`, `runtime-artifacts/` and `.DS_Store` are ignored.

## Localization
English (`en`) and Russian (`ru`) are mandatory production locales with 100% key parity.

Player-facing runtime copy must use localization resources rather than hardcoded gameplay/UI sentences.

Campaign/meta localization covers:
- world and Location names;
- phase/objective labels;
- Landmark state;
- World Restored / Raid gate / Raid status;
- Campaign Supply and run-state actions;
- reward/claim states;
- Collection Rewards;
- Prestige eligibility/confirmation/result copy;
- Brain Cell/permanent-upgrade names and effects;
- reset/preserve explanations and lock reasons.

Generated world environments, bosses, icons and emblems must contain no baked player-facing text. World names, numbers, progress and rewards remain live localized UI.

Platform locale signals normalize into supported locales and fall back to English.

## Input baseline
Touch + mouse are first-class. Keyboard is additive desktop UX. Gamepad remains optional unless a future portal requires it.

Campaign requirements:
- map/Location selection is touch-friendly;
- Campaign board uses the same pointer/touch/keyboard interaction principles as the main board;
- modal/sheet flows preserve visible keyboard focus and usable back/Escape behavior;
- coarse-pointer production controls stay at least 44×44 CSS px where practical;
- future Prestige confirmation cannot be accidentally triggered by an unrelated global shortcut.

## Ads / progression safety
Rewarded ads remain optional acceleration.

Campaign phase completion, World Raid unlocks, Collection Rewards and Prestige must never require an ad callback to make earned progress valid.

If future Campaign rewards use optional rewarded multipliers:
- base earned progress/reward must commit without the ad;
- ad close/error/reload must not double-claim;
- ad state must not become a second gameplay save system.

## Validation expectations
Any platform/localization change should preserve:
- EN/RU key parity;
- save-v6 compatibility;
- local/Yandex adapter boundaries;
- touch/mouse behavior;
- package integrity;
- browser runtime smoke where relevant.

Documentation does not substitute for running those checks.
