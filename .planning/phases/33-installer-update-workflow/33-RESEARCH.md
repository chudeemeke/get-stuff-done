# Phase 33: Installer & Update Workflow - Research

**Researched:** 2026-03-29
**Domain:** Node.js subprocess delegation, npm installer architecture, supply chain scanning
**Confidence:** HIGH

## Summary

Phase 33 builds two distinct systems: (1) a delegation-based installer that spawns upstream's 5,008-line install.js as a subprocess and layers 32 overlay files on top, and (2) a preview-update script that diffs the pinned upstream version against npm latest, runs the existing 6-vector supply chain scanner, and invokes check-overrides.js for staleness detection.

The codebase is well-prepared for this phase. The composed dist/ already contains the complete 5,008-line upstream install.js with branding applied, the 32 overlay-only files ready to copy, and the .install-meta.json with full audit trail. Phase 29's prototype tests validated the subprocess delegation pattern including --config-dir isolation on Windows. The supply chain scanner (sync.cjs) and override staleness detector (check-overrides.js) are already exported and tested.

**Primary recommendation:** Build a thin bin/install.js (~200-300 lines) that: (1) spawns `node dist/bin/install.js` with stdio: 'inherit' and all user flags, (2) on exit 0 copies overlay-only files from dist/ to the target directory, (3) writes .install-meta.json to the target, (4) detects v2.x installations before proceeding. Build scripts/preview-update.js (~250-350 lines) that: (1) runs `npm view get-shit-done-cc version` to get latest, (2) diffs against pinned version in package.json, (3) runs supply chain checks on the version delta, (4) invokes check-overrides.js, (5) outputs a structured report.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Subprocess delegation via child_process.spawn with stdio: 'inherit' for stdout/stderr passthrough
- Upstream's install.js (5,008-line monolith) is designed as a CLI entry point with 15 process.exit() calls -- require() would kill the fork process on any upstream error
- All user flags (--claude, --opencode, --all, --global, --local, etc.) pass through to upstream unchanged
- On upstream success (exit 0): copy overlay-only files from composed dist/ to the installed target directory
- On upstream failure (non-zero exit): clean up any partial upstream files, report the error with upstream's stderr, exit with upstream's exit code
- .install-meta.json written after successful overlay application with upstream version, overlay version, timestamp, features disabled, overrides applied
- Detection uses both signals: .install-meta.json check first (missing overlay_version or version < 3.0), file structure fingerprint fallback (src/ directory, old hooks layout)
- When v2.x detected: prompt user with what will be removed, require confirmation before proceeding
- Cleanup strategy: wipe the installation target directory entirely, then run fresh v3.0 install. User config (~/.gsd/) and project data (.planning/) are outside the install dir blast radius
- `bun run preview-update` is a read-only command that shows a structured diff report
- Supply chain scan runs automatically as part of preview
- Critical findings are flagged prominently but do not block
- Preview and apply are separate operations (Terraform plan/apply pattern)
- --uninstall removes all files in the installation target directory (both upstream and overlay files)
- No confirmation prompt for --uninstall -- matches upstream behavior
- Idempotent: missing files skipped, missing target dir exits 0 with "Nothing to uninstall"

### Claude's Discretion
- Exact error message formatting for install failures
- Progress indicators during installation (spinner, dots, etc.)
- Temp file handling during compose-before-install
- preview-update report formatting and section ordering
- Whether to show file counts or file names in the cleanup confirmation prompt

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | bin/install.js delegates to upstream's install.js operating on composed dist/ files | Subprocess spawn pattern validated in Phase 29 prototype; dist/bin/install.js is the 5,008-line branded upstream installer |
| INST-02 | After upstream install completes, overlay additions copied to target | 32 overlay-only files identified in dist/ via diff against upstream; file list is deterministic from compose pipeline |
| INST-03 | .install-meta.json written to installed directory with version and composition metadata | Existing .install-meta.json format in dist/ has all required fields; copy + augment with install-time data |
| INST-04 | --uninstall removes both upstream and overlay files from target | Upstream uninstall() at line 3300 removes file-by-file; fork uninstall can wipe target dir entirely (simpler, matches context decision) |
| INST-05 | Existing v2.x installations detected and cleaned up during v3.0 install | v2.x .install-meta.json has version field but no overlay_version; src/ directory is v2.x fingerprint |
| INST-06 | Installer tests written before implementation (TDD) | Test patterns established in prototype-installer.test.js and installer.test.js; createTempDir + execSync + --config-dir isolation |
| UPD-01 | preview-update script diffs pinned upstream version against latest on npm | `npm view get-shit-done-cc version` returns current latest (verified: 1.30.0); package.json devDependencies has pinned version |
| UPD-02 | Supply chain scan runs during preview-update, before bun update | sync.cjs exports runSupplyChainChecks() with 6 vectors; need to adapt for npm-tarball diff context vs git-commit diff context |
| UPD-03 | check-overrides.js flags overrides affected by upstream changes | Standalone script with checkOverrides() export; returns structured result with stale/fresh/missing-reason/orphaned statuses |
| UPD-04 | Rollback supported by pinning previous upstream version and recomposing | Standard npm workflow: edit package.json version pin, bun install, bun run compose; no special tooling needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| child_process.spawn | Node.js built-in | Subprocess delegation for upstream installer | stdio: 'inherit' gives real-time output passthrough; exit code propagation via 'close' event |
| child_process.execSync | Node.js built-in | npm view version query | Synchronous is fine for single npm registry query; simpler than async for CLI script |
| fs (Node.js) | Built-in | File copy, directory wipe, meta read/write | Project standard; zero dependencies |
| path (Node.js) | Built-in | Cross-platform path joins | Project standard |
| crypto (Node.js) | Built-in | SHA-256 hashing for file integrity | Already used in check-overrides.js |

### Supporting (Reused from existing codebase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sync.cjs (overlay/lib) | Fork code | runSupplyChainChecks() for preview-update | Supply chain scanning of upstream version delta |
| check-overrides.js (scripts/) | Fork code | checkOverrides() for staleness detection | Preview-update override impact analysis |
| compose.js (scripts/) | Fork code | compose() for recomposition after update | After `bun update` to rebuild dist/ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| spawn with stdio:'inherit' | execSync | execSync captures output but loses real-time display; spawn with inherit gives user the upstream experience |
| `npm view` for version check | `npm-registry-fetch` | Registry fetch is a dependency; npm view is zero-dep CLI call; acceptable for a read-only CLI script |
| Full directory wipe for uninstall | File-by-file removal from manifest | Manifest-based removal is more precise but upstream doesn't maintain a reliable file list; wipe is simpler and matches context decision |

**Installation:** No new dependencies. All required modules are Node.js built-ins or existing fork code.

## Architecture Patterns

### Recommended Project Structure
```
bin/
  install.js          # NEW: Delegation installer (~200-300 lines)
scripts/
  preview-update.js   # NEW: Read-only update preview (~250-350 lines)
  compose.js          # EXISTING: Composition pipeline
  check-overrides.js  # EXISTING: Override staleness detector
```

### Pattern 1: Subprocess Delegation with Post-Install Overlay
**What:** Fork installer spawns upstream's install.js as a subprocess, waits for completion, then copies overlay additions on top.
**When to use:** When the upstream installer is a monolithic CLI entry point with process.exit() calls that cannot be safely require()'d.
**Example:**
```javascript
// Source: Phase 29 prototype-installer.test.js (validated pattern)
const { spawn } = require('child_process');

function delegateToUpstream(distDir, userArgs) {
  const installScript = path.join(distDir, 'bin', 'install.js');
  const child = spawn(process.execPath, [installScript, ...userArgs], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('close', (code) => {
    if (code === 0) {
      copyOverlayFiles(distDir, targetDir);
      writeInstallMeta(targetDir);
    } else {
      process.exit(code);
    }
  });
}
```

### Pattern 2: Target Directory Resolution
**What:** Determine where upstream installed files by parsing the same --config-dir, --global, --local flags that upstream uses.
**When to use:** After upstream install completes, to know where to copy overlay files.
**Critical detail:** The fork installer must replicate upstream's getGlobalDir() logic to determine the target directory. The upstream function resolves: --config-dir > env vars > platform defaults (e.g., ~/.claude for Claude).
**Example:**
```javascript
// Upstream's resolution priority (line 197-296 of upstream install.js):
// 1. explicitConfigDir (--config-dir flag)
// 2. CLAUDE_CONFIG_DIR env var
// 3. os.homedir() + '/.claude'
function resolveTargetDir(runtime, isGlobal, isLocal, explicitConfigDir) {
  if (!isGlobal) {
    return path.join(process.cwd(), getDirName(runtime));
  }
  if (explicitConfigDir) return explicitConfigDir;
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return path.join(os.homedir(), '.claude');
}
```

### Pattern 3: Overlay File Identification
**What:** Identify which files in dist/ are overlay additions (not from upstream) by comparing against upstream package contents.
**When to use:** During post-install overlay copy.
**Critical detail:** There are exactly 32 overlay-only files in dist/ (identified by diffing dist/ against node_modules/get-shit-done-cc/). These include: lib/sync.cjs, src/config/*, src/platform/*, src/theme/*, src/validation/*, hooks/pre-compact.*, bin/sync-tools.cjs, bin/validate-configs.js, teams/*, memory/*, workflows/set-profile.md, workflows/upstream-sync.md, commands/gsd/upstream.md, agents/general-purpose.md, agents/gsd-oversight-*.md, CREDITS.md, .install-meta.json.
**Implementation options:**
1. Hardcoded list in installer (simple but brittle)
2. Diff at install time (reliable but slower)
3. Marker file in overlay that lists additions (best -- compose.js can generate this)

### Pattern 4: v2.x Detection and Cleanup
**What:** Before v3.0 install, check if target directory has a v2.x installation and clean it up.
**When to use:** When the user's target dir already contains GSD files.
**Detection signals:**
- Signal 1 (primary): Read .install-meta.json from target. v2.x has `version` field but no `overlay_version` field. v2.x `version` will be < 3.0.
- Signal 2 (fallback): Check for `src/` directory in target (v2.x installed fork source files; v3.0 does not).
- Signal 3 (fallback): Check for `get-stuff-done/` directory (v2.x used this name; v3.0 uses upstream's `get-shit-done/` internally).
**Example:**
```javascript
function detectV2Installation(targetDir) {
  const metaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (!meta.overlay_version || parseFloat(meta.version) < 3.0) {
      return { isV2: true, version: meta.version, signal: 'meta' };
    }
  }
  // Fallback: v2.x had src/ in the install target
  if (fs.existsSync(path.join(targetDir, 'src'))) {
    return { isV2: true, signal: 'src-directory' };
  }
  // Fallback: v2.x used get-stuff-done/ not get-shit-done/
  if (fs.existsSync(path.join(targetDir, 'get-stuff-done')) &&
      !fs.existsSync(path.join(targetDir, 'get-shit-done'))) {
    return { isV2: true, signal: 'directory-name' };
  }
  return { isV2: false };
}
```

### Pattern 5: Preview-Update Terraform Plan/Apply Model
**What:** A read-only script that shows what would change if the upstream version were bumped, without actually changing anything.
**When to use:** Before manually updating the upstream pin in package.json.
**Workflow:**
1. Query npm for latest version: `npm view get-shit-done-cc version`
2. Compare with pinned version from package.json devDependencies
3. If same: "Already up to date", exit 0
4. If different: download tarball metadata (not full package), compute file diff
5. Run supply chain checks on version delta
6. Run check-overrides.js against latest upstream
7. Output structured report with actionable next steps

### Anti-Patterns to Avoid
- **require() on upstream install.js:** 10 process.exit() calls (verified at lines 122, 303, 313, 332, 4329, 4772, 4847, 4974, 4977, 4981) would kill the fork process. Subprocess delegation is the only safe approach.
- **Parsing upstream stdout for target directory:** Upstream output format can change between versions. Replicate the resolution logic instead.
- **Modifying dist/bin/install.js at install time:** The composed dist/ is a build artifact. Installation should be read-only on dist/; writes go only to the target directory.
- **Auto-applying updates in preview-update:** Breaks the Terraform plan/apply model. Preview is read-only. Apply is a separate manual action (edit package.json + bun install + bun run compose).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supply chain scanning | Custom file scanners | sync.cjs runSupplyChainChecks() | 6 vectors already tested: prompt integrity, dependency diff, execution path, network endpoints, obfuscation, author anomaly |
| Override staleness detection | Custom hash comparison | check-overrides.js checkOverrides() | SHA-256 comparison with REASON.md extraction already tested |
| Target directory resolution | Guessing from CLI output | Replicate upstream's getGlobalDir() logic | The priority chain (--config-dir > env vars > platform default) is well-documented in upstream install.js lines 197-296 |
| npm version query | HTTP request to registry | `npm view get-shit-done-cc version` | Single shell call, no dependencies, reliable |
| Directory walk for overlay files | Manual recursive listing | Existing walkDir() helper (available in check-overrides.js) | Already proven cross-platform |

**Key insight:** The existing codebase already has the hard parts solved (supply chain scanning, override detection, branding, composition). Phase 33 is orchestration -- wiring these capabilities into an installer entry point and an update preview script.

## Common Pitfalls

### Pitfall 1: Target Directory Mismatch
**What goes wrong:** Fork installer copies overlay files to a different directory than where upstream actually installed, because the target resolution logic diverges.
**Why it happens:** Upstream's getGlobalDir() has runtime-specific logic (OpenCode uses XDG paths, Gemini uses ~/.gemini, etc.) and env var overrides (CLAUDE_CONFIG_DIR, etc.).
**How to avoid:** Parse the same CLI args upstream parses (--config-dir, --global, --local, runtime flags). Replicate the getGlobalDir() resolution chain. Do NOT try to detect target from upstream stdout.
**Warning signs:** Overlay files missing from installed directory; "command not found" when running GSD commands post-install.

### Pitfall 2: os.homedir() on Windows
**What goes wrong:** Tests set HOME env var expecting os.homedir() to respect it, but on Windows os.homedir() ignores HOME.
**Why it happens:** Node.js os.homedir() on Windows uses USERPROFILE, not HOME.
**How to avoid:** Use --config-dir flag for test isolation (validated in Phase 29). Never rely on HOME override for test directory isolation.
**Warning signs:** Tests pass on Linux/macOS but fail on Windows because target directory resolves to real ~/.claude.

### Pitfall 3: Stdin TTY Detection in Subprocess
**What goes wrong:** Upstream installer detects non-interactive terminal (process.stdin.isTTY is false in subprocess) and skips interactive prompts, but then defaults to Claude global install instead of using the passed flags.
**Why it happens:** spawn with stdio: 'inherit' preserves TTY for the subprocess, but only if the parent's stdin is a TTY.
**How to avoid:** Always pass explicit runtime + location flags (--claude --global, --opencode --local, etc.) to the subprocess. With explicit flags, upstream lines 4987-4991 enter the `installAllRuntimes(selectedRuntimes, hasGlobal, false)` path, bypassing all interactive prompts.
**Warning signs:** Install completes but installs to wrong location or wrong runtime because flags weren't passed through.

### Pitfall 4: v2.x .install-meta.json Location
**What goes wrong:** v2.x wrote .install-meta.json at `target/get-stuff-done/.install-meta.json` (inside the get-stuff-done/ subdirectory). v3.0 writes it at the target root. Detection code checks the wrong path.
**Why it happens:** v2.x installer used the fork's get-stuff-done/ directory name; v3.0 uses upstream's get-shit-done/ directory name.
**How to avoid:** Check both paths: `target/get-stuff-done/.install-meta.json` (v2.x) and `target/.install-meta.json` (v3.0 composition meta). Also check `target/get-shit-done/.install-meta.json` for upstream-only installs.
**Warning signs:** v2.x detection always returns false even when v2.x files clearly exist in target.

### Pitfall 5: Supply Chain Context Mismatch
**What goes wrong:** runSupplyChainChecks() expects git diff format (lines starting with +/-), but preview-update provides an npm tarball diff or file comparison.
**Why it happens:** The function was designed for commit-level git diffs, not version-level package diffs.
**How to avoid:** For preview-update, generate a synthetic diff between current pinned version files and latest version files, or limit supply chain checks to file-path-based vectors (execution path, prompt integrity by file name) that don't need diff line content. The author anomaly check is irrelevant for npm packages.
**Warning signs:** Supply chain scan returns empty findings for every version bump.

### Pitfall 6: Incomplete Cleanup on Failed Install
**What goes wrong:** Upstream install partially succeeds (creates some dirs/files) then fails at a later step. Fork overlay copy doesn't run, but partial upstream files remain.
**Why it happens:** Upstream's install() function doesn't wrap everything in a try/catch with rollback.
**How to avoid:** On non-zero exit from upstream subprocess: check if target directory was modified (compare mtime or file count), if so warn user about partial state. Do NOT auto-cleanup partial upstream files -- the user may want to debug.
**Warning signs:** User has a broken installation with upstream files but no overlay files, and re-running install fails because v2.x detection triggers on the partial state.

## Code Examples

Verified patterns from the codebase:

### Subprocess Spawn with stdio inherit
```javascript
// Source: bin/gsd.js (existing launcher, lines 173-195)
const { spawn } = require('child_process');

const child = spawn(process.execPath, [scriptPath, ...args], {
  stdio: 'inherit',
  env: { ...process.env },
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('Script not found');
    process.exit(1);
  }
});

child.on('close', (code) => {
  process.exit(code || 0);
});
```

### Test Isolation with --config-dir
```javascript
// Source: tests/prototype-installer.test.js (Phase 29 validated pattern)
function runUpstreamInstaller(scratchDir, targetDir, extraArgs = []) {
  const installScript = path.join(scratchDir, 'bin', 'install.js');
  const args = ['--claude', '--global', '--config-dir', `"${targetDir}"`, ...extraArgs];
  const result = execSync(`node "${installScript}" ${args.join(' ')}`, {
    encoding: 'utf-8',
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  });
  return { success: true, output: result };
}
```

### Supply Chain Check Invocation
```javascript
// Source: overlay/lib/sync.cjs (lines 670-714)
const findings = runSupplyChainChecks(diff, files, authorString, knownAuthors);
// Returns: Array<{check, severity, triggered, evidence}>
// Checks: prompt-integrity, dependency-diff, execution-path,
//         network-endpoints, obfuscation, author-anomaly
```

### Override Staleness Check
```javascript
// Source: scripts/check-overrides.js (lines 154-213)
const { checkOverrides } = require('../scripts/check-overrides.js');
const result = checkOverrides({ overridesDir, upstreamDir });
// result: { ok, overrides: [{relPath, status, ...}], summary: {total, fresh, stale, ...} }
```

### v2.x .install-meta.json Format (Current v2.4.0)
```json
// Source: get-stuff-done/.install-meta.json (actual v2.x format)
{
  "version": "2.4.0",
  "installType": "link",
  "installedAt": "2026-03-29T11:50:47.200Z",
  "platform": {
    "os": "win32",
    "arch": "x64",
    "shell": "bash",
    "isMingw": true,
    "nodeVersion": "v22.17.1"
  },
  "installMethod": {
    "method": "junction",
    "reason": "default"
  }
}
// Note: NO overlay_version field. version < 3.0. Has "installType" and "installMethod" fields.
```

### v3.0 .install-meta.json Format (From Composition)
```json
// Source: dist/.install-meta.json (actual v3.0 format)
{
  "upstream_version": "1.30.0",
  "overlay_version": "2.4.0",
  "composed_at": "2026-03-29T14:58:50.388Z",
  "features_disabled": [],
  "overrides_applied": [],
  "branding_rules_applied": 11
}
// Note: HAS overlay_version. Has upstream_version. Has composed_at.
```

## State of the Art

| Old Approach (v2.x) | Current Approach (v3.0) | When Changed | Impact |
|----------------------|-------------------------|--------------|--------|
| Direct-edit fork with copy/link installer | Overlay architecture with subprocess delegation | v3.0.0 (Phase 29-35) | Installer is a thin wrapper, not a 2,125-line monolith |
| Cherry-pick sync for 569 commits | Compose pipeline + version pin | v3.0.0 (Phase 30) | Update is `bun update` + `bun run compose` |
| Fork installs its own modified files | Fork delegates to upstream, layers additions on top | v3.0.0 (Phase 33) | Upstream installer does the heavy lifting; fork adds 32 files on top |
| No supply chain scanning for updates | 6-vector supply chain scan on every preview | v3.0.0 (Phase 33) | Security at the foundation, not afterthought |
| get-stuff-done/ directory in install target | get-shit-done/ directory (upstream preserved) | v3.0.0 (Phase 29-30) | Internal paths match upstream; surface branding only |

**Deprecated/outdated:**
- v2.x bin/install.js (2,125 lines): Entire file is superseded by delegation pattern. Will be replaced entirely.
- Copy/link install modes: v2.x had junction/symlink/copy fallback. v3.0 delegates to upstream which handles its own copy mechanism.
- get-stuff-done/ internal directory name: v3.0 preserves upstream's get-shit-done/ internally.

## Open Questions

1. **Overlay file manifest generation**
   - What we know: There are exactly 32 overlay-only files in dist/. This count changes when overlay/ content changes.
   - What's unclear: Should compose.js generate a manifest of overlay-only files that the installer reads, or should the installer compute the diff at install time?
   - Recommendation: Have compose.js write an `.overlay-manifest.json` to dist/ listing overlay-only files. This makes the installer deterministic and avoids expensive file comparison at install time.

2. **Supply chain scanning scope for preview-update**
   - What we know: runSupplyChainChecks() was designed for individual git commit diffs. Preview-update operates on npm version deltas.
   - What's unclear: Can we get a meaningful diff between npm package versions without downloading both tarballs?
   - Recommendation: Use `npm pack get-shit-done-cc@current` and `npm pack get-shit-done-cc@latest` to get tarballs, extract and diff. If too slow, limit to file-list-based checks (execution path, prompt integrity) and skip content-based checks (obfuscation, network endpoints) for the initial implementation.

3. **Package.json files array for v3.0**
   - What we know: Current package.json `files` array still references v2.x structure (bin, commands, get-stuff-done, agents, hooks/dist, scripts, src). v3.0 ships dist/ contents.
   - What's unclear: Should this phase update the files array, or is that Phase 35 migration scope?
   - Recommendation: This is Phase 35 (migration). Phase 33 builds and tests the installer; the npm packaging changes happen at ship time.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test v1.3.5 |
| Config file | None (bun auto-discovers tests/*.test.*) |
| Quick run command | `bun test tests/installer-v3.test.js` |
| Full suite command | `bun test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | Upstream installer subprocess delegation | integration | `bun test tests/installer-v3.test.js -t "delegates to upstream"` | Wave 0 |
| INST-02 | Overlay files copied to target after upstream install | integration | `bun test tests/installer-v3.test.js -t "copies overlay"` | Wave 0 |
| INST-03 | .install-meta.json written with composition metadata | unit | `bun test tests/installer-v3.test.js -t "install-meta"` | Wave 0 |
| INST-04 | --uninstall removes all files from target | integration | `bun test tests/installer-v3.test.js -t "uninstall"` | Wave 0 |
| INST-05 | v2.x detection and cleanup | unit + integration | `bun test tests/installer-v3.test.js -t "v2.x"` | Wave 0 |
| INST-06 | TDD (tests before implementation) | process | N/A (enforced by plan ordering) | N/A |
| UPD-01 | Version diff between pinned and latest | unit | `bun test tests/preview-update.test.js -t "version diff"` | Wave 0 |
| UPD-02 | Supply chain scan during preview | unit | `bun test tests/preview-update.test.js -t "supply chain"` | Wave 0 |
| UPD-03 | Override staleness flagged in preview | unit | `bun test tests/preview-update.test.js -t "stale overrides"` | Wave 0 |
| UPD-04 | Rollback via version pin revert | manual-only | Manual: edit package.json, bun install, bun run compose | N/A (standard npm workflow) |

### Sampling Rate
- **Per task commit:** `bun test tests/installer-v3.test.js tests/preview-update.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/installer-v3.test.js` -- covers INST-01 through INST-06
- [ ] `tests/preview-update.test.js` -- covers UPD-01 through UPD-03
- [ ] No framework install needed (bun:test already available)
- [ ] Test helpers already sufficient (createTempDir, execSync patterns from prototype-installer.test.js)

## Sources

### Primary (HIGH confidence)
- node_modules/get-shit-done-cc/bin/install.js -- upstream installer source (5,008 lines), process.exit() locations, install() function, uninstall() function, getGlobalDir() resolution, writeManifest() format
- dist/bin/install.js -- composed installer with branding (5,008 lines, identical structure to upstream)
- dist/.install-meta.json -- v3.0 composition metadata format
- get-stuff-done/.install-meta.json -- v2.x install metadata format
- tests/prototype-installer.test.js -- Phase 29 validated delegation pattern with --config-dir isolation
- overlay/lib/sync.cjs -- supply chain scanner exports (6 vectors)
- scripts/check-overrides.js -- override staleness detector exports

### Secondary (MEDIUM confidence)
- npm registry query for get-shit-done-cc version (verified: returns 1.30.0)
- Phase 29 research findings on Windows os.homedir() behavior

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are Node.js built-ins or existing fork code; no new dependencies
- Architecture: HIGH - Subprocess delegation validated in Phase 29 prototype with integration tests; target resolution logic is well-documented in upstream source
- Pitfalls: HIGH - Windows os.homedir() pitfall documented from Phase 29 direct experience; v2.x meta format verified from actual installed file

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- upstream installer architecture changes slowly)
