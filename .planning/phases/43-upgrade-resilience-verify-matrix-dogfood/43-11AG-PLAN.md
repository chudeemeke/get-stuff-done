---
phase: 43
plan: "11AG"
type: execute
gap_closure: true
wave: 19
depends_on: ["43-11AC"]
status: pending
requirements: ["UPGRADE-08", "SHIP-08"]
files_modified:
  - config/perf-comparison.schema.json
  - scripts/bench.js
  - scripts/check-perf.js
  - tests/bench.test.js
  - tests/check-perf.test.js
  - tests/perf-baseline-schema.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "blocking performance authority compares reference and candidate on the same runner and toolchain"
    - "raw samples, execution order, commits, workload digests, and environment provenance remain inspectable"
    - "the existing warning and failure budgets remain unchanged until the user explicitly changes an SLO"
    - "calendar exceptions and stale cross-upstream baselines cannot make a blocking comparison pass"
  artifacts:
    - "config/perf-comparison.schema.json"
    - "tests/bench.test.js"
    - "tests/check-perf.test.js"
    - "43-11AG-SUMMARY.md"
  key_links:
    - "reference/candidate pair -> raw samples -> statistical comparison -> unchanged budget verdict"
    - "commit/workload/toolchain identity -> comparison provenance -> hosted evidence"
---

<objective>
Replace stale cross-run baseline enforcement with paired same-run performance
evidence while preserving the already-approved budget and reserving regression
acceptance for the user.
</objective>

<context>
@scripts/bench.js
@scripts/check-perf.js
@perf-baseline.json
@config/perf-baseline.schema.json
@tests/bench.test.js
@tests/check-perf.test.js
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-PAIRED-PERF-SPIKE.md
</context>

<tasks>

<task id="11AG-01" type="auto">
  <name>Define the paired performance evidence contract</name>
  <files>config/perf-comparison.schema.json; tests/bench.test.js; tests/check-perf.test.js; tests/perf-baseline-schema.test.js</files>
  <action>
    RED: define fixtures that reject different runner/toolchain identities,
    missing raw samples, non-alternating or undisclosed execution order, fewer
    than the policy's measured pairs, mismatched workload/lock digests, missing
    reference/candidate commits, non-finite timings, stale absolute-baseline
    authority, and any calendar exception affecting a blocking verdict.

    Prove warning ratio 1.10 and failure ratio 1.25 remain the decision boundary.
    Add pass/warn/fail fixtures, order-effect fixtures, and an absolute-noise
    diagnostic that is reported but cannot silently override the ratio budget.
  </action>
  <verify>
    <automated>bun run test -- tests/bench.test.js tests/check-perf.test.js tests/perf-baseline-schema.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AG-02" type="auto">
  <name>Capture and adjudicate paired same-run measurements</name>
  <files>scripts/bench.js; scripts/check-perf.js; config/perf-comparison.schema.json; tests/bench.test.js; tests/check-perf.test.js</files>
  <action>
    GREEN: add a paired mode that benchmarks immutable reference and candidate
    worktrees on the same runner with warmup and at least ten measured pairs.
    Alternate AB/BA order using a recorded deterministic seed or use a proven
    Hyperfine interleaving primitive after verifying its official behavior.
    Persist every sample, order, commit, workload/lock digest, runner/CPU/arch,
    resolved Node/Bun/Hyperfine versions, and summarized ratio/statistical
    diagnostics.

    Make `check-perf` consume the paired artifact for blocking PR authority and
    retain `perf-baseline.json` only as non-blocking historical trend input.
    Remove calendar exceptions from the blocking decision path. Do not rebaseline
    or change the 1.10/1.25 budgets in this plan.

    REFACTOR: keep process execution, timing, artifact validation, comparison,
    and presentation behind separate injectable ports. Structured output must be
    deterministic for fixture inputs.
  </action>
  <acceptance_criteria>
    - reference and candidate execute under one recorded runner/toolchain identity.
    - raw samples and order are preserved and schema-valid.
    - stale absolute baselines and expired exceptions cannot influence the blocking result.
    - a ratio above 1.25 fails and triggers user disposition rather than automatic acceptance.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/bench.test.js tests/check-perf.test.js tests/perf-baseline-schema.test.js</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Cross-run means confound product change with runner, image, and toolchain drift;
automatic rebaselining can then launder a real regression. Paired measurements
control the environment, raw samples preserve auditability, and unchanged
budgets keep acceptance authority outside the measurement implementation.
</threat_model>

<verification>
- `bun run test -- tests/bench.test.js tests/check-perf.test.js tests/perf-baseline-schema.test.js`
- focused four-metric coverage at or above 95% for changed benchmark/checker code
- `git diff --check`
</verification>
