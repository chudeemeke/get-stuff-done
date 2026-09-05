# September 5 Open-GSD skin completion

Execution of the existing contract, not a new strategic audit. Authority:
`docs/inbox/2026-09-05-conversations-opengsd-skin-completion-contract.md`,
September 2 proposal's September 5 ratification, and campaign decisions in
`HANDOFF.json` (original ratification commit `38504333`).

## Sequence and invariants

1. Finish existing PR64, integrate it into PR63, obtain green final-head checks,
   merge PR63 (#45), then integrate main into the recovered campaign.
2. Walk 1.9.1, 1.10.0, 1.11.0, 1.12.0; one vetted PR per step (#53).
3. Complete approved checker/routing, editor hook exclusions and digest work.
4. Prove state integrity and staged installs; establish runtime authority with
   backups and conflict detection (#54), then activate the vetted generation.
5. Complete applicable Phase44 automation, recovery and D11 comparison.
6. Reconcile source, artifact, installation, GSD and owner notifications.

Upstream remains read-only. No moving endpoint. Keep the subagent planner.
Keep read/workflow guards and context warnings. No repeated D1-D11 interview.
No evidence inferred from line counts, a different branch, or a summary-free exit.
Use live reviewer resolution, not dated quota claims. Global non-GSD instructions
remain with their owner. Tier M sign-off follows the canonical September2 policy;
tuicr is optional and must never be claimed without actual review evidence.

## Acceptance and evidence map

| Contract criterion | Existing task / evidence surface | Remaining acceptance |
|---|---|---|
| Correct source | #53; upstream-authority.json, compose, vetted manifest, compat reports | Fixed 1.12.0 release/commit, integrity and final fork/artifact manifest |
| Thin skin | #43; overrides/**/REASON.md; lapse-window findings | Per-behavior drop experiments after adoption corrections; seam/owner/retirement ledger |
| Trustworthy tests | #45 PR63, #44 closed, #49; Phase43 verifier/matrix | Final-head suite summaries, exit codes, coverage, negative checks and CI |
| Working installs | #54; bin/install.js, Phase43 runtime receipts | Fresh Windows Claude/Codex and Linux; routes/imports, effective effort, installed effort-sync |
| State integrity | September2 writer report; state/roadmap overrides | All writer fixtures, unknown keys, milestone position, bullet phases and planned-phase behavior |
| Recovery | HANDOFF.json, CONTINUE.md, phase continuation | Interrupt/resume on both runtimes; correct branch/task/decisions; inbox authority/backup |
| Safe updates | Phase43 verifier/matrix; Phase44 boundary | Staging, no-op, refusal, interruption, rollback and local conflict preservation; approved cadence |
| Useful efficiency | D4/D11; Conversations Phase24 baseline | Digest-first comparison and held-out defect/recovery; tokens/cache/time/interventions |
| Closure | #52/#53/#54; roadmap, receipt, inbox Event Logs | Installed generation agrees with evidence; leftovers classified; paired notifications |

All remaining acceptance cells are pending until evidence is recorded. A merged
bump alone cannot close this contract.

## Inbox triage (2026-09-05)

| Item | Disposition and next owner/trigger |
|---|---|
| September5 skin contract | In progress; get-stuff-done executes this map |
| September1 cost/checker assessment | In progress; existing D1-D11 scope, consumed by this contract |
| September2 engine/prose proposal | In progress; ratification binding; D4/D7 narrowed outcomes override proposal |
| September2 commit-docs bug | Triaged; get-stuff-done verifies partial-config fixture against candidate and installed artifact before closure |
| September2 state/bullet report | Triaged; get-stuff-done candidate fixtures block D3 adoption |
| September2 lapse-window review | In progress; get-stuff-done dispositions M1-M4/L5-L8 during campaign |
| Authkey portable gates | Existing backlog999.7; get-stuff-done, post-v1.2 or explicit reprioritization |
| Memory-nexus health | Existing backlog999.8; get-stuff-done, post-v1.2 or explicit reprioritization; no Phase43 blocker |
| Kanbanflow model catalog | Triaged; get-stuff-done final bump checks upstream seam and live model authority |
| Conversations checker effort | Triaged; get-stuff-done final bump D1/D2; installed workaround remains until verified replacement |

## Recovery protection

At pickup the only untracked paths were `coverage/` and
`get-stuff-done/memory/`; both are preserved. One registered worktree.
Local inbox copied before triage to
`C:/Users/Destiny/.codex/backups/get-stuff-done/2026-09-05-skin-start/inbox/`;
all branch/tag refs bundled alongside it as `repository.bundle`.
This backup does not certify global installs or desktop dirty work; inventory
and backup those before activation/removal. Active inbox ignores stay intact.

## Execution evidence

- Pickup: PR64 `7b89424b` has 20 successful checks; PR63 `2b692738` has Audit CI
  and OSV failures, all other reported checks successful. Both open.
- Recovered campaign head `add27ff8`; stale ratification requests corrected in
  HANDOFF, CONTINUE and STATE's navigation prose. Plan counters unchanged.
- Local source confirms commit checks disagree on unset `commit_docs` in
  upstream 1.8.0 commands.cjs (614 versus1565); fixture proof remains required.
- Target-action feed pulled from the receiver CWD; no delivery blocker or
  unusable worktree; portable gates retain their existing owner and trigger.
- PR64 merged as `f19045ce`. PR63 final head `57ef0dc1` incorporates it and
  closes immediate-exit and dangling-shim review findings. At 05:11 UTC all
  completed checks passed; Windows paired performance still running.
- PR65 `c6aae6ce` makes the compatibility subprocess emit TAP explicitly and
  rejects missing summaries. Independent review passed. The repaired negative
  experiment reports 302 pass /14 fail, with full per-assertion TAP in
  `evidence/bump-1.8.0-drop-tap-2026-09-05.json`.
- PR66 `750d8d54` adds read-only install generation drift detection, honors
  runtime home overrides, and recognizes fork legacy installs. Review fixes
  applied; focused script coverage 100% on all four metrics. No reinstall yet.
- PR67 repairs explicit Husky bootstrap. A real push at `1ca1d47a` passed
  1673 tests /0 failures after an earlier correctly refused ACL timeout.
  POSIX review correction `91ee489c` requires readable payload rather than
  executable payload; final push/checks pending.
- Pure 1.12.0 acceptance baseline: 12 tests /9 pass /3 fail /0 skipped,
  exit1. State writers, milestone position and five commit-docs configurations
  pass. Bullet-only roadmap/manager phases and semantic replanned plan count
  remain red. Fixtures and full TAP are committed; see tests/acceptance/README.md.
