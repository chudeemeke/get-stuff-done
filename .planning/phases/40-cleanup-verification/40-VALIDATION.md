---
phase: 40
slug: cleanup-verification
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-04
---

# Phase 40 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test (built-in) |
| **Config file** | bunfig.toml |
| **Quick run command** | `bun test tests/installer-safety.test.js` |
| **Full suite command** | `bun test` |
| **Estimated runtime** | ~600 seconds (full suite on Windows) |

---

## Sampling Rate

- **After every task commit:** Run `bun test tests/installer-safety.test.js tests/hooks.test.js`
- **After every plan wave:** Run `bun test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds (quick), 600 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 40-01-01 | 01 | 1 | TEST-04 | structural | `bun test tests/installer-safety.test.js --test-name-pattern atomic` | yes | green |
| 40-01-01 | 01 | 1 | -- | refactor | `grep -c "SUBPROCESS_TIMEOUT" tests/hooks.test.js` (expect 12+) | yes | green |
| 40-01-02 | 01 | 1 | CLEAN-01 | state | `test -f .planning/debug/resolved/progress-bar-blink.md` | n/a | green |
| 40-01-02 | 01 | 1 | CLEAN-01 | state | `test -f .planning/debug/resolved/progress-bar-color-threshold.md` | n/a | green |
| 40-01-02 | 01 | 1 | CLEAN-02 | state | `test -d .planning/milestones/v0.4.0-phases/24-quality-verification-bug-fixes` | n/a | green |
| 40-01-02 | 01 | 1 | CLEAN-03 | state | `test ! -f .continue-here.md && test ! -f whats-next.md` | n/a | green |
| 40-01-02 | 01 | 1 | CLEAN-04 | state | `! grep -q "PLAT-0[78]" .planning/PROJECT.md` | n/a | green |
| 40-01-03 | 01 | 1 | TEST-04 | suite | `bun test` (1588+ pass, 0 regressions) | yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

- Atomic write: structural test at `tests/installer-safety.test.js:747`
- Timeout constants: import verification via grep
- Cleanup: filesystem state checks (idempotent once performed)
- Suite gate: full `bun test` execution

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | -- | -- | -- |

All phase behaviors have automated verification. CLEAN-* requirements use state checks rather than unit tests because they verify one-time file operations (archive/delete) where the filesystem state IS the verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none missing)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (quick suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-04

---

## Validation Audit 2026-04-04

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Phase 40 is a cleanup/verification phase. All requirements are verified by automated commands (structural tests, state checks, full suite run). No meaningful Nyquist gaps exist -- cleanup operations are idempotent and verified by filesystem state.
