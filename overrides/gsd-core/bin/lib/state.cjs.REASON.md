# Override: gsd-core/bin/lib/state.cjs

## Why
Cross-project inbox reports showed `state update-progress` can report misleading completion when future work is declared in ROADMAP.md but not yet represented by PLAN files on disk.

## Upstream snapshot
- Version: 1.9.1
- SHA-256: acb2a1335677171b33e308937a48905de52182c41bbe4bfe2d70d7c4b95b3a31

## What's different
- Reads current-milestone ROADMAP `**Plans**` declarations.
- Computes total plans per phase as the max of declared ROADMAP plans and disk PLAN files.
- Keeps completed count disk-backed from SUMMARY files.

## Review trigger
When upstream `gsd-core/bin/lib/state.cjs` changes, check whether Open GSD has native declared-plan progress accounting. Remove this override once upstream behavior covers this case.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: forward-ported as pure 1.7.0 base + extractDeclaredPlanCount/readRoadmapDeclaredPlanCounts + the per-phase max(declared, disk) totals merge in cmdStateUpdateProgress. ADOPTED from upstream: the #2177 frontmatter-safe machine-segment writer and the #3242 roadmap-phase-count capping (both were pending fork backports now native). The previous override carried a pre-1.6.1 base.

Port recipe note: upstream inline `// eslint-disable-next-line @typescript-eslint/...` comments are stripped from the ported file as a standing part of every forward-port (the fork does not load that eslint plugin; behavior-neutral). Expect them to reappear in raw diffs against the pure upstream file.

## Bump review 2026-08-30 (1.7.0 -> 1.8.0)

Reviewed 2026-08-30 for 1.7.0 -> 1.8.0: upstream changes are #2450 (state
transition/document refinements) and a #2376 follow-up — adopted intact via
the pure-1.8.0 base; neither overlaps the fork delta's regions. Fork delta
unchanged and still required (drop-experiment: state.test.cjs
declared-future-plans test fails on pure 1.8.0): extractDeclaredPlanCount /
readRoadmapDeclaredPlanCounts + per-phase max(declared, disk) totals merge in
cmdStateUpdateProgress.

## Bump review 2026-09-05 (1.8.0 -> 1.9.1)

Forward-port from the exact 1.9.1 base. See `.planning/evidence/bump-1.9.1-port.md` for per-file disposition and candidate evidence. Base hashes do not independently prove behavior.
