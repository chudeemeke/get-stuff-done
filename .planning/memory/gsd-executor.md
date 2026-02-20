---
agent: gsd-executor
updated: 2026-02-20
entries: 12
---

- finding: "hooks/dist/ is gitignored (decision 09-02 BUILD-001). When committing esbuild output, only commit scripts/build-hooks.js -- never try to git add hooks/dist/. The dist files are generated artifacts."
  source: "Phase 13, Plan 01, Task 1"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "bun run build:hooks (and any node script run via cd + &&) in the Bash tool on Windows/MINGW64 can produce duplicate output or exit code 1 false positives. Use absolute paths with node directly (node 'C:/path/to/script.js') or bun test with absolute path for reliable results."
  source: "Phase 13, Plan 01, Task 1 verification"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "For dist regression tests in bun:test, use beforeAll() to auto-build dist files if missing. This ensures tests work in CI after fresh checkout without requiring a manual build step. Pattern: check each DIST_HOOKS file with fs.existsSync, and if any missing, execSync('node scripts/build-hooks.js', {cwd: PROJECT_ROOT})."
  source: "Phase 13, Plan 01, Task 2"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "grep returns exit code 1 when it finds 0 matches (no matches), which causes the Bash tool to treat commands chained with && as failed. When checking that a pattern has zero occurrences with grep -c, run it standalone without &&-chaining other commands after it."
  source: "Phase 14, Plan 01, verification step"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "The tests/helpers directory (helpers/index.js) can be required as './helpers' from test files in the same tests/ directory -- Node.js resolves the directory's index.js automatically. No change needed when tests import require('./helpers')."
  source: "Phase 14, Plan 01, Task 2"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "bun test caches module files between runs. If a structural test reads a file and the file was recently written, bun may return cached content. Run with --no-cache if tests fail on recently-modified files. Subsequent runs pass as bun invalidates cache on file change."
  source: "Phase 14, Plan 02, Task 2 verification"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-20"

- finding: "When session shows commits already made (git log shows 14-02 and 14-03 commits that shouldn't be there), check if a parallel/previous agent already committed work. Check git log carefully before staging -- 'git status --short' showing 'nothing to commit' means files are already committed."
  source: "Phase 14, Plan 02, Task 2 commit"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-20"

- finding: "A prior plan's commit can accidentally leave files unstaged in the working tree (incomplete commit). This manifests as pre-existing test failures when the full test suite is run. Fix: stage and commit the missing files as a Rule 1 auto-fix with a descriptive commit message noting it completes the prior plan."
  source: "Phase 14, Plan 03, Task 1 (ConfigLoader.js left unstaged from 14-02)"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-20"

- finding: "For grep -rl (recursive search) on Windows paths with spaces, always use cd to the project root first, then use relative paths. The shell does NOT handle quoted paths with spaces correctly when using -l flag + the pattern requires shell expansion."
  source: "Phase 14, Plan 03, Task 2 audit"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-20"

- finding: "When adding dist regression tests for a bundled CLI tool that may not have a 'frontmatter validate' subcommand, test MODULE_NOT_FOUND absence rather than asserting a specific command output. Pattern: catch the error, assert errOutput does NOT match /MODULE_NOT_FOUND/ -- this proves the module WAS loaded even if the command is unknown."
  source: "Phase 15, Plan 01, Task 2"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "gsd-tools.js state advance-plan returns full config JSON (falls through to cmdStateLoad) when called against the installed version that lacks the advance-plan subcommand. The installed gsd-tools at ~/.claude/get-stuff-done/bin/ may be older than the source. Update STATE.md directly via Edit tool for current phase."
  source: "Phase 15, Plan 01, state update"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "bun 1.3.5 coverage tracking bug: when a test file does 'delete require.cache' and re-requires a module, bun tracks coverage for the NEW instance. The LAST loaded instance's coverage overrides earlier instances in the report for the same file path. Direct-call tests added to the SAME file as cache-clearing tests do NOT fix coverage -- the re-require pattern resets the tracked instance."
  source: "Phase 16, Plan 01, Task 2"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"

- finding: "Fix for bun 1.3.5 coverage tracking bug: create a SEPARATE test file with NO cache-clearing/require.cache operations. The separate file gets a clean module-load context, so direct function calls are tracked in the original (and only) module instance. Pattern: create 'foo-internal.test.js' alongside 'foo.test.js' when 'foo.test.js' uses require.cache deletion."
  source: "Phase 16, Plan 01, Task 2"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"

- finding: "When a module uses 'const { execSync } = require('child_process')' (destructuring at load time), you CANNOT mock execSync by mutating childProcess.execSync after the module loads. The destructured reference is a local copy captured at import time. To test error paths in such modules, you MUST use the require.cache deletion + re-require approach (which then triggers a fresh destructuring that picks up the mutated value)."
  source: "Phase 16, Plan 01, Task 2 (_detectGit mock)"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"
