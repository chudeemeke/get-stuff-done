# Roadmap: GetStuffDone v0.3.0

## Milestones

- [x] **v0.1.0 GetStuffDone Fork** - Phases 1-6 (shipped 2026-02-05)
- [x] **v0.2.0 Hardening & Upstream Sync** - Phases 7-17 (shipped 2026-02-21)
- [ ] **v0.3.0 Upstream Sync & Workflow Maturity** - Phases 18-22 (in progress)

## Overview

v0.3.0 integrates 185 upstream commits (v1.10.0 through v1.20.5), adopts upstream's modular gsd-tools architecture (11 CJS domain modules), and builds mature sync workflow tooling on the new foundation. The roadmap follows a strict dependency chain: execute the massive upstream sync first (Phase 18), stabilize the build pipeline and assess what upstream now provides (Phase 19), then layer sync safety features (Phase 20), intelligent monitoring (Phase 21), and advanced automation (Phase 22) on the solid modular base. Each phase delivers a complete, verifiable capability that unblocks the next.

## Phases

<details>
<summary>v0.1.0 GetStuffDone Fork (Phases 1-6) - SHIPPED 2026-02-05</summary>

See: .planning/milestones/v0.1.0-ROADMAP.md

</details>

<details>
<summary>v0.2.0 Hardening & Upstream Sync (Phases 7-17) - SHIPPED 2026-02-21</summary>

See: .planning/milestones/v0.2.0-ROADMAP.md

</details>

### v0.3.0 Upstream Sync & Workflow Maturity

**Milestone Goal:** Bring the fork current with upstream (185 commits), adopt modular architecture, and build production-grade sync workflow tooling with safety, intelligence, and AI assistance.

- [x] **Phase 18: Upstream Sync Execution** - Integrate 185 upstream commits and adopt modular gsd-tools architecture
- [ ] **Phase 19: Post-Sync Stabilization** - Migrate esbuild bundling to modular structure and assess upstream feature overlap
- [ ] **Phase 20: Sync Safety & Transparency** - Diff preview, rollback snapshots, and dry-run mode for sync operations
- [ ] **Phase 21: Sync Intelligence** - Auto-update monitoring, GPG verification, and commit categorization
- [ ] **Phase 22: Advanced Sync Automation** - Selective sync by category and AI-assisted conflict resolution

## Phase Details

### Phase 18: Upstream Sync Execution
**Goal**: Fork codebase is current with upstream v1.20.5, using the modular gsd-tools architecture (11 domain modules), with fork identity and test suite intact
**Depends on**: Phase 17 (v0.2.0 complete)
**Requirements**: SYNC-II-01, SYNC-II-02, SYNC-II-04, SYNC-II-05, SYNC-II-06
**Success Criteria** (what must be TRUE):
  1. All 185 upstream commits from v1.10.0 through v1.20.5 are integrated into the fork's main branch
  2. gsd-tools is structured as 11 CJS domain modules under bin/lib/ (commands, config, core, frontmatter, init, milestone, phase, roadmap, state, template, verify) -- not a monolith
  3. Fork identity is preserved: package name is @chude/get-stuff-done, all user-facing URLs point to chudeemeke/get-stuff-done, branding says "GetStuffDone"
  4. Test suite passes: 563+ tests at 95%+ coverage on all 3 CI platforms (macOS, Linux, Windows)
  5. Upstream approach comparison document exists covering every area where fork and upstream solved the same problem differently
**Plans:** 5/5 plans executed
Plans:
- [x] 18-01-PLAN.md -- Setup sync branch and cherry-pick Batch 6 (v1.18.0..v1.19.0, 30 commits)
- [x] 18-02-PLAN.md -- Cherry-pick Batches 7-8 (v1.19.0..v1.19.2, 28 commits) including gsd-tools.cjs rename
- [x] 18-03-PLAN.md -- Cherry-pick Batches 9-11 (v1.19.2..v1.20.5, 49 commits)
- [x] 18-04-PLAN.md -- Cherry-pick Batch 12 (v1.20.5..upstream/main, 11 commits) module split
- [x] 18-05-PLAN.md -- Final validation, approach comparison, and merge to main

### Phase 19: Post-Sync Stabilization
**Goal**: The esbuild bundling pipeline produces working dist files from the new modular structure, and assessment of upstream features informs scope of deferred requirements
**Depends on**: Phase 18
**Requirements**: SYNC-II-03, ASSESS-01, ASSESS-02
**Success Criteria** (what must be TRUE):
  1. esbuild bundling produces self-contained dist files from the 11 modular CJS sources -- copy-mode install works end-to-end (install, run hooks, execute gsd-tools commands)
  2. ASSESS-01 report exists: documents whether upstream auto-advance pipeline makes CLAUDE-06 (agent teams parallel execution) redundant, partially redundant, or still needed -- with clear scope recommendation
  3. ASSESS-02 report exists: documents whether upstream's current diff/review workflow makes PLAT-07 (interactive diff viewer) and PLAT-08 (multi-upstream support) redundant or still needed -- with clear scope recommendation
  4. All fork-specific infrastructure (src/validation, src/platform, src/theme, src/config, hooks) works correctly with the modular gsd-tools structure
**Plans:** 1/3 plans executed
Plans:
- [ ] 19-01-PLAN.md -- Fix esbuild dist output naming (.js to .cjs) and install.js copy target
- [ ] 19-02-PLAN.md -- Write ASSESS-01 and ASSESS-02 feature overlap assessment reports
- [ ] 19-03-PLAN.md -- Migrate platform.test.js re-require tests to fix coverage to 95%+

### Phase 20: Sync Safety & Transparency
**Goal**: Sync operations are safe and transparent -- users can preview changes, roll back failures, and simulate syncs without modifying the working tree
**Depends on**: Phase 19
**Requirements**: SYNC-01, SYNC-02, SYNC-04
**Success Criteria** (what must be TRUE):
  1. Before any cherry-pick executes, the user sees a colorized, syntax-highlighted diff of what that commit changes -- and can accept or skip it
  2. The sync workflow automatically creates restore points before each cherry-pick batch, and the user can rollback to the last known-good state with a single command when something fails
  3. Running sync with --dry-run shows the full sync plan (commits to cherry-pick, predicted conflicts based on file overlap analysis, estimated effort) without modifying any files or git state
  4. Safety features work on all 3 platforms (macOS, Linux, Windows Git Bash)
**Plans**: TBD

### Phase 21: Sync Intelligence
**Goal**: The sync workflow has automated intelligence -- it monitors for new upstream changes, verifies commit integrity, and classifies changes by type
**Depends on**: Phase 20
**Requirements**: SYNC-03, SYNC-07, SYNC-08
**Success Criteria** (what must be TRUE):
  1. The system periodically checks for new upstream commits and displays a summary categorized by severity (breaking changes, security fixes, features, bug fixes, chores) with visual indicators
  2. When GPG signatures are available on upstream commits, the system validates them and warns the user about unsigned commits in security-sensitive paths (bin/, hooks/, install scripts)
  3. Every upstream commit is automatically classified as feature/fix/refactor/docs/chore based on commit message parsing and file path analysis, with the classification visible in the sync preview
**Plans**: TBD

### Phase 22: Advanced Sync Automation
**Goal**: The sync workflow supports precision cherry-picking by category and AI-assisted conflict resolution, enabling efficient handling of large upstream deltas
**Depends on**: Phase 21
**Requirements**: SYNC-09, SYNC-10
**Success Criteria** (what must be TRUE):
  1. Users can cherry-pick upstream commits by category (e.g., "sync only bug fixes" or "sync features X and Y") instead of all-or-nothing, with the system tracking dependencies between related commits and warning when skipping a commit would break a dependent one
  2. When cherry-pick conflicts arise, the system uses Claude to analyze both sides of the conflict, suggests a resolution that preserves fork identity, and explains the conflict context so the user can make an informed decision
  3. Selective sync respects the modular gsd-tools architecture -- selecting a commit in one domain module does not silently require commits in another module without explicit dependency notification
**Plans**: TBD

## Progress

**Execution Order:** 18 -> 19 -> 20 -> 21 -> 22

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Upstream Sync Execution | v0.3.0 | 5/5 | Complete | 2026-02-23 |
| 19. Post-Sync Stabilization | 1/3 | In Progress|  | - |
| 20. Sync Safety & Transparency | v0.3.0 | 0/TBD | Not started | - |
| 21. Sync Intelligence | v0.3.0 | 0/TBD | Not started | - |
| 22. Advanced Sync Automation | v0.3.0 | 0/TBD | Not started | - |
