# Brainmerge — Platform & Localization Contract

## Distribution
Brainmerge is a browser-first game intended for Yandex Games and additional web game platforms/portals. The core game must remain portal-agnostic.

Platform integrations are implemented as adapters/capabilities for lifecycle, ads, auth, persistence/cloud save, payments, leaderboards, locale and sharing where supported. A local mock/no-op adapter is required for normal development.

## Localization
English (`en`) and Russian (`ru`) are mandatory production locales and must have full player-facing string parity. Player-facing source code must use localization keys rather than literals.

The localization layer must support future languages without changes to gameplay logic or screen architecture. Use semantic keys, plural-aware parameterization, locale formatting and fallback chains. UI validation includes pseudolocalization and expanded text testing.

A language is considered supported only when required key coverage and locale QA are complete.

## Input baseline
Touch + mouse are baseline requirements. Keyboard is supported where it materially improves desktop UX. Gamepad is optional unless a future distribution target requires it.