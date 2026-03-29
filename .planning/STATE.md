# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Get upstream improvements automatically while preserving fork identity and additions
**Current focus:** Phase 32 -- Fork Code Port

## Current Position

Phase: 32 of 35 (Fork Code Port) -- IN PROGRESS
Plan: 2 of 3 complete in current phase
Status: Plan 32-02 complete -- sync.cjs ported, sync-tools.cjs CLI created, 14 markdown files copied to overlay/
Last activity: 2026-03-29 -- ported sync module and fork-specific markdown files to overlay/

Progress: [=========================.....] 80% (milestones 1-3 complete, v0.4.0 superseded, v1.0.0 Phase 32 plan 2/3)

## Performance Metrics

**Velocity:**
- Total plans completed: 60 (across v0.1.0-v0.3.0)
- v0.1.0: 12 plans, 1.38 hours
- v0.2.0: 32 plans, 4.45 hours
- v0.3.0: 17 plans, 15.0 hours

**v1.0.0 Milestone:**
- Requirements: 61 across 7 phases (29-35)
- Architecture: Overlay model replacing direct-edit fork
- Ships as: npm v3.0.0

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Overlay architecture: cherry-pick sync unsustainable at 569-commit delta
- Surface-only branding: internal path renaming cascades complexity
- Publish-time composition: pre-composed dist/ is self-contained and testable
- Exact version pinning: prevents unreviewed upstream updates
- No runtime filtering in v3.0: upstream installer is 5K-line monolith
- Phase 29 go/no-go: GO -- upstream __dirname path resolution works from composed dir, surface branding safe, overlay coexistence confirmed
- --config-dir for test isolation: os.homedir() ignores HOME on Windows; --config-dir is reliable cross-platform
- Branding engine: replaceAll for long patterns, word-boundary regex for short all-caps tokens (TACHES)
- Integration test uses dynamic bare-count comparison (not hard-coded) -- upstream v1.30.0 has 27 bare refs, not 29 as plan spec stated
- Pipeline stages are separate importable functions (SRP): resolve, filter, override, brand, merge, compose
- filter() implemented in Phase 31 with category-based file exclusion; override() remains Phase 30 pass-through stub for Phase 32
- brand() reads files lazily at brand stage (not resolve) to keep resolve fast
- merge() clean rebuild: rmSync then mkdirSync -- no stale files in dist/
- computeDelta() tracks CREDITS.md using generateCredits() for comparison; tracks .install-meta.json as always-modified when dist/ exists
- CREDITS.md not in wouldWrite when preserveUpstreamCredit is false -- removed-detection flags it correctly
- .install-meta.json special-case exclusion removed from removed-detection loop -- now tracked via wouldWrite
- Exclude entries use basename without extension, matched against category directory prefix (FEAT-01)
- Unmatched excludes produce warnings (not errors) -- composition still succeeds
- SDK exclusion is all-or-nothing (sdk: false drops all sdk/ entries)
- Runtimes section completely ignored by filter() -- documentation-only in v3.0
- check-overrides.js is fully standalone (no compose.js imports) -- runs independently in CI
- Content hash comparison (SHA-256) prevents false positives on version-only bumps
- override() derives overrides/ path as sibling of overlayDir via path.dirname()
- merge() prefers state.meta.overridesApplied over local entry.action collection (dual-source, meta preferred)
- REASON.md error template dynamically includes relPath and upstreamVersion from pipeline state
- Sync commands separated into standalone sync-tools.cjs CLI (not patching upstream gsd-tools.cjs router)
- overlay/lib/sync.cjs import path targets dist/ layout -- not resolvable from source tree (by design)

### Pending Todos

None yet.

### Blockers/Concerns

- Upstream test compat feasibility gate in Phase 34: >30% needing adaptation triggers reassessment

## Session Continuity

Last session: 2026-03-29
Stopped at: Completed 32-02-PLAN.md -- sync.cjs ported, sync-tools.cjs CLI created, 14 fork markdown files in overlay/ (PORT-01, PORT-07, PORT-09)
Resume file: None
