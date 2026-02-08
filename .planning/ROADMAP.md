# Roadmap: GetStuffDone

## Milestones

- [x] **v0.1.0 GetStuffDone Fork** -- Phases 1-6 (shipped 2026-02-05) [archived](milestones/v0.1.0-ROADMAP.md)
- [ ] **v0.2.0 Hardening & Upstream Sync** -- Phases 7-12

## Overview

v0.2.0 establishes production-grade quality through security hardening, cross-platform support, and enhanced upstream sync capabilities. The roadmap follows a security-first dependency chain: audit and harden the codebase, enable cross-platform verification, build sync safety features (diff preview, rollback, dry-run), execute upstream sync with improved workflow, adopt Claude Code 2026 capabilities, and optionally add CI/CD automation. This milestone transforms GSD from a working fork into a reliable, maintainable tool that safely tracks upstream while preserving distinct identity.

## Phases

**Phase Numbering:**
- Integer phases (7-12): Planned milestone work
- Decimal phases (e.g., 7.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 7: Security Hardening & Tooling** - Establish security baseline for upstream sync
- [ ] **Phase 8: Cross-Platform Foundation** - Enable macOS and Linux support
- [ ] **Phase 9: Sync Safety Features** - Add diff preview, rollback, dry-run
- [ ] **Phase 10: Upstream Sync Execution** - Pull latest changes, improve workflow
- [ ] **Phase 11: Claude Code Capability Adoption** - Leverage Opus 4.6 features
- [ ] **Phase 12: CI/CD** - Automate cross-platform testing (stretch goal)

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

### Phase 8: Cross-Platform Foundation
**Goal**: Enable GSD to install, configure, and run identically on macOS, Linux, and Windows with automatic platform adaptation

**Depends on**: Phase 7 (security validation used in path traversal protection)

**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, PLAT-06

**Success Criteria** (what must be TRUE):
  1. All path operations work correctly on Windows (backslashes), macOS, and Linux without manual adjustments
  2. Platform detection correctly identifies OS, shell (bash/zsh/PowerShell), and environment (WSL, MINGW) with appropriate fallbacks
  3. Installer detects write permission failures and falls back gracefully (junction on Windows, symlink on Unix, copy on permission denial)
  4. Hooks generate syntax appropriate for target shell (bash, zsh, PowerShell) without user configuration
  5. Installation, config loading, statusline display, and hook execution are verified working on macOS and Linux (manual test matrix)

**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

---

### Phase 9: Sync Safety Features
**Goal**: Provide confidence-building safety infrastructure for upstream sync through preview, rollback, and dry-run capabilities

**Depends on**: Phase 7 (security validation), Phase 8 (cross-platform utilities)

**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04

**Success Criteria** (what must be TRUE):
  1. User can preview colorized unified diff with file statistics before approving any cherry-pick operation
  2. State snapshots are created automatically before destructive sync operations and user can rollback to any snapshot with single command
  3. Statusline displays upstream update notifications with severity indicators (security/breaking/feature) fetched from package metadata
  4. All sync operations support --dry-run flag that shows what would change without applying modifications
  5. Rollback preserves local uncommitted changes (stash detection) and validates git state before restoring snapshot

**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD

---

### Phase 10: Upstream Sync Execution
**Goal**: Pull latest upstream changes and integrate workflow improvements discovered during actual sync execution

**Depends on**: Phase 9 (sync safety features enable confident execution)

**Requirements**: SYNC-05, SYNC-06

**Success Criteria** (what must be TRUE):
  1. Latest commits from upstream glittercowboy/get-shit-done are successfully cherry-picked using enhanced 7-stage workflow
  2. All new upstream features work correctly in chudeemeke/get-stuff-done fork after integration
  3. Workflow improvements are documented based on real sync experience (pain points, automation opportunities, edge cases)
  4. No conflicts are left unresolved and all cherry-picked changes pass ESLint security validation

**Plans**: TBD

Plans:
- [ ] 10-01: TBD

---

### Phase 11: Claude Code Capability Adoption
**Goal**: Leverage Claude Opus 4.6 and Claude Code 2026 platform improvements for enhanced GSD orchestration

**Depends on**: Phase 10 (stable codebase for testing AI features)

**Requirements**: CLAUDE-01, CLAUDE-02, CLAUDE-03, CLAUDE-04, CLAUDE-05

**Success Criteria** (what must be TRUE):
  1. GSD agent definitions include memory frontmatter with appropriate scope (user/project/local) and agents persist context across invocations
  2. Complex operations (upstream conflict resolution, breaking change detection) include extended thinking hints with effort parameter guidance
  3. Agent teams patterns are documented with examples for parallel orchestration (research agents + synthesizer + roadmapper)
  4. Fast mode integration is documented and GSD operations are flagged for fast execution where appropriate
  5. Bash file operations (find, grep, cat, sed) are replaced with Claude tools (Glob, Grep, Read, Edit) in commands and workflows

**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

---

### Phase 12: CI/CD (Stretch Goal)
**Goal**: Automate cross-platform testing to catch compatibility regressions before they reach users

**Depends on**: Phase 8 (cross-platform support must exist before automating tests)

**Requirements**: CI-01

**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow runs on every push with matrix testing across macOS, Linux, and Windows
  2. Test suite validates installation, config loading, statusline rendering, and hook execution on all platforms
  3. CI blocks merge if any platform fails tests or ESLint security violations are detected
  4. Workflow completes in under 5 minutes for fast feedback

**Plans**: TBD

Plans:
- [ ] 12-01: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Security Hardening & Tooling | 3/3 | Complete | 2026-02-08 |
| 8. Cross-Platform Foundation | 0/TBD | Not started | - |
| 9. Sync Safety Features | 0/TBD | Not started | - |
| 10. Upstream Sync Execution | 0/TBD | Not started | - |
| 11. Claude Code Capability Adoption | 0/TBD | Not started | - |
| 12. CI/CD | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-08*
