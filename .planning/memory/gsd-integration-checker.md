---
agent: gsd-integration-checker
updated: 2026-02-20
entries: 9
---

- finding: "Hooks installed to ~/.claude/hooks/ use require('../src/...') which resolves to ~/.claude/src/ - a directory that doesn't exist post-installation. This breaks hooks/pre-compact.js (hard require of gsdPaths) and hooks/gsd-statusline.js (hard require of getTheme and detectTerminal)."
  source: "Milestone v0.2.0, Phase 9 cross-platform / Phase 11 CI integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"
  status: superseded
  superseded_by: "Phase 13 esbuild bundling inlines all src/ dependencies into hooks/dist/. dist hooks are fully self-contained. This finding no longer applies to installed hooks."

- finding: "Phase 13 esbuild bundling resolves all hook src/ dependency breakage. dist/pre-compact.js and dist/gsd-statusline.js and dist/gsd-check-update.js are fully self-contained - all src/ dependencies (platform/paths.js, config/ConfigLoader.js, theme/, validation module) are inlined. Verified by grepping dist files for internal __commonJS wrappers. Install copies from hooks/dist/ not hooks/."
  source: "Milestone v0.2.0, Phase 13 Hook Bundling / Phase 14 integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-20"

- finding: "src/validation/index.js (Phase 7 SEC-02) was orphaned but Phase 14 wired it into production. However, the wiring is BROKEN POST-INSTALLATION. gsd-tools.js at get-stuff-done/bin/gsd-tools.js uses require('../../src/validation'). From source this resolves to src/validation/ (correct). Post-install at ~/.claude/get-stuff-done/bin/gsd-tools.js, it resolves to ~/.claude/src/validation/ which does NOT exist. The installer copies get-stuff-done/ to ~/.claude/get-stuff-done/ but never copies src/ to ~/.claude/src/. This means ANY call to `node ~/.claude/get-stuff-done/bin/gsd-tools.js` will throw MODULE_NOT_FOUND at startup, breaking all GSD commands that use gsd-tools."
  source: "Milestone v0.2.0, Phase 14 Security Wiring integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-20"

- finding: "src/platform/index.js (the unified platform API) is an orphan - never imported by production code. Individual submodules (paths.js, terminal.js, detect.js) are imported directly. The unified index exists as documentation/convenience but has no runtime consumers."
  source: "Milestone v0.2.0, Phase 9"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"

- finding: "get-stuff-done/teams/*.md files (4 team templates from Phase 10) are referenced only by each other (oversight agents in team templates). No workflow or command references team templates. They are orphaned in the get-stuff-done/teams/ directory. The config.json teams.enabled=false confirms this is by design (experimental)."
  source: "Milestone v0.2.0, Phase 10 Claude Code Adoption"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"

- finding: "config.json memory/effort/teams settings added by Phase 10 have no runtime consumers. gsd-tools.js reads config.json but only reads model_profile, commit_docs, search_gitignored, branching_strategy, phase_branch_template, milestone_branch_template, research, plan_checker, verifier, parallelization. The memory/effort/teams keys are documentation-only in the current runtime."
  source: "Milestone v0.2.0, Phase 10"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"

- finding: "All command-to-workflow references are intact. 23 commands reference workflows, all 23 workflow files exist in get-stuff-done/workflows/. Commands without workflow references (reapply-patches.md, join-discord.md, research-phase.md, debug.md) are self-contained by design."
  source: "Milestone v0.2.0, Phase 12 / Phase 14 integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-20"

- finding: "AskUserQuestion tool wiring is complete. 16 command files declare AskUserQuestion in allowed-tools. Workflows for plan-phase, set-profile, and verify-work all reference AskUserQuestion usage in their process descriptions. Phase 14 added the missing declarations to plan-phase.md, set-profile.md, and verify-work.md."
  source: "Milestone v0.2.0, Phase 14 Plan 03 integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-20"

- finding: "All 441 tests pass from source (bun test). Tests run gsd-tools.js via TOOLS_PATH = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.js') which resolves ../../src/validation correctly from source root. Tests do NOT simulate post-install path resolution. This is why the broken require path in gsd-tools.js is not caught by the test suite."
  source: "Milestone v0.2.0, Phase 14 integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-20"
