# Position as of 2026-09-18: paused, three answers owed by the user

Nothing is running. Codex ran last (paused 2026-09-14 for disk). On 2026-09-18 a Claude
Code session reviewed the unpushed installer work and the PR4 proposal and edited no code.
Read `.planning/HANDOFF.json` -> `frontier_review_2026_09_18` first, then
`docs/reviews/pr69-frontier-review-2026-09-18.md`. The user owes: (1) push approval for the
local-only commits, (2) the PR4 supersession answer, (3) approval of a rollback redesign
before more installer patching. The uncommitted `bin/install.js` fix must be preserved.
**This worktree holds the live handoff; the main checkout's copy is dated 2026-08-30.**

---

# Current application checkpoint - September 14

PR4 remains blocked on the user-required ordinary non-elevated repair. PR69 local
application commit3981cbf0 is held on native validation and open installer review
findings; its remote remains df0d3f9c, draft. PR70 has not been advanced.
Read HANDOFF.json application_recovery and docs/reviews/pr69-application-2026-09-13.md
before the historical notes below. No approval, merge or readiness change is
authorized. Existing September5 decisions and fixed endpoint remain binding.

---

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
is now **1.9.1 in the candidate worktree**, not installed or merged. PR64 merged as
`f19045ce`, then PR63 merged as `b1f10321`, closing #45. Main is integrated here.
The candidate and serial formal matrix both passed316/316 compatibility tests.
The successful report is applied and hash-verified. The first matrix's Windows
PowerShell timeout is retained separately; no timeout was relaxed.

**Phase 43** remains an acceptance-evidence surface. PR23 merged as `ece379db`,
and issues46/47/48 closed, but that does not prove all plans completed. The
referenced `scripts/validate-phase43-evidence.js` is absent from Git history;
at least some later plans are unexecuted. Keep plan counters unchanged and
finish the applicable September5 criteria instead of declaring bookkeeping done.

**How to run a bump step:** `MAINTENANCE.md` -> "Forward-porting overrides on an upstream
bump". It is a mechanical runbook, proven twice. The non-negotiables: never three-way merge an
override, drop-experiment after adoption test corrections and before porting, verify retained behavior with tests, refresh every
`REASON.md`, and adopt deliberate upstream semantic changes through version-conditional fork
tests rather than overriding them.

**Next concrete action:** finish1.9.1 full pre-push and final-head hosted gates,
then PR integration. The bounded port review found no actionable findings.
PR65 was approved and merged as f77b38d8. PR69 now needs refreshed gates after c9ecc23c corrected two installer review findings. PR67 has20 green checks and a concrete owner merge question pending.
Independent installer work is in PR66 (drift plus Codex target correction),
PR67 (hook bootstrap), and PR68 (patch preservation). Resolve current heads and
checks before integration. D1-D11 remain resolved; no new strategic audit.

---
*Hand-written 2026-08-31. The GSD PreCompact hook regenerates this file wholesale from
STATE.md's first 50 lines on every compaction; its template routes to HANDOFF.json first, so
regeneration is safe. Durable state belongs in HANDOFF.json, STATE.md, or the phase's
.continue-here.md — not here.*

## September 5 abrupt-session recovery

The corrected 1.9.1 compatibility retry passed 316/316 and its evidence is
applied and validated. PR70 contains the research digest at 573d9f91, with a
successful 1712-test pre-push; actual planner consumption remains open.
PR68's initial strict installer coverage measurement failed (83.83 statements,
78.43 branches, 82.35 functions, 83.83 lines), despite 60 passing safety tests.
This is an active agent-owned merge blocker, not an accepted exception. Reuse
existing tests and repair meaningful failure-path coverage under the shared
Tier S contract. No user runtime was activated. All five auxiliary worktrees
are under this repository's existing `.claude/worktrees/`; do not create new
top-level `C:/Projects` folders without express consent.
