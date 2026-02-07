# Project Research Summary

**Project:** GetStuffDone (GSD) v0.2.0 Hardening & Cross-Platform Support
**Domain:** Meta-prompting CLI tool with git-based auto-update and spec-driven development for Claude Code
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

GSD v0.2.0 adds security hardening, cross-platform support (macOS/Linux/Windows), and enhanced upstream sync to the existing v0.1.0 foundation. Research confirms the current pure Node.js stack (stdlib + AJV + JSON5) remains solid. Recommended additions: security tooling (ESLint + security plugin, npm audit), cross-platform utilities (pathe, execa), and adoption of Claude Code's 2026 capabilities (Opus 4.6 with 1M context, extended thinking, agent teams).

The critical risk is **arbitrary code execution during upstream cherry-pick**. The 7-stage sync workflow pulls commits from an external repository without pre-validation, creating a vector for malicious code injection through hooks, installers, or shell scripts. Mitigation requires security review checkpoints, automated pattern scanning, and diff preview with explicit user approval before applying changes. Secondary risks include platform detection failures (Windows Git Bash MINGW layer, WSL hybrid environments) and symlink permission issues (Windows junctions vs Unix symlinks).

Recommended approach: Phase roadmap in security-first order (audit tooling → cross-platform foundation → sync safety features → UX improvements → AI integration). All additions are backward-compatible with v0.1.0. The existing hybrid architecture (Node.js CLI + shell workflows + markdown context system) requires no restructuring — new features integrate as modules and workflow enhancements.

## Key Findings

### Recommended Stack

The current v0.1.0 stack (Node.js >=16.7.0, AJV for config validation, JSON5 for human-friendly config, esbuild for hook bundling) is production-ready and should be preserved. Research recommends strategic additions for security, cross-platform compatibility, and developer experience without introducing runtime dependency bloat.

**Core technologies:**
- **bun (package manager)** — Migrate from npm to align with Anthropic's tooling standards; faster installs, native TypeScript support, compatible lockfile
- **ESLint + eslint-plugin-security** — Baseline code quality and security pattern detection (13 Node.js security patterns); minimally maintained but sufficient for static analysis
- **pathe + execa** — Cross-platform path handling and command execution; pathe normalizes paths to Unix format (avoiding backslash issues), execa provides promise-based API with automatic Windows/Unix compatibility
- **npm audit + Snyk** — Multi-layer dependency vulnerability scanning (audit free/built-in, Snyk optional for CI/CD); 60%+ of 2026 security incidents come from compromised dependencies

**What NOT to add:**
- TypeScript (adds build complexity for marginal benefit in simple Node.js tool)
- Heavy test frameworks (bun:test sufficient, Jest/Mocha overkill)
- Logging libraries (console.log adequate for CLI feedback)
- Lodash/Ramda (native JS methods sufficient)

### Expected Features

Research reveals a divide between **table stakes** (features users expect from professional CLI tools) and **differentiators** (Claude Opus 4.6 capabilities that set GSD apart). The upstream sync workflow dominates the feature landscape — most security and UX features cluster around making cherry-pick operations safe and transparent.

**Must have (table stakes):**
- **Cross-platform path handling** — Node.js CLIs must work on Windows/macOS/Linux without manual fixes; use path.join(), never string concatenation
- **Diff preview before sync** — Industry standard (terraform plan, kubectl diff); prevents destructive mistakes; users expect to see what will change
- **Dry-run mode** — Non-destructive preview operations build user confidence and AI agent compatibility
- **Signed commit verification** — Security-critical for cherry-pick workflows from external repos; verify GPG signatures before applying upstream commits
- **Rollback capability** — Failed updates must be reversible without data loss; git reflog-style snapshots with transaction-like validation

**Should have (competitive):**
- **Agent teams integration (Opus 4.6)** — Leverage Claude's parallel agent capabilities for complex tasks; could parallelize research/execution phases
- **Extended thinking with effort controls** — Adaptive reasoning for complex sync decisions and conflict resolution
- **1M token context window** — Process entire large repos or documentation sets in single context (Opus 4.6 beta feature)
- **Upstream change categorization** — Auto-classify upstream commits (breaking/feature/fix/chore) using Claude API for intelligent filtering
- **Interactive diff viewer** — GitHub-like diff UI in terminal or browser (tools like difit)

**Defer (v2+):**
- Multi-upstream support (very high complexity, requires workflow redesign)
- Sync conflict auto-resolution (AI-powered, requires change categorization first)
- Selective sync by category (depends on change categorization)
- Compaction (only needed if 7-stage sync exceeds context limits)

### Architecture Approach

GSD's existing hybrid architecture remains optimal for a meta-prompting CLI. The system combines Node.js modules (installer, config, theme, hooks) with shell-based workflows (orchestrated through Claude Code's Bash tool) and markdown-based context engineering (templates, references, commands). v0.2.0 features integrate at multiple layers without requiring structural refactoring.

**Major components:**
1. **Security validation layer** — New SecurityValidator module (`src/security/SecurityValidator.js`) providing input sanitization, registry whitelist validation, secret pattern detection, and package signature verification hooks
2. **Cross-platform utilities** — New PlatformUtils module with multi-tier platform detection (OS, shell, MINGW, WSL), path normalization, and shell command abstraction
3. **Update management** — Enhanced UpdateManager module extending existing `gsd-check-update.js` hook with package metadata fetching, changelog parsing, and severity indicators
4. **Diff rendering** — New DiffRenderer module integrating with theme system for ANSI-colorized git diff output with terminal width detection
5. **Rollback management** — New RollbackManager module maintaining rollback history (`.planning/rollback/history.json`), git-based snapshots, and transaction-like validation

**Integration points:**
- Security validation integrates with ConfigSchema (new security settings), installer (source integrity checks), and upstream-sync workflow (Stage 2 security review checkpoint)
- Cross-platform utilities replace direct path/child_process usage throughout codebase
- Diff rendering adds Stage 2b checkpoint to upstream-sync workflow (DIFF_PREVIEW between user selection and execution)
- Rollback creates snapshots at workflow Stage 6a (before publish) with soft reset default (preserves working directory changes)

### Critical Pitfalls

Research identifies 14 domain-specific pitfalls (4 critical, 5 moderate, 5 minor) across security, cross-platform compatibility, git operations, and shell environments. The top critical pitfalls represent immediate risks requiring Phase 1 mitigation.

1. **Arbitrary code execution in upstream cherry-pick** — Malicious commits containing shell commands in hooks/installers execute without user review; mitigate with security review checkpoints, automated pattern scanning (eval, exec, network requests, file writes to sensitive locations), upstream URL verification, and sandboxed testing
2. **Platform detection failures in Windows Git Bash (MINGW)** — process.platform returns 'win32' but environment is POSIX with path translation; mitigate with multi-tier detection (OS + shell + MSYSTEM env var + WSL check), always use path.join(), test shell command compatibility
3. **Non-interactive shell environment in Claude Code Bash tool** — Hooks assume interactive shell with .bashrc environment (aliases, functions, PATH); mitigate with explicit PATH/tool detection, avoid shell aliases, never use interactive commands, test hooks in Claude Code Bash tool
4. **Symlink permissions and junction limitations on Windows** — Regular symlinks require admin privilege; junctions only work for directories with absolute paths; mitigate with junction constraint enforcement, permission failure detection, absolute path normalization, link integrity verification
5. **Cherry-pick commit dependency chain breaks** — User selects commit B depending on earlier commit A (not selected); git applies without file conflict but runtime breaks; mitigate with chronological commit presentation, bulk selection options, post-cherry-pick verification

## Implications for Roadmap

Based on combined research, recommended phase structure prioritizes security foundations before cross-platform expansion, then builds safety features (diff preview, rollback) before UX polish. This ordering ensures every subsequent phase operates on a hardened, validated base.

### Phase 1: Security Hardening & Tooling
**Rationale:** Security vulnerabilities in upstream sync represent critical risk (arbitrary code execution). Must establish security baseline before any git operations or cross-platform testing. ESLint + security plugin provides static analysis foundation for all subsequent code.

**Delivers:**
- SecurityValidator module with input sanitization, registry validation, secret detection
- ESLint + eslint-plugin-security configuration with custom rules for GSD patterns
- npm audit baseline scan with documented remediation plan
- Enhanced upstream-sync.md workflow with Stage 2 security review checkpoint

**Addresses (from FEATURES.md):**
- Signed commit verification (table stakes)
- Auto-update security indicators (differentiator)

**Avoids (from PITFALLS.md):**
- Pitfall 1: Arbitrary code execution in cherry-pick workflow
- Pitfall 11: Conflict markers left in files
- Pitfall 14: Config JSON5 not validated during sync

**Research flags:** Standard patterns (ESLint, npm audit well-documented). Skip phase-specific research.

---

### Phase 2: Cross-Platform Foundation
**Rationale:** Platform detection and path handling underpin all subsequent features. Installer, hooks, and workflows must work identically on macOS/Linux/Windows before adding complex features like diff preview or rollback. Dependencies on Phase 1 security validation for path traversal protection.

**Delivers:**
- PlatformUtils module with multi-tier detection (OS, shell, MINGW, WSL)
- pathe integration replacing all path operations
- execa integration replacing child_process.spawn() for git commands
- Enhanced installer with platform-specific link/copy fallback logic
- Cross-platform test matrix (Windows Git Bash, macOS, Linux, WSL)

**Uses (from STACK.md):**
- pathe (cross-platform path normalization)
- execa (promise-based cross-platform command execution)
- Node.js path, os, process.platform built-ins

**Addresses (from FEATURES.md):**
- Cross-platform path handling (table stakes)
- Platform detection (table stakes)
- Permission validation (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 2: Platform detection failures in MINGW
- Pitfall 3: Non-interactive shell environment issues
- Pitfall 4: Symlink permission and junction limitations
- Pitfall 9: WSL detection missed by process.platform

**Research flags:** Needs testing on all target platforms (manual verification matrix). Skip research-phase (patterns well-documented in cross-platform Node.js guides).

---

### Phase 3: Sync Safety Features (Diff Preview + Rollback)
**Rationale:** Diff preview and rollback represent safety infrastructure for upstream sync workflow. Preview prevents accidental destructive changes; rollback provides recovery path when changes fail. Both features must exist before enabling auto-update notifications (Phase 4) which encourage users to sync more frequently. Dependencies on Phase 1 security validation and Phase 2 cross-platform utilities.

**Delivers:**
- DiffRenderer module with ANSI colorization via theme system
- Enhanced upstream-sync workflow with Stage 2b DIFF_PREVIEW checkpoint
- RollbackManager module with snapshot creation, git-based rollback, history pruning
- Snapshot transaction pattern (validate → dry-run → apply → verify → commit or rollback)
- New commands: `/gsd:preview-diff`, `/gsd:rollback`

**Uses (from STACK.md):**
- Existing theme system (Style Composer pattern)
- Git CLI for diff generation and reset operations
- Node.js fs for snapshot directory management

**Addresses (from FEATURES.md):**
- Diff preview before sync (table stakes)
- Rollback capability (table stakes)
- Dry-run mode (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 5: Cherry-pick dependency chain breaks (post-rollback verification)
- Pitfall 7: Diff preview timeouts on large changes (progressive disclosure)
- Pitfall 8: Rollback breaks when local changes exist (stash detection)

**Research flags:** Standard patterns (git diff, git reset well-documented). Skip research-phase.

---

### Phase 4: Auto-Update Enhancement
**Rationale:** Enhanced update notifications improve discoverability of upstream changes, but only safe to promote frequent syncing after diff preview + rollback (Phase 3) exist. Builds on existing `gsd-check-update.js` hook infrastructure. Dependencies on Phase 1 security validation (registry checks), Phase 2 cross-platform utilities (path handling).

**Delivers:**
- UpdateManager module with npm metadata fetching, changelog parsing
- Enhanced cache format with security_fixes and breaking_changes indicators
- Statusline severity display (security icon, breaking change warning)
- Config extensions: updates.check_interval, updates.auto_check
- Rate limit handling with exponential backoff

**Uses (from STACK.md):**
- npm CLI for package metadata
- Existing statusline hook for display
- Background spawn pattern (detached process, unref)

**Addresses (from FEATURES.md):**
- Auto-update notifications (table stakes)
- Visual progress with ETA (differentiator, extends statusline)

**Avoids (from PITFALLS.md):**
- Pitfall 6: Upstream notification stale state (multi-stage cache updates)
- Pitfall 13: Auto-update rate limiting GitHub API (cache with TTL, authenticated requests)

**Research flags:** Standard patterns (npm view, GitHub API well-documented). Skip research-phase.

---

### Phase 5: Claude Code Capability Adoption
**Rationale:** Leverage Claude Opus 4.6's 2026 improvements (extended thinking, agent teams, 1M context) after core functionality stable. AI integration represents optimization, not foundation — defer until Phases 1-4 complete. This phase primarily updates orchestrator prompts and workflows to utilize new API parameters.

**Delivers:**
- Extended thinking integration for upstream conflict resolution (effort controls)
- Updated orchestrator prompts leveraging improved agentic coding (better planning)
- Agent teams evaluation for research phase parallelization (stretch goal)
- Documentation of Claude Code 2026 feature adoption patterns

**Uses (from STACK.md):**
- Claude Opus 4.6 API (extended thinking, adaptive effort, 1M context beta)
- Existing orchestrator workflow architecture
- Task tool for subagent spawning

**Addresses (from FEATURES.md):**
- Extended thinking with effort controls (differentiator)
- Upstream change categorization (differentiator, AI-powered)
- Agent teams integration (differentiator, stretch goal)

**Avoids (from PITFALLS.md):**
- No new pitfalls introduced (API-level features, no architecture changes)

**Research flags:** Needs prompt engineering research for optimal effort parameter usage. Run `/gsd:research-phase` for Phase 5 to explore extended thinking best practices and agent teams orchestration patterns.

---

### Phase Ordering Rationale

**Security first (Phase 1):** Arbitrary code execution risk in upstream sync is critical. Every subsequent phase assumes secure validation layer exists. Delaying security creates vulnerability window.

**Platform foundation second (Phase 2):** Path handling and platform detection affect all components (installer, hooks, workflows). Cross-platform compatibility must be universal before feature additions. Testing burden increases exponentially if added late.

**Safety features third (Phase 3):** Diff preview and rollback make upstream sync safe and confidence-building. These features enable subsequent phases to encourage more frequent syncing (auto-update notifications in Phase 4). Transaction-like validation pattern establishes reliability baseline.

**User experience fourth (Phase 4):** Enhanced update notifications drive engagement with upstream sync, but only safe to promote after safety features (Phase 3) exist. Statusline enhancements are polish, not foundation.

**AI optimization fifth (Phase 5):** Claude Code 2026 capabilities represent performance improvements and workflow automation, not core functionality. Deferring to final phase allows testing with stable codebase and real-world sync scenarios to inform prompt engineering.

**Dependency chain:** Phase 1 → Phase 2 (security validation used in path traversal protection) → Phase 3 (security + cross-platform used in diff/rollback) → Phase 4 (all previous phases) → Phase 5 (optional, no blockers).

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Claude Code Capability Adoption)** — Prompt engineering for extended thinking and agent teams orchestration patterns are evolving; official docs sparse; needs experimentation with effort parameters, context management, and team coordination

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Security Hardening)** — ESLint configuration, npm audit, input sanitization well-documented in Node.js security best practices
- **Phase 2 (Cross-Platform)** — Node.js cross-platform guides comprehensive; pathe/execa docs clear; established patterns
- **Phase 3 (Sync Safety)** — Git diff/reset operations standard; rollback patterns documented in DevOps literature; transaction model common in DB/API domains
- **Phase 4 (Auto-Update)** — npm registry API well-documented; update notification patterns established in CLI tool domain

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified with official sources (Anthropic blog, npm packages, Node.js docs); pathe/execa proven in cross-platform projects; ESLint security plugin has 1.5M weekly downloads despite minimal maintenance |
| Features | HIGH | Table stakes validated against industry CLIs (terraform, kubectl, gh); Claude Opus 4.6 capabilities from official Anthropic release notes; feature dependencies mapped to architecture |
| Architecture | HIGH | Existing v0.1.0 architecture documented in codebase; integration points identified in source code analysis; hybrid model (Node.js + shell + markdown) proven in v0.1.0; new components follow existing patterns |
| Pitfalls | HIGH | Security vulnerabilities confirmed with CVE references (CVE-2025-68145, CVE-2025-48384); cross-platform issues verified in GitHub issues (npm/npm#18499, anthropics/claude-code#9881); platform detection patterns from cross-platform Node.js guide |

**Overall confidence:** HIGH

Research sourced from official documentation (Anthropic, Node.js, npm), industry security reports (OWASP, CVE databases), and proven cross-platform Node.js guides. All critical pitfalls have real-world precedent with documented mitigations. Stack recommendations align with Anthropic's tooling (bun) and 2026 security standards (60%+ incidents from dependencies). Architecture approach preserves existing v0.1.0 foundation while adding modular enhancements.

### Gaps to Address

**Agent teams orchestration patterns** — Claude Code 2026 feature documentation shows examples (C compiler build) but lacks comprehensive orchestration patterns for meta-prompting workflows. During Phase 5 planning, experiment with parallel subagent spawning patterns: research agents (stack, features, architecture, pitfalls) → synthesizer agent (summary) → roadmapper agent. Document orchestration checkpoints and context handoff patterns.

**Windows Developer Mode detection** — Research didn't identify reliable method to detect if Windows Developer Mode enabled (allows symlinks without admin). Current approach (try symlink, fall back to junction) works but could optimize by pre-checking. During Phase 2 implementation, investigate `REG QUERY` for Developer Mode registry key or PowerShell `Get-WindowsOptionalFeature` API.

**Extended thinking effort parameter calibration** — Opus 4.6 adaptive thinking uses contextual clues, but optimal prompt patterns for effort control unclear. During Phase 5 planning, run `/gsd:research-phase` to explore: when to request high effort (conflict resolution, breaking change detection) vs low effort (simple cherry-pick), how to phrase prompts for adaptive thinking, whether to make effort user-configurable.

**Cross-platform test automation** — Research identified test matrix (Windows Git Bash, macOS, Linux, WSL, shells, Node.js versions) but didn't specify CI/CD implementation. During Phase 2 planning, decide: GitHub Actions matrix (free tier limits), manual verification checklist, or hybrid approach. Document in `.planning/testing/cross-platform-matrix.md`.

## Sources

### Primary (HIGH confidence)

**Claude Code & Opus 4.6:**
- [Introducing Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6) — Model capabilities (1M context, extended thinking, agent teams)
- [Claude Code Overview](https://code.claude.com/docs/en/overview) — Platform features and tool architecture
- [What's New in Claude 4.6](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6) — API parameters and benchmarks
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Agent orchestration patterns

**Security:**
- [Node.js Security Best Practices 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160) — Dependency vulnerabilities (60%+ incidents)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) — Input validation, command injection prevention
- [Anthropic MCP Git Server Vulnerabilities](https://www.infosecurity-magazine.com/news/prompt-injection-bugs-anthropic/) — CVE-2025-68145, CVE-2025-68143, CVE-2025-68144
- [Git CVE-2025-48384 RCE](https://www.helpnetsecurity.com/2025/08/26/git-vulnerability-exploited-cve-2025-48384/) — Git bundle protocol injection

**Cross-Platform Node.js:**
- [Cross-Platform Node.js Guide: Symlinks](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/symlinks.md) — Junction vs symlink, permission handling
- [Cross-Platform Node.js Guide: File Paths](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/file_paths.md) — Path normalization, separators
- [Awesome Cross-Platform Node.js](https://github.com/bcoe/awesome-cross-platform-nodejs) — Tool recommendations (pathe, execa)
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) — CLI design patterns

**Git Operations:**
- [Git Cherry Pick - Atlassian Tutorial](https://www.atlassian.com/git/tutorials/cherry-pick) — Cherry-pick workflow and conflict handling
- [How LinkedIn Automates Cherry-Picking Commits](https://www.linkedin.com/blog/engineering/developer-experience-productivity/how-linkedin-automates-cherry-picking-commits-to-improve-develop) — Dependency detection patterns
- [Git Diff Documentation](https://git-scm.com/docs/git-diff) — Diff generation options

### Secondary (MEDIUM confidence)

**Tooling:**
- [A Practical Guide to Execa for Node.js](https://betterstack.com/community/guides/scaling-nodejs/execa-cli/) — Cross-platform command execution
- [GitHub: unjs/pathe](https://github.com/unjs/pathe) — Modern ESM path handling
- [Comparing npm audit with Snyk](https://nearform.com/insights/comparing-npm-audit-with-snyk/) — Dependency scanning strategies

**CLI Patterns:**
- [In Praise of --dry-run](https://henrikwarne.com/2026/01/31/in-praise-of-dry-run/) — Dry-run mode benefits
- [CLI Tools That Support Previews and Dry Runs](https://nickjanetakis.com/blog/cli-tools-that-support-previews-dry-runs-or-non-destructive-actions) — Industry examples

**Platform-Specific Issues:**
- [Windows Git Bash MINGW Path Translation Issues](https://github.com/npm/npm/issues/18499) — MINGW path conversion pitfalls
- [Claude Code Bash Tool Non-Interactive Mode](https://github.com/anthropics/claude-code/issues/581) — Environment persistence limitations
- [Node.js Symlink Admin Requirements](https://github.com/nodejs/node/issues/47783) — Windows symlink permissions

### Tertiary (LOW confidence - needs validation)

**Emerging Patterns:**
- [Building a C Compiler with Agent Teams](https://www.anthropic.com/engineering/building-c-compiler) — Agent teams example (complex domain, GSD patterns may differ)
- [Claude Prompt Engineering 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) — Extended thinking patterns (community guide, not official)

---

*Research completed: 2026-02-07*
*Ready for roadmap: yes*
