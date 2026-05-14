# Override: hooks/gsd-check-update.js

## Why
Fork-branded version check. Our hook checks `@chude/get-stuff-done` on npm instead of `get-shit-done-cc`, uses hardcoded `.claude` path (fork only supports Claude Code), and reads `gsd.role` from config for consumer/maintainer routing with a 7-day network throttle.

## Upstream snapshot
- Version: 1.39.1
- SHA-256: 5c06f9482265b7795926866b18fdaa69cd6bf7368021ecf433833b5867ba95c8

## What's different
- Checks `@chude/get-stuff-done` package instead of `get-shit-done-cc`
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
