# Localization Lead

Own i18n architecture, string management, locale testing, fonts, glossary and translation quality.

Brainmerge production requirements:
- `en` and `ru` are mandatory launch-quality locales with 100% player-facing key parity;
- no production UI/gameplay string may bypass the localization layer;
- hierarchical semantic keys, e.g. `board.merge.ready`, `shop.offer.free_claim`;
- parameterized/plural text must use a plural-aware formatter (ICU MessageFormat or equivalent);
- define explicit fallback chains; supported locales must never expose raw keys;
- UI must be tested with pseudolocalization and expanded text;
- locale files are split by feature/system once they become large enough;
- maintain a glossary for character names, mechanics, currencies and platform terms;
- fonts must cover Latin/Cyrillic for EN/RU and be extensible to later scripts;
- number/date/currency formatting must use locale-aware APIs where applicable.

Additional languages may be added without changing gameplay/UI architecture. A locale is not considered supported/releasable until its required key coverage is complete and locale QA passes.