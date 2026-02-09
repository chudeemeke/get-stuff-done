---
phase: 09
plan: 02
subsystem: platform-compatibility
tags: [cross-platform, nodejs, launcher, hooks, windows, macos, linux]

requires:
  - 09-01  # Platform detection module

provides:
  - Cross-platform Node.js launcher (bin/gsd.js)
  - Cross-platform pre-compact hook (hooks/pre-compact.js)
  - Platform-aware statusline terminal detection

affects:
  - 09-03  # Settings installation will use Node.js hooks
  - 09-04  # Integration testing will verify cross-platform operation

tech-stack:
  added: []
  patterns:
    - child_process.spawn for cross-platform process execution
    - stdin stream processing for hook input
    - fs.promises for async file operations

key-files:
  created:
    - bin/gsd.js
    - hooks/pre-compact.js
  modified:
    - package.json
    - hooks/gsd-statusline.js
    - scripts/build-hooks.js

decisions:
  - SPAWN-001: Use spawn with shell:true for cross-platform claude command resolution
  - HOOK-INPUT-001: Follow gsd-statusline.js stdin pattern for pre-compact hook
  - BUILD-001: Keep hooks/dist/ gitignored (generated on prepublishOnly)

metrics:
  duration: 7m
  completed: 2026-02-09
---

# Phase 9 Plan 02: Cross-Platform Launcher and Hooks Summary

**One-liner:** Node.js launcher and pre-compact hook eliminate bash dependencies for Windows/macOS/Linux compatibility

## What Was Built

### 1. Cross-Platform Launcher (bin/gsd.js)

**Purpose:** Replace bash bin/gsd with pure Node.js for universal platform support.

**Implementation:**
- Node.js shebang (`#!/usr/bin/env node`) works on all platforms
- Uses `src/platform/paths` for path resolution (no cygpath needed)
- Uses `src/platform/terminal` for color capability detection
- Config management: creates default config, handles version migration
- Startup banner: displays project state (STATE.md, CONTINUE.md) with platform-aware colors
- Claude launcher: `child_process.spawn` with `shell: true` for cross-platform command resolution
- Error handling: catches ENOENT for missing claude command with helpful install message

**Key Pattern:**
```javascript
const claude = spawn('claude', args, {
  stdio: 'inherit',
  shell: true  // Handles claude.cmd on Windows automatically
});
```

**Package.json updates:**
- Added `"gsd": "bin/gsd.js"` to bin field
- Added `"src"` to files array (platform module distributed with package)

### 2. Cross-Platform Pre-Compact Hook (hooks/pre-compact.js)

**Purpose:** Replace bash hooks/pre-compact.sh with pure Node.js.

**Implementation:**
- Reads JSON from stdin (same pattern as gsd-statusline.js)
- Logs compaction events to `.planning/events.log`
- Creates CONTINUE.md with STATE.md snapshot (first 50 lines)
- Saves metrics snapshot if metrics.json exists
- Uses `src/platform/paths` for cross-platform path handling
- Uses `fs.promises` for async file operations
- Error handling: exits with code 2 to block compaction on errors

**Input format:**
```json
{"trigger": "auto" | "manual"}
```

**Output:**
- Exit 0: Allow compaction
- Exit 2: Block compaction (on error)

### 3. Statusline Platform Integration

**Change:** Replace inline `supportsUnicode()` with platform module import.

**Before:**
```javascript
function supportsUnicode() {
  if (process.platform === 'win32') {
    return Boolean(process.env.WT_SESSION) ||
           Boolean(process.env.ConEmuTask) ||
           process.env.TERM_PROGRAM === 'vscode';
  }
  return process.env.TERM !== 'linux';
}
```

**After:**
```javascript
const { detectTerminal } = require('../src/platform/terminal');
const terminalCaps = detectTerminal();
// Use terminalCaps.supportsUnicode
```

**Benefits:**
- Single source of truth for terminal detection
- Expanded terminal support (Windows Terminal, ConEmu, VS Code, iTerm2, Alacritty, Kitty, Hyper)
- Consistent detection logic across all GSD components

### 4. Build System Update

**Change:** Add pre-compact.js to build-hooks.js

```javascript
const HOOKS_TO_COPY = [
  'gsd-check-update.js',
  'gsd-statusline.js',
  'pre-compact.js'  // New
];
```

**Build output:** `bun run build:hooks` creates hooks/dist/ with all three hooks.

## Technical Decisions

### SPAWN-001: Cross-Platform Process Execution

**Decision:** Use `child_process.spawn` with `shell: true` for launching claude.

**Rationale:**
- On Windows, `shell: true` allows `claude.cmd` to be found automatically
- On Unix, it resolves `claude` from PATH
- `stdio: 'inherit'` provides seamless user experience (passthrough stdin/stdout/stderr)
- No platform-specific code needed

**Alternative considered:** Platform-specific command resolution (rejected - unnecessary complexity)

### HOOK-INPUT-001: Stdin Processing Pattern

**Decision:** Follow gsd-statusline.js pattern for stdin JSON reading.

**Pattern:**
```javascript
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  const data = JSON.parse(input);
  // Process hook logic
});
```

**Rationale:**
- Proven pattern already in production (gsd-statusline.js)
- Handles stdin stream correctly across platforms
- Works with Claude Code hook invocation (`node /path/to/hook.js`)

### BUILD-001: Generated Files Not Committed

**Decision:** Keep hooks/dist/ in .gitignore, generate on prepublishOnly.

**Rationale:**
- dist/ is build artifact, not source
- `prepublishOnly` script ensures fresh build before npm publish
- Reduces git noise from generated files

## Testing Evidence

### Launcher Verification

```bash
$ node -c bin/gsd.js
# Passed syntax check

$ node bin/gsd.js --help
Get Stuff Done v2.1.1
----
Project state: Found
----
Usage: claude [options] [command] [prompt]
# Successfully launched claude and displayed banner
```

### Pre-Compact Hook Verification

```bash
$ node -c hooks/pre-compact.js
# Passed syntax check

$ echo '{"trigger":"manual"}' | node hooks/pre-compact.js
$ test -f .planning/CONTINUE.md && echo "Success"
Success

$ tail -1 .planning/events.log
2026-02-09T20:01:13.822Z | COMPACTION | trigger=manual
# Logged event correctly
```

### Statusline Verification

```bash
$ node -c hooks/gsd-statusline.js
# Passed syntax check with platform module import
```

### Build Verification

```bash
$ bun run build:hooks
Copying gsd-check-update.js...
Copying gsd-statusline.js...
Copying pre-compact.js...
Build complete.

$ ls -lh hooks/dist/
-rwxr-xr-x 2.5K gsd-check-update.js
-rwxr-xr-x 6.6K gsd-statusline.js
-rwxr-xr-x 5.0K pre-compact.js
# All hooks built successfully
```

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create cross-platform Node.js launcher | 9f564c0 | bin/gsd.js, package.json |
| 2 | Rewrite pre-compact hook and update statusline | bbf4381 | hooks/pre-compact.js, hooks/gsd-statusline.js, scripts/build-hooks.js |

## Next Phase Readiness

### Ready for 09-03 (Settings Installation)

- Node.js hooks ready for installation to ~/.gsd/hooks/
- Hook commands use universal `node /path/to/hook.js` syntax
- No shell-specific hook generation needed (satisfies PLAT-04)

### Ready for 09-04 (Integration Testing)

- Cross-platform launcher ready for testing on Windows/macOS/Linux
- Hooks testable with stdin JSON mocking
- Platform module provides consistent detection across all components

### Blockers

None.

### Open Questions

None.

## Files Changed

### Created

- `bin/gsd.js` (215 lines)
  - Cross-platform Node.js launcher
  - Config management, banner display, claude launcher
  - Platform-aware terminal coloring

- `hooks/pre-compact.js` (169 lines)
  - Cross-platform pre-compact hook
  - Stdin JSON processing, event logging, continuation context
  - Async file operations with error handling

### Modified

- `package.json` (2 additions)
  - Added `"gsd": "bin/gsd.js"` to bin field
  - Added `"src"` to files array

- `hooks/gsd-statusline.js` (9 lines changed)
  - Removed inline supportsUnicode() function
  - Added platform module import
  - Use terminalCaps.supportsUnicode from platform module

- `scripts/build-hooks.js` (1 addition)
  - Added `'pre-compact.js'` to HOOKS_TO_COPY array

## Dependencies

### From Previous Plans

- 09-01: Platform detection module (src/platform/)
  - gsdPaths for cross-platform path operations
  - detectTerminal for terminal capability detection

### For Future Plans

- 09-03: Settings installation will copy hooks to ~/.gsd/hooks/
- 09-04: Integration tests will verify cross-platform launcher and hooks
- Future: Bash versions (bin/gsd, hooks/pre-compact.sh) can be removed after migration period

## Cross-References

### Related Issues

- PLAT-04: Hook generation produces shell-appropriate syntax
  - Resolution: Universal `node /path/to/hook.js` works on bash, zsh, PowerShell, cmd
  - No shell-specific syntax generation needed

### Related Decisions from Other Plans

- 09-01 PATH-001: Use pathe for cross-platform paths
  - Applied in launcher and pre-compact hook
- 09-01 DETECT-002: Windows Terminal detection before TERM check
  - Applied in statusline via platform module

### Impact on Other Subsystems

- CLI: `gsd` command now works on all platforms without Git Bash requirement
- Hooks: All hooks now pure Node.js (no bash dependency)
- Installation: Package includes src/ directory for platform module distribution
- Build: prepublishOnly hook ensures hooks/dist/ is fresh before publish

---

**Phase 9 Plan 02 Complete**
Duration: 7 minutes
Tasks: 2/2 complete
Commits: 2
Status: Ready for 09-03 (Settings installation)
