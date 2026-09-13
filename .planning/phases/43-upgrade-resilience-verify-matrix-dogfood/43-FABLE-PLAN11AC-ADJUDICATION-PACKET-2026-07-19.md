---
phase: 43
plan: 11AC
reviewer: fable
reviewer_role: authoritative-lead-developer-architect-designer
status: ready
created: 2026-07-19
---

# Plan 11AC And Project-Lead Fable Adjudication Packet

## Mandate

Fable is the authoritative lead developer, architect, and designer for this
project. Sol is an advisory defect finder. Repository evidence, locked user
decisions, security invariants, and WoW remain constraints; genuine conflicts
must be surfaced for user adjudication rather than silently resolved.

Return two linked decisions: adjudicate the current uncommitted Plan 11AC
implementation, then audit whether the whole-project sequence and governance
still lead to the desired end state. Do not edit files, run hosted workflows,
mutate GitHub, change credentials, or weaken a gate.

## Desired End State

Ship a market-ready Open GSD overlay that preserves fork identity, composes
cleanly over exact upstream authority, survives deliberate upstream upgrades,
and makes every release claim reproducible and fail-closed. Plan 11AC repairs
the hosted evidence and toolchain authority abstractions before the corrective
workflow wiring and coverage foundation depend on them.

## Reviewed Authority

Fable's 2026-07-14 whole-project review accepted exact-pinned Open GSD plus
overlay/override composition and made truthful coverage, hosted evidence,
cross-platform reproducibility, rollback, install, and uninstall blocking
release evidence.

Fable's 2026-07-18 interim review returned `Proceed-with-corrections`. It
directed the deterministic Bun authority into the corrective wave, required a
bounded hosted retry and formal post-passed-envelope Fable checkpoint, and did
not authorize public mutation outside the user-gated window.

## Current Repository Subject

- Worktree: `.claude/worktrees/agent-a1c0cd52236103329`
- Branch: `phase43-upgrade-resilience-20260703`
- Committed base: `9402163951e76bc7c75af8d500da1749af93bdd4`
- Plan status: pending; no Plan 11AC task is marked done
- Public state: no push, hosted retry, issue mutation, merge, or release from
  this implementation

The review subject is the uncommitted diff for:

- `.bun-version`
- `package.json`
- `bun.lock`
- `config/phase43-hosted-ci-contract.json`
- `config/phase43-toolchain-authority.json`
- `scripts/verify-hosted-ci.js`
- `scripts/verify-toolchain-authority.js`
- `tests/helpers/portable-test-api.js`
- `tests/verify-hosted-ci.test.js`
- `tests/toolchain-authority.test.js`

## Implemented Direction

The current implementation provides:

1. A closed hosted contract and immutable envelope schema.
2. Exact event-subject checkout plus adjacent subject verification for every
   governed job.
3. Exact workflow and expanded matrix job topology.
4. Exact GitHub Action commits, exact container digests, exact Bun `1.3.5`,
   declared Node 20/22 compatibility majors, and recorded runtime-tool policy.
5. Bounded fatal-UTF-8 parsers, bounded matrices, closed schemas, and bounded
   diagnostics.
6. A static toolchain mode that truthfully reports current workflow drift;
   Plan 11AH still owns live workflow conformance.
7. A narrow Node-native coverage seam that reuses the verifier suites under
   `node:test` and proves all four metrics per production file.

## Sol Advisory And Disposition

The read-only GPT-5.6-Sol review completed after 1,325 seconds in persisted
session `019f7878-9e58-70f1-bc08-ad2ac99bc2df`. Its verdict was
`Proceed with corrections`: no P0, seven P1 findings, and two P2 findings.
The complete transformed record is
`43-SOL-PLAN11AC-ADVISORY-REVIEW-2026-07-19.md`.

The following factual defects have now been corrected with RED-GREEN tests:

1. Jobs are retrieved from the selected run-attempt endpoint, and every
   execution-subject record is bound to that attempt.
2. Missing, zero, and unsafe run attempts fail closed.
3. `setup-bun` accepts only `bun-version-file`; `setup-node` accepts only
   `node-version`. Mirror/download source overrides fail closed.
4. Workflow, job, and step environments reject shell/runtime injection
   variables including `BASH_ENV`, loader overrides, `NODE_OPTIONS`, `PATH`,
   and `GIT_*`.
5. Hosted and toolchain manifests must govern exactly the same workflow set.
6. Pull request, run, job, and step identifiers are safe positive integers;
   purpose and timestamps are bounded and canonical.
7. `.bun-version` has a 128-byte fatal-UTF-8 read boundary.
8. The stale Sol-timeout resume statement is being replaced by this evidence.

## Proven Architecture Collision

Sol correctly requested that hosted verification consume the complete
toolchain evaluator. A direct implementation was tested and then removed
because it exposed an unresolved semantic collision:

- The toolchain checker currently classifies any job containing a `run` step
  as a Node/Bun runtime job. This conservative rule prevents executable-name
  guessing.
- The hosted contract adds a Bash `Verify execution subject` step to every
  governed job, including action-only jobs such as secret scanning.
- Therefore, direct composition requires `setup-node` and `setup-bun` in every
  action-only job solely because the authority check itself uses Bash.

That would add mutable execution surface, startup cost, and misleading runtime
claims. It also intersects the unresolved checkout/security-prelude ordering.
No policy was silently chosen. Exact workflow-set equality remains enforced;
full semantic composition is reserved for this adjudication.

## Decisions Required

### D1 - Control Step Versus Runtime Step

Choose how the toolchain evaluator distinguishes a contract-governed control
step from product/runtime payload execution.

Recommended direction: add a closed, injected control-step exemption that
matches the hosted contract's exact step name, shell, environment, and command
bytes. Every other `run` step continues to require Node/Bun setup. This keeps
the two authorities integrated without making action-only jobs pretend to be
runtime jobs.

Rejected default: install Node and Bun in every governed job. It expands
dependencies and does not improve the subject proof.

### D2 - Security Prelude And Checkout Closure

The current subject rule requires exact checkout as step zero and exact
verification as step one. Existing workflows place exact-pinned
`harden-runner` before checkout, while secret scanning legitimately needs
`fetch-depth: 0`. Decide whether the closed topology should be:

1. an exact allowlisted security prelude, then checkout and adjacent verify;
2. checkout and verify first, then the security action; or
3. another mechanically closed sequence.

Define job-specific checkout-input policy rather than allowing arbitrary
inputs. Do not weaken the secret scan's full-history requirement.

### D3 - Meaning Of Executed Subject

The current proof is momentary: it proves `HEAD` immediately after checkout.
Later steps can alter the worktree or repository. Decide whether Plan 11AC may
claim only `pre-payload subject verified`, or must prove immutable whole-job
execution through a governed wrapper/post-payload receipt.

State the exact product claim and the minimum evidence needed to support it.

### D4 - Runtime Receipts And Runner Identity

The current local `full` mode consumes caller-supplied evidence for only the
Cousin and performance subjects. Hosted job display names do not prove
resolved OS, architecture, image, Node patch, Bun version, or runtime tools.

Decide:

- which jobs require hosted runtime receipts;
- the closed exemption rule for jobs that do not;
- required receipt fields and emission topology;
- whether ownership belongs to 11AC, 11AH, or 11AJ; and
- whether `full` should be renamed `local-runtime` until trusted receipts are
  consumed.

### D5 - Coverage Foundation Ownership

Plan 11AC requires truthful 95% statements, branches, functions, and lines for
both changed executable paths. Bun's current coverage surface does not provide
the required independent authority. The user authorized installing Jest and
c8 only if they resolved that gap. A reversible proof found that full Jest was
unnecessary because this repository already has a `node:test` lane, while c8
11 is incompatible with the deliberate global minimatch 3 security override.

The implemented narrow seam therefore exact-pins c8 `9.1.0` and the standalone
Jest `expect` library `30.4.1`, adds one portable test API, and reuses the same
verifier suites under Bun and Node. Full Jest was removed. The c8 command is
junction-aware and enforces 95% per file for all four metrics. A compatible
`brace-expansion` `1.1.13` override removes the advisory on the new path.

Decide whether to accept this bounded seam inside 11AC and state any required
11D/11W amendment. It does not change their canonical coverage-runner decision
and must not silently become a general test-runner migration.

### D6 - Verifier Module Boundaries

The functional core and infrastructure dependencies are injectable, but the
current entry modules are large and have multiple reasons to change:

- `scripts/verify-toolchain-authority.js` is 982 lines and contains manifest
  schema validation, workflow/runtime policy, filesystem loading, and CLI
  routing.
- `scripts/verify-hosted-ci.js` is 1,622 lines and contains contract/schema
  validation, workflow topology, envelope policy, GitHub/git/filesystem
  adapters, receipt publication, and CLI routing. The current Plan 11AC diff
  adds 622 lines to this module.

That creates SRP, auditability, and maintenance-economics pressure in a
security-sensitive verifier, even though the pure evaluators and injected
adapters already provide useful seams. Decide whether Plan 11AC must split
domain policy, application use cases, infrastructure adapters, and CLI
composition now; may retain the files with a concrete bounded extraction plan;
or has sufficient cohesion as implemented. State exact file ownership and RED
boundary tests if a split is required. Avoid both cosmetic file slicing and an
unbounded refactor.

AST-level concentration evidence, gathered without modifying source:

- `verify-toolchain-authority.js` has 34 top-level functions and 8 exported
  symbols. `evaluateToolchainAuthority` spans 288 lines and
  `validateToolchainAuthorityManifest` spans 142. Its direct dependencies are
  `fs`, `path`, and `js-yaml`. Focused ESLint reports 0 errors and 0 warnings.
- `verify-hosted-ci.js` has 46 top-level functions and 19 exported symbols.
  Its largest responsibilities are verdict evaluation (170 lines), contract
  validation (130), envelope validation (127), and hosted collection (79). Its
  direct dependencies are only `fs` and `path`. Focused ESLint reports 0 errors
  and 13 existing security-plugin warnings at dynamic object/filesystem access
  boundaries.

This evidence suggests real responsibility concentration but does not prove a
particular file split. The requested decision remains whether extraction now
reduces security-review cost enough to justify added module boundaries and
churn before the workflow-wiring plans.

### D7 - Security Audit Lock Authority

Pending Plan 11AD currently requires both `bun.lock` and a new
`package-lock.json` because `scripts/audit-check.js` delegates to `audit-ci`,
which hard-requires the npm lock. The repository intentionally tracks only
`bun.lock`; `package-lock.json` is absent. Adding it would satisfy the existing
adapter but create two dependency-graph authorities in a Bun-first project.

Installed Bun 1.3.5 provides `bun audit --json` and structured advisory fields.
The current run reports eight advisories and exits nonzero. The CycloneDX high
contains numeric ID `1121296` and canonical URL ending in
`GHSA-v75r-vx73-82pj`. However, bounded probes showed Bun's `--ignore` did not
suppress that finding by either the GHSA slug or numeric ID, so a Bun-native
adapter would need to parse the fail-closed JSON, derive validated canonical
IDs, apply the existing expiry-bounded suppression policy itself, and reject
schema, network, and tool failures. This is feasible but is a larger adapter
change than the current dependency-only Plan 11AD text.

Decide between:

1. Keep one dependency authority by migrating the gate to a tested Bun-native
   audit adapter and removing `package-lock.json`/`audit-ci` ownership.
2. Deliberately retain `audit-ci` and add a generated npm lock with exact
   cross-lock graph-parity evidence and a named regeneration contract.
3. Another bounded design that preserves high/critical failure semantics,
   reviewed suppression expiry, hosted audit authority, and Bun-first tooling.

Do not accept an untested second lock, warning-only audit, raw advisory ignore,
or OSV as an unexplained substitute for package-manager graph authority. State
the exact owning plan, files, RED tests, and migration/non-migration criteria.

### D8 - New Stable Upstream And Override Disposition

Live evidence collected after this packet was first prepared changes the
upstream target. npm now reports stable `@opengsd/gsd-core@1.7.0`, published on
2026-07-15 after the completed 1.6.1 bump. The active exact pin remains 1.6.1,
and the vetted N=3 set remains 1.5.0/1.6.0/1.6.1. No pin or lockfile changed
during the refresh.

Issue 2252 is closed as completed after PR 2263 merged into `next`. The exact
1.7.0 registry tarball excludes `42-PLAN-REVIEW.md`, proving the reported suffix
bug is fixed. Its released broad fallback still classifies this packet's
`PLAN11AC` filename as a plan while preserving genuine `legacy-plan-draft.md`.
The local delimiter-bounded override therefore remains semantically necessary,
but its original upstream issue no longer owns the broader delta.

Phase 43 exists to prove a live upstream bump, so shipping against a stale
stable target is not acceptable. Folding 1.7.0 into current 11AC would mix an
upstream rebase with already reviewed security-authority changes and invalidate
the current review subject. The proposed boundary is a dedicated corrective
plan after local 11AD-11AI integration and before non-autonomous 11AJ. It would
advance package/authority/snapshots together, rotate N=3 to
1.6.0/1.6.1/1.7.0, execute the real upgrade and override-churn contracts,
re-adjudicate every override, retain or remove the plan-scan delta on evidence,
and rerun all affected local gates before requesting public authorization.

Decide whether that is the correct ordering and whether bump plus override
reconciliation should be one coherent plan or two. State the dependency edits,
required RED tests, exact evidence, and whether the broader classifier delta
should receive a new upstream proposal after explicit user approval. Do not
authorize a public filing through this decision.

## Verification Evidence

Current focused authority result:

```text
119 pass
0 fail
454 expect() calls
```

Command:

```text
bun run test -- tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js
```

Additional evidence:

- `bun run test:coverage:phase43-verifiers` passes 107 Node tests and reports:
  - hosted verifier: 98.76% statements, 96.81% branches, 98.21% functions,
    98.76% lines;
  - toolchain verifier: 97.04% statements, 95.33% branches, 100% functions,
    97.04% lines.
- `node --check` passes for both verifier scripts.
- `git diff --check` passes.
- ESLint reports 0 errors; repository-wide pre-existing warnings remain.
- Live `git ls-remote --tags` checks resolve all ten recorded GitHub Action
  tags to their exact manifest commits. A Docker Registry v2 manifest HEAD
  resolves `verdaccio/verdaccio:6` to the recorded OCI index digest
  `sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a`.
  Local `bun --version` reports `1.3.5`, matching `.bun-version`.
- The latest broad run executed 1,459 tests: 1,458 passed and 1 failed. A
  focused 40-test rerun confirms the failure precedes product execution.
  Bounded diagnosis found Windows PowerShell 5.1 resolves an incompatible
  PowerShell 7 WindowsApps security module before its own inbox module; import
  by name fails, while the explicit `$PSHOME` manifest import succeeds. A
  disposable follow-up protected and read back a real file DACL through that
  manifest and removed its temporary root. This remains dependency-blocked
  Plan 11AE harness work. The
  bundled statusline malformed-input status-9 result did not reproduce in 5/5
  direct source/bundle probes, an isolated bundled test, or a full 58/58
  hook-suite rerun. It remains a load-sensitive observation owned by Plan 11I
  if it recurs, not a Plan 11AC or 11AE product defect.
- No related subprocess remained after the probes. Nine generated
  `gsd-test-*` temporary directories were verified as session-created and
  removed.
- The generated coverage directory was removed after verification.
- `bun audit` no longer reports an advisory on the new coverage path after the
  compatible brace-expansion override. It remains red on eight pre-existing
  advisories, including the high CycloneDX CLI advisory owned by Plan 11AD;
  no broad dependency upgrade was folded into 11AC.

## Post-Packet Evidence Correction

Subsequent read-only compatibility verification exposed facts outside the
D1-D8 policy surface:

- Review filenames containing embedded `PLAN11AC` references inflated Phase 43
  from 49 to 51 plans. A RED-GREEN correction now requires a
  delimiter-bounded legacy `PLAN` token. Roadmap 19/19, repository 154/154,
  and N=3 945/945 gates pass; composed progress again reports 17/49.
- The Verdaccio spike had not proved host npm-config invariance. The user later
  confirmed manually setting the shared WSL/Windows npm userconfig to the local
  endpoint; this was not a spike-caused mutation. The registry was restored to
  npmjs without printing or replacing the existing npmjs credential. Pending
  Plan 11AF retains pre/post byte invariance for external npm config as a
  defense-in-depth gate.
- Read-only public-readiness checks confirmed the repository was already public;
  no visibility mutation occurred. Published `origin/*` history has no real
  Gitleaks secret finding, and all workflow runner selectors resolve to standard
  GitHub-hosted runners. Main branch protection still requires the stale
  `Boundary & Override Check` context, while current workflows expose separate
  boundary-report and blocking override contexts.
- Published planning evidence includes historical absolute user paths and
  bounded account/authentication diagnostics. These are not credentials. The
  proposed downstream ownership is a forward-looking public-artifact contract
  in Plan 11AH and an explicitly user-gated repository-setting reconciliation in
  Plan 11AJ, without claiming a history rewrite can undo prior exposure.

These corrections do not select or narrow any D1-D8 decision. No public
mutation, hosted run, or live first-party service mutation occurred.

## Whole-Project Lead Checkpoint

This is not a one-plan rubber stamp. After resolving D1-D8, audit the enclosing
program against the desired Open GSD end state and the user's systems-thinking,
SOLID, loose-coupling/tight-integration, TDD, and 95%-per-metric constraints.

Current program state:

- The v1.2 Ship-Ready Hardening milestone projects 39/71 completed plans and
  summaries (55%). Phases 40.5, 40.6, 41, and 42 are complete. Phase 43 is at
  17/49; Phase 44 release readiness has not started.
- Plan 11AC remains pending and uncommitted. Plans 11AD-11AI own bounded local
  corrections after its decision. Non-autonomous Plan 11AJ alone may request a
  fresh push, hosted cycle, GitHub-setting mutation, or formal Fable window.
  Plan 11D and the coverage program remain downstream of truthful hosted and
  Fable authority.
- Draft PR 23 still points to remote head `2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`.
  Its prior hosted cycle is real failed evidence, not a passed envelope and not
  a billing-only block.
- The latest broad local run is honestly red only on the dependency-blocked
  Plan 11AE harness failure described above. `bun audit` remains red on eight
  pre-existing advisories, including the Plan 11AD CycloneDX high.
- Stable Open GSD 1.7.0 now postdates the active 1.6.1 pin. The exact package
  fixes issue 2252's suffix case but not the broader embedded-plan-reference
  delta, so a reviewed pre-hosted bump and override reconciliation is required.
- A separate local branch from `origin/main`,
  `docs/pr-issue-evidence-workflow`, is five unpushed commits ahead. It adds
  issue forms, a PR evidence template, standardized labels, a machine-readable
  hosted gate contract, public-artifact hygiene, and an issue-ready stale
  branch-protection record plus issue-ready governance adoption, coverage-gate,
  and release-plan records. Focused governance tests pass 12/12 with 182
  assertions; the test also proves exact pull-request workflow/job inventory,
  cataloged issue-form labels, and durable issue links for every missing
  capability. Focused ESLint, changed Markdown, and diff gates pass.
- That governance contract records 95%-per-metric coverage enforcement and a
  no-publish release-plan job as missing release gates. Fuzzing is currently
  classified not applicable until the project owns a suitable untrusted-input,
  binary-format, or protocol boundary.
- The remote repository has none of the standardized labels yet. Main branch
  protection is strict but requires the obsolete combined boundary context and
  omits the current blocking override context. Local commit signing is also not
  configured. Labels, issue creation, push, PR, protection reconciliation,
  signing-key work, merge, and release all remain explicitly owner-gated.
- The repository was already public. Published history contains no real secret
  finding in the completed origin-ref scan, but it does contain historical
  personal paths and bounded account/authentication diagnostics. The proposed
  policy is forward hygiene without pretending a history rewrite can remove
  already published information.

Assess whether this sequencing is the minimum coherent structure or whether it
creates unnecessary gates, couples governance to Phase 43 incorrectly, leaves
an unowned release or security gap, or postpones a prerequisite until too late.
Preserve explicit owner gates and do not infer approval for public mutation.

## Required Fable Output

Return:

1. `Proceed`, `Proceed-with-corrections`, or `Stop-and-redesign`.
2. A numbered decision for D1-D8 with rationale.
3. Exact Plan 11AC task and acceptance-criterion amendments.
4. Exact downstream ownership amendments for 11AH, 11AJ, 11D, and 11W.
5. Required RED tests before implementation continues.
6. Any security, product-claim, extensibility, or maintenance-economics defect
   not covered above.
7. A whole-project lead decision on the Phase 43 -> Phase 44 sequence, the
   governance branch, missing hosted gates, public-artifact policy, and whether
   any deliverable must be reordered, split, combined, or stopped.
8. A prioritized P0/P1/P2 action list with an explicit owner and gate for every
   deferred item; identify anything that is useful but unnecessarily elaborate.
9. Which conclusions are repository-fact-high-confidence versus
   context-dependent judgment.

The formal standing Fable checkpoint still occurs after a passed hosted
envelope and before 11D. This adjudication cannot substitute for that later
checkpoint.
