# Complete Brainmerge source audit

## Scope and method

Audit date: 2026-09-13. Repository: `/Users/hid/Desktop/Brainmerge`; verified
remote: `https://github.com/ivangemini/Brainmerge.git`. No branch was merged,
deleted, reset, force-updated, or rewritten during this audit.

Every source was identified as Brainmerge only when it matched the remote or a
combination of `package.json`, `src/`, `public/`, `locales/`, and distinctive
Brainmerge files. Generated `build/`, `dist/`, and dependency copies were not
treated as independent functionality.

## Ref inventory

| Source | Tip | Relationship to HEAD | Result of source comparison |
| --- | --- | --- | --- |
| `codex/normalized-full-build-20260913` | `9536cfc6` | HEAD | Canonical candidate; normalized, typed implementation. |
| `codex/recovery-full-build-20260913` | `ca39fb2` | ancestor | Recovery base: save v10, retention, analytics, current Campaign/Raid model. |
| `main`, `origin/main`, `origin/HEAD`, `codex/22` | `d5a2b291` | ancestor | Published pre-recovery baseline. `origin/HEAD` is symbolic only. |
| `codex/local-publication-ae19273` | `ae19273f` | diverged | Publication snapshot. Superseded by current package/release checks; lacks later systems. |
| `codex/world1-location-completion` | `1ef9c70d` | diverged | Full historical World 1/2, rewards, audio and polish line; useful source, but its split engine is superseded. |
| `origin/campaign-run-sneaker-garden`, `-v2`, `-v5`, `-v6` | `1c03f56e` | ancestor | Four exact ref duplicates. Stabilize slice already represented in HEAD. |
| `origin/campaign-run-sneaker-garden-v7` | `df108ffc` | diverged | Stabilize presentation/touch/observer hardening; behavior superseded by unified UI. |
| `origin/campaign-run-sneaker-garden-v7-ci` | `0f2e4cc1` | diverged | Isolated-run v6 test slice; covered by v10 tests. |
| `origin/campaign-run-sneaker-garden-v7-copy` | `4e019684` | diverged | Earlier transaction/copy slice; no additional engine. |
| `origin/campaign-sneaker-garden-deliver-v1` | `34cf699a` | ancestor | Deliver Orders source; retained in unified engine. |
| `origin/campaign-sneaker-garden-restore-mastery-v1` | `0a67ca36` | ancestor | Restore/Mastery source; retained in unified engine. |
| `origin/campaign-world1-data-driven-v1` | `a3a36db3` | diverged | Seven-location predecessor; behavior ported, old parallel module not retained. |
| `origin/tmp-gift-crisp`, `-2`, `-3`, `-4`, `-5` | `fb32cccb` | ancestor | Five exact ref duplicates; no unique source. |
| Codex capture/checkpoint refs | tree `209d52af` | equals HEAD tree | `refs/codex/turn-diffs/captures/...` and `refs/codex/turn-diffs/checkpoints/...`; exact current source snapshot, not another version. |

There are no tags, no stash entries, no secondary remotes, no linked Git
worktrees, and no `.git/worktrees` entries.

## Relevant commit lineages

The repository has 422 reachable commits. The relevant feature-introducing
lineages, checked against source rather than commit labels, are:

- `ce14a638`…`78eaf49`: first playable browser loop, platform/Yandex adapter,
  feedback and packaging.
- `415aacfe`…`fe642566`: migration to the one canonical T1→T18 chain and
  chain-aware rescue/hints.
- `f8a73c58`…`d56d7e1`: missions, idle economy, save v4/v5, lifecycle
  persistence, return guidance, touch/focus accessibility.
- `8be5d60d`…`0a67ca36`: persistent world map, save v6, isolated Campaign
  board and the approved four Location phases.
- `32b4b828`…`1ef9c70d`: data-driven World 1/2, perks, rewards, visual and
  browser-smoke hardening, high-resolution art, rewarded boosts and music.
- `0a191863`…`9536cfc6`: recovery, save v10, Raid/retention/analytics
  consolidation, then targeted normalization of historical features.

The complete historical World-1 branch is the best recovery reference for
individual legacy behavior: `1ef9c70d82712ecb8cdf02daf3b472299ecf5361`.
The recovery base is `ca39fb2a2c3b87035e64ab6e04fd659ae9eabd99`.

## Reflog and commit recovery

All reflogs were read. They expose the same progression: original clone at
`429b2b16`, World-1 historical work through `1ef9c70d`, the local publication
amend `ae19273f`, recovery `0a191863`/`ca39fb2`, and normalization
`75e8a420`/`942c569`/`9536cfc`. The only unreachable commit is
`0e739c9b9b7470346efa4f83d9cef03ad3cb70b4` (2026-09-01,
“Rebuild bundle before starting local server”); its parent is `429b2b16` and
it changes build output only, so it contains no recoverable source feature.

## Unreachable and dangling objects

`git fsck --full --no-reflogs --unreachable` found **1 commit, 343 trees, and
523 blobs**. `git fsck --full --dangling` separately reported **52 dangling
trees and 7 dangling blobs**. All 343 trees were enumerated; a tree qualifies
as a complete Brainmerge snapshot only if its root has both `package.json` and
`src/` (and it was then checked for `public`/`locales`). This yielded 53 full
post-RC snapshots, listed below. They produce 50 distinct selected-source
fingerprints; three pairs differ only outside the selected source paths.

`02e38af8`, `036648e2`, `12bdec72`, `167884c0`, `1947149e`, `19bf6169`,
`1b6859e7`, `202066c1`, `236577d0`, `2738c381`, `2b49f5f2`, `2e9409cb`,
`2f84a439`, `2fc09f00`, `3275d619`, `32ea01eb`, `4b95934c`, `51c02b0f`,
`52d02202`, `540c30c9`, `546ef49b`, `6462dd96`, `6619b465`, `67dbe696`,
`6c1a14cb`, `6dc6c656`, `76d9ee0f`, `7b0abbef`, `8fd64068`, `92cb3d28`,
`92d2dd48`, `942fa5d8`, `a4cbfdb9`, `a60efb69`, `af7a6a0f`, `af95ffc1`,
`b160bc5c`, `b66f093b`, `b78ba818`, `c2ccc239`, `c7955c9e`, `c7f30156`,
`e195b42b`, `e3e0ebda`, `e44837a6`, `e7334557`, `ee5cd123`, `f7a37039`,
`f90767b8`, `fbcbcba8`, `fed86893`, `fedbf2fb`, `feef23d3`.

Full IDs are intentionally represented by their unique 8-character prefixes:
Git resolves each uniquely in this repository, and the detailed `fsck` command
is reproducible from this document. Their content is all recognizably
Brainmerge post-RC (same session contract: persistent locations and World
Raids). Comparison of `src/`, `public/`, `locales/`, `scripts/`, `tests/`,
`docs/`, `package.json`, `index.html`, and `tsconfig.json` found no standalone
feature absent from HEAD. The recurring source-only files are legacy
`world1-campaign-run.ts`, `collection-rewards.ts`, `prestige.ts`, old smoke/UI
wrappers, and superseded character assets.

The remaining 290 unreachable trees are directory subtrees or partial staging
states and cannot form a root project; the 523 blobs were classified by object
type/content. Their text source variants are components of the full snapshots
above or partial file revisions; no blob can itself be a full Brainmerge
version. Binary generated/build and dependency blobs were excluded from feature
uniqueness.

One exception prevents an unqualified claim that every byte in `.git/objects`
is inspectable: `.git/objects/da/tmp_obj_hvf1gd` is a 1.6 MiB stale temporary,
zlib-compressed object (mtime 2026-08-31). It is not a valid Git object,
`git fsck` does not expose it, and decompression fails with `Zlib::BufError`.
It has no recoverable header/path/content, so it cannot be classified as
Brainmerge or non-Brainmerge without repairing data that is already truncated.
It was left untouched. This is the sole inaccessible potential source.

## Local copies, archives, and checkpoints

The local Desktop repositories were inspected by remote and project shape.
Only this directory has the Brainmerge remote. `Brainrot` and `Brainrorgame`
are distinct remotes and were explicitly excluded. No Brainmerge archive,
snapshot, or duplicate project was found under Desktop, Documents, Downloads,
or in name-addressable `/Users/hid/.codex` paths. The two reachable Codex
checkpoint/capture refs both point to the HEAD tree.

## Conflicts and resolution quality

1. **Parallel Campaign engines:** historical `world1-campaign-run.ts` vs HEAD
   `campaign-run.ts`. Keep HEAD: it includes World 1, World 2 Traffic Lock,
   isolation, current save v10, and typed test coverage. Do not re-add the
   old engine.
2. **Split versus unified permanent meta:** historical collection/prestige
   modules vs HEAD `GameState`. Keep unified state to avoid two save
   authorities.
3. **Legacy character identity/art:** old eight-character raster set conflicts
   with the approved current canonical chain; do not restore it.
4. **Campaign UI/raid:** historic UI lacks the persistent three-phase Raid
   implementation; retain HEAD `campaign-raid-ui.js`/`campaign-raid.ts`.
5. **Save schema:** v6 historical snapshots conflict with v10 retention and
   ad-boost defaults; preserve v10 migration/sanitization.

## Canonical base

Use **HEAD `9536cfc6`** (`codex/normalized-full-build-20260913`) as the
canonical base. It keeps the recovery base’s save-v10, typed Campaign/Raid,
retention, analytics, browser/Yandex boundaries and EN/RU coverage; it also
contains the selectively ported music, five tracks, rewarded boosts, all World
1/2 run layouts, perks, high-resolution backgrounds, and regression smoke
coverage. It is more complete and architecturally safer than `1ef9c70d`,
whose useful behavior is present but whose modules duplicate present authority.

## MERGE PLAN

No bulk merge is justified: the audited feature set is already present in HEAD.
For any future recovery or reconciliation, execute these narrow steps:

1. Start from `9536cfc6`; run `npm test`, the locale check, Campaign/Raid
   smokes, and Yandex browser smoke to establish a baseline.
2. If a historical behavior must be restored, first compare the exact source
   commit (`1ef9c70d` for legacy World/reward/audio behavior; the named
   `origin/campaign-*` tip for a phase) against `src/core/campaign-run.ts`,
   `campaign-raid.ts`, `game.ts`, `types.ts`, `main.ts`, locales, and their
   tests. Port only the missing transaction and its test.
3. Treat save changes as additive v10 migrations in `game.ts`/`types.ts`;
   test v2→v10 and cloud lifecycle before UI work.
4. Add or amend UI only after core tests: `public/campaign-*.js/css`,
   `src/ui/game-view.ts`, `src/main.ts`, and both EN/RU locales must change
   together. Run touch/desktop Campaign shell smoke.
5. Keep music in `MusicManager`, rewarded work behind `PlatformAdapter`, and
   analytics at the existing event boundary. Run audio/ad/Yandex smoke after
   each such change.
6. Do not transplant `world1-campaign-run.ts`, `collection-rewards.ts`,
   `prestige.ts`, old standalone character assets, v6 saves, generated output,
   or duplicate temporary branches: each conflicts with the current single
   engine, save authority, art contract, or produces no novel code.

This plan is deliberately a selective cherry-pick-by-behavior process, never a
merge-all-branches operation.
