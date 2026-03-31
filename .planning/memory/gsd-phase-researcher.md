---
agent: gsd-phase-researcher
updated: 2026-03-29
entries: 69
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
  status: superseded
  superseded_by: "overlay/ now exists with full fork code (Phase 32 complete). dist/ is in .gitignore."

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

- finding: "Phase 31 upstream v1.30.0 category-to-directory mapping: workflows at get-shit-done/workflows/ (56 files), commands at commands/gsd/ (57 files), agents at agents/ (18 files), hooks at hooks/dist/ (5 files, all .js). No sdk/ directory exists in v1.30.0. Exclude entries use basename without extension for matching."
  source: "Phase 31, Feature Flags & Override System Research"
  confidence: HIGH
  phase: "31-feature-flags-override-system"
  date: "2026-03-28"

- finding: "Phase 31 AJV pattern: reuse the same Ajv instance (already created for BRANDING_SCHEMA) to compile FEATURES_SCHEMA. Both schemas use strict:true mode and additionalProperties:false. The features.json runtimes section uses additionalProperties: { type: 'boolean' } (open-ended keys) while category sections use fixed properties with required arrays."
  source: "Phase 31, Feature Flags & Override System Research"
  confidence: HIGH
  phase: "31-feature-flags-override-system"
  date: "2026-03-28"

- finding: "Phase 31 overrides directory: currently contains only .gitkeep (verified). The overrides/ directory is at project root level, NOT inside overlay/. Override relPaths mirror upstream paths exactly (overrides/lib/config.cjs replaces upstream lib/config.cjs). Companion REASON.md uses pattern: override_path + '.REASON.md' appended to full filename."
  source: "Phase 31, Feature Flags & Override System Research"
  confidence: HIGH
  phase: "31-feature-flags-override-system"
  date: "2026-03-28"

- finding: "Phase 32 fork code inventory: 3,527 lines source code (sync.cjs 1420, platform/ 613, theme/ 395, validation/ 191, config/ 449, launcher 211, hooks 248) + 2,576 lines commands/workflows/agents (upstream.md 418, workflows 1186, agents 972). Total ~6,100 lines across ~25 files."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 critical PORT-08 design: fork's core.cjs (get-stuff-done/bin/lib/core.cjs) has require('../../../src/validation') at line 8 -- a direct modification of upstream file. In overlay architecture, this must NOT exist. Upstream core.cjs stays untouched. Validation module lives in overlay/src/validation/. The validation integration was additive security hardening; in v3.0 it applies at the overlay calling level (hooks, launcher, sync.cjs), not inside upstream's core module."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 hooks porting scope: only pre-compact.js and pre-compact.sh are fork-only hooks. gsd-statusline.js, gsd-check-update.js, and gsd-context-monitor.js all exist in upstream hooks/dist/ (verified). Fork has modified source versions but these are bundled artifacts. Zero overrides on day one means accepting upstream hooks for v3.0."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 overlay additive file merge: compose.js lines 781-797 walk overlay/ directory, skip metadata files (branding.json, features.json, .gitkeep), and copy all other files to dist/ preserving relative paths. No code changes to compose.js needed for overlay files to appear in dist/."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 sync.cjs router wiring problem: fork's gsd-tools.cjs has require('./lib/sync.cjs') and handles sync-preview/sync-checkpoint commands. Upstream router does NOT have this. Sync commands are fork-only. Solution: create overlay/bin/sync-tools.cjs as separate CLI entry point, update upstream-sync.md workflow to call it instead of gsd-tools.cjs for sync operations."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 ConfigLoader/ConfigSchema are ENTIRELY fork-specific (manage ~/.gsd/config.json with JSON5+AJV). Upstream's config.cjs (get-shit-done/bin/lib/config.cjs) manages .planning/config.json -- different system entirely. No wrapper/extension needed. Fork config modules move to overlay/src/config/ as-is with only internal import path adjustments."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 32 test import paths: 9 test files (8,120 lines) need import path updates. All changes are prefix swaps: ../src/ -> ../overlay/src/, ../get-stuff-done/bin/lib/ -> ../overlay/lib/ for sync. Test frameworks (bun:test, node:test) and assertions unchanged. Test files stay in tests/ at project root."
  source: "Phase 32, Fork Code Port Research"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Phase 33 upstream install.js has exactly 10 process.exit() calls (lines 122, 303, 313, 332, 4329, 4772, 4847, 4974, 4977, 4981). The CONTEXT.md stated 15 -- actual count is 10. The principle (subprocess delegation, not require) still holds regardless of exact count."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 overlay-only files in dist/: exactly 32 files that exist in dist/ but NOT in upstream (node_modules/get-shit-done-cc/). These include: .install-meta.json, agents/general-purpose.md, agents/gsd-oversight-*.md (3), bin/sync-tools.cjs, bin/validate-configs.js, commands/gsd/upstream.md, CREDITS.md, hooks/pre-compact.*, lib/sync.cjs, memory/*.md (2), src/config/* (3), src/platform/* (3), src/theme/* (4), src/validation/index.js, teams/*.md (4), workflows/set-profile.md, workflows/upstream-sync.md."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 v2.x .install-meta.json format (from actual get-stuff-done/.install-meta.json): has 'version' (2.4.0), 'installType' (link), 'installedAt', 'platform' object (os, arch, shell, isMingw, nodeVersion), 'installMethod' object (method, reason). NO overlay_version field. v3.0 format (from dist/.install-meta.json): has 'upstream_version', 'overlay_version', 'composed_at', 'features_disabled', 'overrides_applied', 'branding_rules_applied'. The two formats have ZERO overlapping field names -- detection is unambiguous."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 upstream uninstall() function (line 3300): does NOT wipe the target directory. It removes files category by category: commands, skills, agents, hooks, settings, get-shit-done/. This is runtime-specific (different paths for Claude vs OpenCode vs Codex vs Copilot). The fork's --uninstall can be simpler: wipe the entire target directory per CONTEXT.md decision."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 composed dist/bin/install.js is 5,008 lines (same as upstream). The branding is applied at compose time. The dist/ directory is a complete self-contained package root that upstream's install.js can operate on via its __dirname resolution. dist/ has: bin/, get-shit-done/, agents/, commands/gsd/, hooks/dist/, scripts/, package.json, plus overlay additions."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 supply chain scanning for preview-update: runSupplyChainChecks() expects git diff format (lines starting with +/-). For npm version delta, the function needs either a synthetic diff or limiting to file-path-based checks only. Checks 3 (execution-path) and 6 (author-anomaly) work with file lists only. Checks 1, 2, 4, 5 need diff content. For preview-update v1, recommend file-list checks + dependency diff from package.json comparison."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 33 test patterns: prototype-installer.test.js (Phase 29) established the subprocess test pattern: setupScratchDir() copies upstream to tmp, runUpstreamInstaller() uses execSync with --config-dir for isolation, applyBranding() does surface text replacement, copyOverlayAdditions() layers fork files. This is the template for installer-v3.test.js."
  source: "Phase 33, Installer & Update Workflow Research"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Phase 34 upstream test assertion categorization: 1,387 assertions across 12 .test.cjs files. 3 (0.22%) reference fork package names, ~24 (1.7%) reference source paths needing redirection, ~1,360 (98.1%) are purely behavioral. Feasibility gate PASSES -- far below 30% threshold."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"

- finding: "Phase 34 coverage baseline: bun test reports 91.53% functions / 90.45% lines overall. Three files cause the gap: overlay/lib/sync.cjs (1,420 lines, 3.57% funcs / 5.29% lines -- dist-relative import blocker), scripts/preview-update.js (417 lines, 10% funcs / 7.81% lines), scripts/compose.js CLI entry (1,084 lines, 85.29% funcs / 87.73% lines). All overlay/src/ files are 96%+ already."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"

- finding: "Phase 34 sync.cjs coverage fix strategy: create a symlink get-shit-done/ -> get-stuff-done/ at project root during testing. This makes overlay/lib/sync.cjs's require('../get-shit-done/bin/lib/core.cjs') resolve to the existing get-stuff-done/bin/lib/core.cjs. No code changes to sync.cjs needed. Alternative: conditional import with try/catch. Symlink is cleaner."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"

- finding: "Phase 34 compat runner design: symlink-based path redirection in temp directory. Tests require from get-stuff-done/bin/lib/ -> symlinked to dist/get-shit-done/bin/lib/. helpers.cjs TOOLS_PATH also resolves through the symlink. Windows needs 'junction' type for directory symlinks (no admin required). sync.test.cjs excluded from compat (fork-specific module, not upstream verification)."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"

- finding: "Phase 34 CI structure: existing ci.yml has 3 jobs (lint, test matrix on 3 OSes, parity check). Phase 34 extends with: fork-tests (replaces test), upstream-compat (new, requires compose first), boundary-override-check (new, fast single-OS job). Boundary and override checks are fast (~1s) and don't need OS matrix."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"

- finding: "Phase 34 bun coverage metrics: bun 1.3.5 reports % Funcs and % Lines only (not statements/branches separately). For WoW 95% per-metric requirement, lines ~= statements (counts executable lines). Branch coverage needs lcov output parsing or acceptance that high line+function coverage implies reasonable branch coverage."
  source: "Phase 34, Testing & CI Enforcement Research"
  confidence: MEDIUM
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"
