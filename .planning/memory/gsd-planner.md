---
agent: gsd-planner
updated: 2026-02-23
entries: 16
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
