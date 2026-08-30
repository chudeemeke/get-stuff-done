# Override: hooks/gsd-statusline.js

## Why
Enhanced GSD statusline for the fork. The fork keeps branded output, reads
`gsd.role` for consumer/maintainer update display, surfaces milestone/phase
state when no todo is active, and uses the shared package-lineage cache written
by `gsd-check-update.js`.

## Upstream snapshot
- Version: 1.7.0
- SHA-256: 6e05a20a979d9d4968c234db49378b1b73550a3c7ef28ed7dca46e735ab839b1
- Semantic SHA-256: 3c9829bd9e36a3feb324874b6b56e2c13673666ff0f5d9e838515f2d50bf72a4

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

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: upstream added three opt-in features (context token-count suffix, compact long-context model badge, git branch/work-state segment behind statusline.show_git). All three reviewed and DEFERRED, not adopted - the fork statusline is a deliberate rewrite with its own theme system, and none of the additions is load-bearing for fork behavior. Revisit at the next bump or on user request.
