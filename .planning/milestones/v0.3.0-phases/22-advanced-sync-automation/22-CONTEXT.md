# Phase 22: Advanced Sync Automation - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing upstream sync workflow with precision cherry-picking by category and AI-assisted conflict resolution. Users can selectively sync specific types of upstream commits (features, fixes, etc.) instead of all-or-nothing, with dependency tracking between related commits. When cherry-pick conflicts arise, Claude analyzes both sides, suggests a resolution that preserves fork identity, and explains the conflict context.

</domain>

<decisions>
## Implementation Decisions

### Commit categorization
- Auto-detect categories from conventional commit prefixes (feat:, fix:, refactor:, docs:, chore:, test:, perf:)
- Use raw conventional commit types as categories -- no broader bucketing
- Non-conventional commits classified by AI (Claude reads the diff and infers category) -- free in Claude Code context
- Cache categorization results in sync manifest (sync-manifest.json or similar) so re-running preview reuses cached classifications

### Selection interface
- Category flags on existing /gsd:upstream sync workflow -- not a new subcommand
- Flags: --category feat,fix to include, --exclude refactor to exclude
- Individual commit SHA support: --include abc123 / --exclude def456 for fine-grained control alongside category filtering
- Enhanced sync-preview output shows category grouping and selection indicators before applying

### Dependency tracking
- AI analysis for semantic dependency detection -- Claude reads diffs and determines dependencies between commits (catches logic dependencies across files, not just file-overlap)
- Explicit cross-module warnings: when a selected commit in one module (e.g., sync.cjs) depends on an excluded commit in another module (e.g., state.cjs), show a distinct warning highlighting the cross-module boundary
- Dependency info always shown in sync-preview output -- user sees the full picture before committing
- When a dependency is detected: auto-include the required commit with a warning, overridable with --force

### Conflict resolution UX
- Inline terminal explanation when cherry-pick conflicts occur
- Context + suggestion format: explain what upstream changed, what fork has, why they conflict, and suggest a resolution preserving fork identity -- concise but complete
- User interaction: accept (apply suggestion as-is), reject (skip this commit), or edit (manual resolution)
- Fork identity preservation rule: fork branding (get-stuff-done vs get-shit-done), custom features, and fork config always win over upstream. Upstream logic/behavior changes are accepted.

### Claude's Discretion
- Exact format of dependency graph visualization in preview
- How to handle circular dependencies (if they exist)
- Conflict resolution file staging mechanics
- Error recovery when AI classification or dependency analysis fails

</decisions>

<specifics>
## Specific Ideas

- Selective sync must respect the modular gsd-tools architecture -- selecting a commit in one domain module should not silently require commits in another module without explicit dependency notification
- AI classification and dependency analysis are effectively free in Claude Code context (same session, no extra API cost)
- Build on existing sync-preview and sync-manifest infrastructure from Phase 20

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 22-advanced-sync-automation*
*Context gathered: 2026-03-07*
