# WoW SuperAdmin UX + Installer Delegation Plan

## Context (from Discuss Phase)

**User Preferences Captured:**
- Duration without unit: Ask "Did you mean X minutes or X hours?"
- Auth methods: Setup wizard style (guide through each)
- Git-Bash: Windows Hello + Passphrase (auto-detect bridge)
- Scope: Combined fix (superadmin UX + installer delegation)

**Problems Identified:**
1. Duration "2" interpreted as 2m without confirmation
2. "0m inactivity" displayed (calculation bug)
3. Unstyled error messages break visual flow
4. "Windows Hello only in WSL2" wrong for Git-Bash
5. fprintd suggestion irrelevant for Windows users
6. "Fingerprint detected" but Hello doesn't work - contradictory
7. No explanation of Hello options (PIN/face/fingerprint)
8. Installer has inline setup code (duplicates wow-bypass-setup/wow-superadmin)
9. Installer clears screen (loses terminal history)
10. Installer password input doesn't show asterisks

---

## Atomic Tasks

### Task 1: Remove `clear` commands
**Files:** `install.sh`, `bin/wow-bypass-setup`
**Change:** Delete `clear` commands that wipe terminal history
**Verification:** Scripts preserve terminal history on run

### Task 2: Fix duration unit ambiguity
**File:** `src/core/duration-parser.sh` or `bin/wow-superadmin`
**Change:** When user enters number without unit, prompt: "Did you mean N minutes or N hours? [m/h]"
**Verification:** `wow superadmin unlock` with input "2" prompts for clarification

### Task 3: Fix inactivity timeout calculation
**File:** `src/core/duration-parser.sh` or `src/security/superadmin/superadmin-core.sh`
**Change:** Fix `duration_calculate_inactivity` to never return 0
**Verification:** "2m" shows reasonable inactivity (e.g., 1m), not 0m

### Task 4: Style error messages consistently
**File:** `bin/wow-superadmin`
**Change:** Format "Windows Hello not enrolled" and fallback messages with proper indentation and color
**Verification:** All messages follow the `  ● Message` or `  ${C_DIM}text${C_RESET}` pattern

### Task 5: Fix Git-Bash Windows Hello detection
**File:** `src/security/superadmin/superadmin-core.sh`
**Change:**
- Detect Git-Bash as Windows environment (can use Hello bridge)
- Remove "only available in WSL2" for Git-Bash
- Check for Hello bridge existence before offering
**Verification:** `wow superadmin setup --hello` in Git-Bash offers Hello if bridge installed

### Task 6: Improve auth method explanation
**File:** `bin/wow-superadmin` (cmd_setup function)
**Change:** Setup wizard style:
```
Available authentication methods:
  1. Windows Hello (PIN, fingerprint, or face recognition)
  2. Passphrase (fallback for when Hello unavailable)

Which would you like to configure? [1/2/both]
```
**Verification:** Clear options shown, user guided through setup

### Task 7: Add --from-installer flag to wow-bypass-setup
**File:** `bin/wow-bypass-setup`
**Change:**
- Add `--from-installer` flag handling
- When set: skip clear, use simpler output, return structured exit codes
- Exit codes: 0=success, 1=user-cancelled, 2=error
**Verification:** `wow-bypass-setup --from-installer` works without clearing screen

### Task 8: Add --from-installer flag to wow-superadmin setup
**File:** `bin/wow-superadmin`
**Change:**
- Add `--from-installer` flag to cmd_setup
- When set: skip clear, integrate with parent's visual style
- Return proper exit codes
**Verification:** `wow superadmin setup --from-installer` works cleanly

### Task 9: Refactor install.sh Optional Features section
**File:** `install.sh`
**Change:**
- Replace inline bypass setup with: `"${WOW_INSTALL_DIR}/bin/wow-bypass-setup" --from-installer`
- Replace inline superadmin setup with: `"${WOW_INSTALL_DIR}/bin/wow-superadmin" setup --from-installer`
- Handle exit codes to set BYPASS_CONFIGURED and SUPERADMIN_CONFIGURED
**Verification:** Installer delegates to scripts, no code duplication

### Task 10: Verify end-to-end flow
**Manual test:**
1. Run `bash install.sh` - should not clear screen
2. Reach Optional Features - should delegate to setup scripts
3. Setup scripts show proper UX (asterisks, clear options)
4. Completion summary reflects actual configuration state

---

## Execution Order

```
Task 1 (clear) ──────────────────────────────┐
Task 2 (duration) ───────────────────────────┤
Task 3 (inactivity calc) ────────────────────┼── Can run in parallel
Task 4 (error styling) ──────────────────────┤
Task 5 (Git-Bash Hello) ─────────────────────┤
Task 6 (auth wizard) ────────────────────────┘
                                             │
                                             ▼
Task 7 (bypass --from-installer) ────────────┐
Task 8 (superadmin --from-installer) ────────┼── Sequential (builds on 1-6)
                                             │
                                             ▼
Task 9 (installer delegation) ───────────────── Depends on 7-8
                                             │
                                             ▼
Task 10 (verification) ──────────────────────── Final validation
```

---

## Files to Modify

| File | Tasks |
|------|-------|
| `install.sh` | 1, 9 |
| `bin/wow-bypass-setup` | 1, 7 |
| `bin/wow-superadmin` | 4, 6, 8 |
| `src/core/duration-parser.sh` | 2, 3 |
| `src/security/superadmin/superadmin-core.sh` | 5 |

---

## Success Criteria

- [ ] No `clear` commands wipe terminal history
- [ ] Duration "2" prompts for unit clarification
- [ ] Inactivity never shows "0m"
- [ ] All error messages styled consistently
- [ ] Git-Bash can use Windows Hello (if bridge installed)
- [ ] Setup wizard explains auth options clearly
- [ ] Installer delegates to setup scripts (no duplication)
- [ ] Password input shows asterisks everywhere
- [ ] Exit codes properly communicate success/failure
