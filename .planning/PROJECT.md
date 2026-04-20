# GetStuffDone (GSD Fork)

## What This Is

A personalized overlay of GSD (Get Shit Done) by TACHES, published as @chude/get-stuff-done. It consumes upstream as an npm dependency and layers fork-specific additions (cross-platform tooling, theming, sync safety, launcher) on top through a composition pipeline. Users get upstream's full capabilities plus fork enhancements, with surface-only branding.

## Core Value

**Get upstream improvements automatically while preserving fork identity and additions.** The overlay architecture eliminates manual sync operations -- upstream updates are version bumps, not cherry-pick marathons.

## Requirements

### Validated

- CONFIG-01 through CONFIG-04: Dynamic configuration system — v0.1.0
- STATUS-01 through STATUS-09: Redesigned statusline with branding and thresholds — v0.1.0
- INSTALL-01 through INSTALL-04: Hybrid installation (copy default, --link for dev) — v0.1.0
- BRAND-01 through BRAND-05: Fork identity and URLs — v0.1.0
- UPSTREAM-01 through UPSTREAM-10: Maintainer upstream sync workflow — v0.1.0
- UPDATE-01 through UPDATE-04: Consumer update workflow — v0.1.0
- LOGO-01 through LOGO-05: Custom logo and visual assets — v0.1.0
- SEC-01 through SEC-06: Security hardening (validation, ESLint, parameterized commands, config re-validation) — v0.2.0
- PLAT-01 through PLAT-06: Cross-platform support (pathe paths, platform detection, fallback chain) — v0.2.0
- SYNC-05, SYNC-06: Upstream sync execution and workflow improvements — v0.2.0
- CLAUDE-01 through CLAUDE-03: Agent memory, effort calibration, team patterns — v0.2.0
- CI-01: GitHub Actions cross-platform matrix testing — v0.2.0
- SYNC-II-01 through SYNC-II-06: Full upstream sync (185 commits), modular architecture adoption, dist migration, fork identity preservation, test suite maintenance, approach comparison — v0.3.0
- SYNC-01 through SYNC-04: Diff preview, rollback snapshots, severity-aware auto-update, dry-run mode — v0.3.0
- SYNC-07, SYNC-08: GPG verification, auto-categorization of upstream changes — v0.3.0
- SYNC-09, SYNC-10: Selective sync with dependency tracking, AI-assisted conflict resolution — v0.3.0
- ASSESS-01, ASSESS-02: Post-sync feature overlap assessments (agent teams, diff viewer, multi-upstream) — v0.3.0
- ✓ OVERLAY-01: Validate installer delegation mechanism — v1.0.0
- ✓ OVERLAY-02: Composition pipeline (resolve, filter, override, brand, merge) — v1.0.0
- ✓ OVERLAY-03: Surface-only branding system (branding.json, text scope only) — v1.0.0
- ✓ OVERLAY-04: Feature flags system (file-level exclusion for workflows/commands/agents/hooks/SDK) — v1.0.0
- ✓ OVERLAY-05: Override system with REASON.md enforcement and staleness detection — v1.0.0
- ✓ OVERLAY-06: Port fork-specific code to overlay/ structure (~2,510 lines) — v1.0.0
- ✓ OVERLAY-07: Installer architecture (delegation to upstream install.js + overlay additions) — v1.0.0
- ✓ OVERLAY-08: Update workflow (preview-update with supply chain scan before upgrade) — v1.0.0
- ✓ OVERLAY-09: Boundary enforcement (CI checks: no upstream files in repo, override reasons) — v1.0.0
- ✓ OVERLAY-10: Fork test suite (~12 test files covering overlay-specific code) — v1.0.0
- ✓ OVERLAY-11: Upstream compatibility test runner against composed output — v1.0.0
- ✓ OVERLAY-12: Existing user upgrade path (v2.x artifact detection and cleanup) — v1.0.0
- ✓ OVERLAY-13: Cross-platform CI matrix (macOS, Linux, Windows) — v1.0.0

- ✓ INST-01 through INST-03: Installer safety (manifest-driven cleanup, detectV2 no false-positive, uninstall scoping) -- v1.1.0
- ✓ STAT-01 through STAT-04: Statusline deployment (composition pipeline, settings.json wiring, 3s timeout, non-GSD project support) -- v1.1.0
- ✓ TEST-01 through TEST-04: Test health (schema-config parity, central timeout constants, full suite gate) -- v1.1.0
- ✓ CI-01: Upstream version drift detection (7-day throttled client-side polling) -- v1.1.0
- ✓ CLEAN-01 through CLEAN-04: Artifact cleanup (debug sessions, Phase 24, handoff files, PROJECT.md deferred list) -- v1.1.0

### Active

## Current Milestone: v1.2.0 Ship-Ready Hardening

**Goal:** Eliminate fork brittleness and reach ship-ready quality bar -- upstream bumps become routine version changes, not refactoring events. Market-ready quality: no dead code, no AI-prone sloppy patterns, validated, verified, documented.

**Target features:**

*Upgrade resilience*
- Automated upgrade test in CI (install -> bump -> recompose -> reinstall -> verify)
- Historical-version compat matrix (last N vetted upstream versions, not arbitrary future ones)
- Override staleness enforcement -- blocking CI gate (distinct from informational boundary/compat stance)
- Upstream hook merge (isNewer, detectConfigDir, stale hook detection, shared cache) with atomic coupling to statusline
- Live upgrade dogfood -- bump to current upstream during milestone as proof the system works

*Process hardening (oversight pattern)*
- PROCESS-01: gsd-oversight-execution flags unverified post-merge state
- PROCESS-02: gsd-oversight-execution flags SUMMARY claims lacking verification
- PROCESS-03: gsd-oversight-verification flags CI gates raised before local measurement passed
- PROCESS-04: gsd-oversight-planning flags test approaches without metric-target compatibility check

*Ship-readiness*
- Security audit (OWASP Top 10, secrets scan, dependency audit, override code review) with triage rule: critical = fix in v1.2.0, major = plan for v1.3.0, minor = backlog
- Reliability SLO: 100% test pass on all 3 platforms -- requires root-causing Windows subprocess flakiness with decided escape hatch if genuinely unfixable
- Documentation completeness -- MAINTENANCE.md (not CONTRIBUTING; repo private), upgrade guide, override policy, README polish
- Performance baseline with budget-enforcement in CI

**Active requirements:** Requirement IDs defined after research phase (see REQUIREMENTS.md).

### Out of Scope

- Changing GSD's core workflow methodology -- this is an overlay, not a rewrite
- TypeScript migration -- adds build complexity for marginal benefit
- Internal path renaming (get-shit-done/ -> get-stuff-done/) -- surface-only branding per QA review
- Runtime filtering in install.js -- too complex for monolithic 5,000-line file, users choose at install time
- Auto-applying upstream updates -- destroys user control
- Reimplementing upstream's installer logic -- delegate, don't duplicate

### Deferred

- CLAUDE-06: Parallel phase isolation — safe concurrent phase execution with artifact isolation (reframed from agent teams orchestration; worktree approach has shared artifact conflicts)
- Runtime filtering in feature flags (revisit if upstream modularises their installer)

## Current State

**Shipped:** v1.1.0 Installer & Deployment Hardening on 2026-04-04
**Architecture:** Overlay model -- upstream consumed as npm devDependency, composed at publish time
**Upstream:** get-shit-done-cc@1.34.2 (bumped 2026-04-10)
**Current version:** 3.0.2 (published to npm as @chude/get-stuff-done)
**Codebase:** ~151 files, ~30K lines; fork-specific overlay code ~2,510 lines; 1593 tests (1588+ passing)
**CI:** 5-check matrix (fork tests, upstream compat, boundary, override) across macOS/Linux/Windows
**Known tech debt:**
- 48 boundary violations (structural -- overlay files not in overrides/, CI informational)
- ~130 upstream compat failures (branding diffs by design, CI informational)
- preview-update.js ~5% uncovered I/O paths (documented exception)
- INST-04 uninstall manifest gap (overlay files not tracked in upstream manifest)
- Intermittent Windows subprocess timeout flakiness (OS-level timing)
- ~~Codex `extractFrontmatterField` crash~~ (RESOLVED -- fork-specific, 4 oversight agents fixed)

## Context

**Origin:** Forked from github.com/glittercowboy/get-shit-done v1.9.13
**Private repo:** github.com/chudeemeke/get-stuff-done
**Environment:** Windows with Git Bash, Claude Code CLI (cross-platform: macOS, Linux, Windows)
**Design spec:** docs/superpowers/specs/2026-03-28-overlay-architecture-design.md

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

**Shipped in v0.3.0:**
- Upstream sync: 185 commits (v1.10.0-v1.20.5) integrated, modular gsd-tools architecture (11 CJS domain modules) adopted
- Sync safety: colorized diff preview, checkpoint-based rollback, --dry-run mode
- Sync intelligence: commit classification by type/severity, supply chain integrity scanning (6 attack vectors), severity-aware statusline monitoring
- Selective sync: category-based cherry-picking with dependency detection and auto-include logic
- AI-assisted conflict resolution: Claude-powered analysis preserving fork identity via branding-map.json

**Shipped in v1.1.0:**
- Installer safety: manifest-driven cleanup with path traversal containment, detectV2 false-positive elimination, exported uninstall() with testable mode
- Statusline deployment: composition pipeline deploys enhanced statusline globally, patchStatusLine with atomic write and custom statusline preservation
- Test health: central timeout constants (SUBPROCESS_TIMEOUT/HEAVY_SUBPROCESS_TIMEOUT) replacing all hardcoded values, schema-config parity enforcement
- CI: 7-day throttled upstream version check via two-layer cache architecture (4h subprocess gate + 7d network gate)
- Cleanup: stale debug sessions and Phase 24 archived, handoff files removed, full test suite gate (1591+ passing)

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
| Adopt upstream modular gsd-tools | 11 CJS modules better than monolith for extensibility and SOLID | Good |
| Upstream features win on architecture conflicts | Fork adapts to upstream patterns unless fork approach is clearly superior | Good |
| Plumbing/porcelain split for sync | sync.cjs for data ops, upstream-sync.md for UX orchestration | Good |
| SYNC-II-05 scope amendment | 95%+ coverage applies to production code, not test helpers | Good |
| AUTOCOMPACT_THRESHOLD as constant | Claude Code controls internally, not user-configurable | Good |

| Overlay architecture | Cherry-pick sync unsustainable at 569-commit delta; overlay model eliminates sync treadmill | ✓ Good |
| Surface-only branding | Internal path renaming cascades complexity through installer delegation and test compat; Android OEMs preserve AOSP internals | ✓ Good |
| Publish-time composition | Users don't need upstream as dependency; pre-composed output is self-contained and testable | ✓ Good |
| Exact version pinning | Prevents unreviewed upstream updates; deliberate upgrades via preview-update workflow | ✓ Good |
| No runtime filtering v3.0 | Upstream install.js is 5K-line monolith; code-level filtering infeasible; users choose at install time | ✓ Good |
| 5-stage pipeline SRP | resolve/filter/override/brand/merge as separate importable functions; testable in isolation | ✓ Good |
| Delegation installer | Subprocess wrapper (436 lines) vs reimplementing upstream's 5K-line monolith | ✓ Good |
| continue-on-error for informational CI | Boundary + upstream-compat jobs are informational, not blocking; prevents false red builds | ✓ Good |
| Atomic write for settings.json | Temp file + rename prevents TOCTOU corruption in patchStatusLine | ✓ Good |
| Two-layer throttle for update check | 4h subprocess gate + 7d network gate prevents excessive polling without missing drift | ✓ Good |
| Central timeout constants | Single source for subprocess test timeouts; prevents hardcoded value drift | ✓ Good |
| Manifest-driven uninstall | Only removes files listed in manifest; path traversal containment guard | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 -- v1.2.0 milestone started*
