# Feature Research — v1.2.0 Ship-Ready Hardening

**Domain:** npm CLI tool / overlay fork of upstream package (Node.js 20 LTS+, private repo, @chude/ scope)
**Researched:** 2026-04-20
**Confidence:** HIGH for categories 1-4 (multiple primary-source standards cited); MEDIUM for category 5 (industry pattern is clear; terminology varies)

Scope anchor: existing architecture consumes upstream `get-shit-done-cc` as npm devDependency, composes at publish time via 5-stage pipeline (resolve/filter/override/brand/merge), tracks overrides with SHA snapshots and REASON.md, runs 5-check CI matrix on 3 platforms, and uses `continue-on-error` for informational compat/boundary jobs. All feature assessments below account for this existing foundation.

## Feature Landscape

### Table Stakes (Users Expect These — Missing = Not Ship-Ready)

Features that every mature overlay/fork or ship-ready npm package demonstrably has. Missing any of these undermines the "professional grade, market ready" claim.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| TS-1 | **Automated upgrade smoke test in CI** (install prior version → bump upstream → recompose → reinstall → verify) | Chromium downstream maintainers cite CI on every upstream bump as the non-negotiable baseline for catching breakage ([Igalia: Chromium downstream update strategies](https://blogs.igalia.com/dape/2024/09/13/maintaining-chromium-downstream-update-strategies/)). OpenShift rebases are gated on tests against the new Kubernetes tag ([OpenShift Kubernetes fork README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)). Without this, every upstream bump is a gamble. | MODERATE | Existing `run-upstream-compat.js` runs upstream tests against composed `dist/`. Need: a separate job that simulates the upgrade path (not just the final state). Dogfood requirement in milestone is the live-fire version of this. |
| TS-2 | **Override staleness detection as a blocking gate** | Debian quilt tracks applied patches against a known upstream baseline; mismatches block package building ([Debian UsingQuilt wiki](https://wiki.debian.org/UsingQuilt)). Arch PKGBUILDs use `sha256sums` array; mismatch fails makepkg ([ArchWiki: PKGBUILD](https://wiki.archlinux.org/title/PKGBUILD)). Homebrew treats SHA mismatch on upstream source as a hard error requiring revision bump ([Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)). The existing `check-overrides.js` already computes this — promoting it from informational to blocking is the gap. | TRIVIAL | Architecture already present (SHA + REASON.md). Gap is CI wiring: flip `continue-on-error: true` → `false` for the override check job. Milestone explicitly calls this out as distinct from informational boundary/compat. |
| TS-3 | **Historical-version compat matrix** (last N vetted upstream versions, not arbitrary forward versions) | `test-all-versions` ([npm](https://www.npmjs.com/package/test-all-versions)) and the standard GitHub Actions matrix pattern are industry baseline for libraries with peer dependencies ([GitHub Actions matrix docs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)). Consensus from matrix testing guides: test against Node LTS + current, and for peer deps, test against declared semver range boundaries ([dev.to: Testing npm packages against multiple peer dependency versions](https://dev.to/joshx/test-your-npm-package-against-multiple-versions-of-its-peer-dependency-34j4)). N=3 is the common floor (prior LTS + current LTS + latest current). | MODERATE | Currently pinned to one exact upstream version at a time. Need: matrix entries for e.g. `[1.32.0, 1.33.x, 1.34.2]` — last three vetted versions. Don't test forward; that's upstream's job. |
| TS-4 | **Pre-publish hard gates** (tests, lint, type/schema check, security audit, provenance) | Standard ship pipeline — `npm publish` with `--provenance` is now the GitHub-recommended default ([GitHub Blog: Introducing npm package provenance](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/)). SLSA Level 2 requires hosted builder + signed provenance ([SLSA v1.0 spec](https://slsa.dev/spec/v1.0/)). OpenSSF Scorecard "Signed-Releases" check expects signed artifacts ([OpenSSF Scorecard](https://scorecard.dev/)). | TRIVIAL–MODERATE | `aidev publish` is the entrypoint. Gap: confirm it runs tests + lint + audit pre-publish, and that npm publish uses `--provenance` (GitHub Actions context required for provenance). |
| TS-5 | **Supply-chain audit on every release** (`npm audit`, dependency advisory scan) | OSPS Baseline ([OpenSSF Open Source Project Security Baseline, 2025-02-25](https://baseline.openssf.org/versions/2025-02-25)) lists vulnerability scanning as core control. Axios 2026 compromise ([SOCRadar 2026-04-01 advisory](https://socradar.io/blog/axios-npm-supply-chain-attack-2026-ciso-guide/)) underlines the cost of skipping this. Existing `preview-update.js` runs a 6-vector supply chain scan; need it to run on our own tree, not just upstream deltas. | TRIVIAL | `npm audit --audit-level=high` in CI. Existing supply-chain scanner can be generalized. |
| TS-6 | **100% test pass on all supported platforms** (no "known flaky" exceptions in green builds) | PROJECT.md explicitly lists this as the reliability SLO. Industry norm: required status checks on `main` in GitHub branch protection ([GitHub Docs: about-protected-branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). A test marked "intermittent" that ships green regardless is a broken gate. | SIGNIFICANT (if Windows subprocess flakiness is non-trivial to root-cause) | Known tech debt item. Either root-cause the Windows subprocess timeout, or document the escape hatch decision (retry policy, platform-specific skip with expiry date, or drop Windows from the SLO) and codify it. |
| TS-7 | **Changelog following "Keep a Changelog" format + SemVer tags** | De facto standards for professional-grade libraries. Keep a Changelog ([keepachangelog.com](https://keepachangelog.com/)) + SemVer ([semver.org](https://semver.org/)) are cited universally; required by OpenSSF Best Practices passing badge criterion `release_notes` and `release_notes_vulns` ([FLOSS Best Practices Criteria](https://www.bestpractices.dev/en/criteria)). | TRIVIAL | Likely already present; audit format adherence. `Added/Changed/Deprecated/Removed/Fixed/Security` sections; tag = `v<MAJOR>.<MINOR>.<PATCH>`. |
| TS-8 | **README covering install, usage, upgrade, uninstall, support matrix** | OpenSSF Best Practices passing criteria `interact` and `documentation_basics` ([bestpractices.dev criteria](https://www.bestpractices.dev/en/criteria)). Standard for every published npm package. | TRIVIAL | Audit existing README against the explicit list. Confirm Node 20 LTS minimum, supported platforms, upstream version range are stated. |
| TS-9 | **Reproducible builds** (same git SHA produces same npm tarball) | SLSA Level 2 requirement ([slsa.dev/spec/v1.0](https://slsa.dev/spec/v1.0/)). OpenSSF baseline entry. Composition pipeline must be deterministic given fixed upstream version + overlay SHA. | TRIVIAL (if compose is already pure) | Existing `.install-meta.json` audit trail suggests this is close. Verify: compose twice on same input → byte-identical dist/. |
| TS-10 | **MAINTENANCE.md documenting the upgrade process** | Open-source governance norm — MAINTAINERS.md/MAINTENANCE.md files documented by Hyperledger TOC ([Hyperledger MAINTAINERS guideline](https://toc.hyperledger.org/guidelines/MAINTAINERS-guidelines.html)) and OpenWallet Foundation ([OpenWallet MAINTAINERS.md guide](https://tac.openwallet.foundation/governance/maintainers-file-content/)). PROJECT.md calls out MAINTENANCE.md (not CONTRIBUTING; private repo). | TRIVIAL | Single document covering: how to bump upstream, how to handle override conflicts, how to respond to CI staleness alarms, release cadence expectations. |
| TS-11 | **Triage policy for security findings** (critical/major/minor → v1.2.0/v1.3.0/backlog) | PROJECT.md milestone explicitly states this triage rule. OpenSSF baseline "vulnerability_response_process_present" criterion. | TRIVIAL | Documented in MAINTENANCE.md or SECURITY.md. |

### Differentiators (Features That Raise the Bar Beyond "Shipped")

Features that go past the floor and signal deliberate engineering quality. Not required for "ship-ready" claim, but would distinguish the fork if ever public.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D-1 | **REASON.md justification enforced against upstream current state** (not just historical SHA) | Current check validates "override was created for reason X vs upstream SHA Y"; upgrading to "reason X is still applicable to upstream-current" catches silent staleness where upstream fixed the issue the override was compensating for. OpenShift uses `UPSTREAM: <carry>` prefix to signal the same distinction ([OpenShift fork README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)) — carry patches are re-evaluated every rebase. | MODERATE | Existing check compares against pinned SHA. Differentiator: on upstream bump, auto-generate "override candidates for removal" report. Human still decides. |
| D-2 | **Performance budget enforcement in CI** (install time, compose time, statusline render latency) | Lighthouse CI pattern ([GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci/)) applied to a CLI tool: fail builds that regress past declared thresholds. PROJECT.md milestone calls this out as a target. | MODERATE | Need: baseline measurement script (install time, compose time, hook latency), stored budget file (JSON), CI job that measures + compares + fails if delta > threshold. Run 3+ times per measurement to reduce noise (Lighthouse CI convention). |
| D-3 | **Oversight agents as advisory CI checks with graduation path** | Existing PROCESS-01 through PROCESS-04 agents flag without blocking. Industry analogue: `reviewdog` ([reviewdog/reviewdog](https://github.com/reviewdog/reviewdog)) posts findings as PR annotations, configurable between advisory and blocking. Progressive enforcement pattern: advisory → warn-on-repeat → block. | MODERATE | Path: (1) wire oversight outputs as PR annotations, (2) track how often each check fires + whether it catches real issues, (3) promote consistently-correct checks to blocking after cooldown period. Document the graduation criteria explicitly. |
| D-4 | **SLSA Level 2 provenance + sigstore signing** | Only 12% of top-50 npm packages ship provenance as of 2026 ([DEV.to audit](https://dev.to/thecryptodonkey/i-audited-the-top-50-npm-packages-almost-none-ship-with-supply-chain-attestations-3ki8)). Meaningful differentiator for a private-scoped professional package. `--provenance` flag on `npm publish` from GitHub Actions provides this ([npm Docs: Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/)). | TRIVIAL–MODERATE | Requires publish to run from GitHub Actions (not local). Token must have `id-token: write` permission. Low implementation cost; high signal. |
| D-5 | **OpenSSF Scorecard score published + tracked over time** | Even on private repos (scorecard can run on any repo). Concrete, externally-validated security posture metric. 18 checks across 3 themes ([OpenSSF Scorecard](https://openssf.org/projects/scorecard/)). Serves as self-audit ruler. | TRIVIAL | GitHub Actions workflow runs scorecard weekly; result stored in repo as JSON + badge. On private repo, value is internal quality metric, not public signal. |
| D-6 | **Cross-version compatibility test matrix extending to last 5 vetted upstream versions** (not just 3) | Extends TS-3. Prettier tests against Node 14/16/18/20 in CI. Consensus threshold N=3 is the floor; N=5 signals serious commitment. Caveat: test matrix cost scales linearly, so justify based on actual churn. Upstream releases every few weeks; N=5 ≈ 2-3 months of backstop. | MODERATE | Extension of TS-3. Justify by counting upstream release cadence: if release cadence is 2 weeks, N=5 covers 10 weeks. |
| D-7 | **Post-upgrade dogfood gate** (bump upstream during milestone, prove the system works) | PROJECT.md milestone calls this out as "live upgrade dogfood." Analogous to eating-your-own-dogfood patterns in distros: Debian's `unstable` → `testing` → `stable` pipeline includes maintainers running their own packages. | TRIVIAL (process, not code) | Perform one real upstream bump mid-milestone using the new CI gates and document what they caught / didn't catch. Evidence that the hardening works. |
| D-8 | **Release notes that call out override churn** (added/removed/carried) | OpenShift's `UPSTREAM: <carry>` commit-prefix convention ([OpenShift README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)) makes override lifecycle visible in git history. Analogous: changelog section "Overrides: added X, removed Y (upstream fixed Z), carried W against 1.34.2." | TRIVIAL | Automatable: diff `overrides/` between tagged releases; generate markdown section for CHANGELOG. |

### Anti-Features (Rejected — Each With Reason)

Features that pattern-match to "professional-grade" but introduce cost/complexity disproportionate to benefit for THIS fork's profile (private repo, single primary maintainer, overlay architecture, ~151 files). Each rejection is grounded, not hand-waved.

| # | Rejected Feature | Surface Appeal | Why Rejected | Alternative |
|---|------------------|----------------|--------------|-------------|
| AF-1 | **Forward-compat testing** (test against upstream `main` / next release) | "Catches breakage before it lands" sounds valuable | Upstream's `main` is unstable by design; testing against it means chasing noise. OpenShift explicitly does not do this — they rebase on tagged releases only ([OpenShift Kubernetes fork README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)). Igalia's Chromium guidance: wait for stabilization branch or beta channel, not `main` ([Igalia blog](https://blogs.igalia.com/dape/2024/09/13/maintaining-chromium-downstream-update-strategies/)). Upstream owns main; fork owns tagged bumps. | Historical matrix (TS-3) covers regression detection; upstream tagged release is the trigger, not `main`. |
| AF-2 | **Gold-level OpenSSF Best Practices badge** | Maximum badge = maximum signal | Gold requires bus factor ≥ 2 with two unassociated significant contributors ([bestpractices.dev silver/gold criteria](https://www.bestpractices.dev/en/criteria)). Single-maintainer private fork cannot meet this without lying. 27 of 6,200+ projects have gold — it's aspirational for mature multi-maintainer OSS, not a solo fork's target. | **Passing** badge criteria as internal audit ruler (self-assess; don't apply). Silver/gold explicitly not pursued. |
| AF-3 | **CNCF-style graduated project governance** (GOVERNANCE.md, TOC, multiple maintainers) | "Legitimizes" the project | CNCF maturity model is designed for multi-org projects with adoption across tiers ([CNCF Project Lifecycle](https://contribute.cncf.io/projects/lifecycle/)). This is a private fork of a personal tool. Governance overhead with no governance surface area. | Single MAINTENANCE.md (TS-10); no governance fiction. |
| AF-4 | **N=10+ version compat matrix** | "More coverage is better" | Matrix cost scales linearly. Upstream releases every few weeks; N=10 means testing against ~5 months of historical versions, most of which no consumer of the fork actually runs. Industry practice is N=3 floor (prior LTS + current LTS + latest), N=5 for serious projects ([Node.js Release Working Group](https://github.com/nodejs/Release)). N=10 is signal-to-noise negative. | N=3 as TS-3 floor; N=5 as D-6 differentiator if justified. |
| AF-5 | **Public Scorecard badge on README** | "Signals security posture" | Private repo; nobody outside the maintainer sees the badge. Badge-as-decoration without the public audience is theater. | D-5 (internal Scorecard metric) without README badge. |
| AF-6 | **Runtime filtering of upstream features at install time** | "User chooses what they install" | Already rejected in PROJECT.md Out of Scope. Upstream install.js is 5K-line monolith; runtime filtering at install time requires intrusive hooks and creates an install-time state explosion. | Composition-time filtering (already shipped via features.json + filter stage). Users choose by version; no runtime fork. |
| AF-7 | **Converting all informational CI jobs to blocking** | "Strict is better" | Boundary violations (48 current) are structural — tracking overlay drift. Upstream compat failures (~130) are branding diffs by design. Making them blocking produces false-red builds and erodes signal. PROJECT.md already committed to `continue-on-error` for these specifically. | Override staleness blocking (TS-2) because SHA mismatch is an actual state change. Boundary/compat stay informational because they're measuring intentional deltas. |
| AF-8 | **Pinning upstream to a range instead of exact version** (^ or ~ semver range) | "Auto-consumes patch fixes" | Overlay architecture relies on composing against a *known* upstream SHA set. Range pinning defeats the override SHA check entirely (upstream could change underneath you between composes). Already decided in PROJECT.md Key Decisions: "Exact version pinning — Prevents unreviewed upstream updates." | Exact pin + deliberate `/gsd:update` workflow with preview-update scan. |
| AF-9 | **TypeScript migration for the fork-specific code** | "Type safety" | Already rejected in PROJECT.md Out of Scope ("adds build complexity for marginal benefit"). Decision stands. Result type pattern already provides explicit error handling; AJV schemas provide runtime validation. | JSDoc type hints where useful; AJV schema validation for config; no build step. |
| AF-10 | **"Block merge if override REASON.md mentions a bug that has since been fixed upstream"** (semantic REASON validation via LLM) | "Catches stale overrides automatically" | Three failure modes: (1) false positives from LLM misreading reason prose, (2) non-determinism in CI (same input → different output across runs), (3) external API dependency for what should be a git operation. Upstream tracking via SHA + human triage (D-1) is deterministic; LLM validation is seductive but gate-unsuitable. | D-1 (generate candidate list, human approves). LLM good for suggestion, bad for gate. |
| AF-11 | **Signing individual overrides with maintainer GPG key** | "Cryptographic integrity" | Git commit signing already provides this at commit granularity. Adding a second signing layer for files inside commits is redundant. `validpgpkeys` array in Arch PKGBUILDs ([ArchWiki PKGBUILD](https://wiki.archlinux.org/title/PKGBUILD)) is for upstream source verification, not for overrides themselves. | Signed git commits (OpenSSF Scorecard `Signed-Releases` check) covers this. |

## Feature Dependencies

```
TS-2 (override staleness blocking)
    └──requires──> existing SHA + REASON infrastructure [shipped v1.0.0]
    └──enables──> D-1 (upstream-current staleness, semantic staleness)

TS-1 (upgrade smoke test)
    └──requires──> TS-3 (historical matrix)
    └──requires──> D-7 (dogfood bump) to prove it works
    └──enables──> confidence in routine upstream bumps

TS-6 (100% test pass SLO)
    └──blocks──> TS-1 (can't gate on flaky baseline)
    └──requires──> Windows subprocess flakiness root-cause OR escape hatch decision

TS-4 (pre-publish gates)
    └──requires──> TS-5 (audit), TS-6 (100% pass), TS-9 (reproducible)
    └──enables──> D-4 (SLSA L2 provenance)

TS-10 (MAINTENANCE.md)
    └──documents──> TS-1, TS-2, TS-3, TS-11 processes
    └──requires──> those features to be defined first

D-3 (advisory → blocking graduation)
    └──conflicts-with-ordering──> TS-6 (SLO) if advisory checks are noisy during SLO effort
    └──depends-on──> PROCESS-01..04 agents (in milestone target list)

D-2 (performance budget)
    └──requires──> baseline measurement (one-time cost)
    └──enhances──> TS-6 (catches perf regressions alongside correctness)
```

### Dependency Notes

- **TS-2 → TS-1:** Staleness gate must be blocking BEFORE the upgrade smoke test is meaningful. Otherwise smoke test passes with stale overrides and hides real breakage.
- **TS-6 blocks TS-1:** An upgrade smoke test on a platform that's flaky can't be trusted. Fix the SLO before gating on the smoke test.
- **TS-10 depends on TS-1, TS-2, TS-3:** Can't document processes that don't exist. MAINTENANCE.md lands late in the milestone.
- **D-3 ordering caution:** Promoting oversight agents to blocking while TS-6 is being stabilized would amplify noise. Sequence: fix SLO → stabilize agents as advisory → graduate consistent ones.
- **AF-7 (not converting informational to blocking) is load-bearing:** It protects the TS-2 signal. If every CI job is blocking, override staleness becomes just another red check among many.

## Prioritization Matrix

| # | Feature | User Value | Implementation Cost | Priority |
|---|---------|-----------|---------------------|----------|
| TS-2 | Override staleness blocking gate | HIGH | TRIVIAL | P1 |
| TS-6 | 100% test pass SLO | HIGH | HIGH (Windows root-cause) | P1 |
| TS-1 | Upgrade smoke test in CI | HIGH | MODERATE | P1 |
| TS-3 | Historical compat matrix (N=3) | HIGH | MODERATE | P1 |
| TS-4 | Pre-publish hard gates | HIGH | TRIVIAL | P1 |
| TS-5 | Supply-chain audit per release | HIGH | TRIVIAL | P1 |
| TS-11 | Security triage policy documented | MEDIUM | TRIVIAL | P1 |
| TS-10 | MAINTENANCE.md | MEDIUM | TRIVIAL | P1 |
| TS-7 | Keep a Changelog + SemVer | MEDIUM | TRIVIAL | P1 (likely already present; audit) |
| TS-8 | README completeness | MEDIUM | TRIVIAL | P1 (likely already present; audit) |
| TS-9 | Reproducible builds | MEDIUM | TRIVIAL | P1 (probably already true; verify) |
| D-7 | Live dogfood bump | HIGH | TRIVIAL (process) | P1 (listed in milestone) |
| D-2 | Performance budget enforcement | MEDIUM | MODERATE | P2 (milestone target) |
| D-1 | Semantic override staleness | MEDIUM | MODERATE | P2 |
| D-3 | Oversight agent graduation path | MEDIUM | MODERATE | P2 (PROCESS-01..04 are P1 delivery; graduation is P2) |
| D-4 | SLSA Level 2 provenance | MEDIUM | TRIVIAL–MODERATE | P2 |
| D-8 | Override churn in changelog | LOW | TRIVIAL | P2 |
| D-5 | Internal Scorecard metric | LOW | TRIVIAL | P3 |
| D-6 | N=5 extended matrix | LOW | MODERATE | P3 |

**Priority key:**
- **P1** = Required for ship-ready claim. Delivers in v1.2.0.
- **P2** = Differentiator; delivers in v1.2.0 if budget allows, else v1.3.0.
- **P3** = Nice-to-have; v1.3.0+ backlog candidate.

## Cross-Category Summary: Five Research Questions → Findings

### 1. Upgrade resilience patterns (how does the industry catch "upstream broke us"?)

Primary pattern: **test against the upstream bump as a CI job, gated on a pinned baseline**. Chromium downstreams run automation on every upstream main cycle, but ship off stabilization branches ([Igalia blog](https://blogs.igalia.com/dape/2024/09/13/maintaining-chromium-downstream-update-strategies/)). OpenShift tests on every rebase, with patches prefixed `UPSTREAM:` vs `UPSTREAM: <carry>` to distinguish merge candidates from carries ([OpenShift fork README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)). The two-axis structure (merge-based vs rebase-based downstream; known-good upstream ref as the baseline) applies directly to this fork — overlay architecture is a rebase-style pattern. **Translation to features: TS-1 + TS-3.**

### 2. Override staleness detection patterns

Primary pattern: **content hash checked against the upstream source at build time, mismatch = hard failure**. Debian quilt tracks patch application against baseline ([Debian UsingQuilt](https://wiki.debian.org/UsingQuilt)). Arch PKGBUILD `sha256sums` array hard-fails makepkg on mismatch ([ArchWiki PKGBUILD](https://wiki.archlinux.org/title/PKGBUILD)). Homebrew's `sha256` in formula blocks bottle builds on upstream change ([Homebrew docs](https://docs.brew.sh/Formula-Cookbook)). The fork's existing `check-overrides.js` implements this exactly; the gap is making it blocking, not informational. **Translation to features: TS-2 + D-1.**

### 3. Cross-version compat matrices

Primary pattern: **GitHub Actions job matrix, N=3 floor (prior LTS + current LTS + latest current), with `exclude` rules for known-invalid combinations** ([dev.to: Testing npm packages against multiple peer dependency versions](https://dev.to/joshx/test-your-npm-package-against-multiple-versions-of-its-peer-dependency-34j4); [GitHub Actions matrix docs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)). N=3 is enough for libraries with clear LTS boundaries; N=5+ for security-sensitive libraries tracking wider compatibility (e.g., PyTorch against multiple Python versions). For THIS fork: upstream cadence is every few weeks, so N=3 covers ~6 weeks; N=5 covers ~10 weeks. **Translation to features: TS-3 (N=3, P1), D-6 (N=5, P3).**

### 4. Ship-readiness for professional-grade npm packages (what's the gate set?)

Primary sources of truth:
- **OpenSSF Open Source Project Security Baseline** (Feb 2025) — ~40-50 controls, maturity-tiered, hosting-agnostic ([baseline.openssf.org](https://baseline.openssf.org/versions/2025-02-25))
- **OpenSSF Best Practices Badge — Passing level** — 67 criteria across Basics/Change Control/Quality/Security/Analysis ([bestpractices.dev](https://www.bestpractices.dev/en/criteria))
- **OpenSSF Scorecard** — 18 automated checks, score 0-10 ([scorecard.dev](https://scorecard.dev/))
- **SLSA Framework** — Levels 1-4, Level 2 = hosted builder + signed provenance ([slsa.dev](https://slsa.dev/spec/v1.0/))
- **npm provenance / --provenance flag** ([npm Docs](https://docs.npmjs.com/generating-provenance-statements/); [GitHub Blog](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/))
- **Keep a Changelog** + **SemVer** — format + versioning ([keepachangelog.com](https://keepachangelog.com/); [semver.org](https://semver.org/))

For a private-scope npm CLI tool maintained by one person: the OSPS Baseline + Scorecard + SLSA L2 are the realistic targets. Best Practices passing-level criteria is a good self-audit checklist; silver/gold explicitly not applicable due to single-maintainer bus factor (AF-2). **Translation to features: TS-4, TS-5, TS-7, TS-8, TS-11, D-4, D-5.**

### 5. Oversight/advisory patterns (evolution from advisory to blocking)

Primary pattern: **soft checks as PR annotations, with explicit graduation criteria**. GitHub branch protection separates "required" from "optional" status checks ([GitHub Docs: about-protected-branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). `reviewdog` ([reviewdog/reviewdog](https://github.com/reviewdog/reviewdog)) and `wearerequired/lint-action` ([GitHub Marketplace](https://github.com/marketplace/actions/lint-action)) support both modes via config flags. Industry convention: advisory → measure hit rate over N PRs → if false-positive rate is low, graduate to blocking. Conversely, `continue-on-error: true` in GitHub Actions is the specific mechanism for informational-only jobs ([actionlint checks](https://github.com/rhysd/actionlint/blob/main/docs/checks.md)); the fork already uses this for boundary + compat jobs. **Translation to features: D-3 graduation path, retain AF-7 stance (keep informational as informational unless proven gate-worthy).**

## Sources

**Primary standards and specifications:**
- [OpenSSF Best Practices Badge / FLOSS Best Practices Criteria](https://www.bestpractices.dev/en/criteria)
- [OpenSSF Open Source Project Security Baseline (2025-02-25)](https://baseline.openssf.org/versions/2025-02-25)
- [OpenSSF Scorecard](https://openssf.org/projects/scorecard/) and [scorecard.dev](https://scorecard.dev/)
- [SLSA Framework v1.0 Specification](https://slsa.dev/spec/v1.0/)
- [SLSA Security Levels](https://slsa.dev/spec/v0.1/levels)
- [npm Docs: Generating Provenance Statements](https://docs.npmjs.com/generating-provenance-statements/)
- [GitHub Blog: Introducing npm Package Provenance](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/)
- [Keep a Changelog](https://keepachangelog.com/)
- [SemVer](https://semver.org/)
- [Node.js Release Working Group](https://github.com/nodejs/Release)

**Fork and downstream maintenance (evidence of real-world patterns):**
- [Igalia: Maintaining Chromium Downstream — Update Strategies](https://blogs.igalia.com/dape/2024/09/13/maintaining-chromium-downstream-update-strategies/)
- [Igalia: Maintaining Chromium Downstream — Keeping It Small](https://blogs.igalia.com/dape/2025/02/04/maintaining-chromium-downstream-keeping-it-small/)
- [OpenShift Kubernetes fork README](https://github.com/brandisher/openshift_kubernetes/blob/master/README.openshift.md)
- [Debian UsingQuilt wiki](https://wiki.debian.org/UsingQuilt)
- [Arch Linux PKGBUILD wiki](https://wiki.archlinux.org/title/PKGBUILD)
- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)

**CI and governance patterns:**
- [GitHub Docs: About Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: Using a Matrix for Your Jobs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [test-all-versions on npm](https://www.npmjs.com/package/test-all-versions)
- [dev.to: Testing npm packages against multiple peer dependency versions](https://dev.to/joshx/test-your-npm-package-against-multiple-versions-of-its-peer-dependency-34j4)
- [reviewdog](https://github.com/reviewdog/reviewdog)
- [wearerequired/lint-action](https://github.com/marketplace/actions/lint-action)
- [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci/)
- [Hyperledger MAINTAINERS Guideline](https://toc.hyperledger.org/guidelines/MAINTAINERS-guidelines.html)
- [OpenWallet Foundation MAINTAINERS.md Guide](https://tac.openwallet.foundation/governance/maintainers-file-content/)
- [CNCF Project Lifecycle and Process](https://contribute.cncf.io/projects/lifecycle/)

**Current threat landscape (underpinning TS-5):**
- [SOCRadar: Axios npm Hijack 2026 (2026-04-01)](https://socradar.io/blog/axios-npm-supply-chain-attack-2026-ciso-guide/)
- [DEV.to: Audit of top 50 npm packages — almost none ship with supply-chain attestations](https://dev.to/thecryptodonkey/i-audited-the-top-50-npm-packages-almost-none-ship-with-supply-chain-attestations-3ki8)

---
*Feature research for: v1.2.0 Ship-Ready Hardening milestone — overlay fork resilience + professional-grade npm package gates*
*Researched: 2026-04-20*
