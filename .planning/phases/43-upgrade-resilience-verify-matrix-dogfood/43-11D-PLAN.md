---
phase: 43
plan: "11D"
type: execute
gap_closure: true
wave: 14
depends_on: ["11C"]
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
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Bun remains the primary functional authority"
    - "Jest executes all 48 unchanged root CommonJS suites under Node"
    - "native Node subprocess records merge into four real c8 metrics"
    - "every tracked executable path has one explicit ownership classification"
    - "coverage groups are exhaustive and disjoint over the canonical fork source set"
    - "shipped upstream snapshots remain blocking through a separate assurance contract"
  artifacts:
    - "config/production-source-contract.json"
    - "jest.coverage.config.cjs"
    - "scripts/run-four-metric-coverage.js"
    - "tests/helpers/jest-bun-test-adapter.cjs"
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

    GREEN: exact-pin `jest@30.4.2` and `c8@11.0.0`. Add the ownership classes
    from `43-COVERAGE-SPIKE.md`, record 52 files only as the planning-time
    baseline, and resolve the live tracked set after Plan 11C; its roadmap
    adapter and every future tracked script fail closed unless classified.
    Resolve all coverage groups before any scoped run and
    require them to form an exhaustive, disjoint partition of the canonical
    `fork-source` set. SHIP-08A owns that measured set; SHIP-08B owns every
    shipped upstream snapshot and cannot be inferred from SHIP-08A metrics.
    Add `tests/helpers/jest-bun-test-adapter.cjs` and map
    `bun:test` plus root `./helpers` only in `jest.coverage.config.cjs`. Preserve
    timeout option objects, `skipIf`, diagnostic `expect`, and `toStartWith`.
    Do not edit the 48 test files.

    Add a pure source resolver and a launcher that creates one marker-owned
    OS-temp root, runs Bun first, all 48 Jest files second, and the policy's
    required `node:test` suites third with one `NODE_V8_COVERAGE` directory.
    Invoke c8 with its source root derived by `fs.realpathSync(PROJECT_ROOT)`,
    `--allowExternal`, exact contract paths, four independent thresholds, and
    no ignore comments or auto-update behavior. Canonicalize evidence paths
    back to repository-relative POSIX form. Expose
    `--validate-source-contract` as a no-measurement, fail-closed reconciliation
    mode for later plans that move or add executable paths. Always clean through
    the owned-temp port in `finally`.

    REFACTOR: keep runner adaptation test-only, source classification pure, and
    process/temp orchestration behind injected ports. Production code never
    imports Jest or c8.
  </action>
  <acceptance_criteria>
    - all 48 unchanged root files pass under Jest and all required Node suites pass.
    - the primary Bun command remains unchanged and green.
    - a synthetic uncovered branch fails only the relevant threshold.
    - every tracked executable JavaScript path is classified exactly once.
    - `--validate-source-contract` exits zero only for an exhaustive classification and group partition of the live set.
    - every canonical fork path is assigned to exactly one coverage group before any scoped or aggregate command runs.
    - a synthetic new executable path, group gap, and group overlap each fail closed.
    - byte-identical mirrors are counted once and fail closed on drift.
    - every shipped upstream snapshot satisfies the separate SHIP-08B provenance/drift/delta/N=3 contract; the runner never labels SHIP-08A as whole-production coverage.
    - the Windows junction fixture records one non-zero canonical path with no alias or duplicate.
    - raw coverage and reports are absent after success and every tested failure path.
    - the new `coverage-foundation` source group is >=95% in all four metrics.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/production-source-contract.test.js tests/run-four-metric-coverage.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --representative</automated>
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
</threat_model>

<verification>
Run:
- `bun test tests/production-source-contract.test.js tests/run-four-metric-coverage.test.js`
- `bun run test:coverage:four-metric -- --functional-only`
- `git diff --check`
</verification>
