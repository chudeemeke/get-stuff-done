---
phase: 41
slug: foundation-flip-gate-install-audit-surface-windows-slo
status: ready-for-execution
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-21
updated: 2026-06-23
---

# Phase 41 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> `wave_0_complete: true` means the former Wave 0/open research questions have
> been folded into concrete plan tasks and acceptance criteria. It does not mean
> those implementation tasks have already run.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | bun:test (JS/CJS tests) + shell scripts + GitHub Actions workflow lint |
| Config surfaces | `package.json`, `.github/workflows/*.yml`, AJV schemas under `config/` |
| Quick run command | `bun test tests/<file>.test.{js,cjs}` |
| Full suite command | `bun test` |
| Phase-close CI command | `gh workflow run 10x-validation.yml --ref <phase-41-ref-or-default>` after the workflow file is registered on the default branch |

Additional commands wired by the plans:

- `node scripts/check-overrides.js` - override flip gate.
- `bash .changelog-conflict-check.sh --self-test` - changelog fixture self-test.
- `node scripts/audit-check.js --validate-only` - suppression schema/TTL validation.
- `bun run audit:ci` - audit-ci wrapper after `npm install --package-lock-only --ignore-scripts`.
- `node scripts/osv-triage.js --input osv-results.json --output osv-triage.json --fail-on high,critical`.
- `bun run bench` - hyperfine install/compose benchmark wrapper.
- `bun run bench:test-timing` - JUnit timing collector and merge utility.
- `bash scripts/lint-workflows.sh` - workflow syntax/static lint.

---

## Sampling Rate

- After every task commit: run the narrow test or lint command named in that task.
- After every plan: run the plan verification block.
- After every wave: run full `bun test` unless the wave summary records an environment blocker.
- Before Phase 41 can close: register `10x-validation.yml` on the default branch, run it with `gh workflow run 10x-validation.yml --ref <phase-41-ref-or-default>`, and require 10 clean full-suite runs on Linux, macOS, and Windows with zero retries.
- Feedback latency target: under 15s for focused tests, under 90s for full Linux suite where feasible.

---

## Per-Requirement Verification Map

| Req ID | Plan / Task IDs | Automated command(s) | Manual/CI proof | Status |
|--------|------------------|----------------------|-----------------|--------|
| UPGRADE-03 | 41-01 tasks 01-01, 01-02 | `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js`; `bash scripts/lint-workflows.sh`; `node scripts/check-overrides.js` | CI has blocking `override-check` with no job-level `continue-on-error`; boundary remains informational | planned |
| UPGRADE-06 | 41-01 task 01-03; 41-02 task 02-03 | `bash .changelog-conflict-check.sh --self-test`; `bash scripts/lint-workflows.sh` | `MAINTENANCE.md` Bump Runbook names the self-test command | planned |
| SECURITY-01 | 41-02 tasks 02-01, 02-02; 41-03 task 03-02 | `node scripts/audit-check.js --validate-only`; `bun test tests/audit-check.test.js`; `bun run audit:ci` after package-lock generation | `audit-ci` CI job blocks HIGH/CRITICAL unless unexpired suppression covers the id; suppressions with `reReviewDate` more than 60 calendar days after `reviewedDate` fail before audit-ci runs | planned |
| SECURITY-02 | 41-03 tasks 03-02, 03-03 | `bash scripts/lint-workflows.sh` | `secret-scan` job uses gitleaks and records whether action license is required | planned |
| SECURITY-03 | 41-03 tasks 03-01, 03-02 | `bun test tests/osv-triage.test.js`; `node scripts/osv-triage.js --input tests/fixtures/osv/medium-low.json --output .planning/audits/osv-triage-test.json`; `bash scripts/lint-workflows.sh` | OSV job scans `bun.lock`, triages MEDIUM/LOW, and blocks HIGH/CRITICAL in local parser step | planned |
| SECURITY-04 | 41-03 task 03-02 | `bash scripts/lint-workflows.sh` | harden-runner runs in `egress-policy: audit`; weekly review is recorded in MAINTENANCE Security section | planned |
| SECURITY-05 | 41-02 task 02-03 | `bun run lint` | `eslint-plugin-security` remains active for production JS, with any test-only exception documented | planned |
| SECURITY-06 | 41-02 task 02-03; 41-03 task 03-04 | `bun run lint`; `rg -n "critical|high|moderate|low|reReviewDate" SECURITY.md` | `SECURITY.md` triage policy is committed and linked to suppressions workflow | planned |
| PERF-01 | 41-04 tasks 04-01, 04-02, 04-03 | `node scripts/bench.js --help`; `node scripts/bench-test-timing.js --help`; `bun run bench:test-timing -- --platform local --runs 1 --out .planning/perf/test-timing.local.json` | After default-branch workflow registration, `gh workflow run perf-baseline.yml --ref <phase-41-ref>` captures per-platform hyperfine artifacts | planned |
| PERF-02 | 41-04 tasks 04-01, 04-03, 04-04 | `bun test tests/perf-baseline-schema.test.js tests/test-timing-schema.test.js` | `perf-baseline.json` and `.planning/perf/test-timing.json` are committed only after linux/macos/windows artifacts are downloaded and merged; no placeholders | planned |
| REL-01 | 41-07 task 07-01 | `bash scripts/lint-workflows.sh` | After default-branch workflow registration, `gh workflow run 10x-validation.yml --ref <phase-41-ref-or-default>` must pass 10 clean runs per platform before Phase 41 closes | planned |
| REL-02 | 41-05 tasks 05-01, 05-02; 41-06 task 06-01 | `bun test tests/subprocess-with-timeout.test.js`; focused subprocess-heavy test set; `rg -n "execSync|spawnSync|exec\\(|spawn\\(" tests -g "*.js" -g "*.cjs"` | Any residual real subprocess call is listed with file, line, and reason in plan summaries | planned |
| REL-03 | 41-06 tasks 06-02, 06-03; 41-07 tasks 07-02, 07-03 | `bun test tests/flake-triage.test.js`; `node scripts/flake-triage.js --scan-rel03 --output-summary .planning/audits/rel03-summary-test.md`; `node scripts/flake-triage.js --validate-rel03-wrappers`; `bash scripts/lint-workflows.sh` | D-11 timebox and REL-03 issue/deadline/reviewer table live in `MAINTENANCE.md`; active skips also require the in-test `test.skip.if(... reason: 'REL-03-N: <issue-url>, deadline YYYY-MM-DD')` wrapper or documented node:test equivalent | planned |

---

## Former Wave 0 / Open Question Resolution

| Former item | Resolution in plan set |
|-------------|------------------------|
| JUnit XML schema for timing | Plan 04 task 04-02 creates `bench-test-timing` partial and merged output modes; tests verify partial output cannot satisfy committed merged schema. |
| audit-ci severity/suppression granularity | Plan 02 task 02-02 owns a wrapper that validates rich suppressions, enforces the 60 calendar-day maximum TTL, and transforms unexpired ids into audit-ci allowlist entries. |
| OSV severity filtering | Plan 03 tasks 03-01 and 03-02 choose same-job direct scanner action plus local `osv-triage --fail-on high,critical`, preserving MEDIUM/LOW triage. |
| harden-runner artifact shape | Plan 03 task 03-04 requires the summary to state audit artifact behavior found during implementation; block-mode is deferred to Phase 44. |
| gitleaks action license | Plan 03 task 03-02 treats license failure as a blocker and forbids silent fallback to the direct-binary workaround without user approval. |
| subprocess helper stub | Plan 05 task 05-01 creates and tests `tests/helpers/subprocess-with-timeout.js`. |
| strict schemas | Plan 02 owns suppressions schema; Plan 04 owns perf and timing schemas. |
| changelog fixtures | Plan 01 task 01-03 creates `good-changelog.md` and `bad-changelog.md`. |
| 10x validation workflow | Plan 07 task 07-01 creates `10x-validation.yml`. |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Gitleaks action license/behavior | SECURITY-02 | GitHub Action behavior depends on repo account context | First CI run records whether `gitleaks-action@v2` requires a license; if it does, stop for user approval before fallback. |
| Harden-runner audit review | SECURITY-04 | Human review decides whether findings are anomalous | Weekly, open latest workflow summary/artifact and append dated review line to `MAINTENANCE.md` Security section. |
| Perf baseline first-run | PERF-01/PERF-02 | Newly-created `workflow_dispatch` workflows require default-branch registration before dispatch | Register `perf-baseline.yml` on default, run `gh workflow run perf-baseline.yml --ref <phase-41-ref>`, download artifacts, merge them, and commit only real linux/macos/windows data. |
| 10-run validation sign-off | REL-01 | Newly-created `workflow_dispatch` workflows require default-branch registration before dispatch | Run `gh workflow run 10x-validation.yml --ref <phase-41-ref-or-default>` after registration; Phase 41 remains open unless all 30 platform/run cells pass. If any fail, Phase 41 reopens into REL-02/REL-03 triage before Phase 42. |
| REL-03 deadline enforcement | REL-03 | Requires maintainer judgment at deadline | Scan Escape-Hatch Decisions Log weekly; expired rows require extension with reason, issue escalation, or unskip/root-cause. |

---

## Validation Sign-Off

- [x] Every Phase 41 requirement maps to at least one plan and concrete task.
- [x] Every mapped task has an automated command or explicit manual/CI proof.
- [x] Former Wave 0 research questions are folded into plan tasks.
- [x] No watch-mode flags are used.
- [x] No missing-platform perf or timing artifact may be fabricated.
- [x] D-11 timebox is encoded in Plan 07 and `MAINTENANCE.md` acceptance.

Approval: ready for plan checker.
