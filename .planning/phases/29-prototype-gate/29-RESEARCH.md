# Phase 29: Prototype Gate - Research

**Researched:** 2026-03-27
**Domain:** Node.js subprocess delegation, installer path resolution, cross-platform HOME override
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Delegation mechanism:** Subprocess invocation, not require(). Run upstream's install.js via `child_process.execSync` with `stdio: 'inherit'` for TTY passthrough
- **Upstream's install.js is copied into dist/bin/** with text-only branding applied
- **Internal directory structure (get-shit-done/) preserved exactly** -- upstream's __dirname resolution works because the relative layout is identical
- **After upstream install completes**, wrapper copies overlay additions (hooks, commands, workflows) to the target directory
- **If upstream exits non-zero, fail fast** -- do not copy overlay additions
- **TTY passthrough (`stdio: 'inherit'`)** lets upstream's interactive menus work exactly as designed
- **No interception or wrapping of upstream's readline prompts**
- **Target directory resolution:** Infer target from flags + platform, using the same logic upstream uses -- do not parse upstream's stdout
- **Prototype test environment:** Install to a temporary directory using HOME override: `{ env: { ...process.env, HOME: tmpDir } }`
- **Must work cross-platform** (Windows, macOS, Linux) -- not deferred to Phase 33
- **On Windows, verify os.homedir() respects the HOME override; if not, use upstream's --config-dir flag as alternative**
- **Claude runtime only for prototype** (proves the mechanism; other runtimes use the same codepath)
- **Full content verification of installed files**, not just existence checks
- **Verify branding appears in user-visible text AND does not break installation**

### Claude's Discretion

- Exact test script implementation (Node.js test runner, shell script, or manual)
- How to handle Windows os.homedir() if HOME override doesn't work (--config-dir is the suggested fallback)
- Whether to run the prototype as an automated test or a manual verification script

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROTO-01 | Upstream install.js runs correctly from a composed directory that preserves its internal structure | Path resolution is via `path.join(__dirname, '..')` -- preserving the bin/ parent structure is sufficient. Confirmed by source code trace. |
| PROTO-02 | Surface-only text branding (package name, URLs) in install.js does not break installation | Branding targets are in console.log strings and help text only. Path resolution, require calls, config keys are unaffected by text substitution of "get-shit-done-cc" -> "@chude/get-stuff-done". Confirmed by source analysis. |
| PROTO-03 | Overlay additions (fork hooks, commands, workflows) can be copied to target after upstream install completes | Upstream install exits with code 0 on success or calls process.exit(1) on failure. After exit code 0, the overlay copy step is a simple fs.cp operation. No conflicts with upstream-installed paths. |
</phase_requirements>

## Summary

The upstream installer (get-shit-done-cc v1.30.0, bin/install.js, 5,008 lines) uses a single `__dirname`-relative path resolution pattern for all file operations. The critical line is `const src = path.join(__dirname, '..');` at line 4062 of the install function. All subsequent path joins (`path.join(src, 'commands', 'gsd')`, `path.join(src, 'get-shit-done')`, etc.) resolve relative to this `src` variable. Since the composed `dist/` output preserves the same directory structure as the upstream package (`bin/install.js` at `dist/bin/install.js`, `commands/` at `dist/commands/`, etc.), `__dirname` will resolve correctly with zero changes to path logic.

The HOME override issue is confirmed critical on Windows. Verified by direct test: `os.homedir()` is cached at Node.js startup and does NOT respect changes to the `HOME` environment variable on Windows. The upstream installer's `getGlobalDir()` function (line 197) uses `os.homedir()` as fallback only -- if `CLAUDE_CONFIG_DIR` env var is set or `--config-dir` flag is passed, those take priority and bypass `os.homedir()` entirely. This gives a clean, reliable mechanism for test isolation on all platforms.

The installer's interactive prompts are driven by `readline` with standard `process.stdin`/`process.stdout`. When `process.stdin.isTTY` is false (which it will be in `execSync` with `stdio: 'inherit'` unless a real TTY is connected), the installer auto-defaults to global install. When both `--claude` and `--global` flags are passed, the installer skips all interactive prompts entirely and proceeds non-interactively. This means prototype tests using `--claude --global --config-dir <tmpDir>` will run fully non-interactive with zero prompt handling needed.

**Primary recommendation:** Use `--config-dir` flag for test isolation on all platforms. Pass `['--claude', '--global', '--config-dir', tmpDir]` as args to the subprocess. This bypasses `os.homedir()` entirely and works identically on Windows, macOS, and Linux.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `child_process.execSync` | Node.js built-in | Run upstream install.js as subprocess | `stdio: 'inherit'` passes TTY through; synchronous means clean exit code capture |
| `bun:test` | Bun built-in | Test framework | Project-standard -- all tests use bun:test |
| `fs` | Node.js built-in | File verification after install | Already used throughout project tests |
| `os.tmpdir()` | Node.js built-in | Temp directory base | `createTempDir()` helper uses this -- matches existing test patterns |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `child_process.spawnSync` | Node.js built-in | Alternative to execSync if output capture needed | If you need to inspect stdout/stderr while also inheriting TTY -- but execSync is sufficient for prototype |
| `tests/helpers/index.js` (createTempDir) | Project-internal | Temp dir with auto-cleanup | Use for all temp directory creation -- ensures cleanup in afterEach |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `--config-dir` flag | `HOME` + `USERPROFILE` env vars | `HOME`/`USERPROFILE` are unreliable on Windows (os.homedir() cached at startup). `--config-dir` is explicit and works everywhere. |
| bun:test | node:test | Fork uses bun:test consistently; only `.test.cjs` files use node:test for upstream tests |
| execSync | spawnSync | execSync is simpler and sufficient; `stdio: 'inherit'` achieves TTY passthrough with either |

## Architecture Patterns

### Prototype Script Structure

```
tests/prototype-installer.test.js
  (or: scripts/prototype-gate.js for manual run)
```

The prototype should be structured as a bun:test file (reusable as Phase 33's `installer.test.js` base). Three tests map to three requirements:

```
test('PROTO-01: upstream install.js runs from composed dir', ...)
test('PROTO-02: surface branding does not break install', ...)
test('PROTO-03: overlay additions can be copied after upstream install', ...)
```

### Pattern 1: Composing a Scratch Directory

Set up a scratch directory that mirrors the dist/ layout the prototype expects:

```javascript
// Source: upstream install.js line 4062 analysis
// const src = path.join(__dirname, '..');
// This means install.js expects:
//   bin/install.js          (itself -- __dirname = bin/)
//   commands/gsd/           (src = bin/.. = package root)
//   get-shit-done/
//   agents/
//   hooks/dist/
//   package.json            (required('../package.json') at line 56)

function setupScratchDir(tmpDir) {
  // Copy upstream package contents to scratch/
  const upstreamPkg = path.join(__dirname, '..', 'node_modules', 'get-shit-done-cc');
  const scratch = path.join(tmpDir, 'scratch');
  copyDirectory(upstreamPkg, scratch);
  return scratch; // scratch/bin/install.js is the entry point
}
```

### Pattern 2: Running the Subprocess (Cross-Platform)

```javascript
const { execSync } = require('child_process');

function runUpstreamInstaller(scratchDir, targetDir, extraArgs = []) {
  const installScript = path.join(scratchDir, 'bin', 'install.js');
  const args = [
    '--claude', '--global',
    '--config-dir', targetDir,
    ...extraArgs
  ].join(' ');

  const result = execSync(`node "${installScript}" ${args}`, {
    stdio: ['pipe', 'pipe', 'pipe'],  // capture output for test assertions
    env: { ...process.env },          // --config-dir makes HOME irrelevant
    encoding: 'utf-8',
    timeout: 30000,                   // 30s -- install is subprocess-heavy
  });
  return result;
}
```

**Note on stdio:** Use `'pipe'` (not `'inherit'`) for automated tests so output can be captured and asserted against. The CONTEXT.md decision to use `stdio: 'inherit'` applies to the production installer wrapper (Phase 33), not the prototype test script.

### Pattern 3: Applying Surface Branding

The branding step is a string replacement on the copied install.js before running it:

```javascript
function applyBranding(scratchDir) {
  const installJsPath = path.join(scratchDir, 'bin', 'install.js');
  let content = fs.readFileSync(installJsPath, 'utf-8');

  // Surface-only substitutions (user-visible text only)
  content = content.replace(/npx get-shit-done-cc/g, 'bunx @chude/get-stuff-done');
  content = content.replace(/get-shit-done-cc@latest/g, '@chude/get-stuff-done@latest');
  // TACHES author attribution (visible strings only -- not code identifiers)
  // Note: 'TÂCHES' appears in banner string -- safe to replace in text context

  fs.writeFileSync(installJsPath, content, 'utf-8');
}
```

**Critical constraint:** Do NOT replace `get-shit-done` (without `-cc`) in code paths. The installer uses `get-shit-done` as the installed directory name (line 4194-4201: `path.join(targetDir, 'get-shit-done')`), and also in path validation logic. Text substitution must be scoped to the exact strings `"get-shit-done-cc"` and `"npx get-shit-done-cc"`.

### Pattern 4: Post-Install Overlay Copy

```javascript
function copyOverlayAdditions(targetDir, overlayDir) {
  // Overlay hooks (fork-specific)
  const overlayHooksSrc = path.join(overlayDir, 'hooks');
  const hooksDir = path.join(targetDir, 'hooks');
  if (fs.existsSync(overlayHooksSrc)) {
    copyDirectory(overlayHooksSrc, hooksDir);
  }

  // Overlay commands
  const overlayCommandsSrc = path.join(overlayDir, 'commands');
  const commandsDir = path.join(targetDir, 'commands');
  if (fs.existsSync(overlayCommandsSrc)) {
    copyDirectory(overlayCommandsSrc, commandsDir);
  }
}
```

For the prototype, use placeholder files (a test hook `.js` and a test command `.md`) rather than actual overlay content.

### Anti-Patterns to Avoid

- **Parsing stdout to find target path:** The CONTEXT.md explicitly forbids this. Use known path from `--config-dir` arg.
- **Using `stdio: 'pipe'` and then inheriting:** Pick one. For automated tests, use `'pipe'`. For production wrapper, use `'inherit'`.
- **Replacing bare `get-shit-done` in install.js text:** This string appears 130+ times and is used in path resolution, directory naming, and config keys. Only replace the exact npm package name strings.
- **Using HOME env override for Windows isolation:** `os.homedir()` is cached and ignores HOME on Windows. Always use `--config-dir` for cross-platform reliability.
- **Not setting timeout on execSync:** The installer spawns multiple child processes (hook registration, permissions config). Default is no timeout -- add `timeout: 30000` explicitly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp directory with auto-cleanup | Custom tmpDir logic | `createTempDir()` from `tests/helpers/index.js` | Already handles mkdtemp + cleanup; used in all existing installer tests |
| Recursive directory copy | Custom loop | Upstream's own `copyDirectory()` (extract) or Node.js `fs.cpSync` (Node 16.7+) | `fs.cpSync(src, dest, { recursive: true })` is one line on Node 20+ |
| Process exit code capture | Try/catch wrapping | `execSync` throws on non-zero exit; catch the error to get exit code | Exact pattern in `tests/installer.test.js` runInstaller() |
| Binary test assertion on installed files | Custom diff tool | `fs.readFileSync` + `expect().toContain()` | Sufficient for branding verification |

**Key insight:** The existing `tests/installer.test.js` already implements the exact subprocess invocation pattern (`execSync` + `{ env: { ...process.env, HOME: mockHome, USERPROFILE: mockHome } }`). The prototype builds directly on this pattern, adding `--config-dir` for Windows reliability.

## Common Pitfalls

### Pitfall 1: os.homedir() Ignores HOME on Windows

**What goes wrong:** Test sets `{ env: { HOME: tmpDir } }` expecting the installer to install to `tmpDir/.claude`, but `os.homedir()` returns `C:\Users\Destiny` regardless. Install goes to the real `~/.claude`.

**Why it happens:** Node.js caches the home directory at process startup from `USERPROFILE` or `HOMEDRIVE+HOMEPATH` on Windows. The `HOME` env var is ignored. `os.homedir()` does NOT re-read the env on each call.

**How to avoid:** Always pass `--config-dir <tmpDir>` as a flag to the upstream installer subprocess. This takes priority over `os.homedir()` in upstream's `getGlobalDir()` function (line 272-280 of install.js: explicit dir check comes before `os.homedir()` fallback).

**Warning signs:** Tests pass on macOS/Linux but fail on Windows; install target is real home directory instead of temp dir.

**Verified:** Confirmed by direct test: `process.env.HOME = 'C:/test_home'; os.homedir()` still returns `C:\Users\Destiny` on this machine.

### Pitfall 2: Replacing Wrong `get-shit-done` Occurrences

**What goes wrong:** Branding replaces `get-shit-done` (without `-cc`) in install.js, corrupting path resolution. The installer creates `get-stuff-done/` directory instead of `get-shit-done/`, breaking all subsequent path checks and the `verifyInstalled()` calls.

**Why it happens:** `get-shit-done` appears 100+ times in install.js -- in directory names (`path.join(targetDir, 'get-shit-done')`), string literals, config markers, and comments. A global replace breaks path logic.

**How to avoid:** Scope branding strictly to `"get-shit-done-cc"` (the npm package name with `-cc` suffix) and `"npx get-shit-done-cc"` patterns. Never replace bare `"get-shit-done"`. The spec's `branding.json` already encodes this correctly with exact `"from"` strings.

**Warning signs:** Install fails with "directory not created" or `verifyInstalled()` returns false; `get-stuff-done/` directory created instead of `get-shit-done/`.

### Pitfall 3: Missing `package.json` in Scratch Directory

**What goes wrong:** Upstream install.js line 56 does `require('../package.json')` to read `pkg.version`. If `package.json` is missing from the scratch root, the require throws `MODULE_NOT_FOUND` and the installer crashes before doing any work.

**Why it happens:** The upstream npm package's `files` array includes `package.json` implicitly (npm always includes it). When manually copying upstream files for the scratch dir, package.json may be overlooked.

**How to avoid:** When setting up the scratch directory, copy the entire upstream package root including `package.json`. The `copyDirectory()` function handles this if pointed at the package root.

**Warning signs:** Installer exits immediately with `Error: Cannot find module '../package.json'`.

### Pitfall 4: Subprocess Timeout on Windows

**What goes wrong:** `execSync` hangs or times out on Windows because the installer spawns child processes (hook chmod, settings.json reads) that are slower under Windows file I/O.

**Why it happens:** Windows file operations are slower than macOS/Linux, and the installer does non-trivial I/O. The existing installer.test.js uses per-test `timeout: 15000` in bun:test for this reason (see MEMORY.md entry).

**How to avoid:** Set `timeout: 30000` on `execSync` options AND set `timeout: 15000` on the bun:test `test()` call (second argument). Both are needed: execSync timeout prevents the subprocess from hanging; test timeout prevents the test runner from blocking.

**Warning signs:** Tests time out with `ETIMEDOUT` or bun's default 5s test timeout fires.

### Pitfall 5: `require('../package.json')` Returns Fork Version After Branding

**What goes wrong:** When running upstream's install.js from the composed scratch dir, `pkg.version` at line 56 reads the upstream package.json. If the scratch dir is populated from `node_modules/get-shit-done-cc/`, this returns `1.30.0`. If somehow the fork's `package.json` is in the scratch dir, it returns `2.4.0`. For the prototype, this is cosmetic (version in banner); for Phase 33 production, it matters.

**Why it happens:** Not a prototype-breaking issue, but worth noting for Phase 33 planning.

**How to avoid:** For the prototype: ensure the scratch dir contains the upstream `package.json`. For Phase 33: after composition, `dist/package.json` will be the fork's package.json -- upstream's install.js in `dist/bin/` will read the fork version. This is correct behavior.

## Code Examples

Verified patterns from source analysis:

### Upstream Path Resolution (the critical mechanism)

```javascript
// Source: upstream install.js line 4062
// __dirname = the directory containing install.js (e.g., dist/bin/)
// src = the package root (e.g., dist/)
const src = path.join(__dirname, '..');

// All files resolved from src:
const skillSrc = path.join(src, 'get-shit-done');      // dist/get-shit-done/
const agentsSrc = path.join(src, 'agents');             // dist/agents/
const hooksSrc = path.join(src, 'hooks', 'dist');       // dist/hooks/dist/
const gsdSrc = path.join(src, 'commands', 'gsd');      // dist/commands/gsd/
const changelogSrc = path.join(src, 'CHANGELOG.md');    // dist/CHANGELOG.md

// Package version read:
const pkg = require('../package.json');                  // dist/package.json
```

**Implication:** The composed dist/ must have this exact layout:
```
dist/
  bin/
    install.js             (upstream's install.js with text branding)
  get-shit-done/           (MUST stay as get-shit-done -- not get-stuff-done)
  agents/
  commands/gsd/
  hooks/dist/
  package.json             (fork's package.json)
  CHANGELOG.md
```

### Target Directory Resolution for Claude Global

```javascript
// Source: upstream install.js lines 197-280
// Priority chain for Claude global install:
// 1. --config-dir flag (explicitDir parameter)
// 2. CLAUDE_CONFIG_DIR env var
// 3. os.homedir() + '/.claude'
function getGlobalDir(runtime, explicitDir = null) {
  // Claude Code: --config-dir > CLAUDE_CONFIG_DIR > ~/.claude
  if (explicitDir) return expandTilde(explicitDir);
  if (process.env.CLAUDE_CONFIG_DIR) return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  return path.join(os.homedir(), '.claude');
}
```

**Prototype implication:** `--config-dir <tmpDir>` is the cleanest cross-platform isolation mechanism.

### Non-Interactive Flag Detection

```javascript
// Source: upstream install.js lines 4987-4995
// When both runtime AND location flags are provided, zero prompts occur:
} else if (selectedRuntimes.length > 0) {
  if (!hasGlobal && !hasLocal) {
    promptLocation(selectedRuntimes);  // prompts only if no location flag
  } else {
    installAllRuntimes(selectedRuntimes, hasGlobal, false);  // isInteractive=false
  }
}
// With args: ['--claude', '--global', '--config-dir', tmpDir]
// -> selectedRuntimes = ['claude'], hasGlobal = true
// -> calls installAllRuntimes(['claude'], true, false) -- no prompts
```

**Prototype implication:** `['--claude', '--global', '--config-dir', tmpDir]` produces a fully non-interactive install. The readline prompts are never reached.

### Subprocess Invocation Pattern (from existing installer.test.js)

```javascript
// Source: tests/installer.test.js lines 27-42
// The fork already has this pattern -- the prototype extends it
function runInstaller(env = {}, args = []) {
  try {
    const result = execSync(`node "${INSTALL_SCRIPT}" ${args.join(' ')}`, {
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString() || '',
      error: err.stderr?.toString() || err.message,
    };
  }
}
```

### User-Visible Strings That Need Branding (Exhaustive List for Prototype)

These are the strings the prototype must replace in install.js and verify appear correctly after installation:

| Line | Original | Branded As | Context |
|------|----------|------------|---------|
| 120 | `npx get-shit-done-cc@latest` | `bunx @chude/get-stuff-done@latest` | WSL error message (user-visible) |
| 331 (help text) | `npx get-shit-done-cc` | `bunx @chude/get-stuff-done` | Help text examples |
| Banner line 292 | `by TÂCHES` | `by Chude Emeke` | Banner string |

**Machine-critical strings NOT to touch:**
- `'get-shit-done'` (directory name in path.join calls, ~130 occurrences)
- `GSD_CODEX_MARKER` constant (contains `get-shit-done installer` -- a config marker, not user text)
- `GSD_COPILOT_INSTRUCTIONS_MARKER` (same -- marker string written to config files)
- `require('../package.json')` (path reference)

**Judgment call for prototype:** The `GSD_CODEX_MARKER` and `GSD_COPILOT_INSTRUCTIONS_MARKER` constants (lines 17-22) contain `"get-shit-done installer"`. These are written to config files as machine-readable ownership markers. For the prototype (Claude runtime only), these markers are irrelevant (Claude install doesn't write these). Leave them unbranded in the prototype -- address in Phase 30/33.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct-edit fork (modify upstream files in-repo) | Overlay architecture (upstream as devDependency, composition pipeline) | 2026-03-28 (design) | Phase 29 is the validation gate for this shift |
| HOME env var for test isolation | `--config-dir` flag | Phase 29 (new finding) | `os.homedir()` ignores HOME on Windows; --config-dir is the reliable path |
| `stdio: 'inherit'` (production) | `stdio: ['pipe','pipe','pipe']` (tests) | Phase 29 (clarification) | Production wrapper uses inherit for TTY; tests use pipe for output capture |

## Open Questions

1. **Whether prototype is automated test or manual script**
   - What we know: CONTEXT.md marks this as Claude's discretion; the spec says "reusable as basis for installer.test.js in Phase 33"
   - What's unclear: Manual scripts are faster to write but don't give regression protection; automated tests take longer but pay forward
   - Recommendation: Automated bun:test in `tests/prototype-installer.test.js`. Takes ~30 minutes longer to write but becomes the Phase 33 installer test foundation directly. A manual script would be discarded.

2. **Whether to install get-shit-done-cc as actual devDependency first or use tmp_upstream approach**
   - What we know: The overlay-architecture branch hasn't been created yet; current `package.json` doesn't have `get-shit-done-cc` as devDep; the prototype needs upstream's files
   - What's unclear: Should we add the devDep now (on current main) or create the overlay-architecture branch first?
   - Recommendation: For Phase 29 only, temporarily install `get-shit-done-cc@1.30.0` as a devDependency (`bun add -d get-shit-done-cc@1.30.0`) and use `node_modules/get-shit-done-cc/` as the source. The prototype test can reference it from `node_modules`. This avoids creating the overlay branch before the gate validates. If Phase 29 fails (go/no-go), we haven't committed to the branch structure.

3. **Branding verification: what exactly to assert**
   - What we know: CONTEXT.md says "branding check: installed help text contains '@chude/get-stuff-done', not 'get-shit-done-cc'"
   - What's unclear: The help text is printed to stdout during install, not written to disk. Installed files don't contain the help string -- only the install.js binary itself does.
   - Recommendation: Two-part branding verification: (a) Check install.js in the scratch dir contains `@chude/get-stuff-done` where help text was (text content check); (b) Run `node install.js --help` and assert the output contains `@chude/get-stuff-done`. Part (b) also validates PROTO-02 (branding doesn't break the `--help` path).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | bun:test (built-in Bun test runner) |
| Config file | None -- bun picks up `*.test.js` automatically |
| Quick run command | `bun test tests/prototype-installer.test.js` |
| Full suite command | `bun test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROTO-01 | Upstream install.js executes from scratch dir and installs without errors | integration | `bun test tests/prototype-installer.test.js --test-name-pattern "PROTO-01"` | No -- Wave 0 |
| PROTO-02 | Text branding in install.js does not break installation; branded strings appear correctly | integration | `bun test tests/prototype-installer.test.js --test-name-pattern "PROTO-02"` | No -- Wave 0 |
| PROTO-03 | Overlay additions can be copied to target after upstream install completes without conflict | integration | `bun test tests/prototype-installer.test.js --test-name-pattern "PROTO-03"` | No -- Wave 0 |

All three requirements are best covered by integration tests that run the actual installer subprocess. Unit tests are not sufficient here -- the go/no-go question is about runtime behavior, not code logic.

### Sampling Rate

- **Per task commit:** `bun test tests/prototype-installer.test.js`
- **Per wave merge:** `bun test tests/prototype-installer.test.js`
- **Phase gate:** All three tests green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/prototype-installer.test.js` -- covers PROTO-01, PROTO-02, PROTO-03 (entire test file is new)
- [ ] `get-shit-done-cc@1.30.0` in devDependencies -- must be installed before tests can run

*(No framework install needed -- bun:test already available)*

## Sources

### Primary (HIGH confidence)

- Direct source read: `tmp_upstream/package/bin/install.js` (5,008 lines, get-shit-done-cc v1.30.0, downloaded from npm registry)
  - Traced: `__dirname` usage (single occurrence at line 4062)
  - Traced: `require('../package.json')` at line 56
  - Traced: `os.homedir()` fallback chain in `getGlobalDir()` lines 197-280
  - Traced: `process.argv.slice(2)` at line 59 (standard, no side effects)
  - Traced: interactive prompt logic at lines 4760-5008
  - Traced: `process.stdin.isTTY` check at line 4830 (non-interactive default behavior)
  - Traced: exit code behavior: `process.exit(1)` on install failure at line 4330; success returns normally
- Direct source read: `tests/installer.test.js` (fork's existing installer test)
  - Confirmed: `execSync` + `{ env: { ...process.env, HOME: mockHome, USERPROFILE: mockHome } }` is the established test pattern
  - Confirmed: `--config-dir` flag works as isolation mechanism (test at line 172)
- Direct runtime test: `os.homedir()` behavior under HOME env override on Windows
  - Confirmed: `os.homedir()` returns `C:\Users\Destiny` even after `process.env.HOME = 'C:/test_home'`
  - Confirmed: `CLAUDE_CONFIG_DIR` env var overrides `os.homedir()` correctly
- Direct source read: upstream `package.json` (v1.30.0)
  - Confirmed: `files` array is `["bin", "commands", "get-shit-done", "agents", "hooks/dist", "scripts"]`
  - Confirmed: no production dependencies (zero npm packages to install)

### Secondary (MEDIUM confidence)

- upstream npm registry metadata (fetched directly): version 1.30.0 confirmed latest as of 2026-03-27

## Metadata

**Confidence breakdown:**
- Path resolution mechanism: HIGH -- verified by direct source read of the 5,008-line file; single `__dirname` usage at line 4062
- Windows HOME override behavior: HIGH -- verified by direct runtime test on this machine (Windows 11)
- Interactive prompt bypass: HIGH -- traced the flag-detection logic at lines 4987-4995; `--claude --global` = zero prompts
- Branding scope: HIGH -- analyzed all `get-shit-done-cc` occurrences; 3 user-visible, 130+ are path references not to be touched
- Subprocess exit code behavior: HIGH -- `process.exit(1)` on failure, normal return on success, confirmed at lines 4327-4330

**Research date:** 2026-03-27
**Valid until:** 2026-05-27 (upstream v1.30.0 is pinned; research is valid until upstream version changes)
