---
agent: gsd-executor
updated: 2026-03-16
entries: 51
---

- finding: "For assessment-report-only plans (no code changes), git status will show pre-existing modified files from earlier sessions. Only stage the plan's own artifacts (SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md). Do NOT stage tests/ or get-stuff-done/ files that were modified before the plan started."
  source: "Phase 19, Plan 02, final commit"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

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

- finding: "When adding teams_integration sections to workflow markdown files, use the Edit tool with old_string/new_string. Adding sections to existing markdown XML is an additive change -- never requires rewriting the whole file. The xml-like section tags (teams_integration workflow='X') integrate cleanly with existing step XML tags."
  source: "Phase 17, Plan 01, Tasks 1-2"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-20"

- finding: "For upstream cherry-pick syncs, use 'git checkout HEAD -- <file>' to restore protected files that a revert/conflict wants to delete or modify. Do this BEFORE staging other changes for the commit. The checkout restores the working tree file and removes it from the conflict state."
  source: "Phase 18, Plan 01, Task 2 (cherry-pick 9d815d3 mega-revert)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When a mega-revert commit has 20+ files in conflict, triage each file: (1) protected files -> git checkout HEAD -- file, (2) files where upstream wins -> git checkout MERGE_HEAD -- file, (3) files needing selective merge -> resolve manually. For each category, process all files first, then review git diff --staged before committing."
  source: "Phase 18, Plan 01, Task 2 (cherry-pick 9d815d3)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When upstream and fork have different statusline/UI rendering architectures (upstream uses raw ANSI codes, fork uses theme system), adopt upstream's detection logic but replace rendering with the fork's theme API calls. This preserves fork architecture while gaining upstream's feature content."
  source: "Phase 18, Plan 01, Task 2 (cherry-pick 1bc6d00)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "DU conflict pattern for upstream cherry-picks: when upstream deletes get-shit-done/bin/gsd-tools.cjs but fork has get-stuff-done/bin/gsd-tools.cjs, resolve via: git rm --cached get-shit-done/bin/gsd-tools.cjs && rm -f get-shit-done/bin/gsd-tools.cjs && rmdir get-shit-done/bin && rmdir get-shit-done. Then apply diff changes to fork's get-stuff-done/bin/gsd-tools.cjs manually."
  source: "Phase 18, Plan 02, Task 2 (all Batch 8 DU conflicts)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "After a mass file rename (e.g., gsd-tools.js -> gsd-tools.cjs), ALWAYS update test files that reference the old path. Test helper TOOLS_PATH variables are easily missed. Run bun test immediately after the rename commit to catch failures early."
  source: "Phase 18, Plan 02, Task 2 deviation (ccb85ff)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When upstream adds a new command file (e.g., commands/gsd/cleanup.md) that references upstream workflow paths, always check the @-references in the file for upstream branding (get-shit-done). Also verify the target workflow file exists at the fork-branded path. If not, create it with fork-branded content."
  source: "Phase 18, Plan 02, Task 2 deviation (a12f20b)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "CHANGELOG.md upstream cherry-picks often have non-standard conflict separators when the HEAD block is very long (100+ lines). The '=======' separator may have CRLF where script expects LF. Use regex detection: content.match(/^=======\\r?\\n/m) to find the separator reliably, then slice content at that position."
  source: "Phase 18, Plan 02, Task 2 (00a13f5 cherry-pick conflict)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "Codex add+revert cherry-picks can leave incomplete reverts when auto-merge doesn't fully restore the pre-Codex state. After applying revert commits, run bun test immediately. Look for installer test failures (processAttribution ReferenceError or ENOENT on agent files). Fix: remove dangling function calls and restore useLinks/mkdirSync pattern from pre-Codex state."
  source: "Phase 18, Plan 03, Task 2 post-batch fix (ecdb951)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "Context-proxy refactor (3dcd3f0) required manual application to fork: (1) remove parseIncludeFlag() from gsd-tools.cjs, (2) add *_path fields to all cmdInit* functions, (3) add file discovery to cmdInitPlanPhase and cmdInitPhaseOp (context/research/verification/uat paths), (4) update workflow files to use <files_to_read> blocks instead of @-references. The fork's workflows that don't use --include don't need major changes."
  source: "Phase 18, Plan 03, Task 2 (3dcd3f0 cherry-pick)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When commands/gsd/ files are taken --theirs during UU conflict resolution, always check for upstream branding in the execution_context @-references. Files like add-phase.md, add-todo.md use @~/.claude/get-shit-done/workflows/ which need branding pass to get-stuff-done."
  source: "Phase 18, Plan 03, Task 2 branding pass (ecdb951)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When upstream's test split adds tests/helpers.cjs AND the fork already has a tests/helpers/ directory, bun resolves require('./helpers') to the .cjs file BEFORE the directory. The .cjs file must re-export from helpers/index.js: const dirHelpers = require('./helpers/index.js'); module.exports = { ...dirHelpers, ...ownExports }. This unblocks both fork tests (expecting createTempDir) and upstream tests (expecting runGsdTools etc)."
  source: "Phase 18, Plan 04, Task 2 (6601879)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "When upstream splits a monolith into modules, structural tests that check the monolith file (e.g., 'does gsd-tools.cjs contain require(src/validation)') break because the import moved to a domain module. Fix: add a CORE_PATH constant and update the test to read the domain module file instead."
  source: "Phase 18, Plan 04, Task 2 (6601879)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "path.join() on Windows returns backslashes. If tests assert forward slashes in paths (e.g., 'context_path': 'phases/foo/bar.md'), add .replace(/\\\\/g, '/') in the module output. This is required for cross-platform test compatibility."
  source: "Phase 18, Plan 04, Task 2 (6601879 init.cjs fix)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "GitHub Actions CI (.github/workflows/ci.yml) only triggers on pushes to 'main' or PRs targeting 'main'. Pushing a feature/sync branch does NOT trigger cross-platform CI. Cross-platform validation requires opening a PR. Plan accordingly: schedule CI validation as a PR step, not immediately after branch push."
  source: "Phase 18, Plan 04, Task 2 (ci.yml analysis)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "For module split cherry-picks (monolith -> N files), bun test failures typically have 4 root causes: (1) module resolution shadowing, (2) structural tests checking wrong file path, (3) missing security validation that tests assert, (4) cross-platform path separator differences. Check all 4 before assuming other causes."
  source: "Phase 18, Plan 04, Task 2 (171 failure root cause analysis)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "Skills (slash commands) don't resolve inside Task subagents. When a workflow uses Task(prompt='Run /gsd:execute-phase') for auto-advance chaining, the subagent cannot resolve the /gsd: skill. Fix: embed the workflow file directly using @file references in the Task() prompt. This is the upstream's fix in commit 131f24b."
  source: "Phase 18, Plan 04 (131f24b cherry-pick)"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "The gsd-tools.cjs state advance-plan and state update-progress commands fail when STATE.md uses free-form text sections ('Plan: 3 of TBD') rather than machine-parseable key:value format. When gsd-tools can't parse STATE.md, update STATE.md manually via Edit tool."
  source: "Phase 18, Plan 04, state update"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "The plan verification criterion 'grep | wc -l returns 0' for upstream branding audit must exclude .planning/ entirely (not just .planning/sync/). Historical planning docs contain hundreds of legitimate references to upstream names. The actionable check is: no branding in bin/, get-stuff-done/, hooks/, src/, agents/, commands/ (excluding expected workflow references like commands/gsd/upstream.md)."
  source: "Phase 18, Plan 05, Task 1 identity audit"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "GitHub CI only triggers on push to main or PR targeting main. 'gh pr create' will fail with 'No commits between main and branch' error if the repo defaults to a different remote. Use --repo flag explicitly: 'gh pr create --repo owner/repo' when gh CLI defaults to the upstream repo rather than the fork."
  source: "Phase 18, Plan 05, Task 1 PR creation"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "Coverage at 94.05% lines (below 95%) is primarily caused by src/platform/detect.js at 67.47% lines -- many OS-specific branch paths (Windows-specific, macOS-specific, Linux-specific) that can't all execute in a single test environment. This is a known gap for Phase 19, not a blocker for Phase 18 merge."
  source: "Phase 18, Plan 05, Task 1 coverage check"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "git merge does not accept --author flag. To set author on a merge commit, use GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL / GIT_COMMITTER_NAME / GIT_COMMITTER_EMAIL environment variables: GIT_AUTHOR_NAME='X' GIT_AUTHOR_EMAIL='y' git merge --no-ff branch -m 'message'"
  source: "Phase 18, Plan 05, Task 3 merge"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "Auto-updated planning files (.planning/CONTINUE.md, .planning/events.log, get-stuff-done/.install-meta.json) with timestamp-only changes can block git checkout between branches. Use git stash --include-untracked before checkout; the files do not need to be reapplied (they regenerate automatically on next run)."
  source: "Phase 18, Plan 05, Task 3 checkout"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "For upstream sync merges, use --no-ff to preserve the sync branch as a distinct history lineage. This creates a clear 'sync complete' marker that makes the cherry-pick operation visible as an atomic unit, distinct from pre-sync main history."
  source: "Phase 18, Plan 05, Task 3 merge strategy"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "When a plan's verification criterion is 'grep returns no results', also update test description strings and comments (not just path constants) that contain the old value. grep does not distinguish between path references and string literals in test names -- both count as matches."
  source: "Phase 19, Plan 01, Task 1 verification"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "get-stuff-done/bin/dist/ is gitignored (esbuild output). When rebuilding in a task, never attempt git add on dist/ files. Stage only the source files that change the build pipeline (scripts/build.js, bin/install.js, tests/ path constants)."
  source: "Phase 19, Plan 01, Task 1 commit"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "bun 1.3.5 coverage attribution: even a SINGLE delete require.cache in a test file causes bun to use the re-required module instance's coverage for the ENTIRE file report, overriding all coverage from direct calls in the same file. To fix: eliminate ALL re-require instances. If the test requires re-require (e.g., execSync destructured at load time), remove the test entirely -- moving it to a dedicated file doesn't help if that file also has re-require."
  source: "Phase 19, Plan 03, Task 1"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "bun coverage migration pattern (re-require -> direct calls): (1) add _detect* exports to top-level destructure in test file, (2) replace each delete+re-require block with direct _detectShell/_detectEnvironment call, (3) update assertions from platform.x to result.x (e.g. platform.shellVariant -> result.variant for _detectShell()), (4) remove afterEach's delete require.cache line. Coverage goes from ~67% to ~97%."
  source: "Phase 19, Plan 03, Task 1"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "For CLI --help flag: detect before command routing using args.includes('--help') || args.includes('-h'), write to process.stdout.write (NOT error() which writes to stderr and exits 1), then process.exit(0). Also add a 'help' case to the switch statement as a subcommand alias. This handles gsd-tools --help, -h, and help all correctly."
  source: "Phase 18, Plan 06, Task 1"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "When deleting directories for branding cleanup, verify using git add with all sub-paths explicitly (git add dir/README.md dir/subdir/file1.js etc.), NOT git add dir/ -- git handles deletions as 'D' status items that need individual staging."
  source: "Phase 18, Plan 06, Task 2"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "execGit() shell escaping breaks git commands on Windows MINGW64 when args contain %, |, ^, *, or spaces. The escaping wraps these in single quotes but MINGW64 treats single-quoted args literally (e.g., git log '--format=%H' fails with ambiguous argument). Fix: use spawnSync (array form, no shell) via a spawnGit() helper. Affects: git log --format=, git tag -l 'glob*', git tag -a name -m 'msg with spaces', git diff sha^..sha."
  source: "Phase 20, Plan 01, Task 2"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "git diff-tree without --root returns empty output for the initial commit (no parent). To reliably list files for any commit (including the first), add --root flag: git diff-tree --no-commit-id --root -r --name-status <sha>. Relevant whenever tests create a fresh git repo and examine the initial commit."
  source: "Phase 20, Plan 01, Task 2"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "When modifying workflow markdown files (.md) that contain numbered steps, use the strategy of inserting a step numbered '0' before the loop (for pre-conditions) and 'N+1' or decimal (3.5) for post-conditions. This avoids renumbering all subsequent steps and makes the plan delta clearer in git diff."
  source: "Phase 20, Plan 02, Task 1"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "When requirements mark-complete reports 'not_found' for IDs that should exist, check if they were already marked complete by a prior plan (same plan series). Look at REQUIREMENTS.md directly -- the IDs may already show [x]. This is correct state, not an error."
  source: "Phase 20, Plan 02, state update"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Dist bundles (hooks/dist/, get-stuff-done/bin/dist/) are gitignored. When a plan calls for 'dist rebuild', the rebuild is for local/install use only. Do not attempt to git add dist files. The 'rebuild dist bundles' task commits no files if the only changes are in gitignored dist paths -- pair it with documentation changes that ARE tracked."
  source: "Phase 23, Plan 01, Task 2"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "For testing gsd-tools lib modules that call output()/error() from core.cjs (which invoke process.exit), use a captureOutput() helper with process.exit as no-op (not throw). Throwing from process.exit gets caught by try-catch blocks inside the functions, triggering secondary error() calls. No-op exit lets the function continue; for success paths this is harmless (output() is the last call), for error paths the continuation crash is suppressed by wrapping in try-catch with exitCode===1 check."
  source: "Phase 24, Plan 03, Task 1"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-16"
  status: superseded
  superseded_by: "Hybrid mock: exit(0) non-throwing, exit(1) throwing. This handles template.cjs try/catch blocks correctly. The no-op approach fails for error() paths because code continues after error() returns."

- finding: "bun coverage only tracks modules loaded in-process, not subprocess executions. Tests that ONLY use runGsdTools/runGsdToolsDirect (subprocess) will show 0% coverage for the tested module. To get coverage, import the module directly and call its functions with process.exit mocked. Combine both approaches: subprocess for integration/error paths, direct calls for coverage tracking."
  source: "Phase 24, Plan 03, Task 1"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-16"

- finding: "For template.cjs tests: use hybrid process.exit mock -- exit(0) is non-throwing (prevents try/catch fallback in cmdTemplateSelect from triggering), exit(1) throws (stops execution after error() call). The no-op-only approach from 24-03 fails for error() paths because code continues after error() returns, eventually calling output() which overwrites exitCode to 0."
  source: "Phase 24, Plan 04, Task 1"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-16"

- finding: "model_overrides code path in resolveModelInternal (core.cjs line 369) is dead code -- loadConfig() returns a fixed set of fields and model_overrides is never extracted from the raw config JSON. The optional chaining config.model_overrides?.[agentType] always evaluates to undefined."
  source: "Phase 24, Plan 04, Task 2"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-16"

- finding: "getMilestoneInfo() name regex /## .*v\\d+\\.\\d+[:\\s]+([^\\n(]+)/ only matches vX.Y format (not vX.Y.Z). After matching v\\d+\\.\\d+, it expects a colon or space. With v0.4.0, the .0 is not consumed by \\d+ so [:\\s]+ fails. Test with vX.Y: format, not vX.Y.Z: format."
  source: "Phase 24, Plan 04, Task 2"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-16"

- finding: "For cross-platform installer test isolation, always use --config-dir flag (not HOME env override). os.homedir() is cached at Node.js startup from USERPROFILE/HOMEDRIVE+HOMEPATH on Windows and ignores HOME env changes. --config-dir is the first-priority override in upstream's getGlobalDir() and works identically on all platforms."
  source: "Phase 29, Plan 01, Task 1 (cross-platform test isolation decision)"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "When using fs.cpSync(src, dest, { recursive: true }) to copy an npm package for subprocess testing, the destination directory must NOT already exist (cpSync with recursive:true creates dest from scratch). If scratch dir is inside tmpDir which is freshly created, this is fine. If reusing a dir, call rmSync first."
  source: "Phase 29, Plan 01, Task 1 (setupScratchDir pattern)"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "Surface branding of upstream install.js (get-shit-done-cc -> @chude/get-stuff-done): ONLY replace exact 'get-shit-done-cc' occurrences. Never replace bare 'get-shit-done' -- it appears 130+ times in path resolution (path.join(targetDir, 'get-shit-done')), directory naming, and config markers. Pattern: most specific replacements first (get-shit-done-cc@latest, npx get-shit-done-cc, then get-shit-done-cc)."
  source: "Phase 29, Plan 01, Task 1 (applyBranding scoping)"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "When STATE.md uses free-form text (not machine-parseable key:value format), gsd-tools state advance-plan fails with 'Cannot parse Current Plan'. Update STATE.md manually via Edit tool. This is a known gap from Phase 18 (see prior memory entry)."
  source: "Phase 29, Plan 01, state update"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"
