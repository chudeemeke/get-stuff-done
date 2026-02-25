---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/helpers.cjs
  - tests/state.test.cjs
autonomous: true
requirements: [OPEN-ITEM-1]
must_haves:
  truths:
    - "Dollar-sign tests execute their assertions on all platforms including Windows"
    - "No early-return or platform skip in any test"
    - "All existing tests still pass unchanged"
  artifacts:
    - path: "tests/helpers.cjs"
      provides: "runGsdToolsDirect helper using execFileSync array form"
      exports: ["runGsdToolsDirect"]
    - path: "tests/state.test.cjs"
      provides: "Dollar-sign tests using runGsdToolsDirect instead of early-return"
  key_links:
    - from: "tests/state.test.cjs"
      to: "tests/helpers.cjs"
      via: "require('./helpers.cjs').runGsdToolsDirect"
      pattern: "runGsdToolsDirect"
    - from: "tests/helpers.cjs"
      to: "get-stuff-done/bin/gsd-tools.cjs"
      via: "execFileSync with TOOLS_PATH"
      pattern: "execFileSync.*TOOLS_PATH"
---

<objective>
Fix the dollar-sign CLI test approach so tests actually run on Windows instead of silently early-returning.

Purpose: Two tests in state.test.cjs (`add-decision preserves dollar amounts` and `add-blocker preserves dollar strings`) use `if (process.platform === 'win32') return;` which makes them silently pass without testing anything on Windows. The root cause is that `runGsdTools` uses `execSync` with string interpolation, and MINGW's shell expands `$0`, `$1`, `$2` as positional parameters. The fix is `execFileSync` with an array of arguments, which bypasses the shell entirely.

Output: Updated helpers.cjs with new helper, updated state.test.cjs with 2 tests fixed
</objective>

<execution_context>
@~/.claude/get-stuff-done/workflows/execute-plan.md
@~/.claude/get-stuff-done/templates/summary.md
</execution_context>

<context>
@tests/helpers.cjs
@tests/state.test.cjs
@.planning/STATE.md (Open Item #1)

<interfaces>
From tests/helpers.cjs (current exports):
```javascript
const { execSync } = require('child_process');
const TOOLS_PATH = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

function runGsdTools(args, cwd = process.cwd()) {
  // Uses execSync with string interpolation: `node "${TOOLS_PATH}" ${args}`
  // This passes through the shell, where MINGW expands $N tokens
}

module.exports = {
  ...dirHelpers,
  runGsdTools,
  createTempProject,
  cleanup,
  TOOLS_PATH,
};
```

From tests/state.test.cjs (the 2 affected tests, lines 197-249):
- Line 198: `if (process.platform === 'win32') return;` in add-decision test
- Line 229: `if (process.platform === 'win32') return;` in add-blocker test
- Both tests pass dollar-sign strings like `$0.50`, `$2.00`, `$5.00`, `$1.00` as CLI arguments
- Both use `runGsdTools(argString, tmpDir)` which shells out via execSync
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add runGsdToolsDirect helper to tests/helpers.cjs</name>
  <files>tests/helpers.cjs</files>
  <action>
Add a `runGsdToolsDirect(argsArray, cwd)` function to tests/helpers.cjs that uses `execFileSync` from `child_process` (already imported -- add `execFileSync` to the destructure alongside `execSync`).

The function signature:
```javascript
function runGsdToolsDirect(argsArray, cwd = process.cwd())
```

Implementation:
- First argument to execFileSync: `process.execPath` (the Node binary -- NOT a string literal like 'node', because on some CI the binary name differs)
- Second argument: `[TOOLS_PATH, ...argsArray]` -- this is the key difference from `runGsdTools`. By passing args as an array, `execFileSync` does NOT spawn a shell, so MINGW cannot expand `$N` tokens
- Third argument: options object `{ cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }` -- identical to runGsdTools
- Wrap in try/catch with the same return shape as `runGsdTools`: `{ success: true, output: result.trim() }` on success, `{ success: false, output: err.stdout?.toString().trim() || '', error: err.stderr?.toString().trim() || err.message }` on failure

Add `runGsdToolsDirect` to the module.exports object.

Do NOT modify runGsdTools -- it is used by dozens of other tests that pass a single string of args. The new helper is purpose-built for cases where shell expansion would corrupt arguments.
  </action>
  <verify>
    <automated>cd "C:/Users/Destiny/iCloudDrive/Documents/AI Tools/Anthropic Solution/Projects/get-stuff-done" && node -e "const h = require('./tests/helpers.cjs'); console.log(typeof h.runGsdToolsDirect); console.log(typeof h.runGsdTools);"</automated>
  </verify>
  <done>runGsdToolsDirect is exported from helpers.cjs, returns 'function' when checked, runGsdTools still exists unchanged</done>
</task>

<task type="auto">
  <name>Task 2: Update dollar-sign tests to use runGsdToolsDirect</name>
  <files>tests/state.test.cjs</files>
  <action>
Update the import on line 9 to also destructure `runGsdToolsDirect`:
```javascript
const { runGsdTools, runGsdToolsDirect, createTempProject, cleanup } = require('./helpers.cjs');
```

Modify the `add-decision preserves dollar amounts` test (around line 197):
1. Remove the `if (process.platform === 'win32') return;` line entirely
2. Replace the `runGsdTools(stringArgs, tmpDir)` call with `runGsdToolsDirect(argsArray, tmpDir)` where the argsArray is:
```javascript
['state', 'add-decision', '--phase', '11-01',
 '--summary', 'Benchmark prices moved from $0.50 to $2.00 to $5.00',
 '--rationale', 'track cost growth']
```
3. Keep all assertions exactly as they are -- they validate the same output

Modify the `add-blocker preserves dollar strings` test (around line 228):
1. Remove the `if (process.platform === 'win32') return;` line entirely
2. Replace the `runGsdTools(stringArgs, tmpDir)` call with `runGsdToolsDirect(argsArray, tmpDir)` where the argsArray is:
```javascript
['state', 'add-blocker', '--text', 'Waiting on vendor quote $1.00 before approval']
```
3. Keep all assertions exactly as they are

Update the comment block above these tests (line 194-196). Change from explaining the MINGW workaround to explaining WHY these tests use `runGsdToolsDirect`:
```javascript
// These tests use runGsdToolsDirect (execFileSync array form) instead of
// runGsdTools (execSync string form) because dollar-sign arguments like
// $0.50 are expanded by MINGW shell on Windows. Array form bypasses shell.
```

Do NOT modify any other tests in this file. The file-input tests (lines 251-304) are a separate, valid approach and should remain as-is.
  </action>
  <verify>
    <automated>cd "C:/Users/Destiny/iCloudDrive/Documents/AI Tools/Anthropic Solution/Projects/get-stuff-done" && node --test tests/state.test.cjs</automated>
  </verify>
  <done>All 12 tests pass. The two dollar-sign tests no longer have early-return guards -- they execute their assertions on Windows. The file-input tests remain unchanged.</done>
</task>

</tasks>

<verification>
1. `node --test tests/state.test.cjs` -- all 12 tests pass, 0 fail, 0 skip
2. Grep for `process.platform === 'win32'` in state.test.cjs -- should return 0 matches
3. Grep for `runGsdToolsDirect` in helpers.cjs -- should show the function definition and export
4. Grep for `runGsdToolsDirect` in state.test.cjs -- should show import and 2 call sites
</verification>

<success_criteria>
- Zero early-return/platform-skip guards in state.test.cjs
- Dollar-sign preservation tests actually execute their assertions on Windows (MINGW)
- All existing tests pass unchanged (no regressions)
- runGsdToolsDirect helper available for future tests needing shell-safe argument passing
</success_criteria>

<output>
After completion, update .planning/STATE.md to remove Open Item #1 (dollar-sign test fix).
</output>
