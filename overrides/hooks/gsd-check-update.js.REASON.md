# Override: hooks/gsd-check-update.js

## Why
Fork-branded version check. The fork must check `@chude/get-stuff-done`,
preserve `gsd.role` consumer/maintainer routing, and keep the fork's exact
4-hour parent throttle plus 7-day network throttle while adopting the upstream
split-worker resilience model.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: 95bbd1c7ca11246828eb85b0b7b3718771d08d186e8d3b103426749cc9bb5415
- Semantic SHA-256: 8cd427939dd8c8c9d61a602d7a766ddcfdfc1b317f11bdae592d9ddc872eea40

## What's different
- Checks `@chude/get-stuff-done` package identity instead of `@opengsd/gsd-core`.
- Reads `gsd.role` from fork config, with `GSD_ROLE_OVERRIDE` retained for tests and automation.
- Preserves the fork's 4-hour SessionStart spawn throttle and 7-day network throttle.
- Keeps legacy `get-stuff-done/VERSION` fallback while adopting `gsd-core/VERSION`.

## Adopted upstream 1.6.1 behavior
- Adds `detectConfigDir(baseDir)` multi-runtime config detection.
- Uses the shared cache directory `$HOME/.cache/gsd`.
- Spawns `gsd-check-update-worker.js` instead of embedding a `node -e` template.
- Adds stale hook detection through the worker before a throttled no-update result.

## Review trigger
When upstream hooks/gsd-check-update.js changes, review whether the override is still needed.
