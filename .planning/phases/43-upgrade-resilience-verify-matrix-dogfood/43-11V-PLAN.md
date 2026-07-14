---
phase: 43
plan: "11V"
type: execute
gap_closure: true
wave: 29
depends_on: ["43-11G"]
status: pending
requirements: []
files_modified:
  - scripts/bench.js
  - scripts/bench-test-timing.js
  - scripts/check-perf.js
  - scripts/cousin-smoke.js
  - scripts/flake-triage.js
  - scripts/verify-oversight-probes.js
  - tests/bench.test.js
  - tests/bench-test-timing.test.js
  - tests/check-perf.test.js
  - tests/cousin-smoke.test.js
  - tests/flake-triage.test.js
  - tests/verify-oversight-probes.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11V-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "benchmark, performance, cousin, flake, and oversight tooling reaches 95% in all metrics"
    - "performance boundaries and accepted-regression policy remain exact"
    - "fixtures use injected platform, clock, and child-process ports rather than live project sessions"
  artifacts:
    - "43-11V-SUMMARY.md"
  key_links:
    - "benchmark and flake evidence -> deterministic schemas -> maintenance decisions"
    - "cousin and oversight probes -> actionable non-zero gate results"
---

<objective>
Close the bounded quality-reliability tooling group without coupling its
platform, timing, and subprocess behavior to security-policy tooling.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11G-SUMMARY.md
@scripts/check-perf.js
@scripts/flake-triage.js
@scripts/cousin-smoke.js
</context>

<tasks>

<task id="11V-01" type="auto">
  <name>Close benchmark and performance coverage</name>
  <files>scripts/bench.js; scripts/bench-test-timing.js; scripts/check-perf.js; tests/bench.test.js; tests/bench-test-timing.test.js; tests/check-perf.test.js</files>
  <action>
    Add RED fixtures for missing executables, unsupported platforms, invalid or
    stale baselines, and accepted-regression mismatch or expiry. Inject clock,
    platform, and child execution. Keep evidence schemas and thresholds stable.
  </action>
  <acceptance_criteria>
    - benchmark and performance focused tests cover failure and boundary behavior.
    - perf threshold boundaries and accepted-regression policy remain exact.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/bench.test.js tests/bench-test-timing.test.js tests/check-perf.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11V-02" type="auto">
  <name>Close cousin, flake, and oversight coverage</name>
  <files>scripts/cousin-smoke.js; scripts/flake-triage.js; scripts/verify-oversight-probes.js; tests/cousin-smoke.test.js; tests/flake-triage.test.js; tests/verify-oversight-probes.test.js</files>
  <action>
    Add RED fixtures for malformed JUnit, duplicate flake keys, cousin
    package-manager failures, unsupported platforms, missing executables, and
    malformed trigger definitions. Inject clock, platform, and child execution.
    Preserve advisory trigger IDs and actionable non-zero failures.
  </action>
  <acceptance_criteria>
    - cousin, flake, and oversight failures remain actionable and non-zero.
    - the complete `quality-reliability` group is >=95% in all four metrics.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/cousin-smoke.test.js tests/flake-triage.test.js tests/verify-oversight-probes.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope quality-reliability</automated>
  </verify>
  <done>false</done>
</task>

<task id="11V-03" type="auto">
  <name>Record quality-reliability coverage evidence</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11V-SUMMARY.md</files>
  <action>
    Record RED/GREEN assertions, injected seams, exact four metrics, focused
    totals, preserved policy/trigger behavior, and cleanup. Do not claim
    aggregate SHIP-08A closure.
  </action>
  <verify>
    <automated>rg -n "RED|GREEN|statements|branches|functions|lines|quality-reliability|cleanup" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11V-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Reliability tooling can appear green by reading ambient machine state or
swallowing child failures. Every platform, clock, executable, and report input
is injected and every malformed or failed path remains non-zero.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope quality-reliability`
- `bun run test`
- `git diff --check`
</verification>
