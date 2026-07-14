---
phase: 43
plan: "11E"
type: execute
gap_closure: true
wave: 23
depends_on: ["43-11K"]
status: pending
requirements: []
files_modified:
  - bin/gsd.js
  - bin/install.js
  - bin/preview-update-cli.js
  - overlay/bin/sync-tools.cjs
  - overlay/bin/validate-configs.js
  - tests/launcher.test.js
  - tests/installer-safety.test.js
  - tests/installer-v3.test.js
  - tests/package-launcher-v3.test.js
  - tests/preview-update-coverage.test.js
  - tests/validate-configs.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "launcher and installer entry paths reach 95% in all four metrics"
    - "coverage tests assert behavior and failure semantics, not line execution alone"
    - "side effects are injectable where branch testing otherwise requires global mutation"
  artifacts:
    - "43-11E-SUMMARY.md"
  key_links:
    - "entry-point tests -> public CLI/install behavior -> runtime coverage group"
    - "launcher behavior -> source-contract group -> exact four-metric result"
---

<objective>
Close the bounded launcher and installer coverage group without changing public
CLI or installer behavior.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@bin/gsd.js
@bin/install.js
</context>

<tasks>

<task id="11E-01" type="auto">
  <name>Close launcher and preview entry coverage</name>
  <files>bin/gsd.js; bin/preview-update-cli.js; tests/launcher.test.js; tests/package-launcher-v3.test.js; tests/preview-update-coverage.test.js</files>
  <action>
    Use c8 file evidence to add one RED behavioral assertion at a time for the
    launcher and preview files: invalid arguments, missing/corrupt inputs,
    delegation failure, help/version output, and child exit propagation.
    Refactor only verified hard-to-reach branches into pure parsers or injected
    filesystem/process ports. Preserve CLI text, exit codes, and upstream
    delegation. Do not ignore lines or lower thresholds.
  </action>
  <acceptance_criteria>
    - focused launcher and preview behavior is covered by RED/GREEN assertions.
    - public help/version output is unchanged except for verified defects.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/launcher.test.js tests/package-launcher-v3.test.js tests/preview-update-coverage.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11E-02" type="auto">
  <name>Close installer and config-entry coverage</name>
  <files>bin/install.js; overlay/bin/sync-tools.cjs; overlay/bin/validate-configs.js; tests/installer-safety.test.js; tests/installer-v3.test.js; tests/validate-configs.test.js</files>
  <action>
    Continue RED/GREEN coverage for missing or corrupt install inputs,
    delegation failure, rollback, non-interactive provenance, user-file
    preservation, config validation, synchronization failures, and child exit
    propagation. Inject filesystem/process ports only where behavior remains
    identical. Do not count the upstream snapshot override as fork source.
  </action>
  <acceptance_criteria>
    - installer rollback and user-file preservation assertions remain green.
    - the complete `launchers` group is >=95% in all four metrics.
    - public provenance and failure behavior is unchanged except for verified defects.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/installer-safety.test.js tests/installer-v3.test.js tests/validate-configs.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope launchers</automated>
  </verify>
  <done>false</done>
</task>

<task id="11E-03" type="auto">
  <name>Record launcher coverage evidence</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md</files>
  <action>
    Record RED/GREEN behavioral assertions, any injected seams, exact launcher
    four metrics, focused test totals, preserved public output/exit behavior,
    and cleanup. Do not claim runtime-support or aggregate SHIP-08A closure.
  </action>
  <verify>
    <automated>rg -n "RED|GREEN|statements|branches|functions|lines|launchers|public|cleanup" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Entry-point coverage can become assertion-free subprocess smoke tests. Require
observable output, exit, filesystem, and rollback assertions. Extract only pure
or injected seams that reduce coupling; do not fork upstream installer logic.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope launchers`
- `bun run test`
- `git diff --check`
</verification>
