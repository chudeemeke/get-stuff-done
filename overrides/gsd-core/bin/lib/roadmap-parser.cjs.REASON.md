# Override: gsd-core/bin/lib/roadmap-parser.cjs

## Why
Memory-nexus recovery exposed that runtime phase execution selected stale `STATE.md` frontmatter milestone metadata (`v4.0`) over the current body milestone and active ROADMAP milestone (`v5.0`). That routed Phase 42 under the wrong milestone and made roadmap analysis miss the current milestone's phases.

## Upstream snapshot
- Version: 1.5.0
- SHA-256: a5e37ae9b60997556c80db41247bf574fc924461e9ecbecff928ba3b85f2917f

## What's different
- Resolves the current milestone by preferring explicit `STATE.md` body milestone text, then active/in-progress ROADMAP declarations, then frontmatter as a fallback.
- Recognizes `ACTIVE`, `IN PROGRESS`, `WIP`, and `STARTED` milestone markers in ROADMAP list items and headings.
- Filters shared `Phase Details` sections to the current milestone's summary phase list so older milestone detail blocks do not leak into current progress, health, or next-phase selection.
- Reuses the same milestone selection path for scoped phase parsing and milestone metadata output.

## Review trigger
When upstream `gsd-core/bin/lib/roadmap-parser.cjs` changes, check whether Open GSD has native stale-frontmatter protection and active/in-progress milestone selection. Remove this override once upstream behavior covers these cases.
