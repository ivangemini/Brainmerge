# Localization Rules

These rules apply to all player-facing text and locale resources.

- EN and RU are mandatory production locales with 100% key parity.
- No hardcoded player-facing strings in production source.
- Use semantic dot-notation keys and parameterized messages.
- Plurals/count-sensitive messages use a plural-aware formatter.
- New player-facing copy is incomplete until both EN and RU entries exist.
- CI/build validation should detect missing mandatory-locale keys once localization tooling is wired.
- Supported locales fall back gracefully; raw keys must never be shown to players.
- Pseudolocalization is part of UI QA.
- Layouts must tolerate approximately 30–40% text expansion unless a tighter component-specific limit is documented.
- Maintain a localization glossary for character names, currencies, mechanics and platform terminology.
- Locale-aware number/date/currency formatting is required where those values are shown.
- Additional languages must be addable by data/config, not UI/gameplay rewrites.