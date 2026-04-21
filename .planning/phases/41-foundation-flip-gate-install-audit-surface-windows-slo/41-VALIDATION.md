---
phase: 41
slug: foundation-flip-gate-install-audit-surface-windows-slo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated from 41-RESEARCH.md § Validation Architecture; planner refines per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test (JS/TS tests) + shell scripts (CHANGELOG check) |
| **Config file** | `package.json` (scripts) + `bunfig.toml` if present |
| **Quick run command** | `bun test tests/<file>.test.{js,cjs}` (single-file) |
| **Full suite command** | `bun test` (all ~1600 tests) |
| **Estimated runtime** | ~32s on WSL2/Linux/macOS; ~180s on Windows native (pre-D-09 fix); target <90s post-fix |

Additional commands planner will wire:
- `bun run bench` — hyperfine install/compose benchmark (workflow_dispatch CI only in Phase 41)
- `bun run bench:test-timing` — JUnit reporter → test-timing.json aggregator
- `node scripts/check-overrides.js` — flip gate (unit + integration in tests/)
- `bash .changelog-conflict-check.sh --self-test` — fixture self-test
- `bash .changelog-conflict-check.sh` — checked CHANGELOG (pre-push + optional CI step)

---

## Sampling Rate

- **After every task commit:** Run `bun test tests/<target-file>.test.{js,cjs}` (single-file, <15s)
- **After every plan wave:** Run full `bun test` suite (~32-180s)
- **Before `/gsd:verify-work`:** Full suite must be green on Linux, macOS, AND Windows
- **Before Phase 41 CLOSED:** Dedicated `workflow_dispatch` 10x-validation workflow must produce 10 consecutive green runs per platform (D-17)
- **Max feedback latency:** 15s single-file, 90s full suite (Linux)

---

## Per-Task Verification Map

*Populated by the planner from RESEARCH.md's per-REQ-ID test map. Placeholder rows below reflect expected plan breakdown; planner replaces with actual task IDs.*

| REQ-ID | Expected Plan | Wave | Test Type | Automated Command | File Exists | Status |
|--------|---------------|------|-----------|-------------------|-------------|--------|
| UPGRADE-03 | Flip gate + self-test plan | 2 | unit + integration | `bun test tests/check-overrides.test.js` | ✅ extend | ⬜ pending |
| UPGRADE-06 | Changelog-conflict script + fixtures plan | 1 | shell self-test | `bash .changelog-conflict-check.sh --self-test` | ❌ W0 | ⬜ pending |
| SECURITY-01 | audit-ci + suppressions schema plan | 1 | unit (schema AJV) + CI smoke | `bun test tests/suppressions-schema.test.js` + CI job | ❌ W0 | ⬜ pending |
| SECURITY-02 | gitleaks wire-in plan | 1 | CI smoke | GHA `gitleaks` job | ❌ CI | ⬜ pending |
| SECURITY-03 | osv-scanner wire-in plan | 1 | CI smoke | GHA `osv-scanner` job | ❌ CI | ⬜ pending |
| SECURITY-04 | harden-runner audit-mode plan | 1 | CI artifact check | GHA `harden-runner` audit + weekly review | ❌ CI | ⬜ pending |
| SECURITY-05 | eslint-plugin-security audit plan | 1 | unit | `bun run lint` | ✅ | ⬜ pending |
| SECURITY-06 | SECURITY.md + triage policy plan | 1 | manual doc check + lychee link check | `lychee SECURITY.md` | ❌ W0 | ⬜ pending |
| PERF-01 | bench.js + hyperfine harness plan | 2 | integration (local + GHA dispatch) | `bun run bench` | ❌ W0 | ⬜ pending |
| PERF-02 | perf-baseline.json commit plan | 2 | schema AJV + presence | `bun test tests/perf-baseline-schema.test.js` | ❌ W0 | ⬜ pending |
| REL-01 | 10x-validation workflow plan | 3 | GHA workflow_dispatch | 10x-validation.yml manual trigger | ❌ CI | ⬜ pending |
| REL-02 | Subprocess-with-timeout helper + blanket migration plan | 2 | unit (helper) + full suite (migration) | `bun test tests/subprocess-with-timeout.test.js` + `bun test` | ❌ W0 | ⬜ pending |
| REL-03 | REL-03 escape-hatch wrapper + MAINTENANCE.md log plan | 3 | manual + GHA summary check | flagged-on-use surfaces in Windows CI summary | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per RESEARCH.md findings, the following smoke-test validations run in Wave 0 (before plan waves fire) to de-risk medium-confidence decisions:

- [ ] **W0-01:** Run `bun test tests/agent-skills.test.cjs --reporter=junit --reporter-outfile=/tmp/w0.xml` on Linux, macOS, Windows — inspect the emitted XML schema. Confirm `<testsuite name="..." time="..."/>` elements are per-file and parseable by `bench-test-timing.js`.
- [ ] **W0-02:** Install `audit-ci@7.1.0` locally; smoke test `.planning/audits/suppressions.json` with one synthetic GHSA entry. Verify audit-ci accepts our keyed-by-id shape OR document the required transformation.
- [ ] **W0-03:** Run `osv-scanner-action@v2` locally (or via `act`) with `scan-args: "--severity=HIGH"`. Confirm severity filter applies at scanner level or requires SARIF post-processing.
- [ ] **W0-04:** Trigger one GHA run with `step-security/harden-runner@v2` in audit mode against a no-op workflow; inspect the artifact shape (dashboard-URL-only vs machine-readable JSON).
- [ ] **W0-05:** Attempt `gitleaks-action@v2` on this private personal repo without a license key; confirm whether license is required or not.

- [ ] **W0-INFRA-01:** `tests/helpers/subprocess-with-timeout.js` — stub with `runWithTimeout(cmd, args, options)` signature matching D-09/research; unit tests cover timeout path, exit-code path, stderr capture path.
- [ ] **W0-INFRA-02:** `config/suppressions.schema.json` — AJV strict schema matching D-05; validator wired into `bin/validate-configs.js`.
- [ ] **W0-INFRA-03:** `config/perf-baseline.schema.json` + `config/test-timing.schema.json` — AJV strict schemas matching D-15; validators wired.
- [ ] **W0-INFRA-04:** `tests/fixtures/changelog-conflict/{good,bad}-changelog.md` — fixtures per D-03.

*Planner refines the final list during plan-phase; these are the research-implied minimums.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Harden-runner audit log weekly review | SECURITY-04 | Human judgment on anomaly classification | Every Monday, open GHA artifact for latest run of each workflow; append dated line to MAINTENANCE.md Security section noting reviewed + findings (or "none") |
| 10-run validation trigger + sign-off | REL-01 | Maintainer must intentionally kick off the workflow + review | `gh workflow run 10x-validation.yml`; verify 10 green across Linux/macOS/Windows in workflow summary; record outcome in STATE.md before marking Phase 41 CLOSED |
| REL-03 deadline enforcement | REL-03 | Maintainer weekly review against MAINTENANCE.md table | Every Monday, scan Escape-Hatch Decisions Log; any row with `deadline < today` gets a decision: extend with reason, promote to issue, or un-skip + root-cause |
| Security triage policy application | SECURITY-06 | Classification of a finding requires judgment | On any HIGH/CRITICAL finding: apply SECURITY.md policy (critical → v1.2.0 / major → v1.3.0 / minor → backlog) and decide suppression or fix |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (W0-01..05 + W0-INFRA-01..04)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s single-file, <90s full suite (Linux)
- [ ] `nyquist_compliant: true` set in frontmatter once planner confirms per-task rows cover every REQ-ID

**Approval:** pending (planner completes per-task rows, then sets nyquist_compliant: true after checker passes)
