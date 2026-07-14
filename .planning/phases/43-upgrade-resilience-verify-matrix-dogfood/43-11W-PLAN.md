---
phase: 43
plan: "11W"
type: execute
gap_closure: true
wave: 20
depends_on: ["43-11D"]
status: pending
requirements: []
files_modified:
  - package.json
  - bun.lock
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - scripts/run-four-metric-coverage.js
  - tests/run-four-metric-coverage.test.js
  - .planning/evidence/phase43-coverage-feasibility.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11W-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Jest and native Node subprocess records merge into four real c8 metrics"
    - "every source group has a machine-readable truthful-coverage feasibility verdict before closure work starts"
    - "the new coverage runner is classified exactly once through a reviewed denominator diff before it can execute"
    - "fallbacks use exact counters over one runner or disjoint source partitions, never metric averages"
    - "Windows junction execution resolves to one non-zero canonical source identity"
    - "raw coverage and reports are removed through marker-owned cleanup on every exit path"
  artifacts:
    - "scripts/run-four-metric-coverage.js"
    - "tests/run-four-metric-coverage.test.js"
    - ".planning/evidence/phase43-coverage-feasibility.json"
    - "43-11W-SUMMARY.md"
  key_links:
    - "Plan 11D base contract -> reviewed runner-classification diff -> exact c8 source set and current denominator digest"
    - "Jest and Node subprocesses -> NODE_V8_COVERAGE -> c8 aggregate"
    - "runner samples -> per-group feasibility verdict -> later closure-plan authority"
---

<objective>
Build the marker-owned multi-process four-metric runner and prove truthful
coverage feasibility for every source group before broad threshold closure.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@config/production-source-contract.json
@scripts/lib/production-source-contract.js
@scripts/lib/owned-temp.js
</context>

<tasks>

<task id="11W-01" type="auto">
  <name>Build the fail-closed multi-process four-metric runner</name>
  <files>package.json; bun.lock; config/production-source-contract.json; config/phase43-closeout-policy.json; scripts/run-four-metric-coverage.js; tests/run-four-metric-coverage.test.js</files>
  <read_first>
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
    - config/production-source-contract.json
    - scripts/lib/production-source-contract.js
    - scripts/lib/owned-temp.js
  </read_first>
  <action>
    RED: add a production-source fixture proving the newly tracked
    `scripts/run-four-metric-coverage.js` fails as unclassified before the
    contract changes. Require the correction to emit the exact machine-readable
    denominator addition and retain the Plan 11D contract digest as lineage.
    Add runner fixtures proving failure on a Bun, Jest, or Node command red;
    missing or malformed raw reports; any independent metric below 95; source,
    policy, or contract drift; path or reparse escape; overlapping runner
    ownership; metric averaging; and cleanup failure. Add a permanent Windows
    junction fixture where a child Node process emits V8 records through the
    junction. Require one non-zero canonical source entry, no junction alias,
    and no duplicate or zero-valued canonical path. Use a portable symlink
    equivalent where supported while retaining the mandatory Windows fixture in
    Windows CI.

    GREEN: classify `scripts/run-four-metric-coverage.js` exactly once in
    `config/production-source-contract.json`, preserve the reviewed denominator
    diff, and exact-pin `c8@11.0.0`. Add a launcher that validates the resulting
    complete source contract before creating one marker-owned OS-temp root, runs the
    canonical Bun adapter first, the explicit live Jest set second, and the
    policy's required `node:test` suites third with one `NODE_V8_COVERAGE`
    directory. Invoke c8 with the realpath-derived project root,
    `--allowExternal`, exact contract paths, four independent thresholds, and
    no ignore comments or auto-update behavior. Canonicalize evidence paths to
    repository-relative POSIX form. Expose `--validate-source-contract` as a
    no-measurement reconciliation mode. Always clean through the owned-temp port
    in `finally`.

    Count Node raw records only for canonical production paths assigned to Node;
    test files never enter the production denominator. Reject any scoped run
    until the full group partition validates.

    REFACTOR: keep process execution, raw-record collection, canonicalization,
    exact-counter aggregation, reporting, and temp cleanup behind injected ports.
  </action>
  <acceptance_criteria>
    - Bun, explicit Jest, and required Node inputs all contribute their owned records.
    - a synthetic uncovered branch fails only the relevant threshold.
    - metric averaging and overlapping runner ownership fail closed.
    - the runner is unclassified in RED, then classified exactly once with a reviewed denominator diff and Plan 11D base-digest lineage.
    - the Windows junction fixture records one non-zero canonical path with no alias or duplicate.
    - raw coverage and reports are absent after success and every tested failure path.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/run-four-metric-coverage.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --representative</automated>
  </verify>
  <done>false</done>
</task>

<task id="11W-02" type="auto">
  <name>Publish evidence-backed feasibility for every source group</name>
  <files>config/phase43-closeout-policy.json; scripts/run-four-metric-coverage.js; tests/run-four-metric-coverage.test.js; .planning/evidence/phase43-coverage-feasibility.json</files>
  <action>
    RED: add fixtures that reject a missing group verdict, stale denominator or
    contract digest, unexplained classification diff, missing runner sample,
    a feasible verdict without non-zero canonical records for every required
    runner, a fallback over overlapping paths, and any no-go group mislabeled as
    ready for closure.

    GREEN: publish `.planning/evidence/phase43-coverage-feasibility.json` with one
    verdict per source group, canonical denominator/source-contract/policy
    digests, runner ownership, raw-report provenance, representative non-zero
    samples, and the classified source diff from the planning baseline. The
    fallback policy is fixed: first consolidate a group onto one truthful
    Node-compatible runner; otherwise partition evidence only across disjoint
    source paths and compute metrics from exact counters. If neither route is
    truthful, emit no-go and stop the graph before Plan 11K. No ignore
    directive, threshold reduction, metric average, or silent denominator change
    is a fallback. Bind the evidence to the resulting current source contract
    and reviewed runner-classification diff while retaining the committed Plan
    11D source-contract digest as explicit lineage.
  </action>
  <acceptance_criteria>
    - every source group has an evidence-backed feasible or no-go verdict.
    - every feasible group has non-zero canonical records from each required runner.
    - denominator, source-contract, policy, and classified-diff digests are explicit.
    - feasibility evidence identifies both the Plan 11D base contract digest and the current post-classification contract digest.
    - the runner cannot authorize later closure when any group is no-go.
    - the `coverage-foundation` group is at least 95% in every metric.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/run-four-metric-coverage.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --feasibility</automated>
    <automated>bun run test:coverage:four-metric -- --scope coverage-foundation</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Merged coverage can be numerically green while omitting subprocesses, duplicating
junction aliases, averaging incompatible metrics, or hiding cleanup failures.
Exact source ownership, raw non-zero samples, disjoint fallback paths, and
machine-readable no-go verdicts prevent later plans from building on false data.
</threat_model>

<verification>
- `bun run test -- tests/run-four-metric-coverage.test.js tests/production-source-contract.test.js`
- `bun run test:coverage:four-metric -- --representative`
- `bun run test:coverage:four-metric -- --feasibility`
- `bun run test:coverage:four-metric -- --scope coverage-foundation`
- `git diff --check`
</verification>
