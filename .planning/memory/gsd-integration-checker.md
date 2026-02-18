---
agent: gsd-integration-checker
updated: 2026-02-18
entries: 6
---

- finding: "Hooks installed to ~/.claude/hooks/ use require('../src/...') which resolves to ~/.claude/src/ - a directory that doesn't exist post-installation. This breaks hooks/pre-compact.js (hard require of gsdPaths) and hooks/gsd-statusline.js (hard require of getTheme and detectTerminal). The ConfigLoader require in gsd-statusline is wrapped in try-catch so only falls back to defaults, but the theme and terminal imports are hard fails."
  source: "Milestone v0.2.0, Phase 9 cross-platform / Phase 11 CI integration check"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"

- finding: "src/validation/index.js (Phase 7 SEC-02) is a confirmed orphan - only imported by tests/validation.test.js, never by production code. gsd-tools.js handles git SHA patterns via regex in-line (line 990: /[0-9a-f]{7,40}/) without using the validation module. The validation module cannot enforce SEC-02."
  source: "Milestone v0.2.0, Phase 7 Security Hardening"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"

- finding: "src/platform/index.js (the unified platform API) is an orphan - never imported by production code. Individual submodules (paths.js, terminal.js, detect.js) are imported directly by production code. The unified index exists as documentation/convenience but has no runtime consumers."
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

- finding: "All 24 workflow filenames referenced by commands/gsd/*.md exist in get-stuff-done/workflows/. The command-to-workflow reference chain is complete. gsd-tools.js is self-contained (no relative src/ imports) and correctly installed to ~/.claude/get-stuff-done/bin/gsd-tools.js."
  source: "Milestone v0.2.0, Phase 12 Missing Workflows"
  confidence: HIGH
  phase: "integration-check"
  date: "2026-02-18"
