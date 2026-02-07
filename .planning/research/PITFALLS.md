# Domain Pitfalls: v0.2.0 Hardening & Upstream Sync

**Domain:** Node.js CLI tool enhancement with security auditing, cross-platform support, and git-based auto-update
**Researched:** 2026-02-07
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause security vulnerabilities, data loss, or platform failures.

### Pitfall 1: Arbitrary Code Execution in Upstream Cherry-Pick Workflow

**What goes wrong:** The 7-stage upstream sync workflow cherry-picks commits from an external repository without pre-validation. Malicious commits containing arbitrary shell commands in hooks, skill files, or installer scripts get pulled into the local fork and executed during installation or hook invocation.

**Why it happens:** Git cherry-pick trusts commit content completely. If upstream repo is compromised (account hijack, malicious PR merged), malicious code enters the fork. GSD's hook system executes bash scripts automatically (pre-compact, statusline), creating execution vector without user review.

**Real-world precedent:**
- CVE-2025-68145, CVE-2025-68143, CVE-2025-68144: Anthropic's Git MCP server vulnerabilities enabled remote code execution via prompt injection (Jan 2026)
- CVE-2025-48384: Git bundle protocol injection allowing arbitrary file write and code execution
- Pattern: Git-based automation workflows are prime targets for supply chain attacks

**Consequences:**
- Attacker gains shell access via malicious hook execution
- Sensitive data exfiltration (Claude Code session context, project files)
- Persistent backdoor via modified installer or hook scripts
- Reputation damage if fork becomes attack vector for downstream users

**Prevention:**
1. **Security review checkpoint in workflow Stage 3** (after fetch, before execute)
   - Pause workflow with checkpoint after `git cherry-pick --no-commit`
   - Show diff of ALL changed files (not just summary)
   - Highlight high-risk file types: `*.sh`, `hooks/**/*`, `bin/**/*`, `scripts/**/*`
   - Require explicit user approval: "Review changes in hooks, installers, and shell scripts"

2. **Automated safety checks before cherry-pick**
   - Scan diffs for suspicious patterns:
     - `eval`, `exec`, `child_process.spawn` with user input
     - Network requests (`curl`, `wget`, `fetch`, `axios`)
     - File writes to sensitive locations (`~/.ssh`, `~/.aws`, `/etc`)
     - Environment variable exfiltration (`echo $AWS_`, `printenv`)
   - Block cherry-pick if high-risk patterns detected, require manual review

3. **Upstream verification**
   - Verify upstream remote URL matches expected `glittercowboy/get-shit-done`
   - Warn if upstream URL changed since last sync
   - Detect if upstream repo ownership transferred (GitHub API check)

4. **Sandboxed execution for testing**
   - After cherry-pick, run hooks in isolated environment (Docker container or VM)
   - Monitor for network activity, file access outside project directory
   - Only promote to real hooks directory if sandbox tests pass

**Detection (warning signs):**
- Upstream commits touching `hooks/`, `bin/`, `scripts/` without explanation in commit message
- Network errors during hook execution (unexpected outbound connections)
- File permission changes (executable bit added to previously non-executable files)
- New environment variable references in hook scripts
- `git diff` shows obfuscated code (base64, hex, compressed strings)

**Which phase:** Phase 1 (Security Audit) - MUST implement before any upstream sync execution

**Reference:** [Anthropic MCP Git Server Vulnerabilities](https://www.infosecurity-magazine.com/news/prompt-injection-bugs-anthropic/), [Git CVE-2025-48384 RCE](https://www.helpnetsecurity.com/2025/08/26/git-vulnerability-exploited-cve-2025-48384/)

---

### Pitfall 2: Platform Detection Failures in Windows Git Bash (MINGW)

**What goes wrong:** Platform detection using `process.platform` returns `'win32'`, but code assumes native Windows environment. Git Bash runs in MINGW emulation layer with POSIX-style paths (`/c/Users/...`) that break Windows-specific logic. Symlink/junction creation fails silently or creates wrong type.

**Why it happens:** `process.platform === 'win32'` is true in Git Bash, but shell environment is POSIX (Bash 5.x, MINGW path translation). Code written for native Windows (cmd.exe, PowerShell) uses backslash paths, assumes `C:\` drives, and creates junctions with absolute paths. MINGW auto-translates `/foo` to `C:/Program Files/Git/foo`, breaking path assumptions.

**GSD-specific context:**
- Current system: Windows-first, Git Bash primary shell, uses junctions for `--link` mode (no admin required)
- Installer (`bin/install.js`) creates junctions with `fs.symlink(target, path, 'junction')`
- Hooks and skills execute bash commands via `child_process.spawn('bash', ...)`
- Config paths use Windows-style: `C:\Users\...` (iCloud paths)

**Real-world examples:**
- MINGW translates `/s/repos/project` to `S:\repos\project` unexpectedly
- `npm` fails with `Cannot find module 'C:\c\Program Files\nodejs...'` (double path conversion)
- `PATH` environment variable gets mangled (Git Bash uses `PATH`, Windows uses `Path`)
- Symlinks created with relative paths fail on Windows (junctions require absolute paths)

**Consequences:**
- Installer fails on macOS/Linux (junction type not supported)
- Hooks fail on macOS/Linux (bash command syntax differences)
- Path operations break across platforms (backslash vs forward slash)
- Configuration files use platform-specific paths, not portable

**Prevention:**
1. **Multi-tier platform detection**
   ```javascript
   const platform = {
     os: process.platform,              // 'win32', 'darwin', 'linux'
     shell: process.env.SHELL || '',    // '/bin/bash', '/usr/bin/zsh'
     isMingw: process.env.MSYSTEM !== undefined,  // Git Bash detection
     isWSL: process.platform === 'linux' && !!process.env.WSL_DISTRO_NAME
   };

   // Use fs.symlink() type based on OS, not shell
   const symlinkType = platform.os === 'win32' ? 'junction' : 'dir';
   ```

2. **Always use path.normalize() and path.join()**
   - Never hardcode path separators: `path.join(dir, 'file')`, not `dir + '/file'`
   - Convert user input: `path.normalize(userPath)` before filesystem operations
   - Shell commands: Use forward slashes (work on all platforms)

3. **Test shell command compatibility**
   - Avoid Windows-specific commands: `dir`, `copy`, `del`
   - Prefer Node.js fs methods over shell commands where possible
   - If shell required, detect available shell: prefer `bash` > `sh` > `cmd`

4. **Junction vs symlink decision tree**
   ```javascript
   // Windows native (cmd, PowerShell): use junction
   if (platform.os === 'win32' && !platform.isMingw) {
     fs.symlinkSync(target, linkPath, 'junction');
   }
   // macOS, Linux, WSL, Git Bash: use directory symlink
   else {
     fs.symlinkSync(target, linkPath, 'dir');
   }
   ```

5. **Path translation awareness**
   - Git Bash: `MSYS_NO_PATHCONV=1` env var disables auto-translation
   - Prefix Windows paths with `//` to prevent translation: `//c/Users/...`
   - Verify paths with `fs.existsSync()` after creation, not just operation success

**Detection (warning signs):**
- Installer works on Windows, fails with ENOENT on macOS
- `fs.symlink()` succeeds but `fs.lstat()` shows wrong type (file vs directory)
- Shell commands fail with "command not found" on non-Windows platforms
- Paths contain `C:\c\` or `/mnt/c/c/` (double conversion)
- `git` commands work in interactive shell, fail in Node.js spawn

**Which phase:** Phase 2 (Cross-Platform Verification) - Test all installers, hooks, and shell commands

**Reference:** [Windows Git Bash MINGW path translation](https://github.com/npm/npm/issues/18499), [Node.js cross-platform symlinks](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/symlinks.md)

---

### Pitfall 3: Non-Interactive Shell Environment in Claude Code Bash Tool

**What goes wrong:** Skills and hooks execute bash commands assuming interactive shell environment (aliases, functions, environment variables from `.bashrc`). Claude Code's Bash tool runs commands in non-interactive shell with minimal environment. Commands fail with "command not found" or wrong behavior due to missing PATHs, aliases, or shell functions.

**Why it happens:** Claude Code Bash tool creates fresh shell for each command (no environment persistence between calls). Shell doesn't source `.bashrc`, `.bash_profile`, or `.zshrc`. Working directory persists, but `export` variables, `alias`, and `function` definitions do NOT persist.

**GSD-specific context:**
- Hooks execute via `child_process.spawn('bash', ['-c', command])`
- Skills may assume `git`, `npm`, `gh` are in PATH
- WoW rules expect `bun` over `npm`, but availability varies
- Statusline hook runs on every command (performance critical)

**Real-world issues:**
- Claude Code Bash tool returns "(No content)" on macOS 26.2 (Jan 2026 bug)
- Environment variables set in one command unavailable in next command
- `vim`, `git rebase -i`, `npm init` hang waiting for input (no TTY)
- Shell configuration lost: PATH from `.zshrc` not available

**Consequences:**
- Hooks fail silently (statusline shows nothing, no error logged)
- Skills can't find tools (`gh: command not found`, `bun: command not found`)
- Interactive commands hang forever (no timeout, blocks workflow)
- Different behavior between user terminal and Claude Code execution

**Prevention:**
1. **Explicit PATH and tool detection**
   ```javascript
   // Don't assume tools in PATH
   const toolPaths = {
     git: execSync('which git', { encoding: 'utf8' }).trim() || '/usr/bin/git',
     node: process.execPath,
     npm: execSync('which npm 2>/dev/null || which bun', { encoding: 'utf8' }).trim()
   };

   // Use absolute paths in commands
   execSync(`${toolPaths.git} status`);
   ```

2. **Avoid aliases and shell functions**
   - Don't reference `go-projects`, `reload-ai-env` aliases (shell-specific)
   - Use full commands: `cd $(readlink -f ~/Projects)` not `go-projects`
   - Prefer Node.js fs methods over shell aliases

3. **Never use interactive commands in hooks/skills**
   - Blocked: `vim`, `nano`, `git rebase -i`, `npm init`, REPLs (`python`, `node`)
   - Use non-interactive flags: `git -c core.editor=true rebase -i` (no-op editor)
   - Pre-answer prompts: `yes | command`, `command --yes`, `command --no-input`

4. **Working directory vs environment separation**
   ```bash
   # Working directory persists (OK)
   cd /path/to/project
   ls  # Runs in /path/to/project

   # Environment DOES NOT persist (FAIL)
   export MY_VAR=value  # Lost in next command
   echo $MY_VAR         # Empty

   # Solution: Set env vars per-command
   MY_VAR=value bash -c 'echo $MY_VAR'
   ```

5. **Tool availability matrix**
   | Tool | Windows (Git Bash) | macOS | Linux | Fallback |
   |------|-------------------|-------|-------|----------|
   | git | Always | Always | Always | N/A (required) |
   | node | Always | Always | Always | N/A (runtime) |
   | npm | Always | Always | Always | Use built-in |
   | bun | Maybe | Maybe | Maybe | Fall back to npm |
   | gh | Maybe | Maybe | Maybe | Direct git + API calls |
   | jq | Maybe | Maybe | Usually | Parse JSON in Node.js |

**Detection (warning signs):**
- Hook output appears in interactive terminal, not in Claude Code
- `which command` returns path in terminal, fails in Bash tool
- Commands work when run manually, fail in workflows
- Timeout errors on commands expecting input
- Different results in Claude Code vs user's shell

**Which phase:** Phase 2 (Cross-Platform Verification) - Test hooks in Claude Code Bash tool environment

**Reference:** [Claude Code Bash tool limitations](https://github.com/anthropics/claude-code/issues/9881), [Non-interactive shell issues](https://github.com/anthropics/claude-code/issues/581)

---

### Pitfall 4: Symlink Permissions and Junction Limitations on Windows

**What goes wrong:** Creating regular symlinks on Windows fails with EPERM error because it requires "Create Symbolic Links" privilege (off by default for non-admins). Code falls back to junctions, but junctions only work for directories (not files) and require absolute paths. File symlinks fail silently or create broken links.

**Why it happens:** Windows security model requires administrator privilege or Developer Mode for symlink creation. GSD's design avoids requiring admin (user preference), so installer uses junctions. But junction type only supports directories. If code tries to symlink individual files (config files, binaries), it fails.

**GSD-specific context:**
- Current: `--link` mode uses junctions (no admin required)
- Current: All links are directory-level (agents, commands, hooks folders)
- Future risk: If granular file-level links needed, junctions won't work

**Real-world issues:**
- `fs.symlink()` with `type: 'file'` fails on Windows without admin
- Junction created with relative path: silently fails or breaks on directory move
- `fs.lstat()` after junction creation shows wrong stats (reports as directory, not symlink)
- npm/bun try to create file symlinks in `node_modules/.bin/`, fail on Windows

**Consequences:**
- Installer requires admin (unacceptable per project constraints)
- File-level configuration links don't work (must copy instead)
- Cross-platform inconsistency (symlinks on macOS/Linux, copies on Windows)
- Broken links after directory moves (relative junctions not portable)

**Prevention:**
1. **Junction constraints enforcement**
   ```javascript
   function createLink(target, linkPath, isDirectory) {
     if (!isDirectory && process.platform === 'win32') {
       throw new Error('Windows file symlinks require admin. Use copy mode instead.');
     }

     // Junctions require absolute paths
     const absoluteTarget = path.isAbsolute(target)
       ? target
       : path.resolve(path.dirname(linkPath), target);

     const type = process.platform === 'win32' ? 'junction' : 'dir';
     fs.symlinkSync(absoluteTarget, linkPath, type);
   }
   ```

2. **Detect and handle permission failures**
   ```javascript
   try {
     fs.symlinkSync(target, linkPath, 'file');
   } catch (err) {
     if (err.code === 'EPERM' && process.platform === 'win32') {
       console.warn('File symlinks require admin on Windows. Copying instead.');
       fs.copyFileSync(target, linkPath);
       return { mode: 'copy', reason: 'no_admin' };
     }
     throw err;
   }
   ```

3. **Document link vs copy behavior**
   - README: Explain `--link` only creates directory junctions on Windows
   - Installer output: Show which items linked vs copied
   - Metadata: Track link mode per-item in `.claude/gsd-metadata.json`

4. **Test link integrity after creation**
   ```javascript
   // Verify link points to correct target
   const linkStats = fs.lstatSync(linkPath);
   if (linkStats.isSymbolicLink() || isJunction(linkPath)) {
     const actualTarget = fs.realpathSync(linkPath);
     if (actualTarget !== expectedTarget) {
       throw new Error(`Link broken: expected ${expectedTarget}, got ${actualTarget}`);
     }
   }
   ```

5. **Absolute path normalization**
   ```javascript
   // Convert relative to absolute before junction creation
   function normalizeJunctionTarget(target, linkPath) {
     if (path.isAbsolute(target)) return target;

     // Resolve relative to link location (not cwd)
     const linkDir = path.dirname(linkPath);
     return path.resolve(linkDir, target);
   }
   ```

**Detection (warning signs):**
- `fs.symlinkSync()` throws EPERM on Windows
- `fs.lstatSync(link).isSymbolicLink()` false, but `isDirectory()` true (it's a junction)
- Links work after creation, break after moving project directory
- Different behavior: macOS uses relative symlinks, Windows uses absolute paths
- Installer fails with "operation not permitted" for non-admin user

**Which phase:** Phase 2 (Cross-Platform Verification) - Test installer with `--link` on all platforms

**Reference:** [Node.js symlink admin requirements](https://github.com/nodejs/node/issues/47783), [Junction vs symlink differences](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/symlinks.md)

---

## Moderate Pitfalls

Mistakes that cause delays, inconsistencies, or degraded functionality.

### Pitfall 5: Cherry-Pick Commit Dependency Chain Breaks

**What goes wrong:** User cherry-picks commit B that depends on earlier commit A (not selected). Git applies B without conflict, but functionality breaks at runtime because B references code from A that doesn't exist locally.

**Why it happens:** Git only detects file-level conflicts, not logical dependencies. If commit A adds function `foo()` and commit B calls `foo()`, cherry-picking only B succeeds at Git level but fails at runtime.

**Example scenario:**
```
Upstream commits:
A: feat(utils): add formatStatusline() helper
B: feat(hooks): use formatStatusline() in statusline hook

User selects only commit B for cherry-pick.
Git applies successfully (no file conflict).
Hook execution fails: ReferenceError: formatStatusline is not defined
```

**Prevention:**
1. **Present commits in chronological order with file context**
   - Show commit graph: `git log --graph --oneline --decorate`
   - Highlight new files: `git show --name-status <sha> | grep '^A'`
   - Warning if commit adds files not present locally

2. **Offer bulk selection options**
   - "Apply all commits" (safest, preserves dependencies)
   - "Select range" (commits N through M, inclusive)
   - Individual selection with dependency warnings

3. **Post-cherry-pick verification**
   - Run `gsd-verifier` on changed files
   - Execute hooks in sandbox to detect runtime errors
   - Check for undefined references: `grep -r "ReferenceError" .planning/sync/`

**Detection:**
- Tests pass before cherry-pick, fail after
- Runtime errors in hooks or skills
- Import statements for non-existent modules
- Function calls to undefined functions

**Which phase:** Phase 1 (Security Audit) - Add to upstream workflow Stage 2 (commit selection)

**Reference:** [Git cherry-pick dependency issues](https://binitmishra.medium.com/git-cherry-pick-best-practices-for-error-resolution-aadfcefd8d1b)

---

### Pitfall 6: Upstream Update Notification Stale State

**What goes wrong:** Statusline shows "Updates available" after user already synced upstream. Cache contains old SHA, hasn't been updated. User re-runs sync workflow, sees "no new commits" but statusline still shows notification.

**Why it happens:** Cache update happens at end of workflow (Stage 7: Publish). If user aborts at any checkpoint (review, conflict, verification), cache never updates. Next statusline check compares against old SHA, shows false positive.

**Prevention:**
1. **Update cache at multiple stages**
   - Stage 1 (Fetch): Record latest upstream SHA seen
   - Stage 7 (Complete): Record successfully synced SHA
   - Statusline: Compare against "latest seen", not "successfully synced"

2. **Cache schema with multiple timestamps**
   ```json
   {
     "last_fetch": {
       "sha": "e5f6g7h",
       "date": "2026-02-07T10:00:00Z"
     },
     "last_successful_sync": {
       "sha": "d4e5f6g",
       "date": "2026-02-05T15:30:00Z"
     }
   }
   ```

3. **Notification dismissal mechanism**
   - `/gsd:dismiss-upstream-notification` command
   - Sets `dismissed_until: <sha>` in cache
   - Statusline skips notification if current upstream SHA matches dismissed

**Detection:**
- Statusline shows updates after successful sync
- User reports "sync says nothing new, statusline disagrees"
- Cache `last_sync.sha` older than `git log upstream/main -1 --format=%H`

**Which phase:** Phase 3 (Auto-Update Check) - Implement cache update logic

---

### Pitfall 7: Diff Preview Timeouts on Large Upstream Changes

**What goes wrong:** User previews upstream diff before cherry-pick. Diff contains 500+ files (major refactor). Claude Code context window fills, response truncated. User can't review all changes, workflow blocks.

**Why it happens:** `git diff` output for large changesets exceeds readable length. Claude tries to show full diff in response, hits token limits. Workflow checkpoint expects user confirmation, but user can't scroll through entire diff.

**Prevention:**
1. **Progressive diff disclosure**
   - Show summary first: `git diff --stat upstream/main`
   - User selects files to inspect: `git diff upstream/main -- path/to/file`
   - Limit to N files at a time (20 files per view)

2. **External diff tool suggestion**
   - Detect large diff: `git diff --stat | wc -l > 100`
   - Message: "Large changeset. Run `git difftool upstream/main` for full review."
   - Provide command to run outside Claude Code

3. **Filter to high-risk files only**
   - Default view: Only show diffs for `hooks/`, `bin/`, `scripts/`
   - User opts in: "Show all file diffs"

**Detection:**
- Workflow response ends abruptly mid-diff
- User says "I couldn't see the whole diff"
- Context window autocompacts during diff preview

**Which phase:** Phase 4 (Diff Preview) - Implement progressive disclosure

---

### Pitfall 8: Rollback Breaks When Local Changes Exist

**What goes wrong:** User runs `/gsd:rollback` to undo failed upstream sync. Rollback tries `git reset --hard <before-sync-sha>`, but user made local changes since sync attempt. All local changes lost.

**Why it happens:** Rollback assumes clean working directory. If user modified files after sync (manual fixes, debugging), `git reset --hard` discards everything.

**Prevention:**
1. **Stash detection before rollback**
   ```bash
   if ! git diff-index --quiet HEAD; then
     echo "WARNING: Uncommitted changes detected."
     echo "Stash changes first? (recommended)"
     # Use AskUserQuestion tool
   fi
   ```

2. **Soft rollback option**
   - Default: `git reset --mixed <sha>` (keeps changes in working directory)
   - Aggressive: `git reset --hard <sha>` (discards all changes, requires confirmation)

3. **Rollback checkpoint tracking**
   - Save rollback checkpoint in cache: `rollback_points: [{ sha, date, reason }]`
   - List available rollback points: `/gsd:rollback --list`

**Detection:**
- User reports "rollback deleted my work"
- `git status` after rollback shows no uncommitted changes (unexpected)

**Which phase:** Phase 5 (Rollback Capability) - Implement safe rollback with stash detection

---

### Pitfall 9: Platform Detection Via process.platform Misses WSL

**What goes wrong:** Code detects `process.platform === 'linux'` and assumes native Linux. But system is WSL (Windows Subsystem for Linux). Code uses Linux-specific paths (`/usr/bin/`) that don't exist in WSL context. Commands fail.

**Why it happens:** WSL reports as Linux to Node.js, but filesystem and PATH differ from native Linux. Windows drives mounted at `/mnt/c/`, Linux binaries in `/usr/bin/`, but Windows binaries also available.

**Prevention:**
1. **WSL-specific detection**
   ```javascript
   const isWSL = process.platform === 'linux' && !!process.env.WSL_DISTRO_NAME;

   if (isWSL) {
     // Hybrid behavior: Linux semantics, Windows filesystem
     // Prefer Linux tools, fall back to Windows tools via /mnt/c/
   }
   ```

2. **Tool availability check, not platform assumption**
   ```javascript
   function findGit() {
     const candidates = [
       '/usr/bin/git',           // Linux
       '/usr/local/bin/git',     // macOS
       'C:\\Program Files\\Git\\cmd\\git.exe',  // Windows
       which('git')              // PATH lookup
     ];

     for (const path of candidates) {
       if (fs.existsSync(path)) return path;
     }

     throw new Error('git not found');
   }
   ```

**Detection:**
- Code works on native Linux, fails on WSL
- Path errors: `/usr/bin/command not found` on WSL
- `process.env.WSL_DISTRO_NAME` exists (Ubuntu, Debian, etc.)

**Which phase:** Phase 2 (Cross-Platform Verification) - Test on WSL specifically

**Reference:** [Cross-platform Node.js guide](https://github.com/bcoe/awesome-cross-platform-nodejs)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### Pitfall 10: Shell Command Output Encoding Issues

**What goes wrong:** Bash command returns output with ANSI color codes. Node.js captures output, stores in JSON. Color codes render as escape sequences (`\x1b[31mERROR\x1b[0m`) instead of colored text when displayed.

**Prevention:**
- Strip ANSI codes before storage: `output.replace(/\x1b\[[0-9;]*m/g, '')`
- Or: Store raw, strip when displaying
- Git commands: Use `--no-color` flag

**Which phase:** Phase 2 (Cross-Platform Verification)

---

### Pitfall 11: Cherry-Pick Conflict Markers Left in Files

**What goes wrong:** User manually resolves conflict, misses removing `<<<<<<<` markers. Code with markers gets committed.

**Prevention:**
- After resolution: `git diff --check` (detects markers)
- Pre-commit hook: Fail if markers found
- Verification step: `grep -rn '^<<<<<<<' .` before publish

**Which phase:** Phase 1 (Security Audit) - Add to workflow Stage 3 (execute)

**Reference:** [Detect git conflict markers](https://ardalis.com/detect-git-conflict-markers/)

---

### Pitfall 12: npm vs bun Publish Command Differences

**What goes wrong:** Code assumes `bun publish` and `npm publish` have identical flags. `bun publish --tag beta` works, but `npm publish --tag beta` uses different syntax. Publish fails.

**Prevention:**
1. **Normalize publish command**
   ```javascript
   const publishCmd = hasBun
     ? ['bun', 'publish', '--tag', tag]
     : ['npm', 'publish', '--tag', tag];

   // Both support --tag, but verify with --help first
   ```

2. **Test both tools in CI**
   - Matrix test: npm@latest, bun@latest
   - Verify identical behavior for core flags

**Which phase:** Phase 2 (Cross-Platform Verification) - Test publish flow with both tools

**Reference:** [Tooling preferences - bun over npm](~/.claude/rules/tooling-preferences.md)

---

### Pitfall 13: Auto-Update Check Rate Limiting GitHub API

**What goes wrong:** Statusline hook runs on every command. Each invocation checks GitHub API for upstream commits. Hits rate limit (60 req/hour unauthenticated, 5000/hour authenticated). Statusline stops showing updates.

**Prevention:**
1. **Local cache with TTL**
   ```json
   {
     "upstream_check": {
       "last_checked": "2026-02-07T10:00:00Z",
       "cache_until": "2026-02-07T11:00:00Z",
       "latest_sha": "e5f6g7h"
     }
   }
   ```

2. **Exponential backoff on rate limit**
   - Detect 403 response with `X-RateLimit-Remaining: 0`
   - Double cache TTL on each rate limit hit

3. **Use authenticated requests**
   - If `gh auth status` succeeds, use `gh` CLI (5000 req/hour)
   - Fallback to unauthenticated with longer cache (1 hour TTL)

**Which phase:** Phase 3 (Auto-Update Check) - Implement caching strategy

---

### Pitfall 14: Config File JSON5 Not Validated During Upstream Sync

**What goes wrong:** Upstream commit modifies `config/default-config.json` with invalid JSON5 syntax (trailing comma, unquoted key). Sync applies without validation. GSD fails to load config, breaks all commands.

**Prevention:**
1. **Post-cherry-pick config validation**
   - After apply, parse all `*.json` and `*.json5` files
   - AJV schema validation against `gsd-config.schema.json`
   - Block publish if validation fails

2. **Rollback trigger on validation failure**
   - Auto-rollback if config invalid: `git reset --hard <before-sync>`
   - User message: "Upstream config invalid. Sync rolled back."

**Which phase:** Phase 1 (Security Audit) - Add to verification step

**Reference:** [Node.js config validation security](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160)

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Security Audit | Pitfall 1 (Arbitrary code execution) | Security review checkpoint with diff highlighting |
| Phase 1: Security Audit | Pitfall 11 (Conflict markers) | `git diff --check` verification |
| Phase 1: Security Audit | Pitfall 14 (Config validation) | JSON5 + AJV validation in workflow |
| Phase 2: Cross-Platform | Pitfall 2 (Platform detection) | Multi-tier detection (OS, shell, MINGW, WSL) |
| Phase 2: Cross-Platform | Pitfall 3 (Non-interactive shell) | Test hooks in Claude Code Bash tool |
| Phase 2: Cross-Platform | Pitfall 4 (Symlink permissions) | Junction constraints, permission handling |
| Phase 2: Cross-Platform | Pitfall 9 (WSL detection) | WSL-specific platform check |
| Phase 2: Cross-Platform | Pitfall 12 (npm vs bun) | Test publish with both package managers |
| Phase 3: Auto-Update Check | Pitfall 6 (Stale notification) | Multi-stage cache updates |
| Phase 3: Auto-Update Check | Pitfall 13 (Rate limiting) | Cache with TTL, authenticated requests |
| Phase 4: Diff Preview | Pitfall 7 (Large diff timeout) | Progressive disclosure, external tool suggestion |
| Phase 5: Rollback | Pitfall 8 (Local changes lost) | Stash detection, soft reset default |
| Phase 5: Rollback | Pitfall 5 (Dependency breaks) | Post-rollback verification |

---

## Sources

### Security (HIGH confidence)
- [Anthropic MCP Git Server Prompt Injection Vulnerabilities](https://www.infosecurity-magazine.com/news/prompt-injection-bugs-anthropic/)
- [Git Security Vulnerability CVE-2025-48384 RCE](https://www.helpnetsecurity.com/2025/08/26/git-vulnerability-exploited-cve-2025-48384/)
- [GitHub Advisory: Git MCP Server Command Injection CVE-2025-53107](https://github.com/advisories/GHSA-3q26-f695-pp76)
- [Node.js Security Best Practices 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### Cross-Platform (HIGH confidence)
- [Cross-Platform Node.js Guide: Symlinks](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/symlinks.md)
- [Cross-Platform Node.js Guide: File Paths](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/3_filesystem/file_paths.md)
- [Writing Cross-Platform Node.js](https://shapeshed.com/writing-cross-platform-node/)
- [Awesome Cross-Platform Node.js](https://github.com/bcoe/awesome-cross-platform-nodejs)
- [Windows Git Bash MINGW Path Translation Issues](https://github.com/npm/npm/issues/18499)

### Claude Code Bash Tool (HIGH confidence)
- [Claude Code Bash Tool Interactive Shell Support Request](https://github.com/anthropics/claude-code/issues/9881)
- [Claude Code Non-Interactive Mode Tool Permissions Bug](https://github.com/anthropics/claude-code/issues/581)
- [Claude Code Bash Tool Returns No Output on macOS 26](https://github.com/anthropics/claude-code/issues/19663)

### Git Operations (HIGH confidence)
- [Git Cherry Pick | Atlassian Tutorial](https://www.atlassian.com/git/tutorials/cherry-pick)
- [Git Cherry-Pick Best Practices for Error Resolution](https://binitmishra.medium.com/git-cherry-pick-best-practices-for-error-resolution-aadfcefd8d1b)
- [Detect Git Conflict Markers](https://ardalis.com/detect-git-conflict-markers/)
- [Git Merge Conflicts | Atlassian Tutorial](https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts)

### npm/Registry (HIGH confidence)
- [Node.js Advanced Patterns: Retry Logic](https://v-checha.medium.com/advanced-node-js-patterns-implementing-robust-retry-logic-656cf70f8ee9)
- [npm Access Tokens Documentation](https://docs.npmjs.com/about-access-tokens/)
- [GitHub Packages npm Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

### Auto-Update & Rollback (MEDIUM confidence)
- [Automated Rollbacks in DevOps 2026](https://medium.com/@surbhi19/automated-rollbacks-in-devops-ensuring-stability-and-faster-recovery-in-ci-cd-pipelines-c197e39f9db6)
- [CLI Tools with Previews and Dry Runs](https://nickjanetakis.com/blog/cli-tools-that-support-previews-dry-runs-or-non-destructive-actions)

### Project-Specific (HIGH confidence for internal patterns)
- GSD Phase 5 Research: `.planning/phases/05-update-commands/05-RESEARCH.md`
- GSD Architecture: `.planning/codebase/ARCHITECTURE.md`
- GSD Stack: `.planning/codebase/STACK.md`
- WoW Tooling Preferences: `~/.claude/rules/tooling-preferences.md`
