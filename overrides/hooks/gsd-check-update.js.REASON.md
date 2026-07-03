# Override: hooks/gsd-check-update.js

## Why
Fork-branded version check. Our hook checks `@chude/get-stuff-done` on npm instead of the active Open GSD upstream package `@opengsd/gsd-core`, uses hardcoded `.claude` path (fork only supports Claude Code), and reads `gsd.role` from config for consumer/maintainer routing with a 7-day network throttle.

## Upstream snapshot
- Version: 1.5.0
- SHA-256: 95bbd1c7ca11246828eb85b0b7b3718771d08d186e8d3b103426749cc9bb5415
- Semantic SHA-256: 8cd427939dd8c8c9d61a602d7a766ddcfdfc1b317f11bdae592d9ddc872eea40

## What's different
- Checks `@chude/get-stuff-done` package instead of `@opengsd/gsd-core`
- Hardcoded `.claude` config path (no multi-runtime detection)
- Reads `gsd.role` from `.planning/config.json` for consumer/maintainer routing
- 7-day network throttle instead of upstream's cadence
- Simpler implementation (no `detectConfigDir` multi-runtime logic)

### Phase 43 UPGRADE-07 fold candidates (deferred per RESEARCH.md §8 Q3)
- **Worker-script architecture (v1.38.5+):** upstream moved the inline `spawn(node, ['-e', template])` block into a dedicated `hooks/gsd-check-update-worker.js`. Cleaner separation, independently testable, eliminates template-literal regex-escaping concerns. Fork should adopt the same split during UPGRADE-07.
- **Stale-hook detection improvements (#2224, #2141):** upstream's worker now stamps `.sh` version headers and adds bash hooks to `MANAGED_HOOKS` (improves staleness false-positive rate). Fork's override has its own `MANAGED_HOOKS` list; UPGRADE-07 should reconcile.

## Review trigger
When upstream hooks/gsd-check-update.js changes, review whether the override is still needed.
Consider adopting upstream's multi-runtime detection if fork expands beyond Claude Code.
