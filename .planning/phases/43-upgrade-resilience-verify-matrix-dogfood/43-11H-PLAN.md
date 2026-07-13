---
phase: 43
plan: "11H"
type: execute
gap_closure: true
wave: 19
depends_on: ["11G"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-05", "UPGRADE-08", "SHIP-08A", "SHIP-08B"]
files_modified:
  - scripts/generate-override-churn.js
  - scripts/preview-update.js
  - scripts/run-compat-matrix.js
  - scripts/run-upstream-compat.js
  - scripts/run-upstream-compat-ci.js
  - scripts/verify-upgrade.js
  - scripts/vetted-upstream-versions.js
  - scripts/lib/upstream-source.js
  - tests/*.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11H-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "upgrade and compatibility tooling reaches 95% in every metric"
    - "normal versus require-all matrix exit policy remains explicit"
    - "network, registry, and git failures are deterministic injected cases"
  artifacts:
    - "43-11H-SUMMARY.md"
  key_links:
    - "upstream authority -> preview/vetted versions -> compatibility candidates"
    - "candidate reports -> matrix policy -> upgrade closeout evidence"
---

<objective>
Close coverage for upstream preview, compatibility, churn, and upgrade
verification without changing the Open GSD authority or matrix contract.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@scripts/verify-upgrade.js
@scripts/run-compat-matrix.js
</context>

<tasks>

<task id="11H-01" type="auto">
  <name>Close authority, preview, vetted-version, and churn coverage</name>
  <files>scripts/lib/upstream-source.js; scripts/preview-update.js; scripts/vetted-upstream-versions.js; scripts/generate-override-churn.js; tests/upstream-source.test.js; tests/preview-update.test.js; tests/preview-update-coverage.test.js; tests/vetted-upstream-versions.test.js; tests/override-churn.test.js</files>
  <action>
    Add RED tests for malformed authority manifests, missing package metadata,
    prerelease/stable selection boundaries, network and git failures, invalid
    candidate manifests, pruning rules, churn marker corruption, and write
    refusal outside `Unreleased`. Inject fetch/git/filesystem/clock ports and
    keep exact reviewed pins mandatory.
  </action>
  <acceptance_criteria>
    - the `upgrade-discovery` group is >=95% in all four metrics.
    - prereleases cannot become active stable authority implicitly.
    - churn writes remain marker-bound and deterministic.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/upstream-source.test.js tests/preview-update.test.js tests/preview-update-coverage.test.js tests/vetted-upstream-versions.test.js tests/override-churn.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope upgrade-discovery</automated>
  </verify>
  <done>false</done>
</task>

<task id="11H-02" type="auto">
  <name>Close compatibility and upgrade-runner coverage</name>
  <files>scripts/run-compat-matrix.js; scripts/run-upstream-compat.js; scripts/run-upstream-compat-ci.js; scripts/verify-upgrade.js; tests/run-upstream-compat.test.js; tests/run-upstream-compat-ci.test.js; tests/verify-upgrade.test.js; tests/ci-workflow.test.js</files>
  <action>
    Add RED fixtures for candidate staging, marker cleanup, timeout, malformed
    child JSON, missing suites, active-pin red, historical-only red,
    `--require-all`, Verdaccio unavailable locally versus CI authority,
    rollback, smoke failure, and report-write failure. Reuse injected process,
    clock, filesystem, registry, and owned-temp ports; do not shell-concatenate
    commands or weaken the N=3 common contract.
  </action>
  <acceptance_criteria>
    - the `upgrade-execution` group is >=95% in all four metrics.
    - normal matrix mode blocks the active pin only; `--require-all` blocks any red row.
    - upgrade report exit code and structured status always agree.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js tests/verify-upgrade.test.js tests/ci-workflow.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope upgrade-execution</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Upgrade tests can accidentally consume repository `dist` or live network state.
Candidate roots, registries, git, time, and cleanup are explicit ports; missing
inputs fail closed. Coverage must not add version-specific suite skips or make
historical reds invisible to closeout.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope upgrade-discovery`
- `bun run test:coverage:four-metric -- --scope upgrade-execution`
- `node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --require-all --json`
- `git diff --check`
</verification>
