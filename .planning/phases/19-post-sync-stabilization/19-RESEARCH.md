# Phase 19: Post-Sync Stabilization - Research

**Researched:** 2026-02-23
**Domain:** esbuild bundling pipeline, copy-mode install mechanics, feature overlap assessment
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-II-03 | Migrate esbuild bundling pipeline to produce self-contained dist files from the new modular gsd-tools structure (copy-mode install must continue to work) | Bug confirmed: install.js creates gsd-tools.js but workflows call gsd-tools.cjs; bundle approach verified working; precise fix identified |
| ASSESS-01 | Evaluate CLAUDE-06 (agent teams orchestration) against upstream's auto-advance pipeline -- determine if full parallel execution is still needed, what scope remains, or if auto-advance is sufficient | Auto-advance (sequential chaining) and agent teams (parallel tasks) serve different purposes; both are now present; CLAUDE-06 scope clarified |
| ASSESS-02 | Evaluate PLAT-07 (interactive diff viewer) and PLAT-08 (multi-upstream support) against upstream's current diff/review workflow -- determine scope and priority | Upstream has no upstream-sync workflow; fork's Stage 3.5 text diff is the current state; assessment scope clarified |
</phase_requirements>

---

## Summary

Phase 19 has three distinct work streams: a concrete code fix (SYNC-II-03), and two assessment reports (ASSESS-01, ASSESS-02).

**SYNC-II-03 is a targeted 3-file fix.** The esbuild bundling pipeline works correctly today — `node scripts/build.js` produces a self-contained `get-stuff-done/bin/dist/gsd-tools.js` that bundles gsd-tools.cjs + all 11 lib/*.cjs modules + src/validation, verified working in isolation. The problem is in install.js: after copying the entire get-stuff-done/ directory (including the source gsd-tools.cjs with broken relative paths), install.js overwrites `bin/gsd-tools.js` (not `bin/gsd-tools.cjs`) with the bundle. Workflows all call `node gsd-tools.cjs`, so they hit the broken source file. The fix: rename the dist output to gsd-tools.cjs and update install.js to overwrite gsd-tools.cjs instead of gsd-tools.js.

**ASSESS-01 requires distinguishing two different concerns.** Upstream's auto-advance pipeline (cherry-picked in Phase 18 Batch 12) handles sequential phase chaining: discuss-phase spawns plan-phase, which spawns execute-phase, which runs transition -- all chained automatically via `--auto` flag and `workflow.auto_advance` config. This is ALREADY in the fork. CLAUDE-06 (agent teams) is about running tasks WITHIN a phase in PARALLEL using the TeamCreate API. These solve different problems. The assessment must document this distinction and recommend whether full TeamCreate API integration is still needed.

**ASSESS-02 is a scope reduction analysis.** Upstream has no upstream-sync workflow (it's fork-only). The fork's Stage 3.5 (security review with full git diff) IS the current diff/review workflow. PLAT-07 (interactive diff viewer) and PLAT-08 (multi-upstream support) are genuine unimplemented features, not things upstream has solved. The assessment should recommend whether the current text-based diff + manual cherry-pick workflow is sufficient, or whether these features have enough value to implement in future phases.

**Primary recommendation:** Fix the install.js copy-mode bug in Plan 19-01. Write ASSESS-01 report in Plan 19-02 (partial redundancy: auto-advance is in, TeamCreate scope remains but lower priority). Write ASSESS-02 report in Plan 19-02 (PLAT-07 is a real gap; PLAT-08 is low priority). Fix platform/detect.js coverage in Plan 19-03 (migrate 17 re-require tests to use exported internals).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| esbuild | ^0.24.0 (devDep) | Bundle gsd-tools.cjs + lib/*.cjs + src/ into single file | Already in use; zero config needed; produces 189KB output in <1s |
| bun:test | 1.3.5 (bun runtime) | Test runner + coverage | Project standard; bunfig.toml configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js built-ins | v20+ | fs, path, child_process | All scripting; no external deps needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bundle approach for copy-mode | Copy src/ to targetDir | Copying src/ adds theme+config+platform+validation (many files) to ~/.claude/; bundles are cleaner and already tested |
| Rename dist output | Keep gsd-tools.js + update install.js installedTools | Same result; renaming dist output to .cjs is more semantically correct |

**Installation:** No new dependencies needed. esbuild already in devDependencies.

---

## Architecture Patterns

### SYNC-II-03: esbuild Bundle Pipeline (Modular Architecture)

**Current state after Phase 18:**
```
get-stuff-done/
  bin/
    gsd-tools.cjs           # Thin router (553 lines), imports lib/*.cjs
    lib/
      core.cjs              # Shared utils; imports '../../../src/validation'
      state.cjs
      phase.cjs
      roadmap.cjs
      verify.cjs
      config.cjs
      template.cjs
      milestone.cjs
      commands.cjs
      init.cjs
      frontmatter.cjs
    dist/
      gsd-tools.js          # Bundle output (189KB, self-contained)
                            # BUG: named .js but workflows call .cjs
scripts/
  build.js                  # esbuild script; bundles gsd-tools.cjs + lib/*.cjs + src/validation
src/
  validation/               # Imported by core.cjs via relative path '../../../src/validation'
  platform/
  theme/
  config/
```

**Copy-mode install path (where the bug lives):**
```
bin/install.js (in copy-mode):
  1. copyWithPathReplacement(src/get-stuff-done, ~/.claude/get-stuff-done)
     → copies gsd-tools.cjs (BROKEN: lib imports resolve to src/ which is absent)
     → copies lib/*.cjs (BROKEN: core.cjs can't find src/validation)
     → copies bin/dist/gsd-tools.js (self-contained, correct)
  2. fs.copyFileSync(src/get-stuff-done/bin/dist/gsd-tools.js,
                    ~/.claude/get-stuff-done/bin/gsd-tools.js)
     → creates gsd-tools.js (WRONG NAME: workflows call gsd-tools.cjs)
```

**After fix (target state):**
```
scripts/build.js:
  outfile: GSD_DIST_DIR + '/gsd-tools.cjs'  (was 'gsd-tools.js')

bin/install.js:
  bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.cjs')
  installedTools = path.join(skillDest, 'bin', 'gsd-tools.cjs')
  (was 'gsd-tools.js' in both places)

tests/gsd-tools.test.js:
  DIST_TOOLS_PATH updated to reference 'dist/gsd-tools.cjs' (was 'dist/gsd-tools.js')
```

### SYNC-II-03: Copy-Mode Install End-to-End Flow

```
npm install @chude/get-stuff-done
node bin/install.js --claude --global
  →  copy get-stuff-done/ to ~/.claude/get-stuff-done/
  →  overwrite ~/.claude/get-stuff-done/bin/gsd-tools.cjs with self-contained bundle
  →  copy hooks/dist/ to ~/.claude/hooks/
  →  hooks run: node ~/.claude/hooks/gsd-statusline.js  (bundled, has src/ inlined)
  →  workflows run: node ~/.claude/get-stuff-done/bin/gsd-tools.cjs  (bundle, works)
```

**Why the bundle is still needed for copy-mode (even with modular architecture):**
- `core.cjs` has `require('../../../src/validation')`
- In copy-mode: `~/.claude/get-stuff-done/bin/lib/core.cjs` → resolves to `~/.claude/src/validation` (DOES NOT EXIST)
- In link-mode: symlink to dev checkout → `src/validation` exists at project root (WORKS)
- In npm install: `node_modules/@chude/.../get-stuff-done/bin/lib/core.cjs` → resolves to `node_modules/@chude/.../src/validation` (WORKS)
- Bundle inlines everything → no path dependency → WORKS everywhere

**Approach comparison entry #13 error:** The statement "gsd-tools.cjs no longer needs bundling (it uses `require('./lib/...')` which resolves relative to its installed location)" was correct for the lib/ resolution but missed the src/validation transitive dependency in core.cjs.

### Coverage Fix: platform/detect.js

**Current state:**
- detect.js has 67.47% line coverage when running all tests together
- Running platform-internal.test.js alone: detect.js gets 96.99% coverage
- Root cause: platform.test.js uses 17 instances of `delete require.cache + re-require`
  which creates separate V8 Scripts — bun 1.3.5 does NOT merge their coverage back

**Fix pattern (already proven in platform-internal.test.js):**
```javascript
// WRONG (creates separate V8 script, coverage not attributed to original module):
delete require.cache[require.resolve('../src/platform/detect')];
const { detectPlatform: dp } = require('../src/platform/detect');
const platform = dp();

// CORRECT (calls exported internal directly, coverage accumulates correctly):
// detect.js already exports: _detectShell, _detectEnvironment, etc.
const { _detectShell } = require('../src/platform/detect');
const restoreP = mockPlatform('win32');
const result = _detectShell();
restoreP();
```

**Migration scope:**
- 17 `delete require.cache` instances in tests/platform.test.js need migration
- Each test that re-requires can be rewritten to call the appropriate _detectX internal
- Remaining uncovered: lines 183-187 (detectGit error catch) — requires mock of child_process execSync at load time (not addressable without re-require); accept this gap if overall coverage reaches 95%

**Expected coverage improvement:**
- detect.js: 67.47% → ~96.99% lines
- Overall lines coverage: 94.00% → ~95%+ (detect.js is ~230 lines out of ~1800 total)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle validation + lib modules | Custom concatenation script | esbuild.buildSync() | esbuild handles require() resolution, tree-shaking, source maps, is already a devDep |
| Path resolution from installed location | Hardcode absolute paths | Bundle (inline everything) | Installed paths vary by OS and install mode; bundles have no runtime path dependencies |
| Coverage attribution in bun | Custom test runner patches | Export internal functions + direct calls | Bun's V8 script-per-require is a runtime constraint; exported internals is the documented fix |

---

## Common Pitfalls

### Pitfall 1: Renaming Dist Output Without Updating Tests
**What goes wrong:** tests/gsd-tools.test.js has `DIST_TOOLS_PATH = '...dist/gsd-tools.js'` -- if you rename the build output to gsd-tools.cjs without updating this constant, 4 regression guard tests fail
**Why it happens:** The test constant and the build output name are coupled but in different files
**How to avoid:** Update DIST_TOOLS_PATH in gsd-tools.test.js at the same time as build.js and install.js
**Warning signs:** `bundled gsd-tools.js exists and is a non-trivial bundle` test fails (file not found)

### Pitfall 2: install.js References bundledToolsSrc Twice
**What goes wrong:** There are TWO places in install.js that reference the gsd-tools bundle:
  1. Line ~1503: `bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js')`
  2. Line ~1504: `installedTools = path.join(skillDest, 'bin', 'gsd-tools.js')`
  Both must be updated from gsd-tools.js to gsd-tools.cjs
**Why it happens:** bundledToolsSrc controls the source file; installedTools controls the destination
**How to avoid:** Update both constants together; grep for 'gsd-tools.js' in install.js to confirm

### Pitfall 3: The dist/ Directory is Also Copied
**What goes wrong:** copyWithPathReplacement copies the ENTIRE bin/ directory including bin/dist/
After fix: `~/.claude/get-stuff-done/bin/dist/gsd-tools.cjs` exists alongside `~/.claude/get-stuff-done/bin/gsd-tools.cjs`
This is harmless (the dist copy is redundant but not breaking) but the test for "gsd-tools bundle not found" warning may fire if the check uses the wrong path
**Why it happens:** The dist subdirectory is part of the recursive copy, then overwritten separately
**How to avoid:** Verify that the bundledToolsSrc path exists BEFORE the overwrite step, not after

### Pitfall 4: platform.test.js Fallback Tests Still Need Re-require
**What goes wrong:** Some tests in platform.test.js use re-require to test different platform configurations that cannot be simulated by env/process.platform mocking alone (e.g., git binary availability via execSync mock). These tests may need the re-require pattern because child_process.execSync is destructured at module load time.
**Why it happens:** `const { execSync } = require('child_process')` in detect.js is bound at load time — mutating childProcess.execSync after the fact doesn't affect the already-bound reference.
**How to avoid:** For the git availability test, accept the re-require pattern (coverage from that code path is attributed to a different V8 script but the test still runs). Focus migration on the 17 tests that mock process.platform/env -- those CAN use the direct internal call pattern.

### Pitfall 5: ASSESS-01 Scope Confusion (Auto-Advance vs Agent Teams)
**What goes wrong:** Conflating upstream's auto-advance (sequential phase chaining) with CLAUDE-06 (parallel task execution within a phase). The assessment could incorrectly conclude auto-advance makes CLAUDE-06 redundant.
**Why it happens:** Both involve "automation" and "less user intervention"
**How to avoid:** Clearly distinguish: auto-advance runs phases IN SEQUENCE; agent teams run tasks IN PARALLEL SIMULTANEOUSLY. A fully automated pipeline could use BOTH: auto-advance chains phases, agent teams parallelize within each phase.

---

## Code Examples

### esbuild Build Script (Current State - Works Correctly)
```javascript
// Source: scripts/build.js
function buildGsdTools() {
  if (!fs.existsSync(GSD_DIST_DIR)) {
    fs.mkdirSync(GSD_DIST_DIR, { recursive: true });
  }

  const src = path.join(GSD_BIN_DIR, 'gsd-tools.cjs');  // entry point
  const dest = path.join(GSD_DIST_DIR, 'gsd-tools.js'); // BUG: should be gsd-tools.cjs

  esbuild.buildSync({
    bundle: true,         // inlines all require()d modules
    platform: 'node',
    target: 'node20',
    entryPoints: [src],
    outfile: dest,
  });
}
```

### install.js Bundle Replacement (Current State - Has Bug)
```javascript
// Source: bin/install.js, ~line 1500
const bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');  // BUG
const installedTools = path.join(skillDest, 'bin', 'gsd-tools.js');  // BUG: should be .cjs
if (fs.existsSync(bundledToolsSrc)) {
  fs.copyFileSync(bundledToolsSrc, installedTools);
} else {
  console.warn(`  ${yellow}!${reset} gsd-tools bundle not found, using source (run: bun run build)`);
}
```

### Correct Pattern After Fix
```javascript
// scripts/build.js
const dest = path.join(GSD_DIST_DIR, 'gsd-tools.cjs');  // renamed output

// bin/install.js
const bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.cjs');
const installedTools = path.join(skillDest, 'bin', 'gsd-tools.cjs');
```

### Coverage Fix Pattern (platform.test.js → direct internal calls)
```javascript
// BEFORE (re-require, breaks bun coverage):
restorePlatform = mockPlatform('win32');
clearPlatformCache();
delete require.cache[require.resolve('../src/platform/detect')];
const { detectPlatform: dp, clearCache: cc } = require('../src/platform/detect');
cc();
const platform = dp();
expect(platform.shell).toBe('pwsh');

// AFTER (direct internal call, coverage correct):
const restoreP = mockPlatform('win32');
const restoreV = saveAndClearShellVars();
process.env.PSModulePath = 'C:\\Program Files\\PowerShell\\Modules';
const result = _detectShell();
expect(result.shell).toBe('pwsh');
restoreV();
restoreP();
```

---

## ASSESS-01: CLAUDE-06 vs Upstream Auto-Advance Pipeline

### What Auto-Advance Does (Already in Fork)
The auto-advance pipeline (cherry-picked in Phase 18 Batch 12, commit 131f24b) handles sequential phase chaining:
- `workflow.auto_advance: true` in `.planning/config.json` enables it
- `--auto` flag passed through discuss → plan → execute → transition
- When a phase completes with no gaps, automatically chains to the next phase
- Replaces the `/gsd:execute-phase` skill call (which breaks in Task subagents) with direct `@file` references

**What it does NOT do:** It does not run multiple plans or tasks simultaneously. One thing at a time, sequentially.

### What CLAUDE-06 Does (Partially Implemented)
CLAUDE-06 = Using the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` API to run tasks IN PARALLEL simultaneously:
- Phase 10: Created 4 team templates + 4 oversight agent definitions
- Phase 17: Added `<teams_integration>` conditional sections to 4 workflows
- Current state: Config-driven routing exists, but no actual TeamCreate API calls are made (the API requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env flag which is experimental)
- The execute-phase workflow already spawns multiple executors via Task tool (which IS parallel within execute-phase); teams would add oversight and native coordination

### Scope Assessment for ASSESS-01 Report
These concerns are **complementary, not competing**:

| Feature | Status | What It Does |
|---------|--------|-------------|
| Auto-advance | DONE (Phase 18 Batch 12) | Sequential phase chaining with no user confirmation |
| Task-based parallelism | DONE (existing execute-phase) | Multiple plans in a wave via Task tool spawning |
| Agent Teams (CLAUDE-06) | PARTIAL (routing wired, API not used) | Native team coordination with oversight agents |

**Recommendation for ASSESS-01 report:** Auto-advance does NOT make CLAUDE-06 redundant. They solve different problems. However, the CLAUDE-06 scope should be narrowed: the team templates + workflow routing (Phase 10 + 17) are sufficient for the current experimental state. Full TeamCreate API activation requires the experimental flag and may not be stable. Recommend: CLAUDE-06 conditional requirement satisfied by what's already in place; no additional Phase 19 work needed; revisit if Claude Code's agent teams API becomes stable and widely supported.

---

## ASSESS-02: PLAT-07 / PLAT-08 vs Current Diff/Review Workflow

### Current Fork Diff/Review Capability (Stage 3.5)
The fork's `get-stuff-done/workflows/upstream-sync.md` Stage 3.5 provides:
```bash
git diff {first_sha}^..{last_sha} --stat   # summary of changes
git diff {first_sha}^..{last_sha}            # full diff text
```
Displayed as a checkpoint for user review before cherry-picks execute. This is plain-text git diff output rendered inline in the Claude Code conversation.

### Upstream's Diff/Review Workflow
Upstream (get-shit-done) does NOT have an upstream-sync workflow. It is a fork-only capability. There is no upstream baseline to compare against for diff/review features.

### PLAT-07 Assessment (Interactive Diff Viewer)
**What it would add:** A syntax-highlighted, navigable diff viewer (terminal-based like `delta`/`diff-so-fancy`, or browser-based like `difit`)
**Current gap:** The text-based Stage 3.5 diff is functional but not visual. Long diffs are hard to review.
**Verdict for report:** NOT redundant (upstream has nothing here). The question is priority vs complexity. Stage 3.5 is sufficient for current usage patterns. PLAT-07 would be a genuine improvement but is low priority given the sync workflow is already functional.

### PLAT-08 Assessment (Multi-Upstream Support)
**What it would add:** Ability to track and sync from multiple upstream sources (e.g., track both glittercowboy/get-shit-done AND a downstream fork)
**Current gap:** The upstream-sync workflow hardcodes `upstream main` as the single source
**Verdict for report:** No current need. The fork tracks exactly one upstream. PLAT-08 would require substantial workflow restructuring. Recommend: out of scope for v0.3.0, revisit if fork governance requires it.

**Recommendation for ASSESS-02 report:** PLAT-07 is a real but low-priority improvement; recommend deferring to v0.4.0 backlog as optional enhancement. PLAT-08 has no current use case; recommend removing from v0.3.0 requirements and adding to "someday/maybe" list.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic gsd-tools.js (5324 lines) | Thin router + 11 lib/*.cjs modules | Phase 18 Batch 12 | Build pipeline must bundle all 12 files instead of 1 |
| Bundle named dist/gsd-tools.js | Bundle should be dist/gsd-tools.cjs | Phase 19 (this phase) | Workflows call gsd-tools.cjs; bundle name must match |
| auto-advance via Skills (`/gsd:execute-phase`) | auto-advance via direct `@file` refs | Phase 18 Batch 12 | Skills don't resolve inside Task subagents |
| re-require tests for platform coverage | Direct internal call tests | Phase 16 discovery | bun 1.3.5 doesn't merge coverage from re-required scripts |

**Active issues:**
- `scripts/build.js` dist output: named gsd-tools.js (should be gsd-tools.cjs)
- `bin/install.js` copy target: gsd-tools.js (should be gsd-tools.cjs)
- `tests/gsd-tools.test.js` DIST_TOOLS_PATH: references gsd-tools.js (must follow rename)
- `tests/platform.test.js`: 17 re-require instances drop detect.js coverage to 67.47%

---

## Open Questions

1. **Should the dist/lib/*.cjs files be excluded from the installed directory?**
   - What we know: after fix, lib/*.cjs files are installed but unused (bundle replaces gsd-tools.cjs)
   - What's unclear: do they add confusion or just wasted disk space?
   - Recommendation: Leave them in place for now. Excluding them requires install.js changes beyond the minimal fix, and they're harmless.

2. **Is 96.99% coverage for detect.js (leaving lines 183-187 uncovered) acceptable?**
   - What we know: lines 183-187 are the `detectGit() error catch` block; testing requires mocking execSync at module load time which needs re-require
   - What's unclear: whether the overall 95% threshold can be met without those 5 lines
   - Recommendation: Accept the gap. The 17 migration tests should bring detect.js to 96.99%, which raises overall lines coverage from 94.00% to ~95%+. Verify with actual run.

3. **Does the approach-comparison.md need a correction for entry #13?**
   - What we know: Entry #13 states "gsd-tools.cjs no longer needs bundling" which is incorrect for copy-mode installs
   - What's unclear: whether to update the historical document or note the correction elsewhere
   - Recommendation: Add a correction note to approach-comparison.md as part of Plan 19-01 (the fix makes the statement accurate after this phase).

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `scripts/build.js`, `bin/install.js`, `get-stuff-done/bin/gsd-tools.cjs`, `get-stuff-done/bin/lib/core.cjs`
- Test verification: `bun test --coverage` output showing 67.47% detect.js, 94.00% overall lines
- Build verification: `node scripts/build.js` + `node get-stuff-done/bin/dist/gsd-tools.js` tested successfully
- Copy-mode simulation: `cp get-stuff-done/bin/dist/gsd-tools.js /tmp/ && node /tmp/gsd-tools.js` returns correct output from isolated directory
- Memory files: `.planning/memory/gsd-phase-researcher.md` (Phase 16 bun coverage finding, Phase 18 module split)
- Approach comparison: `.planning/phases/18-upstream-sync-execution/approach-comparison.md` entry #13

### Secondary (MEDIUM confidence)
- `.planning/phases/18-upstream-sync-execution/18-05-SUMMARY.md`: confirms lines coverage gap deferred to Phase 19
- `.planning/STATE.md`: confirms current blockers (lines 94.00%, detect.js 67.47%)
- Phase 17 summary: confirms agent teams wiring is complete (Phase 10 templates + Phase 17 workflow routing)
- `get-stuff-done/workflows/execute-phase.md`: auto-advance and teams_integration already present

### Tertiary (LOW confidence)
- None (all findings verified directly from codebase)

---

## Metadata

**Confidence breakdown:**
- SYNC-II-03 bug location: HIGH — traced exact code paths in install.js, verified with simulation
- SYNC-II-03 fix approach: HIGH — 3 files, minimal change, clear before/after
- Coverage root cause: HIGH — confirmed by running isolated platform-internal.test.js (96.99%) vs full suite (67.47%)
- Coverage fix approach: HIGH — existing pattern in platform-internal.test.js proves the approach works
- ASSESS-01 scope: HIGH — auto-advance is in the fork (verified in workflows), CLAUDE-06 partial implementation verified
- ASSESS-02 scope: HIGH — upstream has no sync workflow to compare; current fork capability verified

**Research date:** 2026-02-23
**Valid until:** 2026-05-23 (stable codebase; esbuild API won't change)
