---
phase: 999.8
status: backlog
owner: get-stuff-done
created: 2026-07-14
activation_trigger: after-v1.2-or-explicit-reprioritization
---

# Open GSD Health Diagnostic Coherence

## Problem

Open GSD `1.6.1` and `next` can emit duplicate or false `W002` health warnings
for valid long-lived roadmap references. The defect is real, but Phase 43's
upgrade smoke path does not consume `validate health`; locked Phase 43 decision
D-22 therefore keeps this work outside the upgrade-resilience critical path.

## Preserved Evidence

- Exact-pin and `next` source analysis is retained in `RESEARCH.md`.
- The failed Fable invocation, verified defect, proposed boundary, and upstream
  issue evidence are retained in `FABLE-HEALTH-DIAGNOSTIC-REVIEW-2026-07-14.md`.
- Open GSD issue `#1697` contains the exact `1.6.1` reproduction comment. A
  future implementation must verify the issue and current upstream pin again.

## Promotion Contract

Promote after v1.2 ships, or earlier only through explicit reprioritization.
Before source work:

1. Run GSD discuss/spec and verify the defect against the then-current exact
   Open GSD pin and `next`.
2. Run `claude -p --model fable` as a checkpoint in Fable's standing
   whole-project critic role, covering program impact as well as the local
   diagnostic semantics.
3. Decide the authoritative phase-reference contract without silently changing
   `N`, `N.0`, child, range, milestone, or project-code identity semantics.
4. Require TDD, composed-runtime and N=3 evidence, upstream issue/PR evidence,
   and a removable override contract if an upstream fix is still unavailable.
5. Verify any owning-project inbox transition or closure event explicitly.

## Boundary

Owner: get-stuff-done. Trigger: v1.2 release or explicit reprioritization.
This backlog item does not block Phase 43 or Phase 44 unless a future reviewed
plan introduces a direct dependency on `validate health` output.
