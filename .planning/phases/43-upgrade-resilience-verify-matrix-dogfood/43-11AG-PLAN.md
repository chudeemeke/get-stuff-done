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
  - scripts/lib/paired-perf.js
  - scripts/bench.js
  - scripts/check-perf.js
  - tests/bench.test.js
  - tests/check-perf.test.js
  - tests/perf-comparison-schema.test.js
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
    - "scripts/lib/paired-perf.js"
    - "tests/bench.test.js"
    - "tests/check-perf.test.js"
    - "tests/perf-comparison-schema.test.js"
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
  <files>config/perf-comparison.schema.json; tests/perf-comparison-schema.test.js; tests/bench.test.js; tests/check-perf.test.js</files>
  <action>
    RED in vertical tracer bullets: define a closed schema plus semantic
    fixtures that reject different runner/toolchain identities, missing raw
    samples, non-alternating or seed-inconsistent execution order, fewer than
    ten complete measured pairs, missing reference/candidate commits, dirty or
    wrong-HEAD worktrees, failed preparation/benchmark receipts, non-positive or
    unsafe integer nanosecond timings, and stored summaries or verdicts that do
    not match recomputation from raw samples.

    Require shared harness, workload, scheduler, command-template, and policy
    digests. Record package, lock, and upstream-authority digests separately for
    each subject because a legitimate candidate may change them; do not require
    cross-subject lock equality. Exclude accepted-regression, calendar,
    baseline-authority, and threshold-override fields from the paired schema.

    Prove warning ratio 1.10 and failure ratio 1.25 remain the decision boundary.
    Add pass/warn/fail fixtures, order-effect fixtures, and an absolute-noise
    diagnostic that is reported but cannot silently override the ratio budget.
    Keep `perf-baseline.schema.json` tests unchanged as historical compatibility
    coverage; they do not imply blocking authority.
  </action>
  <verify>
    <automated>bun run test -- tests/perf-comparison-schema.test.js tests/bench.test.js tests/check-perf.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AG-02" type="auto">
  <name>Capture and adjudicate paired same-run measurements</name>
  <files>scripts/lib/paired-perf.js; scripts/bench.js; scripts/check-perf.js; config/perf-comparison.schema.json; tests/perf-comparison-schema.test.js; tests/bench.test.js; tests/check-perf.test.js</files>
  <action>
    GREEN: add one deep `paired-perf` domain module exposing paired capture and
    pure adjudication behind one injected benchmark-executor port. Keep CLI,
    filesystem, process, Hyperfine, and presentation adapters in `bench.js` and
    `check-perf.js`; do not create shallow ports for domain validation or
    presentation.

    Add a paired mode that benchmarks clean immutable reference and candidate
    worktrees on the same runner with equal warmup and at least ten measured
    pairs. Derive the first order from a recorded deterministic seed and
    alternate `AB`/`BA`; Hyperfine 1.20 measures one subject at a time while the
    outer scheduler owns interleaving. Before every sample, prove exact HEAD,
    cleanliness, successful reset/preparation, expected shared controls, and
    expected subject digests. Abort the whole artifact on any failure rather
    than dropping a pair.

    Persist every raw positive integer nanosecond duration, exit code, pair
    index, order, preparation result, commit, shared control digest,
    per-subject package/lock/authority digest, runner/CPU/arch/image identity,
    and resolved Node/Bun/Hyperfine version. Recompute means, blocking ratios,
    diagnostics, and verdict from raw unrounded durations and reject any stored
    derivative disagreement.

    Make `check-perf` consume the paired artifact for blocking PR authority and
    give that mode one authority input, `--comparison`; reject mixed legacy
    baseline/current inputs and threshold overrides. Retain `perf-baseline.json`
    only as separately labelled non-blocking historical trend input. Remove
    calendar exceptions from the blocking decision path. Do not rebaseline or
    change the 1.10/1.25 budgets in this plan.

    REFACTOR: schema and semantic validation must run at both capture and
    adjudication boundaries. Structured domain output must be byte-stable for
    identical fixture inputs. A local Hyperfine installation or timing verdict
    is not required or claimed; fixture-backed adapter evidence belongs to
    11AG, hosted execution to 11AH, and integrated local receipt to 11AI.
  </action>
  <acceptance_criteria>
    - reference and candidate execute under one recorded runner/toolchain identity.
    - raw samples and order are preserved and schema-valid.
    - derived summaries and verdict are recomputed from raw samples and cannot be tampered.
    - stale absolute baselines and expired exceptions cannot influence the blocking result.
    - a ratio above 1.25 fails and triggers user disposition rather than automatic acceptance.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/perf-comparison-schema.test.js tests/bench.test.js tests/check-perf.test.js</automated>
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
- `bun run test -- tests/perf-comparison-schema.test.js tests/bench.test.js tests/check-perf.test.js`
- focused four-metric coverage at or above 95% for changed benchmark/checker code
- `git diff --check`
</verification>
