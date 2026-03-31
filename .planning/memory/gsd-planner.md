---
agent: gsd-planner
updated: 2026-03-29
entries: 26
---

- finding: "GSD has ~15 JS files (~6,850 lines) as testable surface. The installer (bin/install.js) alone is 1,760 lines and deserves its own dedicated plan due to complexity (symlink fallback chains, runtime detection, settings.json manipulation)."
  source: "Phase 11, planning"
  confidence: HIGH
  phase: "11-ci-cd"
  date: "2026-02-16"

- finding: "Hook files (gsd-check-update.js, gsd-statusline.js, pre-compact.js) are executable scripts with shebangs but no module.exports. They must be tested via child process execution or env-gated require, not direct module import."
  source: "Phase 11, codebase analysis"
  confidence: HIGH
  phase: "11-ci-cd"
  date: "2026-02-16"

- finding: "Existing gsd-tools.test.js (599 lines, 19 tests) uses Node.js native test runner (node:test + node:assert). Migration to bun:test requires replacing assert.* with expect.* and test runner imports."
  source: "Phase 11, Plan 01 design"
  confidence: HIGH
  phase: "11-ci-cd"
  date: "2026-02-16"
  status: superseded
  superseded_by: "gsd-tools.test.js now uses bun:test after Phase 11 migration"

- finding: "For CI/CD phases, vertical slicing does not apply well. The natural dependency is horizontal: infrastructure (Wave 1) -> tests by module area (Wave 2, parallel) -> CI pipeline (Wave 3). Forcing vertical slices would create artificial coupling between unrelated test suites."
  source: "Phase 11, dependency analysis"
  confidence: HIGH
  phase: "11-ci-cd"
  date: "2026-02-16"

- finding: "Gap closure phases with well-researched fixes (confirmed approach, verified code examples) compress to single-plan phases. Phase 13 hook bundling: 1 plan, 2 tasks (build script rewrite + dist tests), ~30% estimated context. Research-first approach paid off -- no discovery needed, no architectural decisions pending."
  source: "Phase 13, planning"
  confidence: HIGH
  phase: "13-hook-bundling"
  date: "2026-02-18"

- finding: "Security wiring phases that involve API breaking changes (exception-to-Result migration) need the module change + test rewrite as Wave 1 before any production wiring in Wave 2. The wiring plan depends on the new API being stable and tested. Attempting to wire and migrate simultaneously risks integration test confusion (testing against old vs new API)."
  source: "Phase 14, dependency analysis"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "GSD_CONFIG_PATH env var is in src/config/ConfigLoader.js (not gsd-tools.js). Research documents may reference injection points in one file that actually live in another. Always grep the full codebase to verify before planning -- do not trust research line numbers alone."
  source: "Phase 14, codebase verification"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "Phase 15 planning confirmed the pattern from Phase 13: identical gap closure (esbuild bundle for copy-mode install) compresses to 1 plan, 2 tasks. The gsd-tools.js frontmatter validate and verify plan-structure commands are NOT in the source gsd-tools.js (they may only exist in the installed version or a newer upstream). Plan validation must be done manually or skipped when commands are unavailable."
  source: "Phase 15, planning"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "CONTEXT.md decisions override research recommendations. Phase 15 research suggested separate build-tools.js, but CONTEXT.md locked a build consolidation decision (git mv build-hooks.js to build.js, unified script). The first plan revision missed this entirely by following research instead of CONTEXT.md. When re-planning, always re-read CONTEXT.md decisions section FIRST, then check the existing plan against each locked decision. Cascade effects matter: renaming build-hooks.js also requires updating hooks.test.js beforeAll and package.json build:hooks script name."
  source: "Phase 15, plan revision"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "Coverage gap closure where the root cause is a test-runner limitation (bun 1.3.5 re-require coverage attribution) follows a different pattern than normal test writing. The fix is structural: export internal functions, rewrite tests to call them directly in same module-load context. This is a 1-plan phase because all source changes are small (adding exports) and all test changes target the same test file. The key risk is the test file growing large (1392 lines already + ~30 new tests), but since each test is formulaic (mockPlatform + set env + call internal + assert + restore), context usage stays moderate."
  source: "Phase 16, planning"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-21"

- finding: "Documentation-only phases (workflow markdown modifications with no JS/test changes) are the simplest gap closure pattern. Phase 17: 4 workflow files get additive sections, zero test risk (no tests reference workflow .md files), zero code risk (only markdown changes). Can compress to 1 plan, 2 tasks grouped by workflow similarity (subagent-based workflows vs non-standard workflows). Key insight: verify no tests reference the files being modified before committing to the zero-regression assumption."
  source: "Phase 17, planning"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-22"

- finding: "Upstream sync phases are inherently sequential (each batch depends on the previous) -- parallelism is impossible. Plan structure should follow batch groupings sized by risk and context budget, not by wave optimization. Phase 18: 106 remaining commits split into 5 sequential plans by risk profile -- Batch 6 alone (30 commits, HIGH risk with the 12-PR revert) gets a dedicated plan, while the safer Batches 9-11 (49 commits, MED risk) are grouped into one plan. The module split (11 commits, VERY HIGH risk) always gets its own plan regardless of size."
  source: "Phase 18, planning"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "When planning a large upstream sync, the commit count visible in git (185 main..upstream/main) may include commits already applied in a previous sync phase. Phase 8 applied v1.9.13..v1.18.0 (79 commits) via cherry-pick, but since cherry-picks don't move the merge-base, git still shows 185. The actual remaining work is v1.18.0..upstream/main (106 commits). Always verify the effective starting point by checking the previous sync's target tag, not the git merge-base."
  source: "Phase 18, planning analysis"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-22"

- finding: "Post-sync stabilization phases with well-researched fixes decompose naturally into fully parallel plans when the work streams are independent. Phase 19: 3 plans all in Wave 1 -- build pipeline fix (3 files, SYNC-II-03), assessment reports (2 new markdown files, ASSESS-01/02), and coverage migration (1 test file). Zero file overlap means full parallelism. The pattern: code fix + documentation + test quality each get their own plan."
  source: "Phase 19, planning"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "gsd-tools frontmatter validator (frontmatter.cjs) uses regex /^---\\n/ which does not match CRLF line endings. On Windows, files written by the Write tool have CRLF, causing the validator to report all frontmatter fields as missing even when they are present and correct. The plan structure validator (task detection) works because it uses a different parsing approach. This is a pre-existing bug -- plans are valid, validator is broken on Windows."
  source: "Phase 19, plan validation"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-23"

- finding: "UAT gap closures for minor issues (CLI flags, directory cleanup) compress to a single plan with 2 small tasks. Phase 18 UAT had 2 minor gaps: (1) gsd-tools --help flag missing from CLI router -- straightforward switch case + stdout write, (2) upstream branding in opencode/ directory -- delete entire dir since fork is Claude Code-only per REQUIREMENTS.md Out of Scope. Both tasks together are ~15% context. Key decision: deletion over rebranding when the feature is explicitly out of scope."
  source: "Phase 18, gap closure planning"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-23"

- finding: "Plumbing/porcelain phases (new CLI module + workflow enhancements) decompose into 2 sequential plans: Wave 1 creates the plumbing module with CLI commands and tests, Wave 2 wires the porcelain (workflow markdown modifications that call the CLI commands). This is NOT horizontal layering -- it is a genuine dependency: the workflow must reference commands that exist. Phase 20: Plan 01 creates sync.cjs (12th domain module) with 4 CLI commands + router + tests; Plan 02 enhances upstream-sync.md workflow with 4 targeted stage modifications. The split keeps code+tests (Plan 01, ~40% context) separate from markdown workflow edits (Plan 02, ~25% context), staying well within budget."
  source: "Phase 20, planning"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

- finding: "Milestone gap closure phases that combine source fixes + documentation fixes + build + verification fit in a single plan when the research has already confirmed exact code changes. Phase 23: 8 gaps, 1 plan, 3 tasks (~35% context). Task ordering is critical: source fixes first (ConfigLoader, statusline), then documentation + dist rebuild (needs source fixes applied before build), then verification last (must verify final state). The research code examples were precise enough to use directly in task actions -- no discovery needed."
  source: "Phase 23, planning"
  confidence: HIGH
  phase: "23-v030-gap-closure"
  date: "2026-03-08"

- finding: "Quality verification phases with mixed work types (bug fixes, UAT, test coverage) decompose into fully parallel plans when work streams touch different files. Phase 24: 4 plans all in Wave 1 -- bug fix + logo UAT (bin/install.js + checkpoint), sync UAT (no files modified, checkpoint), config+frontmatter TDD (2 test files), template+core TDD (2 test files). Zero file overlap across all 4 plans enables full Wave 1 parallelism. The pattern: group by concern similarity (bug+UAT-visual, UAT-sync, tests-small-modules, tests-large-modules) not by requirement ID. Also: existing tests/config.test.js covers src/config/ConfigLoader.js (Phase 7+ infrastructure), NOT bin/lib/config.cjs (Phase 18 modular split) -- verify no naming collisions when creating new test files."
  source: "Phase 24, planning"
  confidence: HIGH
  phase: "24-quality-verification-bug-fixes"
  date: "2026-03-10"

- finding: "Go/no-go gate phases with thorough research (HIGH confidence, verified source analysis) compress to 1 plan, 2 tasks. Phase 29: Task 1 scaffolds infrastructure (devDep + test helpers), Task 2 fills in integration tests. All three PROTO requirements share the same test file and scratch directory setup -- splitting by requirement would create artificial coupling. The gsd-tools commit command has quoting issues with multi-word messages on Windows; use git directly for commits during planning."
  source: "Phase 29, planning"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "TDD-heavy composition pipeline phases split naturally along the branding-engine/pipeline boundary. Plan 01 (branding engine TDD) is a self-contained pure-function system testable with in-memory strings -- ~30% context. Plan 02 (pipeline stages + CLI) depends on Plan 01's exports but is a genuine dependency (the brand() stage calls applyBrandingToContent from Plan 01). The pipeline is a single TDD task because all 5 stages share the same ManifestEntry type and pipeline state -- splitting would force repeated type definitions. Key sizing signal: the research provided complete code patterns for both plans, so GREEN phase is mechanical implementation rather than design. COMP-11 (TDD requirement) appears in both plans because each has its own test file."
  source: "Phase 30, planning"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"

- finding: "When a pipeline function generates outputs additively (outside the manifest/tracked-files pattern), delta/diff tools that only check manifest entries will miss them. Phase 30 gap: computeDelta() tracked manifest files but not CREDITS.md and .install-meta.json which merge() writes directly. The fix pattern: after iterating manifest, enumerate known additive outputs by calling the same generation functions (generateCredits, meta object construction) and compare against dist/. Remove any special-case exclusions that were workarounds for the missing tracking. This is a single-plan, 2-task TDD gap closure (~15% context)."
  source: "Phase 30, gap closure planning"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"

- finding: "Pipeline stub replacement phases (replacing pass-through stubs with real logic) split along file ownership: plans touching the same source+test files are sequential, while standalone new scripts can run in parallel. Phase 31: filter() and override() both modify compose.js and compose.test.js, so Plans 01 and 02 must be sequential (Wave 1, Wave 2). check-overrides.js is standalone (separate script + test file, no compose.js imports per CONTEXT.md decision) so Plan 03 runs in Wave 1 parallel with Plan 01. The dependency between Plans 01 and 02 is genuine: override() processes manifest entries that filter() may have already excluded, and both modify the same meta properties. The research's 3-plan suggestion was correct but the wave assignment needed the file-overlap analysis to get right."
  source: "Phase 31, planning"
  confidence: HIGH
  phase: "31-feature-flags-override-system"
  date: "2026-03-28"

- finding: "Code porting phases (moving files from one directory to another with import path updates) have a natural 2-wave structure when there are internal dependencies: Wave 1 moves leaf modules (no fork-internal deps) in parallel plans, Wave 2 moves dependent modules (config depends on validation, hooks depend on platform). The key parallelism signal is dependency direction: sync.cjs depends on UPSTREAM core.cjs (not other fork modules), so it can run in Wave 1 parallel with leaf modules despite being a large file. Research should be verified against actual codebase -- Phase 32 research listed 5 agents under overlay/agents/ but the fork actually has 2 agents in memory/ and 4 teams in teams/, and no commands/gsd/upstream.md command file exists. Always diff upstream vs fork directories to identify true fork-only additions."
  source: "Phase 32, planning"
  confidence: HIGH
  phase: "32-fork-code-port"
  date: "2026-03-29"

- finding: "Installer + update workflow phases with two independent subsystems (installer vs preview-update) decompose into 2 parallel TDD plans with zero file overlap. Plan 01 (installer) touches bin/install.js + compose.js (manifest generation) + tests/installer-v3.test.js. Plan 02 (preview-update) touches scripts/preview-update.js + tests/preview-update.test.js. Both Wave 1. The compose.js modification (adding .overlay-manifest.json generation) belongs in the installer plan because the installer is the consumer. The preview-update plan has no dependency on the manifest -- it reads package.json for version info and invokes existing check-overrides.js and sync.cjs exports. Key decision: the research recommendation to have compose.js generate a manifest (rather than hardcoding an overlay file list or diffing at install time) is the right approach -- makes the installer deterministic and avoids expensive file comparison at install time."
  source: "Phase 33, planning"
  confidence: HIGH
  phase: "33-installer-update-workflow"
  date: "2026-03-29"

- finding: "Testing+CI phases decompose into 3 Wave 1 parallel plans + 1 Wave 2 CI plan. The parallelism comes from file ownership isolation: Plan 01 (sync.cjs tests) touches only tests/sync.test.cjs, Plan 02 (new scripts) creates scripts/check-boundary.js + scripts/run-upstream-compat.js + tests/check-boundary.test.js, Plan 03 (coverage gaps) touches only existing test files (compose.test.js, preview-update.test.js, check-overrides.test.js). Plan 04 (CI workflow) depends only on Plan 02 (needs the scripts to exist in ci.yml). The CI phase follows the Phase 11 horizontal pattern: infrastructure first, then CI wiring. TEST-02 (assertion categorization) was completed entirely during research -- assigned to Plan 02 because the compat runner design depends on it. sync.cjs coverage requires a symlink shim approach (get-shit-done -> get-stuff-done at project root) because its import path targets dist/ layout by design."
  source: "Phase 34, planning"
  confidence: HIGH
  phase: "34-testing-ci-enforcement"
  date: "2026-03-29"
