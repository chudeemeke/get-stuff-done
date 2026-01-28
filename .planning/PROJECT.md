# GetStuffDone (GSD Fork)

## What This Is

A personalized fork of GSD (Get Shit Done) by TACHES, rebranded as "Get Stuff Done" for the AI Dev Environment ecosystem. It's a meta-prompting, context engineering, and spec-driven development system for Claude Code, customized with aidev branding, improved update workflows, and dynamic configuration.

## Core Value

**Maintain upstream compatibility while establishing distinct identity.** The fork should feel like "mine" while still being able to pull valuable improvements from the original GSD.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Symlink-based installation (edits sync between ~/.claude and project)
- [ ] Rebranded identity (chudeemeke/get-stuff-done, aidev colors, Chude author)
- [ ] Redesigned statusline (⧉ [GSD] branding, dynamic thresholds, new icons)
- [ ] Split update workflow (/gsd:update for fork, /gsd:upstream for original)
- [ ] Token-based autocompact configuration (100,000 tokens instead of percentage)
- [ ] Custom logo assets (isometric ⧉, FYNORA-style layout, cyan/green)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Changing GSD's core workflow methodology — this is an adaptation, not a rewrite
- Publishing to npm under a different package name — private use only
- Removing .upstream/ directory — needed for diffing/comparison

## Context

**Origin:** Forked from github.com/glittercowboy/get-shit-done v1.9.13
**Private repo:** github.com/chudeemeke/get-stuff-done
**Environment:** Windows with Git Bash, Claude Code CLI

**Existing adaptations already made:**
- Renamed to "get-stuff-done"
- Basic terminal.svg updated with aidev branding
- Installer runs but copies instead of symlinks

**Key files for this milestone:**
- `bin/install.js` — installer logic
- `bin/gsd` — launcher script with autocompact config
- `hooks/gsd-statusline.js` — statusline display
- `hooks/gsd-check-update.js` — update checking
- `commands/gsd/update.md` — update command
- `~/.gsd/config.json` — user configuration

## Constraints

- **Platform**: Must work on Windows (Git Bash) — use junctions not symlinks for directories
- **Upstream compatibility**: Don't modify .upstream/ directory
- **Private repo**: All URLs except upstream-check point to chudeemeke/get-stuff-done

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v0.1.0 fresh versioning | Distinct from upstream's 1.9.x, signals this is a new fork | — Pending |
| Statusline notification = upstream only | "Updates available" means new upstream commits to review, not fork releases | — Pending |
| Separators WHITE not DIM | Better visibility, user preference | — Pending |
| Update notification on second line | Cleaner main statusline, notification only when relevant | — Pending |
| Dynamic thresholds: 0.5/0.75/0.875 of autocompact | Green 0-50%, Yellow 50-75%, Orange 75-87.5%, Red 87.5%+ of threshold | — Pending |

---
*Last updated: 2026-01-28 after milestone v0.1.0 initialization*
