# Phase 30: Composition Pipeline & Branding - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the core composition pipeline (`scripts/compose.js`) that reads upstream files from `node_modules/get-shit-done-cc/` and overlay files from `overlay/`, applies surface-only branding from `branding.json`, and writes composed output to `dist/` with an auditable `.install-meta.json`. Includes `--dry-run` and `--diff` flags. Feature flag filtering (Phase 31), override system (Phase 31), fork code porting (Phase 32), and installer (Phase 33) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Compose CLI output
- Default output: summary only. Silent during work, summary table at end showing upstream files, overlay files, branding rules applied, overrides, warnings, output size
- Errors go to stderr immediately (fail fast)
- `--verbose` shows stage-by-stage progress: [RESOLVE], [FILTER], [OVERRIDE], [BRAND], [MERGE] with counts and branding hit details per rule
- No file-by-file listing in any mode (too noisy for 150+ files)

### Dry run and diff
- `--dry-run` shows "DRY RUN -- no files written" banner, then summary of what would happen: file counts by action type (copy, brand, override, overlay), collision count, warning count. No files written.
- `--diff` shows change summary comparing current `dist/` against what a new composition would produce: added/removed/changed file counts with filenames listed per category. No content-level diffs (just filenames).

### Validation strictness
- Upstream structure validation: fail fast on first mismatch. No partial dist/ written. Error includes what was expected and where, plus hint to run `preview-update`.
- Branding rule with zero file matches: warning, not error. Surfaced in summary. Rule may be stale after upstream restructure -- not dangerous enough to block composition.
- Collision detection: error with actionable guidance. Names both sources, shows exact commands to move to overrides/ or rename.

### Composition behavior
- Clean rebuild every time: delete dist/ entirely before composing. No incremental mode. Guarantees no stale files from previous compositions.

### Claude's Discretion
- Pipeline stage function signatures and data flow between stages
- Internal file manifest format (how files are tracked through the pipeline)
- Branding word-boundary matching algorithm (regex vs more sophisticated)
- Error message formatting beyond the patterns discussed above
- Test structure and organization for compose.test.js and branding.test.js

</decisions>

<specifics>
## Specific Ideas

- Summary output style matches the previews discussed: clean indented key-value pairs, not tables or charts
- Verbose stage output uses `[STAGE]` prefix format with inline counts
- Collision error includes both "move to overrides" and "rename" as recovery options with exact commands
- Branding zero-match warning includes "(rule may be stale)" hint

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 30-composition-pipeline-branding*
*Context gathered: 2026-03-28*
