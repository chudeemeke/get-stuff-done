# Phase 41 Plan 04 Summary

**Status:** Complete locally; PR pending
**Updated:** 2026-07-03T05:00:00+01:00

## Outcome

Plan 04 now has real three-platform performance artifacts. The default-branch
registration blocker was cleared by the merged workflow, the first dispatch
exposed a real `hyperfine` incompatibility, and the corrected branch run produced
Linux, macOS, and Windows artifacts that were merged into:

- `perf-baseline.json`
- `.planning/perf/test-timing.json`

No placeholder platform numbers were committed.

## Capture Runs

- Failed registration-cycle run:
  `https://github.com/chudeemeke/get-stuff-done/actions/runs/28636289286`
  on `main` failed on all three capture jobs because `scripts/bench.js` passed
  unsupported `hyperfine --working-directory`.
- Successful artifact run:
  `https://github.com/chudeemeke/get-stuff-done/actions/runs/28638612289`
  on `phase41-plan04-perf-capture-20260703` commit `1886869` passed all capture
  jobs and the merge job.

The fix uses Bun's supported `bun install --ignore-scripts --cwd <scratch-dir>`
instead of the unsupported hyperfine working-directory flag while preserving the
scratch install invariant.

## Benchmark Sources

| Platform | Node | Bun | hyperfine | install mean | compose mean | test total mean | test files |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| linux | v22.23.1 | 1.3.14 | hyperfine 1.18.0 | 133 ms | 232 ms | 38351 ms | 407 |
| macOS | v22.23.1 | 1.3.14 | hyperfine 1.20.0 | 134 ms | 370 ms | 35509 ms | 407 |
| windows | v22.23.1 | 1.3.14 | hyperfine 1.20.0 | 10203 ms | 595 ms | 130987 ms | 407 |

Merged artifact source directory:
`.planning/perf/artifacts/run-28638612289` (local scratch, removed before commit).

## Verification

- `bun test tests/bench.test.js` -- 5 pass, 0 fail.
- `node --check scripts\bench.js` -- pass.
- `node scripts\bench.js --help` -- pass.
- `node scripts\bench-test-timing.js --help` -- pass.
- `bun test tests\bench.test.js tests\bench-test-timing.test.js tests\perf-baseline-schema.test.js tests\test-timing-schema.test.js` -- 16 pass, 0 fail.
- `bash scripts\lint-workflows.sh` -- pass.
- `bun run lint` -- exits 0 with the existing 135-warning lint surface.
- `node scripts\bench.js --merge .planning\perf\artifacts\run-28638612289 --require-platforms linux,macos,windows --out perf-baseline.json` -- pass.
- `node scripts\bench-test-timing.js --merge .planning\perf\artifacts\run-28638612289 --require-platforms linux,macos,windows --out .planning\perf\test-timing.json` -- pass.

## Remaining Phase 41 Gate

Plan 07 remains open for REL-01/REL-03 closure. Phase 41 still cannot close until
the 10x validation workflow exists on the default branch and passes, or residual
flakes are made visible through the D-11/REL-03 process.
