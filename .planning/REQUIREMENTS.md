# Requirements: GetStuffDone v0.2.0

**Defined:** 2026-02-07
**Core Value:** Maintain upstream compatibility while establishing distinct identity

## v1 Requirements

Requirements for v0.2.0 Hardening & Upstream Sync milestone. Each maps to roadmap phases.

### Security Hardening

- [ ] **SEC-01**: Security review checkpoint in upstream sync workflow blocks cherry-pick until user reviews diff and approves
- [ ] **SEC-02**: Input validation rejects malformed git commit SHAs, branch names with shell metacharacters, and config paths with traversal patterns
- [ ] **SEC-03**: All shell commands use parameterized arguments (no string concatenation), eval() is prohibited
- [ ] **SEC-04**: ESLint with eslint-plugin-security configured and passes on all hooks and installer code
- [ ] **SEC-05**: Publish is blocked if git diff --check detects conflict markers in tracked files
- [ ] **SEC-06**: JSON5 config files are re-validated with AJV after upstream sync cherry-picks are applied

### Cross-Platform Support

- [ ] **PLAT-01**: All path operations use cross-platform library (pathe) instead of string concatenation
- [ ] **PLAT-02**: Platform detection identifies OS (win32/darwin/linux), shell (bash/zsh/PowerShell), and environment (WSL, MINGW) with appropriate fallbacks
- [ ] **PLAT-03**: Filesystem operations validate write permissions before attempting modifications
- [ ] **PLAT-04**: Hook generation produces shell-appropriate syntax for bash, zsh, and PowerShell
- [ ] **PLAT-05**: Installer uses junctions on Windows (no admin) and symlinks on Unix, with automatic fallback to copy mode on permission failure
- [ ] **PLAT-06**: Install, config loading, statusline display, and hook execution verified working on macOS and Linux

### Upstream Sync Improvements

- [ ] **SYNC-01**: User can preview colorized unified diff with file statistics before approving cherry-picks
- [ ] **SYNC-02**: State snapshots are created before destructive sync operations and user can rollback to any snapshot
- [ ] **SYNC-03**: Auto-update check fetches package metadata and displays severity indicators (security/breaking/feature) in statusline
- [ ] **SYNC-04**: All sync operations support --dry-run mode that shows what would change without applying
- [ ] **SYNC-05**: Latest upstream changes are pulled and integrated using the sync workflow
- [ ] **SYNC-06**: Workflow improvements are implemented based on experience from actual sync execution

### Claude Code Capability Adoption

- [ ] **CLAUDE-01**: GSD agent definitions include memory frontmatter with appropriate scope (user/project/local)
- [ ] **CLAUDE-02**: Agent instructions include extended thinking hints with effort parameter guidance for complex operations
- [ ] **CLAUDE-03**: Agent teams patterns are explored and documented for parallel agent orchestration
- [ ] **CLAUDE-04**: Fast mode integration is documented and applicable GSD operations are flagged for fast execution
- [ ] **CLAUDE-05**: Bash file operations in commands and workflows are replaced with Claude tools (Glob, Grep, Edit) where appropriate

### CI/CD

- [ ] **CI-01**: GitHub Actions workflow runs cross-platform matrix testing on macOS, Linux, and Windows (stretch goal)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Advanced Sync

- **SYNC-07**: Signed commit verification (GPG) before cherry-pick apply
- **SYNC-08**: Upstream change auto-categorization (breaking/feature/fix/chore) using Claude analysis
- **SYNC-09**: Selective sync by category (apply only security fixes, skip features)
- **SYNC-10**: AI-powered conflict auto-resolution with user approval

### Advanced Platform

- **PLAT-07**: Interactive diff viewer (terminal or browser-based)
- **PLAT-08**: Multi-upstream support (sync from multiple source repos)

### Advanced Claude

- **CLAUDE-06**: Full agent teams orchestration for parallel research/execution phases

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting GSD core methodology | Fork adaptation, not a rewrite |
| Removing .upstream/ directory | Needed for diffing/comparison |
| TypeScript migration | Adds build complexity for marginal benefit in this codebase |
| Heavy testing frameworks | bun:test sufficient; Jest/Mocha overkill |
| Docker/containerization | GSD runs natively in Claude Code CLI |
| Server/HTTP layer | GSD is CLI-based, not server-based |
| Database/persistent storage | Filesystem (JSON config, git) is sufficient |
| Auto-applying upstream updates | Destroys user control; always require confirmation |
| Storing secrets in config | Security vulnerability for git-based config |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 7 | Pending |
| SEC-02 | Phase 7 | Pending |
| SEC-03 | Phase 7 | Pending |
| SEC-04 | Phase 7 | Pending |
| SEC-05 | Phase 7 | Pending |
| SEC-06 | Phase 7 | Pending |
| PLAT-01 | Phase 8 | Pending |
| PLAT-02 | Phase 8 | Pending |
| PLAT-03 | Phase 8 | Pending |
| PLAT-04 | Phase 8 | Pending |
| PLAT-05 | Phase 8 | Pending |
| PLAT-06 | Phase 8 | Pending |
| SYNC-01 | Phase 9 | Pending |
| SYNC-02 | Phase 9 | Pending |
| SYNC-03 | Phase 9 | Pending |
| SYNC-04 | Phase 9 | Pending |
| SYNC-05 | Phase 10 | Pending |
| SYNC-06 | Phase 10 | Pending |
| CLAUDE-01 | Phase 11 | Pending |
| CLAUDE-02 | Phase 11 | Pending |
| CLAUDE-03 | Phase 11 | Pending |
| CLAUDE-04 | Phase 11 | Pending |
| CLAUDE-05 | Phase 11 | Pending |
| CI-01 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24/24 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after roadmap creation*
