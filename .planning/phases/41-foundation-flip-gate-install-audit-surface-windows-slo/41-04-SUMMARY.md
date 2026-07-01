# Phase 41 Plan 04 Summary

**Status:** Blocked at real three-platform capture
**Updated:** 2026-07-01T16:35:35+01:00

## Outcome

Plan 04 implemented the local benchmark harness, strict JSON schemas, package commands, local timing smoke path, and manual GitHub Actions capture workflow.

Plan 04 is not complete. `perf-baseline.json` and `.planning/perf/test-timing.json` are intentionally absent because they require real Linux, macOS, and Windows artifacts from a registered `workflow_dispatch` workflow. No placeholder platform numbers were committed.

## Implemented

- `config/perf-baseline.schema.json` validates the future committed install/compose baseline and requires `linux`, `macos`, `windows`, and `acceptedRegressions`.
- `config/test-timing.schema.json` validates the future committed test timing artifact and rejects partial/local-only timing output.
- `scripts/bench.js` captures hyperfine install/compose metrics, uses scratch install directories with `bun install --ignore-scripts`, supports partial platform capture, and merges required platform artifacts.
- `scripts/bench-test-timing.js` captures Bun JUnit timing, supports local partial smoke output, and merges required platform timing artifacts.
- `package.json` now exposes `bun run bench` and `bun run bench:test-timing`.
- `.github/workflows/perf-baseline.yml` is `workflow_dispatch` only, captures `linux`, `macos`, and `windows`, installs hyperfine per runner, pins the macOS runner to `macos-15`, and merges uploaded artifacts.

## Verification

- `bun test tests/perf-baseline-schema.test.js tests/test-timing-schema.test.js`: passed during schema implementation.
- `bun test tests/bench.test.js tests/bench-test-timing.test.js`: passed during script implementation.
- `bun test tests/perf-baseline-schema.test.js tests/test-timing-schema.test.js tests/bench.test.js tests/bench-test-timing.test.js`: 16 pass after workflow implementation.
- `node scripts/bench.js --help`: passed.
- `node scripts/bench-test-timing.js --help`: passed.
- `bun run bench:test-timing -- --platform local --runs 1 --out .planning/perf/test-timing.local.json`: passed and wrote a partial local artifact.
- `node scripts/bench-test-timing.js --merge .planning/perf --require-platforms linux,macos,windows --out .planning/perf/test-timing.json`: failed as expected when required platform artifacts were missing.
- `node scripts/bench.js --merge .planning/perf --require-platforms linux,macos,windows --out perf-baseline.json`: failed as expected when required platform artifacts were missing.
- `bash scripts/lint-workflows.sh`: passed.

The temporary local timing artifact was removed after smoke verification. `perf-baseline.json`, `.planning/perf/test-timing.json`, and `.planning/perf/test-timing.local.json` do not exist in the worktree.

## Benchmark Sources

| Platform | Source | Status |
| --- | --- | --- |
| linux | `perf-linux.json` and `test-timing-linux.json` from `.github/workflows/perf-baseline.yml` | Missing; workflow not registered on `origin/main` yet |
| macos | `perf-macos.json` and `test-timing-macos.json` from `.github/workflows/perf-baseline.yml` on `macos-15` | Missing; workflow not registered on `origin/main` yet |
| windows | `perf-windows.json` and `test-timing-windows.json` from `.github/workflows/perf-baseline.yml` | Missing; workflow not registered on `origin/main` yet |

Workflow run URL: none. The manual workflow exists in commit `6454a4345a933c0d75b4dc58e7ba9356b850d58d`, but it has not been registered on `origin/main`.

Hyperfine runner status:

- linux: not observed yet.
- macos: not observed yet.
- windows: not observed yet.

## Blocker

GitHub can dispatch `workflow_dispatch` only after the workflow exists on the default branch. `origin/main` is `chudeemeke/get-stuff-done`; the local Phase 41 branch is fast-forwardable but 88 commits ahead of `origin/main`.

Required capture sequence:

1. Register `.github/workflows/perf-baseline.yml` on the default branch.
2. Run `gh workflow run perf-baseline.yml --ref worktree-agent-a1c0cd52236103329 --repo chudeemeke/get-stuff-done`.
3. Download artifacts with `gh run download`.
4. Merge real artifacts:
   - `node scripts/bench.js --merge <artifact-dir> --require-platforms linux,macos,windows --out perf-baseline.json`
   - `node scripts/bench-test-timing.js --merge <artifact-dir> --require-platforms linux,macos,windows --out .planning/perf/test-timing.json`
5. Commit `perf-baseline.json` and `.planning/perf/test-timing.json` only after the merge commands pass.

Do not mark `PERF-01` or `PERF-02` complete before this sequence produces real three-platform artifacts.
