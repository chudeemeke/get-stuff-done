# GetStuffDone (GSD Fork)

## What This Is

A personalized fork of GSD (Get Shit Done) by TACHES, rebranded as "Get Stuff Done" for the AI Dev Environment ecosystem. It's a meta-prompting, context engineering, and spec-driven development system for Claude Code, customized with aidev branding, improved update workflows, dynamic configuration, and a complete visual identity system.

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Platform capability audit (Claude Code + Opus 4.6 feature evaluation)
- [ ] Security audit of upstream sync workflow (review + fixes + hardening)
- [ ] Cross-platform verification (macOS + Linux install, config, statusline, hooks)
- [ ] Upstream sync execution (pull latest changes + workflow improvements)
- [ ] Auto-update check (upstream commit notification in statusline)
- [ ] Diff preview (preview upstream changes before cherry-picking)
- [ ] Rollback capability (undo failed upstream syncs)
- [ ] CI matrix testing (stretch goal)

### Out of Scope

- Changing GSD's core workflow methodology -- this is an adaptation, not a rewrite
- Removing .upstream/ directory -- needed for diffing/comparison

## Context

**Origin:** Forked from github.com/glittercowboy/get-shit-done v1.9.13
**Private repo:** github.com/chudeemeke/get-stuff-done
**Environment:** Windows with Git Bash, Claude Code CLI
**Current version:** 2.1.1 (published to npm as @chude/get-stuff-done)
**Codebase:** ~4,534 LOC (JS/JSON/SVG)
**Tech stack:** Node.js, JSON5/AJV config, SVG assets, Claude Code hooks/skills

**Shipped in v0.1.0:**
- Nested JSON5 configuration with AJV validation
- Style Composer theme system for statusline
- Hybrid copy/link installer with metadata persistence
- 7-stage upstream cherry-pick sync workflow
- Isometric icon + pixel lockup visual identity (6 SVG, 24 PNG)

**Enhancement requests captured:**
- Security review step for /gsd:upstream workflow (now in v0.2.0)
- Cross-platform testing (macOS, Linux) (now in v0.2.0)

**Current milestone: v0.2.0 Hardening & Upstream Sync**
- Research-first approach: evaluate Claude Code / Opus 4.6 capabilities before building
- Security audit + hardening of upstream sync workflow
- Cross-platform verification (macOS, Linux)
- Pull latest upstream + improve sync tooling
- New features: auto-update check, diff preview, rollback

## Constraints

- **Platform**: Must work on Windows (Git Bash) -- --link flag uses junctions (no admin required)
- **Upstream compatibility**: Don't modify .upstream/ directory
- **Private repo**: All URLs except upstream-check point to chudeemeke/get-stuff-done

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

---
*Last updated: 2026-02-07 after v0.2.0 milestone initialization*
