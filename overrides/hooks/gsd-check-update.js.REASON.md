# Override: hooks/gsd-check-update.js

## Why
Fork-branded version check. Our hook checks `@chude/get-stuff-done` on npm instead of `get-shit-done-cc`, uses hardcoded `.claude` path (fork only supports Claude Code), and reads `gsd.role` from config for consumer/maintainer routing with a 7-day network throttle.

## Upstream snapshot
- Version: 1.34.2
- SHA-256: 61fcb20c5ce5e07346b99c0bc8e6bf9de58d1d088cf3e34d4de53898aee07c2b

## What's different
- Checks `@chude/get-stuff-done` package instead of `get-shit-done-cc`
- Hardcoded `.claude` config path (no multi-runtime detection)
- Reads `gsd.role` from `.planning/config.json` for consumer/maintainer routing
- 7-day network throttle instead of upstream's cadence
- Simpler implementation (no `detectConfigDir` multi-runtime logic)

## Review trigger
When upstream hooks/gsd-check-update.js changes, review whether the override is still needed.
Consider adopting upstream's multi-runtime detection if fork expands beyond Claude Code.
