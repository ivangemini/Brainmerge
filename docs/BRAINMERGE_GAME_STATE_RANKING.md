# Brainmerge Game-State Ranking

Дата аудита: 2026-09-13. Этот документ продолжает `COMPLETE_BRAINMERGE_AUDIT.md`; полный поиск refs/unreachable objects повторно не выполнялся.

## Метод

Сравнивались source trees из уже найденного набора 50 различных Brainmerge source-вариантов (54 полноценных root tree после динамической перепроверки; один новый tree был пропущен в старом списке). Build output не считался самостоятельной функциональностью. Для близких snapshots сравнивались `src/`, `public/`, `locales/`, `scripts/`, `tests/`, `docs/` и package/config.

## Рейтинг

| Ранг | Источник / группа | Доказанная зрелость | Что лучше | Что хуже / почему не canonical |
| --- | --- | --- | --- | --- |
| 1 | `02e38af8`, `e195b42b`, `1ef9c70d` (`codex/world1-location-completion` tip) | Максимальный исторический source-state: 142 отобранных source/test/doc/assets файлов, 131 заявленный deterministic test | Полный clicker: `clicks`, `tapUnit`, critical payout, `clickPower`, `clickCrit`, click-миссии; расширенный mission track; семь World 1 и World 2 locations/raid; отдельные smoke scripts; richer historical presentation assets | Save v6, старый split Campaign/Prestige, старый `world1-campaign-run.ts`, отсутствие current retention/analytics/save-v10/typed raid isolation; отдельные rasters нарушают утверждённый atlas contract |
| 2 | `7b0abbef`, `a60efb69` и близкие 142-file variants | Практически тот же полный gameplay state; отличаются только малыми runtime-smoke/локальными деталями | Те же clicker/progression и Campaign/Raid сценарии | Не доказано уникальной production-функциональностью относительно rank 1; не переносить целиком |
| 3 (canonical) | `9536cfc6` (`codex/normalized-full-build-20260913`) | Самая цельная современная архитектура: save v10, unified `GameState`, typed `campaign-run.ts`/`campaign-raid.ts`, retention/analytics, current audio, World 1/2, EN/RU, Yandex/browser/touch gates; 126 tests | Стабильная data/save boundary, exact-once Campaign/Raid persistence, event/retention and platform adapters, single 6x3 character atlas | Не содержит clicker subsystem, click upgrades и click missions из rank 1 |
| 4 | `04b05378` и 130–141-file pre-RC groups | Ранние полноценные Campaign/game states; полезны как provenance для evolution | Отдельные промежуточные smoke/assets | Старее rank 1/3, меньше typed/save coverage, не являются более полными после source comparison |
| 5 | Остальные 50 source-вариантов, включая legacy v1–v5/standalone Campaign groups | Частичные или дублирующие snapshots | Могут объяснить происхождение отдельных fixes | Нет доказанной production-функции, которой нет в rank 1 или canonical HEAD; перенос целиком запрещён |

`02e38af8`, `e195b42b` и `1ef9c70d` имеют одинаковый selected-source fingerprint; различие `1ef9c70d` относительно `02e38af8` ограничено `scripts/runtime-smoke.mjs`. Они считаются одной исторической state-группой, а не тремя независимыми реализациями.

## Вывод

Наиболее полный **исторический** игровой state — rank 1, но наиболее безопасная и зрелая **canonical base** — `9536cfc6`. Единственный подтверждённый selective port из rank 1 — clicker/progression slice, адаптированный к save v10 и текущему unified architecture. Старые Campaign/Prestige модули, отдельные character rasters и offline chest не переносятся.
