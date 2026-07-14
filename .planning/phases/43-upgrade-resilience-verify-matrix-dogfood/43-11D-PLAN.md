---
phase: 43
plan: "11D"
type: execute
gap_closure: true
wave: 17
depends_on: ["11N"]
status: pending
requirements: ["SHIP-08A", "SHIP-08B"]
files_modified:
  - package.json
  - bun.lock
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - jest.coverage.config.cjs
  - scripts/lib/production-source-contract.js
  - scripts/run-four-metric-coverage.js
  - tests/helpers/jest-bun-test-adapter.cjs
  - tests/production-source-contract.test.js
  - tests/run-four-metric-coverage.test.js
  - .planning/evidence/phase43-coverage-feasibility.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Bun remains the primary functional authority through the Plan 11M adapter"
    - "Jest executes the explicit live Bun-authority CommonJS suite set under Node"
    - "native Node subprocess records merge into four real c8 metrics"
    - "every tracked executable path has one explicit ownership classification"
    - "coverage groups are exhaustive and disjoint over the canonical fork source set"
    - "every source group has a machine-readable truthful-coverage feasibility verdict before closure work starts"
    - "denominator changes are explicit reviewed diffs rather than silent reclassification"
    - "shipped upstream snapshots remain blocking through a separate assurance contract"
  artifacts:
    - "config/production-source-contract.json"
    - "jest.coverage.config.cjs"
    - "scripts/run-four-metric-coverage.js"
    - "tests/helpers/jest-bun-test-adapter.cjs"
    - ".planning/evidence/phase43-coverage-feasibility.json"
    - "43-11D-SUMMARY.md"
  key_links:
    - "bun:test imports -> Jest moduleNameMapper -> jest-bun-test-adapter.cjs"
    - "Jest and Node subprocesses -> NODE_V8_COVERAGE -> c8 aggregate"
    - "production source contract -> exact c8 source set -> canonical digest"
---

<objective>
Establish the truthful four-metric runner and exact source-ownership contract
without attempting broad threshold closure in one plan.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11C-PLAN.md
@docs/decisions/004-DUAL-TEST-AUTHORITY.md
@package.json
@bunfig.toml
@tests/helpers.cjs
</context>

<tasks>

<task id="11D-01" type="auto">
  <name>Build the source contract and multi-process coverage port</name>
  <files>package.json; bun.lock; config/production-source-contract.json; config/phase43-closeout-policy.json; jest.coverage.config.cjs; scripts/lib/production-source-contract.js; scripts/run-four-metric-coverage.js; tests/helpers/jest-bun-test-adapter.cjs; tests/production-source-contract.test.js; tests/run-four-metric-coverage.test.js</files>
  <read_first>
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
    - package.json
    - bunfig.toml
    - tests/helpers.cjs
    - scripts/lib/owned-temp.js
  </read_first>
  <action>
    RED: add contract fixtures that reject an unclassified tracked JavaScript
    path, duplicate classification, missing path, unknown class, non-identical
    mirror, executable config exclusion, or an upstream snapshot missing exact
    provenance, named delta tests, owner, removal trigger, drift gate, and N=3
    evidence binding. Add coverage-group fixtures that reject a canonical path
    assigned to zero or multiple groups and a newly tracked executable path not
    assigned to exactly one group. Test the canonical UTF-8 path/file digest
    algorithm. Add runner fixtures proving failure on a Bun/Jest/Node command
    red, a missing raw report, any metric below 95, source drift, path escape,
    reparse escape, and cleanup failure. Add a permanent Windows junction
    fixture where a child Node process emits V8 records through the junction;
    require one non-zero canonical source entry, no junction alias, and no
    duplicate or zero-valued canonical path. Use a portable symlink equivalent
    where supported, but keep the Windows junction case mandatory in Windows CI.
    Add fixtures that reject metric averaging, overlapping runner ownership,
    an unexplained denominator removal/reclassification, validator-policy drift,
    and a source group marked feasible without non-zero canonical records for
    every runner it requires.

    GREEN: exact-pin `jest@30.4.2` and `c8@11.0.0`. Add the ownership classes
    from `43-COVERAGE-SPIKE.md`, record 52 files only as the planning-time
    baseline, and resolve the live tracked set after Plans 11C and 11L; their
    reviewed fork source and every future tracked script fail closed unless
    classified.
    Resolve all coverage groups before any scoped run and
    require them to form an exhaustive, disjoint partition of the canonical
    `fork-source` set. SHIP-08A owns that measured set; SHIP-08B owns every
    shipped upstream snapshot and cannot be inferred from SHIP-08A metrics.
    Add `tests/helpers/jest-bun-test-adapter.cjs` and map
    `bun:test` plus root `./helpers` only in `jest.coverage.config.cjs`. Preserve
    timeout option objects, `skipIf`, diagnostic `expect`, and `toStartWith`.
    Derive an explicit live Jest input set from ADR 004's Bun-authority
    partition; never derive it from Bun runtime discovery. Do not edit existing
    functional test files merely to make the secondary runner pass.

    Add a pure source resolver and a launcher that creates one marker-owned
    OS-temp root, runs the canonical Bun adapter first, the explicit live Jest
    set second, and the policy's
    required `node:test` suites third with one `NODE_V8_COVERAGE` directory.
    Invoke c8 with its source root derived by `fs.realpathSync(PROJECT_ROOT)`,
    `--allowExternal`, exact contract paths, four independent thresholds, and
    no ignore comments or auto-update behavior. Canonicalize evidence paths
    back to repository-relative POSIX form. Expose
    `--validate-source-contract` as a no-measurement, fail-closed reconciliation
    mode for later plans that move or add executable paths. Always clean through
    the owned-temp port in `finally`.

    Count Node-contract raw records only for canonical production paths assigned
    to Node by the source contract; test files never enter the production
    denominator. Publish `.planning/evidence/phase43-coverage-feasibility.json` with one
    verdict per source group, the canonical denominator digest, runner ownership,
    raw-report provenance, and the classified source diff from the planning
    baseline. The fallback policy is fixed: first consolidate a group onto one
    truthful Node-compatible coverage runner; otherwise partition evidence only
    across disjoint source paths and compute metrics from exact counters, never
    averages. If neither route is truthful, fail Plan 11D and replan before 11E.
    No ignore directive, threshold reduction, or silent denominator change is a
    fallback. Persist the source-contract schema/digest as the semantic contract
    that Plan 11J must consume unchanged.

    REFACTOR: keep runner adaptation test-only, source classification pure, and
    process/temp orchestration behind injected ports. Production code never
    imports Jest or c8.
  </action>
  <acceptance_criteria>
    - every live Bun-authority suite selected by the explicit partition passes under Jest and every required Node suite passes.
    - `bun run test` remains the primary functional command and is green.
    - Jest and Node inputs are explicit contracts rather than Bun discovery output.
    - a synthetic uncovered branch fails only the relevant threshold.
    - every tracked executable JavaScript path is classified exactly once.
    - `--validate-source-contract` exits zero only for an exhaustive classification and group partition of the live set.
    - every canonical fork path is assigned to exactly one coverage group before any scoped or aggregate command runs.
    - a synthetic new executable path, group gap, and group overlap each fail closed.
    - every source group has an evidence-backed feasible/no-go verdict before Plan 11E can start.
    - denominator additions, removals, and reclassifications are emitted as a reviewed machine-readable diff.
    - runner fallback uses exact counters over one runner or disjoint source partitions; metric averaging fails closed.
    - the validator contract digest is persisted for an identity check before Plan 11J.
    - byte-identical mirrors are counted once and fail closed on drift.
    - every shipped upstream snapshot satisfies the separate SHIP-08B provenance/drift/delta/N=3 contract; the runner never labels SHIP-08A as whole-production coverage.
    - the Windows junction fixture records one non-zero canonical path with no alias or duplicate.
    - raw coverage and reports are absent after success and every tested failure path.
    - the new `coverage-foundation` source group is >=95% in all four metrics.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/production-source-contract.test.js tests/run-four-metric-coverage.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --representative</automated>
    <automated>bun run test:coverage:four-metric -- --feasibility</automated>
    <automated>bun run test:coverage:four-metric -- --scope coverage-foundation</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A secondary runner can create false confidence if it passes tests but misses
native CommonJS or child processes. Native Node records, an exact source
contract, threshold fixtures, and raw-report cleanup make that failure visible.
Junction realpaths must never create duplicate zero-coverage aliases; a
permanent Windows fixture proves this instead of leaving it as prose. Upstream
snapshots may remain outside SHIP-08A only because SHIP-08B independently
blocks on exact provenance, drift, named delta tests, ownership/removal, and N=3
evidence. The umbrella cannot pass from coverage alone.
Coverage feasibility is an explicit Plan 11D product: if counters cannot be
merged or partitioned truthfully, later closure plans do not begin.
</threat_model>

<verification>
Run:
- `bun run test -- tests/production-source-contract.test.js tests/run-four-metric-coverage.test.js`
- `bun run test:coverage:four-metric -- --functional-only`
- `git diff --check`
</verification>
