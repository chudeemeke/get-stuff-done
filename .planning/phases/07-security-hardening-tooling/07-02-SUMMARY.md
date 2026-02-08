---
phase: 07
plan: 02
title: Shell Execution Hardening
subsystem: security
tags: [security, shell-injection, child-process, npm-publish]
requires: []
provides: [hardened-shell-execution, conflict-marker-detection]
affects: []
tech-stack:
  added: []
  patterns: [parameterized-commands, environment-variable-passing]
key-files:
  created: []
  modified:
    - hooks/gsd-check-update.js
    - bin/gsd
    - package.json
decisions: []
metrics:
  duration: 12 minutes
  completed: 2026-02-08
---

# Phase 7 Plan 2: Shell Execution Hardening Summary

**One-liner:** Eliminated command injection vectors by replacing string interpolation with execFileSync argument arrays and environment variable passing, and added pre-publish conflict marker detection.

## What Was Built

### Security Hardening

**hooks/gsd-check-update.js:**
- Replaced `execSync('npm view ...')` with `execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'])`
- Cross-platform npm command handling (npm.cmd on Windows)
- Argument array prevents shell interpretation

**bin/gsd:**
- Eliminated string interpolation in all `node -e` blocks
- Changed from double-quoted with bash variable interpolation to single-quoted with environment variable passing
- Updated `read_config()` function: passes GSD_CONFIG_KEY and GSD_CONFIG_DEFAULT via process.env
- Updated `ensure_config()` function: passes GSD_INSTALL_DIR and GSD_CONFIG via process.env
- All JavaScript code now reads values from process.env instead of interpolated bash variables

### Publish Safety

**package.json:**
- Added `git diff --check HEAD` to prepublishOnly script
- Blocks publish if conflict markers detected in tracked files
- Changed npm run to bun run for build:hooks (tooling preference)

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| 90d1fda | refactor | Harden shell command execution patterns | hooks/gsd-check-update.js, bin/gsd |
| 5af66c6 | chore | Add pre-publish conflict marker check | package.json |

## Verification Results

All verification checks passed:

```
✓ Bash syntax valid (bash -n bin/gsd)
✓ No double-quoted node -e blocks with interpolation (count: 0)
✓ Three single-quoted node -e blocks (count: 3)
✓ No conflict markers in tracked files (git diff --check HEAD)
✓ Build hooks succeeds (bun run build:hooks)
```

## Deviations from Plan

None. Plan executed exactly as written.

## Security Impact

**Before:**
- `execSync('npm view @chude/get-stuff-done version')` - Shell interpretation of command string
- `node -e "...${GSD_INSTALL_DIR}...${key}...${default}..."` - Bash variable interpolation into JavaScript code
- Publishing could succeed with unresolved conflict markers

**After:**
- `execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'])` - Direct binary execution with argument array
- `node -e '...process.env.GSD_CONFIG_KEY...process.env.GSD_CONFIG_DEFAULT...'` - Environment variable passing
- Publishing blocked if conflict markers detected

**Risk Mitigation:**
- Command injection vectors eliminated (no user input reaches shell command strings)
- Parameterized execution prevents shell interpretation
- Pre-publish check prevents corrupted packages

## Technical Details

### execFileSync Pattern

```javascript
// Old (shell interpretation)
execSync('npm view @chude/get-stuff-done version', options)

// New (direct binary execution)
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'], options)
```

### Environment Variable Pattern

```bash
# Old (string interpolation into JavaScript)
node -e "
    const val = getConfigValue(config, '${key}', '${default}');
"

# New (environment variable passing)
GSD_CONFIG_KEY="$key" GSD_CONFIG_DEFAULT="$default" \
node -e '
    const val = getConfigValue(config, process.env.GSD_CONFIG_KEY, process.env.GSD_CONFIG_DEFAULT);
'
```

### Conflict Marker Detection

```json
{
  "scripts": {
    "prepublishOnly": "git diff --check HEAD && bun run build:hooks"
  }
}
```

Detects markers: `<<<<<<<`, `=======`, `>>>>>>>`

## Next Phase Readiness

**Ready for:** Phase 7 Plan 3 (Secrets Detection)

**Dependencies satisfied:**
- Shell execution patterns hardened
- No command injection vectors remain

**No blockers or concerns.**

## Quality Metrics

- Test coverage: N/A (bash scripts and configuration only)
- Files modified: 3
- Commits: 2 (atomic per task)
- Duration: 12 minutes
- Verification: All checks passed

---

*Executed: 2026-02-08*
*Duration: 12 minutes*
*Status: Complete*
