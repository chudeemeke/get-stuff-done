---
phase: 43
plan: "11H"
type: execute
gap_closure: true
wave: 30
depends_on: ["43-11V"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-08"]
files_modified:
  - scripts/generate-override-churn.js
  - scripts/preview-update.js
  - scripts/vetted-upstream-versions.js
  - scripts/lib/upstream-source.js
  - tests/upstream-source.test.js
  - tests/preview-update.test.js
  - tests/preview-update-coverage.test.js
  - tests/vetted-upstream-versions.test.js
  - tests/override-churn.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11H-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "upstream authority, preview, vetted-version, and churn tooling reaches 95% in every metric"
    - "network, registry, and git failures are deterministic injected cases"
  artifacts:
    - "43-11H-SUMMARY.md"
  key_links:
    - "upstream authority -> preview/vetted versions -> compatibility candidates"
    - "candidate reports -> matrix policy -> upgrade closeout evidence"
---

<objective>
Close coverage for upstream authority, preview, vetted-version, and churn
discovery without changing the Open GSD authority contract.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@scripts/preview-update.js
@scripts/vetted-upstream-versions.js
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
    <automated>bun run test -- tests/upstream-source.test.js tests/preview-update.test.js tests/preview-update-coverage.test.js tests/vetted-upstream-versions.test.js tests/override-churn.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope upgrade-discovery</automated>
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
- `git diff --check`
</verification>
