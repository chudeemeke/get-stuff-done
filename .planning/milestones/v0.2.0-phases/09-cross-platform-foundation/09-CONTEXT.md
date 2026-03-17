# Phase 9: Cross-Platform Foundation - Context

**Gathered:** 2026-02-08 (updated 2026-02-09)
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable GSD to install, configure, and run identically on macOS, Linux, and Windows (including Git Bash, PowerShell, and cmd.exe) with automatic platform adaptation. The codebase already has partial cross-platform support (Node.js stdlib, path.join, Windows junctions). This phase fills the gaps: bash-only launcher, bash-only pre-compact hook, incomplete symlink fallback, and missing shell/environment detection.

</domain>

<decisions>
## Implementation Decisions

### Windows Shell Strategy
- Replace bash launcher (`bin/gsd`) with a full Node.js rewrite -- no bash dependency for the launcher
- Support all shells: bash, zsh, PowerShell, cmd.exe, and Git Bash on Windows
- Git Bash treated as Unix-like (has bash, grep, sed, etc. available)
- WSL treated as Linux (no special handling)
- Degraded environments: warn and continue (show what won't work, don't block)
- Node.js resolves all paths via `os.homedir()` -- templates keep `~` notation but GSD resolves at runtime
- Always use forward slashes in output (logs, status messages) regardless of platform
- Paths with spaces handled transparently -- proper quoting/escaping everywhere, no warnings needed

### Symlink/Install Fallback Chain
- Three-step fallback: symlink -> junction -> copy
- On fallback to copy: warn user with implications ("Updates to source won't auto-propagate -- reinstall after updates")
- Record install method (symlink/junction/copy) in `.install-meta.json`
- On Windows: check for Developer Mode and advise if symlinks require it, then proceed with junction/copy
- Default install path: `~/.claude/` with `GSD_HOME` env var override for non-standard setups
- Post-install verification: confirm hooks accessible, config parseable, statusline renders. Report pass/fail
- Upgrade behavior: merge carefully -- detect user customizations, merge new defaults with existing. Don't overwrite user edits
- Set executable permissions (chmod +x) on Unix only. Skip on Windows
- Local filesystem only -- no UNC/network path support
- Cross-platform improvements apply to both GSD and OpenCode installations (shared installer)

### Hook Portability
- Rewrite `hooks/pre-compact.sh` in Node.js -- single implementation, full portability
- Create centralized platform utility module for command resolution (e.g., `npm` vs `npm.cmd`), subprocess spawning, and path operations. All hooks use it
- Hook commands in settings.json always use `node /path/to/hook.js` -- works on all platforms without shell detection
- Expand Unicode/terminal detection: add checks for Windows Terminal, iTerm2, Alacritty, Kitty, Hyper, and others
- Platform-aware error messages with platform-specific troubleshooting hints
- Configurable hook timeout with sensible default (e.g., 10s). Kill hung hooks gracefully

### gsd-tools.js Cross-Platform Audit
- `gsd-tools.js` (integrated from upstream in Phase 8) MUST be audited for bash assumptions and platform-specific code
- Any shell-dependent operations, hardcoded paths, or Unix-only patterns must be identified and made cross-platform
- Apply the same Node.js-first approach: use the centralized platform utility for any subprocess spawning, path resolution, or command lookup

### Platform Detection Scope
- Full detection: OS (win/mac/linux) + shell (bash/zsh/PowerShell/cmd) + environment (native, MINGW, Git Bash)
- Include terminal capabilities: width, color depth (16/256/truecolor), Unicode support
- Detect once at startup, cache for session
- Store detection results in `.install-meta.json` during install for downstream use
- No standalone diagnostic command -- platform info shown in verbose/debug mode and install output only
- Validate prerequisites at install and startup: Node.js >= 20 LTS, git available. Warn on version mismatch
- Minimum Node.js version: 20 LTS
- Manual test matrix: markdown checklist in docs ("On [platform], verify: install, config, statusline, hooks")

### Claude's Discretion
- Whether to use `cross-spawn` package or handle spawn differences internally in the platform utility
- Documentation approach (unified vs platform-specific callout boxes)
- Exact terminal detection heuristics and fallback behavior
- Specifics of config merge strategy during upgrades
- Hook timeout default value
- Platform utility module API design and file structure

</decisions>

<specifics>
## Specific Ideas

- User currently runs on Git Bash (MINGW64_NT-10.0-26200) on Windows 11 Pro -- this is a first-class target
- Industry standard for cross-platform npm CLIs: point `bin` in package.json to a `.js` file with `#!/usr/bin/env node`. npm/bun creates platform-appropriate wrappers automatically
- The centralized platform utility should be the single source of truth for all platform-aware operations across the codebase

</specifics>

<deferred>
## Deferred Ideas

- Standalone `gsd platform` / `gsd doctor` diagnostic command -- could be a future quality-of-life addition
- Script-based automated test verification across platforms (Phase 12: CI/CD covers this)

</deferred>

---

*Phase: 09-cross-platform-foundation*
*Context gathered: 2026-02-08*
