---
agent: gsd-phase-researcher
updated: 2026-02-23
entries: 25
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

- finding: "The rename commit (24b933e in v1.19.2 batch) renames get-shit-done/bin/gsd-tools.js to get-shit-done/bin/gsd-tools.cjs. When cherry-picked to fork, it will rename get-stuff-done/bin/gsd-tools.js to get-stuff-done/bin/gsd-tools.cjs. This is CORRECT — fork adopts .cjs extension. All 48 reference sites across agents/, commands/, get-stuff-done/ then need updating from gsd-tools.js to gsd-tools.cjs."
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
