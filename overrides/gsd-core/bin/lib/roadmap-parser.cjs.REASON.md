# Override: gsd-core/bin/lib/roadmap-parser.cjs

## Why
Memory-nexus recovery exposed that runtime phase execution selected stale `STATE.md` frontmatter milestone metadata (`v4.0`) over the current body milestone and active ROADMAP milestone (`v5.0`). That routed Phase 42 under the wrong milestone and made roadmap analysis miss the current milestone's phases.

## Upstream snapshot
- Version: 1.7.0
- SHA-256: f3bc6a0818a572e8393c4068324fd0c0dd7cdf700d546901d526272429063f3a

## What's different
- Resolves the current milestone by preferring explicit `STATE.md` body milestone text, then active/in-progress ROADMAP declarations, then frontmatter as a fallback.
- Recognizes `ACTIVE`, `IN PROGRESS`, `WIP`, and `STARTED` milestone markers in ROADMAP list items and headings.
- Filters shared `Phase Details` sections to the current milestone's summary phase list so older milestone detail blocks do not leak into current progress, health, or next-phase selection.
- Reuses the same milestone selection path for scoped phase parsing and milestone metadata output.

## Review trigger
When upstream `gsd-core/bin/lib/roadmap-parser.cjs` changes, check whether Open GSD has native stale-frontmatter protection and active/in-progress milestone selection. Remove this override once upstream behavior covers these cases.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: upstream became cwd-aware (STATE frontmatter + emoji-marker selection) but still prefers the STALE frontmatter source and misses text ACTIVE/IN PROGRESS/WIP/STARTED markers. Forward-ported as pure 1.7.0 base + the fork selection order (state-body > roadmap-active > frontmatter) + Phase Details summary filtering. Keeping the old file was impossible: 1.7.0 modules import currentMilestoneRawRanges, absent from the 1.6.1-vintage override (phase.test.cjs crashed on it).
