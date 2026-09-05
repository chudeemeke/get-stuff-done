# Continuation Context

**Refreshed at:** 2026-09-05
**Trigger:** Manual refresh after the user resolved the step-3 sequencing decision and ratified
D1-D11 of the 09-02 engine-versus-prose plan (2026-09-05)

## Resume Instructions

1. **Read `.planning/HANDOFF.json` first.** It is the current session position: branch, status,
   the active arc's done/in-flight/next-steps record, and the open owner decisions.
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

**Active work:** issue #53 upstream bump campaign — an incremental walk of the
`@opengsd/gsd-core` pin, 1.6.1 -> 1.7.0 -> 1.8.0 -> 1.9.1 -> 1.10.0 -> 1.11.0 -> 1.12.0, one merged PR
per step (endpoint extended to 1.12.0 by user decision 2026-09-05). **Steps 1 and 2 are merged** (PR #61 -> `0bfac78e`, PR #62 -> `fce6d8d1`). The pin
is now **1.8.0**. Step 3 (1.9.1) has not started; this branch is its workspace. It is gated on the #45 fix
PR merging first (user decision 2026-09-05; the eleven D1-D11 outcomes are in HANDOFF.json).

**Phase 43** is no longer the active arc: PR #23 merged 2026-08-29 as `ece379db`, and issues
 #46, #47 and #48 were closed with evidence before that merge. What remains of Phase 43 is a
bookkeeping question — 50 PLAN files against 22 SUMMARY files, where it was never established
whether the 28 gaps are unexecuted or executed-but-unsummarized (several were executed inside
the 86 commits recovered from an orphaned worktree). Establish that before treating it as
remaining effort.

**How to run a bump step:** `MAINTENANCE.md` -> "Forward-porting overrides on an upstream
bump". It is a mechanical runbook, proven twice. The non-negotiables: never three-way merge an
override, drop-experiment after adoption test corrections and before porting, verify retained behavior with tests, refresh every
`REASON.md`, and adopt deliberate upstream semantic changes through version-conditional fork
tests rather than overriding them.

**Next concrete action:** follow `.planning/HANDOFF.json` and `.planning/SKIN-COMPLETION.md`: finish existing PR64 then PR63 integration before step3. D1-D11 are resolved. The September5 contract is execution scope; no new strategic audit.

---
*Hand-written 2026-08-31. The GSD PreCompact hook regenerates this file wholesale from
STATE.md's first 50 lines on every compaction; its template routes to HANDOFF.json first, so
regeneration is safe. Durable state belongs in HANDOFF.json, STATE.md, or the phase's
.continue-here.md — not here.*
