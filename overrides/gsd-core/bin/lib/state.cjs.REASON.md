# Override: gsd-core/bin/lib/state.cjs

## Why
Cross-project inbox reports showed `state update-progress` can report misleading completion when future work is declared in ROADMAP.md but not yet represented by PLAN files on disk.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: 4d06f311264fcbe05817cb0200b2403963c4f7e7c232c9bd8b38698582b11af8

## What's different
- Reads current-milestone ROADMAP `**Plans**` declarations.
- Computes total plans per phase as the max of declared ROADMAP plans and disk PLAN files.
- Keeps completed count disk-backed from SUMMARY files.

## Review trigger
When upstream `gsd-core/bin/lib/state.cjs` changes, check whether Open GSD has native declared-plan progress accounting. Remove this override once upstream behavior covers this case.
