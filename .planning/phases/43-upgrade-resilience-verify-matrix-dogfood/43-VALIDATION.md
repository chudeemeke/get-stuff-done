---
phase: 43
slug: upgrade-resilience-verify-matrix-dogfood
status: approved
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
| **Quick run command** | `bun run test -- ./tests/check-overrides.test.js ./tests/verify-upgrade.test.js ./tests/vetted-upstream-versions.test.js` |
| **Full suite command** | `bun run phase43:preflight && bun run lint && bun run test && bun run test:coverage:four-metric && node scripts/check-overrides.js && node scripts/vetted-upstream-versions.js --validate && node scripts/validate-phase43-evidence.js --require-closeout && bun run lint:docs && git diff --check` |
| **Estimated runtime** | Focused tasks <=8 minutes; complete local closeout 15-25 minutes, excluding live CI |

---

## Sampling Rate

- **During RED-GREEN-REFACTOR:** Run the nearest pure unit or schema fixture first with a blocking feedback latency of 30 seconds or less. If the nearest RED cannot meet that bound, split or inject the fixture before implementation; process, package, coverage, and hosted gates remain later evidence stages.
- **After every task commit:** Run the focused command named in that task.
- **After every plan wave:** Run focused gates plus `bun run lint && bun run test && bun run lint:docs && git diff --check`; from Wave 19 onward run that plan's named coverage scope when present, and from Wave 36 onward run the complete aggregate plus real production-assurance validation.
- **At standing Fable checkpoints:** Require the checkpoint-specific subject/input manifest, evidence digests, captured exact-command receipt, fresh nonce, returned-review digest, exact marked lead decision and implementation direction, balanced disposition counts, and non-empty review/findings/disposition sections before the dependent plan proceeds; generic evidence, rewritten direction, self-reported invocation, or a replayed earlier review cannot satisfy a later checkpoint.
- **Before `/gsd-verify-work`:** Full suite and required GitHub Actions checks must be green or documented as non-blocking informational jobs.
- **Max immediate RED latency:** 30 seconds. Broader post-GREEN focused integration gates may take up to 8 minutes. Full aggregate/closeout gates have a 25-minute local budget; CI waits are recorded separately.

---

## Per-Task Verification Map

The requirement column below is contribution traceability, not completion
ownership. Open GSD closes requirements from completed plan frontmatter. The
still-pending `UPGRADE-05`, `SHIP-08`, `SHIP-08A`, and `SHIP-08B` therefore
appear as completion-owned requirements only in Plan 12C frontmatter; earlier
rows provide evidence consumed by that final closure plan.

| Task ID | Plan | Wave | Contributes To | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 43-01-* | 01 | 1 | UPGRADE-01 | T-43-01 | Upgrade simulation uses temp install targets and emits full D-03 evidence | unit/integration | `bun run test -- ./tests/verify-upgrade.test.js ./tests/ci-workflow.test.js` | exists | passed |
| 43-02-* | 02 | 2 | UPGRADE-01 | Installer rollback protects user files and provenance separates fork/upstream package versions | unit/integration | `bun run test -- ./tests/installer-safety.test.js ./tests/version-provenance.test.js` | exists | passed |
| 43-03-* | 03 | 3 | UPGRADE-02 | Candidate manifest cannot mark versions vetted before matrix evidence exists | unit | `bun run test -- ./tests/vetted-upstream-versions.test.js` | exists | passed |
| 43-04-* | 04 | 4 | UPGRADE-02, UPGRADE-04 | Matrix reads exact vetted pins and blocks only current pin by policy while CI remains report-only per AF-7 | unit/workflow | `bun run test -- ./tests/run-upstream-compat-ci.test.js ./tests/ci-workflow.test.js` | exists | passed |
| 43-05-* | 05 | 5 | UPGRADE-08 | T-43-05 | Semantic comparator cannot suppress real JS behavior changes | unit/integration | `bun run test -- ./tests/check-overrides.test.js ./tests/check-overrides-integration.test.js` | exists | passed |
| 43-06-* | 06 | 6 | UPGRADE-07 | T-43-06 | Check-update preserves fork identity, role routing, stale detection, and exact throttles | unit/package | `bun run test -- ./tests/hooks.test.js ./tests/hooks-manifest.test.js` | exists | passed |
| 43-07-* | 07 | 7 | UPGRADE-07 | T-43-07 | Statusline and hook packaging preserve runtime behavior and current-pin snapshot honesty | unit/package | `bun run test -- ./tests/hooks.test.js ./tests/compose.test.js` | exists | passed |
| 43-08-* | 08 | 8 | UPGRADE-09 | T-43-08 | Override churn is generated deterministically from upstream/override evidence | unit | `bun run test -- ./tests/override-churn.test.js` | exists | passed |
| 43-09-* | 09 | 9 | SHIP-03A | T-43-09 | SBOM is generated into dist and included in package/CI evidence | unit/package | `bun run test -- ./tests/compose.test.js ./tests/ci-workflow.test.js` | exists | passed |
| 43-10-* | 10 | 10 | UPGRADE-05 | T-43-10 | Dogfood bump uses reviewed exact stable pin before snapshot refresh | manual/package | `node scripts/vetted-upstream-versions.js --validate` | exists | passed |
| 43-11A-* | 11A | 11 | UPGRADE-02, UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11A | Every compatibility suite is classified and candidate failures report per-suite evidence | unit/integration | `bun run test -- ./tests/run-upstream-compat.test.js ./tests/run-upstream-compat-ci.test.js` | exists | passed |
| 43-11B-* | 11B | 12 | UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11B | Tests adopt supported Open GSD semantics while fork runtime overrides run against each candidate | contract/package | focused Node suites plus active-pin `compat-matrix` | exists | passed |
| 43-11C-* | 11C | 13 | UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11C | Roadmap updates preserve original EOL and unrelated formatting; exact durable N=3 report bytes prove all reviewed pins while the original plan remains blocked | integration/full package | `node --test tests/roadmap.test.cjs` plus full `compat-matrix --require-all` | exists | passed |
| 43-11L-* | 11L | 14 | UPGRADE-04, UPGRADE-05, SHIP-08B | T-43-11L | Open GSD plan scans exclude review artifacts while N=3 compatibility remains green against all reviewed pins | contract/full package | native roadmap suite, repository compatibility, and full `compat-matrix --require-all` | exists | passed |
| 43-11M-* | 11M | 15 | SHIP-08A | T-43-11M | Bun functional and native Node contract authorities are explicit, exhaustive, disjoint, and fail closed before branch publication | unit/integration/CI parity | canonical Bun adapter, native Node suites, repository compatibility, and ordinary pre-push | exists | passed |
| 43-11P-* | 11P | 16 | SHIP-08, SHIP-08A, SHIP-08B | T-43-11P | One captured runner/validator binds subject, input/evidence digests, nonce, exact subprocess, marked lead direction, returned body, and every metadata-complete disposition; its source enters the later blocking coverage-foundation gate | unit/contract | runner/validator positive, failure, replay, and branch fixtures; Plan 11W four-metric gate | pending | pending |
| 43-11N-* | 11N | 17 | SHIP-08A | T-43-11N | Hosted workflow topology, exact-head collection, zero-step billing classification, tracked ancestor-certifying envelopes, and durable blocker ownership are implemented without attempting external recovery | unit/contract | fixture evaluator, pending/strict envelope verification, config hygiene, docs, and consistency | exists | in progress |
| 43-11R-* | 11R | 18 | SHIP-08A | T-43-11R | An unavoidable human-action gate precedes first hosted evidence; a tracked envelope is committed before Fable makes the lead technical/design decision and ordinary GSD finalization commits the complete plan record | checkpoint/live API/lead review | status probes, pending then strict hosted-envelope verdict, shared Fable validator, and standard summary/metadata finalization | pending | pending |
| 43-11D-* | 11D | 19 | SHIP-08A, SHIP-08B | T-43-11D | The finalized Plan 11R head receives a second tracked exact-head envelope committed before source edits; source ownership, exhaustive/disjoint groups, stable digests, unchanged Jest parity, and separate snapshot assurance then precede measurement | unit/contract/live CI | second hosted envelope, source-contract, digest, group-partition, mirror, and Jest-adapter fixtures | pending | pending |
| 43-11W-* | 11W | 20 | SHIP-08A, SHIP-08B | T-43-11W | Marker-owned Bun/Jest/Node records produce truthful c8 counters, junction aliases collapse safely, and every group has an evidence-backed feasibility/no-go verdict | unit/integration | runner, junction, cleanup, anti-averaging, representative, feasibility, and coverage-foundation gates | pending | pending |
| 43-11X-* | 11X | 21 | SHIP-08, SHIP-08A, SHIP-08B | T-43-11X | Fable leads technical/design adjudication of the committed coverage foundation; any graph correction halts for full replanning and execute-phase restart | lead review/contract | shared checkpoint validator, feasibility gate, and explicit no-graph-edit or restart disposition | pending | pending |
| 43-11K-* | 11K | 22 | UPGRADE-05, SHIP-03A, SHIP-08A | T-43-11K | Windows SBOM env behavior and exact toolchain preflight are proven; the new executable is classified before later coverage | unit/integration/package | SBOM, toolchain, source-contract, and dist fixtures | pending | pending |
| 43-11E-* | 11E | 23 | SHIP-08A | T-43-11E | Launcher and installer groups reach all four thresholds without public behavior drift | unit/integration | launcher scope and focused behavioral tests | pending | pending |
| 43-11T-* | 11T | 24 | SHIP-08A | T-43-11T | Runtime-support reaches all four thresholds with one canonical source identity and mirror checks | unit/integration | runtime-support scope and source-contract fixtures | pending | pending |
| 43-11S-* | 11S | 25 | SHIP-08A | T-43-11S | Fable decides whole-project architecture, test-quality, velocity, sequencing, and residual-risk direction; any graph correction halts for full replanning and execute-phase restart | lead review/contract | shared checkpoint validator and explicit no-graph-edit or restart disposition | pending | pending |
| 43-11F-* | 11F | 26 | SHIP-03A, SHIP-08A | T-43-11F | Compose, build, finalize, parity, and dist-hygiene paths reach all thresholds deterministically | unit/package | distribution-core scope and focused package tests | pending | pending |
| 43-11U-* | 11U | 27 | SHIP-03A, SHIP-08A | T-43-11U | Provenance, semantic hashing, SBOM, and docs tooling reach all thresholds while package bytes remain valid | unit/package | distribution-support scope plus `bun run dist` | pending | pending |
| 43-11G-* | 11G | 28 | SHIP-08A | T-43-11G | Audit, override, debt-ratchet, and OSV tools remain fail closed at all thresholds | unit/integration | quality-security scope | pending | pending |
| 43-11V-* | 11V | 29 | SHIP-08A | T-43-11V | Benchmark, perf, cousin, flake, and oversight tools use deterministic injected ports and reach all thresholds | unit/integration | quality-reliability scope | pending | pending |
| 43-11H-* | 11H | 30 | UPGRADE-02, UPGRADE-05, UPGRADE-08, SHIP-08A | T-43-11H | Authority, preview, vetted-version, and churn discovery reaches all thresholds without weakening exact-pin policy | unit/integration | upgrade-discovery scope | pending | pending |
| 43-11Z-* | 11Z | 31 | UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-08, SHIP-08A, SHIP-08B | T-43-11Z | Compatibility and upgrade runners reach all thresholds without weakening active-pin, require-all, or N=3 semantics | unit/integration | upgrade-execution scope and full `compat-matrix --require-all` | pending | pending |
| 43-11I-* | 11I | 32 | UPGRADE-07, SHIP-08A | T-43-11I | Hook subprocess and sync native coverage reach all thresholds with no residual junction/temp state | integration | hooks and sync coverage scopes | pending | pending |
| 43-11Y-* | 11Y | 33 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11Y | Fable makes the lead decision on final assurance semantics, evidence lineage, CI authority, and release claims; any graph correction halts for full replanning and execute-phase restart | lead review/contract | shared checkpoint validator and explicit no-graph-edit or restart disposition | pending | pending |
| 43-11J-* | 11J | 34 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11J | Eight explicit strict schemas and a pure validator core reject semantic contradictions, including pending D-7 closeout | unit/contract | schema/pure-core negative fixtures and source classification | pending | pending |
| 43-11AA-* | 11AA | 35 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11AA | Injected adapters, transactional modes, validator self-coverage, and exact blocking CI preserve pure decisions | unit/integration/CI | validator/CI fixtures, closeout-evidence scope, and workflow lint | pending | pending |
| 43-11AB-* | 11AB | 36 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11AB | Final aggregate and latest authoritative compatibility evidence precede transactional Plan 11 transition with rollback | full/transition | aggregate coverage and production-assurance/Plan11 modes | pending | pending |
| 43-11-* | 11 | 37 | UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11 | Post-bump mutations regenerate fork coverage, snapshot assurance, N=3 evidence, and blocker bindings without prematurely claiming final product closure | full/package | `bun run dist`, durable N=3 report, complete coverage, and production-assurance validator | blocked | blocked |
| 43-11Q-* | 11Q | 38 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-11Q | Fresh exact-head hosted execution and Fable's lead technical/design decision authorize the final product-assurance claim | full/CI/lead review | hosted-verdict and shared checkpoint validator | pending | pending |
| 43-12-* | 12 | 39 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-12 | Candidate mode validates machine D-7 evidence before blocking-human confirmation; strict closeout and Phase 44 readiness run only afterward | full/CI/checkpoint | candidate-D-7 mode, blocking-human checkpoint, closeout gates, and readiness artifact | pending | pending |
| 43-12B-* | 12B | 40 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-12B | Fable's whole-project lead decision is dispositioned and every accepted correction is reverified before final verification | lead review/full | shared checkpoint validator, correction-affected gates, and closeout validator | pending | pending |
| 43-12C-* | 12C | 41 | UPGRADE-05, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B | T-43-12C | Goal-backward verification runs last and cannot pass with stale evidence, red owned gates, or a false SHIP-03B claim | full/verification | deterministic closeout validator and requirement trace | pending | pending |

---

## Wave 0 Requirements

- [x] `tests/verify-upgrade.test.js` exists before verifier implementation.
- [x] `tests/installer-safety.test.js` and `tests/version-provenance.test.js` exist before installer/provenance changes.
- [x] `tests/vetted-upstream-versions.test.js` exists before manifest helper implementation.
- [x] `tests/run-upstream-compat-ci.test.js` exists before matrix runner implementation.
- [x] `tests/check-overrides.test.js` covers semantic override behavior before gate changes.
- [x] Hook tests are extended before rewriting hook overrides.
- [x] Churn/SBOM tests are added before changing `package.json#files` or `dist` lifecycle scripts.
- [x] Compatibility registry and per-suite report tests exist before runner policy changes.
- [x] Candidate-path runtime tests exist before removing the repo-root runtime exclusion.
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
| Live upstream dogfood bump evidence | UPGRADE-05 | Requires real PR timing, qualitative friction, and human confirmation | Plan 12 Task 12-01 machine-captures and renders the candidate first; Task 12-02 uses `checkpoint:human-action`, whose explicit response is the sole authority for the correction ledger and `confirm-d7` digest transition. |

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies, except the explicitly authorized blocking D-7 human checkpoint.
- [x] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers missing test-file references.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-07-03 for planning
