# Roadmap: GetStuffDone

## Milestones

- v0.1.0 **GetStuffDone Fork** -- Phases 1-6 (shipped 2026-02-05)
- v0.2.0 **Hardening & Upstream Sync** -- Phases 7-17 (shipped 2026-02-21)
- v0.3.0 **Upstream Sync & Workflow Maturity** -- Phases 18-23 (shipped 2026-03-08)
- v0.4.0 **Platform Expansion** -- Phases 24-28 (in progress)

## Phases

<details>
<summary>v0.1.0 GetStuffDone Fork (Phases 1-6) -- SHIPPED 2026-02-05</summary>

See: .planning/milestones/v0.1.0-ROADMAP.md

</details>

<details>
<summary>v0.2.0 Hardening & Upstream Sync (Phases 7-17) -- SHIPPED 2026-02-21</summary>

See: .planning/milestones/v0.2.0-ROADMAP.md

</details>

<details>
<summary>v0.3.0 Upstream Sync & Workflow Maturity (Phases 18-23) -- SHIPPED 2026-03-08</summary>

See: .planning/milestones/v0.3.0-ROADMAP.md

</details>

### v0.4.0 Platform Expansion (In Progress)

**Milestone Goal:** Verify existing work, sync 158 upstream commits (v1.20.6-v1.22.4), and deliver multi-runtime installer support (Codex, OpenCode, Gemini) with fork branding.

- [ ] **Phase 24: Quality Verification & Bug Fixes** - Retroactive UAT for Phases 6/21/22, fix claudeToGeminiTools ReferenceError, address audit findings
- [ ] **Phase 25: Upstream Sync Execution** - Cherry-pick 158 commits (v1.20.6-v1.22.4) including multi-runtime code, Windows fixes, and quality features
- [ ] **Phase 26: Post-Sync Stabilization** - Restore test suite health, maintain 825+ tests at 95%+ coverage per metric
- [ ] **Phase 27: Multi-Runtime Integration** - Wire Codex, OpenCode, and Gemini installer paths with correct tool mapping
- [ ] **Phase 28: Multi-Runtime Polish** - Fork branding per runtime, CI matrix expansion, documentation updates

## Phase Details

### Phase 24: Quality Verification & Bug Fixes
**Goal**: Confirm Phases 6, 21, and 22 actually work as specified, and fix known defects before building on top of them
**Depends on**: Nothing (first phase of v0.4.0)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. Logo SVG and PNG assets render correctly in terminal and documentation contexts; installer deploys them to target directory
  2. Commit classification correctly categorizes upstream commits by type (fix/feat/refactor) and severity; supply chain scanner detects known attack vectors; severity-aware statusline displays correct color thresholds
  3. Selective sync filters commits by category with correct dependency detection; AI conflict resolution produces merge-ready suggestions that preserve fork identity
  4. `node install.js` completes without ReferenceError on the claudeToGeminiTools code path
  5. Codebase audit findings addressed (specific items determined by audit results)
**Plans**: 4 plans
- [ ] 24-01-PLAN.md -- Fix claudeToGeminiTools ReferenceError + Phase 6 Logo UAT
- [ ] 24-02-PLAN.md -- Phase 21 Sync Intelligence UAT + Phase 22 Sync Automation UAT
- [ ] 24-03-PLAN.md -- Test coverage for config.cjs and frontmatter.cjs (TDD)
- [ ] 24-04-PLAN.md -- Test coverage for template.cjs and core.cjs (TDD) + codebase audit

### Phase 25: Upstream Sync Execution
**Goal**: Integrate 158 upstream commits (v1.20.6-v1.22.4) into the fork, absorbing multi-runtime code, Windows fixes, and quality features while preserving fork identity
**Depends on**: Phase 24 (sync intelligence tools verified working before use)
**Requirements**: SYNC-III-01, SYNC-III-02, SYNC-III-04, SYNC-III-05, SYNC-III-06
**Success Criteria** (what must be TRUE):
  1. All 158 upstream commits are cherry-picked or accounted for (applied, skipped with reason, or conflict-resolved)
  2. Fork identity preserved: package.json name is @chude/get-stuff-done, all non-upstream URLs point to chudeemeke/get-stuff-done, branding-map.json entries applied
  3. Multi-runtime installer code from upstream (Codex skills-first, OpenCode path detection, Gemini hooks) is present in the codebase
  4. Upstream quality features (Nyquist validation, discuss-phase, agent frontmatter, context monitor) are functional
  5. Upstream Windows fixes (@file: protocol, toPosixPath, path separators) are integrated and passing on Windows CI
**Plans**: TBD

### Phase 26: Post-Sync Stabilization
**Goal**: Restore full test health after the sync, ensuring no regressions and coverage thresholds are maintained
**Depends on**: Phase 25
**Requirements**: SYNC-III-03
**Success Criteria** (what must be TRUE):
  1. 825+ tests pass across all platforms (macOS, Linux, Windows)
  2. Coverage meets 95%+ per metric (statements, branches, functions, lines) on production code
  3. No test failures related to sync-introduced changes (new upstream code has test coverage or is excluded from coverage)
**Plans**: TBD

### Phase 27: Multi-Runtime Integration
**Goal**: Make the upstream multi-runtime installer code work correctly for Codex, OpenCode, and Gemini with proper tool mapping
**Depends on**: Phase 26 (stable codebase with multi-runtime code present)
**Requirements**: RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04
**Success Criteria** (what must be TRUE):
  1. `node install.js --runtime codex` installs skills-first configuration with correct request_user_input mapping and multi-agent config
  2. `node install.js --runtime opencode` installs with correct config directory detection and flat command structure
  3. `node install.js --runtime gemini` installs with AfterTool hook events, TOML conversion guard, and agent conversion
  4. claudeToGeminiTools mapping table is defined and correctly translates tool names during Gemini installation
**Plans**: TBD

### Phase 28: Multi-Runtime Polish
**Goal**: Apply fork identity to each runtime's installer output, expand CI to test all runtimes, and update user-facing documentation
**Depends on**: Phase 27
**Requirements**: RUNTIME-05, RUNTIME-06, RUNTIME-07
**Success Criteria** (what must be TRUE):
  1. Each runtime's installed files contain fork-correct name, URLs, and package references (not upstream branding)
  2. CI matrix runs installer tests for Claude, Codex, OpenCode, and Gemini on all three platforms
  3. README and help text document multi-runtime support with installation examples per runtime
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 24 -> 25 -> 26 -> 27 -> 28

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Configuration System | v0.1.0 | 1/1 | Complete | 2026-01-30 |
| 2. Statusline Redesign | v0.1.0 | 5/5 | Complete | 2026-02-02 |
| 3. Installation Enhancements | v0.1.0 | 1/1 | Complete | 2026-02-02 |
| 4. Branding & URLs | v0.1.0 | 1/1 | Complete | 2026-02-03 |
| 5. Update Commands | v0.1.0 | 2/2 | Complete | 2026-02-04 |
| 6. Logo Assets | v0.1.0 | 2/2 | Complete | 2026-02-05 |
| 7. Security Hardening & Tooling | v0.2.0 | 3/3 | Complete | 2026-02-08 |
| 8. Upstream Sync | v0.2.0 | 3/3 | Complete | 2026-02-09 |
| 9. Cross-Platform Foundation | v0.2.0 | 4/4 | Complete | 2026-02-11 |
| 10. Claude Code Adoption | v0.2.0 | 8/8 | Complete | 2026-02-14 |
| 11. CI/CD | v0.2.0 | 6/6 | Complete | 2026-02-17 |
| 12. Missing Workflows | v0.2.0 | 1/1 | Complete | 2026-02-17 |
| 13. Hook Bundling | v0.2.0 | 1/1 | Complete | 2026-02-18 |
| 14. Security Wiring | v0.2.0 | 3/3 | Complete | 2026-02-19 |
| 15. GSD Tools Bundling | v0.2.0 | 1/1 | Complete | 2026-02-19 |
| 16. Platform Quality | v0.2.0 | 1/1 | Complete | 2026-02-20 |
| 17. Agent Teams Wiring | v0.2.0 | 1/1 | Complete | 2026-02-21 |
| 18. Upstream Sync Execution | v0.3.0 | 6/6 | Complete | 2026-02-23 |
| 19. Post-Sync Stabilization | v0.3.0 | 3/3 | Complete | 2026-02-23 |
| 20. Sync Safety & Transparency | v0.3.0 | 2/2 | Complete | 2026-02-23 |
| 21. Sync Intelligence | v0.3.0 | 3/3 | Complete | 2026-02-25 |
| 22. Advanced Sync Automation | v0.3.0 | 2/2 | Complete | 2026-03-07 |
| 23. v0.3.0 Gap Closure | v0.3.0 | 1/1 | Complete | 2026-03-08 |
| 24. Quality Verification & Bug Fixes | 2/4 | In Progress|  | - |
| 25. Upstream Sync Execution | v0.4.0 | 0/? | Not started | - |
| 26. Post-Sync Stabilization | v0.4.0 | 0/? | Not started | - |
| 27. Multi-Runtime Integration | v0.4.0 | 0/? | Not started | - |
| 28. Multi-Runtime Polish | v0.4.0 | 0/? | Not started | - |
