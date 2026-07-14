---
phase: 43
plan: "11E"
type: execute
gap_closure: true
wave: 17
depends_on: ["11K"]
status: pending
requirements: ["SHIP-08A"]
files_modified:
  - bin/gsd.js
  - bin/install.js
  - bin/preview-update-cli.js
  - hooks/gsd-context-monitor.js
  - hooks/index.js
  - overlay/bin/sync-tools.cjs
  - overlay/bin/validate-configs.js
  - overlay/src/platform/paths.js
  - overlay/src/theme/index.js
  - tests/*.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "launcher, installer, hook-manifest, and overlay entry paths each reach 95% in all four metrics"
    - "coverage tests assert behavior and failure semantics, not line execution alone"
    - "side effects are injectable where branch testing otherwise requires global mutation"
  artifacts:
    - "43-11E-SUMMARY.md"
  key_links:
    - "entry-point tests -> public CLI/install behavior -> runtime coverage group"
    - "overlay canonical paths -> byte-identical runtime mirrors -> one logical source result"
---

<objective>
Close the bounded launch/runtime coverage cluster without changing public CLI or
installer behavior.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@bin/gsd.js
@bin/install.js
@hooks/index.js
</context>

<tasks>

<task id="11E-01" type="auto">
  <name>Close CLI and installer entry coverage</name>
  <files>bin/gsd.js; bin/install.js; bin/preview-update-cli.js; overlay/bin/sync-tools.cjs; overlay/bin/validate-configs.js; tests/launcher.test.js; tests/installer-safety.test.js; tests/installer-v3.test.js; tests/package-launcher-v3.test.js; tests/preview-update-coverage.test.js; tests/validate-configs.test.js</files>
  <action>
    Use c8 file evidence to add one RED behavioral assertion at a time for the
    named files: invalid arguments, missing/corrupt inputs, delegation failure,
    rollback, non-interactive provenance, help/version output, and child exit
    propagation. Refactor only verified hard-to-reach branches into pure
    parsers or injected filesystem/process ports. Preserve CLI text, exit codes,
    rollback boundaries, and upstream delegation. Do not ignore lines, lower
    thresholds, or count the upstream snapshot override as fork source.
  </action>
  <acceptance_criteria>
    - the `launchers` source-contract group is >=95% statements, branches, functions, and lines.
    - installer rollback and user-file preservation assertions remain green.
    - public help/version/provenance output is unchanged except for verified defects.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/launcher.test.js tests/installer-safety.test.js tests/installer-v3.test.js tests/package-launcher-v3.test.js tests/preview-update-coverage.test.js tests/validate-configs.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope launchers</automated>
  </verify>
  <done>false</done>
</task>

<task id="11E-02" type="auto">
  <name>Close runtime support entry coverage</name>
  <files>hooks/gsd-context-monitor.js; hooks/index.js; overlay/src/platform/paths.js; overlay/src/theme/index.js; tests/hooks-manifest.test.js; tests/hooks.test.js; tests/platform.test.js; tests/theme.test.js</files>
  <action>
    Add RED tests for context-monitor input/error boundaries, hook manifest
    lookup/path errors, platform path fallbacks, and theme barrel exports.
    Preserve overlay as source authority and prove each runtime mirror remains
    byte-identical through the source-contract test. Remove dead branches only
    after proving they are unreachable by contract.
  </action>
  <acceptance_criteria>
    - the `runtime-support` group is >=95% in all four metrics.
    - hook manifest package paths and overlay classifications remain unchanged.
    - mirror drift checks pass.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/hooks-manifest.test.js tests/hooks.test.js tests/platform.test.js tests/theme.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope runtime-support</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Entry-point coverage can become assertion-free subprocess smoke tests. Require
observable output, exit, filesystem, and rollback assertions. Extract only pure
or injected seams that reduce real coupling; do not fork upstream installer
logic into the wrapper.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope launchers`
- `bun run test:coverage:four-metric -- --scope runtime-support`
- `bun test`
- `git diff --check`
</verification>
