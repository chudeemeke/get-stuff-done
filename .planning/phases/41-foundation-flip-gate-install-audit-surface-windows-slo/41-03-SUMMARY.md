---
phase: 41-foundation-flip-gate-install-audit-surface-windows-slo
plan: 03
subsystem: security
tags: [audit-ci, gitleaks, osv, harden-runner, ci]

requires:
  - phase: 41-02
    provides: Audit suppression schema, audit-ci wrapper, and security triage policy
provides:
  - Blocking audit-ci CI job for HIGH/CRITICAL dependency findings
  - Blocking gitleaks CI job with documented fixture-only allowlists
  - OSV scanner CI job with deterministic local triage for HIGH/CRITICAL block and MEDIUM/LOW issue routing
  - Harden-runner audit mode on all new security jobs
affects: [phase-41, security-audit, ci]

tech-stack:
  added: []
  updated:
    - "@anthropic-ai/claude-code"
  removed:
    - svgexport
  patterns:
    - Run scanners in CI with local deterministic triage before issue creation
    - Use harden-runner in audit mode before any block-mode promotion
    - Keep temporary npm package-lock generation out of tracked source

key-files:
  created:
    - scripts/osv-triage.js
    - scripts/run-upstream-compat-ci.js
    - tests/ci-workflow.test.js
    - tests/run-upstream-compat.test.js
    - tests/run-upstream-compat-ci.test.js
    - tests/osv-triage.test.js
    - tests/fixtures/osv/high-critical.json
    - tests/fixtures/osv/medium-low.json
  modified:
    - .github/workflows/ci.yml
    - .gitleaks.toml
    - scripts/audit-check.js
    - scripts/run-upstream-compat.js
    - tests/audit-check.test.js
    - tests/installer-safety.test.js
    - tests/test-path-validation.test.js
    - package.json
    - bun.lock

key-decisions:
  - "The OSV direct action path is intentionally used instead of OSV's reusable workflow so harden-runner telemetry and local triage run in the same job."
  - "The raw OSV scan step may continue on error only so the following local triage step can decide whether HIGH/CRITICAL findings block."
  - "The unused svgexport dev dependency was removed instead of forcing an unsafe ws override across incompatible major consumers."
  - "CI runtime proof remains required for account-specific gitleaks license behavior and harden-runner artifact shape."

patterns-established:
  - "OSV medium/low findings become issue-ready deterministic records with dedupe by vulnerability id plus package name."
  - "Bun lockfile security overrides must be flat; nested overrides are not relied on."
  - "Audit-ci is executed without shell splitting so Windows paths with spaces cannot break the gate."

requirements-completed: [SECURITY-01, SECURITY-02, SECURITY-03, SECURITY-04]

duration: multi-session
completed: 2026-07-01
---

# Phase 41 Plan 03: Security Scanner CI Surface and OSV Triage Summary

**Blocking dependency/secret scan CI jobs with deterministic OSV triage and hardened audit-mode telemetry**

## Performance

- **Duration:** Multi-session continuation on 2026-07-01.
- **Completed:** 2026-07-01T16:18:39+01:00
- **Tasks:** 4
- **Files modified:** 10 source/test/config files plus this summary.

## Accomplishments

- Added `scripts/osv-triage.js` with deterministic normalization, dedupe, issue-ready output, and `--fail-on high,critical` blocking behavior.
- Added OSV fixtures and parser tests for HIGH/CRITICAL blocking and MEDIUM/LOW issue routing labels.
- Added `secret-scan`, `audit-ci`, and `osv-scanner` CI jobs.
- Installed `step-security/harden-runner@v2` with `egress-policy: audit` in every new security job.
- Wired `gitleaks/gitleaks-action@v2` with full-history checkout and `.gitleaks.toml`.
- Converted `.gitleaks.toml` to current `[[allowlists]]` form with fixture-only rationale and no broad source/root exemptions.
- Wired `google/osv-scanner-action/osv-scanner-action@v2` against `bun.lock`; the raw scan step is the only allowed `continue-on-error` inside that job.
- Added GitHub issue/comment routing for MEDIUM/LOW OSV findings using `actions/github-script@v8`.
- Hardened `scripts/audit-check.js` so it finds Bun Windows shims and runs `audit-ci` without shell path splitting.
- Cleared local HIGH/CRITICAL audit findings by bumping `@anthropic-ai/claude-code`, adding flat Bun-compatible security overrides, and removing unused `svgexport`.

## Task Commits

1. **Task 03-01 RED: OSV parser tests and fixtures** - `399365f` (test)
2. **Task 03-01 GREEN: OSV triage parser** - `896d2db` (feat)
3. **Task 03-02: Security CI jobs** - `32cad69` (chore)
4. **Task 03-03: Gitleaks allowlist audit** - `ceedacc` (chore)
5. **Audit-ci shim RED/GREEN** - `e797ab0`, `068c387`
6. **Audit-ci path-safe execution RED/GREEN** - `4168b9d`, `e1e4c17`
7. **Dependency remediation for HIGH audit findings** - `0005f0a`

## Files Created/Modified

- `scripts/osv-triage.js` - parser/CLI for deterministic OSV triage.
- `tests/osv-triage.test.js` - parser and CLI coverage.
- `tests/fixtures/osv/high-critical.json` - blocking severity fixture.
- `tests/fixtures/osv/medium-low.json` - issue-routing fixture.
- `.github/workflows/ci.yml` - security scanner jobs and harden-runner audit mode.
- `.gitleaks.toml` - fixture-only allowlists using current array form.
- `scripts/audit-check.js` - Windows shim discovery and no-shell audit-ci execution.
- `tests/audit-check.test.js` - shim lookup and path-safe command coverage.
- `package.json` and `bun.lock` - security dependency remediation.

## Verification

- `bun test tests/osv-triage.test.js` - passed, 5 tests.
- `node scripts/osv-triage.js --input tests/fixtures/osv/medium-low.json --output .planning/audits/osv-triage-test.json` - passed; deterministic output was generated and then removed.
- `bun test tests/audit-check.test.js` - passed, 9 tests.
- `bash scripts/lint-workflows.sh` - passed.
- Required workflow token scan for `audit-ci`, `secret-scan`, `osv-scanner`, `harden-runner@v2`, `gitleaks/gitleaks-action@v2`, `google/osv-scanner-action/osv-scanner-action@v2`, `osv-triage`, and `--fail-on high,critical` - passed.
- `bun install --frozen-lockfile --ignore-scripts` - passed from a clean local `node_modules`.
- `npm install --package-lock-only --ignore-scripts` - passed; temporary lock reported 9 moderate and 0 high/critical findings.
- `bun run audit:ci` - passed with 0 HIGH/CRITICAL findings.
- `bun run lint` - passed with 111 warnings and 0 errors.
- `bun run compose` - passed.
- `BUN_TEST_TIMEOUT=30000 bun test --coverage` - passed, 1,690 tests, 0 failures. Existing aggregate coverage remains below the user's 95% per-metric standard: 94.86% functions and 93.08% lines.
- `node scripts/check-no-test-files-in-dist.js` - passed.
- `node scripts/check-parity.js` - passed, 15/15 checks.
- `node scripts/check-debt-ratchet.cjs --no-compose` - passed.
- `node scripts/check-overrides.js` - passed, 2 overrides fresh.

## CI Runtime Notes

- **First PR run observed:** `https://github.com/chudeemeke/get-stuff-done/actions/runs/28531610222` on PR #3 at `c515393`.
- **Gitleaks action license:** No license blocker appeared. The action failed before scanning because `GITHUB_TOKEN` is now required for pull request scans. Fixed by passing `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to `gitleaks/gitleaks-action@v2`; the next PR run is the scan-proof authority.
- **Harden-runner artifact shape:** Harden-runner setup and post steps ran successfully in the first PR run. Artifact/dashboard shape still needs review from the successful post-fix run before any block-mode discussion.
- **OSV action path:** The direct action path remains intentional, but the floating `@v2` ref does not exist. Verified remote tags and pinned `google/osv-scanner-action/osv-scanner-action@v2.3.8`.
- **Informational upstream-compat check:** GitHub surfaced the job as red despite the intended informational stance. Added `scripts/run-upstream-compat-ci.js` so the job reports drift in logs and step summary while exiting 0.
- **Active-authority compat target:** `scripts/run-upstream-compat.js` still pointed at legacy `dist/get-shit-done`. It now derives the composed package root from `active.paths.gsdTools` and targets `dist/gsd-core` for the Open GSD authority. Local Windows observation is now 11 compat failures, and the debt ratchet passes (`compat (windows): 11 / 133`). Do not lower linux/macos thresholds until the PR matrix provides OS evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking] `audit-ci` failed on Windows because the wrapper could select a shell shim and split paths with spaces**
- **Found during:** Plan 03 audit verification.
- **Issue:** `scripts/audit-check.js` could find Bun/Windows shims but needed no-shell execution semantics for paths with spaces.
- **Fix:** Added shim discovery tests, preferred executable shims, and built platform-specific commands for `.cmd`, `.bat`, and `.ps1` while running `.exe`/bare shims with `shell: false`.
- **Files modified:** `scripts/audit-check.js`, `tests/audit-check.test.js`
- **Verification:** `bun test tests/audit-check.test.js` and `bun run audit:ci` passed.
- **Committed in:** `e797ab0`, `068c387`, `4168b9d`, `e1e4c17`

**2. [Blocking] The new audit-ci gate exposed real HIGH dependency findings**
- **Found during:** `bun run audit:ci`.
- **Issue:** The initial audit gate failed on HIGH findings in direct and transitive dependencies, including the obsolete `svgexport -> puppeteer -> ws@7` chain.
- **Fix:** Bumped `@anthropic-ai/claude-code`, added flat Bun-compatible overrides for `fast-uri`, `flatted`, `hono`, and `minimatch`, removed unused `svgexport`, reset local `node_modules`, regenerated `bun.lock`, and verified audit-ci from a clean install path.
- **Files modified:** `package.json`, `bun.lock`
- **Verification:** `bun install --frozen-lockfile --ignore-scripts`, `npm install --package-lock-only --ignore-scripts`, and `bun run audit:ci` passed.
- **Committed in:** `0005f0a`

**3. [Blocking] First PR run exposed CI action drift and Unix-only test assumptions**
- **Found during:** PR #3 run `28531610222`.
- **Issue:** `gitleaks/gitleaks-action@v2` required `GITHUB_TOKEN`, OSV `@v2` was not a resolvable ref, Unix test runners exposed a platform-specific `audit-ci.exe` expectation and an unsafe `/fake-bashrc` traversal fixture path, and upstream-compat was both red in the PR rollup and pointed at the retired legacy dist root.
- **Fix:** Added CI workflow contract tests, pinned OSV to `v2.3.8`, passed the gitleaks token, added the non-blocking upstream-compat CI wrapper, made the compat runner authority-derived, fixed the Unix test assumptions, and made the path meta-test build generated artifacts when needed.
- **Files modified:** `.github/workflows/ci.yml`, `scripts/run-upstream-compat.js`, `scripts/run-upstream-compat-ci.js`, `tests/ci-workflow.test.js`, `tests/run-upstream-compat.test.js`, `tests/run-upstream-compat-ci.test.js`, `tests/audit-check.test.js`, `tests/installer-safety.test.js`, `tests/test-path-validation.test.js`
- **Verification:** `bash scripts/lint-workflows.sh`, `bun run lint`, `node scripts/check-debt-ratchet.cjs --no-compose`, `node scripts/run-upstream-compat-ci.js`, targeted CI/compat tests, and `bun test --coverage` all passed locally.

---

**Total deviations:** 3 auto-fixed (3 blocking).
**Impact on plan:** Both fixes strengthen the intended Plan 03 security gate rather than changing its scope.

## Issues Encountered

- Running `bun update @anthropic-ai/claude-code fast-uri flatted minimatch hono ws` without `--ignore-scripts` triggered the package installer and updated the developer's global Claude/GSD install under the home profile. This was an external side effect of that command; subsequent dependency work used `--ignore-scripts`.
- Bun 1.3.5 warns that nested overrides are unsupported. The final implementation uses flat overrides that are reflected in `bun.lock`.
- `bun run lint` still emits existing eslint-security warnings. The command exits 0, so this is warning debt rather than a Plan 03 blocker.
- Full coverage passes as a command but remains below the user's 95% per-metric quality standard. This is existing quality debt to address before market-ready ship, not caused by Plan 03.

## User Setup Required

None locally. The next GitHub Actions run should be reviewed for account-specific gitleaks license behavior and harden-runner audit output.

## Next Phase Readiness

Plan 04 can proceed. Phase 41 still needs the perf baseline harness and real three-platform artifact protocol before Wave 2 closes.

## Self-Check: PASSED

---
*Phase: 41-foundation-flip-gate-install-audit-surface-windows-slo*
*Completed: 2026-07-01*
