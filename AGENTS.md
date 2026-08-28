# AGENTS.md — Brainmerge

Canonical operating contract for the single OpenAI Codex / ChatGPT implementation agent working in this repository.

## Operating model

Brainmerge uses a **single-agent studio model**. Files under `agents/` are expert role profiles, not separate AI processes. When work touches a domain, read the relevant role profile(s) and apply that expertise yourself in the same session. Never claim another agent was spawned or consulted.

## Authority and source of truth

In a conflict, use this precedence:
1. latest explicit user instruction;
2. Brainmerge project-specific source-of-truth docs (`docs/ART_BIBLE.md`, game design, roadmap, platform/localization contracts, approved Figma targets);
3. this `AGENTS.md`;
4. Brainmerge `rules/`;
5. relevant `skills/` workflow;
6. relevant `agents/` role profile;
7. upstream/generic framework reference material.

Project-specific Brainmerge decisions always override imported framework examples.

## Autonomy

Once the user gives a clear task, execute the full coherent pass autonomously. Do not request approval for routine reversible file writes, multi-file edits, tests, refactors, visual implementation, or within-scope technical choices.

Stop and ask only when:
- a genuinely product-defining choice cannot be inferred from the source-of-truth docs;
- an irreversible/destructive action is required;
- credentials, payment, contractual/legal acceptance, or publishing-account actions are required;
- a new rule would materially conflict with an approved Brainmerge decision.

Do not stop after the first small fix when a larger coherent pass is clearly requested.

## Required role routing

- gameplay/merge loop -> `agents/gameplay-programmer.md`, `agents/game-designer.md`
- progression/economy/retention -> `agents/systems-designer.md`, `agents/economy-designer.md`, `agents/live-ops-designer.md`
- visual direction/assets -> `agents/art-director.md`, `agents/technical-artist.md`
- UI/interaction -> `agents/ux-designer.md`, `agents/ui-programmer.md`
- localization -> `agents/localization-lead.md`
- platform SDKs/publishing -> `agents/release-manager.md`, `agents/technical-director.md`
- QA/performance -> `agents/qa-lead.md`, `agents/performance-analyst.md`
- analytics -> `agents/analytics-engineer.md`
- audio -> `agents/audio-director.md`

## Skill routing

Reusable workflows live under `skills/<name>/SKILL.md`. Read relevant skills before substantial work. For large passes:
1. inspect current HEAD, project docs and session state;
2. read relevant role profiles/rules/skills;
3. implement the complete coherent slice;
4. run applicable verification;
5. review from gameplay, UX/art, localization, performance and QA perspectives;
6. update docs/roadmap/session state when decisions or architecture change.

## Brainmerge hard constraints

- Browser-first TypeScript architecture; do not introduce Godot/Unity/Unreal requirements from upstream framework files.
- Multi-platform web distribution from day one. Yandex Games is a launch target, not an architectural singleton.
- Platform-specific SDK calls must be behind adapters/capability checks.
- Full localization architecture from day one. `en` and `ru` are mandatory production locales and must maintain 100% player-facing string parity.
- No hardcoded player-facing strings in production UI/gameplay code.
- Touch and mouse are mandatory. Keyboard support is required where useful for desktop UX. Gamepad is optional unless a target platform later requires it.
- Approved Figma frames and `docs/ART_BIBLE.md` are visual source of truth for player-facing implementation.
- Character visual form changes every three gameplay tiers by default; see `docs/ART_BIBLE.md`.
- Do not present placeholders, generic SVG stand-ins or flat developer panels as production-ready visuals.

## Session continuity

Use `production/session-state/active.md` as persistent working context. Update after substantial passes with completed work, decisions, blockers and next logical steps.

## Quality discipline

A task is not complete because files changed. Apply relevant gates:
- acceptance criteria and deterministic logic tests where practical;
- regression tests for meaningful gameplay/save/data bugs;
- visual comparison against approved Figma/art targets;
- touch + mouse interaction review;
- EN/RU localization parity and pseudolocalization layout review;
- performance implications on mobile-class browsers;
- save/data compatibility;
- platform-adapter boundaries;
- documentation/roadmap consistency.

Never claim a test, build, browser run, screenshot comparison, benchmark or platform check passed unless it was actually run successfully.

## Git discipline

Keep commits coherent. Never force-push, expose secrets, or destroy unrelated work. Prefer meaningful commits after verified slices.

## Framework provenance

Brainmerge's studio workflow is adapted from `ivangemini/Brainrot`, which itself was adapted from Donchitos/Claude-Code-Game-Studios under the MIT License. Brainmerge-specific rules in this repository are authoritative.