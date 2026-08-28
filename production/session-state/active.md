# Active session state

## Project
Brainmerge — browser-first multi-platform merge game.

## Locked decisions
- Single Codex/ChatGPT implementation agent using role profiles.
- Toy-like polished 3D casual-game visual direction; see `docs/ART_BIBLE.md`.
- Approved merge board direction exists in Figma `Brainmerge — Art & UI`.
- One major character visual form normally covers three gameplay tiers.
- EN and RU are mandatory full production localizations from the start.
- Architecture must support additional locales without UI/gameplay rewrites.
- Yandex Games is one target; platform-specific SDKs must use adapters so other web portals/platforms can be added.
- Touch and mouse are mandatory; keyboard where useful; gamepad is not a baseline requirement.

## Current next step
Bootstrap the actual playable game architecture and first vertical slice: board state, spawn, drag/drop, merge, tier/form progression, persistence, localization foundation and platform adapter foundation.

## Known asset status
Approved character concepts and board/art direction exist, but production/runtime asset packaging should be verified before claiming the full art pack is committed and runtime-ready.