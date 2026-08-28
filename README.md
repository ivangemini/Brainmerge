# Brainmerge

Brainrot-themed browser merge game targeting Yandex Games and additional web game platforms.

## Project contracts

- `AGENTS.md` — single-agent development operating contract.
- `docs/ART_BIBLE.md` — locked visual direction and tier/form cadence.
- `docs/ASSET_MANIFEST.md` — canonical approved asset index.
- `docs/PLATFORM_AND_LOCALIZATION.md` — multi-platform and full localization contract.
- `production/session-state/active.md` — persistent current development state.

## Localization

English (`en`) and Russian (`ru`) are mandatory full production locales. Additional locales must be addable without restructuring gameplay/UI.

## Platform architecture

Yandex Games is a launch target, not a hardcoded dependency. Portal SDKs are isolated behind platform adapters/capabilities.