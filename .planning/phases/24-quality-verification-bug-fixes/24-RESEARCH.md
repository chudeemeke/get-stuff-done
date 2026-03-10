# Phase 24: Quality Verification & Bug Fixes - Research

**Researched:** 2026-03-10
**Domain:** UAT verification, bug fixes, test coverage expansion
**Confidence:** HIGH

## Summary

Phase 24 is a quality-first phase that verifies three previously-shipped phases (6, 21, 22) actually work as specified, fixes one confirmed ReferenceError bug in the installer, and adds test coverage for four lib modules that have been omitted from the test suite since the Phase 18 modular architecture adoption.

The verification work (QUAL-01 through QUAL-03) has a critical asymmetry: the gsd-verifier reports for Phases 6, 21, and 22 all passed with full scores. However, each verification report deferred multiple "Human Verification Required" items -- end-to-end flows, visual rendering, timing-dependent behavior, and AI output quality. Phase 24 UAT closes those open items. This is not a re-verification of what was already automated-checked; it is the first time anyone actually runs these features with real data.

The bug fix (QUAL-04) is a one-line missing definition: `claudeToGeminiTools` is referenced at line 610 of `bin/install.js` inside `convertGeminiToolName()` but was never declared. The upstream has the correct 10-entry mapping object. This causes a ReferenceError on any Gemini installation attempt. It was introduced when the Gemini conversion functions were cherry-picked without the constant definition that precedes them.

The test coverage work (QUAL-05) requires a codebase audit to discover all gaps, then targeted test files for `config.cjs`, `frontmatter.cjs`, `template.cjs`, and `core.cjs` -- four of the 12 lib modules from the Phase 18 modular split that currently have zero test files. These modules total 1,121 lines of production code with no coverage.

**Primary recommendation:** Execute Phase 24 in four focused plans -- one per QUAL group -- in order: QUAL-04 (fast bug fix, unblocks Gemini testing), QUAL-01 (logo UAT, mostly human visual checks), QUAL-02+03 (sync feature UAT, runtime integration), QUAL-05 (audit + test coverage).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | Retroactive UAT for Phase 6 (Logo Assets) -- verify SVG/PNG assets render correctly, installer deploys them | Phase 6 VERIFICATION.md shows 18/18 artifacts exist and 5/5 LOGO requirements satisfied. Human visual checks (isometric rendering, text readability, color contrast, small-size clarity, social preview) were deferred. The "installer deploys them" criterion requires investigating whether assets/ should be added to package.json `files` array and whether the installer copies assets/ to the target directory. Currently neither is true. |
| QUAL-02 | Retroactive UAT for Phase 21 (Sync Intelligence) -- verify commit classification, supply chain scanning, severity-aware statusline | Phase 21 VERIFICATION.md passed 3/3 truths with 101 sync tests + 40 hook tests. Deferred human checks: (1) end-to-end maintainer notification with real upstream remote + config, (2) supply chain risk badge visual inspection, (3) 4-hour TTL timing test. These require actual git upstream remotes, real config files, and terminal ANSI output inspection. |
| QUAL-03 | Retroactive UAT for Phase 22 (Advanced Sync Automation) -- verify selective sync filtering, dependency detection, AI conflict resolution | Phase 22 VERIFICATION.md passed 3/3 truths with 126 sync tests. Deferred human checks: (1) end-to-end selective sync with real upstream commits, (2) AI conflict resolution quality with real conflict, (3) dependency auto-include with cross-boundary deps, (4) backward compatibility without filter flags. These require the real upstream repository (v1.20.6 through v1.22.4 commits) and actually running /gsd:upstream. |
| QUAL-04 | Fix claudeToGeminiTools ReferenceError in install.js:610 -- variable referenced but never defined | Confirmed: `claudeToGeminiTools` is referenced on lines 610-611 of bin/install.js inside `convertGeminiToolName()` but is never declared anywhere in the file. The upstream (upstream/main:bin/install.js lines 369-379) has the correct definition: a 10-entry object mapping Claude tool names to Gemini snake_case equivalents. The fix is to add this const definition between `claudeToOpencodeTools` (line 573) and `convertGeminiToolName` (line 600). |
| QUAL-05 | Add test coverage for 4 untested lib modules (config.cjs, frontmatter.cjs, template.cjs, core.cjs) | Confirmed: none of the four modules appears in bun coverage output because no test file imports them (except phase.test.cjs importing comparePhaseNum/normalizePhaseName from core.cjs). Total untested production code: config.cjs (162 lines, 3 exported functions), frontmatter.cjs (299 lines), template.cjs (222 lines), core.cjs (438 lines, partially covered). A codebase audit runs first to discover additional gaps before writing tests. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun:test | 1.3.5 | Test framework for new test files | Already used for all .test.cjs files in the project |
| node:assert | built-in | Assertions in .cjs test files | Pattern established in existing lib test files (phase.test.cjs, sync.test.cjs) |
| node:fs | built-in | Temp directory creation, file I/O in tests | Standard for test isolation in this project |
| node:os | built-in | tmpdir() for temp test directories | Used throughout the test suite for isolation |
| node:path | built-in | Path construction | Universal in project |
| node:child_process | built-in | Process spawning in integration tests | Used in hooks.test.js and installer.test.js |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tests/helpers.cjs | project | createTempDir(), mockEnv(), mockPlatform() | Whenever tests need temp dirs or environment isolation |
| tests/helpers/mock-fs.js | project | File system mocking | When testing code that writes to real disk paths |
| tests/helpers/mock-process.js | project | process.platform/env mocking | When testing platform-specific branches |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bun:test (.cjs files) | vitest | bun:test is already used for all lib tests; consistency matters more than vitest features |
| node:assert | expect() from bun:test | .cjs files use node:assert; this is the established pattern for lib test files |

**Installation:**
```bash
# No new dependencies needed -- all tooling already present
```

## Architecture Patterns

### Recommended Project Structure

Phase 24 creates the following new files:

```
tests/
├── config.test.cjs          # Tests for get-stuff-done/bin/lib/config.cjs
├── frontmatter.test.cjs     # Tests for get-stuff-done/bin/lib/frontmatter.cjs
├── template.test.cjs        # Tests for get-stuff-done/bin/lib/template.cjs
└── core.test.cjs            # Tests for get-stuff-done/bin/lib/core.cjs (full coverage)

bin/
└── install.js               # Add claudeToGeminiTools const definition (1 block)
```

### Pattern 1: Lib Module Test File Structure

**What:** Each lib module test file follows the pattern established in phase.test.cjs and sync.test.cjs
**When to use:** All four new test files

```javascript
// tests/config.test.cjs
'use strict';

const { test, describe, beforeEach, afterEach } = require('bun:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Import the module under test using the project-relative path
const { cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet } = require('../get-stuff-done/bin/lib/config.cjs');

describe('cmdConfigEnsureSection', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates .planning/config.json when it does not exist', () => {
    cmdConfigEnsureSection(tmpDir, false);
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'config.json')));
  });
  // ... more tests
});
```

**Key conventions:**
- File extension: `.test.cjs` (matches the lib module extension pattern)
- Import path: `../get-stuff-done/bin/lib/XXXX.cjs` (relative from tests/)
- Use `node:assert/strict` not `expect()` -- matches phase.test.cjs pattern
- Each function gets its own `describe()` block
- Each test creates a fresh tmpDir (no shared state)

### Pattern 2: claudeToGeminiTools Fix

**What:** Add the missing const definition in install.js
**When to use:** QUAL-04 only

The fix is a single insertion between the existing `claudeToOpencodeTools` const (ends at line 573) and the `convertGeminiToolName` function (starts at line 593). Insert:

```javascript
// Tool name mapping from Claude Code to Gemini CLI
// Gemini CLI uses snake_case built-in tool names
const claudeToGeminiTools = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'replace',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  WebSearch: 'google_web_search',
  WebFetch: 'web_fetch',
  TodoWrite: 'write_todos',
  AskUserQuestion: 'ask_user',
};
```

Source: `upstream/main:bin/install.js` lines 369-379 (verified exact content via git show).

### Pattern 3: UAT Verification Steps

**What:** QUAL-01/02/03 involve running actual features against real data
**When to use:** UAT plans

For Phase 21 UAT (QUAL-02), the executor needs to:
1. Set `gsd.role: maintainer` in `~/.gsd/config.json`
2. Create a test git repo with an upstream remote containing fix/feat commits
3. Run `node hooks/gsd-check-update.js` and inspect `~/.claude/cache/gsd-update-check.json`
4. Run the statusline and observe the output format
5. Run `node get-stuff-done/bin/gsd-tools.cjs sync-preview <range>` and observe supply chain badges

For Phase 22 UAT (QUAL-03), the executor needs to:
1. Run `/gsd:upstream --category feat,fix` against actual upstream with new commits
2. Optionally trigger a cherry-pick conflict to test AI resolution
3. Run `/gsd:upstream` without flags to verify backward compatibility

For Phase 6 UAT (QUAL-01), the executor needs to:
1. Open SVG files in a browser and visually inspect each success criterion
2. Determine if assets/ should be added to package.json `files` and installer

### Anti-Patterns to Avoid

- **Re-running gsd-verifier**: The automated verifier already passed all three phases. Phase 24 UAT is the human-driven checks that were deferred. Do not spawn the verifier again for the same automated checks.
- **Skipping the codebase audit for QUAL-05**: The requirement says "audit findings addressed." The audit must run first to discover what gaps exist beyond the 4 known modules. Do not assume the 4 modules are the complete scope.
- **Over-scoping the QUAL-05 tests**: The requirement is test coverage for 4 lib modules. Don't expand into testing the router (gsd-tools.cjs integration tests) -- those exist already.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp dir cleanup | Custom cleanup functions | `fs.rmSync(tmpDir, { recursive: true, force: true })` in afterEach | Already the pattern in all test files |
| Git repo for hook tests | Manual git init sequences | `createGitRepoWithUpstream(n)` helper from tests/helpers.cjs | Already exists; tested in hooks.test.js |
| Gemini tool mapping | Derive from upstream source | Copy exact claudeToGeminiTools object from upstream/main | Upstream already has the correct mapping; copying ensures no drift |

**Key insight:** This phase is primarily about running existing features correctly and testing existing code. The anti-pattern is building new infrastructure when existing patterns suffice.

## Common Pitfalls

### Pitfall 1: QUAL-01 "Installer Deploys Them" Scope Creep

**What goes wrong:** The executor interprets "installer deploys them" as a requirement to implement installer asset deployment, then adds assets/ to package.json and modifies install.js.
**Why it happens:** The QUAL-01 criterion says "verify ... installer deploys them" but the current installer does not deploy assets/.
**How to avoid:** The UAT task should first verify whether installer deployment is intentional (assets/ is documentation-only, not runtime-needed) or a gap. Only implement if the audit determines it's a required gap. The Phase 6 verification report did not flag this as a failure, so "installer deploys them" may have been satisfied by the fact that the npm package's `files` array includes the parent dirs.
**Warning signs:** If the plan creates an installer modification task without first determining the gap exists, it's over-scoping.

### Pitfall 2: QUAL-04 Only Fixes the Symbol, Not the Tests

**What goes wrong:** The bug is fixed (const added) but no test verifies `node install.js --gemini` runs without crashing. The fix is unvalidated.
**Why it happens:** Easy to declare a one-liner fix done without adding a regression test.
**How to avoid:** Add an installer test that runs `node install.js --gemini --global` with a mock home dir and verifies it completes without an error containing "ReferenceError".

### Pitfall 3: QUAL-05 Coverage Target Ambiguity

**What goes wrong:** The executor achieves "good" coverage on the 4 modules without hitting 95%+ on each metric individually.
**Why it happens:** 95% overall is easier than 95% on each metric; branches are hardest to cover.
**How to avoid:** Each new test file must hit 95%+ statements, branches, functions, and lines individually. Known hard branches (error paths) may require explicit test cases that mock fs.writeFileSync to throw.

### Pitfall 4: core.cjs output() Large Payload Branch

**What goes wrong:** `output()` in core.cjs has a branch for `json.length > 50000` that writes to a tmpfile. This branch is nearly impossible to trigger with normal test data.
**Why it happens:** The branch requires a 50KB+ JSON payload.
**How to avoid:** Accept the ~3% branch gap for this specific path, or create a test with a deliberately large object. Document the accepted gap in the test file.

### Pitfall 5: QUAL-02/03 UAT Requires Real Upstream State

**What goes wrong:** Executor tries to run QUAL-02/03 UAT against local-only git repos without actual upstream commits, producing meaningless results.
**Why it happens:** Real upstream (v1.20.6-v1.22.4 range) may not have the right commit topology.
**How to avoid:** The UAT for Phase 21 uses `createGitRepoWithUpstream(n)` helper to create local repos with synthetic upstream commits -- this is the correct approach (tests already use it). For Phase 22, running `/gsd:upstream` against the actual upstream/main is preferred but requires the real remote.

## Code Examples

Verified patterns from the actual codebase:

### Lib Module Test File Import Pattern
```javascript
// Source: tests/phase.test.cjs lines 1110
const { comparePhaseNum, normalizePhaseName } = require('../get-stuff-done/bin/lib/core.cjs');
```

### Temp Directory Pattern (from existing tests)
```javascript
// Source: tests/hooks.test.js
let tempHome;
beforeEach(() => {
  tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-home-'));
  fs.mkdirSync(path.join(tempHome, '.claude', 'cache'), { recursive: true });
});
afterEach(() => {
  fs.rmSync(tempHome, { recursive: true, force: true });
});
```

### upstream claudeToGeminiTools Definition (fix target)
```javascript
// Source: git show upstream/main:bin/install.js lines 369-379
const claudeToGeminiTools = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'replace',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  WebSearch: 'google_web_search',
  WebFetch: 'web_fetch',
  TodoWrite: 'write_todos',
  AskUserQuestion: 'ask_user',
};
```

### config.cjs test scaffold
```javascript
// Source: analysis of get-stuff-done/bin/lib/config.cjs
const { cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet } = require('../get-stuff-done/bin/lib/config.cjs');

describe('cmdConfigEnsureSection', () => {
  test('creates config.json with defaults when none exists', () => { /* ... */ });
  test('does nothing when config.json already exists', () => { /* ... */ });
  test('outputs created:true on stdout when creating', () => { /* ... */ });
  test('picks up user defaults from ~/.gsd/defaults.json when available', () => { /* ... */ });
  test('detects brave search key availability', () => { /* ... */ });
});
describe('cmdConfigSet', () => {
  test('sets a top-level key', () => { /* ... */ });
  test('sets a nested key using dot notation', () => { /* ... */ });
  test('parses boolean values (true/false)', () => { /* ... */ });
  test('parses numeric values', () => { /* ... */ });
  test('errors when no key path provided', () => { /* ... */ });
});
describe('cmdConfigGet', () => {
  test('retrieves a top-level key', () => { /* ... */ });
  test('retrieves a nested key using dot notation', () => { /* ... */ });
  test('errors when key not found', () => { /* ... */ });
  test('errors when config.json does not exist', () => { /* ... */ });
});
```

### frontmatter.cjs key functions to test
```javascript
// Source: analysis of get-stuff-done/bin/lib/frontmatter.cjs
// Key exports: extractFrontmatter, reconstructFrontmatter, cmdFrontmatterGet,
//              cmdFrontmatterSet, cmdFrontmatterAppend, cmdFrontmatterRequire
// The parsing engine handles: inline arrays, multi-line arrays, nested objects,
// key-value pairs, bare values, and YAML-like structure
```

### core.cjs untested functions to cover
```javascript
// Source: analysis of get-stuff-done/bin/lib/core.cjs
// Currently tested: comparePhaseNum, normalizePhaseName (in phase.test.cjs)
// Untested: output(), error(), safeReadFile(), requireValid(),
//           findPhaseInternal(), generateSlugInternal(), resolveModelAlias(),
//           execGit() (Windows-safe spawnSync wrapper), cmdModelProfile()
// Note: MODEL_PROFILES table (lines 32-44) is data, not logic --
//       testing resolveModelAlias() exercises the table
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual verification only | Automated gsd-verifier + deferred human checks | Phase 16+ | Phase 24 closes the human-deferred items |
| Single monolithic gsd-tools.js | 12 CJS lib modules | Phase 18 | Config.cjs, frontmatter.cjs, template.cjs, core.cjs have never had dedicated test files |
| No Gemini support | Multi-runtime (Claude + OpenCode + Gemini) | Phase 18 cherry-picks | claudeToGeminiTools bug was introduced in this migration |

**Deprecated/outdated:**
- The Phase 6 verification "Human Verification Required" section describes checks that are now Phase 24's responsibility to run.

## Open Questions

1. **Does "installer deploys assets" mean the npm package should include assets/ in the `files` array?**
   - What we know: assets/ is not in package.json `files`. The installer does not copy assets/. Phase 6 VERIFICATION.md passed without flagging this.
   - What's unclear: Whether the Phase 24 success criterion ("installer deploys them to target directory") means this is a REQUIRED gap or whether Phase 6 correctly scoped assets as repo-only content.
   - Recommendation: The UAT plan should explicitly check this. If the assets are not needed at runtime (they're PNG/SVG brand assets, not operational files), the criterion may mean "the npm package's files array includes assets/" rather than "the installer copies them to ~/.claude". Needs user clarification or a conservative "verify and document" approach.

2. **What does the codebase audit for QUAL-05 add beyond the 4 known modules?**
   - What we know: The REQUIREMENTS.md says "(specific items determined by audit results)". The 4 modules are explicitly called out.
   - What's unclear: Whether the audit will find more gaps (e.g., installer.test.js has no Gemini path tests).
   - Recommendation: Run audit first, report findings, then scope the test-writing work accordingly. Don't pre-commit to fixing everything the audit finds -- Phase 24 may only address the 4 lib modules if the audit scope is large.

3. **Are the 3 failing tests in the full bun test run pre-existing or new?**
   - What we know: The Phase 23 verification noted "6 timeout failures (pre-existing Windows spawn tests)." The last full coverage run showed 822 pass / 3 fail. Phase 23 VERIFICATION.md noted these are pre-existing.
   - What's unclear: Whether these are hooks.test.js spawn tests (timing-sensitive) that variably pass/fail.
   - Recommendation: Document the pre-existing failures in the phase plan. Phase 24 is not responsible for fixing Windows spawn timing tests unless QUAL-05 covers them.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | bun:test v1.3.5 |
| Config file | bunfig.toml (timeout: 10000ms at suite level, individual tests use {timeout: N}) |
| Quick run command | `bun test tests/config.test.cjs tests/frontmatter.test.cjs tests/template.test.cjs tests/core.test.cjs` |
| Full suite command | `bun test --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | SVG files contain substantive paths and correct colors | automated | Already verified by Phase 6 gsd-verifier | Done |
| QUAL-01 | PNG files exist at all required sizes | automated | Already verified by Phase 6 gsd-verifier | Done |
| QUAL-01 | Visual rendering is correct (isometric, text, colors) | manual-only | Human visual inspection in browser | Deferred |
| QUAL-01 | installer/package.json includes assets/ | automated | `node -e "const p=require('./package.json'); console.log(p.files.includes('assets'))"` | Done (currently false -- needs decision) |
| QUAL-02 | classifyCommit() categorizes fix/feat/refactor/docs/chore | automated | `bun test tests/sync.test.cjs --grep classifyCommit` | Done (101 sync tests) |
| QUAL-02 | runSupplyChainChecks() detects 6 attack vectors | automated | `bun test tests/sync.test.cjs --grep supply` | Done |
| QUAL-02 | Statusline shows "N commits upstream (severity)" format | automated | `bun test tests/hooks.test.js --grep maintainer` | Done (7 tests) |
| QUAL-02 | End-to-end maintainer flow with real upstream | manual-only | Set gsd.role maintainer + real upstream remote | Deferred |
| QUAL-02 | Supply chain badge ANSI colors in terminal | manual-only | Visual inspection of sync-preview output | Deferred |
| QUAL-03 | filterCommitsByCategory() with all filter combinations | automated | `bun test tests/sync.test.cjs --grep filterCommits` | Done (10 tests) |
| QUAL-03 | detectFileOverlapDeps() with cross-module deps | automated | `bun test tests/sync.test.cjs --grep detectFile` | Done (4 tests) |
| QUAL-03 | Selective sync end-to-end with real upstream | manual-only | `/gsd:upstream --category feat,fix` | Deferred |
| QUAL-03 | AI conflict resolution quality | manual-only | Trigger real cherry-pick conflict | Deferred |
| QUAL-04 | claudeToGeminiTools not undefined when Gemini install runs | automated | `bun test tests/installer.test.js --grep gemini` | ❌ Wave 0 |
| QUAL-04 | Gemini install completes without ReferenceError | automated | `node bin/install.js --gemini --global` in mock env | ❌ Wave 0 |
| QUAL-05 | cmdConfigEnsureSection creates config with all required fields | automated | `bun test tests/config.test.cjs` | ❌ Wave 0 |
| QUAL-05 | cmdConfigSet handles dot-notation keys + type coercion | automated | `bun test tests/config.test.cjs` | ❌ Wave 0 |
| QUAL-05 | cmdConfigGet returns correct values and errors | automated | `bun test tests/config.test.cjs` | ❌ Wave 0 |
| QUAL-05 | extractFrontmatter parses inline arrays, nested objects, bare values | automated | `bun test tests/frontmatter.test.cjs` | ❌ Wave 0 |
| QUAL-05 | reconstructFrontmatter roundtrips cleanly | automated | `bun test tests/frontmatter.test.cjs` | ❌ Wave 0 |
| QUAL-05 | cmdFrontmatterGet/Set/Append work correctly | automated | `bun test tests/frontmatter.test.cjs` | ❌ Wave 0 |
| QUAL-05 | cmdTemplateSelect picks correct template | automated | `bun test tests/template.test.cjs` | ❌ Wave 0 |
| QUAL-05 | core.cjs output/error/safeReadFile/requireValid work correctly | automated | `bun test tests/core.test.cjs` | ❌ Wave 0 |
| QUAL-05 | core.cjs execGit uses spawnSync (Windows-safe) | automated | `bun test tests/core.test.cjs` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `bun test tests/{module}.test.cjs` (targeted)
- **Per wave merge:** `bun test tests/config.test.cjs tests/frontmatter.test.cjs tests/template.test.cjs tests/core.test.cjs tests/installer.test.js`
- **Phase gate:** `bun test --coverage` (full suite green before `/gsd:verify-work`)

### Wave 0 Gaps

- [ ] `tests/config.test.cjs` -- covers QUAL-05 (cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet)
- [ ] `tests/frontmatter.test.cjs` -- covers QUAL-05 (extractFrontmatter, reconstructFrontmatter, cmdFrontmatter*)
- [ ] `tests/template.test.cjs` -- covers QUAL-05 (cmdTemplateSelect, cmdTemplateFill)
- [ ] `tests/core.test.cjs` -- covers QUAL-05 (output, error, safeReadFile, requireValid, execGit, resolveModelAlias)
- [ ] Gemini install test in `tests/installer.test.js` -- covers QUAL-04 regression prevention

## Sources

### Primary (HIGH confidence)

- `bin/install.js` (local file, lines 565-615) -- claudeToGeminiTools usage without definition
- `git show upstream/main:bin/install.js` (lines 365-380) -- correct claudeToGeminiTools definition
- `.planning/phases/06-logo-assets/06-VERIFICATION.md` -- Phase 6 verification result and deferred human checks
- `.planning/phases/21-sync-intelligence/21-VERIFICATION.md` -- Phase 21 verification result and deferred human checks
- `.planning/phases/22-advanced-sync-automation/22-VERIFICATION.md` -- Phase 22 verification result and deferred human checks
- `bun test --coverage` output (2026-03-10 run, 822 pass / 3 fail) -- confirms 4 lib modules absent from coverage
- `get-stuff-done/bin/lib/config.cjs` (162 lines) -- module to test
- `get-stuff-done/bin/lib/frontmatter.cjs` (299 lines) -- module to test
- `get-stuff-done/bin/lib/template.cjs` (222 lines) -- module to test
- `get-stuff-done/bin/lib/core.cjs` (438 lines) -- module to test (partially covered via phase.test.cjs)
- `.planning/memory/gsd-phase-researcher.md` -- Phase 21/22/23 learnings confirming current state

### Secondary (MEDIUM confidence)

- `package.json` `files` array -- confirms assets/ is not included in npm package distribution

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, established test patterns
- Architecture: HIGH -- clear patterns from existing test files, exact bug fix from upstream
- Pitfalls: HIGH -- observed directly from codebase state and previous phase learnings

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable codebase; no fast-moving dependencies)
