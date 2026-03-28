---
agent: gsd-phase-researcher
updated: 2026-03-27
entries: 48
---

- finding: "esbuild is already a devDependency (v0.24.2) in get-stuff-done and is importable via require('esbuild') from project root. It bundles all three hooks successfully with zero errors."
  source: "Phase 13, Hook Bundling Research"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "gsd-statusline.js bundles to 311KB (154KB minified) because ConfigLoader pulls in AJV + json5. pre-compact.js bundles to only 23KB (pulls in pathe via gsdPaths). gsd-check-update.js bundles to 1.8KB (smaller than source - no deps). The size concern is real for statusline but acceptable since hook files are one-time installs, not loaded on every execution."
  source: "Phase 13, Hook Bundling Research"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "Existing hook tests (tests/hooks.test.js) run from SOURCE files at hooks/*.js, not from hooks/dist/. Tests pass correctly (16/16) in current state because NODE_PATH includes project src/. Post-bundling, dist tests should also pass but tests will need to add a dist-specific test suite or update paths."
  source: "Phase 13, Hook Bundling Research"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "gsd-tools.js (the main CLI at get-stuff-done/bin/gsd-tools.js, 1913 lines) has ZERO imports of src/validation/index.js. The validation module is completely orphaned. All 4 execGit() call sites were verified: lines 914, 918, 931, 995."
  source: "Phase 14, Security Wiring Research"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"
  status: superseded
  superseded_by: "Phase 14 implemented validation wiring. gsd-tools.js now has require('../../src/validation') at line 37. The orphaned status is resolved."

- finding: "AskUserQuestion audit: 28 command files in commands/gsd/. 13 reference AskUserQuestion and all 13 declare it. plan-phase.md command file is missing AskUserQuestion in allowed-tools but its workflow (get-stuff-done/workflows/plan-phase.md line 334) directly calls 'Use AskUserQuestion'. complete-milestone.md workflow has interactive confirmation. remove-phase.md workflow has confirm_removal step."
  source: "Phase 14, Security Wiring Research"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "src/config/ConfigSchema.js already exists (validates ~/.gsd/config.json with AJV). CONTEXT says to create src/config/schema.js for .planning/config.json validation. These are DIFFERENT configs with different schema shapes. Do not merge them. The .planning/config.json keys are fully documented in loadConfig() at gsd-tools.js lines 56-104."
  source: "Phase 14, Security Wiring Research"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "gsd-tools.js post-Phase-14 has exactly ONE external (non-built-in) require: require('../../src/validation') at line 37. All other requires are Node.js built-ins (fs, path, child_process). This means bundling gsd-tools.js produces a small output (estimated 50-80KB) because no npm packages are inlined."
  source: "Phase 15, gsd-tools Bundling Research"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "The installer (bin/install.js) copies the entire get-stuff-done/ directory via copyWithPathReplacement(). The post-copy overwrite pattern already exists: CHANGELOG.md is copied separately after the main directory copy (lines 1340-1349). The same pattern works for replacing get-stuff-done/bin/gsd-tools.js with the bundled version."
  source: "Phase 15, gsd-tools Bundling Research"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "src/validation/index.js is 192 lines of pure Node.js. Only built-in used is 'path'. Zero npm dependencies. This is the simplest possible esbuild bundle: one entry point, one dependency module, both pure JS. The bundle output will NOT include AJV, json5, pathe, or any npm package."
  source: "Phase 15, gsd-tools Bundling Research"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "bun 1.3.5 V8 coverage CONFIRMED: delete require.cache + re-require does NOT accumulate coverage into the original source file. bun registers each module load as a separate V8 Script. Coverage from re-loaded scripts is not merged. This means the cache-clear + re-require pattern (used in platform.test.js coverage gap tests) fails to produce coverage. FIX: export internal functions from the module and call them directly without re-requiring."
  source: "Phase 16, Platform Quality Research"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"

- finding: "bun 1.3.5: clearCache() + repeated direct function calls (without re-requiring) DOES accumulate coverage within the same test run. process.platform mutation via Object.defineProperty takes effect immediately for subsequent function calls. So the correct pattern is: export internals, mock process.platform with mockPlatform(), call internal function directly, coverage tracks correctly."
  source: "Phase 16, Platform Quality Research"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"

- finding: "upstream-sync.md workflow does NOT use Task tool subagent spawning for its core analysis work. Stages 1-5 run inline in the orchestrator context using bash commands. The team template defines parallel analysis teammates (commit-analyzer, conflict-detector, identity-checker) for tasks currently done inline. The insertion point for team integration is Stage 3.5 (security review), not a subagent spawn point."
  source: "Phase 17, Agent Teams Wiring Research"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-20"

- finding: "verify-phase.md workflow file is named 'verify-phase' but Phase 10 named all team/config artifacts 'verify-work'. The config.json oversight key is 'verify-work' (not 'verify-phase'). When verify-phase.md reads teams config, it must use key 'verify-work'. The workflow file should NOT be renamed -- it would break existing references."
  source: "Phase 17, Agent Teams Wiring Research"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-20"

- finding: "Phase 17 is documentation-only (no JavaScript changes). All 4 team templates and 4 oversight agents exist and are correct from Phase 10. config.json teams section exists and is correct. The only work is adding a teams_integration conditional section to 4 workflow markdown files. For nested JSON key reads (teams.enabled), use python3 -c 'import json; c=json.load(open(...)); print(...)' rather than shell grep to avoid matching wrong keys."
  source: "Phase 17, Agent Teams Wiring Research"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-20"

- finding: "Phase 18 actual cherry-pick count: 174 commits in the range v1.9.13..v1.20.5. The roadmap says '185' which is the full main..upstream/main count (including 11 untagged post-v1.20.5 commits). The modular architecture (SYNC-II-02 requirement) is ONLY in the untagged commits (c67ab75, fa2e156, ebfc17a). Phase 18 must sync to upstream/main HEAD, not stop at v1.20.5."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "The upstream module split (commit c67ab75) creates 11 CJS modules under get-shit-done/bin/lib/: core(377), frontmatter(299), state(490), phase(877), roadmap(298), verify(772), config(162), template(222), milestone(215), commands(556), init(694) lines. Router gsd-tools.cjs is 553 lines. The split is a single commit that touches 13 files."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Fork has 48 files that also exist in upstream (potential conflicts). 567 files total in fork vs 167 in upstream. Fork has 519 fork-only files (mostly .planning/, .upstream/, src/, tests/, docs/, assets/). Upstream has 119 files not in fork (mostly get-shit-done/ directory tree, tests/*.test.cjs, CHANGELOG, SECURITY, new commands)."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "The 'Revert 12 PRs merged without authorization' commit (9d815d3, in v1.19.0 batch) specifically reverts 'fix: add Write tool to gsd-verifier (#545)'. The fork already has this fix (it was a bug discovered during Phase 9). When cherry-picking 9d815d3, must manually preserve the Write tool in agents/gsd-verifier.md."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Fork's gsd-statusline.js (172 lines) is significantly more complex than upstream's simplified version (108 lines). Upstream statusline writes a bridge file (/tmp/claude-ctx-{session_id}.json) for the new gsd-context-monitor.js PostToolUse hook. Fork statusline must add the bridge file write (~10 lines) to enable context-monitor functionality, without losing its 4-stage display."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "The rename commit (24b933e in v1.19.2 batch) renames get-shit-done/bin/gsd-tools.js to get-shit-done/bin/gsd-tools.cjs. When cherry-picked to fork, it will rename get-stuff-done/bin/gsd-tools.js to get-stuff-done/bin/gsd-tools.cjs. This is CORRECT -- fork adopts .cjs extension. All 48 reference sites across agents/, commands/, get-stuff-done/ then need updating from gsd-tools.js to gsd-tools.cjs."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Fork test suite current state: 562 pass, 1 fail (installer.test.js 'does not duplicate hooks on reinstall' times out at 5000ms). This pre-existing failure is unrelated to Phase 18 sync work. The 563+ tests count in success criteria counts this test as present; the timeout failure should be resolved separately before final merge."
  source: "Phase 18, Upstream Sync Execution Research"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Phase 19 copy-mode install bug confirmed: install.js creates get-stuff-done/bin/gsd-tools.js (from dist bundle) but all workflows call 'node gsd-tools.cjs'. The bug: install.js lines ~1503-1504 set installedTools to 'bin/gsd-tools.js' not 'bin/gsd-tools.cjs'. Fix: update scripts/build.js outfile to 'gsd-tools.cjs', update install.js bundledToolsSrc and installedTools to 'gsd-tools.cjs', update DIST_TOOLS_PATH in gsd-tools.test.js."
  source: "Phase 19, Post-Sync Stabilization Research"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "Phase 19 coverage fix scope: platform.test.js has 17 instances of 'delete require.cache + re-require' that suppress detect.js coverage to 67.47% in full test run. Running platform-internal.test.js alone gives 96.99% for detect.js. Fix: migrate the 17 re-require tests to use exported internal functions (_detectShell, _detectEnvironment, etc.) with mockPlatform(). Lines 183-187 (detectGit error catch) cannot be reached without re-require due to child_process destructuring at load time; accept that ~3% gap."
  source: "Phase 19, Post-Sync Stabilization Research"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "ASSESS-01 key distinction: upstream auto-advance (Phase 18 Batch 12 cherry-pick, commit 131f24b) is sequential phase CHAINING -- one phase after another automatically. CLAUDE-06 (agent teams) is parallel TASK execution WITHIN a phase -- multiple plans running simultaneously. These are not competing features. Auto-advance does NOT make CLAUDE-06 redundant. Phase 10 + 17 completed the team routing wiring; the TeamCreate API integration (experimental) remains optional scope."
  source: "Phase 19, Post-Sync Stabilization Research"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "ASSESS-02 finding: upstream (get-shit-done) has NO upstream-sync workflow -- it is entirely fork-specific. There is no upstream baseline to compare PLAT-07/08 against. The fork's Stage 3.5 (git diff in security review checkpoint) IS the current diff/review capability. PLAT-07 (interactive diff viewer) is a real gap but low priority. PLAT-08 (multi-upstream) has no current use case and should be deferred."
  source: "Phase 19, Post-Sync Stabilization Research"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "Phase 20 sync manifest stats: 97 total entries, 91 applied, 6 skipped. 58 had conflict types (13 mechanical, 9 structural -- note: remaining 36 were conflictType set to non-null values other than these two). Historical conflict rate: 63.7%. This is the effort estimate training data for SYNC-04 dry-run mode."
  source: "Phase 20, Sync Safety Research"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Phase 20 git command verification on Windows Git Bash (MINGW64_NT-10.0-26200): git diff --color=always produces ANSI escape codes in output (confirmed visually). git tag -a requires -m flag or editor opens. git diff-tree --no-commit-id --name-status -r works correctly. Annotated tag create/delete cycle confirmed working. All Phase 20 git commands are platform-safe."
  source: "Phase 20, Sync Safety Research"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Phase 20 trial merge pattern: git cherry-pick -n (no-commit) + git cherry-pick --abort only works when there IS an in-progress cherry-pick (i.e., conflict occurred). If cherry-pick -n succeeds cleanly, there is no in-progress cherry-pick to abort. Correct cleanup after clean trial merge: git reset HEAD (unstage) + git checkout -- . (discard WD changes). Best practice: use git stash push/pop to save clean state before trial merge."
  source: "Phase 20, Sync Safety Research"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Phase 20 codebase structure: bin/lib/ has 11 CJS modules (commands, config, core, frontmatter, init, milestone, phase, roadmap, state, template, verify). Phase 20 adds sync.cjs as the 12th. Router pattern: const sync = require('./lib/sync.cjs') at top, case 'sync-preview': and case 'sync-checkpoint': in switch(command). Template to follow: commands.cjs (simplest module, ~556 lines, pure function exports)."
  source: "Phase 20, Sync Safety Research"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Phase 21 ConfigSchema bug: src/config/ConfigSchema.js has additionalProperties: false at the top level with no 'gsd' section. gsd-statusline.js reads gsd.role via getConfigValue(config, 'gsd.role', 'consumer') but any user setting gsd: { role: 'maintainer' } in ~/.gsd/config.json will get a validation error and role always falls back to 'consumer'. Fix: add gsd section with role enum ['consumer', 'maintainer'] to ConfigSchema.js before Phase 21 monitoring depends on role detection."
  source: "Phase 21, Sync Intelligence Research"
  confidence: HIGH
  phase: "21-sync-intelligence"
  date: "2026-02-25"

- finding: "Phase 21 gsd-check-update.js background process pattern: the hook spawns a child process via spawn(process.execPath, ['-e', codeString]) and unref()s it. Values from the parent scope are injected into the child via JSON.stringify() interpolation. Role detection for maintainer/consumer path must be done in the parent (via ConfigLoader) and injected as a string variable into the spawn code, matching the existing projectVersionFile/globalVersionFile injection pattern."
  source: "Phase 21, Sync Intelligence Research"
  confidence: HIGH
  phase: "21-sync-intelligence"
  date: "2026-02-25"

- finding: "Phase 21 supply chain diff acquisition: git show --format= <sha> produces full patch text for a commit without the commit header. This is the correct command to pass to supply chain pattern-matching functions. Large commits (diff > 500KB) should skip obfuscation/injection pattern matching and flag as 'diff too large to scan'; file-path-based checks (prompt integrity, execution path, dependency diff) still run since they need only file lists."
  source: "Phase 21, Sync Intelligence Research"
  confidence: HIGH
  phase: "21-sync-intelligence"
  date: "2026-02-25"

- finding: "Phase 21 author anomaly seeding: on first run (empty/missing author cache at ~/.claude/cache/gsd-upstream-authors.json), seed from existing repo git log using spawnGit(cwd, ['log', '--format=%an <%ae>']). Without seeding, every commit in the first /gsd:upstream run will be flagged as unknown author, producing a wall of false positives that destroys trust in the check."
  source: "Phase 21, Sync Intelligence Research"
  confidence: HIGH
  phase: "21-sync-intelligence"
  date: "2026-02-25"

- finding: "Phase 21 plan sequencing: implement in 3 plans. Plan 1: classifyCommit() + runSupplyChainChecks() in sync.cjs + extended cmdSyncPreview --json output (classification + supplyChainRisks fields per commit, byType + supplyChainFindings in summary). Plan 2: ConfigSchema gsd section + gsd-check-update.js maintainer path (git fetch + count + classify) + gsd-statusline.js extended notification. Plan 3: /gsd:upstream workflow detailed view (3-layer depth: dashboard, auto-expand risk lines, on-demand clean diff). This order means classifier+scanner are testable via CLI before UX integration."
  source: "Phase 21, Sync Intelligence Research"
  confidence: HIGH
  phase: "21-sync-intelligence"
  date: "2026-02-25"

- finding: "Phase 23 gap closure: ConfigSchema.js has gsd section (lines 46-52) but ConfigLoader.getDefaults() and createDefaultConfig() template string do NOT include it. getDefaults() returns 5 top-level keys (version, context_management, workflow, subagents, ui) -- missing gsd. New installs get no gsd section in config file. Runtime works via getConfigValue fallback to 'consumer' default."
  source: "Phase 23, Gap Closure Research"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Phase 23 autocompact_threshold ghost: gsd-statusline.js line 25 reads context_management.autocompact_threshold via getConfigValue with default 16.5, but ConfigSchema has additionalProperties: false on context_management with only precompact_save_state allowed. Users can never set this value. Resolution: replace with hardcoded constant."
  source: "Phase 23, Gap Closure Research"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Phase 23 coverage numbers (2026-03-08 run): 825 tests, 821 pass, 4 fail (timing-dependent spawn tests). Overall Funcs 94.45%, Lines 91.58%. Coverage decreased from 94.93% (Phase 19) because Phase 21-22 added new source (sync.cjs classifyCommit/filterCommitsByCategory/supplyChain, gsd-check-update.js maintainer path) that shifted the denominator. Test helper gap unchanged: mock-child-process 22.58%, mock-fs 49.15%, mock-process 82.86%."
  source: "Phase 23, Gap Closure Research"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Phase 18 SUMMARY frontmatter: 18-01 and 18-02 have no requirements-completed field at all. 18-03, 18-04, 18-05 have requirements-completed: []. 18-06 has [SYNC-II-02, SYNC-II-04]. Fix: update 18-05 to [SYNC-II-01, SYNC-II-06] (merge plan completed integration + approach comparison). 18-01 through 18-04 are intermediate cherry-pick steps -- no individual requirement completions."
  source: "Phase 23, Gap Closure Research"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Dist bundles are gitignored (hooks/dist/ and get-stuff-done/bin/dist/ in .gitignore). They are build artifacts regenerated by bun run build. prepublishOnly script runs bun run build automatically. The dist rebuild is a pre-release step, not something that needs committing."
  source: "Phase 23, Gap Closure Research"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Phase 24 claudeToGeminiTools bug: bin/install.js references claudeToGeminiTools on lines 610-611 inside convertGeminiToolName() but the const is never declared anywhere in the file. The upstream/main:bin/install.js defines it at lines 369-379 as a 10-entry object (Read->read_file, Write->write_file, Edit->replace, Bash->run_shell_command, Glob->glob, Grep->search_file_content, WebSearch->google_web_search, WebFetch->web_fetch, TodoWrite->write_todos, AskUserQuestion->ask_user). Fix: insert the const definition between claudeToOpencodeTools (ends line 573) and convertGeminiToolName (starts line 600). The bug causes a ReferenceError only on the --gemini code path, not Claude/OpenCode installs."
  source: "Phase 24, Quality Verification Research"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-10"

- finding: "Phase 24 untested lib modules confirmed: config.cjs (162 lines, 3 exported functions), frontmatter.cjs (299 lines), template.cjs (222 lines), core.cjs (438 lines). Only partial coverage of core.cjs via phase.test.cjs (comparePhaseNum + normalizePhaseName). None of these 4 modules appears in bun test --coverage output -- they are not imported by any test file (except the 2 functions from core.cjs). All test files for these modules must be created as .test.cjs and import via '../get-stuff-done/bin/lib/XXXX.cjs'."
  source: "Phase 24, Quality Verification Research"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-10"

- finding: "Phase 24 assets/ not in npm package: package.json 'files' array contains [bin, commands, get-stuff-done, agents, hooks/dist, scripts, src]. The 'assets/' directory is NOT included. This means brand assets (SVG, PNG) are only available in the git repo, not in the installed npm package. The Phase 24 QUAL-01 criterion 'installer deploys them' needs a decision: is this intentional (assets are repo-only, not needed at runtime) or a gap?"
  source: "Phase 24, Quality Verification Research"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-10"

- finding: "Phase 24 test suite status (2026-03-10 run via coverage): 822 pass, 3 fail (down from 4 fail in Phase 23 -- likely timing variance on Windows spawn tests). Full suite takes ~240 seconds. installer.test.js alone: 31 pass in 32s. state.test.cjs: 12 pass in 8s. Hooks tests time out after 60s (timeout in bun test call, not test timeout). Run individual test files to avoid full-suite timeout issues."
  source: "Phase 24, Quality Verification Research"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-10"

- finding: "Phase 29 upstream install.js path resolution: single __dirname usage at line 4062 -- 'const src = path.join(__dirname, '..')'. All file operations resolve from src (the package root). The composed dist/ must have: dist/bin/install.js, dist/get-shit-done/, dist/agents/, dist/commands/gsd/, dist/hooks/dist/, dist/package.json, dist/CHANGELOG.md. No other __dirname usages exist in the file."
  source: "Phase 29, Prototype Gate Research"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-27"

- finding: "Phase 29 Windows os.homedir() behavior: os.homedir() is cached at Node.js startup and does NOT respect the HOME env var on Windows. Setting process.env.HOME = 'C:/test_home' has no effect on os.homedir() output. The correct cross-platform test isolation mechanism is the --config-dir flag, which takes top priority in upstream's getGlobalDir() before os.homedir() is consulted. CLAUDE_CONFIG_DIR env var also works as the second priority."
  source: "Phase 29, Prototype Gate Research"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-27"

- finding: "Phase 29 non-interactive install guarantee: when args include both a runtime flag (--claude) and a location flag (--global), upstream's main logic at lines 4987-4995 calls installAllRuntimes(runtimes, isGlobal, false) with isInteractive=false. Zero readline prompts are created. TTY check (process.stdin.isTTY) is also bypassed by the flag path. subprocess call with ['--claude', '--global', '--config-dir', tmpDir] is fully non-interactive."
  source: "Phase 29, Prototype Gate Research"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-27"

- finding: "Phase 29 branding scope: 'get-shit-done-cc' (with -cc suffix) appears in user-visible text: WSL error message (line 120), help text examples (line 331), GSD_CODEX_MARKER (line 17), GSD_COPILOT_INSTRUCTIONS_MARKER (line 21). Bare 'get-shit-done' (without -cc) appears ~130 times in path.join() calls, directory names, and internal logic -- must NOT be replaced. Branding is safe for Claude-only prototype (CODEX and COPILOT markers not triggered by --claude)."
  source: "Phase 29, Prototype Gate Research"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-27"

- finding: "Phase 29 upstream package structure (v1.30.0): files array = [bin, commands, get-shit-done, agents, hooks/dist, scripts]. Zero production dependencies (pure Node.js). get-shit-done/bin/lib/ contains 17 CJS modules. hooks/dist/ contains 5 bundled hook files. Upstream has GSD_TEST_MODE guard at line 4923 that exports internals when set -- useful for unit testing upstream functions in isolation."
  source: "Phase 29, Prototype Gate Research"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-27"

- finding: "Phase 30 upstream branding scope: only 11 of 225 upstream files contain branding targets (get-shit-done-cc, TACHES/TÂCHES, glittercowboy). Bare 'get-shit-done' (no -cc) appears 29 times in install.js as internal path identifiers. The scope:'text' rule is implemented via pattern specificity -- brand 'get-shit-done-cc' (with -cc), never bare 'get-shit-done'. The two strings do not overlap in upstream code."
  source: "Phase 30, Composition Pipeline Research"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"

- finding: "Phase 30 overlay/ does not yet exist. dist/ is not in .gitignore yet. Both must be created/updated at the start of Phase 30 before any compose run. overlay/ scaffold contains: branding.json, features.json, overrides/.gitkeep -- no fork code yet (fork code porting is Phase 32)."
  source: "Phase 30, Composition Pipeline Research"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"

- finding: "Phase 30 update.md exception: line 149 'npm view get-shit-done-cc version' should NOT be branded. It intentionally queries the upstream npm package name for version checking. Branding it to '@chude/get-stuff-done' would break the update workflow (fork is a different npm package). Document this as an intentional exception."
  source: "Phase 30, Composition Pipeline Research"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"

- finding: "Phase 30 pipeline pattern: manifest-based file tracking where each stage receives and returns a state object {manifest, branding, features, warnings}. Each ManifestEntry has: sourcePath, destPath (relative in dist/), content (modified or null), action ('copy'|'brand'|'override'|'overlay'|'skip'), stage. --dry-run is implemented by skipping MERGE stage writes, not by a special dry-run code path through all stages."
  source: "Phase 30, Composition Pipeline Research"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"
