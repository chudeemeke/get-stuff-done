# Override: hooks/gsd-statusline.js

## Why
Enhanced GSD statusline for the fork. The fork keeps branded output, reads
`gsd.role` for consumer/maintainer update display, surfaces milestone/phase
state when no todo is active, and uses the shared package-lineage cache written
by `gsd-check-update.js`.

## Upstream snapshot
- Version: 1.8.0
- SHA-256: e73c3cc144cc1e1e4724f28328f00d4a67d4a4ccc2d9ab6bd437bdd1a389af4f
- Semantic SHA-256: 3316f1edb1127b2259c24b40228f270fb0eb0fa773444a46695b146f2b2e396b

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

## Bump review 2026-08-30 (1.7.0 -> 1.8.0)

Reviewed 2026-08-30 for 1.7.0 -> 1.8.0: upstream added one opt-in feature — a
compact GSD state format behind `statusline.state_format: "compact"`
(formatGsdStateCompact + shortGsdStatus built on normalizeStateStatus, #2162
approval condition). Reviewed and DEFERRED, not adopted — same rationale as
the 1.7.0 review: the fork statusline is a deliberate rewrite with its own
theme system and the addition is opt-in, not load-bearing. Standing deferral
list is now four features (token-count suffix, long-context badge, show_git
segment, compact state format). Revisit at the next bump or on user request.
