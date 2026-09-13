# Phase 41 Plan 06 Summary

## Scope

Plan 06 finished the remaining REL-02 subprocess hardening surface and added the
Windows flake telemetry path required by D-10.

## Changes

- Migrated the remaining Plan 06 test subprocess call sites to the shared
  `runWithTimeout` helper:
  - `tests/check-boundary.test.js`
  - `tests/check-overrides.test.js`
  - `tests/compose.test.js`
  - `tests/preview-update-coverage.test.js`
  - `tests/validate-configs.test.js`
- Migrated two additional real subprocess test sites found by the repo-wide
  inventory:
  - `tests/check-overrides-integration.test.js`
  - `tests/osv-triage.test.js`
- Added `scripts/flake-triage.js` with:
  - JUnit failure parsing into D-10 dedup keys.
  - D-10 flake labels, including `rel-03-candidate` when recent-hit count is
    at least three.
  - REL-03 skip scanning and Markdown summary generation.
  - REL-03 wrapper validation for issue URL and deadline visibility.
- Added `tests/flake-triage.test.js` for the parser, label derivation, summary
  output, wrapper validation, and CLI paths.
- Wired `.github/workflows/ci.yml` so the test matrix emits JUnit XML, uploads
  failure artifacts, builds Windows flake events, upserts deduplicated flake
  issues, appends the Active REL-03 skips summary, and prints the interim
  flake collector scope cap.
- Follow-up CI lint fix: grouped the `$GITHUB_STEP_SUMMARY` appends so the
  Docker actionlint/ShellCheck surface passes `SC2129`.

## Remaining raw subprocess calls

No unclassified real subprocess call sites remain under `tests/**`.

The remaining `rg -n "execSync|spawnSync|exec\(|spawn\(" tests -g "*.js" -g "*.cjs"`
hits are classified:

- `tests/helpers/subprocess-with-timeout.js` -- approved shared subprocess
  wrapper; this is the only real child-process implementation left in tests.
- `tests/helpers/mock-child-process.js` -- mock helper only; it patches a fake
  child-process interface and does not spawn a process.
- `tests/platform-internal.test.js`, `tests/platform.test.js`,
  `tests/state.test.cjs` -- comments describing production/test helper behavior;
  no subprocess execution in those lines.
- `tests/test-path-validation.test.js` -- `RegExp.prototype.exec` loops, not
  child-process execution.

## REL-03 status

There are no active REL-03 skips in source at this point.

`node scripts/flake-triage.js --scan-rel03 --output-summary .planning/audits/rel03-summary-test.md`
exited 0 and wrote a summary beginning `### Active REL-03 skips`. The generated
test summary file was removed after verification.

`node scripts/flake-triage.js --validate-rel03-wrappers` exited 0.

## Verification

- `bun test tests/flake-triage.test.js` -- 6 pass, 0 fail.
- `node --check scripts\flake-triage.js` -- pass.
- `bash scripts\lint-workflows.sh` -- pass.
- Remote Workflow Lint finding `SC2129` was addressed by grouping the summary
  writes; local fallback lint passes, and the PR rerun is the CI authority.
- `rg -n "test-results.xml|flake-events.json|flake-report|flake-platform-windows|rel-03-candidate|Active REL-03 skips|more than 5 flaky files/week" .github\workflows\ci.yml` -- pass.
- `bun test tests\check-boundary.test.js tests\check-overrides.test.js tests\compose.test.js tests\preview-update-coverage.test.js tests\validate-configs.test.js tests\installer-safety.test.js` -- 356 pass, 0 fail.
- `bun test tests\check-overrides-integration.test.js tests\osv-triage.test.js` -- 6 pass, 0 fail.

## D-11

D-11's two-working-day unresolved-flake timebox remains owned by Plan 07 before
Phase 41 closure. Plan 06 creates the collector and REL-03 visibility path; it
does not close the 10x validation gate.
