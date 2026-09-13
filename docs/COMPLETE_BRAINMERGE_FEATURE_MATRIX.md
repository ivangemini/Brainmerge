# Полная матрица функций Brainmerge

Аудит выполнен 2026-09-13 для `ivangemini/Brainmerge`. База сравнения — текущий
`HEAD` `9536cfc6b3f8be2529519e1a9bd4e30d1aa2abb2`
(`codex/normalized-full-build-20260913`). В колонке «Источник» указан первый
содержательный источник реализации, а не каждая последующая копия того же кода.
`Да` в «Есть в HEAD» проверено по исходникам и тестам, а не по сообщению коммита.

| Feature | Источник | Есть в текущем HEAD | Уникальна? | Лучшая реализация | Нужно переносить? |
| --- | --- | --- | --- | --- | --- |
| Одна каноническая цепочка T1→T18 | `415aacfe`, `739eb171` и последующая линия `main` | Да | Нет | HEAD: `src/core/catalog.ts`, `src/core/game.ts` | Нет |
| Idle economy, Brain Lab, offline income и защита clock rollback | `cf797545`…`95b9a04b` | Да | Нет | HEAD: typed `game.ts` + `economy-lifecycle.test.mjs` | Нет |
| Mission journey и return-session guidance | `f8a73c5`…`f40379f` | Да | Нет | HEAD: `game.ts`, `next-action.test.mjs`, `pacing.test.mjs` | Нет |
| Touch, mouse, keyboard focus и compact/mobile board | `c14168e`, `6a0b00f` и World-1 fixes | Да | Нет | HEAD: `public/mobile-*`, `accessibility.css`, mobile tests | Нет |
| Yandex adapter, cloud-save lifecycle и portal packaging | `d13748f`, `219884f`, `1af74a5` | Да | Нет | HEAD: `src/platform/yandex.ts`, packaging/smoke scripts | Нет |
| EN/RU runtime parity и locale checks | i18n commits throughout reachable history | Да | Нет | HEAD: four locale JSON files + `check-locales.mjs` | Нет |
| Persistent Campaign: 8 worlds, 7 Locations + Raid | `8be5d60`, `f2efb02` | Да | Нет | HEAD: `src/core/campaign.ts`, Campaign tests | Нет |
| Save v6 Campaign isolation → current save v10 migration | `afb8fc8`…`3c0e8b4`; recovery `ca39fb2` | Да | Нет | HEAD: `game.ts`, `types.ts`, v10 migration tests | Нет |
| Stabilize / Deliver Orders / Restore Landmark / Mastery | `1c03f56`, `34cf699`, `0a67ca3` | Да | Нет | HEAD: unified `campaign-run.ts`, restore/mastery tests | Нет |
| All seven World 1 location runs | `a3a36db`, `70fa4fe`, `1ef9c70` | Да | Нет | HEAD: `campaign-run.ts`, `campaign-worlds-smoke.mjs` | Нет |
| World 2 Traffic Lock and Location runs | `1515846`, `b07e3cb`, `1ef9c70` | Да | Нет | HEAD: unified `campaign-run.ts` + run tests | Нет |
| World 1/2 landmark perks | `b07e3cb` and full historical World-1 line | Да | Нет | HEAD typed campaign/run data; EN/RU campaign strings | Нет |
| Persistent multi-phase World Raid and World 2 gate | `1515846` plus recovery `ca39fb2` | Да | Нет | HEAD: `campaign-raid.ts`, UI, browser/unit smoke | Нет |
| High-resolution World 1/2 Campaign backgrounds | `c678925` and normalized `75e8a42` | Да | Нет | HEAD `campaign-world-01.jpg`, `campaign-world-02.jpg` | Нет |
| Collection rewards and Brain Reset / Prestige semantics | `83f3722`, legacy `collection-rewards.ts`/`prestige.ts` | Да | Нет | HEAD integrated `GameState`; legacy split modules are inferior | Нет |
| Five music tracks, settings, activation and visibility lifecycle | `1ef9c70` historical feature branch | Да | Нет | HEAD `src/audio/music-manager.ts`, five files in `public/audio/music/` | Нет |
| Rewarded ads: free Brain Box | `1ef9c70` | Да | Нет | HEAD platform adapter + `game.ts` | Нет |
| Coin Boost, Golden Brain Box, Mutation Charge, Free Upgrade | `1ef9c70` | Да | Нет | HEAD `adBoosts` state, daily reset, `reward-boosts.ts`, tests | Нет |
| Reward cooldowns, daily limits, full-board queue and failure feedback | `1ef9c70`, `2dc3035`, `2a8a815` | Да | Нет | HEAD tests `ad-boosts.test.mjs`, Yandex smoke | Нет |
| Analytics event boundary | recovery/normalized line | Да | Нет | HEAD `src/analytics/analytics.ts`, `analytics.test.mjs` | Нет |
| Retention: combo/fever/visitor and pacing | recovery `ca39fb2` | Да | Нет | HEAD `game.ts`, `pacing.test.mjs` | Нет |
| Campaign abandon, short viewport and launcher observer fixes | `b0610b4`, `2e1b686`, `dd04039`, `61a11fd` | Да | Нет | HEAD unified Campaign runtime and smoke coverage | Нет |
| Base-drop cap and board visual polish | `234d42a`, `7632260`, `3ba4d97` | Да | Нет | HEAD catalog/runtime presentation | Нет |
| Legacy standalone World-1 engine | dangling trees; `src/core/world1-campaign-run.ts` in `1ef9c70` | Нет (intentionally) | Нет: duplicates current engine | Do not restore | Нет |
| Legacy split collection/prestige modules | dangling trees; `src/core/collection-rewards.ts`, `src/core/prestige.ts` | Нет (intentionally) | Нет: duplicate state authority | Do not restore | Нет |
| Legacy character set and offline Brain Box raster | dangling trees / `1ef9c70` | Нет (intentionally) | No: conflicts with approved current asset/identity contract | Do not restore | Нет |

## Interpretation

No production feature was found only in an unreachable object and absent from
HEAD. The 53 complete unreachable trees are intermediate post-RC snapshots:
their source variants either predate the unified typed Campaign/Raid model or
duplicate functionality now covered by HEAD. The only source files present in
those snapshots but absent in HEAD are the deliberately retired parallel
World-1/collection/prestige modules and their old presentation/test wrappers.

The current implementation is therefore a *selective consolidation*, not a
mechanical union: it keeps the newer unified model while retaining the useful
historical behavior listed above.
