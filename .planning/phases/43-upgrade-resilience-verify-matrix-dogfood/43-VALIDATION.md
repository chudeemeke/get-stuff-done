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
| 43-01-* | 01 | 1 | UPGRADE-01 | T-43-01 | Upgrade simulation uses temp install targets and emits full D-03 evidence | unit/integration | `bun test tests/verify-upgrade.test.js tests/ci-workflow.test.js` | exists | passed |
| 43-02-* | 02 | 2 | UPGRADE-01 | T-43-02 | Installer rollback protects user files and provenance separates fork/upstream package versions | unit/integration | `bun test tests/installer-safety.test.js tests/version-provenance.test.js` | exists | passed |
| 43-03-* | 03 | 3 | UPGRADE-02 | T-43-03 | Candidate manifest cannot mark versions vetted before matrix evidence exists | unit | `bun test tests/vetted-upstream-versions.test.js` | exists | passed |
| 43-04-* | 04 | 4 | UPGRADE-04 | T-43-04 | Matrix reads exact vetted pins and blocks only current pin by policy | unit/workflow | `bun test tests/run-upstream-compat-ci.test.js tests/ci-workflow.test.js` | pending | pending |
| 43-05-* | 05 | 5 | UPGRADE-08 | T-43-05 | Semantic comparator cannot suppress real JS behavior changes | unit/integration | `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` | exists | pending |
| 43-06-* | 06 | 6 | UPGRADE-07 | T-43-06 | Check-update preserves fork identity, role routing, stale detection, and exact throttles | unit/package | `bun test tests/hooks.test.js tests/hooks-manifest.test.js` | exists | pending |
| 43-07-* | 07 | 7 | UPGRADE-07 | T-43-07 | Statusline and hook packaging preserve runtime behavior and current-pin snapshot honesty | unit/package | `bun test tests/hooks.test.js tests/compose.test.js` | exists | pending |
| 43-08-* | 08 | 8 | UPGRADE-09 | T-43-08 | Override churn is generated deterministically from upstream/override evidence | unit | `bun test tests/override-churn.test.js` | pending | pending |
| 43-09-* | 09 | 9 | SHIP-03 | T-43-09 | SBOM is generated into dist and included in package/CI evidence | unit/package | `bun test tests/compose.test.js tests/ci-workflow.test.js` | pending | pending |
| 43-10-* | 10 | 10 | UPGRADE-05 | T-43-10 | Dogfood bump uses reviewed exact stable pin before snapshot refresh | manual/package | `node scripts/vetted-upstream-versions.js --validate` | pending | pending |
| 43-11-* | 11 | 11 | UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03 | T-43-11 | Post-bump gates refresh snapshots, churn, SBOM, and matrix evidence | full/package | `bun run dist && node scripts/check-overrides.js` | pending | pending |
| 43-12-* | 12 | 12 | UPGRADE-05 | T-43-12 | D-7 maintenance evidence and verification close the phase against actual artifacts | full/CI/manual evidence | `bun run lint && bun test && bun run lint:docs && git diff --check` plus GitHub Actions | pending | pending |

---

## Wave 0 Requirements

- [x] `tests/verify-upgrade.test.js` exists before verifier implementation.
- [x] `tests/installer-safety.test.js` and `tests/version-provenance.test.js` exist before installer/provenance changes.
- [x] `tests/vetted-upstream-versions.test.js` exists before manifest helper implementation.
- [ ] `tests/run-upstream-compat-ci.test.js` exists before matrix runner implementation.
- [ ] `tests/check-overrides.test.js` covers semantic override behavior before gate changes.
- [ ] Hook tests are extended before rewriting hook overrides.
- [ ] Churn/SBOM tests are added before changing `package.json#files` or `dist` lifecycle scripts.

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
