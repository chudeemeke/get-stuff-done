# Override: gsd-core/bin/lib/state.cjs

## Why
Cross-project inbox reports showed `state update-progress` can report misleading completion when future work is declared in ROADMAP.md but not yet represented by PLAN files on disk.

## Upstream snapshot
- Version: 1.7.0
- SHA-256: 216338a0cb89c04cb71d7c911e70de4711103a5a90b88046a1a1d56bc7c8622f

## What's different
- Reads current-milestone ROADMAP `**Plans**` declarations.
- Computes total plans per phase as the max of declared ROADMAP plans and disk PLAN files.
- Keeps completed count disk-backed from SUMMARY files.

## Review trigger
When upstream `gsd-core/bin/lib/state.cjs` changes, check whether Open GSD has native declared-plan progress accounting. Remove this override once upstream behavior covers this case.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: forward-ported as pure 1.7.0 base + extractDeclaredPlanCount/readRoadmapDeclaredPlanCounts + the per-phase max(declared, disk) totals merge in cmdStateUpdateProgress. ADOPTED from upstream: the #2177 frontmatter-safe machine-segment writer and the #3242 roadmap-phase-count capping (both were pending fork backports now native). The previous override carried a pre-1.6.1 base.
