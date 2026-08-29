# Fable Authoritative Adjudication: Plan 11AG Closure and Plan 11AH Architecture

Adjudicator: Fable (authoritative). Read-only review at docs-only packet head
`4f3b23d0`; Plan 11AG candidate implementation revision `35cbe088`. Sol reviews
are advisory input only.

## Verdicts

- **Decision A — Plan 11AG closure: `ACCEPT_WITH_FOLLOW_UPS`**
- **Decision B — Plan 11AH architecture: `APPROVE_PLAN_WITH_FOLLOW_UPS`**

The 11AH approval does not imply 11AG closure; each verdict stands on its own
evidence below. No SLO is relaxed, no regression accepted, no public action
authorized.

## Independently Verified Evidence

Verified directly in this session (not taken on record):

- `35cbe0883a65409b13f9b7cc6347c793df2a2f15` is an ancestor of HEAD, and every
  commit after it (`1c455120..4f3b23d0`, 9 commits) touches only `.planning/` —
  the candidate code is exactly what this packet describes.
- Focused tests rerun: `bun run test -- tests/perf-comparison-schema.test.js
  tests/bench.test.js tests/check-perf.test.js` → **39 pass, 0 fail, 454
  assertions** (matches packet).
- Focused domain coverage rerun: `bun run test:coverage:phase43-paired-perf` →
  **100% statements, 98.18% branches, 100% functions, 100% lines** (matches
  packet exactly).
- Full suite rerun in this session: **1,581 pass, 0 fail, 4,797 assertions
  across 59 files** (matches packet).
- Blocking arithmetic inspected at source: `scripts/lib/paired-perf.js:110-124`
  implements strict `candidateTotal * 10n > referenceTotal * 11n` (warn) and
  `candidateTotal * 4n > referenceTotal * 5n` (fail) over BigInt sums of raw
  safe-integer nanoseconds. Boundary tests confirm exact `1.10` → pass, exact
  `1.25` → warn (not fail), and a 1 ns exact excess over 1.25 → fail even while
  the float ratio cache displays `1.25` (`tests/check-perf.test.js:181-196,
  223-237`).
- The paired schema is closed (`additionalProperties: false` at every level);
  `acceptedRegressions`, `expiresOn`, and `baseline` are structurally rejected
  (`tests/perf-comparison-schema.test.js:265-273`), and `--comparison` rejects
  every mixed historical input and threshold override
  (`scripts/check-perf.js:124-129`, tested).
- Historical mode: measured warn/fail returns exit 0 with a diagnostic
  annotation only (`runComparison` returns 0 unconditionally); exit 1 occurs
  only for operational/malformed input (`EPERF`). Verified in code and tests.
- The Plan 11AH "current problem" claims were verified against the live tree:
  floating Hyperfine installs (`ci.yml:392/398/405`, `perf-baseline.yml:33/39/46`),
  legacy single-subject `bench.js --platform` + `check-perf.js --baseline/--current`
  in the perf job (`ci.yml:408-410`), a single global PR-head
  `executionSubject` expression applied to all five workflows including
  schedule/dispatch-triggered ones (`phase43-hosted-ci-contract.json:12-21`),
  exactly-one-checkout-per-job enforcement (`verify-hosted-ci.js:542,570-572`),
  `issues: write` plus `github-script` issue mutation inside PR CI
  (`ci.yml:88-89,125,174,207-209,331,344`), bare `actions/checkout@v6` with no
  `ref:` (synthetic merge) and no `persist-credentials: false` anywhere, and
  movable-tag pins throughout `perf-baseline.yml`. All CONFIRMED — 11AH's
  problem statement is accurate.
- Topology arithmetic: contract-derived 39 Tier A = 18 CI jobs + 18 Cousin
  matrix + 1 each for oversight/compat/upgrade; 21 Tier B = 18 Cousin + 3
  performance platforms; 5 workflows. Consistent.

Accepted on the packet's record, not independently rerun (all plausible,
none load-bearing for the verdicts): repository compatibility 154/34, `bun run
dist` composition detail, ESLint/doc-lint/dependency-policy counts, and the
Gitleaks sweep of `c4967c6b..35cbe088`.

---

## Decision A — Plan 11AG Closure: `ACCEPT_WITH_FOLLOW_UPS`

### Answers to the 11AG decision questions

**A1. Does the candidate prove every acceptance property?** Yes. All ten
Required Truths are proved by inspected code plus reproduced tests: distinct
commits on one digest-bound identity; inspectable raw evidence; exact strict
arithmetic; recomputed caches (stored summary/verdict disagreement throws);
equal warmups with independent warmup scheduling and ≥10 alternating pairs from
a derived seed (seed itself is recomputed and enforced at validation,
`paired-perf.js:372-373`); full per-sample receipts with pre/post identity,
controls, and subject digests; whole-artifact abort on any invalid sample;
waiver/calendar/threshold exclusion; and shared controls with legitimately
differing per-subject package/lock/authority digests.

**A2. Is exact rational status plus numeric diagnostic caches honest and
deterministic?** Yes. Blocking status never passes through floating point; the
float means/ratios are presentation caches recomputed identically at
adjudication (same deterministic operations → byte-stable equality), so the
cache-consistency check cannot false-fail. The one honest wrinkle — a display
ratio of `1.25` alongside a `fail` status — is correct behavior and is tested.
Optional polish (non-blocking): on warn/fail, also print the exact integer
totals so an operator can see the strict excess without recomputing.

**A3. Can malformed, historical, caller-controlled, or derivative evidence
suppress a real paired failure or create blocking authority?** Within 11AG's
scope, no. Historical inputs cannot reach the paired path (closed schema +
mixed-input rejection), tampered derivatives throw, tampered raw evidence
breaks digests or the recomputed seed, and threshold overrides are rejected in
comparison mode. What remains possible is a *wholly fabricated but internally
consistent* artifact from a caller who controls the producer — 11AG cannot and
does not claim to detect that; trusted origin is exactly the 11AH artifact/run
binding and the 11AJ collector join. This deferral is stated, not hidden, in
the packet's non-claims. Correctly scoped.

**A4. Is the one deep executor port appropriately SOLID and hexagonal?** Yes.
`paired-perf.js` has zero fs/process dependencies (only `crypto`); the single
injected executor function is a genuinely deep port (scheduling, receipt
validation, adjudication all inside the domain); `bench.js` holds Git,
sandbox, spawn, Hyperfine, and JSON adapters with injectable overrides;
`check-perf.js` holds shape validation and presentation. No shallow
pass-through ports were created. The adapter tests exercise real spawn argv,
preparation-before-Hyperfine ordering, prep-failure abort without measurement,
post-measurement drift rejection, and sandbox cleanup counts (44/44/44/44 for
the 10-pair + 1-warmup shape). This is loose coupling with tight integration.

**A5. Is `runnerImage` acceptable as-is?** Yes — closure is not blocked. The
field is an opaque, equality-checked, observed identity with a separately
recorded expectation, and the schema is versioned (`schemaVersion: 1`). The
name is mildly overloaded (locally it is an OS fingerprint, not an attested
image), but the domain semantics ("observed must equal expected, both
normalized and non-placeholder") are the load-bearing contract and are honest.
**Binding follow-up (owner: 11AH):** the hosted contract and paired-binding
manifest must explicitly define `runnerImage` as the observed runner
fingerprint and carry the actual hosted image name/version separately in Tier
B (the 11AH plan already specifies "nullable hosted-image name/version" — the
mapping just has to be written down in the contract, not left implicit).
Renaming the field now would churn a closed schema for no safety gain.

**A6. Can 11AG close without a real Hyperfine command?** Yes. The fixture
boundary is drawn exactly where it should be: everything the fixtures *can*
prove (argv contract, ordering, receipts, drift, abort, cleanup) is proved;
what they cannot prove (the real binary's JSON shape under `--runs 1`, shell
resolution per OS, real worktree/tmpdir behavior) is not claimed. See the Real
Local Hyperfine decision below — I am requiring that run before 11AJ
authorization, but as 11AI scope, not as an 11AG closure condition.

### 11AG findings (none blocking)

| # | Severity | Finding | Owner | Minimum correction |
|---|---|---|---|---|
| AG-F1 | Low | `statusForRatio` (float thresholds) remains a public export of `paired-perf.js` with no production consumer; a future caller could reintroduce float classification at the boundary. | 11AH implementation (or any next touch of the file) | Remove from `module.exports` or comment it as diagnostic-only; add a test asserting the blocking path never calls it. |
| AG-F2 | Low | Failure/warn annotations print only rounded float ratios; exact excess is invisible without recomputation. | 11AI or later polish | Print integer totals on warn/fail. Optional. |
| AG-F3 | Info | `resolveSubject` requires `.planning/upstream-authority.json` tracked in both worktrees. Verified tracked at HEAD, but the project's PR-branch tooling filters `.planning/` commits — any future "clean PR branch" flow would break paired capture. | 11AH implementation | Assert the file's presence in both subjects as part of the workflow's pre-capture verification, with an actionable error. |

Sol's prior findings: I concur with the correction review's disposition — the
six original REJECT findings are closed at `35cbe088` (each was reproduced in a
test before its fix; the boundary fixture, observed-identity binding,
non-blocking historical mode, independent warmup schedule, adapter negatives in
`a64464ef`, and `pairRatioMad` are all verified above). Nothing reopened.

---

## Decision B — Plan 11AH Architecture: `APPROVE_PLAN_WITH_FOLLOW_UPS`

The plan's problem statement is accurate (every current-state defect claim
CONFIRMED against the live tree), its corrective architecture is sound, and its
boundaries against 11AI/11AJ/Phase 44 are clean. Approval carries two
authority-defining amendments (B-F1, B-F2) that must land in the 11AH
implementation and will be checked at its implementation review; they do not
require re-planning.

### Answers to the 12 decision questions

**B1. Is the four-checkout model the minimum correct architecture?** Yes.
The four roles are genuinely distinct trust domains: bootstrap (installer/
toolchain authority, pinned early, changes rarely), harness (the
Fable-accepted 11AG measurement commit), base reference, and head candidate.
Collapsing bootstrap and harness into one pinned commit would force re-pinning
the installer authority every time the harness moves and would re-create the
self-reference problem 11AH just solved. Packaging the bootstrap as a release
asset or composite action would add a supply-chain surface (release tampering,
action resolution) without removing any checkout. Four shallow pinned
checkouts with immediate HEAD verification and `persist-credentials: false` is
the minimum that keeps every trust boundary independently verifiable.

**B2. Does the two-commit bootstrap-then-pin sequence solve self-reference
honestly?** Yes. Committing the bootstrap implementation first and pinning its
40-hex hash in a later contract commit is the standard, honest resolution of
an impossible self-referential hash. The two guards make it sound: the pin
becomes authority only after final Fable acceptance, and the same-repo
corrective branch must prove pre-publication that both pins are ancestors of
the exact authorized push (with the fork-era rule that pins must already
resolve from the canonical repository). No gap identified.

**B3. Is base-repo/base-SHA vs head-repo/head-SHA correct, with synthetic
merge rejected?** Yes. The paired question is "did *this head* regress
relative to *its declared base*" — both are immutable, reproducible, and
auditable. The synthetic merge ref is none of those (it moves when base moves
and is unreproducible after the fact); rejecting it is correct. The known
tradeoff — head-vs-base does not measure the post-merge state when base has
advanced — is acceptable because merge is owner-gated anyway and a stale base
is visible in the recorded SHAs.

**B4. Is an explicit non-PR performance skip preferable to a non-blocking
diagnostic?** Yes. A push/schedule diagnostic would burn three platforms of
runner time producing unpaired numbers with no authority, which invites
exactly the informal-authority creep 11AG just eliminated. An explicit
contract outcome ("no-authority skip") is honest and cheap. Historical trend
capture already has a home (`perf-baseline.yml`, manual).

**B5. Is 18 standalone artifacts + 3 paired bundles correct transport for 21
Tier B subjects?** Yes. The paired receipts must travel atomically with their
comparison file and binding manifest — splitting them would force the 11AJ
collector to re-join by name across artifacts, reintroducing the correlation
ambiguity this design exists to remove. Cousin receipts have no companion
evidence, so standalone is right. The accepted "contract-derived, not
timeless" drift control is the correct guard on all cardinalities.

**B6. Must all five runs remain first attempts, or can an owner-authorized
rerun join a successor envelope?** Keep the rule exactly as planned: no
mixed-attempt evidence, ever, within one envelope. An owner-authorized rerun
is legitimate only as a *new cycle* — a fresh authorization producing a fresh
five-run set that is again uniformly first-attempt for that cycle, evaluated
as a successor envelope. A `run_attempt === 2` joining a successor envelope
alongside other runs' attempt-1 evidence would mean the runner environment
differed across the envelope and would silently launder whatever failed on
attempt 1. The plan already says this ("any rerun requires a new owner
authorization and successor evidence cycle"); I am confirming it as the
binding interpretation.

**B7. Is the Tier A / Tier B / paired / artifact separation complete and
non-circular?** Yes. Tier A (Jobs API) owns job/run/attempt/runner identity;
Tier B is bounded self-observation explicitly forbidden from duplicating
API-owned identity *as authority* (producer-copied values are claims); the
paired file owns raw measurement evidence; the Artifacts API owns
archive/origin identity. No tier validates itself with data it produced, and
the join happens only in the 11AJ collector. Non-circular. The one point to
hold in implementation: the closed paired-binding manifest must not grow
fields that restate Tier A identity, or the claims/authority line blurs.

**B8. Is the pure binding module appropriately bounded against Phase 44?**
Yes, provided the implementation holds the plan's own line: one pure function
family over *supplied* event/contract/job/artifact/receipt/paired inputs, with
all GitHub API, archive extraction, and filesystem work staying in injected
`verify-hosted-ci` adapters, and no migration of existing verifier policy into
the new module. That is a bounded extraction, not the deferred Phase 44
refactor. Watch item at implementation review: resist "while we're here"
absorption of `verify-hosted-ci.js` policy branches.

**B9. Is the automatic-token allowlist safe and implementable?** Yes. The
exact classes of pinned actions that may receive the read-only token:
(a) `actions/checkout` — clone authentication for the four governed checkouts
(always with `persist-credentials: false`); (b) the pinned Secret Scan action
if and only if it performs API reads (PR metadata); (c) any pinned
artifact-handling action that the platform requires a token for (noting
upload/download-artifact use the runtime token, not `GITHUB_TOKEN`, so they
should normally be *outside* the allowlist); (d) nothing else — setup actions,
harden-runner, and all run steps get no token. Implementable and verifiable:
top-level `permissions: contents: read`, no `${{ secrets.* }}` or
`${{ github.token }}` reference in any run step, and the workflow verifier
asserting token-bearing `with:`/`env:` entries appear only on allowlisted
pinned action steps.

**B10. Does a candidate-modifiable workflow remain an unacceptable future
fork bypass?** Yes — for any consumer that trusts the green PR check UI. On
`pull_request`, the workflow definition itself comes from the candidate side,
so a fork PR can define a job with the same name as a required context and
trivially pass it, or skip the bootstrap entirely. Pinned bootstrap commits
and 11AJ collector validation protect *the collector's* verdict (digest and
step-authority mismatches fail), but they cannot protect a human who merges on
green checks without the collector. Minimum additional control: a repository
ruleset that requires the check contexts to originate from the canonical
workflow file on the default branch (GitHub "required workflows"-style ruleset
enforcement), plus the standing rule that merge authority is the owner-run
collector, never the raw check UI. Owning phase: **Plan 11AJ or a later
owner-gated governance phase** — it is a live repository-settings mutation and
therefore cannot be 11AH scope. 11AH's obligation is only to *state* in the
contract that PR-side workflow definitions are untrusted and that check-name
identity is not authority (follow-up B-F2).

**B11. Should `perf-baseline.yml` remain historical and outside the 39-job
topology while still receiving immutable pins?** Yes to both halves. It is
manual-dispatch, non-required, and feeds nothing blocking — putting it inside
the authority topology would launder trend data toward authority. But it still
executes code in the repository context, so movable tags (`@v6`, `@v2`, `@v7`,
`@v8` — all confirmed present today) are a real execution-integrity gap
regardless of authority status; the plan's requirement of the same immutable
action/toolchain pins, including the exact `actions/download-artifact`
identity, is correct and stays.

**B12. Does authoritative fork-PR performance evidence require stronger
isolation?** Yes, and this is the most important architectural admission in
the packet. During paired capture the trusted harness executes
candidate-controlled `bun run compose` under the same OS user as the
bootstrap, harness, sibling checkouts, and output paths. Read-only tokens and
absent secrets bound *external* mutation only. A malicious fork candidate can:
(a) tamper with sibling checkout files — mostly detected by the pre/post
subject digests, cleanliness, and HEAD checks, but those cover only the
digested files; (b) tamper with harness code on disk — partially mitigated
because the harness process has already loaded its modules, but not
guaranteed; and decisively (c) degrade the *reference* subject's timings via
resource contention (a background process left running from its own timed
sample), which no receipt digest can detect and which biases the ratio in the
candidate's favor — i.e., hides a real regression. Filesystem digests cannot
close a shared-runner side-channel. Therefore: **blocking paired performance
authority must be scoped to trusted heads** — same-repository PRs (which is
exactly the current corrective cycle, PR #23) — and fork PRs must receive an
explicit no-authority outcome (skip, or diagnostic-labeled non-authority at
most) unless an owner re-runs the measurement from a trusted ref under a
separate authorization. The minimum defensible control is the contract-level
scope restriction (`head.repo == canonical repo` as a condition of blocking
paired authority), owned by **11AH implementation** (B-F1). Stronger
process/filesystem isolation (per-subject ephemeral runners, which would
sacrifice the same-runner pairing property, or trusted-runner re-execution
flows) is a genuine later owner-gated phase decision, not 11AH scope. The
final packet commit ("surface fork evidence isolation risk") shows this is
already recognized; approval binds it into the implementation.

### Real Local Hyperfine Decision

**Required — adopt the lead recommendation.** One real, local-only
adapter-operability run is required before Plan 11AJ authorization, owned by
**Plan 11AI** (add it to the corrective-gate contract as a named check). The
fixture suite proves the wiring against a mock; it cannot prove the real
Hyperfine 1.20.0 binary's JSON shape under `--warmup 0 --runs 1`, per-OS shell
resolution of the command string, real `git ls-files` sandbox copying on a
real worktree, or tmpdir behavior — and the first place those assumptions are
otherwise exercised is the expensive, owner-authorized public hosted cycle.
Discovering an argv or JSON-shape defect *there* would waste an authorized
public window, which is precisely the failure class Phase 43 exists to stop.
Cost is one local run of the exact trusted installer + two clean immutable
local worktrees + `bench.js --paired` + `check-perf.js --comparison`. Bounded
non-claims exactly as the packet states: adapter operability only — no hosted
authority, no Tier A identity, no cross-platform claim, no accepted
regression, no SLO change. If it exposes a real regression, stop for owner
disposition. This is not duplication of 11AH fixtures (which also never run
the binary); it is the missing rung between mocks and the public cycle.

### 11AH follow-ups (binding on implementation; none require re-planning)

| # | Severity | Item | Owner | Trigger |
|---|---|---|---|---|
| B-F1 | High | Scope blocking paired performance authority to same-repository PR heads in the hosted contract; fork PRs get an explicit no-authority outcome. Stronger isolation or trusted re-run flows for forks are a later owner-gated phase. | 11AH implementation | 11AH implementation review (Fable) |
| B-F2 | High | Contract must state that PR-side workflow definitions and check-name identity are not authority; the ruleset/required-workflow control that enforces it at the platform level is a live-settings mutation owned by 11AJ or a later owner-gated governance phase, behind its own owner checkpoint. | 11AH (statement) / 11AJ+ (enforcement) | 11AH implementation review; 11AJ-01 checkpoint |
| B-F3 | Medium | Add the real local Hyperfine adapter-operability run as a named 11AI corrective-gate check (see decision above). | 11AI | 11AI plan execution |
| B-F4 | Medium | Define `runnerImage` = observed runner fingerprint in the hosted contract / paired-binding manifest, with actual hosted image name/version carried separately in Tier B (closes AG follow-up A5). | 11AH implementation | 11AH implementation review |
| B-F5 | Low | Keep upload/download-artifact outside the GITHUB_TOKEN allowlist unless a platform requirement is demonstrated (they use the runtime token); document each allowlist entry's reason in the contract. | 11AH implementation | 11AH implementation review |
| B-F6 | Low | Pre-capture workflow step must verify `.planning/upstream-authority.json` (and `bun.lock`, `package.json`) exist in all four checkouts with actionable errors (closes AG-F3). | 11AH implementation | 11AH implementation review |
| B-F7 | Info | Guard the pure `hosted-evidence-binding` module against scope creep into verify-hosted-ci policy (Phase 44 boundary); reviewer checks no existing policy branch migrated. | 11AH implementation | 11AH implementation review |

### Current blockers vs bounded later-plan work

**Blockers right now: none.** Both verdicts are grantable at this head.
11AG's follow-ups (AG-F1..F3) are absorbed into B-F1..B-F6 with named owners
and concrete triggers. Everything else in the packet's later-plan inventory
(hosted wiring, 11AI gate + receipt, 11AJ owner checkpoints, live settings,
fork policy enforcement, Phase 44 verifier refactor) is correctly bounded
later-plan work with existing owners; nothing was found hiding in 11AG that
belongs to a later plan or vice versa.

### Claims not supported by inspected evidence

Every load-bearing packet claim checked out under independent verification
(tests, coverage, full suite, ancestry, arithmetic, schema closure, historical
demotion, all eight current-state defect claims, topology arithmetic, and the
Sol review/disposition trail — including Sol's explicit agreement that a real
Hyperfine smoke is not an 11AG closure condition). Three peripheral evidence
lines were accepted on the packet's record without rerun: the Gitleaks sweep
of the implementation range, the dependency-policy finding counts, and the
`bun run dist` composition detail (740 files / 124 rules). None affects either
verdict; the 11AI gate re-proves all three classes locally before any public
action. One packet nuance worth stating plainly: the current contract and
verifier already contain Tier A/B receipt fields, `run_attempt` handling, and
`verify-pending`/`verify-receipt` modes — 11AH *generalizes* these (events,
multi-checkout, artifact transport); it does not introduce them from nothing.
The packet's wording is compatible with this, but the implementation reviewer
should expect modification of existing verifier surfaces, not greenfield.
