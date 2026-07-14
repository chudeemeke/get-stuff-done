---
phase: 43
plan: "11G"
type: execute
gap_closure: true
wave: 19
depends_on: ["11F"]
status: pending
requirements: ["SHIP-08A"]
files_modified:
  - scripts/audit-check.js
  - scripts/bench.js
  - scripts/bench-test-timing.js
  - scripts/check-debt-ratchet.cjs
  - scripts/check-overrides.js
  - scripts/check-perf.js
  - scripts/cousin-smoke.js
  - scripts/flake-triage.js
  - scripts/osv-triage.js
  - scripts/verify-oversight-probes.js
  - tests/*.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11G-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "quality, audit, performance, flake, and oversight tooling reaches 95% in all metrics"
    - "negative paths preserve fail-closed gate behavior"
    - "tests use injected tools and fixtures rather than the live machine"
  artifacts:
    - "43-11G-SUMMARY.md"
  key_links:
    - "tool adapters -> structured findings -> CI exit policy"
    - "perf/flake evidence -> deterministic schema -> maintenance decisions"
---

<objective>
Close the quality and performance tooling cluster with deterministic negative
path tests and no weakening of existing gates.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@scripts/audit-check.js
@scripts/check-perf.js
@scripts/check-overrides.js
</context>

<tasks>

<task id="11G-01" type="auto">
  <name>Close audit, override, debt, and OSV coverage</name>
  <files>scripts/audit-check.js; scripts/check-debt-ratchet.cjs; scripts/check-overrides.js; scripts/osv-triage.js; tests/audit-check.test.js; tests/check-debt-ratchet.test.js; tests/check-overrides.test.js; tests/check-overrides-integration.test.js; tests/osv-triage.test.js</files>
  <action>
    Add RED fixtures for malformed reports, expired/mismatched suppressions,
    missing provenance, parser/tool failure, orphan overrides, semantic parser
    failure, and non-zero child exits. Refactor parsing and policy into pure
    functions where current globals obstruct branch tests. Preserve severity,
    staleness, and CI exit policy exactly.
  </action>
  <acceptance_criteria>
    - the `quality-security` group is >=95% statements, branches, functions, and lines.
    - stale overrides, expired suppressions, and unsuppressed findings still fail closed.
    - integration checks retain real subprocess coverage.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/audit-check.test.js tests/check-debt-ratchet.test.js tests/check-overrides.test.js tests/check-overrides-integration.test.js tests/osv-triage.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope quality-security</automated>
  </verify>
  <done>false</done>
</task>

<task id="11G-02" type="auto">
  <name>Close benchmark, perf, cousin, flake, and oversight coverage</name>
  <files>scripts/bench.js; scripts/bench-test-timing.js; scripts/check-perf.js; scripts/cousin-smoke.js; scripts/flake-triage.js; scripts/verify-oversight-probes.js; tests/bench.test.js; tests/bench-test-timing.test.js; tests/check-perf.test.js; tests/cousin-smoke.test.js; tests/flake-triage.test.js; tests/verify-oversight-probes.test.js</files>
  <action>
    Add RED fixtures for missing executables, unsupported platforms, invalid or
    stale baselines, accepted-regression mismatch/expiry, malformed JUnit,
    duplicate flake keys, cousin package-manager failures, and malformed trigger
    definitions. Inject clock/platform/child execution. Keep evidence schemas,
    thresholds, and advisory trigger IDs stable.
  </action>
  <acceptance_criteria>
    - the `quality-reliability` group is >=95% in all four metrics.
    - perf threshold boundaries and accepted-regression policy remain exact.
    - cousin and oversight failures remain actionable and non-zero.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/bench.test.js tests/bench-test-timing.test.js tests/check-perf.test.js tests/cousin-smoke.test.js tests/flake-triage.test.js tests/verify-oversight-probes.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope quality-reliability</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Quality tooling can be made green by swallowing parser or child-process errors.
Every injected failure must assert the same structured finding and non-zero exit
that CI consumes. Fixtures never read live credentials, package registries, or
the three live project workspaces.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope quality-security`
- `bun run test:coverage:four-metric -- --scope quality-reliability`
- `bun test`
- `git diff --check`
</verification>
