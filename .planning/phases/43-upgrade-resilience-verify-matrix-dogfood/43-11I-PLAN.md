---
phase: 43
plan: "11I"
type: execute
gap_closure: true
wave: 20
depends_on: ["11H"]
status: pending
requirements: ["UPGRADE-07", "SHIP-08A"]
files_modified:
  - overlay/hooks/pre-compact.js
  - overlay/lib/sync.cjs
  - overrides/hooks/gsd-check-update.js
  - overrides/hooks/gsd-check-update-worker.js
  - overrides/hooks/gsd-statusline.js
  - tests/hooks.test.js
  - tests/sync.test.cjs
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11I-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "fork hooks and sync reach 95% in all four metrics"
    - "hook subprocess tests contribute native Node coverage"
    - "fork package identity, role routing, cache, throttles, and roadmap behavior remain intact"
  artifacts:
    - "43-11I-SUMMARY.md"
  key_links:
    - "hook subprocesses -> NODE_V8_COVERAGE -> hook source metrics"
    - "node:test sync suite -> overlay/lib/sync.cjs -> sync metrics"
---

<objective>
Close the hook and sync behavior cluster using real subprocess/native coverage
while preserving the fork-specific contracts reconciled in Plans 06-07.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@tests/hooks.test.js
@tests/sync.test.cjs
@hooks/index.js
</context>

<tasks>

<task id="11I-01" type="auto">
  <name>Close update, worker, statusline, and pre-compact coverage</name>
  <files>overrides/hooks/gsd-check-update.js; overrides/hooks/gsd-check-update-worker.js; overrides/hooks/gsd-statusline.js; overlay/hooks/pre-compact.js; tests/hooks.test.js</files>
  <action>
    Add RED subprocess fixtures for malformed stdin/cache/config/state,
    unavailable package manager/git, stale and fresh throttle boundaries,
    maintainer versus consumer routing, zero/non-zero upstream commits,
    background worker failure, statusline fallback, and pre-compact missing
    inputs. Use temp homes/repos and bounded waits. Preserve package identity,
    4-hour/7-day throttles, shared cache path, and silent-failure contracts.
  </action>
  <acceptance_criteria>
    - the `hooks` group is >=95% statements, branches, functions, and lines.
    - all hook subprocesses exit within bounded evidence-backed timeouts.
    - source and bundled smoke behavior remains green.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/hooks.test.js tests/hooks-manifest.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope hooks</automated>
  </verify>
  <done>false</done>
</task>

<task id="11I-02" type="auto">
  <name>Close sync branch and line coverage</name>
  <files>overlay/lib/sync.cjs; tests/sync.test.cjs</files>
  <action>
    Start from the measured `94.85%` statements/lines, `84.06%` branches, and
    `100%` functions. Add targeted `node:test` cases for remaining git failure,
    malformed manifest, classification, filtering, dependency, checkpoint, and
    output branches. Refactor only pure policy or injected git/filesystem seams.
    Replace the historical repo junction setup with marker-owned temp linkage or
    a dependency-injected module path so Windows cleanup cannot leave a junction.
  </action>
  <acceptance_criteria>
    - `overlay/lib/sync.cjs` is >=95% in all four metrics.
    - all 153 existing sync tests remain green before new tests are counted.
    - the test leaves no `overlay/get-shit-done` junction on success or failure.
  </acceptance_criteria>
  <verify>
    <automated>node --test tests/sync.test.cjs</automated>
    <automated>bun run test:coverage:four-metric -- --scope sync</automated>
    <automated>node -e "const fs=require('node:fs'); if(fs.existsSync('overlay/get-shit-done')) process.exit(1)"</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Hook timing and background processes can create flaky coverage or leave temp
state. Use bounded polling, deterministic clocks where possible, marker-owned
temp roots, and no retries that hide failures. Sync may not leave a repository
junction or consume a live project.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope hooks`
- `bun run test:coverage:four-metric -- --scope sync`
- `bun test tests/hooks.test.js`
- `node --test tests/sync.test.cjs`
- `git diff --check`
</verification>
