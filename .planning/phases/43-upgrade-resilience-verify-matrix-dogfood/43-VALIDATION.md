---
phase: 43
slug: upgrade-resilience-verify-matrix-dogfood
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-03
---

# Phase 43 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bun test plus Node script smoke checks |
| **Config file** | `package.json`, `bun.lock`, `.github/workflows/*.yml` |
| **Quick run command** | `bun test tests/check-overrides.test.js tests/verify-upgrade.test.js tests/vetted-upstream-versions.test.js` |
| **Full suite command** | `bun run lint && bun test && bun run lint:docs && git diff --check` |
| **Estimated runtime** | 2-8 minutes locally, excluding live CI |

---

## Sampling Rate

- **After every task commit:** Run the focused command named in that task.
- **After every plan wave:** Run `bun run lint && bun test && bun run lint:docs && git diff --check`.
- **Before `/gsd-verify-work`:** Full suite and required GitHub Actions checks must be green or documented as non-blocking informational jobs.
- **Max feedback latency:** 8 minutes for local gates; CI waits are recorded in the plan summary.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 43-01-* | 01 | 1 | UPGRADE-01 | T-43-01 | Upgrade simulation uses temp install targets and does not mutate global config | unit/integration | `bun test tests/verify-upgrade.test.js tests/installer-safety.test.js` | pending | pending |
| 43-02-* | 02 | 1 | UPGRADE-02, UPGRADE-04 | T-43-02 | Matrix reads exact vetted pins and blocks only current pin by policy | unit/workflow | `bun test tests/vetted-upstream-versions.test.js tests/run-upstream-compat-ci.test.js tests/ci-workflow.test.js` | pending | pending |
| 43-03-* | 03 | 1 | UPGRADE-08 | T-43-03 | Semantic comparator cannot suppress real JS behavior changes | unit/integration | `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` | exists | pending |
| 43-04-* | 04 | 2 | UPGRADE-07 | T-43-04 | Hook rewrite preserves fork package identity, role routing, and throttling | unit/package | `bun test tests/hooks.test.js tests/hooks-manifest.test.js` | exists | pending |
| 43-05-* | 05 | 2 | UPGRADE-09, SHIP-03 | T-43-05 | Generated churn and SBOM are deterministic and package-visible | unit/package | `bun test tests/compose.test.js tests/ci-workflow.test.js` | exists | pending |
| 43-06-* | 06 | 3 | UPGRADE-05 | T-43-06 | Dogfood bump uses reviewed stable pin and records evidence | full/CI/manual evidence | `bun run lint && bun test && bun run lint:docs && git diff --check` plus GitHub Actions | pending | pending |

---

## Wave 0 Requirements

- [ ] `tests/verify-upgrade.test.js` exists before verifier implementation.
- [ ] `tests/vetted-upstream-versions.test.js` exists before matrix implementation.
- [ ] Churn/SBOM tests are added before changing `package.json#files` or `dist` lifecycle scripts.
- [ ] Hook tests are extended before rewriting hook overrides.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live upstream dogfood bump evidence | UPGRADE-05 | Requires real PR/CI timing and gate-observation evidence | Record target version, PR number, duration, gates run, issues caught, and friction in `MAINTENANCE.md` D-7 evidence record. |

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers missing test-file references.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-07-03 for planning
