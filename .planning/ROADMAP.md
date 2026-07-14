# Roadmap: GetStuffDone

## Milestones

- ✅ **v0.1.0 GetStuffDone Fork** — Phases 1-6 (shipped 2026-02-05)
- ✅ **v0.2.0 Hardening & Upstream Sync** — Phases 7-17 (shipped 2026-02-21)
- ✅ **v0.3.0 Upstream Sync & Workflow Maturity** — Phases 18-23 (shipped 2026-03-08)
- ⚫ **v0.4.0 Platform Expansion** — Phases 24-28 (superseded by v1.0.0)
- ✅ **v1.0.0 Overlay Architecture** — Phases 29-36 (shipped 2026-03-31)
- ✅ **v1.1.0 Installer & Deployment Hardening** — Phases 37-40 (shipped 2026-04-04)
- 🔵 **v1.2.0 Ship-Ready Hardening** — Phases 40.5-40.6, 41-44 (active, started 2026-04-20; Phase 40.5 inserted 2026-04-22; Phase 40.6 completed 2026-06-23)

## Phases

<details>
<summary>✅ v0.1.0 GetStuffDone Fork (Phases 1-6) — SHIPPED 2026-02-05</summary>

See: .planning/milestones/v0.1.0-ROADMAP.md

</details>

<details>
<summary>✅ v0.2.0 Hardening & Upstream Sync (Phases 7-17) — SHIPPED 2026-02-21</summary>

See: .planning/milestones/v0.2.0-ROADMAP.md

</details>

<details>
<summary>✅ v0.3.0 Upstream Sync & Workflow Maturity (Phases 18-23) — SHIPPED 2026-03-08</summary>

See: .planning/milestones/v0.3.0-ROADMAP.md

</details>

<details>
<summary>⚫ v0.4.0 Platform Expansion (Phases 24-28) — SUPERSEDED</summary>

Superseded by v1.0.0 overlay architecture. See: .planning/milestones/v1.0.0-ROADMAP.md for context.

</details>

<details>
<summary>✅ v1.0.0 Overlay Architecture (Phases 29-36) — SHIPPED 2026-03-31</summary>

See: .planning/milestones/v1.0.0-ROADMAP.md

- [x] Phase 29: Prototype Gate (1/1 plans) — completed 2026-03-28
- [x] Phase 30: Composition Pipeline & Branding (3/3 plans) — completed 2026-03-28
- [x] Phase 31: Feature Flags & Override System (3/3 plans) — completed 2026-03-29
- [x] Phase 32: Fork Code Port (3/3 plans) — completed 2026-03-29
- [x] Phase 33: Installer & Update Workflow (2/2 plans) — completed 2026-03-29
- [x] Phase 34: Testing & CI Enforcement (4/4 plans) — completed 2026-03-30
- [x] Phase 35: Migration & Ship v3.0.0 (3/3 plans) — completed 2026-03-31
- [x] Phase 36: v1.0.0 Gap Closure (2/2 plans) — completed 2026-03-31

</details>

<details>
<summary>✅ v1.1.0 Installer & Deployment Hardening (Phases 37-40) -- SHIPPED 2026-04-04</summary>

See: .planning/milestones/v1.1.0-ROADMAP.md

- [x] Phase 37: Installer Safety (2/2 plans) -- completed 2026-04-02
- [x] Phase 38: Statusline Deployment (2/2 plans) -- completed 2026-04-03
- [x] Phase 39: Test Health & CI (3/3 plans) -- completed 2026-04-03
- [x] Phase 40: Cleanup & Verification (1/1 plan) -- completed 2026-04-03 (v1.1.0 closing phase)

</details>

### v1.2.0 Ship-Ready Hardening (Phases 40.5-40.6, 41-44) -- ACTIVE

- [x] **Phase 40.5: Upstream Bump & Phase 41 Decision Re-verification** — (CLOSED/SUPERSEDED 2026-06-23) Four legacy-authority evidence waves completed; Phase 40.6 replaced the authority before Wave 5's filing path, so that path is retired rather than pending.
- [x] **Phase 40.6: Upstream Authority Migration** -- (COMPLETED 2026-06-23) Replaced legacy upstream authority (`get-shit-done-cc` / `gsd-build/get-shit-done`) with active Open GSD authority (`@opengsd/gsd-core` / `open-gsd/gsd-core`) before Phase 41. Pinned vetted Open GSD stable version `1.5.0`, rebased compose/override/update/package tooling on the new package layout, preserved fork identity, and retired Phase 40.5's legacy filing path.
- [x] **Phase 41: Foundation — Flip Gate, Install Audit Surface, Windows SLO** — (COMPLETED 2026-07-03) Blocking override-staleness gate, supply-chain audit surface, real perf baseline capture, Windows flake hardening, and 10x Linux/macOS/Windows validation are complete.
- [x] **Phase 42: Budget Enforcement, Process Hardening, Cousin-Test** — (COMPLETED 2026-07-03) Perf budget enforcement against the baseline, consolidated oversight triggers (1 principle + 4 triggers + probes), cold-install CI + INSTALL.md, and markdown/link gates for docs.
- [ ] **Phase 43: Upgrade Resilience — Verify, Matrix, Dogfood** — End-to-end upgrade simulation via Verdaccio, N=3 historical compat matrix, live dogfood upstream bump, override-churn changelog automation, and SBOM in the compose pipeline.
- [ ] **Phase 44: Ship Polish — Publish Flow, Provenance, Docs** — Pre-publish hard-gate chain with publint, OIDC-only provenance, workflow static analysis, reproducible-build verification, MAINTENANCE.md with all runbooks, and README/CHANGELOG polish.

## Phase Details

### Phase 40.5: Upstream Bump & Phase 41 Decision Re-verification (INSERTED)
**Goal**: Bump upstream pin from 1.34.2 to 1.38.2 and re-verify all Phase 41 CONTEXT.md decisions remain valid against the fresh upstream state before planning Phase 41 against potentially stale assumptions. Preparatory currency — NOT the Phase 43 dogfood bump.
**Depends on**: Nothing (pre-Phase-41 preparatory work; inserted 2026-04-22 after user chose bump-first ordering over plan-now-with-bump-in-Wave-0).
**Requirements**: UPGRADE-10
**Success Criteria** (what must be TRUE):
  1. `package.json` pins `get-shit-done-cc@1.38.2` (or latest stable at execution time); `bun install` succeeds; fork test suite passes on Linux + macOS (Windows flake is Phase 41's concern per REL-01/02, not a blocker here).
  2. Every override's SHA-256 snapshot in its REASON.md matches the current upstream source; any drift is either resolved by refreshing the snapshot (if upstream change is benign) or explicitly documented (if the upstream change conflicts with override intent and the override is still needed).
  3. Compose-collision audit complete: any files that upstream now ships natively which we had as overlays are either moved to `overrides/` (with REASON.md + SHA snapshot) or removed if no longer needed. Historical pattern: 1.32.0 → 1.34.2 bump surfaced `hooks/gsd-check-update.js` + `hooks/gsd-statusline.js` collisions.
  4. Phase 41 CONTEXT.md re-verified against fresh upstream; each of the 18 decisions + 6 amendments (A-01..A-06) confirmed unchanged OR amended in-place with the Amendments Log updated. Specific re-verification targets: D-09 target API vs upstream #2499 (Windows stdio hang mitigation) — does the upstream fix reduce our subprocess-migration surface? 999.1 hypothesis vs upstream #2487 (wave-dependencies) — does upstream already address the plan-checker gap?
  5. Findings recorded in phase VERIFICATION.md: commits/files diff counted (baseline: 312 commits / 566 files at 2026-04-21 poll), override deltas listed, CONTEXT.md amendment summary (if any), upstream filing candidates noted (e.g., UI-gate regex false-positive still present on clean 1.38.2 → defer to backlog 999.3 per existing decision).
**Plans:** 5 plans (4 executed; 1 retired by Phase 40.6 authority migration)
- [ ] 40.5-01-PLAN.md — Wave 1: Pin bump 1.34.2 -> 1.38.5 (package.json + bun.lock); Linux+macOS green
- [ ] 40.5-02-PLAN.md — Wave 2: Override drift detection; SHA-snapshot refresh inline; DRIFT-LOG.md
- [ ] 40.5-03-PLAN.md — Wave 3: Compose-collision audit incl. #1859 review.md; COLLISIONS.md
- [ ] 40.5-04-PLAN.md — Wave 4: 24-decision re-verify (D-01..D-18 + A-01..A-06); D-09 vs #2499; 999.1 vs #2487
- [x] 40.5-05-PLAN.md — Wave 5 retired without execution when Phase 40.6 replaced the legacy authority and filing path

### Phase 40.6: Upstream Authority Migration (COMPLETED 2026-06-23)
**Goal**: Move this fork's upstream authority from the legacy `get-shit-done-cc` package / `gsd-build/get-shit-done` repository to the active Open GSD `@opengsd/gsd-core` package / `open-gsd/gsd-core` repository while preserving the overlay architecture, fork identity, and exact-version review discipline.
**Depends on**: Phase 40.5 Wave 4 evidence (current fork is already pinned to `get-shit-done-cc@1.39.1` and Phase 41 decisions were re-verified there); blocks Phase 40.5 Wave 5's legacy upstream filing path and all Phase 41 implementation until authority is corrected.
**Requirements**: UPGRADE-11
**Success Criteria** (what must be TRUE):
  1. `docs/decisions/003-UPSTREAM-AUTHORITY-MIGRATION.md` records the authority decision with evidence: legacy package/repo state, Open GSD package/repo state, package/bin layout differences, and the explicit rule not to use legacy `get-shit-done-cc@latest` as the migration target.
  2. `.planning/upstream-authority.json` (or an equivalent manifest accepted by the plan review) is the single machine-readable source for upstream package name, stable version pin, repo, source root, bin entries, and legacy deprecation metadata.
  3. `package.json`, lockfile, compose, override-check, boundary-check, preview-update, branding, and related tests no longer hardcode the legacy upstream package as the active authority; any retained legacy references are historical docs, archived milestones, or explicitly marked migration/deprecation evidence.
  4. The migration pins a vetted Open GSD stable version (`@opengsd/gsd-core@1.5.0` at 2026-06-22 evidence time) and does not dynamically consume `latest` or `next`; future bumps remain deliberate reviewed version changes.
  5. Verification proves the composed fork can install/compose/check overrides/test against Open GSD layout, and records any Phase 41 plan changes caused by the authority migration before Phase 41 resumes.
**Plans:** 4 plans
- [x] 40.6-01-PLAN.md -- Authority ADR and package/source contract
- [x] 40.6-02-PLAN.md -- Isolated Open GSD package layout spike
- [x] 40.6-03-PLAN.md -- Implement upstream identity abstraction and migrate tooling
- [x] 40.6-04-PLAN.md -- Verification, legacy-reference audit, and Phase 41 readiness reset

### Phase 41: Foundation — Flip Gate, Install Audit Surface, Windows SLO
**Goal**: Make the override-staleness gate blocking, stand up the security audit surface with triage-as-data, capture a trustworthy perf baseline, and root-cause Windows subprocess flakiness so the Reliability SLO is real rather than aspirational.
**Depends on**: Nothing (first phase of v1.2.0; builds on shipped v1.1.0 CI structure).
**Requirements**: UPGRADE-03, UPGRADE-06, SECURITY-01, SECURITY-02, SECURITY-03, SECURITY-04, SECURITY-05, SECURITY-06, PERF-01, PERF-02, REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. A PR that introduces a stale override (SHA drift or missing REASON.md) fails CI with a non-zero exit on the override-check job; the existing informational boundary-check job is unchanged.
  2. A PR that triggers a high/critical npm audit finding fails CI unless an entry in `.planning/audits/suppressions.json` with all required fields (`id, severity, reason, reviewer, reviewedDate, reReviewDate`) explicitly covers it; suppressions older than their re-review date also fail CI.
  3. A PR that introduces a secret (gitleaks pattern) or an OSV-known transitive CVE (osv-scanner) fails CI with actionable output pointing to the offending line or package.
  4. `bun run bench` produces per-platform JSON from hyperfine with measured install/compose/test metrics, and `perf-baseline.json` is committed at repo root containing those numbers and an empty `acceptedRegressions[]` array.
  5. The full test suite passes 10 consecutive CI runs on Linux, macOS, AND Windows with zero retries; any residual skip is tagged with an issue link and a deadline recorded in MAINTENANCE.md's Escape-Hatch Decisions Log (REL-03 as flagged-on-use contingency only).
  6. `.changelog-conflict-check.sh` detects the known "entry inside published release section" pattern on a synthetic fixture and exits non-zero; the bump runbook references it as a required pre-push check.
**Plans**: 7 plans (checker-verified 2026-06-23)
- [x] 41-01-PLAN.md -- Wave 1: Blocking override gate and changelog conflict guard
- [x] 41-02-PLAN.md -- Wave 1: Audit suppressions, security policy, and maintenance sections
- [x] 41-05-PLAN.md -- Wave 1: Subprocess timeout helper and high-volume Windows-prone test migration
- [x] 41-03-PLAN.md -- Wave 2: Security scanner CI surface and OSV triage
- [x] 41-04-PLAN.md -- Wave 2: Perf baseline harness, schemas, workflow, and real three-platform baseline artifacts
- [x] 41-06-PLAN.md -- Wave 3: Remaining subprocess migration and Windows flake telemetry
- [x] 41-07-PLAN.md -- Wave 4: 10x validation, flake maintenance, and D-11/REL-03 closure discipline

### Phase 42: Budget Enforcement, Process Hardening, Cousin-Test
**Goal**: Enforce the perf budget against the Phase 41 baseline, land consolidated oversight triggers backed by deterministic probes, and verify that a cousin (never-touched-this-repo) can cold-install `@chude/get-stuff-done` on every supported OS and package manager.
**Depends on**: Phase 41 (perf baseline must exist before enforcement; override-staleness blocking must be live; PROCESS consolidation happens before trigger implementation per research flag).
**Requirements**: PERF-03, PERF-04, PERF-05, PROCESS-01, PROCESS-02, PROCESS-03, PROCESS-04, PROCESS-05, PROCESS-06, PROCESS-07, SHIP-07, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. A PR that slows the compose pipeline by >10% vs baseline on any platform emits a warning annotation; a PR that slows it by >25% fails CI unless `acceptedRegressions[]` carries a matching reviewed entry with `{reason, reviewer, reviewedDate, ticket}`.
  2. `overlay/memory/oversight-principle-evidence-before-claim.md` exists as the single source of truth for evidence-before-claim; the 4 oversight agents (execution x2, verification, planning) reference it via 2-3 line triggers rather than restating the principle.
  3. `scripts/verify-oversight-probes.js` runs weekly in CI and asserts each trigger would fire against a curated synthetic-violation fixture; probe failures fail the job with the specific trigger ID.
  4. PROCESS-07 graduation criteria (minimum N PRs observed, max false-positive rate, explicit promotion ceremony) are committed and referenced from each trigger; no trigger is promoted to blocking in v1.2.0.
  5. A cousin-test CI job cold-installs public `@chude/get-stuff-done` on fresh ubuntu-latest + macos-15 + windows-latest x Node 20+22 x bun/npm/pnpm, supports an optional read-only registry token, runs `gsd --version --json`, and asserts the fork+upstream+overlay manifest hash are present in the output.
  6. `INSTALL.md` documents the cousin-test scenario; lychee + markdownlint-cli2 run on every PR against tracked markdown and fail on broken links or markdown-lint violations without scanning ignored generated/dependency copies.
**Plans**:
- [x] 42-01-PLAN.md -- Wave 1: Perf budget comparison and CI enforcement
- [x] 42-02-PLAN.md -- Wave 1: Non-interactive launcher provenance output
- [x] 42-04-PLAN.md -- Wave 1: Evidence-before-claim oversight principle and probes
- [x] 42-03-PLAN.md -- Wave 2: Cousin cold-install workflow and INSTALL.md
- [x] 42-05-PLAN.md -- Wave 3: Markdown and link-check docs gates

### Phase 43: Upgrade Resilience — Verify, Matrix, Dogfood
**Goal**: Prove the overlay survives a real upstream bump end-to-end — via a Verdaccio-simulated full upgrade, an N=3 historical compat matrix, and a live dogfood bump recorded in MAINTENANCE.md.
**Depends on**: Phase 41 (override-staleness blocking must exist so verify-upgrade has meaningful failure modes) and Phase 42 (100% test pass SLO must hold before upgrade smoke tests are trusted).
**Requirements**: UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03A, SHIP-08, SHIP-08A, SHIP-08B
**Success Criteria** (what must be TRUE):
  1. `bun run verify-upgrade --from <pinned> --to <target>` runs against a Linux Verdaccio service container, performs install->bump->recompose->reinstall->smoke-verify, and emits a structured JSON report whose exit code reflects success; the job is wired into CI on a schedule and on-change to `overlay/`, `scripts/compose.js`, or the upstream-authority pin.
  2. `.planning/vetted-upstream-versions.json` contains exactly 3 vetted upstream versions; the `compat-matrix` CI job expands from it (informational on historical versions, blocking on pinned); pruning-oldest-on-bump is automated as part of the bump runbook.
  3. A comment-only or whitespace-only upstream change to an override source `.js` file does NOT trigger a staleness alert (AST-diff based), while a semantic change does; `.md` files are documented as deferred to v1.3.0 with a reason.
  4. `overrides/hooks/gsd-check-update.js` incorporates upstream's hook improvements (isNewer, detectConfigDir, stale hook detection, shared cache) while preserving fork-specific behavior (package name, role routing, commit classification, 4h/7d throttle); the corresponding `gsd-statusline.js` changes are committed atomically in the same PR.
  5. A live upstream bump from the currently pinned version to a newer vetted version is executed within the milestone using the new gates, with a D-7 evidence record in MAINTENANCE.md capturing PR number, duration, what the gates caught, and any friction encountered.
  6. On each upstream bump, the Override Churn section of CHANGELOG.md is auto-generated listing overrides whose upstream source changed (added/removed/carried), and `dist/bom.json` (CycloneDX SBOM) is produced between compose and finalize-dist and included in the npm tarball. GitHub release attachment is separately owned by SHIP-03B in Phase 44.
  7. Production assurance is blocking and two-part: canonical fork-authored source reaches at least 95% statements, branches, functions, and lines independently while Bun remains green, and every shipped upstream snapshot satisfies exact provenance, drift, named fork-delta, ownership/removal, and N=3 composed-package gates. Closeout language cannot describe the fork-only aggregate as whole-production coverage.
**Plans**: 13/24 plans executed
- [x] 43-01-PLAN.md -- Wave 1: Upgrade verifier report schema and Verdaccio CI
- [x] 43-02-PLAN.md -- Wave 2: Installer rollback and VERSION/package provenance clarity
- [x] 43-03-PLAN.md -- Wave 3: Vetted upstream candidate manifest
- [x] 43-04-PLAN.md -- Wave 4: Compatibility matrix evidence and CI
- [x] 43-05-PLAN.md -- Wave 5: JavaScript semantic override staleness
- [x] 43-06-PLAN.md -- Wave 6: Check-update hook reconciliation
- [x] 43-07-PLAN.md -- Wave 7: Statusline reconciliation and hook packaging
- [x] 43-08-PLAN.md -- Wave 8: Override churn generator
- [x] 43-09-PLAN.md -- Wave 9: CycloneDX SBOM pipeline
- [x] 43-10-PLAN.md -- Wave 10: Live target reverify and authority bump
- [x] 43-11A-PLAN.md -- Wave 11: Classified compatibility contract and per-suite diagnostics
- [x] 43-11B-PLAN.md -- Wave 12: Open GSD contract modernization and candidate runtime coverage
- [x] 43-11C-PLAN.md -- Wave 13: Roadmap format preservation and N=3 compatibility proof
- [ ] 43-11L-PLAN.md -- Wave 14: Open GSD plan-scan read-model correction and N=3 revalidation
- [ ] 43-11D-PLAN.md -- Wave 15: Source contract and Jest/Node/c8 coverage foundation
- [ ] 43-11K-PLAN.md -- Wave 16: SBOM portability and toolchain preflight
- [ ] 43-11E-PLAN.md -- Wave 17: Launcher and runtime-support four-metric closure
- [ ] 43-11F-PLAN.md -- Wave 18: Distribution and build-tool four-metric closure
- [ ] 43-11G-PLAN.md -- Wave 19: Quality, audit, performance, and reliability four-metric closure
- [ ] 43-11H-PLAN.md -- Wave 20: Upgrade and compatibility tooling four-metric closure
- [ ] 43-11I-PLAN.md -- Wave 21: Hook and sync four-metric closure
- [ ] 43-11J-PLAN.md -- Wave 22: Validator-first aggregate assurance, blocker transition, and blocking CI
- [ ] 43-11-PLAN.md -- Wave 23: Post-bump snapshots, churn, SBOM, and assurance refresh
- [ ] 43-12-PLAN.md -- Wave 24: D-7 maintenance evidence and verification closeout

### Phase 44: Ship Polish — Publish Flow, Provenance, Docs
**Goal**: Wire every gate built in Phases 41-43 into the `aidev release` / `aidev publish` flow with OIDC provenance, verify reproducibility, and land a complete MAINTENANCE.md that documents processes that now actually exist.
**Depends on**: Phase 41, 42, 43 (MAINTENANCE.md can only document real processes; provenance needs the publish flow confirmed; the anti-theater checklist walks through artifacts from all prior phases).
**Requirements**: SHIP-01, SHIP-02, SHIP-03B, SHIP-04, SHIP-05, SHIP-06, DOCS-01, DOCS-02, DOCS-03, DOCS-07, DOCS-08
**Success Criteria** (what must be TRUE):
  1. `aidev publish` refuses to proceed unless the full pre-publish chain (tests + lint + audit + publint + SBOM) passes; publint catches a hand-curated drop in `files:` on a synthetic regression fixture; running the publish command without OIDC credentials fails rather than falling back to a long-lived NPM_TOKEN.
  2. Running `bun run compose` twice on the same inputs produces byte-identical output, and the Linux, macOS, and Windows jobs produce identical path-plus-SHA manifests for the composed distribution; zizmor static analysis of GHA workflow YAML runs in CI and fails on unpinned-SHA references, injection via `${{ github.event.* }}`, or excessive `GITHUB_TOKEN` permissions.
  3. `MAINTENANCE.md` exists with every required section (Upgrade Process, Override Conflict Handling, CI Staleness Response, Release Cadence, Bump Runbook prohibiting `--theirs`/`--ours`, Security Triage, Perf Budget, Escape-Hatch Decisions Log) and each section contains executable examples or links to the scripts they describe; a CI check extracts and runs at least one example per section.
  4. The consumer-facing upgrade guide (`DOCS-02`), override policy (`DOCS-03`), README (`DOCS-07`), and CHANGELOG.md (audited for Keep-a-Changelog + SemVer compliance per `DOCS-08`) all pass lychee + markdownlint; README clearly states the value proposition, install instructions, feature list, support boundary, and links to MAINTENANCE.md, while MAINTENANCE.md states the reviewed upstream-bump cadence.
  5. The "Looks Done But Isn't" checklist from `.planning/research/PITFALLS.md` is walked through as the final ship gate; each item is either a committed artifact in the repo or a dated decision in the Escape-Hatch Log, with zero unresolved items before tagging v1.2.0.
  6. The release workflow attaches `dist/bom.json` to the GitHub release and verifies its digest matches the SBOM included in the npm tarball.
  7. The packed release candidate passes install -> upgrade, injected-failure rollback, uninstall with user-file preservation, and idempotent reinstall scenarios on Linux, macOS, and Windows.
  8. The changelog conflict checker either accepts normal published-release content while rejecting the intended conflict fixture, or is removed/replaced by a gate with that exact contract; no known false-positive gate enters the publish chain.
  9. All 41 baseline boundary violations are classified by plausible upstream-path collision risk; collision-possible entries are corrected or made explicit reviewed overrides, and any retained collision-impossible entries remain documented under the blocking no-regression ratchet.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v0.1.0 | 12/12 | Complete | 2026-02-05 |
| 7-17 | v0.2.0 | 32/32 | Complete | 2026-02-21 |
| 18-23 | v0.3.0 | 17/17 | Complete | 2026-03-08 |
| 24-28 | v0.4.0 | - | Superseded | - |
| 29-36 | v1.0.0 | 21/21 | Complete | 2026-03-31 |
| 37-40 | v1.1.0 | 8/8 | Complete | 2026-04-04 |
| 40.5 | v1.2.0 | 4 executed + 1 retired | Closed; superseded by Phase 40.6 | 2026-06-23 |
| 40.6 | v1.2.0 | 4/4 | Complete; Open GSD authority active, boundary debt documented | 2026-06-23 |
| 41 | v1.2.0 | 7/7 | Complete | 2026-07-03 |
| 42 | v1.2.0 | 5/5 | Complete | 2026-07-03 |
| 43 | v1.2.0 | 13/24 | In Progress | - |
| 44 | v1.2.0 | 0/TBD | Not started | - |

## Backlog

### Phase 999.1: Investigate plan-checker wave collision detection (BACKLOG)

**Goal:** Verify hypothesis (from authkey Phase 9.2) that `gsd-plan-checker` lacks same-wave file-collision detection; determine if real upstream gap, rule refinement, or fork-specific; evaluate 3 implementation paths before any commit.
**Source:** authkey project cross-session reference, 2026-04-20
**Investigation time-box:** 2 hours
**Requirements:** TBD (promotion creates PROCESS-08 if warranted)

**Promotion criteria:** See `.planning/phases/999.1-investigate-plan-checker-wave-collision-detection/CONTEXT.md` for full decision tree -- upstream-gap + Path C -> decimal-insert into Phase 42; Path B -> PROCESS-08 in v1.2.0; Path A -> upstream issue (no v1.2.0 scope); NOT-a-gap -> close with verification evidence.

Plans:
- [ ] TBD (promote with /gsd-review-backlog when investigation complete)

### Phase 999.2: Resolve config schema drift and fork-extension namespace (BACKLOG)

**Goal:** Resolve the 8 unknown config keys flagged by `gsd-tools` warning (4 upstream-drift migrations + 4 fork-extension namespace decisions) and document the class so it cannot fester silently.
**Source:** `gsd-tools` warning observed during 2026-04-20 commit
**Investigation time-box:** 80% complete at capture; resolution ~2-3h
**Requirements:** TBD (migrate drift keys mechanically; choose Option A/B/C for fork-extensions; possible CONFIG-01 candidate for v1.3.0)

**Classification at capture:**
- Class A (drift, migrate): `skip_research`, `skip_plan_check`, `skip_verification`, `branch_per_phase`
- Class B (fork extensions, decide path): `memory.*`, `effort.*`, `teams.*`, `gsd.role`

**Promotion criteria:** See `.planning/phases/999.2-resolve-config-schema-drift-and-fork-extension-namespace/CONTEXT.md` for full classification matrix and Option A/B/C evaluation. Preferred resolution path: Option C (rename under existing `features.*` namespace) = quick-resolve inside this backlog item; Option A (upstream PR) = external-AI cross-check first then file; Option B (override) = promote to v1.3.0.

Plans:
- [ ] TBD (promote with /gsd-review-backlog when investigation complete)

### Phase 999.3: File upstream PR for plan-phase UI-gate regex word-boundary fix (BACKLOG)

**Goal:** Retired legacy filing path. Original goal was to file an upstream issue + PR adding word-boundary matching to the UI-phase-gate regex in `workflows/plan-phase.md` only if the bug still existed on clean legacy upstream after Phase 40.5. Phase 40.6 changed active authority to Open GSD, so any future filing must first re-verify the bug against `open-gsd/gsd-core` and be promoted as a new Open GSD-specific task.
**Source:** Phase 41 plan-phase workflow false-positive triggered during 2026-04-21 session; upstream verified still present at v1.38.2 line ~470 of `workflows/plan-phase.md` at poll time; user decision to file upstream PR only after bump + re-verification on clean state.
**Investigation time-box:** 30min verification post-bump + 1-2h PR drafting if warranted.
**Requirements:** TBD (promotion creates a new Open GSD-specific filing task only after fresh verification against `@opengsd/gsd-core`; do not use the legacy Phase 40.5 filing instructions).

**Promotion criteria:**
- Freshly inspect `node_modules/@opengsd/gsd-core/gsd-core/workflows/plan-phase.md` from the pinned Open GSD version before filing anything.
- If still present with naive substring matching: draft an Open GSD issue/PR with word-boundaries fix (`\b...\b`) and get explicit user sign-off before filing.
- If already fixed by Open GSD: close this backlog item as NOT-A-GAP with verification evidence (commit SHA or release evidence).
- Do NOT file before bump-verification step — follows `feedback_verify_upstream_scope.md` discipline; 3 prior "upstream bug" labels (#1851, `_auto_chain_active`, `extractFrontmatterField`) all turned out to be fork-specific.

Plans:
- [ ] TBD (promote with /gsd-review-backlog only after Open GSD verification confirms state)

### Phase 999.4: External GitHub Action SHA-pinning hardening audit (BACKLOG)

**Goal:** Audit fork's CI usage of third-party GitHub Actions (currently `gitleaks-action@v2`, `osv-scanner-action@v2`, `step-security/harden-runner@v2`, plus any future additions in Phase 41 D-07/D-08) and decide whether to upgrade from floating-major (`@v2`) to full-length SHA pinning per [GitHub's secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use). Floating-major picks up security patches auto-magically; SHA pinning is immutable but requires bot-managed update tooling (Dependabot / Renovate) to avoid stale pins.
**Source:** Codex (gpt-5.5 high reasoning) P2 #1 finding during Phase 40.5 Wave 4 Task 04-03 cross-AI review, 2026-05-15. Phase 41 D-07/D-08 deliberately chose floating-major; this backlog item exists to revisit that choice with cost/benefit + tooling-readiness data.
**Investigation time-box:** 1h audit + decision matrix; ~2h implementation if SHA-pinning chosen (needs Dependabot config + initial pin commits).
**Requirements:** TBD (promotion creates a SHIP-* or SECURITY-* requirement in v1.2.0 final scope OR defers to v1.3.0 if Phase 44 ship gates take priority).

**Promotion criteria:**
- Decision factors: (a) is Dependabot already configured for this repo? (b) acceptable noise level for SHA-bump PRs? (c) does the threat model warrant immutable pins (e.g., supply-chain compromise of a v2 tag)?
- If KEEP floating-major: close this backlog item with rationale documented in MAINTENANCE.md (Phase 44 DOCS-08 candidate section).
- If MIGRATE to SHA pins: promote to v1.2.0 or v1.3.0 depending on Phase 44 timing; implementation = Dependabot config + SHA pin commits for all third-party actions + CI gate that fails on un-pinned references (per Phase 44 Success Criterion #2 zizmor analysis).
- Do NOT file as Wave 4 amendment — Phase 41 D-07/D-08 floating-major policy is deliberate; this is a future-hardening question, not a drift correction.

Plans:
- [ ] TBD (promote with /gsd-review-backlog after Phase 41 install lands and the audit-surface stabilizes)
