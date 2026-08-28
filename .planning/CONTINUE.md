# Continuation Context

**Refreshed at:** 2026-08-28
**Trigger:** Manual refresh — this file had gone two months stale and was mis-routing resumption

## Resume Instructions

1. **Read `.planning/HANDOFF.json` first.** It is the current session position: branch, HEAD,
   live CI state, and the three decisions blocking PR #23.
2. Then read
   `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/.continue-here.md`
   for the constraints, anti-patterns, rejected alternatives and terminology.
3. `.planning/STATE.md` is canonical for **plan-execution** position (which plan is next) and
   carries its own READ FIRST block. Its progress block can be far behind the session position
   when non-plan work has happened — as it currently is.
4. Verify before trusting any of the above: `git worktree list` (anything `prunable` means work
   may be stranded), `git rev-list --left-right --count origin/<branch>...<branch>` (expect
   `0 0`), and re-read live CI rather than any recorded table.
5. `/gsd:resume-work` is **broken** (issue #54) — 55 of 58 files in `.claude/commands/gsd/`
   `@`-import a deleted iCloud path. The two files above are self-contained and need no command.

## Last Known State

**Milestone:** v1.2.0 Ship-Ready Hardening

**Active work:** Phase 43 — upgrade-resilience-verify-matrix-dogfood, on draft PR #23.

**Status:** 17 of 21 CI jobs green across four workflows (15 of 18 within the CI workflow
alone). Everything still red is one of three owner **decisions**, not unfinished
implementation:

- **#46** — perf regression is real: +151 packages (367→504, +41%) → install 1.41x linux /
  1.39x macOS under paired measurement. Do **not** bump `perf-baseline.json` or loosen a ratio.
- **#47** — Upgrade Verifier hits npm E409: verdaccio proxies to npmjs where
  `@chude/get-stuff-done@3.0.2` genuinely exists, so publishing the current version collides.
- **#48** — Windows perf fix `5b45a921` is correct but **inert**: the job runs
  `measurement-harness` at pinned SHA `35cbe088`, never PR head. Re-pinning is a
  trust-boundary change across 6 locations.

**Upstream:** pinned `@opengsd/gsd-core@1.6.1`; upstream itself is at 1.11.0 (issue #53).
Do not bump inside Phase 43.

**Next concrete action:** work issues #46, #47, #48. PR #23 cannot go green without them.

---
*Hand-written 2026-08-28, replacing a 2026-07-01 version that pointed at Phase 41 Plan 04
(Phase 41 completed 2026-07-03) and asserted STATE.md was "the authoritative resume pointer"
without the plan-execution qualifier. The GSD PreCompact hook regenerates this file; its
template was updated in the same commit so regeneration no longer reintroduces that routing.*
