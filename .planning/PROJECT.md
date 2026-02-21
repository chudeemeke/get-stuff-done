# GetStuffDone (GSD Fork)

## What This Is

A personalized fork of GSD (Get Shit Done) by TACHES, rebranded as "Get Stuff Done" for the AI Dev Environment ecosystem. It's a meta-prompting, context engineering, and spec-driven development system for Claude Code with security hardening, cross-platform support (Windows/macOS/Linux), CI/CD testing, agent memory protocol, and team-based orchestration -- all while maintaining upstream compatibility.

## Core Value

**Maintain upstream compatibility while establishing distinct identity.** The fork should feel like "mine" while still being able to pull valuable improvements from the original GSD.

## Requirements

### Validated

- CONFIG-01 through CONFIG-04: Dynamic configuration system -- v0.1.0
- STATUS-01 through STATUS-09: Redesigned statusline with branding and thresholds -- v0.1.0
- INSTALL-01 through INSTALL-04: Hybrid installation (copy default, --link for dev) -- v0.1.0
- BRAND-01 through BRAND-05: Fork identity and URLs -- v0.1.0
- UPSTREAM-01 through UPSTREAM-10: Maintainer upstream sync workflow -- v0.1.0
- UPDATE-01 through UPDATE-04: Consumer update workflow -- v0.1.0
- LOGO-01 through LOGO-05: Custom logo and visual assets -- v0.1.0
- SEC-01 through SEC-06: Security hardening (validation, ESLint, parameterized commands, config re-validation) -- v0.2.0
- PLAT-01 through PLAT-06: Cross-platform support (pathe paths, platform detection, fallback chain) -- v0.2.0
- SYNC-05, SYNC-06: Upstream sync execution and workflow improvements -- v0.2.0
- CLAUDE-01 through CLAUDE-03: Agent memory, effort calibration, team patterns -- v0.2.0
- CI-01: GitHub Actions cross-platform matrix testing -- v0.2.0

### Active

(No active requirements -- next milestone not yet defined)

### Out of Scope

- Changing GSD's core workflow methodology -- this is an adaptation, not a rewrite
- Removing .upstream/ directory -- needed for diffing/comparison
- TypeScript migration -- adds build complexity for marginal benefit
- Fast mode integration (CLAUDE-04) -- marginal benefit per CONTEXT.md
- Bash-to-Claude-tools migration (CLAUDE-05) -- bash has valid advantages per CONTEXT.md
- Auto-applying upstream updates -- destroys user control

### Deferred

- SYNC-01: Colorized diff preview before cherry-picks
- SYNC-02: State snapshots and rollback
- SYNC-03: Auto-update check with severity indicators
- SYNC-04: --dry-run mode for sync operations
- SYNC-07 through SYNC-10: Advanced sync features (GPG verification, auto-categorization, selective sync, AI conflict resolution)
- PLAT-07, PLAT-08: Interactive diff viewer, multi-upstream support
- CLAUDE-06: Full agent teams orchestration for parallel phases

## Context

**Origin:** Forked from github.com/glittercowboy/get-shit-done v1.9.13
**Private repo:** github.com/chudeemeke/get-stuff-done
**Environment:** Windows with Git Bash, Claude Code CLI (cross-platform: macOS, Linux, Windows)
**Current version:** 2.2.0 (published to npm as @chude/get-stuff-done)
**Codebase:** ~24,862 LOC JavaScript, 563 tests
**Tech stack:** Node.js, JSON5/AJV config, esbuild bundling, bun:test, GitHub Actions CI, SVG assets, Claude Code hooks/skills/agents/teams

**Shipped in v0.1.0:**
- Nested JSON5 configuration with AJV validation
- Style Composer theme system for statusline
- Hybrid copy/link installer with metadata persistence
- 7-stage upstream cherry-pick sync workflow
- Isometric icon + pixel lockup visual identity (6 SVG, 24 PNG)

**Shipped in v0.2.0:**
- Security hardening: input validation module, ESLint security plugin, parameterized shell commands, config re-validation
- Upstream sync: 72 commits integrated from upstream with preserved fork identity
- Cross-platform: platform detection, pathe paths, symlink/junction/copy fallback chain
- Claude Code adoption: agent memory protocol, effort calibration, 4 team templates with config-driven workflow routing
- CI/CD: GitHub Actions cross-platform matrix, 563 tests at 95%+ coverage, source-to-installed parity checks
- Infrastructure: 16 missing workflows, esbuild hook/tool bundling for copy-mode install

## Constraints

- **Platform**: Must work on Windows (Git Bash), macOS, and Linux
- **Upstream compatibility**: Don't modify .upstream/ directory
- **Private repo**: All URLs except upstream-check point to chudeemeke/get-stuff-done
- **Node.js**: Minimum Node.js 20 LTS

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v0.1.0 fresh versioning | Distinct from upstream's 1.9.x, signals this is a new fork | Good |
| Statusline notification = upstream only | "Updates available" means new upstream commits to review | Good |
| Separators WHITE not DIM | Better visibility, user preference | Good |
| Update notification on second line | Cleaner main statusline, notification only when relevant | Good |
| Dynamic thresholds: 0.5/0.75/0.875 of autocompact | Green 0-50%, Yellow 50-75%, Red 87.5%+ of threshold | Good |
| Nested config structure | Matches user's existing config, better organization | Good |
| 3-color system (no orange stage) | Simpler, cleaner visual hierarchy | Good |
| Style Composer pattern | Centralized theme, fluent API, three-layer design tokens | Good |
| fs.lstat() for symlink detection | stat() follows symlinks, lstat() does not | Good |
| jq for nested JSON cache updates | Reliable field modification vs fragile sed | Good |
| 7-stage upstream workflow | Clear separation of concerns, checkpoint continuation | Good |
| Hand-crafted SVG | Precise isometric control, no font licensing | Good |
| Reverse video (SGR 7) over blink | Cross-terminal reliability | Good |
| Package renamed to @chude/get-stuff-done | Scoped npm package for private fork | Good |
| Security-first phase ordering | Audit before features ensures safe foundation | Good |
| Upstream features win on conflict | Fork adapts to upstream, not the other way around | Good |
| pathe for cross-platform paths | Consistent forward-slash paths on all platforms | Good |
| Singleton platform detection | Detect once, cache, reuse -- avoids redundant checks | Good |
| esbuild bundling for hooks/tools | Self-contained dist files for copy-mode install | Good |
| Result type pattern for validation | No exceptions thrown, explicit error handling | Good |
| bun:test over node:test | Better performance, native TypeScript support | Good |
| Agent teams disabled by default | Experimental feature, two-gate safety (config + env flag) | Good |

---
*Last updated: 2026-02-21 after v0.2.0 milestone*
