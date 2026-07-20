# Fable Packet: Plan 11AG Closure And Plan 11AH Architecture

## Role And Authority

Act as the authoritative lead developer, architect, security reviewer, and
project designer for this whole project. Review the repository read-only. Do not
edit files, invoke another reviewer, relax an SLO, accept a regression, or
authorize a public action.

Return two independent verdicts:

1. **Plan 11AG closure:** `ACCEPT`, `ACCEPT_WITH_FOLLOW_UPS`, or `REVISE`.
2. **Plan 11AH architecture:** `APPROVE_PLAN`,
   `APPROVE_PLAN_WITH_FOLLOW_UPS`, or `REVISE_PLAN`.

An 11AH approval must not imply 11AG closure. For each finding, state severity,
exact evidence, why it matters, owning plan, and minimum correction. Separate
current blockers from bounded later-plan work.

## Project And Decision Context

This repository is a market-ready overlay over active Open GSD authority. Phase
43 is building executable upgrade, release, compatibility, security, and hosted
CI evidence after an earlier hosted cycle exposed verifier and workflow defects.
The repository is public, but no push, PR update, hosted run, merge, release,
credential change, setting mutation, or public comment is authorized in these
plans. Plan 11AJ retains explicit owner checkpoints before every public action.

The current worktree head is `dc012678`. Plan 11AG's candidate implementation
revision is `35cbe0883a65409b13f9b7cc6347c793df2a2f15`; later commits are planning
and review records, not code changes to the candidate.

The owner requires unchanged strict performance boundaries:

- warning only when candidate/reference is strictly greater than `1.10`
- failure only when candidate/reference is strictly greater than `1.25`
- any threshold change or regression acceptance remains owner-only

## Decision A: Plan 11AG Closure

### Scope

Plan 11AG replaces a stale cross-run absolute baseline as blocking authority
with paired reference/candidate measurements on one observed runtime. It owns:

- the closed paired-comparison schema
- pure scheduling, recomputation, semantic validation, and exact adjudication
- process/filesystem capture and CLI adapters
- fixture-backed process proof
- historical-mode demotion to non-blocking diagnostics

It does not own hosted checkout, workflow, API, artifact-origin, or upload
authority. It does not claim a real timing ratio or hosted pass.

### Implementation Properties

- Raw samples are positive JSON safe-integer nanoseconds.
- Aggregate status uses `BigInt` rational cross-multiplication:
  - warn when `10 * candidateTotal > 11 * referenceTotal`
  - fail when `4 * candidateTotal > 5 * referenceTotal`
- Numeric means and ratios are diagnostic caches only.
- Stored summaries, dispersion diagnostics, and verdict must equal exact
  recomputation from raw evidence.
- Reference and candidate commits must differ.
- Both metrics use the same deterministic AB/BA policy, at least ten measured
  pairs, and equal warmups.
- Each sample proves expected identity, controls, subject commit/digests, clean
  worktree, successful preparation and benchmark, and unchanged pre/post state.
- Hyperfine executes one target with `--warmup 0 --runs 1` per outer-scheduled
  sample; preparation is outside the timed command.
- `--comparison` is the only blocking performance mode. Historical warn/fail
  ratios remain diagnostic and return success; malformed input may still fail
  operationally.
- Runner identity records separately named observed and expected values and
  requires equality. The current field `runnerImage` is an observed normalized
  OS fingerprint locally, not a cryptographically attested hosted image.

### Candidate Evidence

Evidence was rerun at `35cbe088`:

- focused schema/domain/adapter/checker tests: 39 passed, 0 failed
- focused pure-domain coverage: 100% statements, 98.18% branches, 100%
  functions, 100% lines
- full suite: 1,581 passed across 59 files, 0 failed, 4,797 assertions
- repository compatibility: 154 passed across 34 suites, 0 failed
- distribution build: passed; 740 composed files, 124 branding rules, hooks,
  SBOM, and finalization completed
- targeted and full ESLint: 0 errors; only pre-existing warnings
- documentation lint: 0 errors
- dependency policy: 7 findings, 0 blocking, 0 suppressed
- Gitleaks across the implementation range: no leaks
- whitespace check and worktree: clean at the candidate revision

No real Hyperfine timing command was run. That is an explicit non-claim.

### Prior Review Disposition

Sol initially rejected unsafe Number aggregate sums, caller-asserted runner
identity, blocking historical ratios, warmup wrap, adapter evidence gaps, and
missing dispersion. Tests reproduced those defects before fixes. Exact BigInt
status, observed/expected identity, non-blocking historical ratios, independent
warmup scheduling, process-adapter negatives, and recomputed dispersion now
close them. A later Sol correction review agreed a real smoke is not required
to close 11AG.

### 11AG Decision Questions

1. Does the candidate prove every 11AG acceptance property?
2. Is exact rational status plus numeric diagnostic caches honest and
   deterministic?
3. Can malformed, historical, caller-controlled, or derivative evidence
   suppress a real paired failure or create blocking authority?
4. Is one deep executor port appropriately SOLID and hexagonal?
5. Is `runnerImage` acceptable as a compatibility field when 11AH maps it
   explicitly to an observed OS fingerprint and stores actual hosted image
   identity separately, or must 11AG rename/revise the schema before closure?
6. Can 11AG close without a real Hyperfine command, given its explicit
   fixture-backed scope and later gates?

## Decision B: Plan 11AH Architecture

### Current Problem

The current CI performance job still installs floating Hyperfine packages,
captures one current subject, and invokes the now-diagnostic absolute baseline
path. The current hosted contract hard-codes PR-head semantics for workflows
that also run on push/schedule/dispatch and permits only one checkout per job.
It cannot represent trusted paired evidence or a fork-safe multi-subject job.

Plan 11AH is planning-only. It must be approved before TDD implementation.

### Corrected Architecture

#### Event And Checkout Authority

The hosted contract becomes event- and job-specific.

- Single-subject PR jobs: head repository plus immutable head SHA.
- Push/schedule/dispatch jobs: exact governed event SHA.
- PR performance jobs: four isolated shallow checkouts with immediate HEAD
  verification and `persist-credentials: false`:
  1. canonical repository at an immutable 11AH bootstrap commit
  2. canonical repository at the accepted 11AG measurement-harness commit
  3. PR base repository at immutable base SHA
  4. PR head repository at immutable head SHA
- Synthetic merge commits, branch refs, and default checkout semantics fail.
- Performance has no blocking authority outside `pull_request`; non-PR
  performance is an explicit no-authority skip.

The 11AH bootstrap contains the reviewed Hyperfine installer and toolchain
manifest. Its implementation is committed first; a later contract commit pins
that earlier 40-hex commit, avoiding an impossible self-referential hash. The
bootstrap pin becomes authority only after final Fable acceptance.

For the current same-repository corrective branch, local pre-public evidence
must prove both bootstrap and harness pins are ancestors published by the exact
authorized branch push. For future fork PRs, both pins must already resolve from
the canonical repository.

#### Measurement Isolation

- Hyperfine installer runs only from the bootstrap checkout.
- Hyperfine 1.20.0 comes from exact OS/architecture release assets with reviewed
  SHA-256 values; bytes and resolved version are verified.
- Node 22 and exact Bun are required for performance; resolved Node patch is
  recorded because paired subjects share one runtime.
- Only the harness receives
  `bun install --frozen-lockfile --ignore-scripts`.
- Reference and candidate checkouts remain clean and unmodified.
- `bench.js --paired` and `check-perf.js --comparison` execute from the harness.
- At least ten pairs are captured on Linux, macOS, and Windows.

#### Evidence Sources And Transport

Authority sources remain separate until Plan 11AJ:

- Tier A: Jobs API job/run/attempt and runner identity
- Tier B: bounded runner observation of logical subject, OS fingerprint,
  architecture, hosted image when available, and resolved runtimes/tools
- Paired file: 11AG raw samples, controls, subject commits/digests, and derived
  caches
- Artifact API: artifact ID, archive digest, workflow run, and head binding

Tier B does not duplicate API-owned job/runner identity as authority. A closed
paired-binding manifest binds bootstrap, harness, base, candidate, Tier B, and
comparison digests; producer-copied API values remain claims.

The current PR topology is contract-derived, not timelessly hard-coded:

- 39 Tier A job records
- 21 Tier B runtime subjects
- 18 standalone Cousin runtime-receipt artifacts
- 3 performance paired bundles containing their Tier B receipts
- 5 exact-head workflow runs, each independently identified and required to
  have `run_attempt === 1`

No latest-attempt mixing or unapproved rerun may satisfy the cycle.

#### Architecture Boundary

11AH adds one focused pure `hosted-evidence-binding` module over supplied event,
contract, job, artifact, Tier B, and paired evidence. GitHub API, bounded archive
extraction, and filesystem operations stay in injected `verify-hosted-ci`
adapters. This does not absorb the broader verifier policy/I/O refactor deferred
to Phase 44.

11AH implements and fixture-tests the contract, workflows, emitter, installer,
and collector machinery. Plan 11AJ remains the first live collector and owns all
GitHub/API/public actions after separate user authorization.

#### Fork Safety And Mutation Separation

- No `pull_request_target`, self-hosted runner, repository/organization/
  environment secret, write permission, persisted credential, candidate-step
  token exposure, or cache publication for untrusted PR execution.
- The read-only automatic GitHub token is allowed only through a closed
  per-action allowlist of reviewed pinned actions that require it.
- PR diagnostics publish proposal artifacts and summaries only.
- Issue mutation is a separate manual, dry-run-default, idempotent maintenance
  workflow with explicit apply confirmation.
- Existing 266 historical bot comments remain untouched.

#### Historical And Compatibility Authority

- `perf-baseline.yml` remains manual historical-trend capture, never a required
  check or blocking input. It still uses immutable action/toolchain pins.
- Active exact upstream compatibility fails closed.
- Historical vetted rows remain informational and artifact-backed.
- Project-owned documentation correctness blocks; decorative third-party
  availability moves to bounded scheduled reporting rather than a global HTTP
  500 allowlist.

### Adjacent Plan Corrections

Plan 11AI builds the local corrective integration gate and local create-only
receipt. It now includes cross-type tests proving local and hosted verifiers
reject each other's receipt types.

Plan 11AJ:

- verifies local `pre-public-authority.json` with the local corrective verifier
- reserves hosted `verify-pending` for the uncommitted hosted envelope
- checks bootstrap/harness reachability before owner authorization
- consumes all 21 runtime-bearing artifacts from five first-attempt runs
- performs bounded archive ingestion, digest recomputation, and pure joins
- stops on any failure, head movement, regression, rerun, missing evidence, or
  unapproved mutation

### 11AH Decision Questions

1. Is the four-checkout bootstrap/harness/reference/candidate trust model the
   minimum correct architecture, or should bootstrap and harness authority be
   packaged differently?
2. Does the two-commit bootstrap-then-pin sequence solve self-reference and
   same-repository reachability honestly?
3. Is base repository/base SHA versus head repository/head SHA the correct PR
   comparison, with synthetic merge rejected?
4. Is explicit non-PR performance skip preferable to a non-blocking diagnostic?
5. Is 18 standalone runtime artifacts plus three paired bundles the correct
   transport for 21 Tier B subjects?
6. Must all five workflow runs remain first attempts, as proposed, or can a
   separately owner-authorized rerun ever join a successor envelope?
7. Is the Tier A/Tier B/paired/artifact separation complete and non-circular?
8. Is the pure binding module appropriately bounded against Phase 44?
9. Is the automatic-token allowlist safe and implementable? Identify the exact
   classes of pinned actions that may receive it.
10. Does a candidate-modifiable workflow remain an unacceptable future fork
    bypass despite pinned bootstrap and later collector validation? If so, name
    the minimum additional trusted-workflow/ruleset control and owning phase.
11. Should `perf-baseline.yml` remain declared historical and outside the 39-job
    authority topology while still receiving immutable pins?

## Real Local Hyperfine Decision

The lead recommendation is to require one real local-only adapter-operability
run before Plan 11AJ authorization, likely in 11AI. It would use the exact
trusted installer, bootstrap harness dependencies, compare two distinct clean
immutable local worktrees with `bench.js --paired`, and adjudicate through
`check-perf.js --comparison`.

It would not claim hosted authority, Tier A identity, artifact provenance, a
cross-platform result, an accepted regression, or an SLO change. If it exposes
a real regression, the project stops for owner disposition. Decide whether this
is necessary pre-public evidence or disproportionate duplication of 11AH
fixtures plus the later hosted run.

## Required Files

Read at minimum:

- `43-FABLE-PLAN11AG-CURRENT-REVISION-PACKET-2026-07-20.md`
- `43-11AG-PLAN.md`
- `43-11AG-PAIRED-PERF-SPIKE.md`
- `config/perf-comparison.schema.json`
- `scripts/lib/paired-perf.js`
- `scripts/bench.js`
- `scripts/check-perf.js`
- Plan 11AG focused tests and coverage test
- `43-11AH-PLAN.md`
- `43-11AI-PLAN.md`
- `43-11AJ-PLAN.md`
- both Plan 11AH Sol reviews and their lead dispositions
- `config/phase43-hosted-ci-contract.json`
- `config/phase43-toolchain-authority.json`
- `.github/workflows/ci.yml`
- `.github/workflows/perf-baseline.yml`
- `scripts/verify-hosted-ci.js`
- `scripts/verify-toolchain-authority.js`
- relevant workflow, contract, and collector tests

## Explicit Non-Claims

- Plan 11AG remains pending until this adjudication.
- Plans 11AH, 11AI, and 11AJ remain unexecuted.
- No real timing ratio or hosted pass exists.
- No public or hosted action is authorized.
- No regression or threshold change is accepted.
- Sol is advisory; this Fable verdict is authoritative.

