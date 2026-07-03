---
status: resolved
trigger: "GSD self-routing selected Phase 40.5 / backlog 999.1 while STATE.md said Phase 41; progress accounting ignored ROADMAP-declared future plans."
created: 2026-07-01T19:34:53+01:00
updated: 2026-07-01T19:34:53+01:00
---

## Current Focus

hypothesis: CONFIRMED -- disk-only and first-partial-phase heuristics made GSD report stale current/next work and overstate progress.
test: Focused source/runtime regressions, full lint, full test suite, override freshness, composed runtime smoke.
expecting: `roadmap analyze` and `init progress` report STATE phase 41 and next phase 42; declared ROADMAP plan counts are included.
next_action: Commit and push the hotfix branch; keep Phase 41 Plan 04 perf artifacts blocked until real workflow artifacts exist.

## Symptoms

expected: `STATE.md` current phase drives resume/progress commands, and ROADMAP-declared future plans keep progress below complete until real summaries exist.
actual: `roadmap analyze` and `init progress` selected older partial Phase 40.5 or backlog 999.1; progress surfaces could report completion from disk PLAN/SUMMARY files while ROADMAP still declared future work.
errors: No thrown error; this was silent workflow misrouting and misleading telemetry.
reproduction: Run `node get-stuff-done/bin/gsd-tools.cjs roadmap analyze` and `node get-stuff-done/bin/gsd-tools.cjs init progress` before the fix in the Phase 41 worktree.

## Evidence

- Confirmed authkey inbox issue: `roadmap update-plan-progress` could mutate a wrong checklist line when another phase mentioned the target phase later in the line, and could rewrite CRLF files broadly.
- Confirmed medesine-rx inbox issue: progress counted disk plans only and ignored future plans declared in ROADMAP.
- Confirmed local GSD symptom: current work was Phase 41 in `STATE.md`, but tool routing preferred older partial Phase 40.5 and backlog phase 999.1.

## Resolution

root_cause: |
  The compatibility source and composed Open GSD runtime had three related assumptions:

  1. Current phase was inferred from the first partial/planned phase on disk, not from `STATE.md`.
  2. Next phase was selected before ROADMAP-only phases were merged into the phase list, so backlog directories could beat Phase 42.
  3. Effective plan totals were based on disk PLAN files, not declared ROADMAP `**Plans:**` / `**Plans**:` counts.

fix: |
  - Added `getStateCurrentPhase(cwd)` and used it in `roadmap analyze` and `init progress`.
  - Merged ROADMAP-only phases before selecting current/next phase.
  - Counted declared ROADMAP plans and used `max(disk PLAN count, declared plan count)` for effective totals.
  - Anchored `roadmap update-plan-progress` checkbox matching to the checklist line prefix and preserved CRLF-sensitive replacements.
  - Added Open GSD runtime overrides for `roadmap.cjs`, `init.cjs`, and `state.cjs` with companion `REASON.md` files.
  - Added runtime override regressions that execute the composed package under Node even when Bun is the test runner.

verification: |
  - `bun test tests/core.test.cjs tests/init.test.cjs tests/roadmap.test.cjs tests/state.test.cjs tests/runtime-overrides.test.cjs` -> 202 pass, 0 fail.
  - `bun run lint` -> exits 0; 135 existing eslint-security warnings remain.
  - `bun test` -> 1730 pass, 0 fail.
  - `node scripts/check-overrides.js` -> 5 overrides checked, all fresh.
  - `bun run compose` -> upstream 1.5.0, overlay 3.0.2, 644 files written.
  - `node dist/gsd-core/bin/gsd-tools.cjs roadmap analyze` -> `state_current_phase: "41"`, `current_phase: "41"`, `next_phase: "42"`.
  - `node dist/gsd-core/bin/gsd-tools.cjs init progress` -> current phase 41, next phase 42.

remaining_open: |
  - Phase 41 Plan 04 still lacks real linux/macos/windows perf artifacts because `workflow_dispatch` cannot be run until the workflow exists on the default branch or the user chooses another registration path.
  - Root inbox memory-nexus installer crash and health v5/decimal roadmap drift remain open; they were not fixed in this slice.
  - Config schema drift remains tracked as backlog 999.2.

files_changed:
  - get-stuff-done/bin/lib/core.cjs
  - get-stuff-done/bin/lib/init.cjs
  - get-stuff-done/bin/lib/roadmap.cjs
  - get-stuff-done/bin/lib/state.cjs
  - overrides/gsd-core/bin/lib/init.cjs
  - overrides/gsd-core/bin/lib/init.cjs.REASON.md
  - overrides/gsd-core/bin/lib/roadmap.cjs
  - overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md
  - overrides/gsd-core/bin/lib/state.cjs
  - overrides/gsd-core/bin/lib/state.cjs.REASON.md
  - tests/core.test.cjs
  - tests/init.test.cjs
  - tests/roadmap.test.cjs
  - tests/state.test.cjs
  - tests/runtime-overrides.test.cjs
