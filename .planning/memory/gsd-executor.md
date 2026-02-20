---
agent: gsd-executor
updated: 2026-02-20
entries: 9
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
