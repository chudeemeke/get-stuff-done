# Override: gsd-core/bin/lib/init.cjs

## Why
Fork GSD project recovery exposed that `init progress` reported Phase 40.5 as current even though STATE.md records Phase 41 as active, and selected backlog 999.1 as next work instead of roadmap Phase 42.

## Upstream snapshot
- Version: 1.7.0
- SHA-256: 2b214922c3d23e2344a711585a73968daf6b727b6509b5110c5958f8736ce770

## What's different
- Reads current phase from STATE.md formats used by this fork and prefers it after merging disk and ROADMAP-only phases.
- Computes `next_phase` after phase sorting so roadmap-only Phase 42 beats later backlog directories.
- Surfaces `state_current_phase` in `init progress` output for diagnostics.

## Review trigger
When upstream `gsd-core/bin/lib/init.cjs` changes, check whether Open GSD has native STATE-aware `init progress` routing and roadmap-ordered next-phase selection. Remove this override once upstream behavior covers these cases.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: forward-ported as pure 1.7.0 base + readStateCurrentPhase + post-sort STATE-preference current/next selection + state_current_phase output. The previous file carried a pre-1.6.1 base whose merge would have silently stripped 1.7.0 features (verification projection, workstream guard); those upstream behaviors are now intact. Validated by init.test.cjs 14/14 in the composed 1.7.0 candidate matrix.

Port recipe note: upstream inline `// eslint-disable-next-line @typescript-eslint/...` comments are stripped from the ported file as a standing part of every forward-port (the fork does not load that eslint plugin; behavior-neutral). Expect them to reappear in raw diffs against the pure upstream file.
