# Plan 11AH Authoritative Implementation Review Packet

## Review Authority

Fable is the authoritative lead architect and implementation reviewer for this
checkpoint. Review the repository at implementation revision
`2d592060a25e6dd77aa7193ff59159f289d670be`, plus the durable later-plan
disposition at `1ee33cbb2fc2f94a08d78eaa406b28343ac26533`. Do not infer
correctness from this packet. Inspect the exact diff, contracts, workflows,
tests, prior binding review, and Sol rejection before returning a verdict.

The prior authoritative architecture review is
`43-FABLE-PLAN11AG-11AH-AUTHORITATIVE-REVIEW-2026-07-20.md`, whose preserved
SHA-256 is
`31bfb86617ad7a1140db07060a9600269f5c2a83a5b84c57509c19c600821522`.
Its Plan 11AH verdict was `APPROVE_PLAN_WITH_FOLLOW_UPS`; findings B-F1 through
B-F7 are binding implementation criteria.

## Objective

Plan 11AH must wire the accepted Phase 43 primitives into deterministic,
fork-safe, read-only workflows without claiming hosted evidence that does not
exist. It must make paired evidence the sole blocking PR performance authority,
separate public mutation from diagnostics, and distinguish product-owned
compatibility/documentation correctness from historical or third-party
availability evidence.

The strategic project direction remains an overlay-first, market-ready GSD fork
that preserves fork identity while tracking active Open GSD authority. This
checkpoint is a local workflow-authority implementation slice, not a release or
the project end state.

## Exact Review Subject

- Baseline before Plan 11AH implementation: `1feccefc19d3906235e9b5ef57843c1e54641430`
- Initial implementation revision rejected by Sol: `30a51363ecad02bc090edb3c98cd215a509f64e6`
- Corrected product implementation revision: `2d592060a25e6dd77aa7193ff59159f289d670be`
- Later-plan issue-mutation disposition: `1ee33cbb2fc2f94a08d78eaa406b28343ac26533`
- Trusted bootstrap pin: `5c813db4d8a17bd2dbf7523e016a5152a6a0c3ce`
- Accepted measurement-harness pin: `35cbe0883a65409b13f9b7cc6347c793df2a2f15`
- Branch: `phase43-upgrade-resilience-20260703`

Both trusted pins are ancestors of the corrected implementation revision. The branch and
pins remain local and unpushed. Their canonical remote reachability is therefore
not claimed; an owner-authorized push must publish this exact ancestry before a
workflow can rely on it.

Inspect with:

```text
git diff --stat 1feccefc19d3906235e9b5ef57843c1e54641430..2d592060a25e6dd77aa7193ff59159f289d670be
git diff 1feccefc19d3906235e9b5ef57843c1e54641430..2d592060a25e6dd77aa7193ff59159f289d670be
git log --oneline 1feccefc19d3906235e9b5ef57843c1e54641430..1ee33cbb2fc2f94a08d78eaa406b28343ac26533
git merge-base --is-ancestor 5c813db4d8a17bd2dbf7523e016a5152a6a0c3ce 2d592060a25e6dd77aa7193ff59159f289d670be
git merge-base --is-ancestor 35cbe0883a65409b13f9b7cc6347c793df2a2f15 2d592060a25e6dd77aa7193ff59159f289d670be
```

## Implemented Architecture

### Event And Evidence Authority

- The hosted contract defines event-specific repository/ref authority and
  per-job execution profiles. Every governed single-subject job performs one
  exact checkout followed immediately by an exact HEAD check.
- Blocking performance is restricted to same-repository pull-request heads.
  Each performance row verifies four immutable subjects: bootstrap, harness,
  base reference, and head candidate. Fork and non-PR outcomes are explicitly
  no-authority.
- PR workflow definitions and check names are claim-only. The later owner-run
  collector remains merge-evidence authority.
- Tier A Jobs API identity, Tier B bounded runner observation, paired raw
  evidence, binding manifests, and Artifacts API metadata are separate inputs
  to one pure join boundary.
- The pure join parses and hashes bounded raw Tier B receipt and comparison
  bytes, compares them with their parsed records and manifest digests,
  re-adjudicates raw paired samples, and binds comparison subjects and runtime
  identity before returning authority.
- Current topology is contract-derived as 39 Tier A jobs, 21 Tier B subjects,
  18 standalone Cousin artifacts, and three paired bundles across five exact-
  head first-attempt workflow runs.
- The legacy latest-attempt collector is removed. `collect` fails before I/O
  until the explicit Plan 11AJ owner-authorization gate; 11AJ owns the first
  live exact-cycle collector.

### Reproducible Execution

- Every repository workflow action use is covered by an all-workflow immutable
  pin test; two older floating-tag workflows were corrected. Verdaccio uses an immutable
  digest, Bun comes from `.bun-version`, and Hyperfine 1.20.0 assets have exact
  platform identities and SHA-256 checks.
- Paired performance installs dependencies only in the trusted harness, leaves
  base/candidate subjects untouched, preflights all required authority files,
  runs at least ten pairs, and calls `check-perf.js --comparison` as the sole
  blocking adjudicator.
- `perf-baseline.yml` is explicitly manual, historical, non-blocking, and uses
  the same immutable dependency discipline.
- The unused floating `statusForRatio` export is removed.

### Fork And Token Safety

- Governed workflows require top-level `contents: read`; job permissions may
  only restate that read-only authority.
- A closed, reasoned automatic-token allowlist contains only non-persisting
  `actions/checkout` implicit authentication and the pinned Gitleaks action's
  exact `GITHUB_TOKEN` environment binding for read-only PR metadata.
- The verifier rejects all secret or automatic-token expressions in run steps,
  workflow/job scope, and non-allowlisted action inputs/environments. It also
  rejects token-shaped bindings even when they hide the token behind another
  expression or literal.
- Workflow/job token-shaped keys, reusable-workflow secret forwarding, and job
  environment authority are rejected. Fork PR dependency-cache publication is
  disabled; trusted same-repository and non-PR events retain caching.
- Upload/download artifact actions remain outside the `GITHUB_TOKEN` allowlist.
- Diagnostic PR workflows emit normalized proposal artifacts and summaries.
  Issue mutation is isolated to a manual, preview-default workflow requiring an
  explicit apply boolean and exact confirmation token.
- Windows flake proposals record the exact event subject, not the synthetic PR
  merge SHA.

### Truthful Compatibility And Documentation

- The active pinned compatibility row now propagates failure; historical rows
  remain visible and artifact-backed under the existing matrix policy.
- Project-owned documentation failures remain blocking. Only the decorative
  `api.star-history.com` endpoint is excluded from blocking Lychee checks.
- A separate scheduled/dispatch-only read-only workflow applies bounded retry,
  classifies 404/410 link-rot candidates separately from 5xx availability
  degradation, emits stable recurrence keys and a step summary, and uploads a
  run-scoped artifact. It does not mutate issues.

## Binding Finding Disposition

| Finding | Implementation disposition |
| --- | --- |
| B-F1 | Same-repository PR heads alone receive blocking paired authority; fork PRs receive explicit no-authority. |
| B-F2 | Contract records PR-side definitions/check names as claims and owner-run collection as merge authority. Live ruleset enforcement stays owner-gated in 11AJ or later governance. |
| B-F3 | Real local Hyperfine adapter-operability remains explicitly assigned to 11AI. It was not silently pulled into 11AH. |
| B-F4 | `runnerImage` is the observed OS fingerprint; nullable hosted image name/version are separate Tier B fields. |
| B-F5 | Closed automatic-token allowlist contains only checkout and Gitleaks, with reasons; artifact actions remain outside it. |
| B-F6 | All four performance checkouts preflight `package.json`, `bun.lock`, and `.planning/upstream-authority.json` before measurement. |
| B-F7 | The pure evidence-binding module remains bounded; no broad Phase 44 verifier-policy refactor was absorbed. |

## Sol Rejection Disposition

The advisory review
`43-GPT-5.6-SOL-PLAN11AH-IMPLEMENTATION-REVIEW-2026-07-20.md` rejected
`30a51363` with five closure blockers. Revision `2d592060` dispositions them as
follows:

| Sol finding | Corrected disposition |
| --- | --- |
| Raw paired evidence absent from the pure join | Raw receipt/comparison bytes are bounded, decoded, hashed, matched to parsed records and manifests, semantically re-adjudicated, and bound to expected subjects/runtime identity. |
| Legacy collector selects independent latest attempts | Public collection now fails closed before I/O until Plan 11AJ; the old passed-envelope implementation was removed. |
| Inherited token scopes are incomplete | Workflow/job token keys, reusable secrets, and job environments now fail closed in addition to expression and step checks. |
| Fork PR jobs can publish caches | Every PR-capable dependency-cache step has an exact trusted-head/non-PR condition. |
| Windows flake records merge SHA | The flake command now receives the event-aware exact head expression. |

Sol classified record-level issue-mutation preview and stale-closure ownership as
a later-plan follow-up. Revision `1ee33cbb` makes those explicit Plan 11AJ
pre-authorization acceptance criteria; the workflow remains manual, default-off,
unrun, and owner-gated.

## Chronological Implementation Slices

1. `b0bd9a5d` removes the floating ratio API.
2. `4d4f00c0` defines event evidence authority.
3. `5c813db4` records trusted Hyperfine bootstrap assets.
4. `e40b6dba` enforces execution-subject profiles.
5. `0ff974d0` separates runtime receipt authority.
6. `649919e9` derives evidence transport topology.
7. `f784de94` joins one authoritative evidence cycle.
8. `82a74a21` publishes Cousin runtime receipts.
9. `1e77bff5` emits paired binding manifests.
10. `e8631398` enforces paired performance authority.
11. `9265de88` pins hosted execution dependencies.
12. `5a66ca80` binds jobs to exact event subjects.
13. `459768be` gates public issue mutations.
14. `76714a31` enforces compatibility and link authority.
15. `30a51363` enforces automatic-token authority.
16. `909651b8` records Sol's implementation rejection and evidence limits.
17. `2d592060` closes the five reproduced evidence-authority blockers and all-workflow pin gap.
18. `1ee33cbb` gates issue-mutation record validation and ownership in Plan 11AJ.

`3dc067e5` is an adjacent backlog-only commit for validator scoping defects. It
does not alter the Plan 11AH product implementation.

## Local Verification Evidence

- Canonical full Bun suite: 1,648 passed, zero failed, 5,597 assertions across
  63 files.
- Repository compatibility: 154 passed, zero failed across 34 suites.
- Phase 43 verifier c8 gate: all six included executable files exceed 95% for
  statements, branches, functions, and lines independently.
- Corrected `hosted-evidence-binding.js`: 98.48% statements, 95.88% branches,
  100% functions, and 98.48% lines. Corrected
  `verify-toolchain-authority.js`: 97.47% statements, 95.44% branches, 100%
  functions, and 97.47% lines.
- Corrected focused authority gate: 174 passed, zero failed, 1,161 assertions.
  The final Phase 43 c8 verifier gate also passed 174 tests across seven suites.
- Static toolchain authority: `{ "mode": "static", "ok": true,
  "diagnostics": [] }`.
- Full ESLint: exit zero with 219 repository-baseline warnings. Changed-file
  ESLint has zero errors; its 12 warnings are pre-existing lines in
  `verify-hosted-ci.js`, not findings introduced by the correction.
- Workflow lint, documentation lint, and `git diff --check`: passed.
- Generated coverage files were removed after the passing evidence was read.

## Explicit Non-Claims And Owner Gates

- No push, PR, hosted workflow, issue/comment mutation, merge, release,
  visibility change, ruleset change, credential change, or publication occurred.
- No real hosted runner identity, timing ratio, artifact provenance, Jobs API
  receipt, Artifacts API receipt, or exact-head hosted envelope is claimed.
- No real Hyperfine adapter-operability result is claimed; Plan 11AI owns it.
- Bootstrap and harness canonical remote reachability is not yet claimed because
  the exact branch ancestry has not been owner-authorized for publication.
- A green PR check remains a claim until the later owner-run collector validates
  the exact first-attempt cycle; live ruleset changes remain owner-gated.
- The current `collect` command intentionally cannot create an envelope. Plan
  11AJ must implement and test the exact-cycle artifact/API adapter before that
  activation gate can change.
- Issue-proposal record-level preview and bot-ownership checks are not claimed;
  Plan 11AJ now requires them before live mutation authorization.
- The scheduled decorative-link workflow is source-verified but has not run.
- Plan 11AH is not complete until this implementation review is dispositioned.

## Authoritative Reviewer Ask

1. Inspect the exact implementation revision and return one Plan 11AH verdict:
   `ACCEPT`, `ACCEPT_WITH_FOLLOW_UPS`, or `REJECT`.
2. Identify every correctness, security, evidence-integrity, architecture,
   maintainability, and workflow-semantics issue. Classify each as closure
   blocker, later-plan follow-up, or informational.
3. Verify B-F1 through B-F7 against code and tests, especially token exposure,
   same-repository performance authority, four-checkout trust, exact attempt
   joining, and Tier A/Tier B separation.
4. Reproduce and disposition each Sol closure finding. In particular, challenge
   whether raw evidence recomputation and the inactive collector fully close the
   authority gap without pulling 11AJ implementation into 11AH.
5. Decide whether `5c813db4` may become the active trusted bootstrap authority
   after the exact reviewed ancestry is published, or name the required
   correction before activation.
6. Challenge the structural workflow tests. State whether any green test can
   conceal a behaviorally false workflow conclusion.
7. Check that the implementation did not absorb Phase 44's broader refactor or
   11AI/11AJ owner-gated work.
8. Rerun any focused commands needed for confidence and report exact observed
   results. Do not edit files.
