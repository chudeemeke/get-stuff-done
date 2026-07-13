---
phase: 43
plan: "11B"
type: execute
gap_closure: true
wave: 12
depends_on: ["11A"]
status: complete
completed: 2026-07-13
requirements: ["UPGRADE-04", "UPGRADE-05", "SHIP-08B"]
files_modified:
  - tests/helpers/capture-command-output.cjs
  - tests/helpers/compat-package-root.cjs
  - tests/helpers.cjs
  - tests/config.test.cjs
  - tests/frontmatter.test.cjs
  - tests/template.test.cjs
  - tests/phase.test.cjs
  - tests/runtime-overrides.test.cjs
  - tests/upstream-compat-contract.json
  - scripts/run-upstream-compat.js
  - tests/run-upstream-compat.test.js
  - tests/run-compat-transition.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11B-BLOCKER.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11B-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "compatibility tests assert supported Open GSD behavior instead of retired implementation details"
    - "success may return without process.exit while error paths remain non-zero"
    - "strict canonical config keys are preserved and invalid keys are rejected"
    - "fork runtime override regressions execute against the composed candidate package"
  artifacts:
    - "tests/helpers/capture-command-output.cjs"
    - "tests/phase.test.cjs"
    - "tests/runtime-overrides.test.cjs"
    - "43-11B-SUMMARY.md"
  key_links:
    - "tests/helpers/capture-command-output.cjs -> command suites -> observable exit/output contract"
    - "tests/upstream-compat-contract.json -> phase/runtime suites -> explicit authority boundaries"
    - "GSD_COMPAT_PACKAGE_ROOT -> tests/runtime-overrides.test.cjs -> composed candidate runtime"
---

<objective>
Modernize stale compatibility expectations to the supported Open GSD contract
and bring fork runtime override regressions inside each candidate run.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11A-PLAN.md
@tests/config.test.cjs
@tests/frontmatter.test.cjs
@tests/template.test.cjs
@tests/phase.test.cjs
@tests/runtime-overrides.test.cjs
@node_modules/@opengsd/gsd-core/gsd-core/bin/lib/io.cjs
@node_modules/@opengsd/gsd-core/gsd-core/bin/lib/config.cjs
@node_modules/@opengsd/gsd-core/gsd-core/bin/lib/phase-id.cjs
</context>

<tasks>

<task id="11B-01" type="auto">
  <name>Capture command output across old and current success semantics</name>
  <files>tests/helpers/capture-command-output.cjs; tests/config.test.cjs; tests/frontmatter.test.cjs; tests/template.test.cjs</files>
  <read_first>
    - tests/config.test.cjs
    - tests/frontmatter.test.cjs
    - tests/template.test.cjs
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/io.cjs
  </read_first>
  <action>
    RED: add tests for a reusable boundary helper that captures stdout/stderr and normalizes both supported success shapes: explicit `process.exit(0)` and natural return. Prove non-zero exits unwind immediately instead of allowing command code to continue after an error.

    GREEN: create `tests/helpers/capture-command-output.cjs` with an internal exit sentinel and guaranteed restoration of process globals. Return normalized exit code, raw exit observation, stdout, and stderr. Replace the duplicated no-op exit mocks in config, frontmatter, and template suites. Keep assertions on observable output/files; remove assertions whose only purpose was requiring success to call `process.exit(0)`.

    REFACTOR: keep the helper test-only and boundary-focused. Do not change Open GSD `io.cjs`, restore success exits, or mock internal command collaborators.
  </action>
  <acceptance_criteria>
    - success assertions pass whether the command explicitly exits 0 or returns naturally.
    - error-path tests prove execution stops at the non-zero exit boundary.
    - process stdout, stderr, and exit functions are restored after thrown assertions.
    - no production runtime file changes for this task.
  </acceptance_criteria>
  <verify>
    <automated>node --test tests/config.test.cjs tests/frontmatter.test.cjs tests/template.test.cjs</automated>
  </verify>
  <done>true</done>
</task>

<task id="11B-02" type="auto">
  <name>Adopt strict config and CRLF parsing contracts</name>
  <files>tests/config.test.cjs; tests/frontmatter.test.cjs</files>
  <read_first>
    - tests/config.test.cjs
    - tests/frontmatter.test.cjs
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/config-schema.cjs
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/config.cjs
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/frontmatter.cjs
  </read_first>
  <action>
    RED: add precise assertions that an unknown config key exits non-zero without mutating the config file, an invalid canonical enum is rejected without mutation, and a pure-CRLF frontmatter document parses to the expected object. Run only those assertions and record the expected behavioral failures before changing existing expectations.

    GREEN: replace arbitrary config keys (`max_retries`, top-level legacy `branching_strategy`, `a.b.c`, `newkey`, and `model_profile.sub`) with canonical keys or `features.<feature>` where the behavior under test is value parsing/nesting. Add explicit unknown-key and invalid-enum rejection cases, and assert malformed config is not mutated after an error. Update the CRLF frontmatter assertion to the supported parse result while preserving all fork-specific regression assertions.

    REFACTOR: derive valid test keys from the exported config schema where practical so another schema migration creates a focused contract failure instead of scattered magic strings.
  </action>
  <acceptance_criteria>
    - config tests no longer require permissive arbitrary-key writes.
    - unknown keys and invalid canonical values fail without mutating config.
    - pure CRLF frontmatter parses correctly.
    - focused config and frontmatter suites pass against composed Open GSD `1.6.1`.
  </acceptance_criteria>
  <verify>
    <automated>node --test tests/config.test.cjs tests/frontmatter.test.cjs</automated>
  </verify>
  <done>true</done>
</task>

<task id="11B-03" type="auto">
  <name>Use canonical phase modules and candidate runtime paths</name>
  <files>tests/phase.test.cjs; tests/runtime-overrides.test.cjs; scripts/run-upstream-compat.js; tests/upstream-compat-contract.json</files>
  <read_first>
    - tests/phase.test.cjs
    - tests/runtime-overrides.test.cjs
    - scripts/run-upstream-compat.js
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/phase-id.cjs
  </read_first>
  <action>
    RED: add a runner test proving candidate subprocesses receive an explicit candidate package root, and prove a candidate run fails when that root is absent or lacks `bin/gsd-tools.cjs`. Add a runtime override test that resolves tools from that root and fails if it falls back to repo `dist/` during a candidate run.

    GREEN: import `comparePhaseNum` and `normalizePhaseName` from `bin/lib/phase-id.cjs` in the phase suite and classify that exact-pin dependency as `upstream-internal-observed`, with upstream source evidence and a review-on-every-bump trigger. Parameterize `runtime-overrides.test.cjs` through `GSD_COMPAT_PACKAGE_ROOT`, retaining repo `dist/gsd-core` only as the direct full-suite fallback. Set that environment variable per candidate subprocess and classify runtime overrides as `candidate` plus `fork-runtime`. Run the full phase suite after the import change and treat any newly exposed failure by behavior, not by restoring `core.cjs`.

    REFACTOR: keep candidate-path resolution in one helper and fail with an actionable path message when the expected `bin/gsd-tools.cjs` is absent.
  </action>
  <acceptance_criteria>
    - `phase.test.cjs` contains no import of `bin/lib/core.cjs`.
    - candidate runtime tests cannot read repo-root `dist/` accidentally.
    - all three fork runtime override regressions run for the active candidate.
    - no `core.cjs` facade is introduced in source, overlay, override, or dist input.
  </acceptance_criteria>
  <verify>
    <automated>node --test tests/phase.test.cjs tests/runtime-overrides.test.cjs</automated>
    <automated>rg -n "phase-id.cjs|GSD_COMPAT_PACKAGE_ROOT" tests/phase.test.cjs tests/runtime-overrides.test.cjs scripts/run-upstream-compat.js</automated>
    <automated>node -e "const fs=require('node:fs'); const roots=['tests/phase.test.cjs','overlay','overrides']; const walk=(p)=&gt;fs.statSync(p).isDirectory()?fs.readdirSync(p).flatMap((n)=&gt;walk(require('node:path').join(p,n))):[p]; const hits=roots.flatMap(walk).filter((p)=&gt;fs.readFileSync(p,'utf8').includes('bin/lib/core.cjs')); if(hits.length){console.error(hits.join('\n'));process.exit(1)}"</automated>
  </verify>
  <done>true</done>
</task>

<task id="11B-04" type="auto">
  <name>Prove the modernized active-pin contract</name>
  <files>tests/run-compat-transition.test.js; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11B-BLOCKER.md (failure only)</files>
  <read_first>
    - tests/upstream-compat-contract.json
    - scripts/run-upstream-compat.js
    - .planning/vetted-upstream-versions.json
  </read_first>
  <action>
    RED: add one transitional integration test that spawns the active `1.6.1`
    matrix row into marker-owned temp storage. It must observe process exit `1`
    and assert the emitted report contains exactly one failed suite,
    `roadmap.test.cjs`, with every other suite green. Any zero exit, missing
    report, extra failure, or different failure keeps the test red.

    GREEN is intentionally deferred to Plan 43-11C: run each changed candidate
    suite directly, run repository-only `sync.test.cjs`, compose the current
    fork, then run the transitional assertion. This plan's verification command
    exits zero only when the expected-red shape is exact; do not use shell
    negation or treat an arbitrary non-zero matrix as success. If an unexpected
    failure remains, stop Plan 11B, keep `43-11B-SUMMARY.md` absent, and create
    `43-11B-BLOCKER.md` naming the exact suite, behavior, evidence, owner, and
    separately reviewed task. Plan 43-11C removes the transitional test after
    the real active matrix exits zero.
  </action>
  <acceptance_criteria>
    - config, frontmatter, template, phase, and runtime-overrides candidate suites pass on `1.6.1`.
    - `sync.test.cjs` passes as the separately required repository gate.
    - the transitional wrapper exits 0 only when raw matrix exit is 1 and `roadmap.test.cjs` is the sole failed suite.
    - no unexpected active-pin failure remains; otherwise this plan stops failed closed with no summary.
    - Plan 43-11D remains the blocking SHIP-08A fork-authored coverage foundation and SHIP-08B snapshot-contract owner.
  </acceptance_criteria>
  <verify>
    <automated>bun run compose</automated>
    <automated>node --test tests/config.test.cjs tests/frontmatter.test.cjs tests/template.test.cjs tests/phase.test.cjs tests/runtime-overrides.test.cjs</automated>
    <automated>node --test tests/sync.test.cjs</automated>
    <automated>bun test tests/run-compat-transition.test.js</automated>
    <automated>bun test tests/run-upstream-compat.test.js</automated>
  </verify>
  <done>true</done>
</task>

</tasks>

<threat_model>
Changing tests can manufacture green evidence. Every change must point to an
observable Open GSD behavior or an explicitly classified exact-pin internal
dependency, and Task 11B-04 cannot edit tests. Real fork regressions remain
red. Process-global capture can pollute later tests;
use a sentinel and `finally` restoration. Candidate runtime tests must never
fall back silently to repo artifacts.
</threat_model>

<verification>
Run:
- `node --test tests/config.test.cjs tests/frontmatter.test.cjs tests/template.test.cjs tests/phase.test.cjs tests/runtime-overrides.test.cjs`
- `node --test tests/sync.test.cjs`
- `bun test tests/run-upstream-compat.test.js`
- `bun test tests/run-compat-transition.test.js`
- `git diff --check`
</verification>
