# Brainmerge — Platform & Localization Contract

## Distribution
Brainmerge is browser-first and portal-agnostic. Yandex Games is the first implemented production adapter, not a gameplay dependency.

Platform integrations expose capabilities for ads, rewarded ads, cloud save, leaderboards, payments and lifecycle. The current adapters are:
- `local` — localStorage development fallback, no monetization capabilities;
- `yandex` — Yandex SDK, safe storage fallback, player cloud save, rewarded/fullscreen ads, locale signal and gameplay/loading lifecycle.

Yandex cloud writes are debounced because player data APIs are rate-limited. Safe/local storage is written immediately so progress does not depend on a cloud round-trip.

## Localization
English (`en`) and Russian (`ru`) are mandatory production locales with 100% key parity. Player-facing UI/gameplay source uses localization keys instead of hardcoded sentences.

The localization layer supports future languages without changes to core gameplay or screen architecture. Platform locale signals are normalized into supported locales and fall back to English when a locale is not yet shipped.

Current automated validation checks EN/RU key parity. Pseudolocalization/runtime screenshot QA remains a visual-release gate.

## Input baseline
Touch + mouse are first-class. Tap-to-select and pointer drag are both supported. Keyboard shortcuts are additive desktop UX. Gamepad remains optional unless a future portal requires it.
