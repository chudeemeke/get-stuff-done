---
agent: gsd-verifier
updated: 2026-03-30
entries: 39
---

## Agent Memory: GSD Verifier

entries:
  - finding: "Phase 11 uses bun:test as the test runner. Tests are in tests/ directory. Run with `bun test` or `bun test --coverage`."
    source: "Phase 11, Plan 01, Task 1"
    confidence: HIGH
    phase: "11-ci-cd"
    date: "2026-02-18"

  - finding: "Coverage success criteria in ROADMAP.md do NOT specify coverage thresholds. The 95% threshold is a WoW standard but is not a Phase 11 success criterion. Coverage gaps documented in UAT/11-06 are platform-limited (detect.js, terminal.js) and NOT blockers for phase goal achievement."
    source: "Phase 11, UAT, Plan 06"
    confidence: HIGH
    phase: "11-ci-cd"
    date: "2026-02-18"

  - finding: "The Bash tool is unavailable in this environment (exits with code 1 or 2 on simple commands). Use Read, Glob, and Grep tools for all artifact verification. File existence must be confirmed via Glob, not ls."
    source: "Phase 11 verification session"
    confidence: HIGH
    phase: "11-ci-cd"
    date: "2026-02-18"

  - finding: "Paths with spaces (iCloudDrive path) work with Glob and Read tools but require the full absolute path with spaces. The C:/Users/Destiny/Projects/ symlink path does NOT resolve in this session - use the full iCloudDrive path."
    source: "Phase 11 verification session"
    confidence: HIGH
    phase: "11-ci-cd"
    date: "2026-02-18"

  - finding: "Anti-pattern scan on test files: no TODOs, FIXMEs, empty implementations, or placeholder returns found. Test files are substantive and import the correct production modules."
    source: "Phase 11 verification session"
    confidence: HIGH
    phase: "11-ci-cd"
    date: "2026-02-18"

  - finding: "When dist/generated artifacts are gitignored, verify them by: (1) checking the build script's options are correct (bundle:true, no external), (2) checking tests auto-build and verify the dist files, (3) checking package.json files array includes the dist dir, (4) checking prepublishOnly runs the build script."
    source: "Phase 13 verification"
    confidence: HIGH
    phase: "13-hook-bundling"
    date: "2026-02-18"

  - finding: "C:/Users/Destiny/Projects/ symlink DOES resolve in this session for Read and Grep tools (confirmed: successfully read files at C:/Users/Destiny/Projects/get-stuff-done/). Glob tool does NOT find files in hooks/ subdirectory (returns 'No files found' for hooks/*.js and hooks/**). Use Read directly with known paths."
    source: "Phase 13 verification"
    confidence: HIGH
    phase: "13-hook-bundling"
    date: "2026-02-18"

  - finding: "For esbuild bundling verification without running the build: (1) confirm bundle:true in buildSync call, (2) confirm no 'external' option, (3) confirm platform:'node', (4) verify tests exercise the output files with behavioral assertions (not just existence checks), (5) confirm the build is run in prepublishOnly so it ships in npm."
    source: "Phase 13 verification"
    confidence: HIGH
    phase: "13-hook-bundling"
    date: "2026-02-18"

  - finding: "For validation wiring verification: the critical check is not just that validators exist in the module, but that (1) production files require() the module, (2) the returned value (result.value) is used at call sites (not fire-and-fire), and (3) integration tests assert structural wiring exists (import + call site) as orphan prevention."
    source: "Phase 14 verification"
    confidence: HIGH
    phase: "14-security-wiring"
    date: "2026-02-20"

  - finding: "Bash tool IS available in Phase 14 session (ls commands executed successfully). The Phase 11 finding that Bash was unavailable was session-specific. Test Bash availability at start of each session."
    source: "Phase 14 verification"
    confidence: MEDIUM
    phase: "14-security-wiring"
    date: "2026-02-20"

  - finding: "REQUIREMENTS.md traceability table may show requirements as 'Phase 7 | Complete' even when Phase 14 actually closes the gaps. The ROADMAP.md success criteria and CONTEXT.md are the authoritative sources for what Phase 14 must deliver -- not REQUIREMENTS.md traceability which may predate the gap analysis."
    source: "Phase 14 verification"
    confidence: HIGH
    phase: "14-security-wiring"
    date: "2026-02-20"

  - finding: "npm pack --dry-run is the definitive check for whether gitignored dist files will ship in the npm package. When a directory (e.g. 'get-stuff-done') is listed in package.json files array, npm includes ALL contents of that directory including gitignored subdirectories. A separate explicit entry (like 'hooks/dist') is only needed when the parent directory is NOT in the files array."
    source: "Phase 15 verification"
    confidence: HIGH
    phase: "15-gsd-tools-bundling"
    date: "2026-02-20"

  - finding: "For build script unification verification: check (1) old script name no longer exists in scripts/, (2) git mv is evident from commit stat (deleted old, created new), (3) new unified script handles all previous targets plus new ones, (4) all test files that referenced the old script name are updated, (5) package.json scripts entry uses new name."
    source: "Phase 15 verification"
    confidence: HIGH
    phase: "15-gsd-tools-bundling"
    date: "2026-02-20"

  - finding: "For bun 1.3.5 coverage gap closures: coverage numbers reported by `bun test --coverage tests/specific-file.test.js` are per-file isolation numbers. The git-unavailable branch in detect.js (lines 183-187) shows as uncovered in isolation but IS covered by the full suite via a separate test file that uses cache-clear + re-require. Verify with `bun test` (full suite) to confirm no regressions, and verify coverage targets in isolation to confirm the direct-call test file achieves its goals."
    source: "Phase 16 verification"
    confidence: HIGH
    phase: "16-platform-quality"
    date: "2026-02-20"

  - finding: "The underscore-prefixed internal export pattern (_detectShell, _detectEnvironment etc.) is the correct way to expose internal helpers for testability in this codebase. When verifying: check module.exports block for _prefix keys aliasing the internal function declarations (not renamed declarations). The PLAN must_haves artifacts section specifies 'contains: _detectShell' as the verification key."
    source: "Phase 16 verification"
    confidence: HIGH
    phase: "16-platform-quality"
    date: "2026-02-20"

  - finding: "For workflow markdown file verification (Phase 17 pattern): grep is the primary tool. Key checks: (1) grep -c for exact XML tag presence, (2) grep for team template filename references, (3) grep for config read patterns, (4) grep for env flag references, (5) grep for fallback text. Anti-pattern grep on workflow files will produce false positives if the file's own content contains grep-target words (e.g., verify-phase.md contains its own stub detection code with 'placeholder'). Distinguish pre-existing content from new additions."
    source: "Phase 17 verification"
    confidence: HIGH
    phase: "17-agent-teams-wiring"
    date: "2026-02-20"

  - finding: "When config.json has nested teams structure with both memory.enabled and teams.enabled, grep for 'enabled' will return multiple matches. Use node -e or python3 (when available) to parse JSON correctly. In this project, node IS available (bun test uses it) -- use `node -e 'const c = JSON.parse(require(\"fs\").readFileSync(...))'` when python3 is missing."
    source: "Phase 17 verification"
    confidence: HIGH
    phase: "17-agent-teams-wiring"
    date: "2026-02-20"

  - finding: "For bundling verification with a modular CJS structure (Phase 18/19 pattern): the definitive test is copy-mode isolation -- `cp dist/bundle.cjs /tmp/isolated/` then `node /tmp/isolated/bundle.cjs <command>`. If it executes without MODULE_NOT_FOUND, the bundle is truly self-contained. Also check `grep -c 'require.*\\./lib/'` on the bundle file (should be 0)."
    source: "Phase 19 verification"
    confidence: HIGH
    phase: "19-post-sync-stabilization"
    date: "2026-02-23"

  - finding: "bun 1.3.5 coverage attribution fix: removing ALL `delete require.cache` instances for a module (even just 1 remaining) is required to fix coverage attribution. The last re-required instance overwrites the full module coverage in bun's V8 aggregation. Zero re-require instances is the only reliable fix -- even 1 remaining causes the whole module's coverage to be mis-attributed."
    source: "Phase 19 verification (19-03-SUMMARY.md)"
    confidence: HIGH
    phase: "19-post-sync-stabilization"
    date: "2026-02-23"

  - finding: "Phase 19 pattern: assessment reports (ASSESS-01, ASSESS-02) are documentation artifacts in the phase directory, not code. Verification checks: (1) file exists and has min_lines, (2) all required sections present via grep, (3) concrete recommendation stated (not vague). The report content cannot be auto-tested but the structure can be verified structurally."
    source: "Phase 19 verification"
    confidence: HIGH
    phase: "19-post-sync-stabilization"
    date: "2026-02-23"

  - finding: "For phases with a plumbing/porcelain split (Phase 20 pattern): verify both layers. Plumbing layer (lib/*.cjs): exports, substantive implementation, wired to router. Porcelain layer (workflow .md): grep for CLI command names in the correct stage positions. The porcelain layer's correctness is structural (grep-verifiable) but behavioral correctness requires human UAT."
    source: "Phase 20 verification"
    confidence: HIGH
    phase: "20-sync-safety-transparency"
    date: "2026-02-23"

  - finding: "spawnGit() vs execGit() cross-platform pattern: when verifying git-based modules on Windows MINGW64, check whether special-char git args (%, |, ^, * glob, multi-word -m messages) use spawnSync array form (spawnGit) rather than execGit's shell-string form. The spawnGit pattern is the correct fix for Windows MINGW64 shell escaping failures. Absence of spawnGit for these operations is a cross-platform bug."
    source: "Phase 20 verification"
    confidence: HIGH
    phase: "20-sync-safety-transparency"
    date: "2026-02-23"

  - finding: "Grep tool output_mode=count returns misleading output: shows a number (e.g., '3') followed by 'Found 0 total occurrences across 0 files'. The number on the first line appears to be the match count. For reliable verification, use Bash grep -c instead of the Grep tool's count mode."
    source: "Phase 23 verification"
    confidence: HIGH
    phase: "23-v030-gap-closure"
    date: "2026-03-08"

  - finding: "For gap closure phases (Phase 23 pattern): verification is straightforward when all success criteria are programmatically verifiable. Key checks: (1) file existence via ls, (2) content verification via grep for specific strings/patterns, (3) functional verification via node -e for JS modules, (4) documentation state via checkbox/table counts. Dist bundles that are gitignored must be verified via ls + grep on disk, not via git status."
    source: "Phase 23 verification"
    confidence: HIGH
    phase: "23-v030-gap-closure"
    date: "2026-03-08"

  - finding: "For prototype/integration test phases (Phase 29 pattern): the key_link 'execSync.*install.js' grep pattern fails when execSync takes a template literal with a variable (execSync(`node \"${installScript}\"`)). Verify subprocess invocation by reading the helper function directly and confirming installScript = path.join(scratchDir, 'bin', 'install.js')."
    source: "Phase 29 verification"
    confidence: HIGH
    phase: "29-prototype-gate"
    date: "2026-03-27"

  - finding: "Anti-pattern grep for 'placeholder' on prototype test files produces false positives: the word 'placeholder' legitimately appears in copyOverlayAdditions() as the content of test fixture files (overlay placeholder content). Distinguish legitimate test fixture placeholder text from stub code placeholders by checking context (is it content being written to a file, or is it a function that returns nothing?)."
    source: "Phase 29 verification"
    confidence: HIGH
    phase: "29-prototype-gate"
    date: "2026-03-27"

  - finding: "For composition pipeline phases (Phase 30 pattern): intentional pass-through stubs (filter, override) are NOT anti-patterns when: (1) they return a fully-formed state object not null/empty, (2) they are documented in code comments with the phase that implements them, (3) the PLAN frontmatter explicitly describes them as Phase N stubs. Verify by reading the function body -- if it returns {...state, manifest: [...], warnings: [...], meta: {...}} it is a properly-wired stub, not an empty implementation."
    source: "Phase 30 verification"
    confidence: HIGH
    phase: "30-composition-pipeline-branding"
    date: "2026-03-28"

  - finding: "For multi-plan phases where one script grows across plans (compose.js in Phase 30): verify line count at the END of the phase, not per-plan. Plan 01 min_lines=N + Plan 02 min_lines=M means the combined file should be >= M (the larger requirement wins since Plan 02 adds to Plan 01). Phase 30 compose.js hit 828 lines after Plan 03 additions (well above the 200 min from Plan 02)."
    source: "Phase 30 verification"
    confidence: HIGH
    phase: "30-composition-pipeline-branding"
    date: "2026-03-28"

  - finding: "Pre-existing test failures in get-stuff-done: tests/core.test.cjs has execGit() timeout failures (Phase 24 vintage) that are Windows MINGW64-specific. These are NOT regressions from Phase 30 -- confirmed by `git log -- tests/core.test.cjs` showing last modification was in Phase 24. When full suite shows failures, always check git log for each failing file to distinguish pre-existing from new failures."
    source: "Phase 30 verification"
    confidence: HIGH
    phase: "30-composition-pipeline-branding"
    date: "2026-03-28"

  - finding: "Re-verification pattern when initial verification passed but UAT found a gap: the previous VERIFICATION.md may show status:passed even though a gap existed (UAT ran after the initial verification). In this case, treat the UAT gap as the prior status to close, extract must_haves from the gap closure plan (not the initial VERIFICATION.md), and verify both the fix AND regression of all initially-passing truths."
    source: "Phase 30 re-verification"
    confidence: HIGH
    phase: "30-composition-pipeline-branding"
    date: "2026-03-28"

  - finding: "For --diff gap closure in compose pipelines: the key indicator is whether computeDelta() tracks additive outputs (files written in merge() outside the manifest loop). Check: (1) wouldWrite.add() called for each additive output, (2) special-case exclusions removed from the removed-detection loop, (3) content comparison logic mirrors what merge() actually writes (e.g., generateCredits() for CREDITS.md content)."
    source: "Phase 30 re-verification (Plan 03)"
    confidence: HIGH
    phase: "30-composition-pipeline-branding"
    date: "2026-03-28"

  - finding: "For feature flag/override phases (Phase 31 pattern): when a phase replaces Phase 30 pass-through stubs with real implementations, verify both the implementation AND the meta propagation chain. Key checks: (1) filter() populates meta.featuresDisabled, (2) override() populates meta.overridesApplied, (3) merge() reads BOTH from state.meta for .install-meta.json output (lines 811-812). The merge() wiring is where meta propagation failures hide -- grep for the meta field name in merge() specifically."
    source: "Phase 31 verification"
    confidence: HIGH
    phase: "31-feature-flags-override-system"
    date: "2026-03-29"

  - finding: "For standalone companion scripts (check-overrides.js pattern): verify independence by confirming zero imports from the main pipeline script (compose.js). grep for require('..compose') or require('../scripts/compose') in the companion script. The standalone pattern is intentional -- CI runs the companion independently. Also verify the CLI entry point pattern: require.main === module guard, process.exit with ok-based exit codes, parseArgs for --flag support."
    source: "Phase 31 verification"
    confidence: HIGH
    phase: "31-feature-flags-override-system"
    date: "2026-03-29"

  - finding: "For code port phases (Phase 32 pattern): verification of copy-not-move requires checking BOTH existence at destination AND absence of old paths in test imports (grep for ../src/ in updated test files should return 0 matches). Also verify that modules ported together maintain their relative import paths unchanged (e.g., ConfigLoader->ConfigSchema uses ./ConfigSchema both before and after the port). The key anti-pattern is residual old import paths in test files."
    source: "Phase 32 verification"
    confidence: HIGH
    phase: "32-fork-code-port"
    date: "2026-03-29"

  - finding: "For overlay architecture with dist/-relative import paths (sync.cjs pattern): modules that import from the composed dist/ layout (e.g., require('../get-shit-done/bin/lib/core.cjs')) will fail require() from the source tree. This is by design -- verify the import path is correct for dist/ layout, and accept that source-tree tests for these modules are deferred to the test isolation phase. The key check is: does the path resolve correctly inside dist/ after composition?"
    source: "Phase 32 verification"
    confidence: HIGH
    phase: "32-fork-code-port"
    date: "2026-03-29"

  - finding: "For delegation installer phases (Phase 33 pattern): key verification points are (1) spawn() not execSync/require for upstream subprocess delegation with stdio: 'inherit', (2) overlay manifest consumed via JSON.parse of .overlay-manifest.json (deterministic, not hardcoded list), (3) .install-meta.json written to get-shit-done/ subdirectory with 5 v3.0 fields, (4) line count confirms monolith replacement (436 vs 2125). The PLAN estimate of 200-300 lines can legitimately grow to ~400 with --help handler, multi-runtime target resolution (opencode/gemini), and error messages with color codes."
    source: "Phase 33 verification"
    confidence: HIGH
    phase: "33-installer-update-workflow"
    date: "2026-03-29"

  - finding: "For read-only scripts with fallback module loading (preview-update.js pattern): when a module import (sync.cjs) fails because it depends on dist/ layout paths not present in source tree, verify the fallback implementation replicates the critical checks inline. Key verification: (1) grep for zero fs write operations in the script (writeFileSync, mkdirSync, rmSync etc.), (2) verify fallback checks match the primary scanner's vector names (execution-path, prompt-integrity), (3) verify module.exports includes all functions for testability."
    source: "Phase 33 verification"
    confidence: HIGH
    phase: "33-installer-update-workflow"
    date: "2026-03-29"

  - finding: "For coverage enforcement phases (Phase 34 pattern): bun test --coverage reports only functions and lines, NOT statements and branches. When success criteria require 95%+ at ALL FOUR metrics, two metrics are unverifiable with bun 1.3.5. Also: bun does not track coverage for code executed in child processes (spawnSync/execFileSync), so CLI entry blocks (require.main === module) tested via subprocess have zero coverage attribution. The only way to get CLI entry coverage is in-process interception (captureCmd pattern from sync.test.cjs)."
    source: "Phase 34 verification"
    confidence: HIGH
    phase: "34-testing-ci-enforcement"
    date: "2026-03-30"

  - finding: "For CI enforcement check phases: boundary and compat checks that enforce post-migration invariants will fail on a pre-migration codebase. check-boundary.js detecting 48 violations at repo root (agents/, commands/, bin/install.js) is correct behavior -- these files exist both upstream and in the fork's repo root because the overlay migration (Phase 35) has not yet moved them. CI-04 (all checks pass) is inherently a post-migration deliverable when boundary enforcement is part of the check suite."
    source: "Phase 34 verification"
    confidence: HIGH
    phase: "34-testing-ci-enforcement"
    date: "2026-03-30"

  - finding: "check-boundary.test.js runs under bun:test and all 16 tests pass, yet bun --coverage reports check-boundary.js at 71.43% functions / 61.54% lines. The uncovered lines are formatReport (154-178), parseArgs (191-201), and CLI entry (210-213). This is likely a bun coverage attribution issue where test file imports go through the test helper pattern rather than direct require. Verify by checking if the test file uses temp-dir fixtures that import check-boundary.js indirectly."
    source: "Phase 34 verification"
    confidence: MEDIUM
    phase: "34-testing-ci-enforcement"
    date: "2026-03-30"

  - finding: "Coverage aggregate across all files can be misleading when test helper mock files (mock-child-process.js at 11.11%, mock-fs.js at 83.33%, mock-process.js at 85.71%) are included. These are test infrastructure, not production code. The REQUIREMENTS say 'fork-specific code' which should exclude test helpers. However, bun's aggregate includes ALL files in the coverage report."
    source: "Phase 34 verification"
    confidence: HIGH
    phase: "34-testing-ci-enforcement"
    date: "2026-03-30"
