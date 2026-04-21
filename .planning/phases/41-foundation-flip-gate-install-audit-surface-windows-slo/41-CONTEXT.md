# Phase 41: Foundation — Flip Gate, Install Audit Surface, Windows SLO - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Make v1.2.0's quality backbone real rather than aspirational. Four foundation layers:

1. **Flip the override-staleness gate to BLOCKING CI** — currently informational, co-joined with boundary-check in a single `continue-on-error: true` job. Must become a blocking signal that a PR introducing stale overrides (SHA drift or missing REASON.md) cannot merge. Boundary-check stays informational per locked prior decision.
2. **Stand up the security audit surface** — install audit-ci (blocking), gitleaks (blocking), osv-scanner (blocking), harden-runner (audit mode); codify suppression schema with TTL and re-review enforcement; encode triage policy as a committed artifact.
3. **Capture a trustworthy perf baseline** — hyperfine measurements of install/compose/test across all three platforms, committed as `perf-baseline.json` at repo root with `acceptedRegressions[]` escape hatch for Phase 42's budget enforcement to consume.
4. **Root-cause Windows subprocess flakiness and make the Reliability SLO real** — migrate subprocess call sites to `Promise.race([child, timer])`, track per-test flake rate, and build a friction-heavy escape hatch (REL-03) for anything that genuinely resists root-cause.

Out of phase: perf regression gate + accepted-regressions workflow (Phase 42 PERF-03..05), oversight trigger wiring (Phase 42 PROCESS-01..07), MAINTENANCE.md full completion (Phase 44 DOCS-01), harden-runner block-mode promotion (Phase 44 SECURITY-04 conditional on observation period), upgrade resilience mechanics (Phase 43 UPGRADE-01..09 except -03 and -06).

</domain>

<decisions>
## Implementation Decisions

### CI Structure & Flip-Gate Wiring

- **D-01:** Split the existing `boundary-override-check` job (`.github/workflows/ci.yml:85-100`) into two separate jobs:
  - **New** `override-check` job: runs `node scripts/check-overrides.js`, NO `continue-on-error` (blocking).
  - **Existing** `boundary-check` job: runs `node scripts/check-boundary.js`, RETAINS `continue-on-error: true` (informational, locked by v1.0.0 key decision).
  - Both run on ubuntu-latest (no cross-platform matrix needed; these are repo-structural checks not platform-sensitive).
  - Parallel execution is free; cleaner CI status badges per concern.
- **D-02:** `.changelog-conflict-check.sh` detects the known "entry inside a published release section" pattern using an **awk/sed state machine** (pure shell, no node, no markdown AST dep). State tracked: `in_published_section | in_unreleased_section`. Any `- ` bullet found between a `## [X.Y.Z]` heading (where X.Y.Z is a concrete semver, not `Unreleased`) and the next `## [` heading flags exit 1 with the offending line number.
- **D-03:** Changelog-conflict fixtures live at `tests/fixtures/changelog-conflict/good-changelog.md` (passes with exit 0) and `tests/fixtures/changelog-conflict/bad-changelog.md` (fails with exit 1, contains the known pattern). Mirrors project's existing test-fixture convention. Script's self-test invocation: `bash .changelog-conflict-check.sh --self-test` asserts both fixtures.
- **D-04:** `MAINTENANCE.md` is **stub-created in Phase 41** with a minimal "Bump Runbook" section referencing `.changelog-conflict-check.sh` as a required pre-push step. Phase 44 (DOCS-01) expands it to full 8-section content (Upgrade Process, Override Conflict Handling, CI Staleness Response, Release Cadence, Bump Runbook, Security Triage, Perf Budget, Escape-Hatch Decisions Log). Single-file path, no later migration cost.

### Security Surface

- **D-05:** Suppression schema in `.planning/audits/suppressions.json` follows requirements exactly (`id, severity, reason, reviewer, reviewedDate, reReviewDate`). **Default re-review TTL: 60 days** (aligns with quarterly security review cadence). When `reReviewDate < today`, CI audit-ci gate fails with actionable message: `"Suppression for {id} expired {reReviewDate}; re-review and update or remove the entry in .planning/audits/suppressions.json"`. AJV strict validation (`additionalProperties: false`) per Phase 39 schema precedent.
- **D-06:** Security triage policy (SECURITY-06: critical → v1.2.0 / major → v1.3.0 / minor → backlog) documented in `SECURITY.md` at repo root. Fork is private but follows GitHub convention (auto-surfaced in repo UI). Phase 44 MAINTENANCE.md Security Triage section links to SECURITY.md rather than duplicating. Policy is a committed artifact, not prose in a code review.
- **D-07:** Scanner scope:
  - **gitleaks-action@v2** with `.gitleaks.toml` allowlist for test fixtures and example tokens (documented path patterns in `tests/fixtures/**` and example snippets in docs). Allowlist entries MUST reference an issue/PR justifying the exemption.
  - **osv-scanner-action@v2** runs against `bun.lock` on direct+transitive dependencies. Severity filter: fail on HIGH and CRITICAL; MEDIUM/LOW are reported but do not block. This matches audit-ci's shape and catches Axios-style transitive CVEs SECURITY-03 exists to catch.
- **D-08:** `step-security/harden-runner@v2` installed in **audit mode** in Phase 41. Audit logs delivered as GitHub Actions workflow artifacts (default 7-day retention). Weekly human review cadence: findings (or confirmation of none) appended as a dated log line to MAINTENANCE.md's Security section (stub section created in Phase 41, expanded in Phase 44). Block-mode promotion is NOT in Phase 41 scope — Phase 44 SECURITY-04 promotes conditional on 2+ weeks clean audit log (documented promotion criterion).

### Windows Root-Cause

- **D-09:** Apply `Promise.race([child, timer])` pattern as **blanket migration** to ALL test-file subprocess call sites (every `execSync`, `exec`, `spawnSync` in `tests/**`). The pattern lives in a shared helper at `tests/helpers/subprocess-with-timeout.js` exporting `runWithTimeout(cmd, args, options)`. New tests adopt the helper by default. Uniform code, review in a single PR, prevents drift.
- **D-10:** Per-test flake rate tracked via **GitHub Issues as the interim collector**. On Windows test failure in CI, a GHA Script step opens or comments on a `flake-report` labeled issue with `{date, test-name, platform, run-url}`. Issue history IS the flake history. No new service in Phase 41. **Future direction** (captured under deferred): user will build an own external collector exposed via Tailscale; Phase 41's GitHub Issues interim is a stepping stone, not the destination.
- **D-11:** **2 working days hard time budget** for Windows root-cause effort (Promise.race migration + suite-10x validation + residual triage). Any test still flaking after day 2 falls under REL-03 (per-test skip with issue link + deadline logged in MAINTENANCE.md Escape-Hatch Decisions Log). Hard boundary prevents the phase stalling.
- **D-12:** REL-03 "flagged-on-use" means three simultaneous surfaces:
  1. **In-run visibility**: every Windows CI run appends a `### ⚠ Active REL-03 skips` section to the GHA job summary listing each skipped test with `reason: REL-03-N`, issue link, deadline.
  2. **In-test wrapper**: `test.skip.if(isWindows, { reason: 'REL-03-N: <issue-url>, deadline YYYY-MM-DD' })` (bun:test conditional skip). The reason is visible in local test runs too.
  3. **Durable log**: MAINTENANCE.md's Escape-Hatch Decisions Log table tracks `{REL-03-N | test-path | platform | issue | deadline | reviewer}` rows. Reviewed weekly alongside harden-runner audit.

### Perf Baseline

- **D-13:** `scripts/bench.js` measures three operations per platform:
  - **install**: `bun install --ignore-scripts` on a clean temp directory (cold cache; no install.js execution).
  - **compose**: `bun run compose` (`scripts/compose.js`).
  - **test**: full `bun test` suite (not a smoke subset — the Windows SLO concern IS the full suite; smoke would be signal-negative).
- **D-14:** Hyperfine parameters: **3 warmups, 5 runs per operation, per platform**. 5 runs yields usable mean ± stddev while keeping CI cost bounded. Bench runs as its **own CI job** (`perf-baseline`, `workflow_dispatch` only in Phase 41 — not on every PR; that's Phase 42 PERF-04 territory) to stay outside the `test` job's 15-min timeout. Bench job timeout: 30 min per platform.
- **D-15:** Single `perf-baseline.json` committed at repo root, schema:
  ```json
  {
    "metadata": {
      "capturedAt": "ISO-8601",
      "nodeVersion": "...",
      "bunVersion": "...",
      "upstreamVersion": "1.34.2",
      "hyperfineVersion": "..."
    },
    "platforms": {
      "linux":   { "install": { "mean_ms": ..., "stddev_ms": ..., "min_ms": ..., "max_ms": ..., "samples": 5 },
                   "compose": { ... }, "test": { ... } },
      "macos":   { ... },
      "windows": { ... }
    },
    "acceptedRegressions": []
  }
  ```
  Matches PERF-02 "at repo root" wording. `acceptedRegressions[]` starts empty; Phase 42 PERF-05 defines its entry schema.
- **D-16:** `scripts/bench.js` wraps hyperfine's `--export-json` output and **normalizes** into the schema above (independent of hyperfine version). Adds AJV schema at `config/perf-baseline.schema.json` validated in CI (matches Phase 39 strict-schema precedent). Raw hyperfine output is not committed.

### Phase Completion & Self-Test

- **D-17:** Phase 41 `execute-phase` completes when all plans are implemented + local bun tests pass. **10-run validation is a gated post-execute verification step**: a `workflow_dispatch` workflow (`10x-validation.yml`) that invokes the test job 10 times sequentially on main for each platform. Phase 41 is CLOSED only when that 10-run batch is green on Linux, macOS, AND Windows. If any run fails, Phase 41 re-opens for REL-02/REL-03 triage before Phase 42 may start. This keeps REL-01 a verifiable bar, not aspirational.
- **D-18:** Flip-gate self-test:
  - **Unit-level**: extend `tests/check-overrides.test.js` with cases for (a) stale SHA detection, (b) missing REASON.md, (c) valid override passes. Assert exit codes + error message substrings.
  - **Integration-level**: new `tests/check-overrides-integration.test.js` creates a temp overlay dir with a known-stale override fixture (pre-computed SHA mismatch), invokes `node scripts/check-overrides.js` via subprocess with `--overrides-dir`, asserts exit 1 and actionable stderr.
  - Both run in existing `test` CI job. No separate weekly cron workflow needed.

### Claude's Discretion

- Exact AJV schemas for `suppressions.json` and `perf-baseline.schema.json` (follow Phase 39 precedent: strict, typed, required fields).
- File/function organization within `scripts/bench.js`, `.changelog-conflict-check.sh`, the GHA Script step for flake-report filing.
- Exact error message strings (cli-standards rule applies: state what happened, why, what to do about it).
- Which specific eslint-plugin-security rules to audit in SECURITY-05 (presumption: enable all relevant ones unless a rule produces documented false positives in fork-specific code).
- Test fixture layout inside `tests/fixtures/changelog-conflict/`.
- GHA Script snippet details for flake-report issue file/comment (dedup logic, label format).
- Whether `scripts/bench.js` uses `hyperfine` binary directly (recommended: spawn) or a Node wrapper library (not recommended — adds dep).

### Folded Todos

None — no pending todos matched Phase 41 via `todo match-phase`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/ROADMAP.md` §"Phase 41: Foundation" — goal + 6 success criteria
- `.planning/REQUIREMENTS.md` — UPGRADE-03, UPGRADE-06, SECURITY-01..06, PERF-01..02, REL-01..03 acceptance criteria
- `.planning/PROJECT.md` — Key Decisions (continue-on-error for informational CI is LOCKED; don't reverse)

### Current CI shape (to modify)
- `.github/workflows/ci.yml` — current 5-job matrix. Lines 85-100: the `boundary-override-check` job to split (D-01). Line 27: `BUN_TEST_TIMEOUT: 30000` pattern to extend for bench job.

### Existing scripts (to extend or pair with)
- `scripts/check-overrides.js` — 345-line flip-gate implementation already exits 1 on staleness/missing REASON.md. D-01 just wires it into a blocking job; script itself needs no behavior change. Read `hashFileContent` (line ~75), `walkDir` (line ~48).
- `scripts/check-boundary.js` — informational boundary check (no behavior change; D-01 just isolates its job).
- `scripts/compose.js` — `bun run compose`, exercised by bench (D-13).

### Subprocess pattern foundation
- `tests/helpers/test-timeouts.js` — exports `SUBPROCESS_TIMEOUT=15000` and `HEAVY_SUBPROCESS_TIMEOUT=30000`. The new `runWithTimeout(cmd, args, options)` helper (D-09) should consume these constants, not invent new ones.
- `tests/helpers.cjs` — existing test helpers (74 lines). Add new helper to `tests/helpers/subprocess-with-timeout.js` (new file) or extend.
- `tests/sync.test.cjs` — primary site for `execSync` pattern (13 call sites, lines ~90-125). Main target for D-09 blanket migration.
- `tests/hooks.test.js`, `tests/installer-safety.test.js`, `tests/installer-exports.test.js` — additional subprocess sites in D-09 scope.

### Existing test to extend for D-18
- `tests/check-overrides.test.js` — existing unit tests to extend with stale-SHA + missing-REASON.md cases.

### Prior phase precedents
- `.planning/milestones/v1.1.0-phases/39-test-health-ci/39-CONTEXT.md` — AJV strict schema pattern (D-05, D-16 follow), 7-day throttle pattern (reusable for TTL checks), timeout constants convention.
- `.planning/milestones/v1.1.0-phases/37-installer-safety/37-CONTEXT.md` — test isolation via temp dirs + `--config-dir` (D-18 integration test follows), subprocess timeout convention, `bun:test` patterns.

### External references
- `audit-ci@7.1.0` documentation — CLI flags for severity thresholds and config file path (`.planning/audits/audit-ci.json` or default).
- `hyperfine` documentation — `--export-json` schema (used by D-16 wrapper), `--warmup`/`--runs` flags, binary availability on GHA runners (pre-installed on ubuntu-latest; macOS via `brew install hyperfine`; Windows via `choco install hyperfine`).
- `gitleaks-action@v2` + `.gitleaks.toml` schema — allowlist format (path/regex/commit-hash), report format.
- `osv-scanner-action@v2` — severity filtering, lockfile scanning for bun.lock.
- `step-security/harden-runner@v2` — audit-mode config, artifact format, block-mode parameters (for Phase 44 reference only).
- `bun:test` `test.skip.if` documentation — conditional skip shape used by D-12.

### Related memory
- `memory/feedback_project_standards_over_single_maintainer.md` — "solo-dev scope-cutting" framing is rejected on this project.
- `memory/project_windows_test_flakiness.md` — prior observation: 22x faster on WSL2 vs Windows native.
- `memory/merge_conflict_changelog_nearmiss.md` — recurring hazard motivating UPGRADE-06.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-overrides.js` (345 lines) already implements SHA-256 comparison + REASON.md enforcement with exit 1 on fail. The flip gate is a one-line CI diff (remove `continue-on-error`) plus job split; the script is ready.
- `tests/helpers/test-timeouts.js` central constants already in place from Phase 39. The new subprocess helper is an additive sibling, not a replacement.
- `scripts/compose.js` is a clean hyperfine target (no hidden stdin requirements, deterministic output).
- `overrides/hooks/gsd-check-update.js` has the 4h/7d cache throttle shape that `audit-ci` suppression TTL logic can pattern-match (time-based expiry + actionable error message).

### Established Patterns
- CI: `bun install --frozen-lockfile --ignore-scripts` + `bun run compose` + job-specific step (line 44-46, ci.yml). All new jobs (`override-check`, `audit-ci`, `gitleaks`, `osv-scanner`, `harden-runner`, `perf-baseline`) follow this setup preamble.
- Informational CI jobs use `continue-on-error: true` as a **locked decision** (PROJECT.md). `boundary-check` + `upstream-compat` are informational; `override-check` is blocking from Phase 41 forward.
- Subprocess tests use `SUBPROCESS_TIMEOUT` (15s) for light operations, `HEAVY_SUBPROCESS_TIMEOUT` (30s) for install/compose-style.
- AJV strict schemas in `config/` with `additionalProperties: false`; validated via `bin/validate-configs.js` (Phase 39 precedent).
- bun:test tests in `tests/**/*.test.{js,cjs}`; `tests/**/*.test.cjs` = CommonJS subprocess-heavy, `tests/**/*.test.js` = ESM.

### Integration Points
- New jobs insert into `.github/workflows/ci.yml` as peers to existing `lint`, `test`, `parity`, `upstream-compat`, `boundary-override-check` (becoming `boundary-check`).
- `config/` directory already hosts AJV schemas; new schemas (`suppressions.schema.json`, `perf-baseline.schema.json`) fit the pattern.
- Any scripts added to `scripts/` need `bun run` entries in package.json to be first-class (`bun run bench`, `bun run audit-check`, etc.).
- `.planning/audits/` is a NEW directory. `.planning/flakes/` is NOT created in Phase 41 (deferred with the own-collector direction).

### Platform notes
- hyperfine pre-installed on `ubuntu-latest` GHA runner. macOS needs `brew install hyperfine`; Windows needs `choco install hyperfine` or direct binary download. Add OS-specific setup step in the `perf-baseline` job.
- `test.skip.if` is bun:test specific. If any file uses `node:test` (rare in this repo — `tests/*.test.cjs` may), the REL-03 wrapper needs a node:test equivalent (`ctx.skip()`).

</code_context>

<specifics>
## Specific Ideas

- **User rejects "single-maintainer scope-cutting" framing** on this project (see `memory/feedback_project_standards_over_single_maintainer.md`). Tradeoff recommendations in Phase 41 should evaluate as if team-scale standards apply. Example application: GitHub-Issues-as-flake-collector is an **interim** stepping stone to a user-built Tailscale-exposed observability collector, not the destination.
- **The bump runbook IS the home for `.changelog-conflict-check.sh`** — the script is checked manually pre-push AND potentially wired into a GHA workflow. Phase 41 must reference it from the stub Bump Runbook section in MAINTENANCE.md so the home exists when DOCS-01 expands the doc.
- **CONTEXT.md acceptance of UPGRADE-03 success criterion:** "A PR that introduces a stale override ... fails CI with a non-zero exit on the override-check job; the existing informational boundary-check job is unchanged." D-01's job split satisfies this verbatim.
- **CONTEXT.md acceptance of REL-01 + REL-02 success criterion:** "The full test suite passes 10 consecutive CI runs on Linux, macOS, AND Windows with zero retries; any residual skip is tagged with an issue link and a deadline recorded in MAINTENANCE.md's Escape-Hatch Decisions Log (REL-03 as flagged-on-use contingency only)." D-11 + D-12 + D-17 together satisfy this.
- **Suppression re-review wording in CI failure:** D-05's actionable message format explicitly names the expired entry's `id` and directs the maintainer to `.planning/audits/suppressions.json` — not "check the suppressions file" prose. cli-standards rule applies.

</specifics>

<deferred>
## Deferred Ideas

### Explicitly deferred (not Phase 41 scope)

- **Own Tailscale-exposed flake collector** — user's stated future direction. GitHub Issues interim (D-10) is the stepping stone. Track as a standalone future phase after v1.2.0 observability work lands, or as part of a dedicated observability milestone.
- **Phase 44 DOCS-01 full MAINTENANCE.md** — Phase 41 ships a minimal stub with Bump Runbook + Security sections only. Phase 44 expands to all 8 sections with executable examples + CI-extracted example run.
- **Phase 44 SECURITY-04 block-mode promotion for harden-runner** — conditional on 2+ weeks clean audit log. Not Phase 41's decision.
- **Phase 42 PERF-03/04/05** — check-perf.js, perf-budget CI job, acceptedRegressions workflow. Phase 41 only commits the baseline + schema.
- **Phase 42 PROCESS-01..07** — oversight trigger wiring. Phase 41 does not touch gsd-oversight agents.
- **Phase 43 UPGRADE-07..09** — upstream hook merge, semantic override staleness, CHANGELOG churn section. Phase 41 only covers UPGRADE-03 and UPGRADE-06.
- **Phase 44 SHIP-01..06** — pre-publish gate chain, publint, SBOM, OIDC trusted publishing, zizmor, reproducible builds. Phase 41 does not touch publishing.
- **Phase 44 DOCS-02..08** — upgrade guide, override policy, INSTALL.md, README polish, etc.

### Reviewed todos (not folded)

None — no pending todos matched Phase 41.

</deferred>

---

*Phase: 41-foundation-flip-gate-install-audit-surface-windows-slo*
*Context gathered: 2026-04-21*
