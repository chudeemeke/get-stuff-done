# Project Research Summary -- v1.2.0 Ship-Ready Hardening

**Project:** @chude/get-stuff-done (overlay fork of get-shit-done-cc)
**Domain:** Long-lived overlay fork -- npm-published composition pipeline over an upstream CLI tool
**Milestone:** v1.2.0 Ship-Ready Hardening (NOT a greenfield; hardening additions to shipped 3.0.2)
**Researched:** 2026-04-20
**Overall Confidence:** HIGH -- four researchers agree on core direction; specific tool choices and single-source flags called out below

## Executive Summary

The v1.2.0 milestone is a hardening milestone on a published overlay whose architecture is already settled (upstream-as-devDependency, overlay/overrides/compose pipeline, cross-platform CI matrix). The research consensus is unambiguous: the hardening work is not about inventing new patterns but about **promoting existing informational signals into blocking gates**, **simulating the full publish -> install cycle end-to-end**, and **installing lightweight forcing functions against the specific failure modes this fork has already lived through** (upstream-scope misattribution, Windows subprocess flake, CHANGELOG merge near-misses, authkey-style ship-readiness theater). The dominant risk is not missing features -- it's theater: coverage badges, "audit passed" labels, and green CI that disguise dropped commits, suppressed findings, or retry-until-green culture.

The recommended approach layers three categories of additions onto the existing surface with no new top-level directories: (1) **upgrade resilience** via a Verdaccio-backed `verify-upgrade.js` script + a 3-version historical compat matrix driven by a JSON file in `.planning/`; (2) **supply-chain and ship-readiness gates** via `audit-ci`, `publint`, `gitleaks`, `osv-scanner`, `harden-runner`, `zizmor`, and CycloneDX SBOM generation, all wired into `.github/workflows/ci.yml` alongside the existing 5-check matrix; (3) **forcing functions** -- triage data files (audit suppressions with re-review dates, vetted-upstream-versions list, perf baseline with accepted-regression log), a cousin-test CI job, and structured probes added to the four PROCESS-0X oversight agents. Every addition must justify itself against overlay-specific constraints, not ecosystem popularity.

Top risks: Windows subprocess flake must be root-caused (or explicitly escape-hatched with a dated decision) before the Reliability SLO can be claimed; override staleness must be flipped to blocking *first* so later gates compose on a clean baseline; CLAUDE.md rule inflation is a real pattern this project is susceptible to, so the four PROCESS-0X agents must pass a consolidation review before landing; the dogfood upstream bump inside the milestone is the only way to prove the resilience system actually works, and it's easy to skip under schedule pressure.

## Key Findings

### Recommended Stack

The existing stack (`bun`, Node 20 LTS+, `esbuild`, `ajv`, `eslint`, `eslint-plugin-security`, `pathe`, `json5`, `get-shit-done-cc` as devDep, GHA cross-platform matrix) is frozen. Additions are tightly scoped to the five hardening goals and are each justified against overlay-specific failure modes, not generic popularity.

**Core additions (MUST tier -- all four researchers converge):**

- **`audit-ci@7.1.0`** -- CI-blocking wrapper around `bun audit` / `npm audit` with a JSONC allowlist of CVEs carrying explicit TTLs. The only reasonable way to gate on severity without `|| true` escape hatches. Supports Bun's audit format.
- **`publint@0.3.18`** -- Validates the actual tarball the way npm would. Critical because the overlay's `files:` manifest is hand-curated; silent drops here don't surface until consumers install.
- **`gitleaks`** (via `gitleaks/gitleaks-action@v2`) -- Pre-commit-safe, fast secrets scanner. The overlay stores `branding.json`, REASON.md files, and install metadata -- paper-cut-prone paths for accidentally committed tokens.
- **`lychee-action@v2`** -- Rust-fast link checker for MAINTENANCE.md / upgrade guide / README. Link rot is the #1 visible ship-readiness failure.
- **`verdaccio@6.5.2`** (as GHA service container, Linux-only) -- Local npm registry for true end-to-end upgrade simulation.
- **`@cyclonedx/cyclonedx-npm@4.2.1`** -- SBOM generation in CycloneDX 1.6 for supply-chain transparency.

**Strong tier:** `osv-scanner` v2, `step-security/harden-runner@v2`, `zizmor@v0`, `hyperfine`, `markdownlint-cli2@0.22.0`, `semver@7.7.4`.

**Explicitly rejected:** `snyk`, `semgrep` Pro, `trufflehog` (primary), `changesets`, `commitizen`/`commitlint`/`husky`/`lint-staged`, `renovate`/`dependabot` on `get-shit-done-cc` pin, monorepo tooling, TS bundlers, `arethetypeswrong/cli` (zero TS types).

*Single-source flags:* `knip`, `doctoc`, `tinybench` (STACK-only nice-to-haves).

### Expected Features

This is ship-readiness, not feature expansion. Floor is OSPS Baseline + SLSA L2 + Keep-a-Changelog + SemVer applied to a private-scope npm CLI + overlay-specific must-haves.

**Must-have (table stakes):**

- **TS-2 Override staleness as blocking CI gate** (TRIVIAL P1; one-line CI flip) -- do first.
- **TS-1 Automated upgrade smoke test** (MODERATE P1) -- install prior -> bump -> recompose -> reinstall -> verify via Verdaccio.
- **TS-3 Historical-version compat matrix, N=3** (MODERATE P1) -- last 3 vetted; JSON pin file; prune-on-bump.
- **TS-4 Pre-publish hard gates** (TRIVIAL-MODERATE P1) -- tests + lint + audit + publint + SBOM gate `aidev publish`.
- **TS-5 Supply-chain audit per release** (TRIVIAL P1) -- `audit-ci` with `audit-suppressions.json` carrying `{id, severity, reason, reviewer, reviewedDate, reReviewDate}`.
- **TS-6 100% test pass on 3 platforms** (SIGNIFICANT P1) -- blocks TS-1; requires Windows flake root-cause or dated escape hatch.
- **TS-7/8/9 Changelog, README, reproducible builds** (P1) -- likely present; audit.
- **TS-10 MAINTENANCE.md** (P1) -- lands late after TS-1/2/3 exist.
- **TS-11 Security triage policy** (P1) -- critical->v1.2.0, major->v1.3.0, minor->backlog.
- **D-7 Live dogfood bump** (P1) -- proof-the-system-works.

**Should-have differentiators:**
- D-2 perf budget enforcement (P2)
- D-4 SLSA L2 provenance via `npm publish --provenance` (P2)
- D-1 semantic override staleness (P2)
- D-8 override churn in changelog (P2)
- D-3 oversight graduation advisory->blocking (P2)

**Defer / anti-features:** forward-compat testing vs upstream `main` (AF-1), Gold OpenSSF badge (AF-2), CNCF governance (AF-3), N>=10 matrix (AF-4), public Scorecard badge on private repo (AF-5), runtime filtering (AF-6), converting informational boundary/compat to blocking (AF-7), upstream semver range (AF-8), TS migration (AF-9), LLM-based REASON validation (AF-10), per-override GPG signing (AF-11).

### Architecture Approach

Four-layer structure (consumer surface / composition / source / verification) retained unchanged. **No new top-level directories.** All new scripts follow `scripts/*.js` convention (pure function + CLI entry + peer test + documented exit codes).

**Major components added/modified:**

1. **`scripts/verify-upgrade.js`** (NEW) -- orchestrator for full upgrade cycle.
2. **`.planning/vetted-upstream-versions.json`** (NEW) -- N=3 matrix source of truth.
3. **Split `boundary-override-check` CI job** (MODIFIED) -- `boundary-check` informational + `override-check` blocking (one-line change).
4. **`scripts/bench.js` + `scripts/check-perf.js` + `perf-baseline.json`** (NEW) -- measure->compare->enforce with `acceptedRegressions[]` escape hatch.
5. **`scripts/verify-oversight-probes.js` + structured watches tables in `overlay/agents/gsd-oversight-*.md`** (NEW/MODIFIED) -- deterministic probes without OPA/Semgrep dependency.
6. **`.planning/audits/suppressions.json` + `scripts/check-audit-suppressions.js`** (NEW) -- triage as data with expiry.
7. **New CI jobs:** `security`, `secret-scan`, `perf-budget`, `compat-matrix`, `upgrade-resilience`, `oversight-verify`; harden-runner injected into existing jobs.
8. **SBOM step** (MODIFIED `finalize-dist.js`) -- `dist/bom.json` between compose and finalize.

**Critical sequencing:**
- Override-staleness flip FIRST (requires pre-flip main passes).
- Security audit EARLY (a CVE re-plans milestone).
- Perf measure BEFORE budget.
- Windows SLO BEFORE upgrade smoke test.
- `verify-upgrade.js` BEFORE compat matrix.
- Oversight probes PARALLEL (after consolidation review).
- MAINTENANCE.md LATE.
- Dogfood AFTER gates exist.

### Critical Pitfalls (top 7)

1. **Ship-readiness theater** (Pitfall 6) -- authkey incident precedent. Mitigation: every deliverable has anti-theater verification test; assertions-per-test ratio; link-check CI; executable-examples; retry-is-gate-failure; suppressions as reviewable data.
2. **Override staleness undetected until runtime** (Pitfall 2) -- Mitigation: orphan check + SHA-drift + semantic-drift warning, all blocking.
3. **Upstream-scope misattribution** (Pitfall 1) -- three prior instances in this fork's memory. Mitigation: oversight agent refuses upstream-issue proposals without reproduction evidence against unmodified upstream.
4. **Windows subprocess flake masked as "OS-level timing"** (Pitfall 7) -- Mitigation: timebox (2 working days); per-test flake-rate; `Promise.race([child, timer])` not `exec` timeout; central timeout constants; dated escape hatch if truly unfixable.
5. **CLAUDE.md rule inflation / context rot** (Pitfall 5) -- PROCESS-01..04 landing risk. Mitigation: forcing-function test for new rules; consolidation review before implementation; rules requiring absent tools are worse than none.
6. **Blanket merge resolution drops code** (Pitfall 9) -- authkey failure #1 precedent + CHANGELOG near-miss (hit twice in 24h per memory). Mitigation: ban `--theirs`/`--ours` in bump runbook; `CONFLICTS_RESOLVED.md` artifact required; programmatic CHANGELOG conflict check.
7. **Cousin-test scenario install failure** (Pitfall 8) -- Mitigation: cold-install CI (fresh OS x Node x package-manager matrix with minimal-scope token); INSTALL.md; PATH verification.

**Secondary:** compat matrix combinatorial explosion (pitfall 3), audit false-positive swamp (pitfall 4), doc rot (pitfall 10), perf regression untracked (pitfall 11).

## Implications for Roadmap

### Phase 1: Foundation -- Flip the Gate, Install the Audit Surface

**Rationale:** Zero-dependency items that establish policy baseline; audit surface might re-plan milestone; measure baseline now (enforce in Phase 2); Windows flake root-cause OR dated escape-hatch decision (blocks TS-1).

**Delivers:** override-staleness blocking (one-line flip after pre-flip check), `audit-ci` + suppressions file schema, `gitleaks` + `osv-scanner` in `security` CI job, `harden-runner` in audit mode, `publint` in `prepublishOnly`, `eslint-plugin-security` config audit, `bench.js` + `perf-baseline.json` captured, Windows flake decision, MAINTENANCE.md skeleton with Security Triage section.

**Addresses:** TS-2, TS-5, TS-11; partial TS-4/6/10; D-2 part 1.
**Avoids:** pitfalls 2, 4, 7, 11.

### Phase 2: Budget Enforcement + Process Hardening

**Rationale:** Perf budget needs Phase 1 baseline to be calibrated. PROCESS-01..04 consolidation review precedes implementation. Cousin-test is independent, unblocks ship-readiness confidence early.

**Delivers:** `check-perf.js` + `perf-budget` CI job (warning band + hard fail + `acceptedRegressions[]`); PROCESS-01..04 oversight agents with structured watches (consolidation review FIRST); `verify-oversight-probes.js` + weekly CI; cold-install CI (fresh Ubuntu/macOS/Windows x Node 20+22 x bun/npm/pnpm); INSTALL.md; `lychee-action` + `markdownlint-cli2` CI.

**Addresses:** D-2, D-3; TS-6 completion; partial TS-8/10.
**Avoids:** pitfalls 5, 8, 10, 11.

### Phase 3: Upgrade Resilience -- Verify + Matrix + Dogfood

**Rationale:** `verify-upgrade.js` is the heart; compat matrix multiplies it; dogfood closes proof loop.

**Delivers:** `scripts/verify-upgrade.js` (~300 lines + peer tests + `tests/upgrade/fixtures/`); `upgrade-resilience` Verdaccio CI job (Linux-only, scheduled + on-change); `vetted-upstream-versions.json` (N=3); `compat-matrix` CI (informational on historical, blocking on pinned); live dogfood upstream bump with recorded evidence; override churn CHANGELOG section; CycloneDX SBOM in compose pipeline with `dist/bom.json` in tarball.

**Addresses:** TS-1, TS-3; D-1, D-7, D-8.
**Avoids:** pitfalls 2, 3, 6, 9.

### Phase 4: Ship Polish -- Publish Flow, Provenance, Final Audit

**Rationale:** All gates exist and compose; wire to `aidev release`/`aidev publish`; MAINTENANCE.md can document real processes; final anti-theater checklist.

**Delivers:** `aidev publish` verified with full pre-publish gate chain; npm `--provenance` via GHA OIDC Trusted Publishing (no NPM_TOKEN alongside OIDC -- Axios incident pattern); `zizmor` workflow static analysis CI; harden-runner `audit`->`block` promotion (only if 2+ weeks clean audit log); MAINTENANCE.md complete (upgrade process, override conflict handling, CI staleness response, release cadence, bump runbook prohibiting `--theirs`, security triage, perf budget, escape-hatch decisions log); upgrade guide + README polish; Keep-a-Changelog + SemVer audit; reproducibility verification (compose-twice byte-identical); PITFALLS.md "Looks Done But Isn't" checklist walked through as ship gate.

**Addresses:** TS-4, TS-7, TS-8, TS-9, TS-10 completion; D-4.
**Avoids:** pitfalls 1, 6, 10.

### Phase Ordering Rationale

- Phase 1 first: cheapest change (one-line flip); early CVE discovery re-plans milestone cheaply; baseline before budget non-negotiable.
- Phase 2 before Phase 3: consolidation review is a forcing function before heaviest feature work; cousin-test independent.
- Phase 3 is the heart: build single upgrade test before matrix; dogfood only works AFTER gates exist.
- Phase 4 last: MAINTENANCE.md documents processes that must exist; provenance needs publish flow confirmed; anti-theater checklist final.

### Research Flags

**Needs research:** Phase 1 Windows flake session (scheduled per memory `project_todo_windows_flakiness.md`); Phase 2 PROCESS-01..04 consolidation review; Phase 3 `verify-upgrade.js` programmatic API confirmation; Phase 4 npm Trusted Publishing / OIDC current setup.

**Standard patterns (skip research):** Phase 1 GHA-action wiring; Phase 2 lychee/markdownlint-cli2; Phase 3 GHA matrix expansion.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified on npm registry same-day; overlay-specific rationales; each rejection includes reason. |
| Features | HIGH for TS-1..11 (multiple primary-source standards); MEDIUM for D-3, D-8 (clear patterns, varying terminology). |
| Architecture | HIGH -- all integration points verified against existing files; dependency rationale explicit; no invariant violations. |
| Pitfalls | HIGH for 1, 3, 4, 5, 8 (direct project-memory precedents); MEDIUM for 2, 6, 7 (external patterns, novel project-specific application). |

**Overall confidence:** HIGH

**Reconciliation:** Researchers agree on override-staleness one-line first, N=3 compat matrix, measure-before-enforce perf, Windows flake as critical blocker on TS-6.

**Single-source flags:** `knip`/`doctoc`/`tinybench` (STACK only); structured watches table pattern (ARCHITECTURE only; shape may shift after consolidation); CHANGELOG merge-conflict mitigation (PITFALLS via memory reference -- hit twice in 24h).

### Gaps to Address (decisions needed BEFORE PLAN.md)

| Gap | Recommendation |
|-----|----------------|
| N for historical compat matrix | **N=3** (revisit quarterly) |
| Windows escape-hatch if root-cause times out | (a) per-test issue-linked skip with deadline; (b) drop Windows from 100% SLO as fallback |
| PROCESS-01..04 consolidation outcome | Run review as first Phase 2 task; collapse to 1 rule + 4 triggers if shared pattern |
| Perf budget tolerance | Warning 1.1x + hard fail 1.25x + `acceptedRegressions[]`; per-platform budgets |
| harden-runner audit->block timing | Phase 1 audit; Phase 4 block only if 2+ weeks clean log |
| CHANGELOG merge-conflict mitigation | `.changelog-conflict-check.sh` in Phase 4 bump runbook |
| Verdaccio matrix scope | Linux-only asymmetry documented in MAINTENANCE.md |
| SBOM commit location | `dist/bom.json` in tarball + GitHub release artifact; between compose and finalize-dist |

## Sources

### Primary (HIGH confidence)
- Project-internal: `.planning/PROJECT.md`, `.planning/research/*`, `package.json`, `.github/workflows/ci.yml`, `scripts/compose.js`, `scripts/check-overrides.js`, `overlay/agents/gsd-oversight-*.md`
- Project memory: `project_overlay_architecture.md`, `project_windows_test_flakiness.md`, `feedback_verify_upstream_scope.md`, `merge_conflict_changelog_nearmiss.md`, `feedback_oss_contribution_goals.md`
- OpenSSF Baseline (2025-02-25) / Best Practices / Scorecard; SLSA v1.0; npm Provenance docs; Keep a Changelog; SemVer
- npm registry version lookups 2026-04-20

### Secondary (MEDIUM confidence)
- Downstream precedents: Igalia Chromium blog; OpenShift Kubernetes fork; Debian UsingQuilt; Arch PKGBUILD; Homebrew Formula Cookbook
- Ship-readiness patterns: Lighthouse CI; reviewdog; github-action-benchmark; test-all-versions
- Tool comparisons: Gitleaks vs TruffleHog 2026; Knip vs depcheck 2026
- Security incidents: Axios npm hijack 2026; axios/axios#10636; Spring 2026 OSS incidents

### Tertiary (LOW confidence / single-source)
- Blog-tier industry trend claims -- used for pattern validation, not load-bearing.

---
*Research completed: 2026-04-20*
*Ready for roadmap: yes*
*Decisions needed before PLAN.md: 8 items, all with recommendations.*
