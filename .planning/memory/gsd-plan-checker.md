---
agent: gsd-plan-checker
updated: 2026-02-27
entries: 14
---

- finding: "AskUserQuestion audit scope can be wider than plan claims -- workflows that are NOT directly referenced by command files (e.g., execute-plan.md, verify-phase.md, discovery-phase.md) can still invoke AskUserQuestion. The plan only fixes the single command file (plan-phase.md) but the audit must check all 28 command files against all their referenced workflows."
  source: "Phase 14, Plan 03, Task 2"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"
  status: superseded
  superseded_by: "Revision fixed this: plan now audits plan-phase.md, set-profile.md, verify-work.md (3 files) plus steps 5-6 explicitly audit the remaining 12 files (complete-milestone, remove-phase, and 10 others)"

- finding: "ConfigLoader.js test set GSD_CONFIG_PATH to '/custom/path/config.json' (outside homedir). Plan 02 Task 2 correctly identifies this breakage risk when adding validateConfigPath wiring. The plan's proposed allowedBases=[homedir, tmpdir] approach is a good mitigation, but the executor must handle the existing test breakage carefully."
  source: "Phase 14, Plan 02, Task 2"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"
  status: superseded
  superseded_by: "Revision explicitly addresses this: Task 2 now says 'update line-37 test from /custom/path to homedir path' and adds tmpdir acceptance test"

- finding: "When a plan's done criteria count (e.g., '14 total command files with AskUserQuestion') comes from CONTEXT.md but the actual current count is 13, a +1 increment should produce 14. Verify the arithmetic by counting actual files before accepting the plan's done criteria as correct."
  source: "Phase 14, Plan 03, Task 2"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"
  status: superseded
  superseded_by: "Revision corrected: 13 existing + 3 new (plan-phase, set-profile, verify-work) = 16 total. Arithmetic verified against actual file listing."

- finding: "key_links can describe wiring that does not match the action text. Plan 03 key_link says bin/validate-configs.js requires src/validation/index.js 'for conflict marker checks' but the validation module has no conflict marker function - the action text does inline string checking with '<<<<<<<' patterns. The key_link creates a false verification target."
  source: "Phase 14, Plan 03, iteration 2"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "When a ROADMAP success criterion mentions a count (e.g., 'All 12 command files') but the actual state has already grown (13 files with AskUserQuestion), treat the ROADMAP count as stale rather than as a discrepancy blocker. The plans should match the actual current state, not the stale ROADMAP prediction."
  source: "Phase 14, Plan 03, iteration 2 verification"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "AJV v8 can compile draft-07 schemas (using '$schema: http://json-schema.org/draft-07/schema#') without adding ajv-draft-04 or special dialect handling. The existing ConfigSchema.js uses this exact pattern successfully. New schemas following the same pattern (schema.js in Plan 03) will compile correctly."
  source: "Phase 14, Plan 03, iteration 2 verification"
  confidence: HIGH
  phase: "14-security-wiring"
  date: "2026-02-19"

- finding: "When a plan action says 'check existing imports and add only what's missing', verify the imports are actually present in the current file. For gsd-tools.test.js, the plan assumes PROJECT_ROOT is defined but it is NOT - only TOOLS_PATH is defined. Similarly, beforeAll is not imported from bun:test. The executor will catch this from context, but marking it as a warning-level gap is appropriate."
  source: "Phase 15, Plan 01, Task 2"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "For bundling gap-closure phases (Phase 13 hook bundling pattern, Phase 15 gsd-tools bundling), the npm package.json files array does NOT need explicit dist/ entry if the parent directory is already listed. 'get-stuff-done' catch-all in files includes bin/dist/ automatically. Gitignore excludes from git but npm publish respects .npmignore or the files whitelist separately."
  source: "Phase 15, Plan 01, RESEARCH.md analysis"
  confidence: HIGH
  phase: "15-gsd-tools-bundling"
  date: "2026-02-20"

- finding: "When a phase has multiple success criteria from ROADMAP.md but the plan's must_haves.truths only cover a subset, the uncovered criteria cannot be verified at phase end. For Phase 16, ROADMAP criterion #3 (cross-platform verification) has no covering task and is absent from must_haves.truths. This is a warning: if CI already covers the criterion automatically, the planner can justify omission by adding a truth like 'CI matrix verifies cross-platform functionality' rather than a task."
  source: "Phase 16, Plan 01 verification"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-21"

- finding: "key_links.pattern fields used for verification should cover ALL exports referenced in the via field. Pattern 'require.*terminal.*_detect' does not match _getTerminalDimensions (not a _detect* function). Pattern coverage gaps create false-negative verification signals. Pattern should be broader: 'require.*terminal' is sufficient when the action text is explicit."
  source: "Phase 16, Plan 01 verification"
  confidence: MEDIUM
  phase: "16-platform-quality"
  date: "2026-02-21"

- finding: "For documentation/workflow-only phases (no JavaScript changes), the REQUIREMENTS.md requirement addressed may already be marked complete (CLAUDE-03 is marked complete in REQUIREMENTS.md) -- Phase 17 is a gap closure that implements the wiring implied by the requirement. In this case the requirement audit should pass even though the requirement shows 'complete' since the phase is gap closure work extending an already-marked requirement."
  source: "Phase 17, Plan 01 verification"
  confidence: HIGH
  phase: "17-agent-teams-wiring"
  date: "2026-02-22"

- finding: "Cherry-pick sync plans use '(all files modified by cherry-picks)' in files_modified field. This is correct and expected for sync execution plans -- file counts are indeterminate before cherry-picks run. Do NOT flag this as missing files."
  source: "Phase 18, Plans 01-04 verification"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Commit count cross-checking across plans: When multiple plans in a phase each state an explicit commit count, sum them and compare to the verification/checkpoint summary which also states a total. Phase 18 Plans 01-04 sum to 30+28+49+11=118 commits, but Plan 05 verification says '106 from Phase 18'. This 12-commit discrepancy is a minor internal inconsistency that should be flagged as a warning (not blocker) since the commit counts in individual plans should be treated as authoritative."
  source: "Phase 18, Plan 05 verification section"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Locked decision 'Cross-platform CI at: after module-split batch, after final batch, before merge to main' means CI should trigger at the end of Plan 04 (after module split) AND in Plan 05 (final validation). When only Plan 05 triggers CI, the 'after module-split' checkpoint from the locked decision is missed. This is a warning-level context compliance deviation."
  source: "Phase 18, Plans 04-05 verification"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"
