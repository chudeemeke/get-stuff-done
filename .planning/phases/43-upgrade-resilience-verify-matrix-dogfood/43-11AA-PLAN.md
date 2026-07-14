---
phase: 43
plan: "11AA"
type: execute
gap_closure: true
wave: 35
depends_on: ["43-11J"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - scripts/validate-phase43-evidence.js
  - tests/validate-phase43-evidence.test.js
  - tests/ci-workflow.test.js
  - .github/workflows/ci.yml
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AA-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "filesystem, git, GitHub, and package adapters preserve the pure validator decisions"
    - "candidate-D-7, confirmed-D-7, production-assurance, Plan 11 transition, refresh, and closeout CLI modes fail closed"
    - "multi-file transitions use one journaled staged-write adapter with deterministic recovery and fault-injection coverage"
    - "CI blocks on Bun functional parity, four independent coverage metrics, and production assurance"
    - "the complete closeout-evidence group reaches 95% in every metric"
  artifacts:
    - "scripts/validate-phase43-evidence.js"
    - ".github/workflows/ci.yml"
    - "43-11AA-SUMMARY.md"
  key_links:
    - "injected adapters -> pure validator core -> atomic CLI outcomes"
    - "CI workflow jobs -> policy-required names -> blocking production assurance"
---

<objective>
Wire strict validator adapters and CLI modes, cover the complete validator, and
make the production-assurance contract blocking in CI before final measurement.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11J-SUMMARY.md
@scripts/validate-phase43-evidence.js
@config/phase43-closeout-policy.json
@.github/workflows/ci.yml
</context>

<tasks>

<task id="11AA-01" type="auto">
  <name>Wire fail-closed adapters and transactional validator modes</name>
  <files>config/production-source-contract.json; config/phase43-closeout-policy.json; scripts/validate-phase43-evidence.js; tests/validate-phase43-evidence.test.js</files>
  <action>
    RED: add adapter and CLI fixtures for git ancestry/digest drift, GitHub
    capture failure, missing package evidence, atomic-write failure, and
    mismatched mode arguments. For `transition-plan11`, inject a failure after
    each of the three target replacements, a post-transition validation failure,
    process restart with a live transaction journal, and rollback failure; prove
    recovery restores all pre-transition bytes or leaves a durable non-passing
    recovery journal that makes every Plan 11 gate fail closed. Add the same
    two-file staged-write and rollback fixtures for `confirm-d7`. Prove a failed
    refresh cannot retain partial blocker-state bytes.

    GREEN: implement filesystem/git/`gh`/packing adapters without shell
    execution or secret output. Expose `--validate-d7-candidate`,
    `confirm-d7`, `--require-production-assurance`, `transition-plan11`,
    `--require-plan11-unblocked`, `--require-closeout`, and transactional
    `refresh-production-assurance`. Candidate mode validates complete machine
    evidence and explicit pending human status. `confirm-d7` requires the exact
    recomputed `--candidate-digest`, a strict corrections JSON file derived from
    the explicit checkpoint response, and canonical evidence/maintenance paths;
    it stages and journal-commits both pending-to-confirmed artifacts before
    closeout can pass. It never invents user identity.

    `transition-plan11` accepts the canonical blocker prose, blocker-state JSON,
    and Plan 11 paths. It validates production assurance and expected pre-state,
    parses JSON/frontmatter structurally, updates only marker-owned blocker
    prose, stages all three exact after-images, and writes a repository-contained
    transaction journal with target paths plus pre/post digests before replacing
    files. Replace blocker prose, then blocker state, then Plan 11 metadata;
    validate `--require-plan11-unblocked`; delete backups/journal only after
    success. On failure or restart, restore all pre-images and revalidate the
    blocked state. A rollback failure preserves the journal, emits no success,
    and causes every transition/closeout mode to fail until deterministic
    recovery succeeds. The same injected journaled writer backs D-7 confirmation
    and production-assurance refresh. Capture CI through structured `gh` output
    and SBOM/package evidence through marker-owned temp storage.
  </action>
  <acceptance_criteria>
    - every adapter failure is deterministic, secret-safe, and non-zero.
    - candidate-D-7 mode cannot authorize closeout; only `confirm-d7` can perform the digest-bound pending-to-confirmed transition.
    - refresh, D-7 confirmation, and Plan 11 transition restore prior bytes after every injected write/post-validation failure.
    - a simulated rollback failure leaves a durable recovery journal and all affected gates non-passing until recovery succeeds.
    - all public modes map to one tested pure-core decision.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/validate-phase43-evidence.test.js tests/production-source-contract.test.js</automated>
    <automated>node scripts/validate-phase43-evidence.js --help</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AA-02" type="auto">
  <name>Make validator coverage and production assurance blocking in CI</name>
  <files>config/phase43-closeout-policy.json; scripts/validate-phase43-evidence.js; tests/validate-phase43-evidence.test.js; tests/ci-workflow.test.js; .github/workflows/ci.yml</files>
  <action>
    RED: add workflow fixtures for missing, renamed, non-blocking, or reordered
    Bun, four-metric, and production-assurance gates, plus policy/check-name
    drift. Add uncovered validator branch fixtures before scoped measurement.

    GREEN: add a blocking CI job that runs preflight, Bun functional authority,
    the complete four-metric command, and real production-assurance validation.
    Reconcile required check names against workflow jobs and retain exact step
    ordering. Run the closeout-evidence scope only after the validator and all
    adapters are classified.
  </action>
  <acceptance_criteria>
    - required CI job names exactly match policy and cannot disappear silently.
    - Bun functional parity and all four coverage thresholds are independently blocking.
    - production assurance is a real validator invocation, not a placeholder.
    - `closeout-evidence` is at least 95% in statements, branches, functions, and lines.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/validate-phase43-evidence.test.js tests/ci-workflow.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope closeout-evidence</automated>
    <automated>bash scripts/lint-workflows.sh</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Correct pure decisions can still be weakened by adapters, non-atomic writes, or
workflow naming drift. Injected adapters, rollback fixtures, exact job-name
reconciliation, and self-coverage keep the boundary enforceable.
</threat_model>

<verification>
- `bun run test -- tests/validate-phase43-evidence.test.js tests/ci-workflow.test.js`
- `bun run test:coverage:four-metric -- --scope closeout-evidence`
- `bash scripts/lint-workflows.sh`
- `git diff --check`
</verification>
