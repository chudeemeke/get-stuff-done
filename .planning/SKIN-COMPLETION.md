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

September14 consumer dependency: Conversations O01 reproduced mixed-generation
reads and partial multi-file publication. Final recovery/state-integrity
acceptance also requires `.planning/COHERENT-RESUME-INTEGRATION.md`. Consumer
source/installed paths are inventoried; the shared protocol is still under
review. Conversations supplies its versioned contract receipt before GSD
implements/adopts it. Existing application PR work continues, with no claim that
single-file atomicity establishes coherent recovery.

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
- PR63 merged as b1f10321 after final-head CI and review; main is integrated.
- 1.9.1 port 060f5b1a retains the nine classified deltas. The formal matrix
  retry passed316/316, zero skips, exit0; report applied and hash-verified.
  Its earlier PowerShell timeout remains recorded with the original threshold.
  Bounded independent port review found no actionable findings. CRLF statusline
  regression passes. Full pre-push and hosted final-head gates remain open.
- PR65 was approved and merged as f77b38d8 after19 successful checks.
- PR66 local work additionally corrects Codex target selection and tilde home
  expansion. Isolated real Codex installation writes matching metadata and
  VERSION under CODEX_HOME and does not create a Claude directory. Latest local
  code and receipt await push; older remote CI is not final-head evidence.
- PR67 final pre-push passed1673 tests, zero failures. PR68 preserves local
  patch backups and has passed its complete pre-push gate. Their hosted checks
  and owner integration decisions remain open; no user runtime was reinstalled.

### Review corrections and recovery refresh

- PR69 had20 successful checks at df0d3f9c. Two later installer review
  findings are corrected at c9ecc23c: failed Codex agent generation restores
  shared defaults, and Kimi Code help uses its distinct selector. Three actual
  composed-installer cases failed before and pass after. Bounded Astra/xhigh
  review found no remaining findings. Refreshed final-head gates are pending.
- PR67 a62f25bd has20 successful checks. Its POSIX accessibility finding is
  fixed and resolved; final Astra/xhigh review found no findings. The owning
  inbox contains the concrete TierD brief; its owner answer is pending.
- PR68 preserves complete prior patch generations, including matching
  metadata and pristine baselines, before upstream runs. Failure rollback,
  repeated generations, linked paths and partial archive refusal pass60
  focused tests; bounded review found no remaining findings. Full push pending.
- PR66's Windows performance failure is retained (ratio2.10 versus1.75).
  A new raw-diagnostics upload preserves future failed comparisons without
  changing the gate or emitting a passing receipt. Focused workflow checks
  and bounded review passed; full push and final-head CI remain pending.
- D4 helper focused acceptance passes34 tests with100% of each scoped coverage
  metric and11 rejected decision mutations. Its full push was refused after
  1699 passes/13 failures. Serial retry cleared12 original failures; the one
  persistent test now caches immutable fixtures, retains all5 assertions and
  the original timeout, and passes234ms. Full push must pass before merge.
- Five session-created Windows worktrees now live under this repository's
  existing `.claude/worktrees/` container. Relocation preserved heads/status/
  dirty byte hashes. No new top-level `C:/Projects` project, temporary or
  worktree directory may be created without express consent.

### D4 native integration seam verified

Released1.12 already has the needed role-specific `agent_skills` mapping.
`plan-phase.md` queries the planner block and injects it into both planning
prompts; `agents/gsd-planner.md` also references the shared self-load bootstrap,
whose deduplication guard avoids loading a second block. The existing config
merge preserves per-role user mappings. A bare `global:<skill-name>` resolves
through the native runtime skill root; plugin-namespaced skills are not portable.

The isolated installed query was exercised for both Claude and Codex using an
existing delivered skill. It emitted the correct `.claude/skills` and
`.agents/skills` paths without warnings. Receipt:
`.planning/evidence/skin-1.12-pure-agent-skills-probe.json`.
This proves the integration seam, not digest delivery or planner execution.
Final D4 delivery should use one additive skill and this existing mapping,
preserving authored mappings and verifying actual planner consumption. A full
planner/workflow copy or another skill manager is unnecessary for this purpose.

### Abrupt-session recovery, September 5

The corrected 1.9.1 compatibility retry passed 316 tests with no failures or
skips; its report is applied and the vetted manifest validates. The prior
failed retry is retained. Full push and hosted evidence still need refresh.
PR70 publishes the bounded digest at 573d9f91 after 1712 passing pre-push tests;
actual planner consumption remains open. PR68 has additional reproduced
snapshot-cleanup and duplicate-child-event fixes. Its expanded 90-test Node
suite passes, but strict wrapper coverage remains below Tier S: 96.53 percent
statements/lines, 94.11 functions, 92.95 branches. Agent owner: get-stuff-done;
retirement trigger: complete file-tier coverage and decision checks before
merging the installer change. No package-wide coverage compliance is claimed.
