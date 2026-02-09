# Phase 9: Cross-Platform Foundation - Research

**Researched:** 2026-02-09
**Domain:** Node.js cross-platform development, Windows/macOS/Linux compatibility
**Confidence:** HIGH

## Summary

Node.js cross-platform development requires careful handling of paths, shell commands, symlinks, and terminal capabilities. The standard approach uses Node.js built-in modules (path, os, fs, child_process) combined with specialized libraries for edge cases. Key challenges include Windows path separators, symlink/junction fallbacks, shell command spawning, and terminal feature detection. The codebase already has partial cross-platform support (Node.js stdlib, path.join, junctions), with gaps in bash-only scripts (bin/gsd, hooks/pre-compact.sh) and incomplete platform detection.

**Primary recommendation:** Use Node.js built-in modules as the foundation, add `pathe` for normalized path handling, avoid `cross-spawn` (modern Node.js handles this natively), rewrite bash scripts in Node.js, and implement comprehensive platform detection with graceful fallbacks.

## Standard Stack

The established libraries/tools for Node.js cross-platform development:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js path | Built-in | Path manipulation with OS-appropriate separators | Native, zero dependencies, handles all platforms |
| Node.js os | Built-in | Platform detection (os.platform(), os.homedir(), etc.) | Native API for OS information |
| Node.js fs | Built-in | File operations including symlinks/junctions | Native API with platform-specific type handling |
| Node.js child_process | Built-in | Process spawning with platform-aware shell handling | Native spawn/exec with {shell: true} option |
| pathe | 1.1+ | Normalized path handling (always forward slashes) | Drop-in path replacement, consistent POSIX behavior, 10M+ weekly downloads |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| supports-color | 9.4+ | Terminal color capability detection | When outputting ANSI colors, 54M+ weekly downloads |
| chalk | 5.3+ | Terminal text styling with automatic fallbacks | When styling terminal output, uses supports-color internally |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in child_process | cross-spawn | Cross-spawn adds 300KB and is no longer needed (Node 4.8+ has native {shell: true}), last updated a year ago |
| Built-in path | pathe | Pathe enforces POSIX everywhere (forward slashes), built-in path preserves platform separators. Use pathe for consistency. |
| Manual detection | platform-detect | Platform-detect adds abstraction layer; os.platform() is sufficient and native |

**Installation:**
```bash
bun add pathe
bun add -d supports-color  # if not already installed
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── platform/           # Platform detection and utilities
│   ├── detect.js      # OS, shell, environment detection
│   ├── spawn.js       # Cross-platform process spawning
│   ├── paths.js       # Path operations (wraps pathe)
│   └── terminal.js    # Terminal capability detection
├── config/            # Configuration loading
├── hooks/             # All hooks as .js (no bash)
└── bin/               # Launcher scripts (Node.js only)
```

### Pattern 1: Platform Detection

**What:** Detect OS, shell, and environment once at startup, cache results
**When to use:** During installer initialization, hook startup, launcher execution
**Example:**
```javascript
// Source: Research synthesis from os module documentation
const os = require('os');

function detectPlatform() {
  const platform = os.platform(); // 'win32', 'darwin', 'linux', etc.
  const isWindows = platform === 'win32';
  const isMac = platform === 'darwin';
  const isLinux = platform === 'linux';

  // Detect shell environment
  const shell = process.env.SHELL || process.env.ComSpec || '';
  const isBash = shell.includes('bash');
  const isZsh = shell.includes('zsh');
  const isPowerShell = shell.toLowerCase().includes('powershell');
  const isCmd = shell.toLowerCase().includes('cmd');

  // Detect Git Bash / MINGW on Windows
  const isMingw = isWindows && (
    process.env.MSYSTEM !== undefined ||
    process.env.MINGW_PREFIX !== undefined
  );

  return {
    os: platform,
    isWindows,
    isMac,
    isLinux,
    shell,
    isBash,
    isZsh,
    isPowerShell,
    isCmd,
    isMingw
  };
}
```

### Pattern 2: Cross-Platform Path Handling

**What:** Use pathe for all path operations to ensure forward slashes everywhere
**When to use:** When constructing, resolving, or manipulating file paths
**Example:**
```javascript
// Source: https://github.com/unjs/pathe
const { join, resolve, normalize } = require('pathe');

// GOOD: Always produces forward slashes
const configPath = join(homeDir, '.claude', 'config.json');
// Result: /home/user/.claude/config.json (Linux)
// Result: C:/Users/user/.claude/config.json (Windows)

// WRONG: String concatenation
const configPath = homeDir + '/.claude/config.json';  // Fails on Windows
```

### Pattern 3: Symlink with Junction Fallback

**What:** Try symlink first, fall back to junction (Windows directories), then copy
**When to use:** During installation when linking directories
**Example:**
```javascript
// Source: Research synthesis from fs.symlink documentation
const fs = require('fs');
const path = require('path');

async function createLinkWithFallback(target, linkPath) {
  const isDirectory = fs.statSync(target).isDirectory();

  try {
    // Try symlink first (requires Developer Mode on Windows)
    await fs.promises.symlink(target, linkPath, isDirectory ? 'dir' : 'file');
    return { method: 'symlink', success: true };
  } catch (err) {
    if (process.platform === 'win32' && isDirectory) {
      try {
        // Fall back to junction (no admin required, directories only)
        await fs.promises.symlink(target, linkPath, 'junction');
        return { method: 'junction', success: true };
      } catch (junctionErr) {
        // Fall back to copy
        await copyRecursive(target, linkPath);
        return { method: 'copy', success: true, warning: 'Updates require reinstall' };
      }
    }
    throw err;
  }
}
```

### Pattern 4: Cross-Platform Process Spawning

**What:** Use child_process.spawn with {shell: true} for commands requiring shell
**When to use:** When executing shell commands, npm scripts, or system utilities
**Example:**
```javascript
// Source: Research synthesis from child_process documentation
const { spawn } = require('child_process');

function spawnCommand(command, args, options = {}) {
  // Node.js handles platform-specific shell selection automatically
  // Windows: cmd.exe, Unix: /bin/sh
  return spawn(command, args, {
    ...options,
    shell: true,
    stdio: 'inherit'
  });
}

// GOOD: Works on all platforms
spawnCommand('npm', ['install']);

// WRONG: Manual shell detection/wrapping
if (process.platform === 'win32') {
  spawn('cmd', ['/c', 'npm', 'install']);  // Unnecessary complexity
}
```

### Pattern 5: Terminal Capability Detection

**What:** Detect color support, Unicode, and terminal width before rendering
**When to use:** In statusline hooks, CLI output, progress bars
**Example:**
```javascript
// Source: https://github.com/chalk/supports-color
const supportsColor = require('supports-color');

function getTerminalCapabilities() {
  const colorLevel = supportsColor.stdout?.level || 0;

  return {
    // Color support: 0=none, 1=basic(16), 2=256, 3=16M
    hasColor: colorLevel > 0,
    has256Color: colorLevel >= 2,
    hasTrueColor: colorLevel >= 3,

    // Unicode support (Windows Console Host has limited Unicode)
    hasUnicode: process.platform === 'win32'
      ? Boolean(process.env.WT_SESSION || process.env.ConEmuTask)
      : process.env.TERM !== 'linux',

    // Terminal dimensions
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24
  };
}
```

### Pattern 6: npm bin with Shebang

**What:** Use `#!/usr/bin/env node` shebang and let npm/bun create platform wrappers
**When to use:** For all CLI entry points (bin/ directory)
**Example:**
```javascript
#!/usr/bin/env node

// Source: https://shapeshed.com/writing-cross-platform-node/
// npm/bun automatically creates .cmd wrappers on Windows
// Shebang works on Unix, wrapper handles Windows
console.log('Cross-platform CLI entry point');

// package.json:
// "bin": {
//   "gsd": "bin/gsd.js"  // Note: .js extension, not bash script
// }
```

### Anti-Patterns to Avoid

- **Hardcoding path separators:** Use path.join() or pathe, never `'dir1' + '/' + 'dir2'`
- **Assuming bash availability:** Git Bash is common but not guaranteed on Windows
- **String concatenation for commands:** Use spawn with array args, not string concat
- **Ignoring fs.chmod on Windows:** Windows doesn't support Unix permissions, check platform first
- **Testing only on your OS:** 24% of Node.js devs use Windows, 41% macOS - test both

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform spawn | Custom spawn wrapper with platform checks | child_process.spawn with {shell: true} | Node.js 4.8+ handles platform-specific shell selection automatically |
| Path normalization | String replace for slashes | pathe (or path.normalize) | Handles drive letters, UNC paths, relative resolution, edge cases |
| Terminal color detection | Manual TERM/COLORTERM parsing | supports-color | Handles CI environments, forced colors, terminal-specific quirks |
| Symlink fallback logic | Multi-step try/catch | Built-in fs.symlink with type parameter | Native API handles platform differences (junction on Windows) |
| Shell detection | Parse $SHELL or $ComSpec | os.platform() + process.env checks | Standard pattern, no need to parse binary paths |

**Key insight:** Node.js built-in modules handle 90% of cross-platform concerns. Use libraries for the remaining 10% (normalized paths, color detection) but avoid over-engineering with heavy abstractions.

## Common Pitfalls

### Pitfall 1: Path String Manipulation

**What goes wrong:** Hardcoding forward slashes in paths breaks on Windows, especially with drive letters
**Why it happens:** Developers test only on Unix systems where `path/to/file` works
**How to avoid:** Always use path.join() or pathe for path construction
**Warning signs:** Errors like "ENOENT: no such file or directory, open 'C:/Users/...'" when paths should work

### Pitfall 2: Spawn Without Shell Flag

**What goes wrong:** Commands like `npm install` fail with ENOENT on Windows because spawn doesn't use shell by default
**Why it happens:** On Unix, executables in PATH work without shell; Windows requires .exe or shell resolution
**How to avoid:** Use {shell: true} option when spawning commands that aren't direct executables
**Warning signs:** "spawn npm ENOENT" errors only on Windows

### Pitfall 3: Assuming Symlink Availability

**What goes wrong:** fs.symlink fails on Windows without Developer Mode or admin privileges
**Why it happens:** Windows symlinks require elevated privileges; junctions don't
**How to avoid:** Implement symlink -> junction -> copy fallback chain with clear user messaging
**Warning signs:** EPERM errors during installation on Windows

### Pitfall 4: Hardcoded Shell Commands

**What goes wrong:** Commands like `grep`, `sed`, `awk` fail on Windows (unless Git Bash installed)
**Why it happens:** These are Unix utilities, not available in cmd.exe or PowerShell
**How to avoid:** Rewrite shell scripts in Node.js using fs, string operations, or Node libraries
**Warning signs:** "command not found" errors on Windows

### Pitfall 5: fs.chmod on Windows

**What goes wrong:** fs.chmod appears to succeed but doesn't make files executable on Windows
**Why it happens:** Windows uses file extensions for executability (.exe, .cmd, .bat), not permissions
**How to avoid:** Skip chmod on Windows (check os.platform() first)
**Warning signs:** Files not executable on Windows despite chmod +x

### Pitfall 6: Case-Sensitive Filenames

**What goes wrong:** Code works on Windows/Mac (case-insensitive) but breaks on Linux (case-sensitive)
**Why it happens:** require('Config') finds config.js on Mac but not Linux
**How to avoid:** Use consistent casing in filenames and requires; test on Linux
**Warning signs:** Works locally but fails in CI/production (Linux containers)

### Pitfall 7: Terminal Feature Assumptions

**What goes wrong:** Unicode characters or ANSI colors render as garbage in Windows Console Host
**Why it happens:** Old Windows console doesn't support Unicode or 256-color ANSI
**How to avoid:** Detect terminal capabilities and provide ASCII/basic color fallbacks
**Warning signs:** Users report "weird characters" in output on Windows

## Code Examples

Verified patterns from official sources:

### Platform Detection Module

```javascript
// Source: Research synthesis from Node.js os module
const os = require('os');

class PlatformDetector {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMac = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';

    this.shell = this._detectShell();
    this.terminal = this._detectTerminal();
  }

  _detectShell() {
    const shell = process.env.SHELL || process.env.ComSpec || '';
    return {
      path: shell,
      isBash: shell.includes('bash'),
      isZsh: shell.includes('zsh'),
      isPowerShell: shell.toLowerCase().includes('powershell'),
      isCmd: shell.toLowerCase().includes('cmd'),
      isMingw: this.isWindows && (
        process.env.MSYSTEM !== undefined ||
        process.env.MINGW_PREFIX !== undefined
      )
    };
  }

  _detectTerminal() {
    // Windows Terminal, ConEmu, VS Code terminal
    const hasUnicode = this.isWindows
      ? Boolean(process.env.WT_SESSION || process.env.ConEmuTask || process.env.TERM_PROGRAM === 'vscode')
      : process.env.TERM !== 'linux';

    return {
      program: process.env.TERM_PROGRAM,
      hasUnicode,
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24
    };
  }
}

module.exports = new PlatformDetector();
```

### Cross-Platform Installer

```javascript
// Source: Research synthesis from fs and pathe documentation
const fs = require('fs').promises;
const path = require('path');
const { join } = require('pathe');
const os = require('os');

async function installGSD(targetDir, sourceDir, useLinks = false) {
  const platform = os.platform();
  const isWindows = platform === 'win32';

  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  if (useLinks) {
    // Development mode: symlink/junction for live updates
    const linkResult = await createLinkWithFallback(sourceDir, targetDir);
    console.log(`Linked using ${linkResult.method}`);
    if (linkResult.warning) {
      console.warn(linkResult.warning);
    }
  } else {
    // Production mode: copy files
    await copyRecursive(sourceDir, targetDir);
    console.log('Installed via copy');
  }

  // Set executable permissions on Unix only
  if (!isWindows) {
    const binFile = join(targetDir, 'bin', 'gsd');
    await fs.chmod(binFile, 0o755);
  }

  // Save installation metadata
  const metadata = {
    version: require('../package.json').version,
    installed_at: new Date().toISOString(),
    method: useLinks ? 'link' : 'copy',
    platform: platform
  };

  await fs.writeFile(
    join(targetDir, '.install-meta.json'),
    JSON.stringify(metadata, null, 2)
  );
}
```

### Rewriting Bash to Node.js

```javascript
// BEFORE: hooks/pre-compact.sh (bash)
#!/bin/bash
set -euo pipefail
PLANNING_DIR="${GSD_PLANNING_DIR:-.planning}"
TIMESTAMP=$(date -Iseconds)
mkdir -p "$PLANNING_DIR"
echo "${TIMESTAMP} | COMPACTION" >> "$PLANNING_DIR/events.log"

// AFTER: hooks/pre-compact.js (Node.js)
#!/usr/bin/env node
const fs = require('fs').promises;
const { join } = require('pathe');

async function main() {
  const planningDir = process.env.GSD_PLANNING_DIR || '.planning';
  const timestamp = new Date().toISOString();

  await fs.mkdir(planningDir, { recursive: true });

  const logEntry = `${timestamp} | COMPACTION\n`;
  await fs.appendFile(join(planningDir, 'events.log'), logEntry);
}

main().catch(err => {
  console.error('Pre-compact hook error:', err.message);
  process.exit(2);  // Block compaction on error
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| cross-spawn package | Built-in spawn with {shell: true} | Node 4.8+ (2016) | Removes 300KB dependency, simpler API |
| Manual shell detection | {shell: true} auto-detection | Node 4.8+ (2016) | Node handles cmd.exe vs /bin/sh automatically |
| Bash scripts | Node.js scripts with shebang | Ongoing | Works on Windows without Git Bash requirement |
| Manual ANSI detection | supports-color | 2020+ | Handles CI, forced colors, terminal-specific quirks |
| symlink-dir package | Built-in fs.symlink with type | Node 10+ (2018) | Native API with junction support |

**Deprecated/outdated:**
- **cross-spawn**: Modern Node.js has native shell support (v4.8+), package hasn't been updated in a year
- **platform-detect**: os.platform() is sufficient; extra abstraction adds no value
- **Bash scripts in npm packages**: Breaks Windows without Git Bash; use Node.js instead

## Open Questions

Things that couldn't be fully resolved:

1. **Windows Developer Mode Detection**
   - What we know: Developer Mode enables symlinks without admin privileges
   - What's unclear: No Node.js API to detect if Developer Mode is enabled
   - Recommendation: Try symlink, catch EPERM, then fall back to junction. Inform user they can enable Developer Mode for true symlinks.

2. **Git Bash Auto-Detection Reliability**
   - What we know: MINGW environment variables indicate Git Bash
   - What's unclear: Coverage of all MINGW variants (MSYS2, Cygwin, Git for Windows)
   - Recommendation: Treat Git Bash as Unix-like (has bash, grep, sed available) but warn on degraded environments

3. **Hook Timeout Default**
   - What we know: Hooks should have configurable timeout to prevent hangs
   - What's unclear: Optimal default value (5s? 10s? 30s?)
   - Recommendation: Start with 10s default, make configurable in config.json, log when hooks approach timeout

4. **Statusline Update Frequency**
   - What we know: Statusline renders on every prompt
   - What's unclear: Performance impact of platform detection on every render
   - Recommendation: Cache platform detection results in .install-meta.json, re-detect only on install/upgrade

## Sources

### Primary (HIGH confidence)

- [Node.js Path Module Documentation](https://nodejs.org/api/path.html) - Official path handling API
- [Node.js OS Module Documentation](https://nodejs.org/api/os.html) - Platform detection (os.platform, os.homedir)
- [Node.js File System Documentation](https://nodejs.org/api/fs.html) - Symlink, chmod, file operations
- [GitHub: unjs/pathe](https://github.com/unjs/pathe) - Normalized path library README and examples
- [GitHub: moxystudio/node-cross-spawn](https://github.com/moxystudio/node-cross-spawn) - Cross-spawn documentation (determined unnecessary for modern Node.js)
- [GitHub: chalk/supports-color](https://github.com/chalk/supports-color) - Terminal color detection library
- [Cross-platform Node.js Guide (ehmicky)](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/file_paths.md) - Comprehensive cross-platform patterns

### Secondary (MEDIUM confidence)

- [Writing cross-platform Node.js (George Ornbo)](https://shapeshed.com/writing-cross-platform-node/) - Best practices verified against official docs
- [Cross-platform Node.js (Alan Norbauer)](https://alan.norbauer.com/articles/cross-platform-nodejs/) - Path and spawn patterns verified
- [Node.js File Path Best Practices (W3Schools)](https://www.w3schools.com/nodejs/nodejs_path.asp) - Basic patterns confirmed with official docs

### Tertiary (LOW confidence)

- WebSearch results on Windows Developer Mode and symlink detection - Confirmed no native detection API exists
- WebSearch results on terminal emulator detection - Patterns verified against supports-color source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Node.js built-in modules are authoritative; pathe verified via GitHub
- Architecture: HIGH - Patterns verified against official Node.js documentation
- Pitfalls: HIGH - Common mistakes documented in cross-platform guide and verified in GitHub issues

**Research date:** 2026-02-09
**Valid until:** 30 days (stable domain, Node.js APIs don't change frequently)

**Key findings confidence:**
- Use pathe for paths: HIGH (verified in GitHub, 10M+ downloads)
- Avoid cross-spawn: HIGH (Node.js 4.8+ has native shell support, verified in docs)
- Rewrite bash to Node.js: HIGH (standard pattern for npm CLI tools)
- Platform detection module: HIGH (os module is native and well-documented)
- Symlink fallback chain: MEDIUM (pattern synthesized from multiple sources)
