# Phase 43 Interim Review — Fable Independent Review (2026-07-18)

Reviewer: Claude Fable 5 (standing lead-review authority), reviewing the amended
`43-INTERIM-DUAL-REVIEW-PACKET-2026-07-14.md` independently. Read-only session;
no repository, GitHub, or config mutation performed. This document is the
review deliverable AND the executable graph-correction plan.

**Standing-checkpoint status.** This review supplies the Fable-led replan
direction that Plan 11R's blocker demanded (the substance of Task 11R-03). It
does NOT and cannot constitute the formal "after first real hosted run, before
Plan 11D" checkpoint pass — that checkpoint requires a passed exact-head hosted
envelope (`post-11n.json`), which does not exist. Nothing here manufactures it.

**Fact/inference convention.** Statements tagged `[FACT]` were verified against
repository files this session (directly or via read-only exploration agents
whose citations I spot-checked). Statements tagged `[ASSERTED]` come from the
packet's 2026-07-18 checks that I could not re-verify (GitHub API queries were
approval-gated in this session). Statements tagged `[JUDGMENT]` are my
assessment.

---

## 1. VERDICT

**Proceed-with-corrections.**

The Phase 43 architecture did exactly what it was designed to do under its
first real adversarial contact: the collector failed closed (`run_failed`,
`receiptCreated: false`), the failure became an immutable tracked observation,
Plan 11R stopped honestly with an explicit execution blocker, and no source was
edited under a broken precondition `[FACT: .planning/evidence/hosted/first-real-run-failure.json:8-13; 43-11R-PLAN.md execution_blocker; STATE.md status: blocked]`.
Three of five workflows passed with fully executed steps, including the 18-job
Cousin Install matrix `[FACT: evidence JSON workflows[]]`. Local authority is
green (1,322/1,322 Bun; 73/73 native contracts; 154/154 repo compat; 945/945
N=3 Open GSD) `[FACT: 43-HOSTED-CI-RESUME.md "Local Evidence Only"]`.

Nothing observed indicates a design failure requiring stop-and-redesign. All
ten hosted failure rows decompose into six independent, bounded, fixable
families, and every one of them was independently confirmed against the actual
workflow/config/source files this session. What is required is a truthful graph
correction (Section 3) plus six bounded remediations (Section 4), then one
authorized hosted retry window.

Plain "proceed" is not available: Plan 11R's remaining tasks are unexecutable
as written, a HIGH security advisory blocks release, PR-triggered CI performed
unauthorized public mutation, and the performance gate is comparing against an
invalid authority. `[JUDGMENT]`

---

## 2. CRITICAL FINDINGS

Ordered by severity. Each finding: Evidence (facts), then Assessment (judgment).

### CF-1 (release-blocking, security): HIGH advisory in exact-pinned SBOM tool
- Evidence `[FACT]`: `package.json` devDependencies pins `"@cyclonedx/cyclonedx-npm": "4.2.1"` (exact). GHSA-v75r-vx73-82pj (HIGH, shell injection) blocks via BOTH `audit-ci` (`scripts/audit-check.js`: `high: true, critical: true`) and OSV triage (`scripts/osv-triage.js --fail-on high,critical`). Fix is major version 6.0.0. The tool's only use is SBOM generation via `scripts/generate-sbom.js` (resolves `node_modules/.bin` binary, `bunx --bun` fallback), invoked from `bun run sbom` / `dist` and CI `parity`. A suppression path exists (`.planning/audits/suppressions.json`, 60-day TTL).
- Assessment `[JUDGMENT]`: genuine release blocker; narrow compatibility surface (one CLI invocation + `dist/bom.json` shape). The 4→6 double-major jump needs a compatibility spike, RED-GREEN regression on SBOM output validity, and NO suppression entry. Suppressing a HIGH in the tool that generates your supply-chain attestation would be self-defeating for a market-ready OSS posture.

### CF-2 (governance): PR-triggered CI has TWO ungoverned public-mutation surfaces, not one
- Evidence `[FACT]`: `ci.yml` has no workflow-level `permissions:` block. Job `osv-scanner` holds `issues: write` and its `github-script` upsert step posted "Observed again in <run url>" to issues #5–#11 during run 29367264687 (`governanceSideEffects` in evidence JSON; `newIssuesCreated: 0`). **Additionally — not identified in the packet —** the `test` job ALSO holds `issues: write` with an "Upsert Windows flake issues" github-script step (label `flake-report`, body "Observed in <runUrl>"), and standing workflows `auto-label-issues.yml` and `flake-issue-maintenance.yml` exist in the same class. Six CI jobs have no permissions block at all (inherit defaults).
- Assessment `[JUDGMENT]`: the packet under-scopes this family. Remediating only the OSV step leaves an identical latent surface in the `test` job that will fire on the next Windows flake. Governance must cover ALL issue-mutation surfaces and set a workflow-level read-only default (Section 4.7).

### CF-3 (gate validity): hosted toolchain is an ungoverned input
- Evidence `[FACT]`: every `oven-sh/setup-bun@v2` step in all five workflows uses `bun-version: latest` (10 occurrences in ci.yml alone). Hosted ran Bun 1.3.14 vs local authority 1.3.5 (`environmentDrift`). No `.bun-version`, no `packageManager`/volta/mise pin anywhere; `engines` covers node only. Plan `43-11K` (wave 22, depends_on 43-11X) already owns "adjudicate the existing floating-latest Bun policy against an exact CI pin" using Plan 11M hosted evidence.
- Assessment `[JUDGMENT]`: the adjudication 11K owns is scheduled AFTER 11D and the coverage waves would consume a drifting toolchain — too late, violating invariant 4. The minimal binding decision (pin now, SSOT file, workflows consume it) must move into the corrective wave; 11K is then amended by one documented line to consume rather than re-make the decision. This is the only downstream-ownership displacement I endorse, and it is an amendment, not a reorder.

### CF-4 (gate validity): performance authority is invalid, not merely stale — and hides a sequencing trap
- Evidence `[FACT]`: `perf-baseline.json` metadata: `capturedAt 2026-07-03`, `upstreamVersion "1.5.0"`, source hosted run-28638612289; three macOS `acceptedRegressions` all `expiresOn: "2026-07-10"` (expired). Current pin is upstream 1.6.1. Policy: `scripts/check-perf.js` warn 1.10 / fail 1.25. Hosted install ratios: linux 1.57, macos 1.34, windows 1.67 (compose 1.10 / 0.69 / 1.15). F8 (verbatim): "Do not add another exception. Use the next hosted run to choose between a real baseline refresh and a variance-aware policy with machine-tested bounds."
- Assessment `[JUDGMENT]`: the baseline's subject changed (upstream 1.5.0 → 1.6.1), so current ratios conflate legitimate upstream payload change with regression — the baseline is not authority under invariant 5 regardless of expiry dates. Sequencing trap: `perf-baseline.json` is a policy input to a CI gate; a refreshed baseline is a new commit, which moves the head the envelope must bind. The retry window must therefore be planned as capture-baseline-at-head₁ → commit → full five-workflow cycle at head₂ (Section 3, Plan 43-11R6). A single naive "rerun CI" would either stay red on perf or bind the envelope to a pre-baseline head.

### CF-5 (deterministic failure): Upgrade Verifier cannot pass as coded
- Evidence `[FACT]`: `scripts/verify-upgrade.js:205` writes the temp `.npmrc` as exactly `registry=${registryUrl}\n`; both `publish-current` and `publish-bumped` invoke `npm publish` with no token; no auth env is set in the verifier context. Verdaccio 6 runs as a service container with default config (auth required to publish). `pack-current` passed; `publish-current` failed ENEEDAUTH.
- Assessment `[JUDGMENT]`: structural, will fail on every future run until fixed. Fix is ephemeral least-privilege identity (Section 4.5), not registry policy weakening.

### CF-6 (test integrity): all three cross-platform failures are oracle/harness defects; product code is correct and must not be changed to satisfy the oracles
- Evidence `[FACT]`:
  - (a) `tests/fork-roadmap-persistence.test.js:345` hard-codes an all-backslash expectation while forcing `platform: 'win32'`; product `overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs:366-372` uses host `path.join`, which on POSIX hosts yields mixed separators. On real Windows the product is correct.
  - (b) `scripts/verify-hosted-ci.js:72-111` (`resolveReceiptPath`) canonicalizes via `fs.realpathSync.native` deliberately — a symlink-escape defense; `tests/verify-hosted-ci.test.js:651-686` compares against a NON-canonicalized `os.tmpdir()` path (`/var` vs `/private/var` on macOS; 8.3 vs long path on Windows).
  - (c) `Get-Acl` appears ONLY in the test harness (`tests/fork-roadmap-persistence.test.js:65-111`); product ACL work uses `[IO.Directory]::SetAccessControl` + `ReplaceFileW`. No `Import-Module Microsoft.PowerShell.Security` exists anywhere; the harness relies on cmdlet autoload, which failed on the hosted runner.
  - An existing fork-owned normalization helper (`src/platform/paths.js`: pathe-based `gsdPaths`, `toForwardSlash`) was not used by the family-(a) code or fixtures. All three families are in fork-owned code (overlay/ + phase-43 scripts; confirmed absent from `.upstream/get-shit-done`).
- Assessment `[JUDGMENT]`: (a) and (b) are test-oracle defects; (c) is a runner-environment defect compounded by harness fragility. The remediation is oracle/harness-side. Weakening `resolveReceiptPath`'s canonicalization to make the test pass would delete a security control — explicitly forbidden by invariant 7. This is the packet's "product vs oracle vs runner vs toolchain" distinction answered with line-level evidence.

### CF-7 (policy defect): the docs gate couples merge-ability to third-party badge uptime
- Evidence `[FACT]`: CI `docs-gates` runs lychee over all tracked `*.md`; `lychee.toml` accepts `[100..103, 200..299, 403, 429]` — 500 is not accepted; no exclude for `api.star-history.com`; README.md carries three api.star-history.com image URLs. The three 500s therefore fail the job deterministically after 2 retries.
- Assessment `[JUDGMENT]`: this was a transient third-party outage hitting a policy that treats badge-endpoint availability as project health. Fix the policy (Section 4.6); do not accept 500 globally and do not delete the badges.

### CF-8 (hidden coupling): governance edits will trip the 11N contract unless co-updated
- Evidence `[FACT]`: Plan 11N's collector validates via a structured YAML parser that "expands the five current workflow job topologies and requires an exact match to the JSON contract" (`43-FABLE-HOSTED-CI-BLOCKER-REVIEW-2026-07-14.md`, "Accepted and fixed"); contract at `config/phase43-hosted-ci-contract.json`.
- Assessment `[JUDGMENT]`: the corrective wave changes CI job topology (permissions, moved issue-upsert steps). If the contract is not co-updated with tests in the same plan, the retry cycle fails closed on topology mismatch — a self-inflicted second failed window. This coupling is not named in the packet and must be owned explicitly (Plan 43-11R5).

### CF-9 (housekeeping, low): stale coordination artifacts
- Evidence `[FACT]`: `docs/inbox/2026-07-14-get-stuff-done-github-billing-lock.md` is `status: triaged`, `next_owner: user`, but its user action is complete (billing recovery user-confirmed per `43-HOSTED-CI-RESUME.md`). Main branch protection still requires the stale context `Boundary & Override Check` vs the current split contexts (resume doc "Additional Finding").
- Assessment `[JUDGMENT]`: close the inbox item (archived, with resolution note). Branch protection is a user-owned mutation sequenced AFTER the retry proves the replacement contexts — do not touch earlier.

---

## 3. CORRECTED GSD GRAPH

**Shape decision: refined Shape A ("A-prime").** Close Plan 11R truthfully as a
failure-observation + replan checkpoint; insert five corrective plans plus one
gate plan; amend two downstream plans by one documented line each. Shapes B and
C rejected (Section 6). `[JUDGMENT]`

### Where Plan 11R truthfully ends
Author `43-11R-SUMMARY.md` recording, without any claim that the passed-envelope
must-have was met:
- 11R-01 (authorize hosted window): done — true as recorded `[FACT: <done>true</done>]`.
- 11R-02 (collect passed envelope): attempted once, failed closed; observation
  tracked at `first-real-run-failure.json`; deliverable REASSIGNED to 43-11R6.
- 11R-02A (Fable review window): satisfied 2026-07-18 in amended form — quota
  restored, this independent review produced; recorded as replan input, not a
  checkpoint pass.
- 11R-03 (disposition from tracked hosted evidence): satisfied by THIS review
  document dispositioned against `first-real-run-failure.json`; the packet and
  this review become the recorded replan artifacts.
Plan frontmatter: `status: blocked` → closed with deviation notes in SUMMARY.
STATE.md unblocks into the corrective wave.

### Inserted corrective wave (all fork-owned files; all RED-GREEN; all locally verifiable)

| Plan | Scope (one sentence) | Key files | Wave | depends_on |
|---|---|---|---|---|
| `43-11R1` security-dependency-remediation | cyclonedx 4.2.1→6.0.0 with SBOM regression proof; audit + OSV green locally; no suppressions | package.json, bun.lock, package-lock.json, scripts/generate-sbom.js, tests/generate-sbom.test.js | 19 | [] |
| `43-11R2` cross-platform-oracle-and-harness | Fix the two test oracles + PowerShell module import; preserve product canonicalization exactly | tests/fork-roadmap-persistence.test.js, tests/verify-hosted-ci.test.js | 19 | [] |
| `43-11R3` performance-authority-policy | Variance-aware check-perf policy + baseline-invalidation rule (upstream-pin change ⇒ baseline void); schema + tests; NO new baseline data yet | scripts/check-perf.js, config/perf-baseline.schema.json, tests/check-perf.test.js, perf-baseline docs | 19 | [] |
| `43-11R4` upgrade-verifier-auth | Ephemeral per-run Verdaccio identity; ENEEDAUTH reproduced RED then green; realism preserved | scripts/verify-upgrade.js, its tests | 19 | [] |
| `43-11R5` hosted-workflow-governance | Bun pin SSOT + read-only CI default + issue-mutation relocation + lychee third-party-badge policy + 11N contract topology co-update | .github/workflows/*.yml, .bun-version (new), lychee.toml, config/phase43-hosted-ci-contract.json + contract tests | 20 | [] |
| `43-11R6` hosted-authority-retry (gate) | One authorized window: perf-baseline capture at head₁ → commit → five-workflow cycle at head₂ → `post-11n.json` → formal Fable checkpoint via 11P runner | .planning/evidence/hosted/post-11n.json, perf-baseline.json, 43-11R6-SUMMARY.md | 21 | [43-11R1..43-11R5] |

Wave/file-collision logic: R1–R4 touch disjoint files and can execute in
parallel at wave 19; R5 solely owns all workflow files at wave 20; R6 is the
serialized external gate. Downstream waves renumber +3 mechanically (11D 19→22,
etc.) via roadmap edit; `depends_on` carries the real ordering.

### Local gates, external gate, Fable gate
- **Local gate (exit of wave 20, precondition of R6):** full Bun authority
  suite, Jest parity, `bun run audit:ci`, `bun run sbom`, check-perf policy
  tests, verifier tests, workflow-lint + contract topology tests, lint — all
  green on the corrective head. Known-defect classes from this failure must be
  rejected locally before any hosted request (invariant 8).
- **External gate (R6):** user authorizes ONE bounded window covering: (1)
  `perf-baseline.yml` dispatch at head₁ + baseline commit (head₂); (2) the
  five-workflow cycle at head₂; (3) strict collection of `post-11n.json`
  binding head₂. Fail-closed collector unchanged; no contract weakening.
- **Fable gate:** the formal standing checkpoint ("after first real hosted run,
  before 11D") executes inside R6 via Plan 11P's subject-bound runner against
  the PASSED envelope. Only then does 11D's own `11D-00` recertify with
  `plan11d-entry.json`.

### Downstream amendments (each one documented line; reviewed intent otherwise untouched)
- `43-11D-PLAN.md`: `depends_on: ["43-11R"]` → `["43-11R6"]`, and read
  "ordinary Plan 11R finalization" as "the 11R-thread finalization (43-11R6)".
- `43-11K-PLAN.md`: consume the recorded Bun-pin decision from R5 instead of
  re-adjudicating; the rest of 11K (SBOM env portability, preflight executable)
  is unchanged and unmoved. Note for 11K: R1 lands the cyclonedx 6 CLI first;
  11K's RED tests target the upgraded CLI.
- All other plans (11W…11AB, 11, 11Q, 12x): untouched.

---

## 4. REMEDIATION DIRECTION

Direction only — each item becomes RED-GREEN work inside its named plan.

1. **Security dependency (43-11R1).** Upgrade to `@cyclonedx/cyclonedx-npm@6.0.0`
   exact-pinned. Spike first: CLI flag surface and output changes across two
   majors (v5 dropped Node 18; v6 output/spec-version defaults may differ).
   RED: audit gate red at 4.2.1 (already proven hosted) + local reproduction;
   GREEN: audit + OSV green, `bun run sbom` produces schema-valid `dist/bom.json`
   with asserted spec version and component identity, `bun run dist` green.
   Preserve `generate-sbom.js`'s direct-executable invocation contract (11K
   depends on it). No suppressions.json entry; do not relax `--fail-on`.
2. **Platform/path behavior (43-11R2).** Fix oracles, not the product:
   (a) build the family-(a) expected value with the same join semantics as the
   code under test (or normalize both sides via `src/platform/paths.js#toForwardSlash`)
   so the assertion is separator-agnostic while still proving the win32 branch
   selects PowerShell under `SystemRoot`; (b) canonicalize the expected root
   with `fs.realpathSync.native` in the receipt test — this makes the test
   PROVE the symlink defense instead of fighting it; add a symlinked-tempdir
   fixture so the alias case is covered on every OS, not just macOS runners;
   (c) prepend `Import-Module Microsoft.PowerShell.Security -ErrorAction Stop`
   to the harness preamble in `runWindowsPowerShell` — deterministic cmdlet
   availability instead of autoload luck. Optional (flag, don't force): migrate
   `fork-roadmap-persistence.cjs` to `gsdPaths` later for consistency; it is
   not a defect today.
3. **Deterministic toolchain (43-11R5).** Create `.bun-version` as the SSOT
   (recommend `1.3.5` — the version local authority actually certifies; verify
   `setup-bun` v2 supports `bun-version-file`, else template the pinned value)
   and point every setup-bun step at it. Record the decision, provenance, and a
   deliberate bump trigger (bump = its own PR that re-runs full authority).
   Enforce in evidence: recorded `bunVersion` must equal the pin. Do NOT touch
   the machine-global Bun while other project sessions are live (11K's own
   constraint). Adopting 1.3.14 locally instead is a user decision — default is
   pin-to-known-good now, bump deliberately later.
4. **Performance policy (43-11R3 + R6).** Adopt BOTH halves of F8's choice,
   split correctly: policy is local work, data is hosted work.
   Policy (R3): baseline validity rule — a baseline is authority only while its
   recorded `upstreamVersion`, workload definition, and runner image family
   match the run under test; otherwise check-perf fails with
   `stale-baseline-authority`, never a silent pass. Variance-aware bounds:
   per-platform thresholds derived from recorded mean/stddev/sample-count
   (e.g., fail beyond max(fail-ratio, mean + k·σ) with k machine-tested), plus
   an absolute-delta floor so 76 ms noise on a 133 ms baseline cannot page you.
   No calendar expiries anywhere (F8).
   Data (R6): capture fresh multi-sample baselines against upstream 1.6.1 via
   `perf-baseline.yml` in the authorized window. Anti-laundering: the rebaseline
   commit must record old-vs-new absolute values, upstream versions, run IDs,
   and sample counts, and the R6 SUMMARY must explain the deltas (Windows
   10.2s→17.1s especially) rather than resetting ratios silently. Cousin
   Install's 18/18 pass suggests functional install health, but that is
   evidence about correctness, not about performance — do not pre-declare
   "not a regression."
5. **Verdaccio authentication (43-11R4).** Ephemeral least-privilege identity:
   after registry health check, create a per-run user via Verdaccio's default
   htpasswd signup (`PUT /-/user/org.couchdb.user:<random>`) with
   crypto-random credentials generated in-process, write the returned token as
   `//<host>/:_authToken=` into the temp `.npmrc`, and never print credentials
   to stdout/stderr or the report (redaction already exists in this script
   family — reuse it). Token scope dies with the service container. Keep
   pack → publish → install → upgrade fully real. Do not configure anonymous
   publish.
6. **Docs link policy (43-11R6 via R5's lychee change).** Deterministic policy:
   blocking PR checks validate only endpoints whose availability reflects
   project health; third-party badge/image endpoints (`api.star-history.com`)
   move to a lychee exclude with a comment stating why. Real link-rot coverage
   is preserved by keeping those hosts in the SCHEDULED link audit (non-blocking,
   reports to run summary/artifact — not to issues). Do not add 500 to the
   global accept list; do not delete the badges.
7. **Issue-mutation governance (43-11R5).** PR-triggered CI becomes read-only:
   workflow-level `permissions: contents: read` in ci.yml; delete `issues: write`
   from BOTH the `osv-scanner` and `test` jobs; relocate both upsert steps
   (OSV medium/low + Windows flake) into the existing scheduled/dispatch
   maintenance surface (`flake-issue-maintenance.yml` or one consolidated
   `issue-maintenance.yml`) that runs with explicit `issues: write`, never on
   `pull_request`, consuming run artifacts. Diagnostic value in PR runs is kept
   via job summaries/artifacts. Co-update `config/phase43-hosted-ci-contract.json`
   topology + tests in the same plan (CF-8). The seven existing comments:
   recommend LEAVE as accurate historical record (deleting is another public
   mutation with zero evidentiary gain) — user decision either way.

---

## 5. USER CONSULTATION BOUNDARY

**Autonomous for the project lead after this review is ratified** (reversible,
local, inside the replan authority):
- Author `43-11R-SUMMARY.md`, the six new PLAN files, roadmap/STATE/resume-doc
  updates, and the two one-line downstream amendments.
- Execute plans 43-11R1…43-11R5 locally (source/test/workflow-file edits are
  now within GSD ownership; the resume doc's "no source edits before the
  Fable-led replan" condition is discharged by this review + your approval).
- Run all local gates; close the billing-lock inbox item to `archived/`.

**Prior approval required** (external, public, shared-state, or irreversible):
- Any `git push`; any hosted workflow cycle including `perf-baseline.yml`
  dispatch (the R6 window is ONE bounded authorization covering baseline
  capture + verification cycle + collection).
- Deleting or editing the seven automated issue comments (#5–#11).
- Changing main branch protection (stale `Boundary & Override Check` context) —
  and only AFTER the retry proves the replacement contexts.
- Merging draft PR #23; any release/publish action.
- Changing the machine-global Bun installation, or choosing 1.3.14 over 1.3.5
  as the pin (shared live sessions on this machine).
- The formal Fable checkpoint invocation inside R6 (quota window + shared
  Claude session safety, per the resume doc's step 1).

**Notify after action** (no pre-approval needed, but must be surfaced):
- Any deviation discovered mid-corrective-plan that touches upstream-owned
  files (skin discipline), the 11N contract, or governed digests.
- The cyclonedx 6.0.0 spike outcome if the CLI contract changed enough to alter
  `generate-sbom.js` behavior (11K coordination).
- Results of every local gate run in the plan SUMMARYs, per normal GSD practice.

---

## 6. REJECTED ALTERNATIVES

- **Shape B (expand 11R in place).** Requires retroactively rewriting 11R's
  preconditions and must-have truths, bundles six failure families into one
  oversized plan, and destroys the clean "plan stopped honestly" audit trail —
  the very property that makes this failure recoverable. Rejected.
- **Shape C (pull downstream plans forward wholesale).** 11K depends on 43-11X
  (post-coverage-foundation checkpoint); pulling it before 11D inverts reviewed
  dependencies and contaminates its intent; other candidates (11W, coverage
  plans) consume 11D outputs — circular. Rejected, except the single
  documented one-line 11K amendment (Bun-pin consumption), which is an
  amendment, not a reorder.
- **Suppressing GHSA-v75r-vx73-82pj** via `.planning/audits/suppressions.json`.
  Mechanically available, 60-day TTL laundering of a HIGH advisory in the
  supply-chain attestation tool itself. Rejected outright.
- **Anonymous-publish Verdaccio config** (`$all` publish). Simpler than
  ephemeral identity but erodes upgrade realism (real registries authenticate)
  and violates the packet's least-privilege direction. Rejected.
- **Accepting HTTP 500 in lychee's global accept list.** Masks genuine server
  errors on every checked link, not just badges. Rejected in favor of a scoped
  exclude + scheduled non-blocking audit.
- **Another calendar-dated performance exception.** Explicitly forbidden by F8;
  also the third iteration of a proven-failed pattern. Rejected.
- **Weakening `resolveReceiptPath` canonicalization** so the existing test
  passes. Deletes a symlink-escape defense to satisfy a wrong oracle; violates
  invariant 7. Rejected.
- **Self-hosted or alternate CI** to route around hosted scarcity. Forbidden by
  the resume doc; would change the evidence authority the whole Phase 43 gate
  chain certifies against. Rejected.
- **Proactively deleting the seven issue comments.** Another unapproved-class
  public mutation with no evidentiary gain; the comments are factual. Rejected
  as a default; remains a user call.
- **One mega "fix CI" corrective plan.** Buries independent failure families,
  makes ownership and RED-GREEN boundaries unauditable, and guarantees a long
  mixed diff before the scarce retry window. Rejected.

---

## 7. CONFIDENCE AND OPEN EVIDENCE

**High-confidence repository facts** (verified this session, direct reads +
two independent sweeps with spot-checks): the evidence JSON contents (all run
IDs, job counts, 10 failure rows, drift, side effects, constraints); 11R's
blocker text and task states; F3/F8 and standing-checkpoint wording; absence of
`post-11n.json`, `plan11d-entry.json`, `43-11R-SUMMARY.md`; perf baseline
provenance and expired exceptions; every workflow/config citation in Section 2;
the line-level characterization of all three cross-platform failures; local
head `f2d50b29` with only the packet untracked.

**Asserted, not re-verified** (packet's 2026-07-18 read-only checks; my GitHub
queries were approval-gated): PR #23 still open at head `2c9ba087`; no newer
hosted cycle; billing lock still clear TODAY (it was user-confirmed cleared on
2026-07-14). R6's authorization step must re-confirm billing/PR state before
the window opens — cheap, and it converts these assertions into facts.

**Needs a spike or test before code lands:** cyclonedx-npm 6.0.0 CLI/output
compatibility with `generate-sbom.js` (R1 RED phase); Verdaccio 6 default
signup-endpoint behavior in the service container (R4 RED phase); `setup-bun`
`bun-version-file` support (R5, docs check with template fallback); whether the
variance policy's k-bound is derivable from existing recorded stddev or needs
the fresh multi-sample capture (R3 designs for both).

**Needs the hosted run:** everything envelope-bound — the passed `post-11n.json`,
fresh 1.6.1 perf baselines, proof of the relocated governance topology, and the
formal Fable checkpoint. One bounded window (R6) covers all of it.

**Needs a user decision:** Bun pin value (recommend 1.3.5 now, deliberate bump
later); fate of the seven comments (recommend leave); branch-protection context
update timing (after retry); authorization of the R6 two-push single window.

**Known unknowns I could not close:** why `Microsoft.PowerShell.Security`
failed to autoload on that specific runner image (the explicit Import-Module
fix makes the answer unnecessary, but the root cause is unconfirmed); whether
Windows install-time growth (10.2s→17.1s) is upstream-1.6.1 payload, runner
image change, or real regression — R6's rebaseline evidence is designed to
answer it rather than assume it.

---

## Execution appendix (first moves once ratified)

1. Write `43-11R-SUMMARY.md` (truthful closure per Section 3) and update
   STATE.md / ROADMAP.md / `43-HOSTED-CI-RESUME.md` with the corrected graph.
2. Author the six PLAN files (`43-11R1`…`43-11R6`) with the file lists, waves,
   and depends_on from Section 3; apply the two one-line amendments (11D, 11K).
3. Execute wave 19 (R1–R4 parallelizable), then wave 20 (R5), running each
   plan's RED-GREEN verification; run the full local gate.
4. Close the billing-lock inbox item to `archived/`.
5. Request the R6 authorization window from the user (push + perf-baseline
   dispatch + five-workflow cycle + collection + Fable checkpoint).

Verification: each plan carries `<verify>` commands (existing suites plus the
new RED-GREEN tests named above); the end-to-end proof of this whole correction
is R6's strict collector producing a passed `post-11n.json` at the final head —
the same fail-closed mechanism that correctly refused to produce one this time.
