# Position as of 2026-09-19 early: plan approved, Step 0 done, Step 1 (expected-red acceptance gate) is next

Nothing is running. Claude Code ran last. The implementation plan for the installer
transaction is **owner-approved** and is in the repo: `docs/plans/features/installer-transaction.md`.
**Step 0 is done and pushed**: the accepted rollback note was amended after a fifth independent
review (fable NOT PASS, Gemini PASS WITH CHANGES), a measurement of the real composed child
(one read-only pid-probe spawn, not zero) and four owner decisions (round four, recorded at the
end of the note). **`bin/install.js` has not been edited.** Read `.planning/HANDOFF.json` ->
`session_2026_09_19_a` first, then the plan, then the note's "Proof" and "Readings settled for
implementation" sections. Next: **Step 1**, make `tests/acceptance/installer-recovery.cjs` a
package script and a CI step in expected-red mode. Nothing is owed by the owner for the
installer work; a Codex pass over the amended note is offered, not run; PR 4 closure still
needs its own authorization. Every `git push`, including `--delete`, needs pinned bun 1.3.5
first on PATH; never `--no-verify`. In Claude Code, start every Bash command with an explicit
`cd` into this worktree: the cwd silently resets to the main checkout.
**This worktree holds the live handoff; the main checkout's copy is dated 2026-08-30.**

---

> The block below is the 2026-09-18 night position. Its "Next: plan the implementation
> test-first" is DONE; everything else in it still holds.

# Position as of 2026-09-18 night: rollback design accepted, implementation planning was next

Nothing is running. Claude Code ran last. The installer rollback redesign is **Accepted** by
the owner after four independent review rounds and eleven decisions, and the independent
review the owner required is done. **`bin/install.js` has not been edited.** Read
`.planning/HANDOFF.json` -> `session_2026_09_18_c` first, then
`docs/reviews/installer-rollback-redesign-2026-09-18.md` (the design) and
`docs/reviews/installer-rollback-design-review-2026-09-18.md` (the review record). Next: plan
the implementation test-first; do not edit the installer outside that plan. Nothing is owed
by the owner for the installer work; PR 4 closure still needs its own authorization. PR 74
merged, issue 75 filed. Every `git push`, including `--delete`, needs pinned bun 1.3.5 first
on PATH or the pre-push hook fails one known false red; never `--no-verify`.
**This worktree holds the live handoff; the main checkout's copy is dated 2026-08-30.**

---

> Everything below this line predates 2026-09-18 night. "One owner review owed", "three
> decisions owed", "Three answers owed" and
> "uncommitted bin/install.js fix" anywhere below are resolved. Where it calls PR 66, 67 or 68 open or
> awaiting an owner answer, it is stale: all three merged 2026-09-11.

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
