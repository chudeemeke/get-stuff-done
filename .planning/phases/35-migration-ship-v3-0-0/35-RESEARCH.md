# Phase 35: Migration & Ship v3.0.0 - Research

**Researched:** 2026-03-30
**Domain:** npm publishing, git tagging, major version migration, package.json configuration
**Confidence:** HIGH

## Summary

Phase 35 ships the overlay architecture as npm v3.0.0. The work is primarily configuration changes (package.json `files` array and `prepublishOnly` script), a git legacy tag, a v2.x cleanup behavior change (interactive prompt to non-interactive auto-clean), and the `aidev release major` + `aidev publish` workflow.

All overlay code is already on main. There is no branch to merge. The v2.4.0 tag already exists at commit `681dab8`. A `v2.4.0-legacy` annotated tag on the same commit provides the rollback reference point. The 72 sync-snapshot-* tags are cleanup candidates (Claude's discretion per CONTEXT.md).

The current `prepublishOnly` script runs `git diff --check HEAD && bun run build && node bin/validate-configs.js`. Per D-04, this must change to `bun run compose` (which produces dist/). The `files` array must change from v2.x entries (assets, bin, commands, get-stuff-done, agents, hooks/dist, scripts, src) to v3.0 entries (dist/, bin/, overlay/branding.json, overlay/features.json). The installer reads `.overlay-manifest.json` from dist/ (not overlay/), so that file ships implicitly within dist/.

**Primary recommendation:** Three sequential waves: (1) package.json changes + v2.x cleanup behavior change, (2) git legacy tag + rollback documentation, (3) aidev release major + aidev publish.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Tag-and-continue pattern. Tag the last pre-overlay commit as `v2.4.0-legacy` (not v0.4.0-legacy -- matches actual published version). All overlay work is already on main. No branch merging or history rewriting. MIG-01 is satisfied by the legacy tag; MIG-02 is satisfied by main already having the overlay structure.
- D-02: Full commit history preserved. No squashing overlay commits -- .planning/ history across 4 milestones is valuable context. Industry standard for architectural migrations (Homebrew, Node.js, Android OEMs all tag-and-continue).
- D-03: Rewrite package.json `files` array to ship: `dist/`, `bin/`, `overlay/branding.json`, `overlay/features.json`, `overlay/.overlay-manifest.json`. Source (overlay/, src/, scripts/, tests/) and planning (.planning/) stay repo-only.
- D-04: Add `"prepublishOnly": "bun run compose"` to package.json scripts. Ensures dist/ is always freshly composed before any publish. Industry standard for build-then-ship packages (Next.js, Vite, esbuild).
- D-05: Warn-then-auto-clean pattern. When installer detects v2.x artifacts (via INST-05 detection logic), print a clear migration banner ("Upgrading from v2.x to v3.0 -- cleaning old files..."), remove v2.x-specific files, then proceed with v3.0 install. Non-interactive. Matches npm 6->7 and Homebrew 2->3 patterns.
- D-06: Rollback documented in README or UPGRADING.md: `bunx @chude/get-stuff-done@2.4.0 --claude --global` installs the legacy version. Simple version pin, no special tooling.
- D-07: Direct release to npm @latest tag. `aidev release major` (tests, version bump to 3.0.0, git tag v3.0.0, push) followed by `aidev publish` (npm publish with OTP). No release candidate cycle -- private fork with single-user audience doesn't benefit from RC staging.
- D-08: Pre-publish validation is CI + prepublishOnly compose. No additional npm pack dry-run step.

### Claude's Discretion
- Exact list of v2.x files to clean up during upgrade (based on what INST-05 already detects)
- README/UPGRADING.md wording and structure
- Whether to clean up old sync-snapshot-* tags as part of migration housekeeping

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-01 | Current main tagged as v0.4.0-legacy before overlay branch merges | Satisfied by v2.4.0-legacy tag on commit 681dab8 (D-01 reinterprets). No branch merge needed -- overlay is already on main. |
| MIG-02 | overlay-architecture branch created with clean overlay structure | Already satisfied -- all overlay work is on main. D-01 confirms tag-and-continue, no separate branch. |
| MIG-03 | .planning/ history preserved across migration | Satisfied by D-02 (no squashing). Verified: .planning/ not in new files array, stays repo-only. |
| MIG-04 | npm package name (@chude/get-stuff-done) and GitHub repo preserved | No changes to package name or repository fields. Version bump only. Verified in current package.json. |
| MIG-05 | Ships as v3.0.0 (semver major for architectural change) | aidev release major bumps 2.4.0 to 3.0.0. aidev publish ships to npm @latest. |
| MIG-06 | Rollback documented: users can install v2.4.0 if v3.0 has issues | UPGRADING.md documents `bunx @chude/get-stuff-done@2.4.0 --claude --global` (D-06). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Git author**: `Chude <chude@emeke.org>` -- all commits
- **No AI attribution**: No "Generated with Claude" or co-author lines
- **No emojis**: In commits, code, or documentation
- **bun over npm**: `bun install`, `bun test`, `bun run compose`
- **aidev release/publish**: Mandatory for all releases
- **TDD**: Tests first, red-green-refactor
- **Coverage**: 95%+ at EACH metric individually
- **Conventional commits**: `type(scope): description`

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| aidev | 4.10.5 | Release and publish workflow | Project standard per tooling-preferences.md |
| bun | 1.3.5 | Package manager, test runner, script runner | Project standard per tooling-preferences.md |
| npm | (registry) | Package registry target | aidev publish delegates to npm registry |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| get-shit-done-cc | 1.30.0 | Upstream devDependency | Already pinned; no changes needed for this phase |

No new dependencies for this phase. All tooling is already installed and operational.

## Architecture Patterns

### Package Contents (v3.0 vs v2.x)

**v2.x files array** (current -- ships source directly):
```json
"files": [
  "assets", "bin", "commands", "get-stuff-done",
  "agents", "hooks/dist", "scripts", "src"
]
```

**v3.0 files array** (target -- ships composed output):
```json
"files": [
  "dist",
  "bin",
  "overlay/branding.json",
  "overlay/features.json"
]
```

Critical notes on D-03:
- `overlay/.overlay-manifest.json` is listed in D-03 but this file does NOT exist in the overlay/ directory. It is generated by compose.js into `dist/.overlay-manifest.json`. The installer reads it from `dist/` (line 33 of install.js: `const MANIFEST_PATH = path.join(DIST_DIR, '.overlay-manifest.json')`). Including `overlay/.overlay-manifest.json` in the files array would be a no-op (file not found, npm silently ignores missing entries). The planner should either: (a) create a placeholder at that path, or (b) drop it from the files array since dist/ already includes it. **Recommendation: drop it -- dist/ ships the generated manifest.**
- `overlay/branding.json` and `overlay/features.json` are NOT used at install time. They are compose-time inputs. Including them in the npm package is for transparency -- users can inspect what branding rules and feature flags are configured.

### npm Always-Included Files
Per [npm docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/), these are always included regardless of `files` array:
- package.json
- README (any case/extension)
- LICENSE (any case/extension)
- CHANGES/CHANGELOG (any case/extension)
- The file in the "main" field (not set in this project)
- The files in the "bin" field

### prepublishOnly Lifecycle

Per [npm lifecycle docs](https://docs.npmjs.com/cli/v11/using-npm/scripts/), `prepublishOnly` runs ONLY on `npm publish` (not `npm install`). This is the correct hook for composing dist/ before publish.

Current prepublishOnly: `git diff --check HEAD && bun run build && node bin/validate-configs.js`
Target prepublishOnly: `bun run compose`

The `build` step (esbuild bundling for hooks) produced v2.x artifacts. In v3.0, compose.js handles everything. The `validate-configs.js` step validates fork config files -- these are already validated during compose. The `git diff --check` step is a whitespace check unrelated to composition.

**Important: bun and prepublishOnly.** Per [Bun docs](https://bun.com/docs/pm/cli/publish), `bun publish` runs prepublishOnly lifecycle scripts. However, `aidev publish` uses `npm publish` (not `bun publish`), so npm's lifecycle handling applies. Both respect prepublishOnly.

### v2.x Cleanup Behavior Change (D-05)

**Current behavior** (bin/install.js lines 185-209): Interactive prompt. If `--force` not set, asks "Remove v2.x installation and proceed? [y/N]". User can decline.

**Target behavior** (D-05): Non-interactive. Print migration banner, auto-clean, proceed. No prompt. Matches how npm 6->7 and Homebrew 2->3 handle upgrades.

The change:
1. Remove the `if (!force)` conditional and the `askConfirmation` call
2. Replace with a migration banner: "Upgrading from v2.x to v3.0 -- cleaning old files..."
3. Auto-proceed with `fs.rmSync` + `fs.mkdirSync`
4. The `askConfirmation` function and `readline` import become unused and can be removed (unless needed elsewhere -- checked: they are not used elsewhere in install.js)

### Git Tagging Strategy

**Existing tags**: v2.4.0 (commit 681dab8), plus 72 sync-snapshot-* tags from v0.2.0-v0.3.0 era.

**Required**: `v2.4.0-legacy` annotated tag on commit 681dab8 (same commit as v2.4.0).

```bash
git tag -a v2.4.0-legacy 681dab8 -m "Legacy tag: last release before overlay architecture (v3.0.0)"
git push origin v2.4.0-legacy
```

**Optional cleanup** (Claude's discretion): The 72 sync-snapshot-* tags were used by the v0.2.0-v0.3.0 upstream cherry-pick sync workflow. In the overlay architecture, sync is handled by version bumping the upstream devDependency. These tags serve no purpose going forward. However, they cost nothing to keep and provide historical traceability of the pre-overlay sync process. **Recommendation: leave them. They are harmless and document project history.**

### Release Workflow

1. `aidev release major` -- runs tests, bumps 2.4.0 to 3.0.0, commits, tags v3.0.0, pushes
2. `aidev publish` -- publishes to npm registry (prompts for OTP)

No `.github/workflows/release.yml` exists, so aidev publish will publish directly without CI monitoring.

The prepublishOnly script (`bun run compose`) will execute during `npm publish` to ensure dist/ is fresh.

### Rollback Documentation

Create UPGRADING.md (or a section in README) documenting:
- What changed in v3.0 (overlay architecture, surface-only branding)
- How to install v3.0: `bunx @chude/get-stuff-done@3.0.0 --claude --global`
- How to rollback: `bunx @chude/get-stuff-done@2.4.0 --claude --global`
- v2.4.0-legacy tag reference for source inspection

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bumping | Manual package.json edit + git tag | `aidev release major` | Handles tests, version, commit, tag, push atomically |
| npm publishing | Manual `npm publish` | `aidev publish` | Handles OTP, CI monitoring (when workflow exists) |
| Composition | Manual file copying | `bun run compose` via prepublishOnly | Already built and tested in Phase 30 |
| v2.x detection | New detection logic | Existing `detectV2()` in install.js | Already covers 3 signals (INST-05) |

## Common Pitfalls

### Pitfall 1: Stale dist/ in npm Package
**What goes wrong:** Publishing without running compose first ships outdated dist/ contents.
**Why it happens:** dist/ is gitignored, so it persists from whenever compose last ran. If code changed since, dist/ is stale.
**How to avoid:** prepublishOnly: "bun run compose" ensures fresh composition on every publish.
**Warning signs:** .install-meta.json timestamp in dist/ is older than latest commit.

### Pitfall 2: overlay/.overlay-manifest.json Does Not Exist
**What goes wrong:** D-03 lists `overlay/.overlay-manifest.json` in the files array, but that path does not exist. The manifest is generated by compose.js into `dist/.overlay-manifest.json`.
**Why it happens:** Confusion between source-time overlay/ files and compose-time dist/ outputs.
**How to avoid:** Either drop the entry from files (dist/ includes it) or create a symlink/copy. Dropping is cleaner.
**Warning signs:** npm pack --dry-run shows fewer files than expected.

### Pitfall 3: install Script Conflict
**What goes wrong:** package.json has `"install": "node bin/install.js"` which runs on `npm install` (consumer side). In v3.0, install.js expects dist/ to exist, but dist/ is gitignored and not in the npm package if files array is wrong.
**Why it happens:** The `install` lifecycle script runs when a consumer does `npm install @chude/get-stuff-done` or `bunx @chude/get-stuff-done`.
**How to avoid:** dist/ IS in the new files array, so it ships. The install script will find it. But verify with `npm pack --dry-run` before publishing.
**Warning signs:** Local `npm install` from package fails because dist/ is missing.

### Pitfall 4: Removing readline Import Breaks Tests
**What goes wrong:** Tests might mock or reference `askConfirmation` or `readline`.
**Why it happens:** D-05 removes the interactive prompt, making readline unused.
**How to avoid:** Check installer-v3.test.js for any tests that exercise the prompt path. Update tests to verify auto-clean behavior instead.
**Warning signs:** Test failures in installer-v3.test.js after removing the prompt.

### Pitfall 5: dependencies vs devDependencies
**What goes wrong:** get-shit-done-cc is a devDependency. In v3.0, composition happens at publish time (prepublishOnly), not install time. Users never need the upstream package directly.
**Why it happens:** Correct architecture -- upstream is a build-time dependency, not a runtime one.
**How to avoid:** Keep it as devDependency. Verify that composed dist/ is self-contained.
**Warning signs:** Consumer install fails trying to resolve upstream imports.

### Pitfall 6: bin Field Points to Correct Files
**What goes wrong:** The `bin` field in package.json maps `get-stuff-done` to `bin/install.js` and `gsd` to `bin/gsd.js`. Both must work after files array change.
**Why it happens:** npm always includes files referenced in `bin` regardless of `files` array.
**How to avoid:** Verify both bin entries work. bin/gsd.js imports from `../overlay/src/` -- but overlay/src/ is NOT in the new files array. This is a PROBLEM.
**Warning signs:** `bunx @chude/get-stuff-done gsd` fails with "Cannot find module '../overlay/src/platform/paths'"

**CRITICAL FINDING**: bin/gsd.js (the launcher) imports from `../overlay/src/platform/paths`, `../overlay/src/platform/terminal`, and `../overlay/src/config/ConfigLoader`. In v3.0, the `files` array does not include `overlay/src/`. The launcher will fail when run from the npm package. Resolution options:
1. Add `overlay/src/` to the files array (ships fork source code -- not ideal per D-03)
2. Make the launcher import from `../dist/src/` instead (dist/ ships the composed versions of these modules)
3. Bundle the launcher with its dependencies at compose time

**Recommendation:** Option 2 -- change bin/gsd.js imports to reference `../dist/src/` paths. These are the composed versions of the same modules, already in dist/. This keeps the files array clean per D-03.

## Code Examples

### Package.json Changes
```json
{
  "files": [
    "dist",
    "bin",
    "overlay/branding.json",
    "overlay/features.json"
  ],
  "scripts": {
    "install": "node bin/install.js",
    "build": "node scripts/build.js",
    "compose": "node scripts/compose.js",
    "prepublishOnly": "bun run compose",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:upstream": "node --test tests/*.test.cjs",
    "preview-update": "node scripts/preview-update.js"
  }
}
```

### v2.x Auto-Clean (D-05)
```javascript
// Replace lines 185-209 in bin/install.js
async function cleanupV2(targetDir, detection) {
  const version = detection.version || 'unknown';
  const signal = detection.signal;

  console.log(`\n${yellow}Upgrading from v2.x to v3.0 -- cleaning old files...${reset}`);
  console.log(`  Signal: ${signal}`);
  if (version !== 'unknown') console.log(`  Previous version: ${version}`);
  console.log(`  Location: ${targetDir}`);
  console.log(`  User config (~/.gsd/) and project data (.planning/) are not affected.`);

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`  ${green}v2.x files removed. Proceeding with v3.0 install.${reset}\n`);
  return true; // Always proceeds
}
```

### Legacy Tag
```bash
git tag -a v2.4.0-legacy 681dab8 -m "Legacy tag: last release before overlay architecture (v3.0.0)"
git push origin v2.4.0-legacy
```

### UPGRADING.md Template
```markdown
# Upgrading to v3.0.0

## What Changed

v3.0 replaces the direct-edit fork with an overlay architecture.
Upstream (get-shit-done-cc) is now consumed as a build-time dependency
and composed into a self-contained dist/ at publish time.

All fork-specific additions (platform detection, theming, validation,
sync tools, hooks) continue to work identically.

## Install

bunx @chude/get-stuff-done@3.0.0 --claude --global

If you have a v2.x installation, the installer automatically detects
and cleans up old files before proceeding.

## Rollback

bunx @chude/get-stuff-done@2.4.0 --claude --global

The v2.4.0 release remains available on npm. The v2.4.0-legacy git
tag marks the last commit before the overlay architecture.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Source in npm package | Composed dist/ in npm package | v3.0.0 | 225 files -> ~50 files shipped |
| Interactive v2.x cleanup prompt | Non-interactive auto-clean | v3.0.0 | Matches npm/Homebrew major upgrade patterns |
| Manual compose before publish | prepublishOnly auto-compose | v3.0.0 | Cannot forget to compose |

## Open Questions

1. **bin/gsd.js imports from overlay/src/ which won't ship**
   - What we know: gsd.js imports paths, terminal, and ConfigLoader from `../overlay/src/`
   - What's unclear: Whether to change imports to `../dist/src/` or add overlay/src/ to files
   - Recommendation: Change imports to `../dist/src/` -- these are the composed versions of the same modules, and dist/ already ships. Test that the launcher works from a `npm pack` extracted tarball.

2. **bin/install.js references DIST_DIR as `path.join(__dirname, '..', 'dist')`**
   - What we know: When installed via npm, `__dirname` is inside the npm package. dist/ ships as part of the package (in the new files array), so `../dist` resolves correctly.
   - What's unclear: Nothing -- this should work. Verify with npm pack.
   - Recommendation: Verify with `npm pack && tar xzf *.tgz && node package/bin/install.js --help`

3. **Current `install` script in package.json**
   - What we know: `"install": "node bin/install.js"` runs when consumers do `npm install @chude/get-stuff-done`. This is the correct behavior -- it triggers the installer.
   - What's unclear: Whether `bun install` (for development) also triggers this, potentially running the installer during dev setup.
   - Recommendation: Test `bun install` in the project root to confirm the install script does not trigger during development (it should not -- npm/bun only run the `install` script for dependencies, not the project itself).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (bun 1.3.5) |
| Config file | none (bun defaults) |
| Quick run command | `bun test tests/installer-v3.test.js` |
| Full suite command | `bun test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | Legacy tag created on correct commit | manual | `git show v2.4.0-legacy --format="%H" --no-patch` | N/A (git operation, not code) |
| MIG-02 | Overlay structure on main | manual | `ls dist/ overlay/ bin/` | N/A (already true) |
| MIG-03 | .planning/ history preserved | manual | `git log --oneline .planning/ \| wc -l` | N/A (git operation) |
| MIG-04 | Package name preserved | unit | `bun test tests/installer-v3.test.js` | Existing |
| MIG-05 | Ships as v3.0.0 | smoke | `npm pack --dry-run 2>&1 \| head -5` | Wave 0: npm-pack validation script |
| MIG-06 | Rollback documented | manual | Visual inspection of UPGRADING.md | N/A (documentation) |

### Sampling Rate
- **Per task commit:** `bun test tests/installer-v3.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green + npm pack --dry-run verification before aidev release

### Wave 0 Gaps
- [ ] Update installer-v3.test.js to test auto-clean (non-interactive) behavior instead of prompt-based behavior
- [ ] Add npm pack smoke test (verify files array produces correct tarball contents)
- [ ] Update launcher test if gsd.js imports change

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | Test runner, script runner | Yes | 1.3.5 | -- |
| aidev | Release and publish | Yes | 4.10.5 | -- |
| npm | Registry queries, pack verification | Yes | (system) | -- |
| git | Tagging, history | Yes | (system) | -- |
| node | Installer execution | Yes | v22.17.1 | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: bin/install.js, package.json, scripts/compose.js, .github/workflows/ci.yml
- Git tag listing and commit history: `git tag --list`, `git log`, `git show v2.4.0`
- npm registry: `npm view @chude/get-stuff-done version` and `dist-tags`
- [npm docs: package.json files field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [npm docs: lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/)

### Secondary (MEDIUM confidence)
- [Bun publish lifecycle docs](https://bun.com/docs/pm/cli/publish)
- Phase 33 installer architecture (CONTEXT.md canonical refs)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; aidev, bun, npm all verified available and working
- Architecture: HIGH -- all changes are to existing configuration files; compose pipeline already tested
- Pitfalls: HIGH -- critical finding about bin/gsd.js imports verified by direct code inspection
- v2.x cleanup: HIGH -- current behavior examined line-by-line; change is straightforward

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable domain -- npm packaging, git tagging)
