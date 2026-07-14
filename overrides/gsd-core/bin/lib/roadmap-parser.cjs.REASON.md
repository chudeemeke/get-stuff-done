# Override: gsd-core/bin/lib/roadmap-parser.cjs

## Why
Memory-nexus recovery exposed that runtime phase execution selected stale `STATE.md` frontmatter milestone metadata (`v4.0`) over the current body milestone and active ROADMAP milestone (`v5.0`). That routed Phase 42 under the wrong milestone and made roadmap analysis miss the current milestone's phases.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: 077b798638c88f6c13df2ac191df2f2c22cae750b52e63167dbdc867d5883430

## What's different
- Resolves the current milestone by preferring explicit `STATE.md` body milestone text, then active/in-progress ROADMAP declarations, then frontmatter as a fallback.
- Recognizes `ACTIVE`, `IN PROGRESS`, `WIP`, and `STARTED` milestone markers in ROADMAP list items and headings.
- Filters shared `Phase Details` sections to the current milestone's summary phase list so older milestone detail blocks do not leak into current progress, health, or next-phase selection.
- Reuses the same milestone selection path for scoped phase parsing and milestone metadata output.

## Review trigger
When upstream `gsd-core/bin/lib/roadmap-parser.cjs` changes, check whether Open GSD has native stale-frontmatter protection and active/in-progress milestone selection. Remove this override once upstream behavior covers these cases.
