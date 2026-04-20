# Roadmap: GetStuffDone

## Milestones

- ✅ **v0.1.0 GetStuffDone Fork** — Phases 1-6 (shipped 2026-02-05)
- ✅ **v0.2.0 Hardening & Upstream Sync** — Phases 7-17 (shipped 2026-02-21)
- ✅ **v0.3.0 Upstream Sync & Workflow Maturity** — Phases 18-23 (shipped 2026-03-08)
- ⚫ **v0.4.0 Platform Expansion** — Phases 24-28 (superseded by v1.0.0)
- ✅ **v1.0.0 Overlay Architecture** — Phases 29-36 (shipped 2026-03-31)
- ✅ **v1.1.0 Installer & Deployment Hardening** — Phases 37-40 (shipped 2026-04-04)
- 🔵 **v1.2.0 Ship-Ready Hardening** — Phases 41-44 (active, started 2026-04-20)

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

### v1.2.0 Ship-Ready Hardening (Phases 41-44) -- ACTIVE

- [ ] **Phase 41: Foundation — Flip Gate, Install Audit Surface, Windows SLO** — Blocking override-staleness gate, supply-chain audit surface, perf baseline capture, and Windows flake root-cause so later gates compose on a clean, trustworthy baseline.
- [ ] **Phase 42: Budget Enforcement, Process Hardening, Cousin-Test** — Perf budget enforcement against the baseline, consolidated oversight triggers (1 principle + 4 triggers + probes), cold-install CI + INSTALL.md, and markdown/link gates for docs.
- [ ] **Phase 43: Upgrade Resilience — Verify, Matrix, Dogfood** — End-to-end upgrade simulation via Verdaccio, N=3 historical compat matrix, live dogfood upstream bump, override-churn changelog automation, and SBOM in the compose pipeline.
- [ ] **Phase 44: Ship Polish — Publish Flow, Provenance, Docs** — Pre-publish hard-gate chain with publint, OIDC-only provenance, workflow static analysis, reproducible-build verification, MAINTENANCE.md with all runbooks, and README/CHANGELOG polish.

## Phase Details

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
**Plans**: TBD

### Phase 42: Budget Enforcement, Process Hardening, Cousin-Test
**Goal**: Enforce the perf budget against the Phase 41 baseline, land consolidated oversight triggers backed by deterministic probes, and verify that a cousin (never-touched-this-repo) can cold-install `@chude/get-stuff-done` on every supported OS and package manager.
**Depends on**: Phase 41 (perf baseline must exist before enforcement; override-staleness blocking must be live; PROCESS consolidation happens before trigger implementation per research flag).
**Requirements**: PERF-03, PERF-04, PERF-05, PROCESS-01, PROCESS-02, PROCESS-03, PROCESS-04, PROCESS-05, PROCESS-06, PROCESS-07, SHIP-07, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. A PR that slows the compose pipeline by >10% vs baseline on any platform emits a warning annotation; a PR that slows it by >25% fails CI unless `acceptedRegressions[]` carries a matching reviewed entry with `{reason, reviewer, reviewedDate, ticket}`.
  2. `overlay/memory/oversight-principle-evidence-before-claim.md` exists as the single source of truth for evidence-before-claim; the 4 oversight agents (execution x2, verification, planning) reference it via 2-3 line triggers rather than restating the principle.
  3. `scripts/verify-oversight-probes.js` runs weekly in CI and asserts each trigger would fire against a curated synthetic-violation fixture; probe failures fail the job with the specific trigger ID.
  4. PROCESS-07 graduation criteria (minimum N PRs observed, max false-positive rate, explicit promotion ceremony) are committed and referenced from each trigger; no trigger is promoted to blocking in v1.2.0.
  5. A cousin-test CI job cold-installs `@chude/get-stuff-done` on fresh ubuntu-latest + macos-latest + windows-latest x Node 20+22 x bun/npm/pnpm using a minimal-scope token, runs `gsd --version`, and asserts the fork+upstream+overlay manifest hash are present in the output.
  6. `INSTALL.md` documents the cousin-test scenario; lychee + markdownlint-cli2 run on every PR and fail on broken links or markdown-lint violations across all `.md` files in the repo.
**Plans**: TBD

### Phase 43: Upgrade Resilience — Verify, Matrix, Dogfood
**Goal**: Prove the overlay survives a real upstream bump end-to-end — via a Verdaccio-simulated full upgrade, an N=3 historical compat matrix, and a live dogfood bump recorded in MAINTENANCE.md.
**Depends on**: Phase 41 (override-staleness blocking must exist so verify-upgrade has meaningful failure modes) and Phase 42 (100% test pass SLO must hold before upgrade smoke tests are trusted).
**Requirements**: UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03
**Success Criteria** (what must be TRUE):
  1. `bun run verify-upgrade --from <pinned> --to <target>` runs against a Linux Verdaccio service container, performs install->bump->recompose->reinstall->smoke-verify, and emits a structured JSON report whose exit code reflects success; the job is wired into CI on a schedule and on-change to `overlay/`, `scripts/compose.js`, or the `get-shit-done-cc` pin.
  2. `.planning/vetted-upstream-versions.json` contains exactly 3 vetted upstream versions; the `compat-matrix` CI job expands from it (informational on historical versions, blocking on pinned); pruning-oldest-on-bump is automated as part of the bump runbook.
  3. A comment-only or whitespace-only upstream change to an override source `.js` file does NOT trigger a staleness alert (AST-diff based), while a semantic change does; `.md` files are documented as deferred to v1.3.0 with a reason.
  4. `overrides/hooks/gsd-check-update.js` incorporates upstream's hook improvements (isNewer, detectConfigDir, stale hook detection, shared cache) while preserving fork-specific behavior (package name, role routing, commit classification, 4h/7d throttle); the corresponding `gsd-statusline.js` changes are committed atomically in the same PR.
  5. A live upstream bump from the currently pinned version to a newer vetted version is executed within the milestone using the new gates, with a D-7 evidence record in MAINTENANCE.md capturing PR number, duration, what the gates caught, and any friction encountered.
  6. On each upstream bump, the Override Churn section of CHANGELOG.md is auto-generated listing overrides whose upstream source changed (added/removed/carried), and `dist/bom.json` (CycloneDX SBOM) is produced between compose and finalize-dist, included in both the tarball and the GitHub release artifact.
**Plans**: TBD

### Phase 44: Ship Polish — Publish Flow, Provenance, Docs
**Goal**: Wire every gate built in Phases 41-43 into the `aidev release` / `aidev publish` flow with OIDC provenance, verify reproducibility, and land a complete MAINTENANCE.md that documents processes that now actually exist.
**Depends on**: Phase 41, 42, 43 (MAINTENANCE.md can only document real processes; provenance needs the publish flow confirmed; the anti-theater checklist walks through artifacts from all prior phases).
**Requirements**: SHIP-01, SHIP-02, SHIP-04, SHIP-05, SHIP-06, DOCS-01, DOCS-02, DOCS-03, DOCS-07, DOCS-08
**Success Criteria** (what must be TRUE):
  1. `aidev publish` refuses to proceed unless the full pre-publish chain (tests + lint + audit + publint + SBOM) passes; publint catches a hand-curated drop in `files:` on a synthetic regression fixture; running the publish command without OIDC credentials fails rather than falling back to a long-lived NPM_TOKEN.
  2. Running `bun run compose` twice on the same inputs produces byte-identical output (verified via a reproducibility CI job); zizmor static analysis of GHA workflow YAML runs in CI and fails on unpinned-SHA references, injection via `${{ github.event.* }}`, or excessive `GITHUB_TOKEN` permissions.
  3. `MAINTENANCE.md` exists with every required section (Upgrade Process, Override Conflict Handling, CI Staleness Response, Release Cadence, Bump Runbook prohibiting `--theirs`/`--ours`, Security Triage, Perf Budget, Escape-Hatch Decisions Log) and each section contains executable examples or links to the scripts they describe; a CI check extracts and runs at least one example per section.
  4. The consumer-facing upgrade guide (`DOCS-02`), override policy (`DOCS-03`), README (`DOCS-07`), and CHANGELOG.md (audited for Keep-a-Changelog + SemVer compliance per `DOCS-08`) all pass lychee + markdownlint; README clearly states the value proposition, install instructions, feature list, and links to MAINTENANCE.md.
  5. The "Looks Done But Isn't" checklist from `.planning/research/PITFALLS.md` is walked through as the final ship gate; each item is either a committed artifact in the repo or a dated decision in the Escape-Hatch Log, with zero unresolved items before tagging v1.2.0.
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
| 41 | v1.2.0 | 0/TBD | Not started | - |
| 42 | v1.2.0 | 0/TBD | Not started | - |
| 43 | v1.2.0 | 0/TBD | Not started | - |
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
