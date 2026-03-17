---
phase: 15-gsd-tools-bundling
verified: 2026-02-20T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 15: gsd-tools.js Bundling Verification Report

**Phase Goal:** Fix gsd-tools.js validation require path that breaks after installer copies to ~/.claude/
**Verified:** 2026-02-20
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | gsd-tools.js resolves all require() calls when installed to ~/.claude/get-stuff-done/bin/ | VERIFIED | dist file is 59,474 bytes; grep on dist returns 0 matches for `../../src/` paths; test 3 (generate-slug from temp dir) passes |
| 2 | require('../../src/validation') no longer produces MODULE_NOT_FOUND post copy-mode install | VERIFIED | grep `require\(['"]\.\.\/\.\.\/src\/` on dist/gsd-tools.js returns no matches; dist regression tests pass from isolated temp dir |
| 3 | Dev-mode (--link) continues to work as before with no regression | VERIFIED | install.js overwrite is in the `else` branch only (copy-mode); link-mode branch is untouched; 445 tests pass with no regressions |
| 4 | All existing tests pass with no regressions | VERIFIED | `bun test` output: 445 pass, 0 fail, 909 expect() calls across 9 files |
| 5 | Hooks bundling continues to work via the renamed unified build script | VERIFIED | scripts/build.js builds all 3 hooks (gsd-check-update.js 2KB, gsd-statusline.js 308KB, pre-compact.js 23KB) + gsd-tools.js 58KB; hooks.test.js beforeAll references scripts/build.js |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/build.js` | Unified esbuild build script for hooks AND gsd-tools.js, min 40 lines, contains HOOKS_TO_BUNDLE | VERIFIED | 113 lines; contains HOOKS_TO_BUNDLE constant; buildHooks() and buildGsdTools() functions; shared ESBUILD_BASE config |
| `get-stuff-done/bin/dist/gsd-tools.js` | Self-contained bundled gsd-tools.js with src/validation inlined | VERIFIED | 59,474 bytes; no `../../src/` require paths; runs correctly from isolated temp dir |
| `tests/gsd-tools.test.js` | Dist regression tests proving MODULE_NOT_FOUND is fixed, contains 'dist' | VERIFIED | 4 dist regression tests in describe block "dist: gsd-tools bundled (regression guard for GAP-1)"; beforeAll auto-build; DIST_TOOLS_PATH constant |

**Additional artifact checks:**
- `scripts/build-hooks.js`: does NOT exist (correctly renamed via git mv, confirmed by scripts/ directory listing showing only build.js and check-parity.js)
- `bin/install.js`: post-copy overwrite at lines 1268-1275 (bundledToolsSrc, installedTools, copyFileSync)
- `package.json`: `"build": "node scripts/build.js"` in scripts; prepublishOnly chain calls `bun run build`; `"get-stuff-done"` in files array
- `.gitignore`: `get-stuff-done/bin/dist/` present under "Build artifacts" comment

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/build.js` | `get-stuff-done/bin/gsd-tools.js` | esbuild.buildSync entryPoints (gsd-tools target) | WIRED | buildGsdTools() function at lines 80-104 calls esbuild.buildSync with src = GSD_BIN_DIR/gsd-tools.js |
| `scripts/build.js` | `hooks/*.js` | esbuild.buildSync entryPoints (hooks targets) | WIRED | HOOKS_TO_BUNDLE array at line 28-32; buildHooks() iterates and calls esbuild.buildSync |
| `bin/install.js` | `get-stuff-done/bin/dist/gsd-tools.js` | fs.copyFileSync post-copy overwrite | WIRED | Lines 1268-1275: bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js'); fs.copyFileSync(bundledToolsSrc, installedTools) |
| `package.json` | `scripts/build.js` | build script in prepublishOnly chain | WIRED | `"build": "node scripts/build.js"` and `"prepublishOnly": "git diff --check HEAD && bun run build && node bin/validate-configs.js"` |

### Requirements Coverage

Not applicable -- phase 15 is a gap-closure phase (GAP-1) without direct REQUIREMENTS.md traceability entries.

### npm Packaging Verification

**Critical check:** `npm pack --dry-run` confirms `get-stuff-done/bin/dist/gsd-tools.js` (59.5KB) IS included in the npm package. When a directory is explicitly listed in the `files` array, npm includes all its contents including gitignored files within it. The `.gitignore` exclusion does not override explicit `files` directory entries.

Initial concern: `get-stuff-done/bin/dist/` is in `.gitignore` but not separately listed in `files` (unlike `hooks/dist/` which IS explicit). Confirmed not a gap: npm pack dry-run output line `59.5kB get-stuff-done/bin/dist/gsd-tools.js` proves the file ships with the package.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -- | -- | -- | No TODOs, FIXMEs, placeholder returns, or empty implementations found |

Scan confirmed:
- `scripts/build.js`: no placeholder code; substantive esbuild calls with real config
- `bin/install.js` change: no TODO at the overwrite logic; condition handles missing dist with a warn (correct graceful degradation)
- `tests/gsd-tools.test.js` dist tests: 4 substantive assertions including isolation simulation

### Human Verification Required

None. All success criteria are verifiable programmatically:
- Dist file existence and size: verified via filesystem
- No `../../src/` paths in bundle: verified via grep
- Module resolution from isolated dir: verified via test suite (bun test passes)
- npm package includes dist: verified via npm pack --dry-run

### Gaps Summary

No gaps found. All 5 truths are verified, all artifacts exist and are substantive, all key links are wired, and the npm packaging includes the dist file.

The one SUMMARY-noted deviation (test 4 asserting "no MODULE_NOT_FOUND" via catch rather than `{valid:...}` in the success path) is actually a stronger assertion: it proves the validation module was loaded regardless of whether the frontmatter command path is recognized.

---

## Commit Verification

| Commit | Description | Verified |
|--------|-------------|---------|
| 92db1ff | feat(15-01): unified build script bundling hooks and gsd-tools.js | Found in git log |
| c2d7e7a | test(15-01): add dist regression tests for bundled gsd-tools.js | Found in git log |

_Verified: 2026-02-20_
_Verifier: Claude (gsd-verifier)_
