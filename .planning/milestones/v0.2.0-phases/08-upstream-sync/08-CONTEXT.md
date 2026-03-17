# Phase 8: Upstream Sync - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Pull latest upstream changes from glittercowboy/get-shit-done (through latest release tag), integrate all features (gsd-tools.js, thin orchestrator, context optimization, Gemini CLI, git branching, test infrastructure, bug fixes), and build permanent, reusable sync safety tooling. Phase 7 security tools (diff review, SHA validation, conflict detection, ESLint) are used throughout.

</domain>

<decisions>
## Implementation Decisions

### Sync Strategy
- Cherry-pick each upstream commit individually (maximum control and review)
- Work on dedicated `upstream-sync` branch, merge to main when complete
- Preserve upstream commits as individual commits in fork history (no squashing)
- Sync target: latest upstream release tag (not latest main commit)
- Add upstream repo as git remote (`git remote add upstream <url>`)
- Every cherry-pick gets diff review regardless of file overlap
- On cherry-pick conflict: pause the entire sync, resolve, then continue (no skipping)
- Persistent progress log tracks applied/pending/conflicted commits across sessions
- Fork point determined automatically (common ancestor detection)
- Trivial commits (typo fixes, formatting) may be batched; significant ones cherry-picked individually

### Conflict Resolution Policy
- Default priority: upstream wins -- fork-specific changes re-applied on top
- Protected areas (never overwritten): branding + Phase 7 security tooling
- Feature overlap: evaluate per feature -- structured comparison doc, Claude recommends, user decides
- Fork naming wins for all naming conflicts (branding, variable names, display text)
- Fork files never deleted during sync -- upstream deletions skip protected/fork-specific files
- Per-file conflict resolution log documenting: file, what conflicted, resolution chosen, reasoning
- Final branding pass after all cherry-picks re-applies fork identity across all modified files
- package.json gets special handling: fork's name, version, author, URLs always preserved; only accept new scripts/deps

### Safety Tooling
- State snapshot (git tag) before each cherry-pick for granular rollback
- ESLint security validation after every cherry-pick (Phase 7 tooling)
- On ESLint failure: pause sync, fix violation, amend cherry-pick commit, then continue
- Permanent, reusable tooling (lives in `.planning/` directory)
- Dry-run mode: preview entire sync plan (commit list, affected files, predicted conflicts) without applying
- Sync manifest tracks all applied upstream SHAs -- future syncs skip already-applied commits
- Full summary report after completion (commits applied, conflicts resolved, ESLint fixes, branding corrections)

### Feature Acceptance
- All upstream features accepted with review gate (each feature gets quick review before integration)
- Gemini CLI support: accepted but marked as secondary (Claude remains primary)
- Upstream test infrastructure: fully adopted (upstream tests become part of fork's test suite)
- Upstream bug fixes: accepted even if they change behavior the fork relied on (adapt fork code)
- Per-feature acceptance checklist: what it does, files affected, validation steps, branding implications
- Automated validation where upstream tests exist; manual smoke test where they don't
- All dependency changes (new packages, version bumps) reviewed before accepting
- Full integration test after sync completes: installation, config loading, statusline, hooks

### Post-Sync
- Version bump determined by actual changes (patch for fixes only, minor for features, major for breaking)
- Detailed changelog mapping upstream features to what fork gained
- Future sync cadence: per upstream release (event-driven)
- Rollback plan: `git revert -m 1 <merge-sha>` to cleanly undo sync while preserving history
- Merge method: `git merge --no-ff upstream-sync` (clear merge point, individual commits preserved)
- Upstream remote kept permanently for future syncs

### Branding Pass
- Auto-replace all 'get-shit-done' references with 'get-stuff-done' in code, config, and strings
- Cherry-pick commit messages preserve upstream's original text (history is upstream's)
- User-facing code, config, and documentation: fork branding always applied

### Claude's Discretion
- Exact ordering of cherry-picks within logical groups
- Implementation details of sync tooling (scripts, progress file format)
- Snapshot tag naming convention
- Dry-run output format
- Conflict resolution log format
- How to structure per-feature acceptance checklists

</decisions>

<specifics>
## Specific Ideas

- Sync tooling should be permanent and reusable, living in `.planning/` -- investment for long-term fork maintenance
- Progress log enables multi-session sync (can pause and resume)
- Sync manifest enables incremental future syncs (don't re-apply what's already integrated)
- Structured comparison docs for feature overlaps give user clear decision points with Claude's recommendation

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 08-upstream-sync*
*Context gathered: 2026-02-08*
