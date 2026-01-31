# Phase 3: Installation Enhancements - Research

**Researched:** 2026-01-31
**Domain:** Node.js installer patterns, filesystem linking strategies, installation metadata persistence
**Confidence:** HIGH

## Summary

Phase 3 enhances the GSD installer to support two installation modes: file copy (industry standard, default) and symlink/junction (development workflow). The current implementation at `bin/install.js` already has extensive infrastructure for the `--link` flag but needs completion and refinement to meet all requirements.

The research reveals that the installer currently implements most of the needed functionality, particularly around junction creation on Windows (line 245-246 uses `type: 'junction'` which requires no admin privileges). The critical missing pieces are: (1) making file copy the true default behavior, (2) detecting existing installation type, and (3) matching that type on re-runs.

The technical foundation is sound: Node.js `fs.symlinkSync()` with `type: 'junction'` creates Windows junctions without admin privileges, `fs.lstat()` + `isSymbolicLink()` reliably detects symlinked installations, and marker files can track installation metadata.

**Primary recommendation:** Implement installation type detection using `fs.lstat().isSymbolicLink()` on key directories, persist installation metadata in a `.install-meta.json` file, and ensure file copy is the default path (currently `--link` defaults to false which is correct).

## Standard Stack

The established approach for Node.js installers with dual copy/link modes:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | 16.7.0+ | File operations, symlinks, junctions | Built-in, cross-platform, no dependencies |
| path | Built-in | Path manipulation | Required for cross-platform paths |
| os | Built-in | Platform detection, home directory | Standard for platform-specific behavior |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | 11.x | Enhanced fs operations | If needing copy utilities (not required - fs.copyFileSync exists) |
| mkdirp | 3.x | Recursive directory creation | Not needed - fs.mkdirSync({ recursive: true }) exists in Node 16+ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fs.symlinkSync | fs-extra.ensureSymlink | fs-extra adds dependency weight; built-in fs is sufficient |
| Manual copy loops | fs-extra.copy | Built-in fs works fine; existing code uses fs.copyFileSync successfully |
| JSON for metadata | YAML/TOML | JSON is native to Node.js, no parsing library needed |

**Installation:**
```bash
# No additional packages needed - all functionality is built-in to Node.js 16.7.0+
```

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── install.js                  # Main installer (already exists)
get-stuff-done/
├── .install-meta.json         # Installation metadata (NEW - tracks mode)
├── VERSION                    # Version tracking (already exists)
```

### Pattern 1: Installation Type Detection
**What:** Detect whether existing installation used file copy or symlinks
**When to use:** Every time installer runs (to match existing install type)
**Example:**
```javascript
// Source: Node.js fs documentation + research findings
async function detectInstallationType(targetPath) {
  try {
    const stats = await fs.promises.lstat(targetPath);
    return stats.isSymbolicLink() ? 'link' : 'copy';
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // No existing installation
    }
    throw err;
  }
}
```

**Key insight:** Use `fs.lstat()` not `fs.stat()` - `stat()` follows symlinks and won't detect them.

### Pattern 2: Installation Metadata Persistence
**What:** Store installation mode in a marker file
**When to use:** After successful installation
**Example:**
```javascript
// Source: Common installer pattern research
const metadata = {
  version: pkg.version,
  installType: useLinks ? 'link' : 'copy',
  installedAt: new Date().toISOString(),
  platform: process.platform
};
fs.writeFileSync(
  path.join(targetDir, 'get-stuff-done', '.install-meta.json'),
  JSON.stringify(metadata, null, 2)
);
```

### Pattern 3: Windows Junction Creation (Already Implemented)
**What:** Use `type: 'junction'` for Windows directories
**When to use:** Creating directory symlinks on Windows
**Example:**
```javascript
// Source: Current bin/install.js line 245-246
if (isDirectory) {
  const type = isWindows ? 'junction' : 'dir';
  fs.symlinkSync(target, linkPath, type);
}
```

**Why this works:** Windows junctions don't require admin privileges (unlike regular symlinks which typically do).

### Pattern 4: Re-installation Type Matching
**What:** Detect and preserve installation type across re-runs
**When to use:** When installer detects existing installation
**Example:**
```javascript
// Pseudo-code pattern
const existingType = await detectInstallationType(keyDirectory);
if (existingType && !hasExplicitFlag) {
  // Match existing installation type
  useLinks = (existingType === 'link');
  console.log(`Detected ${existingType} installation, matching...`);
}
```

### Anti-Patterns to Avoid
- **Using `fs.stat()` for symlink detection:** Always use `fs.lstat()` - `stat()` follows symlinks and will report the target's properties, not the link itself
- **Assuming symlinks work everywhere:** Windows has three link types (file symlink, dir symlink, junction) - junctions are the reliable choice for directories
- **Hardcoding platform checks:** Use `process.platform === 'win32'` consistently (not `os.platform()` or string checks for "Windows")
- **Ignoring existing installations:** Always check for and respect existing installation type unless user explicitly overrides with flag

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting symlinks | Custom file type detection | `fs.lstat().isSymbolicLink()` | Built-in, handles platform differences, tested across Node.js versions |
| Cross-platform symlinks | Platform-specific link logic | `fs.symlinkSync(target, path, type)` with `type = isWindows ? 'junction' : 'dir'` | Node.js handles platform differences internally, junctions work without admin |
| Recursive directory creation | Custom mkdir loops | `fs.mkdirSync(path, { recursive: true })` | Built-in since Node.js 10.12.0, handles race conditions |
| Path manipulation | String concatenation | `path.join()`, `path.resolve()` | Handles platform path separators, normalizes paths |
| Home directory detection | Environment variables | `os.homedir()` | Handles platform differences (HOME vs USERPROFILE) |

**Key insight:** The current installer already uses these patterns correctly - research confirms they're the industry standard approach.

## Common Pitfalls

### Pitfall 1: Using `fs.stat()` Instead of `fs.lstat()`
**What goes wrong:** Symlink detection fails because `stat()` follows the link
**Why it happens:** `fs.stat()` is more commonly used and developers forget about `lstat()`
**How to avoid:** Always use `fs.lstat()` when checking if a path itself is a symlink
**Warning signs:** `isSymbolicLink()` always returns false even though you know it's a symlink
**Source:** [Node.js — Check if a Path is a SymLink](https://futurestud.io/tutorials/node-js-check-if-a-path-is-a-symlink-symbolic-link)

### Pitfall 2: Requiring Admin Rights for Windows Symlinks
**What goes wrong:** Installer fails on Windows without admin elevation
**Why it happens:** Using `type: 'dir'` or `type: 'file'` instead of `type: 'junction'` for directories
**How to avoid:** Use `type: 'junction'` for directories on Windows (already implemented correctly in current code)
**Warning signs:** Users report "Operation requires elevation" errors on Windows
**Source:** [Windows: Use junctions rather than symlinks](https://github.com/Schniz/fnm/pull/519)

### Pitfall 3: Symlinks with File Transformations
**What goes wrong:** Symlinked files reference wrong paths because transformations weren't applied
**Why it happens:** Symlinking files that need content transformation (like OpenCode frontmatter conversion)
**How to avoid:** Don't allow `--link` mode for runtimes requiring file transformations (current code blocks this at line 909-912)
**Warning signs:** Symlinked installation has broken path references or incompatible file formats
**Source:** Current implementation analysis

### Pitfall 4: Not Detecting Existing Installation Type
**What goes wrong:** File copy installation gets upgraded to symlinks (or vice versa), breaking user's workflow
**Why it happens:** Installer doesn't check what mode was used previously
**How to avoid:** Detect existing installation type and match it unless user explicitly specifies a flag
**Warning signs:** Users report "my installation mode changed" after re-running installer
**Source:** INSTALL-04 requirement analysis

### Pitfall 5: Junction Target Path Requirements
**What goes wrong:** Junction creation fails with "invalid target" error
**Why it happens:** Junctions require absolute paths, relative paths fail
**How to avoid:** Node.js automatically normalizes junction targets to absolute paths (handled internally)
**Warning signs:** Junction creation errors mentioning "target must be absolute"
**Source:** [Node.js fs.symlinkSync() documentation](https://nodejs.org/api/fs.html)

## Code Examples

Verified patterns from official sources and existing implementation:

### Detecting Installation Type
```javascript
// Source: Research synthesis + Node.js fs documentation
async function detectInstallationType(targetDir) {
  // Check multiple key directories to be confident
  const keyPaths = [
    path.join(targetDir, 'commands', 'gsd'),
    path.join(targetDir, 'get-stuff-done'),
    path.join(targetDir, 'agents')
  ];

  for (const checkPath of keyPaths) {
    if (fs.existsSync(checkPath)) {
      try {
        const stats = await fs.promises.lstat(checkPath);
        if (stats.isSymbolicLink()) {
          return 'link';
        }
      } catch (err) {
        // Path exists but lstat failed - assume copy
        continue;
      }
    }
  }

  // If we found paths but none were symlinks, it's a copy installation
  return keyPaths.some(p => fs.existsSync(p)) ? 'copy' : null;
}
```

### Creating Cross-Platform Symlinks
```javascript
// Source: Current bin/install.js lines 219-251 (already implemented correctly)
function createSymlink(target, linkPath, isDirectory) {
  // Remove existing file/link/directory at linkPath
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(linkPath);
    } else if (stat.isDirectory()) {
      fs.rmSync(linkPath, { recursive: true });
    }
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(linkPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (isDirectory) {
    // On Windows, use junction for directories (works without admin)
    // On Unix, use 'dir' type
    const type = isWindows ? 'junction' : 'dir';
    fs.symlinkSync(target, linkPath, type);
  } else {
    // For files, use 'file' type on all platforms
    fs.symlinkSync(target, linkPath, 'file');
  }
}
```

### Persisting Installation Metadata
```javascript
// Source: Common installer pattern (NEW - to be implemented)
function writeInstallMetadata(targetDir, installType, version) {
  const metadata = {
    version: version,
    installType: installType, // 'copy' or 'link'
    installedAt: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version
  };

  const metaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n');
  return metaPath;
}

function readInstallMetadata(targetDir) {
  const metaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null; // No metadata file or parse error
  }
}
```

### Installation Type Auto-Detection Flow
```javascript
// Source: Research synthesis (NEW - to be implemented)
async function determineInstallMode(targetDir, hasLinkFlag, useLinks) {
  // Priority order:
  // 1. Explicit --link flag from user
  // 2. Existing installation type (from metadata or detection)
  // 3. Default to copy mode

  if (hasLinkFlag) {
    // User explicitly requested a mode
    return useLinks;
  }

  // Check metadata file first (fast, reliable)
  const metadata = readInstallMetadata(targetDir);
  if (metadata && metadata.installType) {
    console.log(`  Detected ${metadata.installType} installation, matching mode`);
    return metadata.installType === 'link';
  }

  // Fallback: detect by checking filesystem
  const detectedType = await detectInstallationType(targetDir);
  if (detectedType) {
    console.log(`  Detected ${detectedType} installation (filesystem check), matching mode`);
    return detectedType === 'link';
  }

  // No existing installation - use default (copy)
  return false;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Require admin for Windows symlinks | Use junctions for directories | Node.js 0.10+ | Enables symlinks on Windows without elevation |
| Manual recursive mkdir | `fs.mkdirSync({ recursive: true })` | Node.js 10.12.0 (2018) | Simpler code, handles race conditions |
| Custom copy utilities | Built-in `fs.copyFileSync` | Node.js 8.5.0 (2017) | No dependencies needed for file copying |
| npm link (global symlinks) | Local development with `--link` flag | 2020s trend | Better isolation, per-project control |
| Single installation mode | Dual mode (copy for production, symlinks for dev) | Modern installers | Flexibility for different workflows |

**Deprecated/outdated:**
- **fs-extra for basic operations**: Built-in fs now has `copyFileSync`, `mkdirSync({ recursive })`, and other conveniences
- **Admin-required symlinks on Windows**: Junctions work without admin; Developer Mode enables regular symlinks
- **Hard-coded path separators**: Always use `path.join()` - handles `/` vs `\` automatically
- **Manual platform detection strings**: Use `process.platform === 'win32'` not string matching

## Open Questions

Things that couldn't be fully resolved:

1. **Which directories to check for installation type detection?**
   - What we know: Key directories are `commands/gsd`, `get-stuff-done`, `agents`, `hooks`
   - What's unclear: Should we check all of them or just one? What if they're mixed (some symlinked, some copied)?
   - Recommendation: Check multiple directories but use first symlink found as definitive "link" mode; only mark as "copy" if all checked paths exist and none are symlinks
   - Confidence: MEDIUM (needs validation during implementation)

2. **Handling mixed installations (some symlinks, some copies)**
   - What we know: Current code doesn't prevent manual mixing of installation types
   - What's unclear: Should installer detect and warn about mixed states? Auto-fix them?
   - Recommendation: If detected, warn user and recommend clean install; don't auto-fix (could lose data)
   - Confidence: LOW (edge case, needs product decision)

3. **Upgrading from version without `.install-meta.json`**
   - What we know: Existing installations (v1.9.13 and earlier) don't have metadata file
   - What's unclear: Best UX for first run after upgrade
   - Recommendation: Use filesystem detection as fallback, then write metadata file for future runs
   - Confidence: HIGH (fallback pattern is well-established)

4. **Should metadata file be in `.gitignore`?**
   - What we know: Installation metadata is deployment-specific, not source code
   - What's unclear: For local project installs (`.claude/`), should users commit this?
   - Recommendation: Don't gitignore it - it's useful for tracking installation state in project repos; document that it's safe to commit
   - Confidence: MEDIUM (depends on user workflows)

## Sources

### Primary (HIGH confidence)
- [Node.js File System Documentation v25.3.0](https://nodejs.org/api/fs.html) - Official API reference for fs.lstat, fs.symlinkSync, fs.mkdirSync
- [Node.js — Check if a Path is a SymLink](https://futurestud.io/tutorials/node-js-check-if-a-path-is-a-symlink-symbolic-link) - fs.lstat() vs fs.stat() for symlink detection
- [Windows: Use junctions rather than symlinks](https://github.com/Schniz/fnm/pull/519) - Junction benefits on Windows
- [fs.symlinkSync requires admin privileges in Windows with type `junction`](https://github.com/nodejs/node-v0.x-archive/issues/9101) - Clarifies junction permissions
- Current implementation analysis (bin/install.js) - Verified existing patterns

### Secondary (MEDIUM confidence)
- [npm-link | npm Docs](https://docs.npmjs.com/cli/v9/commands/npm-link/) - npm's approach to symlink-based development
- [How does npm link create symlinks in Windows without admin privileges?](https://github.com/npm/npm/issues/10926) - Community discussion on Windows linking
- [symlink-or-copy - npm](https://www.npmjs.com/package/symlink-or-copy) - Library demonstrating symlink detection patterns
- [Hardlinks, Symlinks, and Junctions on Windows](https://hy2k.dev/en/blog/2025/11-23-windows-hardlink-symlink-junction/) - Windows filesystem link types explained

### Tertiary (LOW confidence)
- WebSearch results on npm postinstall patterns - General patterns, not specific verification
- Community discussions on installation best practices - Anecdotal, not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Built-in Node.js APIs are well-documented and stable
- Architecture: HIGH - Existing implementation validates these patterns work correctly
- Pitfalls: HIGH - Verified through official documentation and known issues
- Code examples: HIGH - Drawn from current implementation and Node.js docs
- Open questions: MEDIUM - Edge cases need validation during implementation

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (60 days - stable Node.js APIs, unlikely to change)

**Current implementation status:**
- `--link` flag parsing: ✓ Implemented (line 22)
- Junction creation on Windows: ✓ Implemented (line 245)
- Symlink creation helper: ✓ Implemented (lines 219-251)
- File copy mode: ✓ Implemented (default behavior)
- Installation type detection: ✗ Not implemented (INSTALL-04)
- Installation metadata persistence: ✗ Not implemented (needed for INSTALL-04)
- Re-installation type matching: ✗ Not implemented (INSTALL-04)

**Key findings for planner:**
1. Most infrastructure already exists - this is primarily a completion/refinement phase
2. File copy is already the default (no flag needed) - INSTALL-01 is satisfied by current code
3. `--link` flag works but needs type detection and persistence for INSTALL-04
4. Windows junctions work correctly without admin - INSTALL-03 is satisfied
5. Missing piece: detect and persist installation type for re-run matching
