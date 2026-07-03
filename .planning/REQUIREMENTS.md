# Requirements: GetStuffDone Fork -- v1.2.0 Ship-Ready Hardening

**Defined:** 2026-04-20
**Core Value:** Get upstream improvements automatically while preserving fork identity and additions. v1.2.0 specific: eliminate fork brittleness and reach ship-ready quality bar -- upstream bumps become routine version changes, not refactoring events.

## v1.2.0 Requirements

Requirements for ship-ready hardening. Each maps to a roadmap phase.

### UPGRADE (upgrade resilience)

- [x] **UPGRADE-01**: `scripts/verify-upgrade.js` orchestrates the full upgrade cycle (install prior version -> bump upstream -> recompose -> reinstall -> smoke-verify) against a Verdaccio local registry
- [x] **UPGRADE-02**: Historical-version compat matrix runs in CI against N=3 most recent vetted upstream versions, driven by `.planning/vetted-upstream-versions.json`
- [x] **UPGRADE-03**: Override staleness enforcement is a BLOCKING CI gate (distinct from informational boundary/compat jobs); `scripts/check-overrides.js` exit-on-fail is wired into CI
- [x] **UPGRADE-04**: `.planning/vetted-upstream-versions.json` tracks the N=3 vetted upstream versions as the compat matrix source of truth; pruning on bump is automated
- [ ] **UPGRADE-05**: A live dogfood upstream bump is executed AFTER Phases 41 and 42 complete — bumping from whatever pin is current at Phase 43 time to whatever's latest then — as proof-the-system-works (D-7). Exercises the new Phase 41/42 overlay/override work against a subsequent bump; distinct from UPGRADE-10's pre-Phase-41 currency bump (the two bumps serve different verification purposes). Evidence recorded in MAINTENANCE.md.
- [x] **UPGRADE-06**: `.changelog-conflict-check.sh` detects the known CHANGELOG merge pattern (entry placed inside published release section) and is wired into the bump runbook
- [ ] **UPGRADE-07**: Upstream hook improvements merged into `overrides/hooks/gsd-check-update.js` (isNewer, detectConfigDir, stale hook detection, shared cache) with atomic coupling to `gsd-statusline.js`; fork-specific behavior preserved (package name, role routing, commit classification, 4h/7d throttle)
- [ ] **UPGRADE-08**: Semantic override staleness -- comment-only/whitespace-only upstream changes to override source files do NOT trigger false-positive staleness alerts (D-1; scope: `.js` files initially via AST-diff; `.md` deferred with documented reason)
- [ ] **UPGRADE-09**: Override churn section auto-generated in CHANGELOG on each upstream bump, listing overrides whose upstream source changed (D-8)
- [ ] **UPGRADE-10**: Pre-Phase-41 upstream currency bump — bump upstream pin from 1.34.2 to 1.38.2 (or latest stable at execution time) BEFORE Phase 41 planning completes, refresh override SHA-256 snapshots, audit for compose collisions, and re-verify all Phase 41 CONTEXT.md decisions against fresh upstream state (amending CONTEXT.md if any decision changes). Ensures Phase 41 planning targets current upstream rather than stale assumptions. Distinct from UPGRADE-05 (the Phase 43 dogfood bump) — UPGRADE-10 establishes currency, UPGRADE-05 dogfoods the bump process against new Phase 41/42 work. (Inserted 2026-04-22 with Phase 40.5.)
- [x] **UPGRADE-11**: Upstream authority migration -- migrated the overlay's active upstream from legacy `get-shit-done-cc` / `gsd-build/get-shit-done` to Open GSD `@opengsd/gsd-core@1.5.0` / `open-gsd/gsd-core` before Phase 41, pinned a vetted stable Open GSD version, centralized upstream identity in a machine-readable manifest/helper with packaged fallback, updated compose/override/boundary/update/package tooling to the new package layout, and explicitly retired legacy upstream filing paths. (Completed 2026-06-23 in Phase 40.6.)

### PROCESS (oversight pattern -- 1 principle + 4 triggers)

- [x] **PROCESS-01**: Shared principle document `overlay/memory/oversight-principle-evidence-before-claim.md` articulates the "evidence-before-claim verification" principle once
- [x] **PROCESS-02**: `gsd-oversight-execution` includes a structured trigger for unverified post-merge state (2-3 lines pointing to principle)
- [x] **PROCESS-03**: `gsd-oversight-execution` includes a structured trigger for SUMMARY claims lacking verification (2-3 lines pointing to principle)
- [x] **PROCESS-04**: `gsd-oversight-verification` includes a structured trigger for CI gates raised before local measurement passed (2-3 lines pointing to principle)
- [x] **PROCESS-05**: `gsd-oversight-planning` includes a structured trigger for test approaches without metric-target compatibility check (2-3 lines pointing to principle)
- [x] **PROCESS-06**: `scripts/verify-oversight-probes.js` harness + weekly CI job verifies oversight triggers fire when expected (deterministic probes without OPA/Semgrep dependency)
- [x] **PROCESS-07**: Advisory -> blocking graduation criteria documented for oversight triggers (D-3): minimum 20 PRs observed with the trigger firing or correctly abstaining; maximum 5% false-positive rate across that observation window; explicit promotion ceremony requires maintainer-authored PR review + 2 weeks of clean CI history + MAINTENANCE.md update recording trigger name, promotion date, and observation evidence. No triggers graduate in v1.2.0 (criteria only).

### SECURITY (supply chain + audit)

- [x] **SECURITY-01**: `audit-ci@7.1.0` runs in CI as blocking gate; `.planning/audits/suppressions.json` carries TTL'd entries with `{id, severity, reason, reviewer, reviewedDate, reReviewDate}` schema
- [x] **SECURITY-02**: `gitleaks-action@v2` secrets scan runs on every PR; fails on detected credentials
- [x] **SECURITY-03**: `osv-scanner-action@v2` runs against OSV database in CI; catches transitive CVEs that npm/bun audit misses
- [x] **SECURITY-04**: `step-security/harden-runner@v2` installed in audit mode in Phase 1; promoted to block mode in Phase 4 only if 2+ weeks of clean audit log
- [x] **SECURITY-05**: `eslint-plugin-security` (already installed) config audited and confirmed enabled with all relevant rules
- [x] **SECURITY-06**: Security triage policy encoded and documented: critical CVEs/findings -> fix in v1.2.0; major -> plan for v1.3.0; minor -> backlog with review date

### SHIP (ship-readiness artifacts)

- [ ] **SHIP-01**: Pre-publish hard gate chain: tests + lint + audit + publint + SBOM all must pass before `aidev publish` proceeds
- [ ] **SHIP-02**: `publint@0.3.18` validates the actual tarball shape before publish; fails on hand-curated `files:` manifest drops
- [ ] **SHIP-03**: CycloneDX SBOM (`@cyclonedx/cyclonedx-npm@4.2.1`) generates `dist/bom.json` between compose and finalize-dist; included in tarball AND GitHub release artifact
- [ ] **SHIP-04**: npm `--provenance` via GHA OIDC Trusted Publishing; no long-lived NPM_TOKEN alongside OIDC (Axios incident pattern)
- [ ] **SHIP-05**: `zizmor-action@v0` static analysis of GHA workflow YAML runs in CI
- [ ] **SHIP-06**: Reproducible builds verified: `bun run compose` twice produces byte-identical output; verified in CI
- [x] **SHIP-07**: Cousin-test cold-install CI job: fresh OS (ubuntu-latest + macos-15 + windows-latest) x Node 20+22 x bun/npm/pnpm matrix installs public `@chude/get-stuff-done`, supports an optional read-only registry token, and runs non-interactive provenance smoke test. Completed 2026-07-03 across 42-02 runtime provenance and 42-03 cold-install workflow/helper.

### DOCS (documentation completeness)

- [ ] **DOCS-01**: `MAINTENANCE.md` complete with required sections: Upgrade Process, Override Conflict Handling, CI Staleness Response, Release Cadence, Bump Runbook (prohibiting `--theirs`/`--ours`), Security Triage, Perf Budget, Escape-Hatch Decisions Log. Per-section acceptance: (a) at least one executable example (script path, command line, or code snippet) per section; (b) minimum 15 lines of substantive content per section (no placeholder-only); (c) every link validated by lychee in CI; (d) the Ship Polish phase CI check extracts at least one example per section and runs it end-to-end, failing if any example is broken or missing. Sections defined as anti-slop contract; plan authors must map each section to concrete artifacts, not prose alone.
- [ ] **DOCS-02**: Upgrade guide (consumer-facing) documents the preview-update + aidev release workflow
- [ ] **DOCS-03**: Override policy documents when to override, REASON.md template, SHA snapshot capture process, re-review triggers
- [x] **DOCS-04**: `INSTALL.md` covers the cousin-test scenario (fresh public install, optional read-only registry token, PATH setup, version verification)
- [x] **DOCS-05**: `lychee-action@v2` link checker runs in CI on tracked markdown files, excluding generated/dependency copies only by narrow path
- [x] **DOCS-06**: `markdownlint-cli2@0.23.0` runs in CI enforcing consistent markdown structure
- [ ] **DOCS-07**: README polished for ship-ready state: clear value proposition, install instructions, feature list, link to MAINTENANCE.md
- [ ] **DOCS-08**: Keep-a-Changelog and SemVer compliance audited; CHANGELOG.md follows the published spec

### RELIABILITY (SLO as phase completion criterion)

- [x] **REL-01**: 100% test pass on Linux + macOS + Windows platforms as a phase completion criterion (not aspirational); 10x validation run `28639808289` passed on all three platforms.
- [x] **REL-02**: Windows subprocess flakiness root-caused: raw subprocess test call sites migrated to the central timeout helper where applicable; central timeout constants are applied; per-test flake rate is tracked over CI runs.
- [x] **REL-03**: Escape hatch defined with friction: if root-cause genuinely exceeds timebox, per-test skip is allowed only with issue link + explicit deadline; skip is flagged-on-use in CI output; MAINTENANCE.md tracks deadline. No active REL-03 skips exist at Phase 41 closure.

### PERF (performance baselining + budget enforcement)

- [x] **PERF-01**: `scripts/bench.js` measures install time and compose time, and `scripts/bench-test-timing.js` measures test runtime across all 3 platforms via real workflow artifacts from run `28638612289`.
- [x] **PERF-02**: `perf-baseline.json` committed with per-platform baselines captured from PERF-01. `.planning/perf/test-timing.json` stores the separate test-suite timing baseline.
- [x] **PERF-03**: `scripts/check-perf.js` compares current run against baseline with configurable tolerance
- [x] **PERF-04**: `perf-budget` CI job enforces: warn at 1.1x baseline, fail at 1.25x baseline, per-platform budgets
- [x] **PERF-05**: `acceptedRegressions[]` escape hatch in perf-baseline.json allows reviewed regressions with required `{reason, reviewer, reviewedDate, ticket}` fields

## Future Requirements (v1.3.0+)

Deferred or scoped out of v1.2.0. Tracked but not in current roadmap.

### Extended ship-readiness

- **FUTURE-01**: Oversight triggers graduate from advisory to blocking (requires Phase 4 observation period; criteria defined in PROCESS-07)
- **FUTURE-02**: Semantic override staleness extended to `.md` files (requires semantic-diff tooling for markdown; scope for v1.3.0)
- **FUTURE-03**: Harden-runner block mode (requires 2+ weeks clean audit log; expected outcome of SECURITY-04)
- **FUTURE-04**: Public Scorecard badge (only applicable if repo visibility changes from private to public)

## Out of Scope

Explicitly excluded with reasoning. Prevents scope creep.

| Feature | Reason |
|---------|--------|
| Forward-compat testing vs upstream `main` | AF-1 per research -- contradicts exact-version-pinning principle; tests against unreviewed code |
| Gold OpenSSF Best Practices Badge | AF-2 per research -- requires multiple unassociated contributors; solo private fork cannot satisfy bus-factor criteria |
| CNCF governance / incubation | AF-3 -- wrong tier for private single-maintainer fork |
| Compat matrix N >= 10 | AF-4 -- signal-negative at that size; N=3 floor agreed via research |
| Public Scorecard badge | AF-5 -- repo is private; scorecard publishing requires public visibility |
| Runtime filtering in installer | AF-6 -- upstream install.js is 5K-line monolith; prior decision in PROJECT.md |
| Converting boundary/upstream-compat informational CI to blocking | AF-7 -- prior decision explicitly made these informational; reversing breaks established Key Decision |
| Upstream package as semver range instead of exact pin | AF-8 -- would auto-bump unreviewed upstream; violates exact-version-pinning decision |
| TypeScript migration | AF-9 per research and PROJECT.md -- adds build complexity for marginal benefit |
| LLM-based REASON.md validation | AF-10 -- adds AI-slop risk at a quality gate; mechanical SHA check is deterministic |
| Per-override GPG signing | AF-11 -- SHA-256 snapshots already provide integrity; GPG adds key-management burden without proportional benefit |
| Public rename / unscope from `@chude/` | Out of scope -- ship target is private scoped tagged release; rename is a future v2.0 decision |
| Multi-runtime support (Codex, Gemini, OpenCode) | Fork is Claude-only by decision; multi-runtime expands surface without fork value proposition |
| Migration to GSD-2 | GSD-2 is a different architectural category; evaluation deferred indefinitely, fork continues on GSD-1 |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPGRADE-01 | Phase 43 | Complete |
| UPGRADE-02 | Phase 43 | Pending |
| UPGRADE-03 | Phase 41 | Complete |
| UPGRADE-04 | Phase 43 | Pending |
| UPGRADE-05 | Phase 43 | Pending |
| UPGRADE-06 | Phase 41 | Complete |
| UPGRADE-07 | Phase 43 | Pending |
| UPGRADE-08 | Phase 43 | Pending |
| UPGRADE-09 | Phase 43 | Pending |
| UPGRADE-10 | Phase 40.5 | Pending |
| UPGRADE-11 | Phase 40.6 | Complete |
| PROCESS-01 | Phase 42 | Complete |
| PROCESS-02 | Phase 42 | Complete |
| PROCESS-03 | Phase 42 | Complete |
| PROCESS-04 | Phase 42 | Complete |
| PROCESS-05 | Phase 42 | Complete |
| PROCESS-06 | Phase 42 | Complete |
| PROCESS-07 | Phase 42 | Complete |
| SECURITY-01 | Phase 41 | Complete |
| SECURITY-02 | Phase 41 | Complete |
| SECURITY-03 | Phase 41 | Complete |
| SECURITY-04 | Phase 41 | Complete |
| SECURITY-05 | Phase 41 | Complete |
| SECURITY-06 | Phase 41 | Complete |
| SHIP-01 | Phase 44 | Pending |
| SHIP-02 | Phase 44 | Pending |
| SHIP-03 | Phase 43 | Pending |
| SHIP-04 | Phase 44 | Pending |
| SHIP-05 | Phase 44 | Pending |
| SHIP-06 | Phase 44 | Pending |
| SHIP-07 | Phase 42 | Complete |
| DOCS-01 | Phase 44 | Pending |
| DOCS-02 | Phase 44 | Pending |
| DOCS-03 | Phase 44 | Pending |
| DOCS-04 | Phase 42 | Complete |
| DOCS-05 | Phase 42 | Complete |
| DOCS-06 | Phase 42 | Complete |
| DOCS-07 | Phase 44 | Pending |
| DOCS-08 | Phase 44 | Pending |
| REL-01 | Phase 41 | Complete |
| REL-02 | Phase 41 | Complete |
| REL-03 | Phase 41 | Complete |
| PERF-01 | Phase 41 | Complete |
| PERF-02 | Phase 41 | Complete |
| PERF-03 | Phase 42 | Complete |
| PERF-04 | Phase 42 | Complete |
| PERF-05 | Phase 42 | Complete |

**Coverage:**
- v1.2.0 requirements: 47 total (45 original + UPGRADE-10 added 2026-04-22 with Phase 40.5 insertion + UPGRADE-11 added 2026-06-22 with Phase 40.6 insertion)
- Mapped to phases: 47 (100%)
- Unmapped: 0

**Per-phase summary:**
- Phase 40.5 (Upstream Bump & Decision Re-verification, INSERTED): 1 requirement -- UPGRADE-10
- Phase 40.6 (Upstream Authority Migration, INSERTED): 1 requirement -- UPGRADE-11
- Phase 41 (Foundation): 13 requirements -- UPGRADE-03, UPGRADE-06, SECURITY-01..06, PERF-01, PERF-02, REL-01..03
- Phase 42 (Budget + Process + Cousin-Test): 14 requirements -- PERF-03..05, PROCESS-01..07, SHIP-07, DOCS-04..06
- Phase 43 (Upgrade Resilience): 8 requirements -- UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-07..09, SHIP-03
- Phase 44 (Ship Polish): 10 requirements -- SHIP-01, SHIP-02, SHIP-04..06, DOCS-01..03, DOCS-07, DOCS-08

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-07-03 -- Phase 42 Plan 05 completed DOCS-05 and DOCS-06 markdown/link docs gates*
