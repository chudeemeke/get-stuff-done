---
phase: 999.8
review: standing-project-checkpoint-health-diagnostic-coherence
reviewer: fable
status: blocked-auth-inconsistency
invocation: claude -p --model fable
attempted_at: 2026-07-14T04:44:00+01:00
last_attempted_at: 2026-07-14T06:52:00+01:00
retry_after: safe-shared-auth-refresh
---

# Standing Fable Project Checkpoint: Health Diagnostic Coherence

## Gate Status

The exact required invocation, `claude -p --model fable`, returned no review:

```text
You've hit your session limit - resets 6:50am (Europe/London)
```

This checkpoint is unavailable, not passed. It is a scoped lead-decision
checkpoint under Fable's standing whole-project developer, architect, and
designer role established in
`43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md`; it is not a one-plan substitute
for that role. The former Plan 43-11O proposal is preserved as backlog 999.8;
executable source work must not begin until promotion, a current Fable review,
and disposition of every accepted finding in the affected program artifacts.

The scheduled retry ran after the documented quota reset with the prior
whole-project review, current program truth, research, and the former Plan 11O in a
118,678-character cold-readable packet. The exact invocation returned no
review:

```text
Failed to authenticate. API Error: 401 Invalid authentication credentials
```

A one-line `claude -p --model fable` probe reproduced the same 401. Status-only
diagnostics establish a local authentication inconsistency:

- Claude Code is `2.1.208`.
- `claude auth status` reports `loggedIn: true`, first-party `claude.ai`, and a
  Max subscription.
- `C:\Users\Destiny\.claude\daemon-auth-status.json` reports
  `status: auth_required`.
- Four Claude processes are active, including long-lived sessions that must not
  be disrupted.
- Anthropic's public status page reported Claude Code and the Claude API
  operational with no 2026-07-14 incident at diagnosis time.

The current CLI exposes `auth login`, `auth logout`, and `auth status`, but no
non-disruptive refresh command. Global logout/login, token replacement, daemon
restart, or credential-file mutation is therefore prohibited while shared live
sessions remain active. The next retry requires an explicit safe authentication
window. No substitute model review is treated as Fable evidence.

## Program Context

- The target is a market-ready GSD overlay on exact-pinned Open GSD authority,
  with minimal removable overrides and preserved fork identity.
- Phase 43 is proving upgrade resilience and truthful production assurance.
- Plan 11N remains in progress because GitHub's account billing lock prevents
  all hosted jobs from starting. Its exact-head verifier correctly reports no
  hosted evidence.
- Plan 11D freezes the production-source denominator and cannot begin without a
  fresh passed 11N receipt.
- Independent source work completed before 11D is preferable to silently adding
  executable files after the denominator is established.

## Verified Defect

The authoritative reproduction uses the composed Open GSD 1.6.1 runtime at
`dist/gsd-core`, not the repository's deprecated legacy compatibility mirror.
Against `C:\Projects\memory-nexus`, `validate health` emits seven false `W002`
warnings for repeated Phase 32.5 and Phase 38 references.

Open GSD 1.6.1 already makes `W002` non-repairable and has checklist-aware
`W006`/`W007` handling. The remaining active defect is narrower:

1. `W002` scans all STATE narrative phase references.
2. Its valid set reads disk/archive tokens plus ROADMAP headings only.
3. It does not reuse checklist-aware `buildRoadmapPhaseVariants()`.
4. It emits one warning per occurrence instead of one per unresolved phase.
5. Parent/family wording such as Phase 38 remains semantically unresolved when
   the declared work is Phase 38.0 through 38.7.

The fetched Open GSD `next` source at
`2cbf18642005d235a14a877a24107ba6650cdf7b` retains that W002 algorithm in
`src/verify.cts`. Its newer archive coverage does not add checklist-only
declarations, duplicate-warning canonicalization, or a parent-phase shorthand
rule. The checkpoint must therefore judge the product semantics and override
cost; it must not assume that waiting for the current development branch will
remove this defect.

Upstream issue `open-gsd/gsd-core#1697` documented the checklist-only `W002`
defect. Maintainers confirmed it persisted on 1.6.0, then closed the issue for
lack of reporter follow-up rather than because a fix shipped.

The exact 1.6.1 confirmation and request to reopen are public at
https://github.com/open-gsd/gsd-core/issues/1697#issuecomment-4965209848.

## Historical Proposed Boundary For Review

The following proposal is retained as evidence, not as active Phase 43 scope.
Locked Phase 43 decision D-22 supersedes its placement because no Phase 43
smoke verifier depends on `validate health` output.

- The superseded proposal added Plan 43-11O in Wave 16 after Plan 11M.
- The superseded proposal made Plan 11D depend on both 11N and 11O.
- Extend the existing candidate-runtime contract in
  `tests/runtime-overrides.test.cjs` before implementation.
- Add one surgical full-file `verify.cjs` override plus its mandatory removal
  reason because the composition system replaces upstream files atomically.
- Reuse Open GSD's shared phase-variant helpers and the full ROADMAP declaration
  set; do not create another roadmap parser.
- Deduplicate genuinely invalid references by canonical phase identity and keep
  `W002` non-repairable.
- Decide parent/family semantics only after review. The leading candidate is to
  accept integer `N` as shorthand only when exact declared `N.0` exists, never
  merely because some `N.x` child exists.
- Prove the change through the composed runtime, N=3 exact candidates, and a
  read-only memory-nexus reproduction. Post evidence to upstream issue #1697.

## Required Fable Critique

1. Reassess whether this delta changes the desired end state, architecture,
   accepted critical path, release blockers, or standing checkpoint cadence.
2. Confirm or reject 11O as genuinely independent of the hosted-CI blocker.
3. Decide whether fixing now is justified or should be upstream-only/deferred.
4. Choose a defensible STATE-reference contract: all narrative references,
   authoritative fields only, or a classified hybrid.
5. Review the `N` to `N.0` shorthand rule and range syntax such as `Phase 38+`.
6. Identify required modern-ID fixtures: milestone-prefixed, project-code,
   padded/unpadded, decimal, archive, and invalid near-prefix cases.
7. Define drift controls that make a full-file upstream override acceptable.
8. State the go/no-go criteria and the smallest safe implementation boundary.

## Disposition

Pending Fable availability. No findings have been inferred or substituted.
