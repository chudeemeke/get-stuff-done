# Override: gsd-core/bin/lib/roadmap.cjs

## Why
Fork GSD project recovery exposed a routing bug where `roadmap analyze` selected the first older partial phase instead of the current phase recorded in STATE.md. It also counted only disk PLAN files, which can make roadmap progress appear complete while ROADMAP-declared future plans remain.

## Upstream snapshot
- Version: 1.5.0
- SHA-256: 8840406705199228b25d296d0756e2b48757d400cc07f229d65f54051f45ea1e

## What's different
- Reads current phase from STATE.md formats used by this fork and prefers it when it maps to an active roadmap phase.
- Counts effective plan totals as the max of disk PLAN files and ROADMAP `**Plans**` declarations.
- Adds disk/declared plan counts to analysis output for diagnostics.
- Anchors phase checkbox matching to the checklist prefix to avoid mutating a different phase that mentions the target phase later in the line.
- Preserves CRLF line endings when updating plan counts and completion checkboxes.

## Review trigger
When upstream `gsd-core/bin/lib/roadmap.cjs` changes, check whether Open GSD has native STATE-aware current-phase selection and declared-plan progress accounting. Remove this override once upstream behavior covers these cases.
