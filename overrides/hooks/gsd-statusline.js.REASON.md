# Override: hooks/gsd-statusline.js

## Why
Enhanced GSD statusline for the fork. The fork keeps branded output, reads
`gsd.role` for consumer/maintainer update display, surfaces milestone/phase
state when no todo is active, and uses the shared package-lineage cache written
by `gsd-check-update.js`.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: 81059a0f3e0013c18da874d25850d7f2aec0c7cf6b14804246d4bacafea9d0a8
- Semantic SHA-256: ea9f9f78affbc22087cc511df3179feb1f99147c6e1935ae38e0f85caa5410cd

## What's different
- Fork branding in output.
- Reads `gsd.role` from config for consumer/maintainer update display.
- Reads the shared `$HOME/.cache/gsd` package-lineage cache for update notifications.
- Preserves current todo display before falling back to GSD phase state.
- Uses the fork theme system and terminal capability detection.

## Adopted upstream 1.6.1 behavior
- Parses `active_phase`, `next_action`, `next_phases`, `completed_phases`, `total_phases`, and `percent` from `STATE.md` frontmatter.
- Uses `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to compute the autocompact buffer when Claude Code exposes the token window.
- Validates session IDs before writing context bridge files.
- Reads todos from `CLAUDE_CONFIG_DIR` when configured.
- Reads only the shared per-package update cache and ignores foreign `package_name` records.

## Review trigger
When upstream hooks/gsd-statusline.js changes, review whether the override is still needed.
