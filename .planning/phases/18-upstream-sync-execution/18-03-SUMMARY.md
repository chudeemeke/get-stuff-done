---
phase: 18
plan: 03
subsystem: upstream-sync
requirements-completed: []
tags:
  - upstream-sync
  - cherry-pick
  - requirements-tracking
  - context-proxy
  - subagent-discovery
dependency_graph:
  requires:
    - 18-02-SUMMARY.md
  provides:
    - fork-current-through-v1.20.5
  affects:
    - get-stuff-done/bin/gsd-tools.cjs
    - agents/gsd-executor.md
    - agents/gsd-planner.md
    - agents/gsd-plan-checker.md
    - agents/gsd-verifier.md
    - get-stuff-done/workflows/
tech_stack:
  added: []
  patterns:
    - context-proxy via files_to_read blocks
    - requirements tracking chain (REQ-IDs through researcher->planner->executor->verifier)
    - 3-source cross-reference for milestone requirements
    - subagent project CLAUDE.md and skills discovery
key_files:
  created: []
  modified:
    - get-stuff-done/bin/gsd-tools.cjs
    - agents/gsd-executor.md
    - agents/gsd-planner.md
    - agents/gsd-plan-checker.md
    - agents/gsd-verifier.md
    - agents/gsd-phase-researcher.md
    - get-stuff-done/workflows/execute-phase.md
    - get-stuff-done/workflows/execute-plan.md
    - get-stuff-done/workflows/verify-work.md
    - get-stuff-done/workflows/diagnose-issues.md
    - get-stuff-done/workflows/map-codebase.md
    - bin/install.js
    - .planning/sync/sync-manifest.json
decisions:
  - context-proxy pattern adopted: init functions return file paths instead of file contents to minimize orchestrator context
  - requirements tracking chain adopted: PHASE_REQ_IDS flow through researcher->planner->checker->executor->verifier
  - 3-source cross-reference adopted for milestone requirements
  - processAttribution call removed from install.js agents section (incomplete Codex revert)
  - Fork identity preserved: name stays @chude/get-stuff-done, version stays 2.2.1
metrics:
  duration: "2 sessions (~3 hours)"
  completed: "2026-02-22"
  tasks_completed: 2
  files_modified: 47
  commits: 29
---

# Phase 18 Plan 03: Cherry-pick Batches 9-11 (v1.19.2..v1.20.5) Summary

Cherry-picked 37 commits from upstream v1.19.2..v1.20.5 across two sessions, bringing the fork current through v1.20.5 with requirements tracking chain, context-proxy orchestration, and subagent project discovery adopted.

## What Was Built

### Task 1: Batch 9 (v1.19.2..v1.20.0, 12 commits) - Previous Session

Applied 12 commits including auto-advance pipeline persistence, `/gsd:health` command, `quick --full` mode, and various workflow improvements. Fork advanced from v1.19.2 to v1.20.0 equivalent.

### Task 2: Batches 10-11 (v1.20.0..v1.20.5, 25 commits) - This Session

**Batch 10 (v1.20.1..v1.20.3, 11 commits):**
- Requirements tracking chain: strip `[REQ-01]` bracket syntax, add `requirements` field to plan/summary templates, PHASE_REQ_IDS flow through full agent chain
- Requirements verification loop: plan-checker fails when requirements absent from plans, verifier uses 3-source cross-reference
- 3-source milestone audit: VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability
- Gemini CLI: escape `${VAR}` in agent bodies

**Batch 11 (v1.20.3..v1.20.5, 14 commits):**
- Executor updates ROADMAP.md and REQUIREMENTS.md per-plan via `requirements mark-complete`
- `gsd-tools.cjs` backup before STATE.md regeneration
- Project CLAUDE.md discovery added to all subagent spawn points
- Project skills discovery (`.agents/skills/`) added to all subagent spawn points
- Inline Task() syntax for map-codebase agent spawning
- Context-proxy orchestration refactor: init functions return file paths instead of contents; `<files_to_read>` blocks replace `@-file` references in Task() prompts
- Codex add+revert pair (87c3873/db1d003 + e820263/d55998b) applied in order; net zero change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Incomplete Codex revert — processAttribution call left in install.js**
- **Found during:** Post-batch branding pass and bun test (22 failures in installer tests)
- **Issue:** The Codex reverts (e820263, d55998b) auto-merged with `bin/install.js` but left a dangling `processAttribution(content, getCommitAttribution(runtime))` call at line 1523 that had no function definition
- **Fix:** Removed the dangling call; restored the `useLinks` branch and `fs.mkdirSync(agentsDest, { recursive: true })` that the bad merge lost
- **Files modified:** `bin/install.js`
- **Commit:** ecdb951

**2. [Rule 1 - Bug] Duplicate agents install section from bad revert merge**
- **Found during:** Same bun test run
- **Issue:** The revert auto-merge left two copies of the agents installation loop — the first without directory creation (`mkdirSync`) and the second (in an `else` branch that was never reached) with proper directory setup. Writing to non-existent directory caused ENOENT.
- **Fix:** Consolidated into single correct implementation matching pre-Codex state
- **Files modified:** `bin/install.js`
- **Commit:** ecdb951

**3. [Rule 2 - Missing] Branding violations in commands/gsd/ files taken theirs**
- **Found during:** Branding pass after batch completion
- **Issue:** Four commands files (add-phase, add-todo, check-todos, pause-work) taken "theirs" during 3dcd3f0 conflict resolution had `@~/.claude/get-shit-done/` references
- **Fix:** Applied sed substitution to correct all four files
- **Files modified:** `commands/gsd/add-phase.md`, `commands/gsd/add-todo.md`, `commands/gsd/check-todos.md`, `commands/gsd/pause-work.md`
- **Commit:** ecdb951

**4. [Rule 3 - Blocking] DU conflict pattern (recurring)**
- **Found during:** Multiple cherry-picks
- **Issue:** Upstream modifies `get-shit-done/bin/gsd-tools.cjs` which is deleted in fork HEAD (renamed to `get-stuff-done/`)
- **Fix:** `git rm --cached "get-shit-done/bin/gsd-tools.cjs"` then apply changes manually to fork's file
- **Commits:** Handled inline in each affected cherry-pick commit

## Commits

| Upstream Hash | Fork Hash | Description |
|---------------|-----------|-------------|
| cbf8094 | 925a00e | Requirements tracking chain |
| 9ef582e | eb10dbd | Close requirements verification loop |
| fb50d3a | 30ec342 | CHANGELOG v1.20.2 |
| 710795c | 55d69d7 | v1.20.2 marker |
| e449c5a | 2f53b33 | Gemini shell variable escaping |
| 2f25895 | 3cccf2c | Milestone audit 3-source cross-reference |
| 95bc5a0 | 5283474 | CHANGELOG v1.20.3 |
| c609f3d | fed98b1 | v1.20.3 marker |
| 1764abc | a91a0ef | Executor ROADMAP/REQUIREMENTS updates |
| 8b181f2 | 08a6fec | CHANGELOG v1.20.4 |
| b94a1ca | 56b07e1 | v1.20.4 marker |
| f77252c | 30d5b5d | Inline Task() syntax for map-codebase |
| 87c3873 | 9dba202 | Codex Task() conversion (reverted) |
| db1d003 | 7e7bf1f | Codex prompts install (reverted) |
| 270b6c4 | 04b087f | Project skills discovery in agents |
| 8fd7d0b | 6de2e12 | Project CLAUDE.md discovery in agents |
| bf2f571 | 03ef81d | STATE.md backup before regeneration |
| 3dcd3f0 | e49375d | Context-proxy orchestration flow |
| e820263 | b6d166e | Revert Codex prompts |
| d55998b | 9786766 | Revert Codex Task() conversion |
| 748901f | b969d3b | CHANGELOG v1.20.5 |
| 3cf26d6 | ecdb951 | v1.20.5 marker + branding fix |

## Verification

- bun test: 568 pass, 0 fail (all 568 tests)
- Branding check: 0 upstream brand violations in tracked files
- Codex check: 0 Codex artifacts remaining
- Sync manifest: 86 total applied entries (fork current through v1.20.5)

## Self-Check: PASSED

- SUMMARY.md: this file
- All commits verified with git log --oneline
- Tests passing: confirmed via bun test output
- Branding: confirmed clean via grep
- Sync manifest: 86 entries confirmed
