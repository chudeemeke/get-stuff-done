---
phase: 35
slug: migration-ship-v3-0-0
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
---

# Phase 35 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test (bun 1.3.5) |
| **Config file** | none (bun defaults) |
| **Quick run command** | `bun test tests/installer-v3.test.js` |
| **Full suite command** | `bun test` |
| **Estimated runtime** | ~570 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun test tests/installer-v3.test.js`
- **After every plan wave:** Run `bun test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (installer tests only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | MIG-03, MIG-04, MIG-05 | unit | `bun test tests/installer-v3.test.js` | Existing | pending |
| 35-01-02 | 01 | 1 | MIG-04, MIG-05 | unit | `bun test tests/installer-v3.test.js` | Existing | pending |
| 35-02-01 | 02 | 2 | MIG-01, MIG-02, MIG-06 | manual | `git show v2.4.0-legacy --format="%H" --no-patch` | N/A (git) | pending |
| 35-02-02 | 02 | 2 | MIG-01 | manual | `git ls-remote --tags origin \| grep v2.4.0-legacy` | N/A (git) | pending |
| 35-03-01 | 03 | 3 | MIG-04, MIG-05 | smoke | `npm pack && tar tf *.tgz` | Wave 0 | pending |
| 35-03-02 | 03 | 3 | MIG-05 | smoke | `bunx @chude/get-stuff-done@3.0.0 --help` | Post-publish | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Update `tests/installer-v3.test.js` -- add auto-clean (non-interactive) tests, negative detection tests, isSafeToClean() tests
- [ ] Add npm pack smoke test -- verify files array produces correct tarball contents
- [ ] Update launcher test if bin/gsd.js imports change (tryRequire pattern)

*These are addressed in Plan 35-01 tasks (TDD -- tests written before implementation).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Legacy tag on correct commit | MIG-01 | Git operation, not code | `git show v2.4.0-legacy --format="%H" --no-patch` -- verify matches v2.4.0 tag |
| Overlay structure on main | MIG-02 | Already true by construction | `ls dist/ overlay/ bin/` -- verify dirs exist |
| .planning/ history preserved | MIG-03 | Git history, not code | `git log --oneline .planning/ \| wc -l` -- verify count > 0 |
| Rollback documented | MIG-06 | Documentation content | Visual inspection of UPGRADING.md |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s (installer tests)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
