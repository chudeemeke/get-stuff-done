# Stack Research: v1.2.0 Ship-Ready Hardening

**Domain:** npm-published overlay fork — hardening additions only (not a greenfield stack)
**Researched:** 2026-04-20
**Confidence:** HIGH (versions verified against npm registry 2026-04-20; rationale grounded in overlay-specific constraints)

## Scope Note

This is NOT a greenfield stack document. The project already ships with a frozen core stack: `bun` (package manager + test runner), Node 22+, `esbuild` 0.24.x (hook bundling), `ajv` 8.17.x (config schema), `eslint` 9.x + `eslint-plugin-security` 3.x, `pathe` 2.x, `json5` 2.x, `get-shit-done-cc@1.34.2` (upstream devDependency), GitHub Actions (cross-platform matrix: macOS/Linux/Windows), `sharp` + `svgexport` (logo assets only). That stack is NOT revisited here.

This document recommends ONLY the additive tooling for the five v1.2.0 hardening goals. Each recommendation must justify its inclusion against the overlay/fork context specifically — not just "popular in the ecosystem."

## Triage Summary

| Tier | Tool | Dimension | Single-sentence rationale |
|------|------|-----------|---------------------------|
| MUST | `audit-ci@7.1.0` | Security | Blocking CI gate with severity threshold + allowlist; `npm audit` alone can't fail a job deterministically |
| MUST | `publint@0.3.18` | Ship-readiness | Validates the tarball the way npm actually publishes it — critical for an overlay whose `files:` list is hand-curated |
| MUST | `gitleaks` (GH Action `gitleaks/gitleaks-action@v2`) | Security | Pre-commit-safe secrets scanner; overlay stores branding JSON, REASON.md, compose artifacts — high paper-cut risk of leaked tokens |
| MUST | `lychee-action@v2` | Docs | Link rot in MAINTENANCE.md / upgrade guide / README is the #1 failure mode for fork users; Rust-fast so it fits in CI budget |
| MUST | `verdaccio@6.5.2` (as GHA service container) | Upgrade resilience | The only way to simulate real npm publish→install in CI without polluting the public registry |
| MUST | `@cyclonedx/cyclonedx-npm@4.2.1` | Security | SBOM generation for supply-chain transparency; required when consuming upstream as a pinned devDependency |
| STRONG | `osv-scanner` (binary, action `google/osv-scanner-action@v2`) | Security | Catches GHSA/OSV records that `npm audit` misses; particularly strong on transitive deps pulled in via upstream |
| STRONG | `step-security/harden-runner@v2` | Security (CI) | Runtime egress monitoring for GitHub Actions; detects the exact Spring-2026 attack class (Axios/tj-actions) |
| STRONG | `zizmor@latest` (rust binary, action `zizmorcore/zizmor-action@v0`) | Security (CI) | Static-analyzes workflows themselves for pinning/injection issues; overlay publishes via `prepublishOnly` so workflow compromise = package compromise |
| STRONG | `hyperfine` (system binary, action `sharkdp/hyperfine@v1`) | Performance | The compose pipeline is subprocess-heavy and platform-sensitive; hyperfine's JSON export gives actionable numbers instead of anecdotes |
| STRONG | `markdownlint-cli2@0.22.0` | Docs | Gates `MAINTENANCE.md` and upgrade guide on consistent structure; catches drift between sibling docs |
| STRONG | `semver@7.7.4` (already transitively in tree) | Upgrade resilience | Historical-version matrix needs programmatic version-range logic; reuse what's already installed rather than ad-hoc string parsing |
| NICE | `knip@6.4.1` | Ship-readiness | Dead-code detection across overlay + scripts; useful but risks false-positives around overlay's dynamic `require` in sync.cjs |
| NICE | `doctoc@2.4.1` | Docs | Auto-TOC for long markdown files — only valuable if MAINTENANCE.md / upgrade guide exceed ~400 lines |
| NICE | `tinybench@6.0.0` | Performance | In-process microbenchmarks for compose pipeline stages; overlaps with hyperfine for most cases |
| REJECT | `snyk` | Security | Commercial-tier value not justified for a private single-maintainer fork; `osv-scanner` + `audit-ci` cover the same ground |
| REJECT | `semgrep` Pro rules | Security | Paid; OSS rules overlap significantly with `eslint-plugin-security` already in stack |
| REJECT | `better-npm-audit` | Security | Superseded by `audit-ci`; strictly narrower feature set (no PNPM/Bun support, no JSONC allowlist) |
| REJECT | `depcheck` | Ship-readiness | Superseded by `knip`; depcheck lags on modern bundler formats and has no fork-aware config |
| REJECT | `markdown-link-check` | Docs | Node-based, slower, less maintained than `lychee`; no reason to pick it over lychee |
| REJECT | `benchmark.js` | Performance | Unmaintained (last release 2019-era); `mitata` and `tinybench` are modern alternatives |
| REJECT | `trufflehog` (as primary) | Security | Powerful but heavy; per the 2026 consensus (`gitleaks` for CI-blocking, trufflehog for scheduled full-history). Defer to v1.3.0 unless a specific incident triggers it |
| REJECT | `@cyclonedx/cdxgen@12.2.0` | Security | Polyglot mega-scanner; this project is JS-only, so the targeted `cyclonedx-npm` is the right fit |
| REJECT | `arethetypeswrong/cli` | Ship-readiness | Project ships zero TypeScript types; tool would always pass trivially |

## Recommended Additions by Dimension

### 1. Upgrade Resilience Testing

| Tool | Version | Purpose | Why THIS tool for THIS context |
|------|---------|---------|--------------------------------|
| `verdaccio` | 6.5.2 | Local npm registry as a GHA service container | The overlay's worst-case failure is "compose succeeds, publish succeeds, but installed tarball is broken." The only honest simulation is: bump `get-shit-done-cc` devDep → `bun run dist` → `npm pack` → `npm publish --registry http://localhost:4873` → fresh `npm install @chude/get-stuff-done` from that registry → run `get-stuff-done` installer end-to-end. Verdaccio boots in <3s in a service container, which fits inside the existing matrix job budget. |
| `publint` | 0.3.18 | Validates tarball `files:` manifest, entry points, `bin` shims | The overlay's `files:` array in package.json is hand-curated (`dist`, `bin`, two JSONs in `overlay/`). Publint simulates how npm, yarn, pnpm, and bun would each interpret the package — catches exports-field breakage and missing files that only surface on consumer install. Uses npm-pack-list internally, which matches npm's real publish filter. |
| `semver` | 7.7.4 | Programmatic version-range logic for historical matrix | Matrix strategy needs to resolve "last N vetted upstream versions" from a pinned list. `semver` is already transitively present via ajv/others, no new dep weight. Used for `semver.sort()` + `semver.satisfies()` in a new `scripts/matrix-versions.cjs`. |
| `npm pack` | built-in | Part of the simulation pipeline | `npm pack --dry-run=false` produces the exact tarball npm publish would — used as the verdaccio-publish input. Free; already available. |

**Integration points:**
- New CI job `upgrade-resilience` runs on schedule (weekly) + on changes to `overlay/`, `scripts/compose.js`, or `get-shit-done-cc` pin in package.json.
- Job spins up Verdaccio as a service container, runs compose → pack → publish-to-verdaccio → install-in-empty-dir → execute installer on a temp `~/.claude` → assert hooks + statusline present.
- A separate matrix job (`compat-history`) pins an array `["1.34.2", "1.33.x-latest", "1.32.0"]` (last 3 minor versions), runs compose against each, and asserts boundary + override checks still pass.

### 2. Cross-Version Compat Matrix

**Approach (no new tooling; pattern only):** Use GHA `strategy.matrix` with a static array of vetted upstream versions. The matrix file lives at `.github/upstream-compat.json` so it's editable without touching workflow YAML. A new job reads the array, sets `get-shit-done-cc` via `bun pm pkg set devDependencies.get-shit-done-cc=<version>` in each matrix cell, runs compose + test, and uploads the `.install-meta.json` as an artifact. This reuses the existing matrix infrastructure and doesn't introduce new tools.

Anti-pattern explicitly rejected: testing against *all* historical versions. The goal is "vetted last N" (~3). Attempting N=10+ burns CI minutes and produces noise for versions users won't ever install.

### 3. Security Audit Tooling

| Tool | Version | Purpose | Why THIS tool for THIS context |
|------|---------|---------|--------------------------------|
| `audit-ci` | 7.1.0 | CI gate on `bun audit` / `npm audit` with severity threshold | The project already runs `bun`, and audit-ci is one of the few tools that supports Bun's audit output format. Configurable via `audit-ci.jsonc` with per-CVE allowlist (TTL'd expiry), which matches the triage rule spec'd in PROJECT.md ("critical = fix in v1.2.0, major = plan for v1.3.0, minor = backlog"). |
| `osv-scanner` | v2.x (binary) | Scans lockfile against OSV.dev (largest aggregated vuln DB) | Catches advisories not yet in the GitHub Advisory DB that feeds `npm audit`. The overlay consumes upstream as a devDependency, so upstream's transitive tree is effectively the fork's attack surface. OSV-scanner's guided-remediation feature (npm-supported in v2) proposes min-upgrade paths, which matches the upgrade-resilience workflow. |
| `gitleaks` | via action `gitleaks/gitleaks-action@v2` | Pattern-based secrets scanner | Fast (Go) and deterministic — safe as a blocking pre-commit + PR gate. The overlay stores `branding.json`, `REASON.md` files, and generated `.install-meta.json` — human-editable paths that are paper-cut-prone for accidentally committed tokens. Gitleaks' regex approach has false positives but no network calls, which is the right tradeoff for blocking gates. |
| `step-security/harden-runner` | v2 | Runtime egress + process monitoring inside GHA runners | The 2026 Axios and tj-actions compromises both exfiltrated via runtime network calls during CI. Harden-runner's `audit` mode reports unexpected egress; `block` mode kills the job. Free for open-source and up-to-5000 OSS projects; the fork is private-repo but qualifies under StepSecurity's free tier. Pin to `audit` mode first, upgrade to `block` once baselines are established. |
| `zizmor` | v0.x (via `zizmorcore/zizmor-action@v0`) | Static analysis of workflow files themselves | Complements harden-runner: zizmor is compile-time, harden-runner is run-time. The workflow files pin 3rd-party actions (`setup-bun`, `setup-node`, ...) and zizmor flags unpinned-SHA references, injection via `${{ github.event.* }}`, and excessive `GITHUB_TOKEN` permissions. The overlay's `prepublishOnly` runs in CI, so workflow compromise = package compromise. |
| `@cyclonedx/cyclonedx-npm` | 4.2.1 | SBOM generation in CycloneDX 1.6 format | Required for supply-chain transparency — the overlay consumes a large upstream tree and publishes the composed output. An attached SBOM (uploaded as a release artifact + committed to `dist/`) lets consumers verify what shipped. The `-npm` variant is purpose-built for npm lockfiles; `cdxgen` is a polyglot tool and overkill for a JS-only project. |

**What's already in stack** (do not re-install): `eslint-plugin-security@3.0.1`. Semgrep is rejected — its OSS rules for JavaScript overlap ~80% with eslint-plugin-security, and the Pro rules require a paid license.

**Deferred to v1.3.0** (not MUST-have):
- `trufflehog` full-history scheduled scan — weekly cron, complements gitleaks' commit-level gate. Defer unless a gitleaks finding misses something.
- Signed provenance attestations via npm's `--provenance` flag — requires OIDC setup on the npm-publishing side and trusted-publishing config; mechanical work but adds to scope.

### 4. Performance Baselining

| Tool | Version | Purpose | Why THIS tool for THIS context |
|------|---------|---------|--------------------------------|
| `hyperfine` | system binary (`sharkdp/hyperfine@v1` pre-installed on ubuntu-latest runners) | Statistically-rigorous subprocess benchmarking | The compose pipeline is subprocess-heavy: `bun run dist` spawns compose, build, finalize-dist. Hyperfine's warmup runs + mean-median-stddev reporting is far more defensible than bash `time`. JSON export (`--export-json`) feeds budget-enforcement scripts. It's a system binary — no npm dep weight. |
| `tinybench` | 6.0.0 | In-process microbenchmarks for compose-pipeline stages | Hyperfine measures process-level; tinybench measures function-level (resolve/filter/override/brand/merge). Useful if a specific stage regresses. 10KB dependency, Web-APIs-based, zero bloat. Same API that Vitest ships — familiar. Only add if regression root-causing requires it; otherwise hyperfine alone is sufficient. |

**Budget-enforcement approach (no new tool):** Write a `scripts/check-perf-budget.cjs` that reads hyperfine JSON output, compares to a committed baseline at `.planning/perf-baseline.json`, and fails CI if any metric exceeds `baseline * 1.25` (configurable tolerance). Baseline is regenerated manually on main-branch commits that intentionally change perf (documented in the commit message).

**Budgets to track (initial):**
- Full `bun run dist` (compose + build + finalize): <15s on Linux, <30s on Windows
- `bun run compose` alone: <5s on Linux, <12s on Windows
- `bun test` full suite: <90s on Linux, <180s on Windows (Windows flakiness acknowledged in PROJECT.md)
- `npm pack` tarball size: <250 KB (catches accidental inclusion of fixtures/artifacts)

**Rejected:**
- `benchmark.js` — unmaintained, last meaningful release ~2019.
- `mitata` — excellent for microbenchmarks but overlaps with tinybench; pick one.
- Bencher.dev cloud service — overkill for a private fork; JSON-diff-against-baseline solves 90% of the need for $0.

### 5. Documentation Generation & Validation

| Tool | Version | Purpose | Why THIS tool for THIS context |
|------|---------|---------|--------------------------------|
| `lychee-action` | v2 (via `lycheeverse/lychee-action@v2`) | Link checker for all markdown + README URLs | Link rot is the most visible ship-readiness failure (a user reads MAINTENANCE.md, clicks a GitHub URL, hits 404, loses trust). Lychee is Rust-based → fast enough to run on every PR. Supports async streaming, `--cache`, and file-based allowlists for known-flaky external URLs. GHA action is actively maintained and the de-facto choice in 2026. |
| `markdownlint-cli2` | 0.22.0 | Style/structure linting for MAINTENANCE.md, upgrade guide, README | Gates markdown consistency — heading levels, list indentation, trailing whitespace, fenced-code-block language specs. Configuration-file-driven (`.markdownlint-cli2.jsonc`) so rules live in-repo. Chosen over `markdownlint-cli@0.45.x` because cli2 is the author's preferred front-end, faster, and supports glob-based ignore patterns. Essential for a private repo whose docs are surface area for the fork's credibility. |
| `doctoc` | 2.4.1 | Auto-generated table of contents for long markdown | Only needed if MAINTENANCE.md / upgrade guide exceed ~400 lines (the upgrade guide probably will, given "install → bump → recompose → reinstall → verify" walkthrough). Add as a git pre-commit hook that updates TOC in-place. If docs stay shorter, skip this entirely. |

**Example-code validation:** No dedicated tool recommended. The upgrade guide's commands (e.g., `bun run dist`, `npm pack`) are already exercised by the upgrade-resilience CI job — that's the source of truth. Avoid doc-testing tools like `mdx-test` / `remark-validate-links` that add a parallel execution layer.

**Rejected:**
- `markdown-link-check` — Node-based, slower than lychee, maintenance lagging.
- `markdownlint-cli` (v1) — superseded by cli2; same author, better interface.
- `doc8` — targets reStructuredText, wrong tool for a markdown-only repo.

## Installation

```bash
# MUST-have additions (all dev dependencies)
bun add -d publint@0.3.18 audit-ci@7.1.0 @cyclonedx/cyclonedx-npm@4.2.1 markdownlint-cli2@0.22.0

# Binary tools invoked via GHA actions or pre-installed on runners (no npm install needed)
# - lycheeverse/lychee-action@v2         (Rust binary, action downloads)
# - gitleaks/gitleaks-action@v2           (Go binary, action downloads)
# - google/osv-scanner-action@v2          (Go binary, action downloads)
# - step-security/harden-runner@v2        (runtime agent)
# - zizmorcore/zizmor-action@v0           (Rust binary, action downloads)
# - sharkdp/hyperfine@v1 OR apt-get install hyperfine  (pre-installed on ubuntu-latest)
# - verdaccio/verdaccio:6  Docker image as GHA service container (no local install)

# Nice-to-haves (add only when scope pulls them in)
bun add -d knip@6.4.1 doctoc@2.4.1 tinybench@6.0.0

# semver is already available transitively; optional explicit add:
bun add -d semver@7.7.4
```

## Integration with Existing Stack

| Existing | New | Integration point |
|----------|-----|-------------------|
| `bun run dist` | `publint` | Add to `prepublishOnly` chain: `bun run dist && npx publint` |
| `bun test` | `audit-ci` | New `security` GHA job runs `bunx audit-ci --config audit-ci.jsonc` in parallel with existing `fork-tests` |
| GHA matrix (macOS/Linux/Windows) | `verdaccio` | New `upgrade-resilience` job, Linux-only (service containers don't work on macOS/Windows GHA runners) |
| `scripts/compose.js` | `@cyclonedx/cyclonedx-npm` | Add a `scripts/generate-sbom.cjs` that runs *after* compose, writes `dist/bom.json` |
| `scripts/check-overrides.js` | No change | Override staleness is already covered; hardening elevates it from informational to blocking (config-only change) |
| Existing `eslint-plugin-security` | `zizmor` | Orthogonal: eslint covers source code, zizmor covers workflow YAML. Both run in CI. |
| `esbuild` hook bundling | No change | Performance budget scripts measure bundled output size; no tooling conflict. |
| `sharp` / `svgexport` (logo pipeline) | No change | Logo pipeline is one-shot, not part of hardening scope. |

## Explicitly Rejected (Conflicts with Architecture)

| Rejected tool | Why it conflicts |
|---------------|------------------|
| `pnpm` / pnpm-specific tooling | Project uses `bun`; pnpm workflows don't translate. `minimumReleaseAge` is a pnpm feature not in Bun yet — equivalent control achievable via `audit-ci` allowlist TTL. |
| `lerna`, `nx`, `turbo`, any monorepo tooling | Project is a single-package overlay. Monorepo tooling adds topology complexity for zero benefit; the overlay's `get-shit-done-cc` devDep is not a workspace sibling. |
| `changesets` | Overlap with existing manual CHANGELOG + `aidev release` flow; the memory note `merge_conflict_changelog_nearmiss.md` indicates CHANGELOG handling is a hotspot, but the fix is process-hardening (e.g., PR template + reminder), not tool replacement. |
| `commitizen`, `commitlint`, `husky` | User's `git-commits.md` rule disallows the emoji/AI-attribution patterns these tools often enforce. Can be configured strictly enough to comply, but the config-maintenance cost exceeds the benefit for single-maintainer projects. |
| `prettier` | Not rejected per se, but out of scope for *hardening*. If added, must be configured to leave the branding/artwork JSON files alone. |
| `husky` + `lint-staged` | Blocks local commits; for a single-maintainer workflow with a fast CI pipeline, CI-only enforcement is friction-free. |
| `renovate` / `dependabot` for the `get-shit-done-cc` pin | Explicitly wrong: the upstream bump is a deliberate preview-update workflow with supply-chain scan, NOT an automated bot upgrade. Dependabot may still be appropriate for dev-only deps (eslint, esbuild). |
| `tsup` / `microbundle` / any TypeScript-centric bundler | Project has no TS; esbuild for hook bundling is sufficient. |
| `arethetypeswrong/cli` | Ships zero `.d.ts`; tool is a no-op. |
| `vitest` | Already on `bun:test`; switching costs > benefits. |
| `playwright` / `cypress` | No browser surface; the "end-to-end" in upgrade resilience is CLI→CLI, covered by plain `node` invocation in the test job. |

## Version Compatibility Notes

| Package | Compatible with | Notes |
|---------|-----------------|-------|
| `audit-ci@7.x` | `bun@1.3+`, Node 18+ | Needs Bun audit output parsing. Confirmed in changelog. |
| `publint@0.3.x` | Node 20+ (project already pins Node 20+) | No known conflicts with pathe/ajv/json5. |
| `@cyclonedx/cyclonedx-npm@4.x` | CycloneDX spec 1.6; npm lockfile v2/v3 | Bun generates a compatible `package-lock.json` only when explicitly requested; verify the project's lockfile format works or provide `--package-lock-only`. |
| `markdownlint-cli2@0.22` | markdownlint@0.38+ transitively | No interaction with project. |
| `verdaccio@6.x` | Node 18+, Docker | Use the official `verdaccio/verdaccio:6` image; pin the minor version in the workflow. |
| `lychee-action@v2` | Rust binary, runs on GHA runners directly | No interaction with project. |
| `step-security/harden-runner@v2` | Linux, macOS, Windows (2026 expansion) | Matches project's cross-platform matrix. |
| `zizmor-action@v0` | Any GHA runner | v0 indicates pre-1.0 API — pin to exact minor version to avoid surprise. |
| `osv-scanner-action@v2` | Any GHA runner | `v2` stable since 2025. |

## Risk Flags

1. **Verdaccio in GHA is Linux-only**: The upgrade-resilience job can only run on `ubuntu-latest`. The fork's cross-platform matrix catches install-side platform issues; Verdaccio covers the publish-side only. This asymmetry is acceptable but should be documented in MAINTENANCE.md.

2. **Bun `audit` format is evolving**: `audit-ci` Bun support is newer than its npm support. If Bun's audit JSON changes in a minor release, audit-ci may break. Mitigation: pin `audit-ci@7.1.0` exactly; smoke-test on `bun` major upgrades.

3. **Harden-runner `block` mode carries false-positive risk**: The fork's tests spawn subprocesses; unexpected egress from a test helper would fail the job. Start in `audit` mode for ≥2 weeks, then tighten.

4. **Zizmor v0 is pre-stable**: API and default rules may change. Pin exact version; re-evaluate on each upgrade.

5. **CycloneDX SBOM committed to `dist/`**: The SBOM must be generated after `bun run compose` but before `bun run finalize-dist`, OR `finalize-dist` must be updated to include it. Ordering error = missing SBOM in published tarball. Verifiable via publint's files check.

6. **Hyperfine not available on all runners**: `ubuntu-latest` has it pre-installed; macOS runners have it via Homebrew; Windows runners do NOT have it in PATH by default. Windows performance tests need explicit `choco install hyperfine` or skip.

## Sources

- [npm registry lookup 2026-04-20](https://registry.npmjs.org/) — verified versions: publint@0.3.18, audit-ci@7.1.0, @cyclonedx/cyclonedx-npm@4.2.1, markdownlint-cli2@0.22.0, knip@6.4.1, doctoc@2.4.1, verdaccio@6.5.2, tinybench@6.0.0, eslint-plugin-security@4.0.0, semver@7.7.4 — HIGH confidence
- [@cyclonedx/cdxgen on npm](https://www.npmjs.com/package/@cyclonedx/cdxgen) — confirmed 12.2.0 is polyglot; cyclonedx-npm is correct JS-specific choice — HIGH
- [Gitleaks vs TruffleHog 2026 comparison](https://appsecsanta.com/sast-tools/gitleaks-vs-trufflehog) — confirms gitleaks-for-blocking / trufflehog-for-scheduled pattern — MEDIUM (blog-tier, but consistent with multiple sources)
- [Axios npm supply chain attack March 2026 — Snyk writeup](https://snyk.io/blog/axios-npm-package-compromised-supply-chain-attack-delivers-cross-platform/) — real-world validation for harden-runner inclusion — HIGH
- [StepSecurity Harden-Runner repo](https://github.com/step-security/harden-runner) — 5000+ OSS project adoption, Windows/macOS support confirmed — HIGH
- [zizmor official docs](https://docs.zizmor.sh/) — static analysis for GHA workflows — HIGH
- [OSV-Scanner v2 docs](https://google.github.io/osv-scanner/) — guided-remediation feature for npm — HIGH
- [Publint rules](https://publint.dev/rules) — confirms uses npm-pack-list internally (matches real publish) — HIGH
- [Verdaccio repo](https://github.com/verdaccio/verdaccio) — confirms service-container pattern in GHA — HIGH
- [audit-ci repo](https://github.com/IBM/audit-ci) — confirms Bun support and JSONC allowlist format — HIGH
- [lychee-action releases](https://github.com/lycheeverse/lychee-action/releases) — confirms v2 stable — HIGH
- [Knip vs depcheck comparison 2026](https://www.pkgpulse.com/blog/knip-vs-depcheck-2026) — MEDIUM (blog-tier) confirms knip is the 2026 default
- [Tinybench repo](https://github.com/tinylibs/tinybench) — confirms Vitest-shared, 10KB — HIGH
- [Hyperfine project](https://github.com/sharkdp/hyperfine) — confirms pre-install on GHA Ubuntu runners — HIGH
- [Lessons from the Spring 2026 OSS Incidents](https://dev.to/trknhr/lessons-from-the-spring-2026-oss-incidents-hardening-npm-pnpm-and-github-actions-against-1jnp) — MEDIUM confidence source for overall hardening thesis
- Project files at `.planning/PROJECT.md` and `package.json` — HIGH — existing stack verified
- Memory file `merge_conflict_changelog_nearmiss.md` — HIGH — basis for rejecting changesets (not a tool gap, a process gap)

---

*Stack research for: v1.2.0 hardening additions to an existing published overlay fork*
*Researched: 2026-04-20*
*Overall confidence: HIGH — versions verified on npm registry same day; rationales grounded in overlay-specific constraints rather than generic ecosystem popularity.*
