# WoW Installer Fix - Context Document

**Date:** 2026-01-20
**Phase:** Discuss (Complete)

---

## Goal

A professional installer that's never confusing, follows industry standards, and offers optional features inline.

---

## User Preferences Captured

### Optional Features (bypass, superadmin)
- **Default:** YES (pre-selected, user can decline)
- Offered during installation, not as post-install "next steps"

### Failure Handling
- Auto-retry once on failure
- If still fails: log and continue (don't block entire install)
- On completion: inform user of failures + potential actions
- **Installation type detection:** Detect if fresh/reinstall/fix and be surgical for non-fresh

### Progress Display
- Progress bar for measurable operations (countable items)
- Spinner for unknown duration
- Show elapsed time for slow operations (>2s)

### Completion Summary
- **Moderate detail:** What was installed, where, any warnings
- Not minimal (just success/fail) and not overly verbose

---

## Constraints

### Must NOT Change
- Core installation functionality (all 15+ existing items must still work)
- Hook deployment and configuration
- Security permissions on directories

### Must Fix
- Environment detection: Currently shows "native Linux" on Git-Bash (wrong)
- Prerequisites: Can hang on cmd.exe calls in Git-Bash
- No optional feature prompts during install
- Abrupt ending with no explanation

### Out of Scope
- Adding new installation targets
- Changing what gets installed
- Modifying the WoW system itself (only the installer)

---

## Gray Areas Resolved

| Gray Area | Decision |
|-----------|----------|
| Optional feature defaults | YES (opt-out, not opt-in) |
| Failure handling | Retry once, then continue with logged failure |
| Progress style | Bar when measurable, spinner when not |
| Summary verbosity | Moderate (key info only) |
| Reinstall behavior | Detect and be surgical |
