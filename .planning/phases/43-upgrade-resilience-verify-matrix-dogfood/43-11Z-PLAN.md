---
phase: 43
plan: "11Z"
type: execute
gap_closure: true
wave: 31
depends_on: ["43-11H"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-08"]
files_modified:
  - scripts/run-compat-matrix.js
  - scripts/run-upstream-compat.js
  - scripts/run-upstream-compat-ci.js
  - scripts/verify-upgrade.js
  - tests/run-upstream-compat.test.js
  - tests/run-upstream-compat-ci.test.js
  - tests/verify-upgrade.test.js
  - tests/ci-workflow.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Z-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "compatibility and upgrade-execution tooling reaches 95% in every metric"
    - "normal versus require-all matrix exit policy remains explicit"
    - "network, registry, git, timeout, and cleanup failures are deterministic injected cases"
  artifacts:
    - "43-11Z-SUMMARY.md"
  key_links:
    - "reviewed candidates -> compatibility runners -> matrix policy"
    - "Verdaccio upgrade execution -> structured report -> closeout evidence"
---

<objective>
Close compatibility-matrix and upgrade-runner coverage without changing the
N=3 common contract, exact-pin policy, or hosted registry authority.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11H-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@scripts/run-compat-matrix.js
@scripts/verify-upgrade.js
</context>

<tasks>

<task id="11Z-01" type="auto">
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
    <automated>bun run test -- tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js tests/verify-upgrade.test.js tests/ci-workflow.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope upgrade-execution</automated>
    <automated>node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --require-all --json</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Compatibility and upgrade runners can consume repository dist or live network
state accidentally. Candidate roots, registries, git, time, and cleanup remain
explicit ports, and historical reds remain visible to closeout.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope upgrade-execution`
- `node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --require-all --json`
- `git diff --check`
</verification>
