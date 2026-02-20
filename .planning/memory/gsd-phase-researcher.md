---
agent: gsd-phase-researcher
updated: 2026-02-20
entries: 11
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
