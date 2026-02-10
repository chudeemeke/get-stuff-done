# Roadmap: GetStuffDone

## Milestones

- [x] **v0.1.0 GetStuffDone Fork** -- Phases 1-6 (shipped 2026-02-05) [archived](milestones/v0.1.0-ROADMAP.md)
- [ ] **v0.2.0 Hardening & Upstream Sync** -- Phases 7-11

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
- [ ] **Phase 10: Claude Code Capability Adoption** - Leverage Opus 4.6 features
- [ ] **Phase 11: CI/CD** - Automate cross-platform testing (stretch goal)

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

**Requirements**: CLAUDE-01, CLAUDE-02, CLAUDE-03, CLAUDE-04, CLAUDE-05

**Success Criteria** (what must be TRUE):
  1. GSD agent definitions include memory frontmatter with appropriate scope (user/project/local) and agents persist context across invocations
  2. Complex operations (upstream conflict resolution, breaking change detection) include extended thinking hints with effort parameter guidance
  3. Agent teams patterns are documented with examples for parallel orchestration (research agents + synthesizer + roadmapper)
  4. Fast mode integration is documented and GSD operations are flagged for fast execution where appropriate
  5. Bash file operations (find, grep, cat, sed) are replaced with Claude tools (Glob, Grep, Read, Edit) in commands and workflows

**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

---

### Phase 11: CI/CD (Stretch Goal)
**Goal**: Automate cross-platform testing to catch compatibility regressions before they reach users

**Depends on**: Phase 9 (cross-platform support must exist before automating tests)

**Requirements**: CI-01

**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow runs on every push with matrix testing across macOS, Linux, and Windows
  2. Test suite validates installation, config loading, statusline rendering, and hook execution on all platforms
  3. CI blocks merge if any platform fails tests or ESLint security violations are detected
  4. Workflow completes in under 5 minutes for fast feedback

**Plans**: TBD

Plans:
- [ ] 11-01: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Security Hardening & Tooling | 3/3 | Complete | 2026-02-08 |
| 8. Upstream Sync | 3/3 | Complete | 2026-02-08 |
| 9. Cross-Platform Foundation | 4/4 | Complete (UAT: 10/11 pass, 1 minor env quirk) | 2026-02-09 |
| 10. Claude Code Capability Adoption | 0/TBD | Not started | - |
| 11. CI/CD | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-09*
