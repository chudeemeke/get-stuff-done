---
phase: 43
plan: "11T"
type: execute
gap_closure: true
wave: 24
depends_on: ["43-11E"]
status: pending
requirements: []
files_modified:
  - hooks/gsd-context-monitor.js
  - hooks/index.js
  - overlay/src/platform/paths.js
  - overlay/src/theme/index.js
  - tests/hooks-manifest.test.js
  - tests/hooks.test.js
  - tests/platform.test.js
  - tests/theme.test.js
  - tests/production-source-contract.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11T-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "runtime-support source reaches 95% in all four metrics"
    - "tests assert runtime failure semantics and mirror ownership"
    - "source seams remain injectable without changing public behavior"
  artifacts:
    - "43-11T-SUMMARY.md"
  key_links:
    - "hook and platform behavior -> runtime-support coverage group"
    - "overlay source authority -> byte-identical mirrors -> one logical result"
---

<objective>
Close the bounded runtime-support coverage group without coupling it to launcher
coverage or Fable governance edits.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md
@hooks/index.js
</context>

<tasks>

<task id="11T-01" type="auto" tdd="true">
  <name>Close runtime-support entry coverage</name>
  <files>hooks/gsd-context-monitor.js; hooks/index.js; overlay/src/platform/paths.js; overlay/src/theme/index.js; tests/hooks-manifest.test.js; tests/hooks.test.js; tests/platform.test.js; tests/theme.test.js; tests/production-source-contract.test.js</files>
  <action>
    Add one RED behavioral assertion at a time for context-monitor input and
    error boundaries, hook-manifest lookup/path failures, platform path
    fallbacks, and theme barrel exports. Preserve overlay source authority and
    prove runtime mirrors remain byte-identical through the source contract.
    Extract only pure or injected filesystem/process seams justified by c8
    branch evidence; remove dead branches only after proving they are
    unreachable by contract.
  </action>
  <acceptance_criteria>
    - `runtime-support` is at least 95% statements, branches, functions, and lines.
    - hook package paths and overlay classifications remain unchanged.
    - mirror drift and behavioral failure assertions pass.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/hooks-manifest.test.js tests/hooks.test.js tests/platform.test.js tests/theme.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope runtime-support</automated>
  </verify>
  <done>false</done>
</task>

<task id="11T-02" type="auto">
  <name>Record runtime-support evidence</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11T-SUMMARY.md</files>
  <action>
    Record RED/GREEN assertions, any extracted seams, exact four metrics, source
    ownership and mirror results, focused test totals, and cleanup. Do not claim
    aggregate SHIP-08A completion.
  </action>
  <verify>
    <automated>rg -n "RED|GREEN|statements|branches|functions|lines|runtime-support|mirror|cleanup" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11T-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Runtime coverage can become assertion-free execution or duplicate mirror
counting. Require observable behavior and one canonical source identity.
</threat_model>

<verification>
- focused runtime-support tests
- `bun run test:coverage:four-metric -- --scope runtime-support`
- `git diff --check`
</verification>
