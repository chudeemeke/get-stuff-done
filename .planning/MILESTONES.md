# Project Milestones: GetStuffDone

## v1.1.0 Installer & Deployment Hardening (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 8 plans, 15 tasks

**Key accomplishments:**

- Testable installer module with 27 unit tests proving manifest-driven cleanup preserves user content, detectV2 has no false positives, and legacy fallback is scoped to known directories
- Path traversal containment guard in removeGsdFiles, exported uninstall() with testable mode, and dual-stream side-effect verification closing three gaps from Codex cross-AI review
- Fork hooks relocated to overlay/hooks/ with 3s timeout fixes, require-path corrections, and build/parity tooling updates
- patchStatusLine() added to installer with read-modify-write settings.json patching, D-06 custom preservation, and corrupt-file backup safety
- Fixed _auto_chain_active schema drift and added structural parity test to prevent future schema-config divergence
- Central timeout constants (SUBPROCESS_TIMEOUT 15s, HEAVY_SUBPROCESS_TIMEOUT 30s) replacing 28 hardcoded timeout values across sync.test.cjs and hooks.test.js
- 7-day throttled upstream version check via decorator pattern -- 4h TTL skips subprocess, 7d throttle skips network call
- Atomic write fix for patchStatusLine, timeout constant centralization, stale artifact archival, and milestone exit gate (1591/1593 passing)

---

## v1.0.0 Overlay Architecture (Shipped: 2026-03-31)

**Phases completed:** 6 phases, 16 plans, 28 tasks

**Key accomplishments:**

- Upstream install.js validated for overlay architecture: composed dir execution, surface branding, and overlay coexistence all confirmed via 3 integration tests (go/no-go verdict: GO)
- Surface-only branding engine with AJV schema validation, longest-first substitution ordering, and binary/overlay/LICENSE exclusion -- 41 tests passing across BRAND-01 through BRAND-06
- Full 5-stage composition pipeline (resolve/filter/override/brand/merge) producing dist/ from upstream + overlay, with collision detection, clean rebuild, .install-meta.json audit trail, and --dry-run/--diff CLI flags -- 56 new tests, 97 total passing
- computeDelta() now tracks CREDITS.md and .install-meta.json, completing --diff coverage for all compose outputs
- AJV schema validation for features.json and category-based file exclusion in filter() with SDK all-or-nothing, unmatched warnings, and .install-meta.json propagation
- override() replaces upstream files from overrides/ directory with REASON.md enforcement and paste-ready template errors
- SHA-256 content-hash staleness detection for overrides with REASON.md validation and actionable CI reporting
- Sync module ported to overlay/lib/ with standalone sync-tools.cjs CLI entry point; 14 fork-specific markdown files (workflows, agents, commands, teams) copied to overlay/
- v3.0 delegation installer replacing 2,125-line monolith with 436-line subprocess wrapper using overlay manifest for deterministic file copy
- Read-only preview-update script with version diff, 6-vector supply chain scan, override staleness check, and structured report with rollback instructions
- Symlink shim enables source-tree testing of overlay/lib/sync.cjs, closing the largest coverage gap from ~5% to 94.86% lines / 97.10% functions
- check-boundary.js detects 48 boundary violations in current repo; run-upstream-compat.js runs 11 upstream test files against composed dist/ with pass/fail reporting
- Close coverage gaps in compose.js, preview-update.js, and check-overrides.js with CLI entry, error path, and report formatting tests
- Full 4-check CI matrix: fork tests, upstream compat, boundary, and override checks across 3 OSes with parallel execution

---

## v0.4.0 Platform Expansion (Superseded: 2026-03-28)

**Status:** Superseded by v1.0.0 Overlay Architecture. The direct-edit fork model that v0.4.0 was built on (cherry-pick sync of 569 commits from v1.20.6 to v1.30.0) became unsustainable. The overlay architecture eliminates the sync treadmill entirely.

**Phases planned:** 24-28 (Phase 24 had 2/4 plans in progress; Phases 25-28 not started)

**What was planned:**

- Quality verification and bug fixes for prior phases
- Cherry-pick 158 upstream commits (v1.20.6-v1.22.4)
- Post-sync stabilization
- Multi-runtime installer support (Codex, OpenCode, Gemini)
- Fork branding per runtime, CI matrix expansion

**What carries forward:**

- Phase 24 quality verification work (bug fixes, test coverage) contributes to general codebase health
- Multi-runtime support is absorbed via upstream dependency (get-shit-done-cc@1.30.0 includes all runtimes)
- No formal requirement mapping from v0.4.0 to v1.0.0 (clean break)

---

## v0.3.0 Upstream Sync & Workflow Maturity (Shipped: 2026-03-08)

**Delivered:** Full upstream sync (185 commits through v1.20.5), modular gsd-tools architecture adoption, and production-grade sync workflow tooling with safety features, intelligence, and AI-assisted automation.

**Phases completed:** 18-23 (17 plans total, 6 phases including 1 gap closure)

**Key accomplishments:**

- Integrated 185 upstream commits (v1.10.0-v1.20.5) via cherry-pick sync, adopting modular gsd-tools architecture with 11 CJS domain modules
- Sync safety features: colorized diff preview, checkpoint-based rollback, --dry-run mode for risk-free simulation
- Sync intelligence: auto-classification of commits by type/severity, supply chain integrity scanning (6 attack vectors), severity-aware statusline monitoring
- Selective sync: category-based cherry-picking with file-overlap and AI semantic dependency detection, auto-include logic
- AI-assisted conflict resolution: Claude analyzes both sides, preserves fork identity via branding-map.json, suggests clean resolutions
- Gap closure: retroactive Phase 18 verification, config cleanup, dist rebuild, requirements traceability fully updated

**Stats:**

- ~25,773 lines of JavaScript
- 6 phases, 17 plans, 1,213 commits
- 262 files changed (+36,545 / -4,219 lines)
- 16 days from start to ship (Feb 21 - Mar 8)
- ~15.0 hours total execution time
- 16/16 v0.3.0 requirements complete (3 conditional deferred per assessment)

**Git range:** `v0.2.0` -> `1f36914`

**What's next:** v1.0.0 Overlay Architecture

---

## v0.2.0 Hardening & Upstream Sync (Shipped: 2026-02-21)

**Delivered:** Production-grade quality through security hardening, upstream sync of 72 commits, cross-platform support (macOS/Linux/Windows), Claude Code agent enhancements, CI/CD with 563 tests, and comprehensive gap closure.

**Phases completed:** 7-17 (32 plans total, 11 phases including 5 gap closure)

**Key accomplishments:**

- Security hardening with input validation module, ESLint security plugin, parameterized shell commands, and config re-validation
- Upstream sync of 72 commits from glittercowboy/get-shit-done with preserved fork identity and branding
- Cross-platform support via platform detection, pathe path normalization, and symlink/junction/copy fallback chain
- Claude Code adoption with agent memory protocol, effort calibration, and 4 team templates with config-driven workflow routing
- CI/CD pipeline with GitHub Actions cross-platform matrix, 563 tests at 95%+ coverage, and source-to-installed parity checks
- Infrastructure completion: 16 missing workflows, esbuild hook/tool bundling for copy-mode install, dead code cleanup

**Stats:**

- ~24,862 lines of JavaScript
- 11 phases, 32 plans, 214 commits
- 326 files modified (+50,799 / -19,541 lines)
- 14 days from start to ship (Feb 7 - Feb 21)
- 4.45 hours total execution time
- 18/18 actionable requirements covered (4 deferred, 2 excluded per CONTEXT.md)

**Git range:** `v0.1.0` -> `a19af32`

**What's next:** v0.3.0 Upstream Sync & Workflow Maturity

---

## v0.1.0 GetStuffDone Fork (Shipped: 2026-02-05)

**Delivered:** Personalized GSD fork with distinct identity, dynamic configuration, redesigned statusline, hybrid installation, split update workflows, and custom logo assets -- all while maintaining upstream compatibility.

**Phases completed:** 1-6 (12 plans total)

**Key accomplishments:**

- Configuration system with nested JSON5 config, AJV validation, and dynamic thresholds
- Redesigned statusline with GSD branding, 3-color progress bar, terminal-aware blink, and Style Composer theme system
- Hybrid installation with copy-by-default and --link for dev workflow with metadata persistence
- Fork identity with all URLs pointing to chudeemeke/get-stuff-done preserving upstream attribution
- Split update workflow: consumer /gsd:update and maintainer /gsd:upstream (7-stage cherry-pick sync)
- Custom visual identity with isometric icon, pixel-style lockup, 6 SVG variants, 24 PNG exports

**Stats:**

- ~4,534 lines of JS/JSON/SVG
- 6 phases, 12 plans
- 9 days from init to ship (Jan 28 - Feb 5)
- 1.38 hours total execution time
- 37/37 requirements satisfied (100% audit pass)

**Git range:** Initial fork setup through `d3b0414` (v2.1.1)

**What's next:** v0.2.0 Hardening & Upstream Sync

---
