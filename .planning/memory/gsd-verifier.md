---
agent: gsd-verifier
updated: 2026-02-20
entries: 17
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
