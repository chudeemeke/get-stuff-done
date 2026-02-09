# Cross-Platform Manual Test Matrix

This document provides a manual testing checklist for verifying GSD functionality across macOS, Linux, and Windows platforms.

## Test Platforms

- **macOS** (Intel and Apple Silicon)
- **Linux** (Ubuntu/Debian)
- **Windows** (Git Bash/MINGW and PowerShell)

## Test Categories

### 1. Installation

#### macOS
- [ ] Clone repository succeeds
- [ ] `bun install` completes without errors
- [ ] `bin/install.js` executes successfully
- [ ] Symlinks created in `~/.config/gsd/`
- [ ] Config templates copied correctly
- [ ] No permission errors on hook scripts
- [ ] Binary shebang `#!/usr/bin/env node` works

#### Linux (Ubuntu/Debian)
- [ ] Clone repository succeeds
- [ ] `bun install` completes without errors
- [ ] `bin/install.js` executes successfully
- [ ] Symlinks created in `~/.config/gsd/`
- [ ] Config templates copied correctly
- [ ] No permission errors on hook scripts
- [ ] Binary shebang `#!/usr/bin/env node` works

#### Windows
- [x] Clone repository succeeds
- [x] `bun install` completes without errors
- [x] `bin/install.js` executes successfully
- [x] Config files copied to `~/.config/gsd/`
- [x] Config templates copied correctly
- [x] Hooks executable without chmod (Node.js scripts)
- [x] Binary shebang ignored (runs via `node` on Windows)

### 2. Configuration Loading

#### macOS
- [ ] Default config loaded from `~/.config/gsd/gsd.config.jsonc`
- [ ] User config loaded from `~/.config/gsd/user.config.jsonc`
- [ ] JSON5 parser handles comments and trailing commas
- [ ] `gsd.role` setting detected correctly
- [ ] `context_management.autocompact_threshold` loaded
- [ ] Path resolution uses forward slashes

#### Linux (Ubuntu/Debian)
- [ ] Default config loaded from `~/.config/gsd/gsd.config.jsonc`
- [ ] User config loaded from `~/.config/gsd/user.config.jsonc`
- [ ] JSON5 parser handles comments and trailing commas
- [ ] `gsd.role` setting detected correctly
- [ ] `context_management.autocompact_threshold` loaded
- [ ] Path resolution uses forward slashes

#### Windows
- [x] Default config loaded from `~/.config/gsd/gsd.config.jsonc`
- [x] User config loaded from `~/.config/gsd/user.config.jsonc`
- [x] JSON5 parser handles comments and trailing commas
- [x] `gsd.role` setting detected correctly
- [x] `context_management.autocompact_threshold` loaded
- [x] Path resolution handles backslashes correctly

### 3. Statusline Display

#### macOS
- [ ] Statusline renders without errors
- [ ] Unicode icons display correctly (⚠️, ⚡)
- [ ] ANSI colors render properly
- [ ] Context window bar shows correct proximity
- [ ] Model name displays
- [ ] Current directory shows basename
- [ ] Update notification appears when available
- [ ] Branding icon (◧) displays correctly

#### Linux (Ubuntu/Debian)
- [ ] Statusline renders without errors
- [ ] Unicode icons display correctly (⚠️, ⚡)
- [ ] ANSI colors render properly
- [ ] Context window bar shows correct proximity
- [ ] Model name displays
- [ ] Current directory shows basename
- [ ] Update notification appears when available
- [ ] Branding icon (◧) displays correctly

#### Windows
- [x] Statusline renders without errors
- [x] Unicode icons display (or fallback to ! and >)
- [x] ANSI colors render in Git Bash/PowerShell
- [x] Context window bar shows correct proximity
- [x] Model name displays
- [x] Current directory shows basename
- [x] Update notification appears when available
- [x] Branding icon (◧) displays (or fallback)

### 4. Hook Execution

#### macOS
- [ ] `pre-compact.js` receives stdin JSON
- [ ] Hook creates `CONTINUE.md` file
- [ ] Hook appends to `events.log`
- [ ] Hook exits with code 0 on success
- [ ] Hook exits with code 2 on error
- [ ] Metrics snapshot created if `metrics.json` exists

#### Linux (Ubuntu/Debian)
- [ ] `pre-compact.js` receives stdin JSON
- [ ] Hook creates `CONTINUE.md` file
- [ ] Hook appends to `events.log`
- [ ] Hook exits with code 0 on success
- [ ] Hook exits with code 2 on error
- [ ] Metrics snapshot created if `metrics.json` exists

#### Windows
- [x] `pre-compact.js` receives stdin JSON via pipe
- [x] Hook creates `CONTINUE.md` file in `.planning/`
- [x] Hook appends to `events.log` in `.planning/`
- [x] Hook exits with code 0 on success
- [x] Hook exits with code 2 on error
- [x] Metrics snapshot created if `metrics.json` exists

### 5. Launcher Script

#### macOS
- [ ] `bin/gsd-launch.js` executes
- [ ] GSD_ROLE environment variable passed through
- [ ] GSD_PLANNING_DIR override works
- [ ] Correct config loaded based on role
- [ ] Exit codes propagated correctly

#### Linux (Ubuntu/Debian)
- [ ] `bin/gsd-launch.js` executes
- [ ] GSD_ROLE environment variable passed through
- [ ] GSD_PLANNING_DIR override works
- [ ] Correct config loaded based on role
- [ ] Exit codes propagated correctly

#### Windows
- [x] `bin/gsd-launch.js` executes via `node`
- [x] GSD_ROLE environment variable passed through
- [x] GSD_PLANNING_DIR override works
- [x] Correct config loaded based on role
- [x] Exit codes propagated correctly

### 6. gsd-tools.js Cross-Platform

#### macOS
- [ ] Platform detection returns "darwin"
- [ ] Terminal detection works for common macOS terminals
- [ ] Unicode support detected correctly
- [ ] Path operations use forward slashes
- [ ] File operations work with macOS permissions
- [ ] Exit code 0 for success, 1 for error

#### Linux (Ubuntu/Debian)
- [ ] Platform detection returns "linux"
- [ ] Terminal detection works for common Linux terminals
- [ ] Unicode support detected correctly
- [ ] Path operations use forward slashes
- [ ] File operations work with Linux permissions
- [ ] Exit code 0 for success, 1 for error

#### Windows
- [x] Platform detection returns "win32"
- [x] Terminal detection works for Git Bash/PowerShell/CMD
- [x] Unicode support detected (with fallback for CMD)
- [x] Path operations handle backslashes correctly
- [x] File operations work without chmod
- [x] Exit code 0 for success, 1 for error

## Testing Instructions

### Prerequisites
- Node.js 18+ installed
- Bun installed
- Git installed
- Terminal with ANSI color support (recommended)

### Test Procedure

1. **Clone and Install**
   ```bash
   git clone <repo-url> gsd-test
   cd gsd-test
   bun install
   bin/install.js
   ```

2. **Verify Config Loading**
   ```bash
   node -e "const {loadConfig} = require('./src/config/ConfigLoader'); console.log(loadConfig());"
   ```

3. **Test Statusline**
   ```bash
   echo '{"model":{"display_name":"Sonnet"},"workspace":{"current_dir":"/tmp"},"context_window":{"remaining_percentage":50}}' | node hooks/gsd-statusline.js
   ```

4. **Test Pre-Compact Hook**
   ```bash
   echo '{"trigger":"manual"}' | node hooks/pre-compact.js
   ls -la .planning/CONTINUE.md
   tail -1 .planning/events.log
   ```

5. **Test Launcher**
   ```bash
   GSD_ROLE=maintainer node bin/gsd-launch.js --version
   ```

6. **Test gsd-tools.js**
   ```bash
   node tools/gsd-tools.js detect-platform
   node tools/gsd-tools.js detect-terminal
   ```

## Known Platform Differences

### Windows
- Hook scripts run via `node <script>` instead of executable shebang
- Git Bash may show "stdin is not a tty" warning (harmless)
- Unicode support depends on terminal (Git Bash > CMD)
- Paths use backslashes in native APIs, forward slashes in Node.js

### macOS
- Full Unicode support in Terminal.app and iTerm2
- ANSI color support standard
- Symlinks work natively

### Linux
- Full Unicode support in modern terminals
- ANSI color support standard
- Symlinks work natively
- File permissions may require executable bit on hooks

## Verification Checklist

After completing tests on each platform:
- [ ] All installation tests pass
- [ ] Config loading works correctly
- [ ] Statusline displays without errors
- [ ] Hooks execute and produce expected output
- [ ] Launcher script works
- [ ] gsd-tools.js functions correctly
- [ ] No platform-specific errors in console

## Reporting Issues

When reporting platform-specific issues:
1. Note exact platform (OS version, terminal type)
2. Include error messages or unexpected output
3. Provide test command that reproduces the issue
4. Check if issue exists on other platforms

## References

- Platform detection: `src/platform/index.js`
- Terminal detection: `src/platform/terminal.js`
- Path handling: `src/platform/paths.js`
- Config loading: `src/config/ConfigLoader.js`
- Hook implementation: `hooks/pre-compact.js`, `hooks/gsd-statusline.js`
