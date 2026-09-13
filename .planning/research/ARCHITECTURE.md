# Architecture Research: v1.2.0 Ship-Ready Hardening

**Domain:** Overlay fork of an OSS CLI tool (npm-distributed composition pipeline + delegation installer)
**Researched:** 2026-04-19
**Focus:** Integrating six hardening mechanisms into the existing overlay architecture without breaking its layered design
**Confidence:** HIGH

---

## Executive Summary

The v1.2.0 milestone adds six hardening mechanisms to an architecture whose defining invariant is **skin over OS** -- upstream is consumed as an npm dependency, never modified, and the fork expresses itself only through:

1. **`overlay/`** -- additive files composed on top of upstream
2. **`overrides/`** -- SHA-256 pinned replacements with mandatory `REASON.md`
3. **`scripts/compose.js`** -- the 5-stage pipeline that produces `dist/` (resolve -> filter -> override -> brand -> merge)
4. **`bin/install.js`** -- a delegation installer that spawns upstream's installer and layers overlay files after

Every hardening mechanism proposed below preserves this invariant. New scripts go in `scripts/` (alongside the existing 8), orchestration reuses `compose.js` where possible, new CI jobs extend `.github/workflows/ci.yml` without breaking the existing 5-job matrix, and oversight enhancements land as structured check-lists inside the existing `overlay/agents/gsd-oversight-*.md` files.

**Non-negotiable:** no new top-level directory proliferation. `scripts/`, `tests/`, `overlay/`, `overrides/`, `.github/workflows/`, and `bin/` are the surface. Everything else is a structural defect.

---

## Current State (for integration grounding)

### Existing layered surfaces

```
+---------------------------------------------------------------+
|  CONSUMER SURFACE (npm install @chude/get-stuff-done)         |
|  - bin/install.js       <- delegation installer               |
|  - bin/gsd.js           <- fork launcher                      |
|  - dist/                <- composed output (published only)   |
+---------------------------------------------------------------+
|  COMPOSITION LAYER (scripts/compose.js orchestrates)          |
|                                                               |
|   resolve() -> filter() -> override() -> brand() -> merge()   |
|       ^          ^            ^            ^          ^       |
|       |          |            |            |          |       |
|   overlay/   features.json  overrides/ branding.json  dist/   |
+---------------------------------------------------------------+
|  SOURCE LAYER (git repo)                                      |
|  - overlay/    additive fork content (~2,510 lines)           |
|  - overrides/  upstream replacements (with REASON.md + SHA)   |
|  - scripts/    pipeline + health checks                       |
|  - tests/      fork + upstream-compat test files              |
|  - node_modules/get-shit-done-cc/   upstream as devDependency |
+---------------------------------------------------------------+
|  VERIFICATION LAYER (.github/workflows/ci.yml -- 5 jobs)      |
|  - lint             (blocking, Ubuntu)                        |
|  - test             (blocking, 3-OS matrix)                   |
|  - parity           (blocking, Ubuntu)                        |
|  - upstream-compat  (informational, 3-OS matrix)              |
|  - boundary+override (informational, Ubuntu)                  |
+---------------------------------------------------------------+
```

### Existing `scripts/` inventory (baseline for new additions)

| Script | Role | Exit code semantics |
|--------|------|---------------------|
| `compose.js` | 5-stage pipeline (canonical entry point) | 0 ok / 1 error |
| `build.js` | esbuild bundling of hooks/tools | 0 ok / 1 error |
| `finalize-dist.js` | Post-compose tidying | 0 ok / 1 error |
| `preview-update.js` | Read-only upstream bump preview | 0 ok / 1 npm failure |
| `check-boundary.js` | Informational: structural boundary | 0 clean / 1 violations |
| `check-overrides.js` | Informational today, needs blocking mode | 0 clean / 1 stale |
| `check-parity.js` | Source-to-installed parity | 0 ok / 1 drift |
| `run-upstream-compat.js` | Upstream tests vs composed `dist/` | 0 pass / 1 fail |

Every new script must follow this shape: exports a pure function for programmatic callers, a CLI entry under `if (require.main === module)`, documented exit codes, and a `scripts/*.test.js` peer. No exceptions.

---

## Integration Proposals -- Six Hardening Mechanisms

### 1. Automated Upgrade Test

**Question:** `scripts/` vs `tests/upgrade/` vs `bin/verify-upgrade.cjs`? Canonical entry? Composition with `compose.js` + `preview-update.js`?

**Recommendation:** New script **`scripts/verify-upgrade.js`**, invoked as `bun run verify-upgrade`, with a new `tests/upgrade/` fixture directory for temp workspaces.

**Why not the alternatives:**
- `bin/verify-upgrade.cjs` is wrong -- `bin/` is reserved for end-user entry points (installer, launcher). Upgrade verification is a maintainer/CI tool.
- `tests/upgrade/` alone is wrong -- the *test harness* is a script (imperative orchestrator), the *fixtures* are tests. Separate concerns.
- A standalone module duplicates the script/CLI convention already established 8 times over.

**Canonical flow:**

```
bun run verify-upgrade --from 1.34.2 --to <latest>
           |
           v
scripts/verify-upgrade.js
   1. snapshot current dist/              (reuse compose.js programmatically)
   2. npm install get-shit-done-cc@<to>   (scoped to temp workspace)
   3. run compose() against new upstream
   4. diff overlay manifest vs upstream inventory (reuse resolve()/override())
   5. run check-overrides.js programmatically
   6. run check-boundary.js programmatically
   7. run install to temp dir, assert manifest integrity
   8. emit structured JSON report + human-readable summary
```

**New vs modified:**
- **NEW:** `scripts/verify-upgrade.js` (~300 lines, orchestrator)
- **NEW:** `tests/upgrade/verify-upgrade.test.js` (unit tests for the orchestrator)
- **NEW:** `tests/upgrade/fixtures/` (synthetic minimal upstream snapshots for fast unit tests)
- **MODIFIED:** `package.json` scripts -> add `"verify-upgrade": "node scripts/verify-upgrade.js"`
- **MODIFIED:** `compose.js` exports -- expose `compose({ upstreamDir, overlayDir, distDir })` cleanly as a programmatic entry (likely already exported; confirm in build order step 1)
- **MODIFIED:** `preview-update.js` -- expose `getVersionDelta()` for reuse (already exported per lines 40-48)

**Composition with existing tools:**
- `preview-update.js` answers "what WOULD change?" (read-only, consumer-facing).
- `verify-upgrade.js` answers "does the change actually work end-to-end?" (destructive to temp dirs, maintainer-facing).
- Both call `compose()` and `checkOverrides()` -- no duplication.

**Data flow:**

```
package.json.devDependencies["get-shit-done-cc"]
     |
     v
[verify-upgrade.js]
     |
     |-- reads current version via preview-update.js::readPinnedVersion()
     |-- spawns: npm install get-shit-done-cc@<target> --prefix=<tempdir>
     |-- calls: compose({ upstreamDir: <tempdir>/node_modules/get-shit-done-cc })
     |-- calls: checkOverrides({ upstreamDir: <tempdir>/node_modules/get-shit-done-cc })
     |-- spawns: node bin/install.js --config-dir=<tempdir>/.claude (dist from above)
     |-- reads: <tempdir>/.claude/gsd-file-manifest.json
     |-- asserts: overlay files present, upstream files present, no duplicates
     v
JSON report { from, to, composeOk, overridesOk, boundaryOk, installOk, warnings[] }
```

---

### 2. Cross-Version Compat Matrix

**Question:** Where to stage multiple upstream versions? GitHub Actions matrix vs npm-pack tarballs vs git submodules?

**Recommendation:** **GitHub Actions matrix** with `npm install` to a temp `--prefix`, **not** submodules, **not** persistent tarballs.

**Why this decision:**

| Option | Pollution risk | Maintenance cost | Speed | Verdict |
|--------|----------------|------------------|-------|---------|
| GHA matrix + `npm install --prefix=$TMP` | Zero (scoped to temp) | Zero (versions in workflow yaml) | Fast (cached bun store) | Choose |
| Local `npm pack` tarballs in repo | Bloats repo; each vetted version ~500KB-2MB | Manual updates | Faster CI | Reject |
| Git submodules pinned to upstream tags | Low | High (submodule sync, auth) | Slow (clone per matrix cell) | Reject |

Submodules fight the architectural principle: upstream is a **dependency**, not a source. The entire fork design rests on that boundary. Submodules would re-couple us to upstream history.

**Vetted version list:** commit a small JSON file `.planning/vetted-upstream-versions.json` enumerating known-good versions. CI reads this file and expands the matrix dynamically. When a new upstream version is approved (after running `verify-upgrade`), add it to the list in the same PR that bumps `package.json`.

**Interaction with existing informational CI:**
- Today: `upstream-compat` job tests only against the pinned version.
- After v1.2.0: add `compat-matrix` job that runs `verify-upgrade.js` across N vetted versions -- informational on historical versions, blocking on current pinned.
- `boundary` remains informational (structural).
- `override-staleness` goes blocking (see item 3).

**New vs modified:**
- **NEW:** `.planning/vetted-upstream-versions.json` (JSON array; source of truth)
- **NEW:** CI job `compat-matrix` in `.github/workflows/ci.yml`, dynamic matrix from the JSON file via a setup step
- **MODIFIED:** `verify-upgrade.js` -- accept `--target <version>` to support per-matrix-cell execution
- **MODIFIED:** `scripts/check-overrides.js` -- accept `--upstream-dir <path>` (already supported per lines 309-321)

**Data flow:**

```
CI trigger (push or PR)
     |
     v
setup job: read vetted-upstream-versions.json -> output matrix JSON
     |
     v
compat-matrix job (matrix: os x version, continue-on-error: true except for pinned)
     |
     v
for each (os, version):
   1. npm install get-shit-done-cc@<version> --prefix=$RUNNER_TEMP/upstream
   2. node scripts/verify-upgrade.js --from <pinned> --to <version> \
        --upstream-dir $RUNNER_TEMP/upstream/node_modules/get-shit-done-cc
   3. upload artifact: verify-upgrade-report-<os>-<version>.json
```

---

### 3. Override Staleness as Blocking CI

**Question:** `--strict` flag vs new CI job vs refactor to advisory+strict modes?

**Recommendation:** **Option (c) with caveats** -- keep the script single-mode (exits 1 on any stale/missing-reason), and promote the existing informational CI job to blocking. The script today (`scripts/check-overrides.js:327-332`) already exits 1 on staleness. The "informational" behavior is purely a `continue-on-error: true` flag in CI (ci.yml:89).

**Why this is the cleanest change:**
- The script already has the right exit semantics -- no code change needed for the core mechanism.
- Adding `--strict` would imply a `--advisory` mode, doubling the API surface for no reason.
- Splitting boundary and override checks into separate jobs is architecturally cleaner -- they have different semantics (boundary = structural debt tolerated indefinitely; overrides = transient state requiring review).

**Concrete change:** Split the existing `boundary-override-check` job into two jobs. Boundary stays informational (tech debt tolerated per PROJECT.md current state: 48 violations). Override staleness becomes blocking.

**Precedent:** This is the same pattern ESLint uses -- `--fix` doesn't split the binary, it's a flag; but warnings-vs-errors is controlled at the config/caller level. Our "informational" is a CI-level policy, not a script-level policy. Keep the policy where it belongs.

**New vs modified:**
- **MODIFIED:** `.github/workflows/ci.yml` -- split `boundary-override-check` into:
  - `boundary-check` (Ubuntu, `continue-on-error: true`)
  - `override-check` (Ubuntu, no `continue-on-error`, i.e., blocking)
- **MODIFIED:** `scripts/check-overrides.js` -- no code change; add a comment documenting "exit 1 is now blocking in CI as of v1.2.0"
- **NEW:** Small migration note in `MAINTENANCE.md` (from the v1.2.0 docs requirement) explaining that stale overrides now block PRs.

**Risk mitigation:** Before flipping the gate, run `check-overrides.js` locally against `main`. If it passes today, the flip is safe. If it fails, fix first then flip -- never flip with known violations, or you create a permanent red build until someone fixes them.

---

### 4. Oversight Agent Enhancements (PROCESS-01 through PROCESS-04)

**Question:** How do we make oversight watches structured enough to be verifiable without turning them into rigid rules? OPA/Semgrep-style policies?

**Recommendation:** **Hybrid -- structured watch-items with deterministic probes, prose reasoning kept.** Do NOT port to OPA/Semgrep; those are overkill and introduce dependencies. Instead, formalize the *watch-items* inside each `overlay/agents/gsd-oversight-*.md` as a YAML-fronted table of "watch IDs" with machine-verifiable probes.

**Why not OPA/Semgrep:**
- OPA is for policy-as-code evaluated at runtime against data; our checks are episodic (triggered by plan events), not request-time.
- Semgrep pattern-matches source code; most of PROCESS-01..04 are about *workflow state* (did a verification step happen?), not source patterns.
- Both add dependencies (Rego DSL or Semgrep binary) to a repo that prides itself on minimal surface (4 prod deps per `package.json`).

**Recommended structure inside each agent MD file:**

```markdown
## Structured Watches (machine-verifiable)

| Watch ID   | Trigger                              | Probe (deterministic)                                             | Severity | Prose basis |
|------------|--------------------------------------|-------------------------------------------------------------------|----------|-------------|
| EXEC-01    | SUMMARY.md produced post-merge       | grep for unverified claims; check git log post-merge-commit exists| WARNING  | see 4.1     |
| EXEC-02    | CI green claimed                     | gh pr checks <pr> shows all required checks SUCCESS               | WARNING  | see 4.2     |
| VERIFY-03  | Coverage gate raised in CI yml diff  | git diff HEAD~1 -- ci.yml shows threshold increase                | WARNING  | see 4.3     |
| PLAN-04    | Test file references metric          | grep metric-target-compatibility.md referenced in plan            | INFO     | see 4.4     |

## Prose Basis

### 4.1 EXEC-01 -- Post-merge state verification
[existing prose remains, now linked from the table]
```

**Why this works:**
- The table gives a deterministic test for whether the agent fired when it should have (retrospective verification: replay the git/gh state at flag time, run the probe, confirm it's true).
- The prose stays -- the agent still reasons. Probes are *necessary conditions for flagging*, not sufficient conditions. A probe being true doesn't force a flag; it just makes "should have flagged but didn't" falsifiable.
- Watch IDs map 1:1 to PROCESS-01..04 requirements for traceability in `REQUIREMENTS.md`.
- Probes are shell-invocable (`grep`, `gh`, `git diff`, `node scripts/X`). No new runtime.

**Retrospective verification harness:**
New script `scripts/verify-oversight-probes.js` that parses each agent's structured table, reconstructs git/gh state at claimed flag events (stored in `.planning/memory/gsd-oversight-*.md`), and asserts probe truth. Runs in CI once per week, not per PR.

**New vs modified:**
- **MODIFIED:** All 4 `overlay/agents/gsd-oversight-*.md` files -- add the structured watches table and cross-link prose
- **NEW:** `scripts/verify-oversight-probes.js` (~200 lines)
- **NEW:** `tests/verify-oversight-probes.test.js`
- **NEW:** CI job `oversight-verify` (weekly `schedule:` trigger, not per-PR)
- **NO NEW:** agent memory files -- the existing `.planning/memory/gsd-oversight-*.md` pattern is preserved

---

### 5. Performance Baseline Storage + CI Budget

**Question:** Where does the baseline live? CI comparison? Handling legitimate regressions?

**Recommendation:** **Committed JSON file (`perf-baseline.json` at repo root) + `github-action-benchmark` for historical dashboard.** Regressions handled via an `acceptedRegressions` section in the baseline file, with mandatory REASON comment.

**Baseline storage trade-offs:**

| Option | Traceability | Ease of review | CI complexity | Verdict |
|--------|--------------|----------------|---------------|---------|
| Committed JSON | PR diff shows perf changes | HIGH (diff on PR) | LOW | **Choose as primary** |
| CI artifact only | Not reviewable | LOW | MEDIUM | Reject -- review is critical |
| External service | Historical dashboards | LOW (off-site) | HIGH | Secondary (dashboard only) |
| gh-pages branch (action-benchmark default) | Dashboards | MEDIUM | LOW | Secondary -- complements committed JSON |

The committed file is the **contract**. The dashboard is the **history**. You review the contract on every PR; you consult the dashboard when investigating trends.

**Schema for `perf-baseline.json`:**

```json
{
  "version": 1,
  "measuredAt": "2026-04-19",
  "measuredCommit": "abc123",
  "environment": { "os": "ubuntu-latest", "bun": "1.x.y", "node": "20.x" },
  "benchmarks": {
    "compose.full": { "p50_ms": 1200, "p95_ms": 1800, "budget_ms": 2500 },
    "install.delegate": { "p50_ms": 3200, "p95_ms": 4500, "budget_ms": 6000 },
    "check-overrides": { "p50_ms": 50, "p95_ms": 120, "budget_ms": 250 }
  },
  "acceptedRegressions": [
    {
      "benchmark": "compose.full",
      "acceptedOn": "2026-04-XX",
      "commit": "<sha>",
      "reason": "Added SHA-256 override staleness check -- +200ms for correctness is acceptable",
      "oldBudget_ms": 2200,
      "newBudget_ms": 2500
    }
  ]
}
```

**Handling legitimate regressions:** Two-key edit. (1) Bump the `budget_ms` in the same PR that causes the regression. (2) Add an entry to `acceptedRegressions`. CI script `scripts/check-perf.js` fails if a benchmark exceeds its budget AND no accepted-regression entry explains it at the current commit. Reviewer sees both in the diff.

**Precedents:**
- **ESLint perf suite** -- committed benchmarks, runs locally, not in CI by default (we will run in CI; our fork is lower-volume).
- **Next.js turbo benchmarks** -- dashboard-only; no budget gates. We are stricter.
- **V8 crossbench** -- external service + thresholds. Overkill for us.
- **github-action-benchmark** -- active, well-maintained, default comparison threshold 200% (we'll tighten to 150% with explicit budgets).

**New vs modified:**
- **NEW:** `perf-baseline.json` (repo root, committed)
- **NEW:** `scripts/bench.js` -- runs the 3 benchmarks, emits JSON to stdout
- **NEW:** `scripts/check-perf.js` -- compares `bench.js` output against `perf-baseline.json`, exits 1 on budget breach without accepted-regression entry
- **NEW:** CI job `perf-budget` (Ubuntu only; cross-OS perf baselines are a rabbit hole not worth it for v1.2.0)
- **OPTIONAL NEW:** `benchmark-action/github-action-benchmark@v1` step publishing to gh-pages for dashboards

---

### 6. Security Audit Integration

**Question:** How do npm audit / secrets / OWASP lint outputs flow into architecture? New `audits/` directory? Integrate into existing jobs? Triage flow?

**Recommendation:** **No new `audits/` directory at repo root.** Findings live in `.planning/audits/<date>-<tool>.json` (ephemeral evidence) and issues live in GitHub Issues with `security/critical|major|minor` labels. CI runs the tools; triage happens off-CI in structured issues.

**Why not a committed `audits/` directory:**
- Security findings are time-stamped snapshots, not durable source. Committing them pollutes the repo with noise on every scan.
- GitHub's native `security` tab + Issues are the correct home.
- `.planning/audits/` is gitignored-candidate or scoped to `.planning/` which is already outside the published `files` in `package.json`.

**Tool mapping to existing CI structure:**

| Tool | Integrates into | Blocking? | Artifact |
|------|-----------------|-----------|----------|
| `npm audit` (via `bun audit` when available, else `npm audit --json`) | `lint` job (add step) | Yes on HIGH/CRITICAL | `.planning/audits/<date>-npm-audit.json` |
| `gitleaks` or `trufflehog` secret scan | New job `secret-scan` | Yes on any finding | inline annotations |
| `eslint-plugin-security` (already in devDeps per package.json:52) | Existing `lint` job | Yes (already is) | inline |
| OWASP ZAP / dep-check | Out of scope -- we are not a web app | N/A | N/A |
| Manual override-code-review | Documented workflow in MAINTENANCE.md | Human gate | PR template checkbox |

Note `eslint-plugin-security@^3.0.1` is already in devDependencies; confirm its rules are enabled in `.eslintrc` during Phase 1 of v1.2.0. If not, enabling is a 5-line change.

**Triage flow (CI finding -> v1.2.0 backlog):**

```
CI job (npm-audit or secret-scan)
     |
     | exit 1 on finding
     v
PR blocked until finding triaged
     |
     v
Triage decision (per requirements-phase rule in PROJECT.md:74):
     |-- critical -> open issue "security/critical", add to v1.2.0 REQUIREMENTS.md
     |-- major    -> open issue "security/major", add to v1.3.0 MILESTONES.md target
     |-- minor    -> open issue "security/minor", backlog label
     |
     v
For critical path: add suppression (audit-level=<n>) with EXPIRY date + justification
     |
     v
CI re-runs green; PR unblocks
```

**Suppression file:** `.planning/audits/suppressions.json` -- list of CVEs/findings with `{ id, severity, expires, reason, ticket }`. Tool-specific (npm audit: `--audit-level high` + `overrides` in package.json; gitleaks: `.gitleaksignore`). Suppressions expire; CI warns 14 days before expiry.

**New vs modified:**
- **NEW:** CI job `secret-scan` (gitleaks GitHub Action)
- **MODIFIED:** `lint` CI job -- add `bun audit` or `npm audit --audit-level high` step
- **NEW:** `.planning/audits/suppressions.json` (starts empty)
- **NEW:** `scripts/check-audit-suppressions.js` -- warns on upcoming expirations, runs weekly via `schedule:` trigger
- **NEW:** `MAINTENANCE.md` section "Security Triage" documenting the severity->milestone mapping
- **CONFIRMED:** `eslint-plugin-security` config enables recommended ruleset -- audit during Phase 1, fix if off

---

## Build Order (with dependency rationale)

The six items have dependencies. Build them in this order:

```
Phase 1 (foundation -- no dependencies)
  A. Item 3: Override staleness blocking flip        (1 line CI change)
  B. Item 6: Security audit CI integration           (new jobs, existing tools)
  C. Item 5 (part 1): perf-baseline.json + bench.js  (no CI enforcement yet)

Phase 2 (builds on Phase 1)
  D. Item 5 (part 2): check-perf.js + CI gate       (needs baseline from 1C)
  E. Item 1: verify-upgrade.js                      (reuses check-overrides.js strict mode from 1A)

Phase 3 (builds on Phase 2)
  F. Item 2: cross-version compat matrix            (calls verify-upgrade.js from 2E)

Phase 4 (parallel to 3)
  G. Item 4: oversight agent structured watches     (independent; can run any time after Phase 1)
```

**Dependency rationale:**
1. **Item 3 first** -- flipping the override gate is a one-line CI change. Doing it first establishes the policy baseline before piling more gates on.
2. **Item 6 early** -- security is foundational; if the audit finds a CVE, the entire v1.2.0 re-plans around fixing it. Better to know in Phase 1.
3. **Item 5 split** -- collect baseline before enforcing budget. A budget set before measurement is guessed; a budget set from measurement is calibrated.
4. **Item 1 before Item 2** -- the matrix (Item 2) is a multiplication of the single upgrade test (Item 1). Build the thing, then run the thing N times.
5. **Item 4 parallel** -- oversight agent enhancements touch markdown + one new script. No dependency on other items. Slot wherever bandwidth allows.

---

## Integration Points (file/function level)

| Hardening Item | Touches file | Function / symbol |
|----------------|--------------|-------------------|
| Item 1 | `scripts/verify-upgrade.js` (NEW) | `verifyUpgrade({ from, to, upstreamDir })` |
| Item 1 | `scripts/compose.js` | `compose()` -- confirm programmatic API |
| Item 1 | `scripts/preview-update.js:40-48` | reuses `getVersionDelta()`, `readPinnedVersion()` |
| Item 1 | `scripts/check-overrides.js:154-213` | reuses `checkOverrides({ overridesDir, upstreamDir })` |
| Item 1 | `bin/install.js` | spawned as subprocess against temp dir |
| Item 2 | `.github/workflows/ci.yml` | new `compat-matrix` job |
| Item 2 | `.planning/vetted-upstream-versions.json` (NEW) | JSON array source for matrix |
| Item 3 | `.github/workflows/ci.yml:85-100` | split `boundary-override-check` into two jobs |
| Item 3 | `scripts/check-overrides.js:327-332` | no code change; CLI exit code already correct |
| Item 4 | `overlay/agents/gsd-oversight-execution.md` | add structured watches table |
| Item 4 | `overlay/agents/gsd-oversight-planning.md` | add structured watches table |
| Item 4 | `overlay/agents/gsd-oversight-verification.md` | add structured watches table |
| Item 4 | `overlay/agents/gsd-oversight-sync.md` | add structured watches table |
| Item 4 | `scripts/verify-oversight-probes.js` (NEW) | weekly CI harness |
| Item 5 | `perf-baseline.json` (NEW, repo root) | committed baseline contract |
| Item 5 | `scripts/bench.js` (NEW) | `runBenchmarks()` emits JSON |
| Item 5 | `scripts/check-perf.js` (NEW) | `checkPerf(bench, baseline)` compares |
| Item 5 | `.github/workflows/ci.yml` | new `perf-budget` job |
| Item 6 | `.github/workflows/ci.yml:10-20` | add `bun audit` step to `lint` job |
| Item 6 | `.github/workflows/ci.yml` | new `secret-scan` job (gitleaks) |
| Item 6 | `.planning/audits/suppressions.json` (NEW) | CVE suppression list |
| Item 6 | `scripts/check-audit-suppressions.js` (NEW) | expiry warning harness |

---

## Architectural Invariants Preserved

Cross-check every proposal against PROJECT.md's Key Decisions. Each item is reviewed below:

| Invariant (from PROJECT.md:155-198) | Preserved by | Notes |
|-------------------------------------|--------------|-------|
| Overlay architecture -- don't modify upstream | All 6 items | No proposal touches `node_modules/get-shit-done-cc/` |
| Surface-only branding | All 6 items | No internal path renames |
| Publish-time composition | Items 1, 2 | verify-upgrade invokes compose, doesn't bypass it |
| Exact version pinning | Item 2 | Matrix reads vetted list; does not auto-bump package.json |
| No runtime filtering v3.0 | All 6 items | All checks are build/CI-time, not install-time |
| 5-stage pipeline SRP | Item 1 | verify-upgrade reuses pipeline stages, adds none |
| Delegation installer | Item 1 | verify-upgrade spawns bin/install.js unchanged |
| continue-on-error for informational CI | Item 3 | Boundary stays informational; override flips to blocking |
| Atomic writes | Items 5, 6 | New JSON files use temp-file+rename pattern |
| Central timeout constants | Items 1, 5 | Subprocess tests reuse SUBPROCESS_TIMEOUT / HEAVY_SUBPROCESS_TIMEOUT |
| Manifest-driven uninstall | Item 1 | verify-upgrade reads gsd-file-manifest.json; does not bypass |

No invariant violations identified. Every new script follows the `scripts/*.js` convention. Every new CI job follows the existing `continue-on-error`-for-informational pattern. No new top-level directories.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding an `audits/` directory at repo root
**Why wrong:** Committed security scan output is noise; findings are time-stamped not durable.
**Instead:** `.planning/audits/` for ephemeral evidence; GitHub Issues for tracked findings.

### Anti-Pattern 2: Implementing oversight checks as OPA policies
**Why wrong:** Adds a DSL dependency for checks that are essentially shell probes. Overkill for 4 agents.
**Instead:** Structured markdown tables + deterministic probe scripts.

### Anti-Pattern 3: Committing multiple upstream versions as tarballs
**Why wrong:** Repo bloat; fights the "upstream is a dependency, not source" principle.
**Instead:** GHA matrix + `npm install --prefix=$TMP`.

### Anti-Pattern 4: Setting a perf budget before measuring
**Why wrong:** Guessed budgets cause false positives or false negatives.
**Instead:** Measure first (Phase 1), enforce second (Phase 2).

### Anti-Pattern 5: Running all 6 items in parallel in v1.2.0 Phase 1
**Why wrong:** Ordering dependencies matter; parallel execution of dependent items creates rework.
**Instead:** Follow the 4-phase build order above.

### Anti-Pattern 6: Adding `--strict` flag to `check-overrides.js` to toggle blocking behavior
**Why wrong:** The script already exits 1 on violations. Adding a flag adds API surface for no new capability.
**Instead:** Control blocking at the CI-policy level via `continue-on-error`.

---

## Open Questions for Implementation Phase

1. **Perf benchmark harness** -- bun's built-in benchmark support vs a third-party tool? Low-risk decision; can defer to Phase 2.
2. **Vetted upstream versions count** -- how many historical versions to keep in the matrix? Recommend 3-5 (current + 2-4 prior). More is diminishing returns.
3. **gitleaks vs trufflehog** -- gitleaks has a lighter install and clearer GHA integration. Recommend gitleaks unless trufflehog's accuracy advantage matters for this repo.
4. **Oversight probe retrospective frequency** -- weekly is proposed; could be monthly. Depends on how often oversight flags are triggered in practice (check `.planning/memory/gsd-oversight-*.md` volume at Phase 1 start).

None of these block the Phase 1 kickoff.

---

## Sources

- [github-action-benchmark](https://github.com/benchmark-action/github-action-benchmark) -- precedent for CI benchmark storage via gh-pages
- [Kalibra](https://github.com/khan5v/kalibra) -- statistical regression detection via bootstrap CIs
- [actions/setup-node matrix docs](https://github.com/actions/setup-node) -- reference for matrix expansion
- [Testing npm packages against multiple peer dep versions](https://dev.to/joshx/test-your-npm-package-against-multiple-versions-of-its-peer-dependency-34j4) -- npm-prefix pattern for version isolation
- Internal: `scripts/compose.js`, `scripts/check-overrides.js`, `.github/workflows/ci.yml`, `overlay/agents/gsd-oversight-*.md`
- Internal: `.planning/PROJECT.md` Key Decisions section
- Internal: `package.json` (script conventions, devDependencies)

---

*Architecture research for v1.2.0 Ship-Ready Hardening*
*Researched: 2026-04-19*
*Confidence: HIGH (all integration points verified against existing files)*
