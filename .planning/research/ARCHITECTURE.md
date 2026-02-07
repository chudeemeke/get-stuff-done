# Architecture Patterns: GSD v0.2.0 Hardening

**Domain:** Meta-prompting and spec-driven development system for Claude Code
**Researched:** 2026-02-07
**Focus:** Integration architecture for hardening, platform support, and upstream sync enhancements

## Executive Summary

GSD v0.2.0 adds security hardening, cross-platform support, auto-update checks, diff preview, rollback, and Claude Code capability adoption to the existing v0.1.0 architecture. The existing architecture is a hybrid system combining:

1. **Node.js CLI tooling** (installer, hooks, configuration)
2. **Shell-based workflows** (orchestrated through Claude Code's Bash tool)
3. **Markdown-based context system** (templates, references, commands read by Claude)
4. **Git operations** (via bash commands for upstream sync)

New features integrate at multiple layers: installer enhancements (cross-platform detection), config system extensions (security settings), workflow enhancements (rollback, diff preview), and statusline improvements (update notifications).

## Existing Architecture (v0.1.0 Baseline)

### Component Inventory

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| **Installer** | Node.js script | `bin/install.js` | Copy/link files to ~/.claude/ |
| **ConfigLoader** | Node.js module | `src/config/ConfigLoader.js` | JSON5 config with AJV validation |
| **ConfigSchema** | JSON Schema | `src/config/ConfigSchema.js` | Schema validation rules |
| **Theme System** | Node.js modules | `src/theme/` | ANSI styling (Style Composer pattern) |
| **Statusline Hook** | Node.js script | `hooks/gsd-statusline.js` | Runs on every prompt |
| **Update Check Hook** | Node.js script | `hooks/gsd-check-update.js` | Runs on SessionStart |
| **Upstream Sync** | Markdown workflow | `get-stuff-done/workflows/upstream-sync.md` | 7-stage git workflow |
| **Commands** | Markdown files | `commands/gsd/*.md` | Slash command definitions |
| **Agents** | Markdown files | `agents/gsd-*.md` | Subagent behavior specs |
| **Workflows** | Markdown files | `get-stuff-done/workflows/*.md` | Orchestration logic |

### Data Flow Patterns

**Installation Flow:**
```
npm install @chude/get-stuff-done
  → bin/install.js
  → Detect platform (Windows/Unix)
  → Copy/link files to ~/.claude/
  → Register hooks in settings.json
  → Write VERSION file
```

**Configuration Flow:**
```
Hook execution
  → Require src/config/ConfigLoader.js
  → Read ~/.gsd/config.json
  → Parse JSON5
  → Validate with AJV schema
  → Return config object
```

**Upstream Sync Flow:**
```
/gsd:upstream command
  → Pre-flight checks (git clean, auth)
  → Spawn Task with upstream-sync.md workflow
  → 7 stages (FETCH → PRESENT → PLAN → EXECUTE → VERIFY → PUBLISH → FINALIZE)
  → Checkpoints return to orchestrator
  → User input → Resume with continuation
  → Update cache.json on success
```

**Update Check Flow:**
```
SessionStart hook
  → hooks/gsd-check-update.js
  → Spawn detached child process
  → Read VERSION file
  → npm view @chude/get-stuff-done version
  → Write ~/.claude/cache/gsd-update-check.json
  → Statusline reads cache and displays notification
```

## Integration Points for v0.2.0 Features

### 1. Security Hardening

**Where:** ConfigSchema.js, installer validation, workflow scripts

**Integration approach:**

```javascript
// ConfigSchema.js extension
security: {
  type: 'object',
  properties: {
    validate_npm_packages: { type: 'boolean', default: true },
    require_signed_commits: { type: 'boolean', default: false },
    allowed_registries: {
      type: 'array',
      items: { type: 'string', format: 'uri' },
      default: ['https://registry.npmjs.org/']
    },
    scan_for_secrets: { type: 'boolean', default: true }
  }
}
```

**New component needed:**
- **SecurityValidator module** (`src/security/SecurityValidator.js`)
  - Input sanitization for shell commands
  - Registry whitelist validation
  - Secret pattern detection (regex for common secret formats)
  - Package signature verification hooks

**Modified components:**
- `upstream-sync.md` workflow: Add validation stage before publish
- `bin/install.js`: Validate source integrity before copy/link
- `src/config/ConfigLoader.js`: Sanitize config paths, validate registry URLs

**Architecture consideration:**
Security validation should be non-blocking with warnings for most checks, blocking only for critical issues (malformed commands, known malicious patterns). This preserves the "fast by default" philosophy while adding safety nets.

### 2. Cross-Platform Support

**Where:** Installer, path handling throughout

**Current state:** Installer already has some Windows support (junctions vs symlinks, path.sep usage)

**Integration approach:**

```javascript
// New cross-platform module: src/platform/PlatformUtils.js
const path = require('path');

function normalizePath(filePath) {
  // Always use forward slashes for Node.js compatibility
  return filePath.replace(/\\/g, '/');
}

function getShellCommand(command, args) {
  if (process.platform === 'win32') {
    // PowerShell-compatible command escaping
    return `powershell -Command "${command} ${args.join(' ')}"`;
  }
  return `${command} ${args.join(' ')}`;
}

function getSeparator() {
  return process.platform === 'win32' ? ';' : ':';
}

module.exports = { normalizePath, getShellCommand, getSeparator };
```

**Modified components:**
- `bin/install.js`: Already uses `path.sep`, `process.platform` checks
  - Add: Registry validation with platform-specific paths
  - Add: Shell script execution compatibility layer
- `hooks/gsd-statusline.js`: Unicode detection already present
  - Add: Windows Console Host emoji fallback
- `upstream-sync.md` workflow: Git commands work cross-platform
  - Add: PowerShell escaping for Windows paths with spaces

**Cross-platform testing matrix:**
| Platform | Shell | Path Separator | Symlink Support | Notes |
|----------|-------|----------------|-----------------|-------|
| macOS | bash/zsh | / | Yes | Primary dev platform |
| Linux | bash | / | Yes | CI/CD target |
| Windows 10+ | PowerShell | \\ | Junctions only | ConEmu/Windows Terminal |
| WSL2 | bash | / | Yes | Hybrid path handling |

**Architecture consideration:**
Use Node.js `path` module exclusively for path operations (never string concatenation). Prefer `path.posix` for internal paths, `path.normalize()` only when outputting to terminal. Store paths in forward-slash format internally, convert on display.

### 3. Auto-Update Check Enhancement

**Where:** Existing update check hook, statusline display

**Current state:** Basic version check with npm registry, cache file, statusline notification

**Integration approach:**

**Enhanced cache structure:**
```json
{
  "update_available": true,
  "installed": "2.1.1",
  "latest": "2.2.0",
  "checked": 1707331200,
  "changelog_url": "https://github.com/chudeemeke/get-stuff-done/blob/main/CHANGELOG.md#220",
  "security_fixes": true,
  "breaking_changes": false,
  "check_interval": 86400
}
```

**New component:**
- **UpdateManager module** (`src/update/UpdateManager.js`)
  - Fetch npm package metadata (not just version)
  - Parse CHANGELOG.md for security/breaking markers
  - Respect check_interval config setting
  - Handle registry failures gracefully

**Modified components:**
- `hooks/gsd-check-update.js`: Enhanced to fetch package metadata
- `hooks/gsd-statusline.js`: Display severity indicators (security icon, breaking change warning)
- Config schema: Add `updates.check_interval`, `updates.auto_check` settings

**Architecture consideration:**
Use background spawn with `detached: true`, `stdio: 'ignore'`, and `child.unref()` to avoid blocking SessionStart. Cache TTL prevents excessive registry checks. Display priority: security > breaking > feature updates.

### 4. Diff Preview

**Where:** New component integrated with upstream sync workflow

**Integration approach:**

**New component:**
- **DiffRenderer module** (`src/diff/DiffRenderer.js`)
  - Parse git diff output
  - Apply ANSI color codes (using existing theme system)
  - Handle word-level diffs with `--word-diff`
  - Respect terminal width for wrapping

```javascript
// src/diff/DiffRenderer.js
const { getTheme } = require('../theme');
const theme = getTheme();

class DiffRenderer {
  constructor(options = {}) {
    this.context = options.context || 3;
    this.wordDiff = options.wordDiff || false;
    this.colorMoved = options.colorMoved || true;
  }

  render(diffOutput) {
    const lines = diffOutput.split('\n');
    return lines.map(line => {
      if (line.startsWith('+')) {
        return theme.diff.added.render(line);
      } else if (line.startsWith('-')) {
        return theme.diff.removed.render(line);
      } else if (line.startsWith('@@')) {
        return theme.diff.hunk.render(line);
      }
      return line;
    }).join('\n');
  }
}

module.exports = DiffRenderer;
```

**Modified components:**
- `upstream-sync.md` workflow: Add Stage 2b - DIFF_PREVIEW checkpoint
  - After user selects commits (Stage 2)
  - Before execution (Stage 3)
  - Show colorized diff of all selected commits
  - Prompt: "Review diff? [yes/no/abort]"
- Theme system: Add `theme.diff.*` styles (added, removed, hunk, context)

**New command:**
- `/gsd:preview-diff` - Standalone diff viewer for any git range
  - Arguments: `<commit-range>` (e.g., "HEAD~5..HEAD")
  - Output: Colorized diff with file tree summary

**Architecture consideration:**
Diff rendering happens on-demand, not cached (diffs can be large). Use streaming for large diffs to avoid memory pressure. Terminal width detection using `process.stdout.columns` with 80-column fallback.

### 5. Rollback Capability

**Where:** New component integrated with update and sync workflows

**Integration approach:**

**New component:**
- **RollbackManager module** (`src/rollback/RollbackManager.js`)
  - Maintain rollback history in `.planning/rollback/history.json`
  - Create snapshots before updates/syncs
  - Git-based rollback (tags, commit SHAs)
  - npm version downgrade support

```javascript
// src/rollback/RollbackManager.js
class RollbackManager {
  constructor(historyPath = '.planning/rollback/history.json') {
    this.historyPath = historyPath;
  }

  createSnapshot(label, metadata) {
    const snapshot = {
      id: Date.now(),
      label,
      timestamp: new Date().toISOString(),
      git_sha: this.getGitSha(),
      package_version: this.getPackageVersion(),
      metadata
    };
    this.appendHistory(snapshot);
    return snapshot.id;
  }

  rollbackTo(snapshotId) {
    const snapshot = this.getSnapshot(snapshotId);
    // 1. Git reset to SHA
    execSync(`git reset --hard ${snapshot.git_sha}`);
    // 2. npm install pinned version
    execSync(`npm install @chude/get-stuff-done@${snapshot.package_version}`);
    // 3. Run installer to restore files
    // ...
  }
}
```

**Modified components:**
- `upstream-sync.md` workflow: Create snapshot in Stage 6a (before publish)
- `/gsd:update` command: Create snapshot before npm install
- New command: `/gsd:rollback [snapshot-id]` - Interactive rollback UI

**Rollback scenarios:**
| Scenario | Rollback Strategy | Risk |
|----------|------------------|------|
| Update broke workflow | Git reset + npm install @version | LOW - git protects state |
| Sync introduced bugs | Git revert commits + npm publish | MEDIUM - new version needed |
| Config corruption | Restore config from snapshot | LOW - file-level restore |
| Hooks broken | Re-run installer from old version | LOW - reinstall previous |

**Architecture consideration:**
Rollback is destructive. Always require confirmation with clear explanation of what will be reset. Create automatic snapshot before any publish/update operation. Limit history to last 10 snapshots to prevent unbounded growth.

### 6. Claude Code Capability Adoption

**Where:** Commands, workflows, skill usage patterns

**Current state:** Uses Task tool, AskUserQuestion, SlashCommand, standard file operations

**Claude Code capabilities to adopt:**

| Capability | Current Usage | Enhancement Opportunity |
|------------|---------------|------------------------|
| **Task tool** | Subagent spawning | Already well-used, no changes needed |
| **AskUserQuestion** | User prompts | Replace inline questions with tool calls |
| **Glob/Grep** | File search | Replace `find` + `grep` bash commands |
| **Edit tool** | File modifications | Replace sed/awk with Edit tool |
| **WebFetch** | External docs | Add for fetching npm package info |

**Integration approach:**

**Phase-by-phase adoption:**
1. **Audit current bash commands** in workflows
   - Find: `find . -name "*.js"` → Glob pattern
   - Grep: `grep -r "pattern" .` → Grep tool
   - Sed: `sed 's/old/new/'` → Edit tool

2. **Replace in upstream-sync.md workflow:**
   ```markdown
   <!-- OLD: Bash approach -->
   git diff --name-only HEAD~${N}..HEAD

   <!-- NEW: Glob approach -->
   Use Glob tool with changed files from git diff output
   (Git operations remain bash - Glob for filtering/searching)
   ```

3. **Standardize in command templates:**
   - All `/gsd:*` commands should prefer Claude tools over bash
   - Exception: Git operations (no native git tool, bash is appropriate)
   - Exception: npm/bun operations (package manager CLI, not file operations)

**Modified components:**
- `upstream-sync.md`: Replace file search bash commands with Glob
- `commands/gsd/*.md`: Audit for inline questions, use AskUserQuestion
- New reference doc: `references/claude-code-tools.md` - Tool usage guide

**Architecture consideration:**
Claude Code tools are more reliable than bash (no shell quoting issues, better error handling, work in all Claude Code environments). Prefer tools for file operations, use bash only when no tool alternative exists (git, npm, platform-specific commands).

## Component Dependencies

### Existing Dependencies (from package.json)
```json
{
  "ajv": "^8.17.1",        // Config validation
  "json5": "^2.2.3"        // Config parsing
}
```

### New Dependencies Needed

**Security hardening:**
- None (use built-in Node.js APIs: `crypto`, `path.resolve`)

**Cross-platform support:**
- None (Node.js `path`, `os`, `process.platform` sufficient)

**Diff rendering:**
- None (parse git output, use existing theme system)

**Rollback:**
- None (git CLI, npm CLI, fs operations)

**Architecture principle:** Minimize dependencies. GSD is developer tooling - lean is better. Use Node.js built-ins and CLI tools over npm packages.

## Build Order and Dependencies

### Phase Structure Recommendation

**Phase 1: Foundation (Security + Platform)**
- **1.1:** Security validator module
  - No dependencies
  - Used by: Installer, config loader, workflows
- **1.2:** Cross-platform utilities
  - No dependencies
  - Used by: Installer, all path operations
- **1.3:** Config schema extensions
  - Depends on: 1.1 (security settings)
  - Used by: All hooks, workflows

**Phase 2: Update System Enhancement**
- **2.1:** UpdateManager module
  - Depends on: 1.1 (validate registry), 1.2 (paths)
  - Used by: Update check hook, statusline
- **2.2:** Enhanced statusline display
  - Depends on: 2.1 (enhanced cache format)
  - Modifies: Existing statusline hook

**Phase 3: Diff + Rollback**
- **3.1:** DiffRenderer module
  - Depends on: Theme system (existing)
  - Used by: Upstream sync workflow, new preview command
- **3.2:** RollbackManager module
  - Depends on: 1.1 (validation), 1.2 (paths)
  - Used by: Upstream sync, update command, new rollback command
- **3.3:** Workflow integration
  - Depends on: 3.1 (diff), 3.2 (rollback)
  - Modifies: upstream-sync.md, update.md

**Phase 4: Claude Code Tool Migration**
- **4.1:** Tool usage audit
  - No dependencies
  - Produces: Migration checklist
- **4.2:** Command migrations
  - No dependencies
  - Modifies: All commands with bash file operations
- **4.3:** Workflow migrations
  - No dependencies
  - Modifies: Workflows with bash file operations

**Critical path:** 1.1 → 1.2 → 1.3 (foundation) must complete before all other phases. Phases 2-4 can proceed in parallel after Phase 1.

## Cross-Platform Architectural Concerns

### Path Handling Strategy

**Rule:** Use forward slashes internally, convert only on display/execution.

```javascript
// GOOD: Cross-platform path construction
const configPath = path.join(os.homedir(), '.gsd', 'config.json');
// Result on Unix: /home/user/.gsd/config.json
// Result on Windows: C:\Users\user\.gsd\config.json

// GOOD: Normalize for display
console.log(path.normalize(configPath));

// BAD: String concatenation
const configPath = os.homedir() + '/.gsd/config.json'; // Breaks on Windows
```

### Shell Command Execution

**Problem:** Windows PowerShell vs Unix bash have different escaping rules.

**Solution:** Abstract shell commands through platform utility.

```javascript
// src/platform/ShellCommand.js
class ShellCommand {
  static git(args) {
    // Git works the same on all platforms
    return `git ${args.join(' ')}`;
  }

  static npm(args) {
    // npm works the same on all platforms
    return `npm ${args.join(' ')}`;
  }

  static node(scriptPath, args = []) {
    // Use Node.js for scripting (most portable)
    if (process.platform === 'win32') {
      return `node "${scriptPath}" ${args.join(' ')}`;
    }
    return `node "${scriptPath}" ${args.join(' ')}`;
  }
}
```

### Symlink Handling

**Current implementation:**
- Unix: `fs.symlinkSync(target, link, 'dir')`
- Windows: `fs.symlinkSync(target, link, 'junction')`

**Enhancement needed:**
- Detect if user has symlink permissions (Windows requires admin or Developer Mode)
- Fallback to copy mode if symlink fails
- Update `.install-meta.json` with actual installation type

### Hook Execution

**Current implementation:**
- Hooks specified as: `node ~/.claude/hooks/gsd-statusline.js`
- Works cross-platform because Node.js path handling normalizes

**No changes needed:** Node.js abstracts platform differences.

## Data Flow Changes

### Before v0.2.0
```
SessionStart → gsd-check-update.js → npm view → cache.json
                                                    ↓
Prompt → gsd-statusline.js → read cache → display version
```

### After v0.2.0
```
SessionStart → gsd-check-update.js → UpdateManager
                                          ↓
                                    npm view (metadata)
                                          ↓
                                    parse changelog
                                          ↓
                                    enhanced-cache.json
                                          ↓
Prompt → gsd-statusline.js → read cache → DiffRenderer (if diff requested)
                                    ↓
                              display version + severity
```

### Rollback Flow (New)
```
/gsd:upstream (before publish)
    ↓
RollbackManager.createSnapshot()
    ↓
.planning/rollback/history.json (append)
    ↓
[publish proceeds]

/gsd:rollback [id]
    ↓
RollbackManager.rollbackTo(id)
    ↓
git reset --hard SHA
    ↓
npm install @chude/get-stuff-done@VERSION
    ↓
re-run installer
    ↓
verify installation
```

## Error Handling Strategy

### Graceful Degradation

**Principle:** Features should fail gracefully without breaking core functionality.

```javascript
// Example: Security validation
try {
  SecurityValidator.checkRegistry(registryUrl);
} catch (err) {
  console.warn(`Warning: Registry validation failed: ${err.message}`);
  console.warn(`Proceeding anyway. To block invalid registries, enable strict mode.`);
  // Continue execution
}
```

### Error Categories

| Category | Example | Handling Strategy | Block Execution? |
|----------|---------|------------------|------------------|
| **Critical** | Config parse error | Show error, exit | YES |
| **Security** | Unknown registry | Warn, ask user | CONFIGURABLE |
| **Network** | npm registry down | Retry 3x, then skip | NO |
| **Platform** | Symlink permission denied | Fall back to copy | NO |
| **User Error** | Invalid rollback ID | Show error, list valid IDs | YES (for that command) |

### Retry Logic

**Pattern:** Exponential backoff with max attempts.

```javascript
async function retryOperation(operation, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await sleep(delay);
    }
  }
}
```

**Apply to:**
- npm registry checks
- Git remote operations (fetch, push)
- File system operations (rare, but possible on network drives)

## Security Architecture

### Threat Model

**Trust boundaries:**
1. **User's machine:** TRUSTED (user controls git repo, file system)
2. **npm registry:** SEMI-TRUSTED (check package signatures, validate URLs)
3. **Upstream git repo:** SEMI-TRUSTED (verify commits before cherry-pick)
4. **User input:** UNTRUSTED (validate/sanitize all input)

**Attack vectors:**
| Vector | Risk | Mitigation |
|--------|------|------------|
| Malicious config | MEDIUM | Schema validation, path sanitization |
| Command injection | HIGH | No eval, parameterized commands, shell escaping |
| Registry hijacking | MEDIUM | Whitelist registries, validate URLs |
| Commit injection | LOW | Git's built-in signature checking |
| Path traversal | MEDIUM | Validate paths, reject ../.. patterns |

### Input Validation Rules

```javascript
// src/security/Validators.js

class Validators {
  static isValidPath(userPath) {
    // Reject path traversal attempts
    const normalized = path.normalize(userPath);
    if (normalized.includes('..')) {
      throw new Error('Path traversal detected');
    }
    return normalized;
  }

  static isValidRegistryUrl(url) {
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        throw new Error('Registry must use HTTP(S)');
      }
      return parsed.href;
    } catch (err) {
      throw new Error(`Invalid registry URL: ${err.message}`);
    }
  }

  static sanitizeShellArg(arg) {
    // Remove shell metacharacters
    return arg.replace(/[;&|`$()]/g, '');
  }
}
```

### Config Security

**Risk:** User-provided paths could point to malicious scripts.

**Mitigation:**
```javascript
// ConfigLoader.js enhancement
function validateConfigSecurity(config) {
  // Validate all paths are absolute and within expected directories
  const allowedDirs = [
    path.join(os.homedir(), '.gsd'),
    path.join(os.homedir(), '.claude'),
    process.cwd() // Current project
  ];

  // Check registry URLs
  if (config.security?.allowed_registries) {
    for (const reg of config.security.allowed_registries) {
      Validators.isValidRegistryUrl(reg);
    }
  }
}
```

## Performance Considerations

### Hook Execution Time Budget

**Constraint:** Statusline hook must complete in <100ms (runs on every prompt).

**Current performance:**
- Read cache file: ~5ms
- Parse JSON: ~1ms
- Theme rendering: ~5ms
- **Total: ~11ms** ✓ Well within budget

**v0.2.0 additions:**
- Enhanced cache parsing: ~2ms (larger JSON)
- Diff rendering: N/A (only on explicit preview, not in statusline)
- **Estimated total: ~13ms** ✓ Still within budget

### Background Process Pattern

**Pattern:** Spawn detached processes for slow operations.

```javascript
// hooks/gsd-check-update.js (existing pattern, well-designed)
const child = spawn(process.execPath, ['-e', scriptSource], {
  stdio: 'ignore',        // Don't inherit stdin/stdout/stderr
  windowsHide: true,      // Windows: Don't flash console
  detached: true          // Don't keep parent alive
});
child.unref();            // Allow parent to exit
```

**Apply to:**
- Update checks (already implemented)
- Security scans (new in v0.2.0)
- Diff generation (if caching enabled)

### File System Operations

**Optimization:** Batch file operations, minimize stat() calls.

```javascript
// GOOD: Read once, cache result
const files = await fs.promises.readdir(dir);
for (const file of files) {
  // Use files array, don't re-read dir
}

// BAD: Multiple readdir calls
if (fs.existsSync(path.join(dir, 'file1.js'))) { }
if (fs.existsSync(path.join(dir, 'file2.js'))) { }
```

## Integration Testing Strategy

### Test Environments

| Environment | Purpose | Coverage |
|-------------|---------|----------|
| **macOS local** | Primary development | All features |
| **WSL2** | Windows + Unix hybrid | Path handling, symlinks |
| **Windows PowerShell** | Native Windows | Junctions, escaping |
| **Linux VM** | CI/CD target | Automation, no TTY |

### Test Scenarios

**Cross-platform installer:**
- [ ] Copy mode on Windows without admin
- [ ] Junction mode on Windows with admin
- [ ] Symlink mode on macOS/Linux
- [ ] Detection of existing installation (all modes)
- [ ] Upgrade from copy to link mode
- [ ] Upgrade from link to copy mode

**Security validation:**
- [ ] Reject config with path traversal
- [ ] Warn on unknown registry URL
- [ ] Block shell metacharacters in input
- [ ] Accept valid HTTPS registry
- [ ] Accept valid config paths

**Rollback:**
- [ ] Create snapshot before sync
- [ ] List available snapshots
- [ ] Rollback to previous version
- [ ] Rollback fails if working directory dirty
- [ ] Snapshot history pruning (keep last 10)

**Diff preview:**
- [ ] Colorized diff output
- [ ] Word-level diff
- [ ] File tree summary
- [ ] Large diff streaming (no memory issues)
- [ ] Terminal width detection and wrapping

## Migration Path from v0.1.0

### Backward Compatibility

**Principle:** v0.2.0 must work for existing v0.1.0 users without breaking changes.

**Config migration:**
```javascript
// ConfigLoader.js enhancement
function migrateConfig(config) {
  // v0.1.0 config (no security section)
  if (!config.security) {
    config.security = {
      validate_npm_packages: true,
      allowed_registries: ['https://registry.npmjs.org/']
    };
  }
  return config;
}
```

**Cache migration:**
```javascript
// UpdateManager.js
function migrateCacheFormat(oldCache) {
  // v0.1.0 format: { update_available, installed, latest, checked }
  // v0.2.0 format: adds changelog_url, security_fixes, breaking_changes
  return {
    ...oldCache,
    changelog_url: buildChangelogUrl(oldCache.latest),
    security_fixes: false,  // Unknown for old cache
    breaking_changes: false
  };
}
```

**Installation migration:**
- Existing installations remain functional
- Next `npx @chude/get-stuff-done` upgrades in place
- Installer detects existing mode (copy/link) and preserves
- New features available immediately after upgrade

## Sources

**Cross-platform Node.js:**
- [Cross-platform Node.js File Paths Guide](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/file_paths.md)
- [Writing Cross-platform Node.js](https://shapeshed.com/writing-cross-platform-node/)
- [Node.js Path Module](https://www.w3schools.com/nodejs/nodejs_path.asp)

**Security:**
- [NPM Security Best Practices - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
- [Hardening Node.js Apps in Production](https://www.sitepoint.com/hardening-node-js-apps-in-production/)
- [Awesome Node.js Security Resources](https://github.com/lirantal/awesome-nodejs-security)
- [Malicious NPM Hash Validation Packages - 2026](https://www.getsafety.com/blog-posts/malicious-hash-validation-packages)

**Background processes:**
- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [Node.js Child Processes Guide](https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/)

**Git diff and rollback:**
- [Git Diff Documentation](https://git-scm.com/docs/git-diff)
- [diff-so-fancy - Better Git Diffs](https://github.com/so-fancy/diff-so-fancy)
- [How to Rollback an npm Package](https://omribarzik.medium.com/how-to-rollback-an-npm-package-d1152b6b7c35)

---

*Architecture research: 2026-02-07*
