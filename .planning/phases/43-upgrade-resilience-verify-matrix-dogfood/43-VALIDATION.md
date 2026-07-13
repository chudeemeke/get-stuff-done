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
| **Framework** | Bun functional tests, Jest CommonJS parity, required Node contract suites, and native multi-process c8 coverage |
| **Config file** | `package.json`, `bun.lock`, `bunfig.toml`, `jest.coverage.config.cjs`, `config/production-source-contract.json`, `.github/workflows/*.yml` |
| **Quick run command** | `bun test tests/check-overrides.test.js tests/verify-upgrade.test.js tests/vetted-upstream-versions.test.js` |
| **Full suite command** | `bun run phase43:preflight && bun run lint && bun test && bun run test:coverage:four-metric && node scripts/check-overrides.js && node scripts/vetted-upstream-versions.js --validate && node scripts/validate-phase43-evidence.js --require-closeout && bun run lint:docs && git diff --check` |
| **Estimated runtime** | Focused tasks <=8 minutes; complete local closeout 15-25 minutes, excluding live CI |

---

## Sampling Rate

- **After every task commit:** Run the focused command named in that task.
- **After every plan wave:** Run focused gates plus `bun run lint && bun test && bun run lint:docs && git diff --check`; from Wave 14 onward run that plan's named coverage scope when present, and from Wave 21 onward run the complete aggregate plus real production-assurance validation.
- **Before `/gsd-verify-work`:** Full suite and required GitHub Actions checks must be green or documented as non-blocking informational jobs.
- **Max focused feedback latency:** 8 minutes. Full aggregate/closeout gates have a 25-minute local budget; CI waits are recorded separately.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 43-01-* | 01 | 1 | UPGRADE-01 | T-43-01 | Upgrade simulation uses temp install targets and emits full D-03 evidence | unit/integration | `bun test tests/verify-upgrade.test.js tests/ci-workflow.test.js` | exists | passed |
| 43-02-* | 02 | 2 | UPGRADE-01 | T-43-02 | Installer rollback protects user files and provenance separates fork/upstream package versions | unit/integration | `bun test tests/installer-safety.test.js tests/version-provenance.test.js` | exists | passed |
| 43-03-* | 03 | 3 | UPGRADE-02 | T-43-03 | Candidate manifest cannot mark versions vetted before matrix evidence exists | unit | `bun test tests/vetted-upstream-versions.test.js` | exists | passed |
| 43-04-* | 04 | 4 | UPGRADE-02, UPGRADE-04 | T-43-04 | Matrix reads exact vetted pins and blocks only current pin by policy while CI remains report-only per AF-7 | unit/workflow | `bun test tests/run-upstream-compat-ci.test.js tests/ci-workflow.test.js` | exists | passed |
| 43-05-* | 05 | 5 | UPGRADE-08 | T-43-05 | Semantic comparator cannot suppress real JS behavior changes | unit/integration | `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` | exists | passed |
| 43-06-* | 06 | 6 | UPGRADE-07 | T-43-06 | Check-update preserves fork identity, role routing, stale detection, and exact throttles | unit/package | `bun test tests/hooks.test.js tests/hooks-manifest.test.js` | exists | passed |
| 43-07-* | 07 | 7 | UPGRADE-07 | T-43-07 | Statusline and hook packaging preserve runtime behavior and current-pin snapshot honesty | unit/package | `bun test tests/hooks.test.js tests/compose.test.js` | exists | passed |
| 43-08-* | 08 | 8 | UPGRADE-09 | T-43-08 | Override churn is generated deterministically from upstream/override evidence | unit | `bun test tests/override-churn.test.js` | exists | passed |
| 43-09-* | 09 | 9 | SHIP-03A | T-43-09 | SBOM is generated into dist and included in package/CI evidence | unit/package | `bun test tests/compose.test.js tests/ci-workflow.test.js` | exists | passed |
| 43-10-* | 10 | 10 | UPGRADE-05 | T-43-10 | Dogfood bump uses reviewed exact stable pin before snapshot refresh | manual/package | `node scripts/vetted-upstream-versions.js --validate` | exists | passed |
| 43-11A-* | 11A | 11 | UPGRADE-02, UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11A | Every compatibility suite is classified and candidate failures report per-suite evidence | unit/integration | `bun test tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js` | pending | pending |
| 43-11B-* | 11B | 12 | UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11B | Tests adopt supported Open GSD semantics while fork runtime overrides run against each candidate | contract/package | focused Node suites plus active-pin `compat-matrix` | pending | pending |
| 43-11C-* | 11C | 13 | UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11C | Roadmap updates preserve original EOL and unrelated formatting; exact durable N=3 report bytes prove all reviewed pins while the original plan remains blocked | integration/full package | `node --test tests/roadmap.test.cjs` plus full `compat-matrix --require-all` | pending | pending |
| 43-11D-* | 11D | 14 | SHIP-08A, SHIP-08B | T-43-11D | Exact source ownership, exhaustive/disjoint groups, Windows junction identity, Jest parity, separate snapshot assurance, and cleanup are proven | unit/integration | coverage-foundation scope plus source-contract and junction fixtures | pending | pending |
| 43-11K-* | 11K | 15 | UPGRADE-05, SHIP-03A, SHIP-08A | T-43-11K | Windows SBOM env behavior and exact toolchain preflight are proven; the new executable is classified before later coverage | unit/integration/package | SBOM, toolchain, source-contract, and dist fixtures | pending | pending |
| 43-11E-* | 11E | 16 | SHIP-08A | T-43-11E | Launcher and runtime-support groups each reach all four thresholds without behavior drift | unit/integration | launchers and runtime-support coverage scopes | pending | pending |
| 43-11F-* | 11F | 17 | SHIP-03A, SHIP-08A | T-43-11F | Distribution/build groups reach all thresholds and package/SBOM bytes remain valid | unit/package | distribution-core/support scopes plus `bun run dist` | pending | pending |
| 43-11G-* | 11G | 18 | SHIP-08A | T-43-11G | Audit, quality, perf, flake, cousin, and oversight groups remain fail-closed at all thresholds | unit/integration | quality-security/reliability scopes | pending | pending |
| 43-11H-* | 11H | 19 | UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-08, SHIP-08A, SHIP-08B | T-43-11H | Upgrade discovery/execution groups reach all thresholds without weakening exact-pin, snapshot, or N=3 policy | unit/integration | upgrade-discovery/execution scopes | pending | pending |
| 43-11I-* | 11I | 20 | UPGRADE-07, SHIP-08A | T-43-11I | Hook subprocess and sync native coverage reach all thresholds with no residual junction/temp state | integration | hooks and sync coverage scopes | pending | pending |
| 43-11J-* | 11J | 21 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11J | Validator code is classified before final aggregate measurement; real assurance precedes a transactional blocker transition | full/CI | validator scope, complete four-metric command, and real production-assurance modes | pending | pending |
| 43-11-* | 11 | 22 | UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11 | Post-bump mutations regenerate fork coverage, snapshot assurance, N=3 evidence, and blocker bindings before a summary exists | full/package | `bun run dist`, durable N=3 report, complete coverage, and production-assurance validator | blocked | blocked |
| 43-12-* | 12 | 23 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-12 | Valid human D-7 checkpoint plus machine evidence validator close the phase against actual artifacts | full/CI/checkpoint evidence | full local gates, four-metric coverage, snapshot assurance, closeout validator, and GitHub Actions | pending | pending |

---

## Wave 0 Requirements

- [x] `tests/verify-upgrade.test.js` exists before verifier implementation.
- [x] `tests/installer-safety.test.js` and `tests/version-provenance.test.js` exist before installer/provenance changes.
- [x] `tests/vetted-upstream-versions.test.js` exists before manifest helper implementation.
- [x] `tests/run-upstream-compat-ci.test.js` exists before matrix runner implementation.
- [x] `tests/check-overrides.test.js` covers semantic override behavior before gate changes.
- [x] Hook tests are extended before rewriting hook overrides.
- [x] Churn/SBOM tests are added before changing `package.json#files` or `dist` lifecycle scripts.
- [ ] Compatibility registry and per-suite report tests exist before runner policy changes.
- [ ] Candidate-path runtime tests exist before removing the repo-root runtime exclusion.
- [ ] Roadmap CRLF and byte-stability tests remain red before the document adapter is implemented.
- [ ] Owned-temp cleanup tests exist before compatibility runners adopt recursive cleanup.
- [ ] Jest adapter conformance, source-contract, multi-process merge, and four-metric threshold fixtures exist before runner implementation.
- [ ] Coverage-group gap/overlap/new-path fixtures and the permanent Windows junction child-process fixture exist before scoped coverage can pass.
- [ ] Durable compatibility evidence exists before any blocker state can become fully resolved.
- [ ] Closeout validator negative fixtures exist before any Phase 43 passed report can be created.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live upstream dogfood bump evidence | UPGRADE-05 | Requires real PR timing, qualitative friction, and human confirmation | Use the Plan 12 `checkpoint:human-verify`; machine-capture CI conclusions, record structured D-7 evidence, render it in `MAINTENANCE.md`, and confirm the values before closeout. |

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies, except the explicitly authorized blocking D-7 human checkpoint.
- [x] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers missing test-file references.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-07-03 for planning
