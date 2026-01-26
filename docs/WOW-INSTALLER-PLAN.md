# WoW Installer Fix - Plan

**Date:** 2026-01-20
**Phase:** Plan

---

## Goal

Professional installer that's never confusing

---

## Conditions for Success (Backward Reasoning)

1. **Environment Detection:** User knows correct environment (Git-Bash/WSL2/Linux/macOS)
2. **Progress Visibility:** User knows current step and elapsed time
3. **Optional Features:** Bypass and SuperAdmin setup offered during install
4. **Failure Resilience:** Failures don't block, but are reported at end
5. **Install Type Detection:** Fresh vs reinstall vs fix is detected
6. **Clear Summary:** Completion shows key info (what, where, warnings)

---

## Atomic Tasks

### Task 1: Fix Environment Detection
**Achieves:** Condition 1

Changes to `install.sh`:
- Add Git-Bash detection: Check for `$MSYSTEM` or `$MINGW_PREFIX`
- Add macOS detection: Check `uname -s` for Darwin
- Fix message: "Running in Git-Bash" instead of "native Linux"
- For Git-Bash: `HOME` is already Windows path, no cmd.exe needed

**Files:** `install.sh` (lines 143-181)
**Commit:** `fix(install): detect Git-Bash environment correctly`

---

### Task 2: Add Installation Type Detection
**Achieves:** Condition 5

Add new section after environment detection:
- Check if `$WOW_INSTALL_DIR` exists
- Check if hook file exists
- Determine: FRESH, REINSTALL, or REPAIR
- Show appropriate message and adjust behavior

**Files:** `install.sh` (new section ~line 185)
**Commit:** `feat(install): detect fresh/reinstall/repair installation type`

---

### Task 3: Add Elapsed Time to Slow Operations
**Achieves:** Condition 2

Modify `run_with_spinner` function:
- Track start time
- Show elapsed seconds in spinner message
- Format: "Installing... (5s)"

**Files:** `install.sh` (lines 76-105)
**Commit:** `feat(install): show elapsed time for slow operations`

---

### Task 4: Add Failure Tracking with Auto-Retry
**Achieves:** Condition 4

Add failure tracking system:
- Create `FAILED_STEPS` array
- Wrap operations in retry logic (1 auto-retry)
- On failure: log to array, continue
- Don't exit on non-critical failures

**Files:** `install.sh` (new functions + integration)
**Commit:** `feat(install): add auto-retry and failure tracking`

---

### Task 5: Add Optional Feature Prompts
**Achieves:** Condition 3

Add new "Optional Features" section after core installation:
- Prompt: "Set up bypass passphrase? [Y/n]"
- Prompt: "Set up SuperAdmin biometric? [Y/n]"
- Default YES (just press Enter to accept)
- Run setup inline if accepted

**Files:** `install.sh` (new section after Verification)
**Commit:** `feat(install): offer optional features during installation`

---

### Task 6: Improve Completion Summary
**Achieves:** Condition 6

Rewrite completion section:
- Show: Location, Data dir, Strategy
- Show: Components installed (count)
- Show: Warnings/failures if any (from FAILED_STEPS)
- Show: Optional features status (configured/skipped)
- Remove verbose "Next Steps" if nothing needed

**Files:** `install.sh` (lines 464-494)
**Commit:** `feat(install): improve completion summary with key info`

---

## Task Order (Dependencies)

```
Task 1 (Environment) - No deps
Task 2 (Install Type) - Depends on Task 1 (uses env detection)
Task 3 (Elapsed Time) - No deps
Task 4 (Failure Tracking) - No deps
Task 5 (Optional Features) - Depends on Task 4 (uses failure tracking)
Task 6 (Summary) - Depends on Task 4, Task 5 (shows their results)
```

**Execution order:** 1, 3, 4, 2, 5, 6

---

## Verification Criteria

After all tasks complete, test:

- [ ] Run on Git-Bash: Shows "Running in Git-Bash"
- [ ] Progress shows elapsed time for slow ops
- [ ] Simulated failure: auto-retries, then continues
- [ ] Optional features prompt appears with [Y/n]
- [ ] Pressing Enter accepts default (YES)
- [ ] Completion summary shows installed components
- [ ] Completion summary shows any failures with actions
