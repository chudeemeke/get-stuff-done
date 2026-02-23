# Requirements: GetStuffDone v0.3.0

**Defined:** 2026-02-27
**Core Value:** Maintain upstream compatibility while establishing distinct identity

## v0.3.0 Requirements

Requirements for v0.3.0 Upstream Sync & Workflow Maturity. Phases continue from v0.2.0 (Phase 18+).

### Upstream Sync II

- [ ] **SYNC-II-01**: Integrate all upstream commits from v1.10.0 through v1.20.5 (185 commits) via the 7-stage cherry-pick sync workflow, preserving fork identity and cross-platform support
- [ ] **SYNC-II-02**: Adopt upstream's modular gsd-tools architecture -- migrate from monolithic gsd-tools.js to 11 CJS domain modules in bin/lib/ (commands, config, core, frontmatter, init, milestone, phase, roadmap, state, template, verify)
- [x] **SYNC-II-03**: Migrate esbuild bundling pipeline to produce self-contained dist files from the new modular gsd-tools structure (copy-mode install must continue to work)
- [ ] **SYNC-II-04**: Preserve fork identity through sync -- all branding (GetStuffDone/GSD), URLs (chudeemeke/get-stuff-done), package name (@chude/get-stuff-done), and custom assets remain intact
- [ ] **SYNC-II-05**: Maintain test suite through sync -- 563+ tests passing at 95%+ coverage, CI matrix green on all 3 platforms
- [ ] **SYNC-II-06**: Document upstream approach comparison report -- where fork and upstream solved the same problem differently, document both approaches and rationale for chosen direction

### Sync Workflow - Core UX

- [ ] **SYNC-01**: Colorized diff preview before cherry-picks -- user can visually review what each commit changes with syntax-highlighted diffs before accepting
- [ ] **SYNC-02**: State snapshots and rollback -- sync workflow creates restore points before each cherry-pick batch, enabling rollback to last known-good state on failure
- [ ] **SYNC-03**: Auto-update check with severity indicators -- periodic check for new upstream commits, categorized by severity (breaking, feature, fix, chore) with visual summary
- [ ] **SYNC-04**: --dry-run mode for sync operations -- preview the full sync plan (commits to cherry-pick, predicted conflicts, estimated effort) without modifying the working tree

### Sync Workflow - Advanced Automation

- [ ] **SYNC-07**: GPG verification of upstream commits -- validate commit signatures when available, warn on unsigned commits in security-sensitive paths
- [ ] **SYNC-08**: Auto-categorization of upstream changes -- classify each commit as feature/fix/refactor/docs/chore using commit message parsing and file path analysis
- [ ] **SYNC-09**: Selective sync -- allow cherry-picking specific categories or individual commits instead of all-or-nothing, with dependency tracking between related commits
- [ ] **SYNC-10**: AI-assisted conflict resolution -- when cherry-pick conflicts arise, use Claude to analyze both sides, suggest resolutions that preserve fork identity, and explain the conflict context

### Post-Sync Assessment

- [x] **ASSESS-01**: Evaluate CLAUDE-06 (agent teams orchestration) against upstream's auto-advance pipeline -- determine if full parallel execution is still needed, what scope remains, or if auto-advance is sufficient
- [x] **ASSESS-02**: Evaluate PLAT-07 (interactive diff viewer) and PLAT-08 (multi-upstream support) against upstream's current diff/review workflow -- determine scope and priority

## Conditional Requirements

These requirements activate based on ASSESS-01 and ASSESS-02 outcomes. Scope TBD after upstream sync.

### Agent Teams (if ASSESS-01 determines scope remains)

- [ ] **CLAUDE-06**: Full agent teams orchestration for parallel phase execution -- scope to be defined post-assessment

### Platform (if ASSESS-02 determines value)

- [ ] **PLAT-07**: Interactive diff viewer for sync review
- [ ] **PLAT-08**: Multi-upstream support for tracking multiple fork sources

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing GSD's core workflow methodology | This is an adaptation, not a rewrite |
| TypeScript migration | Adds build complexity for marginal benefit |
| Fast mode integration (CLAUDE-04) | Marginal benefit per v0.2.0 CONTEXT.md |
| Bash-to-Claude-tools migration (CLAUDE-05) | Bash has valid advantages per v0.2.0 CONTEXT.md |
| Auto-applying upstream updates | Destroys user control -- manual review is the point |
| OpenCode/Gemini/Mistral installer support | Upstream added these but fork is Claude Code-only |
| Codex integration | Upstream tried and reverted -- confirmed not ready |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-II-01 | Phase 18 | Pending |
| SYNC-II-02 | Phase 18 | Pending |
| SYNC-II-03 | Phase 19 | Complete |
| SYNC-II-04 | Phase 18 | Pending |
| SYNC-II-05 | Phase 18 | Pending |
| SYNC-II-06 | Phase 18 | Pending |
| SYNC-01 | Phase 20 | Pending |
| SYNC-02 | Phase 20 | Pending |
| SYNC-03 | Phase 21 | Pending |
| SYNC-04 | Phase 20 | Pending |
| SYNC-07 | Phase 21 | Pending |
| SYNC-08 | Phase 21 | Pending |
| SYNC-09 | Phase 22 | Pending |
| SYNC-10 | Phase 22 | Pending |
| ASSESS-01 | Phase 19 | Complete |
| ASSESS-02 | Phase 19 | Complete |

**Coverage:**
- v0.3.0 requirements: 16 total (+ 3 conditional)
- Mapped to phases: 16
- Unmapped: 0
- Conditional: 3 (pending assessment)

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after initial definition*
