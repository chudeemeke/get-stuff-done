---
phase: 43
plan: "11AI"
type: execute
gap_closure: true
wave: 21
depends_on: ["43-11AH"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-05", "UPGRADE-08", "UPGRADE-09", "SHIP-03A", "SHIP-08"]
files_modified:
  - config/phase43-corrective-gate.json
  - scripts/verify-phase43-corrective-gate.js
  - tests/phase43-corrective-gate.test.js
  - tests/verify-hosted-ci.test.js
  - .planning/evidence/hosted/pre-retry-local-authority.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AI-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "every known hosted failure family is rejected by a deterministic local gate before another external cycle"
    - "new and changed corrective executable code reaches at least 95% statements, branches, functions, and lines independently"
    - "the local receipt binds exact source, workflow, contract, policy, lock, and toolchain digests"
    - "a local pass is necessary but never represented as hosted authority"
  artifacts:
    - "config/phase43-corrective-gate.json"
    - "scripts/verify-phase43-corrective-gate.js"
    - "tests/phase43-corrective-gate.test.js"
    - ".planning/evidence/hosted/pre-retry-local-authority.json"
    - "43-11AI-SUMMARY.md"
  key_links:
    - "corrective plan outputs -> frozen local command set -> immutable local authority receipt"
    - "local receipt digests -> hosted authorization preflight -> one external cycle"
---

<objective>
Prove the complete corrective head locally and publish one machine-checkable
pre-retry receipt without conflating local confidence with hosted authority.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AE-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AH-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AG-11AH-AUTHORITATIVE-REVIEW-2026-07-20.md
</context>

<tasks>

<task id="11AI-01" type="auto">
  <name>Build the fail-closed corrective integration gate</name>
  <files>config/phase43-corrective-gate.json; scripts/verify-phase43-corrective-gate.js; tests/phase43-corrective-gate.test.js; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: reject missing summaries, dirty governed paths, a changed lock after
    install, any skipped known-failure check, sub-95 metric, absent toolchain
    pin, mutable workflow dependency, missing subject step, issue-write in PR CI,
    stale absolute perf authority, anonymous registry mode, or unvalidated SBOM.
    Reject a corrective command set that substitutes fixtures for the required
    real Hyperfine 1.20.0 adapter-operability run, reuses one worktree for both
    subjects, leaves either subject dirty, or omits comparison adjudication.
    Add cross-type fixtures proving the local corrective verifier rejects a
    hosted envelope and the hosted verifier rejects a local corrective receipt;
    neither verifier may become polymorphic across those authority types.

    GREEN: compose existing focused commands into one injectable orchestrator
    with bounded JSON output. The contract must include frozen install, Bun/native
    functional authority, repository and N=3 compatibility, audit and OSV, SBOM
    generation/validation, authenticated local Verdaccio verification, paired
    performance fixtures, docs policy, workflow lint, toolchain authority,
    hosted-collector negatives, and four independent coverage metrics for every
    new or changed corrective executable.
    Add one named real local Hyperfine check that uses the reviewed installer,
    two distinct clean immutable local worktrees, the trusted 11AG harness,
    at least ten measured pairs, `bench.js --paired`, and
    `check-perf.js --comparison`. Record the binary version, subject commits,
    bounded command identity, comparison digest, and adjudication status. This
    is adapter-operability evidence only and must not emit Tier A, hosted,
    cross-platform, accepted-regression, or SLO-change claims.

    REFACTOR: record command identity, exit status, duration, and artifact digest
    without embedding unbounded logs or secrets.
  </action>
  <verify>
    <automated>bun run test -- tests/phase43-corrective-gate.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AI-02" type="auto">
  <name>Run and commit the local pre-retry authority receipt</name>
  <files>.planning/evidence/hosted/pre-retry-local-authority.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AI-SUMMARY.md</files>
  <action>
    Run the corrective gate from a clean tracked head. Fail without publishing a
    receipt if any command, metric, digest, secret scan, or known-failure class
    is not authoritative. On success, write a create-only receipt bound to the
    exact local commit and governed digests. The receipt must identify itself as
    local pre-retry evidence and contain no hosted verdict field.
  </action>
  <acceptance_criteria>
    - all known 2026-07-14 failure families have a named passing local check.
    - a real Hyperfine 1.20.0 paired adapter-operability run passes against two distinct clean immutable local worktrees.
    - all four coverage metrics are at least 95% for corrective executable scope.
    - the receipt is tracked, schema-valid, secret-scanned, and bound to the exact head.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-phase43-corrective-gate.js --receipt .planning/evidence/hosted/pre-retry-local-authority.json</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Scattered green commands can omit the exact failure that motivated a retry, and
an unbounded receipt can leak child output. One explicit contract with negative
fixtures, per-metric coverage, exact digests, and bounded diagnostics makes the
authorization input reviewable while preserving the local/hosted distinction.
</threat_model>

<verification>
- `bun run test -- tests/phase43-corrective-gate.test.js`
- `node scripts/verify-phase43-corrective-gate.js --receipt .planning/evidence/hosted/pre-retry-local-authority.json`
- `git diff --check`
</verification>
