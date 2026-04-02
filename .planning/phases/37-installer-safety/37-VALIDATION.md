---
phase: 37
slug: installer-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 37 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test |
| **Config file** | bunfig.toml |
| **Quick run command** | `bun test tests/installer-v3.test.js` |
| **Full suite command** | `bun test` |
| **Estimated runtime** | ~60 seconds (installer tests are subprocess-heavy) |

---

## Sampling Rate

- **After every task commit:** Run `bun test tests/installer-v3.test.js`
- **After every plan wave:** Run `bun test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | INST-01 | unit | `bun test tests/installer-v3.test.js` | Exists (extend) | pending |
| 37-01-02 | 01 | 1 | INST-02 | unit | `bun test tests/installer-v3.test.js` | Exists (extend) | pending |
| 37-01-03 | 01 | 1 | INST-03 | unit | `bun test tests/installer-v3.test.js` | Exists (extend) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Extract `detectV2`, `removeGsdFiles`, `isSafeToClean`, `readInstalledManifest` via `module.exports` behind `require.main === module` guard
- [ ] Remove stale test asserting `src/` triggers v2 detection (line 293 of installer-v3.test.js)

*These are pre-requisites for the unit test strategy identified in research.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full end-to-end install with user content | INST-01 | Requires real Claude Code environment + user files | Install to temp --config-dir with CLAUDE.md, rules/, settings.json present. Verify all survive. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
