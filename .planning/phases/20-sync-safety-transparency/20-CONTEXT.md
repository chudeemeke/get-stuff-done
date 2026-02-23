# Phase 20: Sync Safety & Transparency - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the upstream sync workflow safe and transparent. Users can preview what commits will change before cherry-picking, restore state when things go wrong, and simulate the entire sync without modifying git state. All safety features work on macOS, Linux, and Windows Git Bash.

</domain>

<decisions>
## Implementation Decisions

### Architecture: Plumbing/Porcelain Separation
- CLI plumbing in `gsd-tools.cjs` for data operations (reusable, scriptable, crash-recoverable)
- Workflow porcelain in `upstream-sync.md` for user interaction (prompts, approvals, checkpoints)
- Most sync features need both: CLI does the work, workflow presents it
- New `bin/lib/sync.cjs` module for all sync plumbing, following Phase 18's modular architecture
- Router dispatches to sync.cjs like the 11 existing domain modules

### Diff Preview
- Enhanced terminal diff using git's built-in `--color=always` with `--stat` summary
- Per-batch granularity with drill-down: combined `--stat` summary for the batch, user can request individual commit diffs on demand
- Approve batch as a whole; skip individual commits only during cherry-pick execution if they fail
- Flag sensitive paths in `--stat` output using markers (e.g., [!] or color) for files matching branding-map.json protectedPaths
- Sensitive path list sourced from `.planning/sync/branding-map.json` protectedPaths (single source of truth)
- Flag only, drill-down on request (don't auto-expand sensitive commit diffs)
- Current Stage 3.5 security analysis kept as-is, plus new path flagging on top
- Conflict prediction: basic file overlap heuristic first (fast), then optional trial merge (`--no-commit`) for flagged commits only
- CLI plumbing: `gsd-tools.cjs sync-preview <range>` computes all data (commits, stats, flags, conflict risk)
- Workflow porcelain: Stage 3.5 calls sync-preview, presents with approve/skip/abort UX

### Diff Preview Output Format
- Human-readable default (terminal, colorized)
- `--json` flag for structured output (for Phase 22 automation)
- JSON schema: flat with tags (array of objects, each commit has metadata fields)
- Schema: `{hash, subject, files: [{path, status, sensitive: bool}], conflictRisk: 'none'|'overlap'|'confirmed', securityFlags: [...], ...}`
- Extensible: Phase 21 adds category field, Phase 22 filters by it
- Consistent with sync-manifest.json flat array pattern

### Rollback Mechanism
- Lightweight git tags with `sync-checkpoint-` prefix before each batch
- Per-batch granularity (not per-commit): matches diff preview and approval granularity
- Individual cherry-picks are already atomic (git handles within-batch recovery natively)
- Automatic cleanup: tags deleted after successful sync completion
- Rollback UX: workflow-guided (cherry-pick fails -> offer "rollback to checkpoint?" inline) + documented fallback (`git reset --hard sync-checkpoint-<batch>` for crash recovery)
- No new CLI command for rollback: the git command IS the command, documented in the workflow

### Dry-Run Mode
- Terraform-style plan output: commit list, --stat per batch, conflict predictions, sensitive path markers, effort estimate
- Effort estimate calculated from historical conflict rate in sync-manifest.json (% of past commits with conflicts, applied to pending commits)
- Invocation: workflow `--dry-run` flag runs Stages 1-3 (fetch, classify, plan+preview) then STOPS, no Stage 4 execution
- CLI plumbing: `sync-preview` command is reused (same as diff preview, but called standalone or via --dry-run flag)
- Human-readable + JSON output (same dual output as diff preview)

### Claude's Discretion
- Exact format of sensitive path markers in --stat output (color, symbol, placement)
- Trial merge implementation details (abort strategy, error handling)
- Effort estimate formula and presentation format
- Checkpoint tag naming convention details (batch numbering scheme)
- How to handle edge cases: partial batches, interrupted syncs, multiple active sync branches

</decisions>

<specifics>
## Specific Ideas

- Phase 18 experience: two Bun segfault crashes proved the value of crash-recoverable infrastructure. CLI plumbing ensures sync state is inspectable even when the Claude Code process dies.
- sync-manifest.json already tracks per-commit conflict data from Phase 18 (69 applied, 6 skipped, 40 conflicts resolved). This is the training data for effort estimation.
- The branding-map.json protectedPaths list is the single source of truth for sensitive paths. Already maintained and battle-tested across Phase 18's 185 commits.

</specifics>

<deferred>
## Deferred Ideas

- Per-commit selective sync (Phase 22 scope, not Phase 20)
- Commit categorization in preview (Phase 21 adds classification, Phase 20 shows raw commits)
- Interactive diff viewer with syntax highlighting via external tool (PLAT-07, deferred to v0.4.0 per ASSESS-02)

</deferred>

---

*Phase: 20-sync-safety-transparency*
*Context gathered: 2026-02-23*
