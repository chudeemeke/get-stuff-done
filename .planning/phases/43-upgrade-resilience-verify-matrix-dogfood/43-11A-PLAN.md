---
phase: 43
plan: "11A"
type: execute
gap_closure: true
wave: 11
depends_on: ["43-10"]
status: complete
requirements: ["UPGRADE-02", "UPGRADE-04"]
files_modified:
  - tests/upstream-compat-contract.json
  - .planning/vetted-upstream-versions.json
  - scripts/lib/owned-temp.js
  - scripts/run-upstream-compat.js
  - scripts/run-compat-matrix.js
  - scripts/run-upstream-compat-ci.js
  - scripts/vetted-upstream-versions.js
  - tests/run-upstream-compat.test.js
  - tests/run-upstream-compat-ci.test.js
  - tests/owned-temp.test.js
  - tests/vetted-upstream-versions.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11A-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "every root compatibility suite is explicitly classified"
    - "an unclassified, missing, duplicated, or invalid suite fails the contract before execution"
    - "candidate suites run independently and report actionable per-suite evidence"
    - "matrix policy remains blocking only for the reviewed current pin"
  artifacts:
    - "tests/upstream-compat-contract.json"
    - "scripts/run-upstream-compat.js"
    - "scripts/run-compat-matrix.js"
    - "43-11A-SUMMARY.md"
  key_links:
    - "tests/upstream-compat-contract.json -> scripts/run-upstream-compat.js -> per-suite execution policy"
    - "scripts/run-upstream-compat.js -> scripts/run-compat-matrix.js -> version evidence rows"
    - "scripts/lib/owned-temp.js -> compatibility runners -> marked temp cleanup"
---

<objective>
Replace the hardcoded compatibility exclusion set and opaque aggregate runner
with a fail-closed suite registry and per-suite diagnostics.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
@scripts/run-upstream-compat.js
@scripts/run-compat-matrix.js
@scripts/run-upstream-compat-ci.js
@tests/run-upstream-compat.test.js
@tests/run-upstream-compat-ci.test.js
</context>

<tasks>

<task id="11A-01" type="auto">
  <name>Define the classified suite contract</name>
  <files>tests/upstream-compat-contract.json; tests/run-upstream-compat.test.js; scripts/run-upstream-compat.js</files>
  <read_first>
    - tests/*.test.cjs
    - scripts/run-upstream-compat.js
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
  </read_first>
  <action>
    RED: add focused tests proving contract validation rejects an unclassified discovered suite, a registry entry whose file is missing, duplicate paths, unknown suite/authority classifications, direct upstream-internal imports without evidence and a bump-review trigger, and non-candidate entries without rationale, owner, and review/removal trigger. Prove the current 13 root `*.test.cjs` files are all classified.

    GREEN: add `tests/upstream-compat-contract.json` with `candidate`, `repository`, and `retired` suite classifications plus `black-box`, `upstream-internal-observed`, and `fork-runtime` authority-boundary classifications. Candidate suites form one common minimum composed-package contract across `1.5.0`, `1.6.0`, and `1.6.1`; version metadata may explain equivalent outputs but cannot skip a suite. Classify every direct `bin/lib/*` dependency as `upstream-internal-observed` with exact evidence, rationale, and bump-review trigger. Classify `sync.test.cjs` as repository-only, owned by get-stuff-done maintainers, with the exact trigger "port when the sync helper can consume the composed Open GSD package or retire when that source-only helper is removed"; keep it in a separate required gate. Classify `core.test.cjs` as retired with canonical replacement modules and a removal trigger. Replace `EXCLUDED_TESTS` with a small registry loader and validator. Keep filesystem discovery separate from policy validation and allow tests to inject registry/tests paths.

    REFACTOR: keep parsing, validation, and discovery as focused exported helpers. Do not embed version policy or process execution in the registry loader.
  </action>
  <acceptance_criteria>
    - all 13 root `tests/*.test.cjs` files have exactly one registry entry.
    - adding an unclassified fixture makes validation fail before any suite runs.
    - every repository/retired entry contains rationale, owner, and trigger metadata.
    - every upstream-internal-observed entry contains exact authority evidence and a bump-review trigger.
    - no per-version metadata can skip a candidate suite or weaken the common product contract.
    - no hardcoded `EXCLUDED_TESTS` set remains.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/run-upstream-compat.test.js</automated>
  </verify>
  <done>true</done>
</task>

<task id="11A-02" type="auto">
  <name>Run and report candidate suites independently</name>
  <files>scripts/lib/owned-temp.js; scripts/run-upstream-compat.js; tests/owned-temp.test.js; tests/run-upstream-compat.test.js</files>
  <read_first>
    - scripts/run-upstream-compat.js
    - tests/run-upstream-compat.test.js
    - tests/helpers/subprocess-with-timeout.js
    - scripts/run-compat-matrix.js
  </read_first>
  <action>
    RED: add one vertical-slice test for a mixed two-suite run. Assert each suite record carries path, classification, authority boundary, status, passed, failed, skipped, durationMs, exitCode, and bounded error/failure evidence; assert aggregate counts and `ok` derive from suite records. Add timeout and spawn-error cases without launching real candidate tests. Add cleanup-helper tests proving creation writes an ownership marker, dry-run reports without deleting, marked OS-temp children are removable, and repository/worktree roots, `dist`, `node_modules`, unmarked/lookalike paths, and symlink/junction escapes are rejected.

    GREEN: add `scripts/lib/owned-temp.js` as the single temp lifecycle port for compatibility runners. It creates a marker containing tool owner and canonical path, resolves real paths before deletion, requires containment in the injected OS-temp root, rejects protected roots and reparse escapes, and supports dry-run/report mode. Stage the candidate root and helpers once, then execute each candidate suite in its own `node --test` subprocess. Inject the subprocess runner, clock, tests directory, registry path, temp lifecycle, and protected roots. Preserve the existing cross-platform timeout policy. Return `suites[]` plus aggregate fields; keep failure excerpts bounded so CI reports cannot grow without limit.

    REFACTOR: isolate owned-temp lifecycle, staging, single-suite execution, TAP parsing, and aggregation. The public runner remains a deep module with a small options/result contract; no caller invokes recursive deletion directly.
  </action>
  <acceptance_criteria>
    - one failed suite does not prevent later candidate suites from running.
    - aggregate counts equal the sum of candidate suite records.
    - repository/retired entries appear as classified exclusions but are never launched.
    - temp links and directories are removed on success, assertion failure, timeout, and spawn error.
    - cleanup fails closed for an unmarked path, protected project root, or resolved path outside the injected temp root.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/run-upstream-compat.test.js</automated>
    <automated>bun test tests/owned-temp.test.js</automated>
  </verify>
  <done>true</done>
</task>

<task id="11A-03" type="auto">
  <name>Propagate suite evidence through matrix and CI reports</name>
  <files>scripts/run-compat-matrix.js; scripts/run-upstream-compat-ci.js; tests/run-upstream-compat-ci.test.js</files>
  <read_first>
    - scripts/run-compat-matrix.js
    - scripts/run-upstream-compat-ci.js
    - tests/run-upstream-compat-ci.test.js
    - .github/workflows/compat-matrix.yml
  </read_first>
  <action>
    RED: extend matrix and CI-wrapper tests to require per-suite records in JSON and a concise suite table in text/GitHub summary output. Prove a current-pin failure controls default process exit, while any red historical row is retained as failed evidence and cannot receive or retain a `vettedAt` value. Add `--require-all` tests proving the closeout mode exits non-zero when any row is red even if the current pin is green.

    GREEN: carry `suites[]` and authority-boundary metadata through `classifyResult()` and matrix report serialization, bump the report schema version when the shape changes, and render bounded failed-suite diagnostics in text and step summaries. Keep execution policy explicit: the current pin controls the default command exit status, the legacy upstream-compat CI wrapper remains informational, `--require-all` is the closeout-only all-row gate, and the manifest evidence writer refuses to retain any red row as vetted.

    REFACTOR: share result formatting data, not policy branches. Matrix classification stays owned by `run-compat-matrix.js`; suite execution stays owned by `run-upstream-compat.js`.
  </action>
  <acceptance_criteria>
    - matrix JSON identifies the exact failing suite for each candidate version.
    - the current manifest entry still controls blocking exit status.
    - `--require-all` exits non-zero unless all three rows and all candidate suites are green.
    - CI summary output is concise and does not dump unbounded TAP output.
    - the focused Bun run is green; Plan 43-11D independently establishes SHIP-08A's four fork-authored coverage metrics and SHIP-08B's shipped-snapshot contract before closeout.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js</automated>
    <automated>bun test --coverage tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js</automated>
    <automated>bun run lint -- scripts/lib/owned-temp.js scripts/run-upstream-compat.js scripts/run-compat-matrix.js scripts/run-upstream-compat-ci.js tests/owned-temp.test.js tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js</automated>
  </verify>
  <done>true</done>
</task>

</tasks>

<threat_model>
An incomplete registry could turn a removed exclusion into silent loss of
coverage. Fail closed by reconciling discovered and registered files before
staging. Per-suite evidence may leak temp paths or become unbounded; normalize
paths to suite basenames and cap failure excerpts. Candidate code is untrusted
test input, so retain temp isolation, explicit timeouts, and deterministic
cleanup.
</threat_model>

<verification>
Run:
- `bun test tests/owned-temp.test.js tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js`
- `node --check scripts/run-upstream-compat.js`
- `node --check scripts/run-compat-matrix.js`
- `node --check scripts/run-upstream-compat-ci.js`
- `git diff --check`
</verification>
