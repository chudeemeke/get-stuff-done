# Override: gsd-core/bin/lib/init.cjs

## Why
Fork GSD project recovery exposed that `init progress` reported Phase 40.5 as current even though STATE.md records Phase 41 as active, and selected backlog 999.1 as next work instead of roadmap Phase 42.

## Upstream snapshot
- Version: 1.5.0
- SHA-256: 05fa2a52ac0d08d89be3cb992c9e1ae2f83513e927ca0aab86473960f37a2b64

## What's different
- Reads current phase from STATE.md formats used by this fork and prefers it after merging disk and ROADMAP-only phases.
- Computes `next_phase` after phase sorting so roadmap-only Phase 42 beats later backlog directories.
- Surfaces `state_current_phase` in `init progress` output for diagnostics.

## Review trigger
When upstream `gsd-core/bin/lib/init.cjs` changes, check whether Open GSD has native STATE-aware `init progress` routing and roadmap-ordered next-phase selection. Remove this override once upstream behavior covers these cases.
