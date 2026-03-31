---
phase: 36
slug: v1-0-0-gap-closure
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-31
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test 1.3.5 |
| **Config file** | bunfig.toml (if exists) or defaults |
| **Quick run command** | `bun test --coverage tests/{file}.test.js` |
| **Full suite command** | `bun test --coverage` |
| **Estimated runtime** | ~600 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun test --coverage tests/{affected-file}.test.js`
- **After every plan wave:** Run `bun test --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds (per-file), 600 seconds (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 36-01-01 | 01 | 1 | CI-04 | config | `gh run list --workflow=ci.yml` (after push) | N/A | ⬜ pending |
| 36-01-02 | 01 | 1 | CI-04 | config | CI matrix run on windows-latest | N/A | ⬜ pending |
| 36-01-03 | 01 | 1 | CI-04 | unit | `bun test tests/preview-update.test.js` | ✅ | ⬜ pending |
| 36-01-04 | 01 | 1 | CI-04 | unit | `bun test tests/preview-update.test.js` (offline) | ✅ | ⬜ pending |
| 36-01-05 | 01 | 1 | CI-04 | unit | `bun test tests/validate-configs.test.js` | ✅ | ⬜ pending |
| 36-02-01 | 02 | 2 | TEST-01 | unit | `bun test --coverage tests/compose.test.js` | ✅ | ⬜ pending |
| 36-02-02 | 02 | 2 | TEST-01 | unit | `bun test --coverage tests/preview-update.test.js tests/preview-update-coverage.test.js` | ✅ | ⬜ pending |
| 36-02-03 | 02 | 2 | TEST-01 | unit | `bun test --coverage tests/check-boundary.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files or framework configuration needed beyond extending existing test files.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI jobs green after push | CI-04 | Requires GitHub Actions run | Push changes, check `gh run list --workflow=ci.yml` |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s per-file
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
