# Phase 1: Configuration System - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a config file (`~/.gsd/config.json`) that controls GSD runtime behavior. GSD launcher reads this config and passes appropriate flags to Claude Code. Phase 1 covers launcher-related settings only (autocompact, chrome, dangerous_skip_permissions).

</domain>

<decisions>
## Implementation Decisions

### Config Location & Discovery
- Location: `~/.gsd/config.json`
- Windows: Use `~/.gsd` with path translation (code references `~/.gsd`, translates internally)
- Missing file: Auto-create with documented defaults on first run
- Project override: No — global config only, single source of truth
- Env override: Support `GSD_CONFIG_PATH` for CI/testing
- Env path missing: Claude's discretion on error vs create behavior
- Startup message: "GSD config loaded from ~/.gsd/config.json" (informative, once per session)

### Schema & Validation
- Format: JSON5 (allows comments, trailing commas)
- Unknown keys: Reject with error (catches typos like 'autcompact')
- Invalid values: Error with clear message ("autocompact must be a number, got string")
- Range validation: Yes, with sensible bounds (Claude determines appropriate ranges)
- Version field: Include `"version": 1` for future migrations

### Config Values
- **working_context**: User's desired usable context in tokens (e.g., 100000)
  - GSD calculates actual `--autocompact` value by adding buffer internally
  - User doesn't need to know about buffer calculation
- **chrome**: Boolean, whether to pass `--chrome` flag
- **dangerous_skip_permissions**: Boolean, whether to pass `--dangerously-skip-permissions` flag
- Flag config structure: Claude's discretion (simple booleans vs nested object)

### Default Values
- working_context: 100000 tokens (user's usable space before autocompaction)
- chrome: false (user enables explicitly)
- dangerous_skip_permissions: false (user enables explicitly)
- Auto-generated config includes inline JSON5 comments explaining each setting

### Change Detection
- Hot reload: Yes, detect changes during session and apply
- Mechanism: Claude's discretion (file watcher or polling — like skills hot reload)
- Notification: Show what changed ("Config reloaded: working_context 100000 -> 80000")
- Reload errors: Keep previous config + show error (don't break session)

### Claude's Discretion
- Exact range bounds for numeric values
- Hot reload implementation approach (fs.watch vs polling)
- Flag config structure (flat booleans vs grouped object)
- Behavior when GSD_CONFIG_PATH points to non-existent file

</decisions>

<specifics>
## Specific Ideas

- Config represents user's mental model: "I want 100k usable context" — GSD handles the buffer math
- Message format: "GSD config loaded from ~/.gsd/config.json" (not just path, full informative sentence)
- JSON5 for human-friendly editing with comments

</specifics>

<deferred>
## Deferred Ideas

- Full Claude flag passthrough (`gsd --model opus` etc.) — future enhancement
- Shortcut variations (`gsd-y` for YOLO mode) — future enhancement
- Named profiles (`gsd --profile yolo`) — future enhancement
- Formalize workflow/subagents/ui config sections — future phase if needed

</deferred>

---

*Phase: 01-configuration-system*
*Context gathered: 2026-01-28*
