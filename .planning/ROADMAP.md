# Roadmap: GetStuffDone

## Milestones

- [x] **v0.1.0 GetStuffDone Fork** -- Phases 1-6 (shipped 2026-02-05) [archived](milestones/v0.1.0-ROADMAP.md)
- [ ] **v0.2.0 Hardening & Upstream Sync** -- Phases 7-17 (12 original + 5 gap closure)

## Overview

v0.2.0 establishes production-grade quality through security hardening, upstream sync, cross-platform support, and modern Claude Code integration. The roadmap follows a security-first dependency chain: audit and harden the codebase, sync upstream changes (using Phase 7 security tools for safe execution), enable cross-platform support on the synced codebase, adopt Claude Code 2026 capabilities, and optionally add CI/CD automation. This milestone transforms GSD from a working fork into a reliable, maintainable tool that safely tracks upstream while preserving distinct identity.

## Phases

**Phase Numbering:**
- Integer phases (7-11): Planned milestone work
- Decimal phases (e.g., 7.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 7: Security Hardening & Tooling** - Establish security baseline for upstream sync
- [x] **Phase 8: Upstream Sync** - Pull latest upstream changes with integrated safety tooling
- [x] **Phase 9: Cross-Platform Foundation** - Enable macOS and Linux support (completed 2026-02-09)
- [x] **Phase 10: Claude Code Capability Adoption** - Leverage Opus 4.6 features (completed 2026-02-15)
- [x] **Phase 11: CI/CD** - Automate cross-platform testing (completed 2026-02-16)
- [x] **Phase 12: Missing Workflows** - Create 16 missing workflow files for GSD commands (completed 2026-02-18)
- [ ] **Phase 15: gsd-tools.js Bundling [GAP CLOSURE]** - Fix post-install MODULE_NOT_FOUND for validation require
- [ ] **Phase 16: Platform Quality & Cleanup [GAP CLOSURE]** - Coverage to 95%, cross-platform testing, dead code removal
- [ ] **Phase 17: Agent Teams Wiring [GAP CLOSURE]** - Wire team templates into workflows with config-driven routing

## Phase Details

### Phase 7: Security Hardening & Tooling
**Goal**: Establish security baseline that prevents arbitrary code execution during upstream sync operations

**Depends on**: Nothing (first phase of milestone)

**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06

**Success Criteria** (what must be TRUE):
  1. User cannot cherry-pick upstream commits without reviewing diff and explicitly approving changes
  2. Malformed git SHAs, branch names with shell metacharacters, and config paths with traversal patterns are rejected with clear error messages
  3. All shell commands in hooks and installer use parameterized arguments (no string concatenation or eval)
  4. ESLint with security plugin runs clean on all JavaScript files with zero violations
  5. Publish workflow aborts if git conflict markers are detected in tracked files
  6. Config files are automatically re-validated after upstream sync applies changes

**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md -- Input validation module and ESLint security configuration
- [x] 07-02-PLAN.md -- Shell command hardening and pre-publish conflict marker check
- [x] 07-03-PLAN.md -- Upstream sync security review checkpoint and config re-validation

---

### Phase 8: Upstream Sync
**Goal**: Pull latest upstream changes from glittercowboy/get-shit-done (through latest release), integrate all features, and build sync safety tooling needed for confident execution

**Depends on**: Phase 7 (security validation, SHA checks, diff review, conflict detection)

**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06

**Success Criteria** (what must be TRUE):
  1. All upstream features through latest release are successfully integrated (gsd-tools.js, thin orchestrator, context optimization, Gemini CLI, git branching, test infrastructure, and all bug fixes)
  2. Upstream features take priority over fork-specific implementations where conflicts exist
  3. Phase 7 security tools (diff review, SHA validation, conflict detection, ESLint) used throughout sync process
  4. Safety tooling built as needed: state snapshots before destructive operations, diff preview for cherry-picks
  5. All cherry-picked changes pass ESLint security validation with zero violations
  6. No unresolved conflicts remain and GSD fork identity (branding, naming) is preserved
  7. Workflow improvements documented based on real sync experience

**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md -- Sync infrastructure setup, manifest initialization, dry-run commit analysis
- [x] 08-02-PLAN.md -- Cherry-pick execution of all 72 upstream commits with safety tooling
- [x] 08-03-PLAN.md -- Branding pass, integration testing, sync report, merge to main

---

### Phase 9: Cross-Platform Foundation
**Goal**: Enable GSD to install, configure, and run identically on macOS, Linux, and Windows with automatic platform adaptation

**Depends on**: Phase 8 (upstream sync provides updated codebase including gsd-tools.js and architecture changes)

**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, PLAT-06

**Success Criteria** (what must be TRUE):
  1. All path operations work correctly on Windows (backslashes), macOS, and Linux without manual adjustments
  2. Platform detection correctly identifies OS, shell (bash/zsh/PowerShell/cmd), and environment (native, MINGW, Git Bash) with appropriate fallbacks
  3. Installer detects write permission failures and falls back gracefully (symlink -> junction -> copy) with user notification
  4. Hooks use Node.js exclusively (no bash dependencies) and work on all platforms without shell-specific configuration
  5. Installation, config loading, statusline display, and hook execution are verified working on macOS and Linux (manual test matrix)

**Plans**: 4 plans

Plans:
- [x] 09-01-PLAN.md -- Platform detection module and pathe dependency
- [x] 09-02-PLAN.md -- Rewrite bash launcher and pre-compact hook in Node.js
- [x] 09-03-PLAN.md -- gsd-tools.js cross-platform audit and installer hardening
- [x] 09-04-PLAN.md -- Integration verification and manual test matrix

---

### Phase 10: Claude Code Capability Adoption
**Goal**: Leverage Claude Opus 4.6 and Claude Code 2026 platform improvements for enhanced GSD orchestration

**Depends on**: Phase 9 (cross-platform codebase provides stable foundation for AI features)

**Requirements**: CLAUDE-01, CLAUDE-02, CLAUDE-03

**Success Criteria** (what must be TRUE):
  1. All 11 GSD agent definitions include memory protocol sections targeting `.planning/memory/` with shared-read/private-write access, and effort calibration with role-specific thinking depth hints
  2. Agent teams patterns are implemented with 4 team templates (plan-phase, execute-phase, upstream-sync, verify-work), 4 specialized oversight agents, subagent fallback paths, and soft cap of 8
  3. AskUserQuestion is integrated into 4 workflows (discuss-phase, verify-work, execute-phase, verify-phase) with structured options respecting tool constraints
  4. config.json controls memory, effort, and teams configuration with all user decisions reflected
  5. All Phase 10 artifacts exist in project source (publishable via npm), not only in installed location

**Plans**: 8 plans

Plans:
- [x] 10-01-PLAN.md -- Memory protocol scaffold and core agent enhancements (executor, verifier, planner, phase-researcher, plan-checker, debugger)
- [x] 10-02-PLAN.md -- Support agent enhancements (codebase-mapper, project-researcher, research-synthesizer, roadmapper, integration-checker)
- [x] 10-03-PLAN.md -- Team templates and specialized oversight agent definitions
- [x] 10-04-PLAN.md -- Workflow AskUserQuestion integration and config.json enhancement
- [x] 10-05-PLAN.md -- [GAP CLOSURE] Sync agent and team files from installed to project source
- [x] 10-06-PLAN.md -- [GAP CLOSURE] Installer teams/ handling and backup file cleanup
- [x] 10-07-PLAN.md -- [GAP CLOSURE] Sync workflow files from installed to project source
- [x] 10-08-PLAN.md -- [GAP CLOSURE] Replace hardcoded paths with portable paths in workflow source

---

### Phase 11: CI/CD (Stretch Goal)
**Goal**: Automate cross-platform testing to catch compatibility regressions before they reach users

**Depends on**: Phase 9 (cross-platform support must exist before automating tests)

**Requirements**: CI-01

**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow runs on every push and PR with matrix testing across macOS, Linux, and Windows
  2. Test suite validates installation, config loading, statusline rendering, and hook execution on all platforms
  3. CI reports pass/fail as signal (no branch protection or merge blocking)
  4. ESLint runs alongside tests with violations reported in CI output
  5. Workflow completes in under 5 minutes with bun dependency caching
  6. Source-to-installed parity check ensures all distributable artifacts exist in project source

**Plans**: 6 plans (5 original + 1 gap closure)

Plans:
- [x] 11-01-PLAN.md -- Test infrastructure setup (bun test config, helpers, fixtures, migrate gsd-tools tests)
- [x] 11-02-PLAN.md -- Unit tests for src/ modules (config, platform, validation, theme)
- [x] 11-03-PLAN.md -- Tests for hooks and launcher (gsd-check-update, gsd-statusline, pre-compact, gsd.js)
- [x] 11-04-PLAN.md -- Tests for installer (bin/install.js)
- [x] 11-05-PLAN.md -- GitHub Actions CI workflow, parity check script, and integration verification
- [x] 11-06-PLAN.md -- [GAP CLOSURE] Coverage gap closure for platform and theme modules

---

### Phase 12: Missing Workflows
**Goal**: Create all 16 missing workflow files referenced by GSD commands, resolving silent `@` reference failures

**Depends on**: Nothing (standalone infrastructure work)

**Requirements**: None (gap closure)

**Success Criteria** (what must be TRUE):
  1. All 16 missing workflow files exist in get-stuff-done/workflows/
  2. Each workflow matches its corresponding command's @ reference path
  3. Full test suite passes with no regressions
  4. Released and published to npm

**Plans**: 1 plan

Plans:
- [x] 12-01-PLAN.md -- Create all 16 missing workflow files (7 simple, 4 medium, 5 complex)

---

### Phase 13: Hook Bundling [GAP CLOSURE]
**Goal**: Fix hook imports so copy-mode installation works (GAP-1 from milestone audit)

**Depends on**: Nothing (standalone fix)

**Requirements**: None (gap closure from v0.2.0 audit)

**Audit Reference**: GAP-1 in v0.2.0-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. Hooks installed via copy-mode (`~/.claude/hooks/`) resolve all dependencies without MODULE_NOT_FOUND errors
  2. `pre-compact.js` functions correctly without `require('../src/platform/paths')`
  3. `gsd-statusline.js` functions correctly without `require('../src/theme')`, `require('../src/platform/terminal')`, `require('../src/config/ConfigLoader')`
  4. Dev-mode (`--link`) continues to work as before (no regression)
  5. `build-hooks.js` produces self-contained hook files

**Plans**: 1 plan

Plans:
- [x] 13-01-PLAN.md -- esbuild hook bundling and dist regression tests

---

### Phase 14: Security Wiring [GAP CLOSURE]
**Goal**: Wire orphaned validation module into production code and add config re-validation (GAP-2, GAP-3 from milestone audit)

**Depends on**: Nothing (standalone fix)

**Requirements**: SEC-01 (partial), SEC-02 (partial), SEC-06 (missing)

**Audit Reference**: GAP-2, GAP-3 in v0.2.0-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. `src/validation/index.js` functions are called by production code (gsd-tools.js) for git SHA, branch name, and config path validation
  2. Config files are re-validated after upstream sync cherry-picks (prepublishOnly or dedicated script)
  3. All 12 command files that reference AskUserQuestion include it in their `allowed-tools` list

**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md -- Validation module Result type migration and new validators
- [x] 14-02-PLAN.md -- Production validation wiring in gsd-tools.js and ConfigLoader.js
- [x] 14-03-PLAN.md -- Config re-validation script, prepublishOnly, AskUserQuestion audit

---

### Phase 15: gsd-tools.js Bundling [GAP CLOSURE]
**Goal**: Fix gsd-tools.js validation require path that breaks after installer copies to ~/.claude/

**Depends on**: Nothing (standalone fix)

**Requirements**: None (gap closure from v0.2.0 audit)

**Audit Reference**: GAP-1 in milestones/v0.2.0-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. `gsd-tools.js` resolves all `require()` calls correctly when installed to `~/.claude/get-stuff-done/bin/`
  2. `require('../../src/validation')` no longer produces MODULE_NOT_FOUND post-install
  3. Dev-mode (`--link`) continues to work as before (no regression)
  4. All existing tests pass with no regressions

**Plans**: 1 plan

Plans:
- [ ] 15-01-PLAN.md -- Unified build script consolidation, gsd-tools bundling, installer wiring, dist tests

---

### Phase 16: Platform Quality & Cleanup [GAP CLOSURE]
**Goal**: Bring platform module coverage to 95%+ WoW threshold, verify cross-platform functionality, and remove dead code

**Depends on**: Nothing (standalone fix)

**Requirements**: PLAT-06 (partial)

**Audit Reference**: GAP-2, GAP-3, GAP-4 in milestones/v0.2.0-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. `src/platform/detect.js` achieves 95%+ line coverage with mocked shell/environment detection branches
  2. `src/platform/terminal.js` achieves 95%+ line coverage including Windows Console Host edge case
  3. Cross-platform functionality verified through automated integration tests or documented manual testing
  4. `src/platform/index.js` either deleted (if dead code) or consumers refactored to use it
  5. All existing tests pass with no regressions

---

### Phase 17: Agent Teams Wiring [GAP CLOSURE]
**Goal**: Wire agent team templates into workflows with config-driven conditional routing (Phase 10 completion)

**Depends on**: Nothing (standalone fix)

**Requirements**: CLAUDE-03 (partial)

**Audit Reference**: GAP-5 in milestones/v0.2.0-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
  1. 4 workflows (execute-phase, plan-phase, upstream-sync, verify-work) read `teams.enabled` from config.json
  2. When `teams.enabled=true`, workflows spawn team using matching template + oversight agent
  3. When `teams.enabled=false`, workflows use existing sequential subagent fallback (no behavior change)
  4. Team templates are referenced by at least one workflow each
  5. All existing tests pass with no regressions

---

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Security Hardening & Tooling | 3/3 | Complete | 2026-02-08 |
| 8. Upstream Sync | 3/3 | Complete | 2026-02-08 |
| 9. Cross-Platform Foundation | 4/4 | Complete (UAT: 10/11 pass, 1 minor env quirk) | 2026-02-09 |
| 10. Claude Code Capability Adoption | 8/8 | Complete (re-verified 5/5, all gaps closed) | 2026-02-16 |
| 11. CI/CD | 6/6 | Complete (UAT: 6/7 pass, 1 coverage gap accepted -- platform lines limited by tooling, CI matrix covers natively) | 2026-02-16 |
| 12. Missing Workflows | 1/1 | Complete (16/16 workflows created, 355 tests pass, v2.1.3 released) | 2026-02-18 |
| 13. Hook Bundling [GAP] | 1/1 | Complete (6/6 verified, 366 tests pass) | 2026-02-18 |
| 14. Security Wiring [GAP] | 3/3 | Complete (UAT: 7/7 pass, 441 tests) | 2026-02-20 |
| 15. gsd-tools.js Bundling [GAP] | 0/1 | Planned | - |
| 16. Platform Quality & Cleanup [GAP] | 0/? | Not started | - |
| 17. Agent Teams Wiring [GAP] | 0/? | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-20*
