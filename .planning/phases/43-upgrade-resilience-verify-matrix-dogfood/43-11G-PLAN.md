---
phase: 43
plan: "11G"
type: execute
gap_closure: true
wave: 28
depends_on: ["43-11U"]
status: pending
requirements: []
files_modified:
  - scripts/audit-check.js
  - scripts/check-debt-ratchet.cjs
  - scripts/check-overrides.js
  - scripts/osv-triage.js
  - tests/audit-check.test.js
  - tests/check-debt-ratchet.test.js
  - tests/check-overrides.test.js
  - tests/check-overrides-integration.test.js
  - tests/osv-triage.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11G-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "audit, override, debt-ratchet, and OSV tooling reaches 95% in all metrics"
    - "negative paths preserve fail-closed gate behavior"
    - "tests use injected tools and fixtures rather than the live machine"
  artifacts:
    - "43-11G-SUMMARY.md"
  key_links:
    - "tool adapters -> structured findings -> CI exit policy"
    - "perf/flake evidence -> deterministic schema -> maintenance decisions"
---

<objective>
Close the bounded quality-security tooling cluster with deterministic negative
path tests and no weakening of existing gates.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@scripts/audit-check.js
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
    <automated>bun run test -- tests/audit-check.test.js tests/check-debt-ratchet.test.js tests/check-overrides.test.js tests/check-overrides-integration.test.js tests/osv-triage.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope quality-security</automated>
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
- `bun run test`
- `git diff --check`
</verification>
