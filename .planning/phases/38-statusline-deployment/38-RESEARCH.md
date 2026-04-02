# Phase 38: Statusline Deployment - Research

**Researched:** 2026-04-02
**Domain:** Composition pipeline, installer post-install hooks, Claude Code statusLine settings
**Confidence:** HIGH

## Summary

Phase 38 deploys the fork's enhanced 254-line statusline globally, replacing the upstream's 119-line base version that currently lives at `~/.claude/hooks/gsd-statusline.js`. The deployment gap exists because the fork's statusline (and check-update hook) live at `hooks/` in the repo root, outside the `overlay/` directory that the composition pipeline walks. Moving them to `overlay/hooks/` makes them part of the standard overlay file-copy flow with zero special cases.

The installer needs a post-install step to wire the `statusLine` setting into `~/.claude/settings.json`. The upstream installer already handles statusLine registration (it calls `buildHookCommand(targetDir, 'gsd-statusline.js')` and writes it to settings), so the fork's delegation installer must patch the setting AFTER upstream completes -- the upstream installer sets the path relative to its own `targetDir`, but the overlay version lives at the same `~/.claude/hooks/gsd-statusline.js` path, so the upstream's setting is actually correct. The fork installer only needs to ensure the setting exists (add if missing) and that the path points to the correct location.

Additionally, the fork's statusline has no stdin timeout guard (the upstream version has a 3-second one at line 14). The fork's check-update hook uses a 15-second timeout for `git fetch`, which can hang the session start on unreachable remotes. Both need safety fixes.

**Primary recommendation:** Move both hook files to `overlay/hooks/`, add a 3-second stdin timeout to the statusline, reduce git fetch timeout to 3 seconds, and add a read-modify-write `patchStatusLine()` step to the delegation installer.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Move `hooks/gsd-statusline.js` (254 lines, repo root) to `overlay/hooks/gsd-statusline.js`. The composition pipeline walks `overlay/` -- this makes the statusline a proper overlay file, no special cases needed.
- **D-02:** After moving, the statusline will appear in `.overlay-manifest.json` and be included in `dist/`. The installer's overlay file-copy step will deploy it to `~/.claude/hooks/gsd-statusline.js`.
- **D-03:** Also move `hooks/gsd-check-update.js` to `overlay/hooks/` if it's fork-specific (it has maintainer-mode git fetch that upstream doesn't have).
- **D-04:** The overlay's post-install step (after upstream installer completes) patches `~/.claude/settings.json` to add the `statusLine` entry. This is read-modify-write, preserving existing user settings.
- **D-05:** The statusLine setting should be: `{ "type": "command", "command": "node <target>/hooks/gsd-statusline.js" }` where `<target>` is the resolved install directory (same as where overlay files are copied).
- **D-06:** If user already has a custom statusLine setting, preserve it (don't overwrite). Only add if missing.
- **D-07:** Reduce `gsd-check-update.js` git fetch timeout from 15s to 3s. On timeout, write `fetch_error: true` to cache (existing behavior) and continue gracefully.
- **D-08:** Add a defensive 3s overall timeout to the statusline script itself (belt-and-suspenders). If the statusline takes >3s for any reason, output a fallback minimal status and exit 0.
- **D-09:** Industry pattern: statusline NEVER does blocking I/O. It reads pre-computed cache. The check-update hook writes the cache asynchronously. This architecture is already correct -- the timeout changes are safety nets.

### Claude's Discretion
- Whether gsd-check-update.js needs to move to overlay/ or is already handled by the composition pipeline
- Exact fallback output format when statusline times out
- Whether to use `setTimeout` or `AbortController` for the statusline timeout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAT-01 | Composition pipeline deploys fork's enhanced statusline to `~/.claude/hooks/gsd-statusline.js` (replacing upstream's 119-line base) | Move `hooks/gsd-statusline.js` to `overlay/hooks/gsd-statusline.js`. Compose pipeline's `merge()` stage (line 790-808) copies all non-metadata overlay files to `dist/`. Overlay file at `hooks/gsd-statusline.js` does NOT collide with upstream's `hooks/dist/gsd-statusline.js` -- different paths. Installer's `copyOverlayFiles()` runs AFTER upstream install, overwriting upstream's 119-line version with the fork's 254-line version at `~/.claude/hooks/gsd-statusline.js`. |
| STAT-02 | Installer wires `statusLine` setting into global `~/.claude/settings.json` | Upstream installer already writes statusLine setting (line 4583: `settings.statusLine = { type: 'command', command: statuslineCommand }`). The delegation installer's post-install step should verify the setting exists and add it if missing. Uses `buildHookCommand()` pattern: `node "<configDir>/hooks/gsd-statusline.js"`. Read-modify-write with `JSON.parse`/`JSON.stringify` preserves existing settings. |
| STAT-03 | Statusline `git fetch` has a timeout (max 3s) with graceful fallback on timeout/error | Two changes: (1) `gsd-check-update.js` line 82: change `timeout: 15000` to `timeout: 3000`. Existing error handling already writes `fetch_error: true` to cache. (2) Add `setTimeout(() => process.exit(0), 3000)` stdin guard to statusline script (matching upstream's pattern at line 14 of the 119-line version). |
| STAT-04 | Statusline displays correctly in non-GSD projects (verified in at least one other project) | Fork statusline uses relative `require('../src/...')` paths. When installed at `~/.claude/hooks/gsd-statusline.js`, `../src/` resolves to `~/.claude/src/`. The overlay manifest already deploys `src/config/ConfigLoader.js`, `src/theme/index.js`, `src/theme/themes.js`, `src/theme/tokens.js`, `src/theme/Style.js`, and `src/platform/terminal.js` to `~/.claude/src/`. Relative paths resolve correctly from any working directory because Node's `require()` resolves from the file's dirname, not the cwd. |
</phase_requirements>

## Architecture Patterns

### Current State (the gap)

```
repo root:
  hooks/
    gsd-statusline.js        # 254 lines, fork-enhanced (NOT in overlay)
    gsd-check-update.js      # fork with maintainer git fetch (NOT in overlay)
  overlay/
    hooks/
      pre-compact.js          # already in overlay
      pre-compact.sh          # already in overlay

upstream (node_modules/get-shit-done-cc):
  hooks/
    dist/
      gsd-statusline.js       # 119 lines, upstream base
      gsd-check-update.js     # upstream npm-only check (no git fetch)
      gsd-context-monitor.js
      gsd-prompt-guard.js
      gsd-workflow-guard.js

globally installed (~/.claude/):
  hooks/
    gsd-statusline.js         # 119 lines (upstream's version -- the problem)
    gsd-check-update.js       # 114 lines (upstream's version -- missing maintainer path)
    pre-compact.js            # overlay version (correctly deployed)
    pre-compact.sh            # overlay version (correctly deployed)
  settings.json               # has statusLine pointing to gsd-statusline.js (already set)
  src/                        # overlay's config/theme/platform modules (already deployed)
```

### Target State (after phase 38)

```
repo root:
  overlay/
    hooks/
      gsd-statusline.js       # moved from hooks/ to overlay/hooks/
      gsd-check-update.js     # moved from hooks/ to overlay/hooks/
      pre-compact.js           # already here
      pre-compact.sh           # already here
  hooks/                       # empty or removed

globally installed (~/.claude/):
  hooks/
    gsd-statusline.js          # 254 lines, fork's enhanced version (overlay overwrites upstream)
    gsd-check-update.js        # fork's version with maintainer path (overlay overwrites upstream)
    pre-compact.js
    pre-compact.sh
  settings.json                # statusLine entry confirmed/added by installer
```

### Composition Pipeline Flow

```
1. resolve() -- walks overlay/, discovers hooks/gsd-statusline.js
                (no collision: upstream has hooks/dist/gsd-statusline.js, different path)
2. filter()  -- no exclusion (hooks category matches hooks/dist/, not hooks/)
3. override() -- n/a (no override for this file)
4. brand()   -- applies branding substitutions to the statusline content
5. merge()   -- writes to dist/hooks/gsd-statusline.js
                adds "hooks/gsd-statusline.js" to .overlay-manifest.json
```

### Installer Flow

```
1. bin/install.js main()
2. Spawns upstream install.js (stdio: inherit)
3. Upstream copies hooks/dist/*.js to ~/.claude/hooks/ (119-line statusline)
4. Upstream writes statusLine setting to ~/.claude/settings.json
5. Upstream exits 0
6. bin/install.js child.on('close'):
   a. copyOverlayFiles() -- copies dist/ overlay files to ~/.claude/
      - dist/hooks/gsd-statusline.js -> ~/.claude/hooks/gsd-statusline.js (OVERWRITES upstream's)
      - dist/hooks/gsd-check-update.js -> ~/.claude/hooks/gsd-check-update.js (OVERWRITES upstream's)
   b. writeInstallMeta()
   c. NEW: patchStatusLine() -- verify/add statusLine in ~/.claude/settings.json
```

### Relative Path Resolution (why fork statusline works globally)

The fork's statusline uses:
```javascript
require('../src/config/ConfigLoader')  // resolves from __dirname, not cwd
require('../src/theme')                // same
require('../src/platform/terminal')    // same
```

When installed at `~/.claude/hooks/gsd-statusline.js`:
- `__dirname` = `~/.claude/hooks/`
- `../src/config/ConfigLoader` = `~/.claude/src/config/ConfigLoader`
- `../src/theme` = `~/.claude/src/theme`
- `../src/platform/terminal` = `~/.claude/src/platform/terminal`

These all exist because the overlay manifest already deploys them. The `require()` function resolves relative to the file's location, NOT the process cwd, so this works from any project directory.

### Anti-Patterns to Avoid
- **Never overwrite user's custom statusLine:** If user has a non-GSD statusLine setting (not containing `gsd-statusline`), preserve it. Only add when missing or update when it already references `gsd-statusline`.
- **Never do blocking network I/O in statusline:** The statusline reads cache files only. Network I/O happens in the check-update hook (background process).
- **Never let a statusline error crash Claude Code:** Always wrap in try-catch, always exit 0.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| settings.json read-modify-write | Custom JSON merge logic | `JSON.parse` + spread/assign + `JSON.stringify(, null, 2)` | JSON.parse/stringify handles all edge cases; upstream uses same pattern |
| Hook path construction | String concatenation with OS paths | Forward-slash paths per upstream's `buildHookCommand()`: `configDir.replace(/\\\\/g, '/') + '/hooks/' + hookName` | Cross-platform: Node.js handles forward slashes on Windows |
| Stdin timeout | Complex AbortController chain | `setTimeout(() => process.exit(0), 3000)` before stdin handlers | Upstream uses this exact pattern (line 14 of 119-line statusline). Simpler, proven. |

## Common Pitfalls

### Pitfall 1: Overlay collision with upstream hooks/dist path
**What goes wrong:** Compose pipeline's resolve() stage throws "Collision detected" error
**Why it happens:** If the overlay file path matches an upstream file path exactly
**How to avoid:** Overlay files go to `hooks/gsd-statusline.js`; upstream files are at `hooks/dist/gsd-statusline.js`. These are DIFFERENT paths. No collision. Verified by reading resolve() at compose.js line 440-456.
**Warning signs:** `bun run compose` fails with collision error

### Pitfall 2: Branding applied to fork-owned hook content
**What goes wrong:** Branding substitutions corrupt hook code (e.g., replacing variable names that match branding tokens)
**Why it happens:** compose.js's `shouldBrandFile()` excludes `overlay/` and `overrides/` paths, but the merge stage writes overlay files directly -- they skip branding by design (line 800-806 copies verbatim, no branding pass).
**How to avoid:** This is already handled correctly. Overlay files are copied verbatim in merge(), not through the branding pipeline. No action needed.
**Warning signs:** Hook fails with syntax errors after compose

### Pitfall 3: Project-level settings.json still has relative path
**What goes wrong:** `.claude/settings.json` (project-level) has `"command": "node hooks/gsd-statusline.js"` which only resolves when Claude Code is opened in the GSD project directory
**Why it happens:** The project-level settings.json was written for development, not global use
**How to avoid:** Update `.claude/settings.json` (project-level) to match the global path pattern, OR leave it as-is (it works for development in the GSD project). The global `~/.claude/settings.json` is what matters for STAT-04.
**Warning signs:** Statusline works in GSD project but not in other projects

### Pitfall 4: Upstream installer's statusLine prompt blocks non-interactive install
**What goes wrong:** Upstream's `handleStatusline()` prompts user if statusLine already exists
**Why it happens:** Upstream detects existing statusLine and asks to overwrite (line 4646-4681)
**How to avoid:** The fork's delegation installer passes CLI args through to upstream. If `--force-statusline` is not passed and a statusLine already exists, upstream skips the statusLine setup. The overlay's post-install `patchStatusLine()` step should verify/fix the setting regardless. Use `--force-statusline` in the upstream spawn args if the overlay always needs to control the statusLine.
**Warning signs:** StatusLine setting missing after re-install when user had custom settings

### Pitfall 5: setTimeout cleanup not matching upstream pattern
**What goes wrong:** Timer fires after stdin ends, causing double-output or race condition
**Why it happens:** Not clearing the timeout when stdin ends normally
**How to avoid:** Follow upstream's exact pattern: set timeout BEFORE stdin handlers, `clearTimeout` in the `'end'` handler before processing. Upstream: line 14 sets timer, line 18 clears it.
**Warning signs:** Statusline outputs twice or outputs fallback even when data arrives in time

## Code Examples

### Pattern 1: Stdin timeout guard (from upstream statusline, line 12-18)

```javascript
// Source: node_modules/get-shit-done-cc/hooks/dist/gsd-statusline.js line 12-18
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    // ... process data ...
  } catch (e) {
    // Silent fail
  }
});
```

### Pattern 2: Settings.json read-modify-write (from upstream installer)

```javascript
// Source: node_modules/get-shit-done-cc/bin/install.js line 367-385
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
```

### Pattern 3: buildHookCommand (from upstream installer, line 349-353)

```javascript
// Source: node_modules/get-shit-done-cc/bin/install.js line 349-353
function buildHookCommand(configDir, hookName) {
  const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}
```

### Pattern 4: StatusLine setting structure (from upstream installer, line 4583-4586)

```javascript
// Source: node_modules/get-shit-done-cc/bin/install.js line 4583-4586
settings.statusLine = {
  type: 'command',
  command: statuslineCommand  // e.g., node "C:/Users/Destiny/.claude/hooks/gsd-statusline.js"
};
```

## Discretion Recommendations

### D-03: Should gsd-check-update.js move to overlay/?

**Recommendation: YES, move it.**

Evidence:
- The globally installed version (114 lines) is upstream's npm-only checker -- it has `detectConfigDir()` but NO maintainer path, NO git fetch, NO upstream commit classification
- The fork's version (193 lines) adds: maintainer-mode git fetch, commit classification by severity, upstream commit counting
- This is fork-specific behavior, same as the statusline enhancement
- The fork version uses `require('../src/config/ConfigLoader')` which requires the overlay `src/` modules

The check-update hook is fork-specific and belongs in `overlay/hooks/`.

### Timeout mechanism: setTimeout vs AbortController

**Recommendation: Use `setTimeout` (same as upstream pattern).**

Evidence:
- Upstream uses `setTimeout(() => process.exit(0), 3000)` -- proven pattern
- AbortController is designed for aborting fetch/streams, not for overall script timeouts
- `setTimeout` is simpler: one line before stdin handlers, one `clearTimeout` in end handler
- Both achieve the same result, but setTimeout is 2 lines vs 5+ for AbortController
- Maintaining consistency with upstream reduces cognitive load

### Fallback output when statusline times out

**Recommendation: Exit silently (exit code 0, no output).**

Evidence:
- Upstream's timeout exits with `process.exit(0)` and no output
- Claude Code handles empty statusline output gracefully (shows nothing, no error)
- Writing partial output on timeout risks garbled display
- Silent exit is the safest option -- Claude Code simply shows no statusline for that tick

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (built-in) |
| Config file | bunfig.toml (timeout: 15000ms per test) |
| Quick run command | `bun test tests/hooks.test.js` |
| Full suite command | `bun test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-01 | Overlay manifest includes hooks/gsd-statusline.js after compose | unit | `bun test tests/compose.test.js -t "overlay"` | Existing (tests/compose.test.js, 2191 lines) |
| STAT-01 | copyOverlayFiles copies statusline to target hooks/ | unit | `bun test tests/installer-safety.test.js` | Existing (tests/installer-safety.test.js, 658 lines) |
| STAT-02 | patchStatusLine adds statusLine to settings.json when missing | unit | `bun test tests/installer-safety.test.js -t "statusLine"` | Wave 0 gap |
| STAT-02 | patchStatusLine preserves existing custom statusLine | unit | `bun test tests/installer-safety.test.js -t "statusLine"` | Wave 0 gap |
| STAT-03 | gsd-check-update.js git fetch timeout is 3s | unit | `bun test tests/hooks.test.js -t "timeout"` | Partial (hooks.test.js has maintainer tests) |
| STAT-03 | gsd-statusline.js has stdin timeout guard | unit | `bun test tests/hooks.test.js -t "timeout"` | Wave 0 gap |
| STAT-04 | Statusline produces valid output with mock stdin from any cwd | integration | `bun test tests/hooks.test.js -t "statusline"` | Partial (hooks.test.js has statusline tests) |

### Sampling Rate
- **Per task commit:** `bun test tests/hooks.test.js tests/compose.test.js tests/installer-safety.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/installer-safety.test.js` -- add patchStatusLine tests (STAT-02): add-when-missing, preserve-custom, update-gsd-path
- [ ] `tests/hooks.test.js` -- add stdin timeout test for fork statusline (STAT-03): verify timeout fires on slow stdin
- [ ] `tests/hooks.test.js` -- add 3s timeout assertion for check-update git fetch (STAT-03)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fork hooks at repo root `hooks/` | Move to `overlay/hooks/` | Phase 38 | Hooks participate in standard overlay pipeline |
| 15s git fetch timeout | 3s git fetch timeout | Phase 38 | Prevents session start hang on slow remotes |
| No statusline stdin timeout | 3s stdin timeout guard | Phase 38 | Prevents statusline hang on pipe issues |
| Manual statusLine in project settings only | Global settings.json wiring in installer | Phase 38 | Works in all projects, not just GSD |

## Open Questions

1. **Project-level `.claude/settings.json` statusLine path**
   - What we know: Currently `"command": "node hooks/gsd-statusline.js"` (relative, only works in GSD project dir)
   - What's unclear: Should this be updated to match the global absolute path pattern?
   - Recommendation: Leave as-is for development. Project-level settings override global, and the relative path works correctly when developing in the GSD project. The global settings handle all other projects.

2. **Upstream installer's `--force-statusline` flag interaction**
   - What we know: Upstream prompts to replace existing statusLine unless `--force-statusline` is passed. The delegation installer passes all user args through.
   - What's unclear: Should the delegation installer inject `--force-statusline` automatically?
   - Recommendation: No. The overlay `copyOverlayFiles()` already overwrites the hook file itself (binary content). The `patchStatusLine()` step only needs to ensure the settings.json entry exists. If upstream already wrote it (which it does for fresh installs), no additional action needed. The `patchStatusLine()` is a safety net for cases where upstream skipped it.

## Project Constraints (from CLAUDE.md)

No project-level CLAUDE.md exists. Global rules apply:
- TDD: RED-GREEN-REFACTOR, tests first
- Coverage: 95%+ at EACH metric
- Bun over npm for all operations
- No AI attribution in commits
- No emojis in code/docs/commits
- Git author: Chude <chude@emeke.org>
- Hexagonal architecture with strict layer separation

## Sources

### Primary (HIGH confidence)
- `scripts/compose.js` lines 790-823 -- overlay file copy and manifest generation in merge()
- `scripts/compose.js` lines 440-456 -- collision detection logic in resolve()
- `bin/install.js` lines 383-406, 502-518 -- overlay copy and install flow
- `node_modules/get-shit-done-cc/bin/install.js` lines 4288-4319 -- upstream hook deployment
- `node_modules/get-shit-done-cc/bin/install.js` lines 4449-4586 -- upstream statusLine settings
- `node_modules/get-shit-done-cc/bin/install.js` lines 349-353 -- buildHookCommand()
- `hooks/gsd-statusline.js` -- fork's 254-line enhanced statusline (current location)
- `hooks/gsd-check-update.js` line 82-83 -- 15s timeout for git fetch
- `~/.claude/hooks/gsd-statusline.js` -- globally installed 119-line upstream version
- `~/.claude/settings.json` -- current global settings (statusLine already configured manually)
- `dist/.overlay-manifest.json` -- current overlay manifest (does NOT include statusline hooks)
- `overlay/hooks/` -- current overlay hooks directory (only pre-compact.js/sh)

### Secondary (MEDIUM confidence)
- Node.js `require()` resolution: relative paths resolve from `__dirname`, not `process.cwd()` -- standard Node.js behavior, verified with path.resolve test

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all patterns verified against actual codebase
- Architecture: HIGH - compose pipeline, installer, and upstream installer all read directly
- Pitfalls: HIGH - each pitfall verified against specific code lines

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- composition pipeline and installer change infrequently)
