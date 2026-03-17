---
phase: 07-security-hardening-tooling
plan: 03
title: "Hook Security Improvements"
subsystem: security
tags: [security, validation, upstream-sync, input-validation, checkpoints]
requires:
  - "07-01: Validation module and ESLint security baseline"
provides:
  - "SHA validation before cherry-pick (allowlist pattern)"
  - "Mandatory security review checkpoint with diff analysis"
  - "Config re-validation after upstream sync"
affects:
  - "Future phases that modify upstream sync workflow"
tech-stack:
  added: []
  patterns:
    - "Allowlist validation for git SHAs"
    - "Security review checkpoint pattern"
    - "Post-sync config re-validation"
key-files:
  created: []
  modified:
    - "get-stuff-done/workflows/upstream-sync.md: Added Stage 3.5 SECURITY_REVIEW checkpoint, SHA validation, config re-validation"
    - "commands/gsd/upstream.md: Added SECURITY_REVIEW handler and Security Model documentation"
decisions:
  - id: "SEC-REVIEW-001"
    what: "Security review checkpoint between PLAN and EXECUTE stages"
    why: "SEC-01 requires user review and approval before any cherry-pick executes"
    impact: "No upstream code can be applied without explicit user approval"
    status: "Good"
  - id: "SEC-REVIEW-002"
    what: "show-diff option in SECURITY_REVIEW checkpoint"
    why: "Users may need to see full diff details, not just statistics"
    impact: "Enables informed decision-making before approval"
    status: "Good"
  - id: "SEC-REVIEW-003"
    what: "Config re-validation only for GSD config files (version field check)"
    why: "Avoid false failures on non-GSD JSON files in the repo"
    impact: "Selective validation prevents noise"
    status: "Good"
duration: 11
completed: 2026-02-08
---

# Phase 07 Plan 03: Hook Security Improvements Summary

**One-liner:** SHA allowlist validation, mandatory security review checkpoint with diff analysis, and config re-validation after upstream sync.

## Objectives Achieved

Added three security layers to the upstream sync workflow:

1. **SHA Validation (Stage 3):** All user-provided commit SHAs validated against `/^[0-9a-f]{7,40}$/i` allowlist pattern before use in git commands
2. **Security Review Checkpoint (Stage 3.5):** Mandatory checkpoint between PLAN and EXECUTE that analyzes diffs for security patterns (exec calls, dependency changes, file operations) and requires explicit user approval
3. **Config Re-validation (Stage 5):** Automatic AJV schema validation of GSD config files after cherry-picks are applied

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add SHA validation and security review to upstream-sync workflow | e4a500e | get-stuff-done/workflows/upstream-sync.md |
| 2 | Update upstream orchestrator to handle security review checkpoint | fccd58a | commands/gsd/upstream.md |

## Implementation Details

### Task 1: Upstream Sync Workflow Security

Modified `get-stuff-done/workflows/upstream-sync.md`:

**SHA Validation (Stage 3):**
- Added validation step after parsing user_selection
- Validates format: `/^[0-9a-f]{7,40}$/i` (7-40 hex characters)
- Validates existence: SHA must exist in commit_list from Stage 1
- Returns `## SYNC ABORTED` with specific error if validation fails

**Stage 3.5 SECURITY_REVIEW:**
- New checkpoint between PLAN and EXECUTE stages
- Generates diff statistics: `git diff {first_sha}^..{last_sha} --stat`
- Analyzes diff for security patterns:
  - exec/execSync/spawn calls
  - package.json dependency changes
  - File operations (fs.write, fs.unlink, fs.rmSync)
  - Hook/installer code changes
  - Environment variable reads
  - eval() or Function() usage
- Returns checkpoint with:
  - Diff statistics
  - Security analysis (flagged patterns or "No concerns detected")
  - Options: approve, show-diff, abort
- Workflow pauses until user approves

**Config Re-validation (Stage 5):**
- Added step 6 after conflict marker check
- Detects changed config files: `git diff --name-only HEAD~${N}..HEAD | grep -E '\.json$|\.json5$|config'`
- Validates each GSD config (identified by `version` field) with AJV schema
- Skips non-GSD JSON files to avoid false failures
- Results included in verification report

**Updated Stage 4 entry conditions:**
- Changed from "After Stage 3" to "After Stage 3.5 approval"
- Makes security review mandatory (no bypass path)

### Task 2: Upstream Orchestrator Handler

Modified `commands/gsd/upstream.md`:

**Security Model Documentation:**
- Added at top of `<process>` section
- Documents four security layers:
  1. SHA validation (allowlist)
  2. Security review (explicit approval)
  3. Config re-validation (AJV)
  4. Conflict marker check (blocks publish)
- States principle: "No upstream code is applied to the working tree without explicit user approval"

**SECURITY_REVIEW Checkpoint Handler:**
- Added section 2.5 between CHERRY_PICK_SELECTION and VERSION_BUMP
- Handles three user responses:
  1. "show-diff": Runs `git diff {first_sha}^..{last_sha}`, displays output, re-presents checkpoint
  2. "approve": Spawns continuation at Stage 4 with `security_approved: true`
  3. "abort": Displays abort message, no continuation
- Continuation includes validated commits and security approval flag

## Verification Results

All verification checks passed:

1. upstream-sync.md contains "Stage 3.5" or "SECURITY REVIEW" section
2. upstream-sync.md contains SHA validation regex `/^[0-9a-f]{7,40}$/i`
3. upstream-sync.md contains config re-validation step in Stage 5
4. upstream.md contains SECURITY_REVIEW checkpoint handler
5. upstream.md contains Security Model documentation section
6. Security review checkpoint is mandatory (no bypass path between Stage 3 and Stage 4)

## Success Criteria Met

- No cherry-pick can execute without user reviewing diff and approving via SECURITY_REVIEW checkpoint
- All user-provided SHAs are validated against `/^[0-9a-f]{7,40}$/i` before use in git commands
- Config files modified by cherry-picks are automatically re-validated with AJV schema
- The upstream orchestrator correctly handles the new checkpoint type with approve/show-diff/abort options

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

**SEC-REVIEW-001: Security review checkpoint between PLAN and EXECUTE**
- What: Added Stage 3.5 as mandatory checkpoint before any cherry-pick executes
- Why: SEC-01 requires user review and approval before applying upstream code
- Impact: No upstream code can be applied without explicit user approval
- Status: Good

**SEC-REVIEW-002: show-diff option in SECURITY_REVIEW checkpoint**
- What: Added third option to view full diff before approving
- Why: Statistics may not be sufficient - users may need to see full diff details
- Impact: Enables informed decision-making, prevents approval without understanding changes
- Status: Good

**SEC-REVIEW-003: Config re-validation only for GSD config files**
- What: Check for `version` field to identify GSD configs before validating
- Why: Avoid false failures on non-GSD JSON files in the repo (e.g., package.json, tsconfig.json)
- Impact: Selective validation prevents noise, focuses on GSD-specific configs
- Status: Good

## Files Modified

**get-stuff-done/workflows/upstream-sync.md:**
- Added SHA validation step in Stage 3 (step 2)
- Added Stage 3.5 SECURITY_REVIEW checkpoint (new stage between 3 and 4)
- Updated Stage 4 entry conditions to require Stage 3.5 approval
- Added config re-validation step in Stage 5 (step 6)
- Added Config Re-validation section to verification report template

**commands/gsd/upstream.md:**
- Added Security Model documentation section
- Added SECURITY_REVIEW checkpoint handler (section 2.5)

## Testing Performed

Manual verification:
- Confirmed Stage 3.5 exists in upstream-sync.md
- Confirmed SHA validation regex is present
- Confirmed config re-validation step exists in Stage 5
- Confirmed SECURITY_REVIEW handler in upstream.md
- Confirmed Security Model documentation
- Confirmed no bypass path exists (Stage 3 -> 3.5 -> 4)

## Next Phase Readiness

This plan completes Phase 7 (Security Hardening & Tooling). All three plans are complete:

- 07-01: Validation module and ESLint security baseline
- 07-02: Pre-commit hook security (dependency verification, linting)
- 07-03: Upstream sync security (SHA validation, review checkpoint, config re-validation)

**Ready for Phase 8:** The security foundation is in place:
- Input validation module (src/validation/index.js)
- ESLint security linting
- Pre-commit hook with security checks
- Upstream sync with mandatory security review

**Blockers/Concerns:** None. Phase 7 objectives achieved.

## Metrics

**Execution time:** 11 minutes
**Tasks completed:** 2/2
**Commits:** 2
- e4a500e: feat(07-03): add SHA validation and security review to upstream sync
- fccd58a: feat(07-03): add SECURITY_REVIEW checkpoint handler to upstream orchestrator

**Files modified:** 2
**Lines added:** ~160
**Lines removed:** ~5

## Knowledge Captured

**Security checkpoint pattern:**
- Pause workflow before critical operations
- Analyze for security concerns
- Present findings to user
- Require explicit approval
- Resume with approval flag

**Allowlist validation pattern:**
- Define expected format as regex (e.g., `/^[0-9a-f]{7,40}$/i`)
- Reject anything that doesn't match
- No character escaping vulnerabilities
- Safe to use in shell commands after validation

**Config re-validation pattern:**
- Detect changed config files after external operations
- Identify schema-matching configs (version field check)
- Re-validate with existing schema
- Include results in verification report
- Block publish if validation fails

**Workflow checkpoint handling:**
- Present checkpoint to user via AskUserQuestion
- Parse user response
- Spawn continuation with resume_stage and response data
- Fresh agent continues from checkpoint with context

---
*Completed: 2026-02-08*
*Duration: 11 minutes*
*Tasks: 2/2 complete*
