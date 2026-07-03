---
gsd_state_version: 1.0
milestone: v1.2.0
milestone_name: Ship-Ready Hardening
status: executing
stopped_at: Completed 43-09-PLAN.md
last_updated: "2026-07-04T00:40:00.000+01:00"
last_activity: 2026-07-04
progress:
  total_phases: 10
  completed_phases: 3
  total_plans: 34
  completed_plans: 28
  percent: 82
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Get upstream improvements automatically while preserving fork identity and additions
**Current focus:** Phase 43 — upgrade-resilience-verify-matrix-dogfood

## Current Position

Phase: 43 (upgrade-resilience-verify-matrix-dogfood) — EXECUTING
Plan: 10 of 12
Status: Ready to execute
Last activity: 2026-07-04

**Upstream state:** Active worktree now pins Open GSD `@opengsd/gsd-core@1.5.0`. Legacy `get-shit-done-cc` remains deprecation evidence only; it is not the active bump target and must not be used as `latest` authority. `@opengsd/get-shit-done-redux@1.1.0` is deprecated in favor of `@opengsd/gsd-core`. Open GSD package layout is not drop-in: no `gsd-sdk` bin in core, source root is package-specific, and compose/override/update tooling now routes through the upstream-authority helper.

## Performance Metrics

**Velocity:**

- Total plans completed: 102 (across v0.1.0-v1.2.0 through Phase 42)
- v0.1.0: 12 plans, 1.38 hours
- v0.2.0: 32 plans, 4.45 hours
- v0.3.0: 17 plans, 15.0 hours
- v1.0.0: 21 plans, 4 days (2026-03-28 -> 2026-03-31)
- v1.1.0: 8 plans, 2 days (2026-04-02 -> 2026-04-04)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v1.1.0 decisions archived to .planning/milestones/v1.1.0-ROADMAP.md.

v1.2.0 roadmap decisions:

- 4 phases derived from research-recommended structure (Foundation -> Budget+Process -> Upgrade Resilience -> Ship Polish)
- REL-01 (100% test pass) treated as Phase 41 completion criterion, not aspirational SLO
- SECURITY-04 owned by Phase 41 (audit mode install); block-mode promotion is execution of same requirement, documented as conditional on 2+ weeks clean audit log (Phase 44)
- DOCS-01 (MAINTENANCE.md) placed in Phase 44 with single owner to avoid cross-phase ownership split; sharper acceptance criteria (per-section executable examples + minimum content + CI-extracted example run) added to requirement to prevent slop
- PROCESS-07 graduation criteria locked to specific numbers (N=20 PRs, <=5% FP rate, maintainer-reviewed PR + 2 weeks clean CI + MAINTENANCE.md entry)
- Phase numbering continues integer sequence from v1.1.0 last phase (40) -> v1.2.0 starts at Phase 41
- Phase 40.6 inserted 2026-06-22 after upstream status review found the Phase 40.5 legacy authority assumption invalid. This is not a rewrite and not a GSD-2 migration; it preserves the overlay architecture while changing the authoritative upstream package/repo from legacy TACHES/GSD to Open GSD.
- Phase 40.6 execution migrated active code to exact-pinned `@opengsd/gsd-core@1.5.0`, added the upstream-authority helper/fallback, and changed active `/gsd:upstream` surfaces to `open-gsd/gsd-core`.
- Phase 40.6 completed 2026-06-23. UPGRADE-11 satisfied; package smoke passed from packed tarball; boundary checker remains known structural debt at 41 violations.
- 2026-07-01 GSD self-routing/progress fix: `STATE.md` current phase is authoritative over older partial phase directories for `roadmap analyze` and `init progress`; effective plan counts must include ROADMAP `**Plans:**` / `**Plans**:` declarations so disk-only PLAN counts cannot report false completion.
- 2026-07-01 memory-nexus milestone-scope fix: runtime roadmap parsing must prefer explicit `STATE.md` body milestone text over stale frontmatter, recognize active/in-progress ROADMAP milestone declarations, and filter shared `Phase Details` sections to the current milestone summary list so older milestone detail blocks cannot leak into current progress or next-phase selection.
- 2026-07-03 Phase 42 planning decision: use `macos-15` instead of stale `macos-latest` wording because Phase 41 added a repository invariant forbidding `macos-latest`.
- 2026-07-03 Phase 42 planning decision: add non-interactive `gsd --version --json` provenance before cousin-test CI, because the current launcher otherwise displays a banner and launches `claude`.
- 2026-07-03 Phase 42 planning decision: `@chude/get-stuff-done@3.0.2` is public on npm, so cousin-test default path must not require a secret; optional read-only token support is allowed for private registry scenarios.
- 2026-07-03 Phase 42 plan-review decision: runtime package provenance must read fork version from `package.json` and upstream identity from the upstream-authority helper, not hardcoded literal package/version values.
- 2026-07-03 Phase 42 plan-review decision: docs gates target tracked markdown discovered with `git ls-files` semantics; recursive `**/*.md` globs are not sufficient because ignored generated/dependency copies can pollute the signal.
- 2026-07-03 Phase 42 plan-review decision: perf budget thresholds are strict greater-than boundaries; exact `1.10` does not warn and exact `1.25` does not hard-fail.
- 2026-07-03 Phase 42 Plan 01 decision: `scripts/bench.js` remains measurement-only; `scripts/check-perf.js` owns merge policy, annotations, and accepted-regression handling.
- 2026-07-03 Phase 42 Plan 01 decision: `acceptedRegressions[]` entries must include reviewed metadata plus either `platform` + `metric` or explicit `scope: "global"`; missing targets are not wildcard approvals.
- 2026-07-03 Phase 42 Plan 02 decision: `gsd --version` and `gsd --version --json` exit before config migration, startup banner, or `claude` spawn; runtime package provenance is a non-interactive trust surface for cousin CI.
- 2026-07-03 Phase 42 Plan 02 decision: runtime package provenance derives fork name/version from package.json, upstream package from the upstream-authority helper, upstream version from `dist/.install-meta.json` when available, and overlay manifest identity from the SHA-256 of `dist/.overlay-manifest.json`.
- 2026-07-03 Phase 43 Plan 02 decision: installer rollback is transaction-based around the upstream delegation boundary; it snapshots previous settings, metadata, previous manifests, and current dist overlay paths, then removes only newly copied overlay files and restores prior snapshots on failure.
- 2026-07-03 Phase 43 Plan 02 decision: runtime/install provenance now exposes `forkPackage`, `forkVersion`, `upstreamPackage`, and `upstreamVersion` while preserving `packageName` and `version` as backward-compatible fork aliases for cousin smoke consumers.
- 2026-07-03 Phase 43 Plan 03 decision: `.planning/vetted-upstream-versions.json` is the manifest source of truth for the next compatibility matrix, with exactly `1.5.0`, `1.6.0`, and `1.6.1` as candidate entries. `vettedAt` remains `null` until Plan 04 applies matrix evidence.
- 2026-07-03 Phase 43 Plan 04 decision: compatibility matrix CI is report-only per AF-7 so existing upstream-compat drift does not become a failed PR check; manifest validation and artifact upload remain blocking evidence gates. The matrix report records all three vetted pins as failed, with `1.5.0` classified as the current blocking drift row.
- 2026-07-03 Phase 43 Plan 05 decision: semantic override staleness is limited to parsed `.js` overrides with recorded `Semantic SHA-256`; Acorn parse failures, missing semantic hashes, and non-JS overrides preserve byte-hash blocking behavior. Markdown semantic diff remains deferred to v1.3.0.
- 2026-07-03 Phase 43 Plan 06 decision: check-update adopted the upstream parent/worker split, `detectConfigDir`, shared `$HOME/.cache/gsd` cache, and stale installed hook detection while preserving `@chude/get-stuff-done`, `gsd.role`, maintainer commit classification, and exact 4-hour/7-day throttles. Active `@opengsd/gsd-core@1.5.0` already ships `hooks/gsd-check-update-worker.js`, so the fork worker is an override, not an overlay.
- 2026-07-04 Phase 43 Plan 07 decision: statusline now consumes the same shared package-lineage cache as check-update, parses `active_phase`, `next_action`, `next_phases`, `completed_phases`, `total_phases`, and `percent` from STATE frontmatter, and uses `CLAUDE_CODE_AUTO_COMPACT_WINDOW` for context scaling while preserving fork branding and `gsd.role` update display. `scripts/finalize-dist.js` now finalizes `gsd-check-update-worker.js` with the other bundled hooks.
- 2026-07-04 Phase 43 Plan 08 decision: override churn is generated from filesystem evidence by comparing current override paths across previous and target upstream trees. CHANGELOG writes are constrained to the `override-churn` marker block under `Unreleased`, while real bump execution in Plans 10-11 supplies the actual upstream directory pair.
- 2026-07-04 Phase 43 Plan 09 decision: SBOM generation is a separate `bun run sbom` lifecycle step using pinned `@cyclonedx/cyclonedx-npm@4.2.1`, executed after compose/build and before finalize-dist in `bun run dist`. The wrapper removes Bun's npm user-agent env before spawning CycloneDX and uses `--ignore-npm-errors` because the existing npm tree reports `picomatch` override noise under `npm ls`.
- 2026-07-03 Phase 42 Plan 04 decision: evidence-before-claim oversight is centralized in `overlay/memory/oversight-principle-evidence-before-claim.md`; execution, verification, and planning agents carry only compact advisory triggers tied to PROCESS-07.

### Roadmap Evolution

- Phase 40.5 inserted after Phase 40: Upstream bump 1.34.2 -> 1.38.2 and Phase 41 decision re-verification. (INSERTED 2026-04-22 URGENT). User chose bump-first ordering over plan-now-with-bump-in-Wave-0 to verify Phase 41 decisions against fresh upstream state before planning. UPGRADE-10 requirement added (Phase 40.5); UPGRADE-05 reworded to preserve dogfood-bump timing semantics (Phase 43); backlog 999.3 captured (conditional upstream regex-fix PR filing, only if bug still present on clean 1.38.2).
- Phase 40.6 inserted after Phase 40.5: Upstream authority migration from `get-shit-done-cc` / `gsd-build/get-shit-done` to Open GSD `@opengsd/gsd-core` / `open-gsd/gsd-core`. (INSERTED 2026-06-22). This supersedes Phase 40.5 Wave 5's legacy upstream filing path and blocks Phase 41 until compose/override/update tooling is verified against Open GSD layout.

### Carried Forward Tech Debt

- 41 boundary violations (structural, informational CI)
- Historical ~130 upstream compat failures (branding diffs, informational CI). After active-authority repair, local Windows compat runner reports 11 failures; keep linux/macos/windows baseline thresholds unchanged until PR matrix evidence exists.
- preview-update.js ~5% uncovered I/O paths (documented exception)
- INST-04 uninstall manifest gap (overlay files not tracked in upstream manifest)
- Intermittent Windows subprocess timeout flakiness (advanced in Phase 41 Plans 05-07; 10x validation run `28639808289` passed on Windows, and flake telemetry remains in CI)
- First GitHub Actions run showed `gitleaks/gitleaks-action@v2` needs `GITHUB_TOKEN` for pull_request scans and OSV `@v2` is not a resolvable tag. The repaired PR run `28533068807` passed all CI jobs. Boundary report-only cleanup was remote-verified by run `28534255286`; first-party action/runtime and `macos-latest` annotation cleanup was remote-verified by run `28534944081`. The docs reconciliation run `28535445005` passed but surfaced the remaining `gitleaks/gitleaks-action@v2` Node 20 annotation; `gitleaks/gitleaks-action@v3` cleanup was remote-verified by run `28536087964`.
- Aggregate coverage remains below the user's 95% per-metric standard even though the current repo command exits 0 (`bun test --coverage`: 94.86% functions, 93.08% lines on 2026-07-01).
- Phase 41 Plan 04 implemented perf schemas, scripts, package commands, and a `workflow_dispatch` manual capture workflow. Real Linux/macOS/Windows artifacts from run `28638612289` generated `perf-baseline.json` and `.planning/perf/test-timing.json` after the bench script was corrected to use Bun's supported `--cwd` flag instead of unsupported `hyperfine --working-directory`.
- Phase 41 Plan 07 implemented the `workflow_dispatch` 10x validation gate, weekly flake issue maintenance, and D-11/REL-03 maintenance-log discipline. Post-registration run `28639808289` passed on ubuntu-latest, macos-15, and windows-latest.
- Phase 42 planning created five executable plans: 42-01 perf budget enforcement, 42-02 non-interactive runtime package provenance, 42-03 cousin cold-install workflow and INSTALL.md, 42-04 oversight principle/probes, and 42-05 markdown/link docs gates. Planning refresh found `markdownlint-cli2` latest `0.23.0`, `lycheeverse/lychee-action` v2 latest `v2.8.0`, and `@chude/get-stuff-done` npm latest `3.0.2`. External plan review found no blockers; accepted findings were incorporated; second-pass review found no blockers/high/medium findings. Review evidence is recorded in `.planning/phases/42-budget-enforcement-process-hardening-cousin-test/42-PLAN-REVIEW.md`.
- Phase 42 Plan 02 PR #18 first CI run `28645820292` exposed macOS install perf-budget variance: current 176ms vs baseline 134ms, ratio 1.31, but delta 42ms remained within baseline stddev 45ms. Phase 42 Plan 04 PR #19 run `28647664953` recurred at 228ms vs 134ms, ratio 1.70, on macos-15-arm64 runner image `20260623.0190`. Phase 42 Plan 03 PR #20 run `28651494074` recurred on macOS compose at 499ms vs 370ms, ratio 1.35, on runner image `20260630.0202.1` with 96.6ms stddev. `perf-baseline.json` now contains targeted accepted regressions for `macos` + `install`, maxRatio 1.4 for PR #18 and maxRatio 1.8 for PR #19, and `macos` + `compose`, maxRatio 1.5 for PR #20, all expiring 2026-07-10. Replace with rebaseline or variance-aware policy before adding further macOS perf exceptions.
- Phase 42 Plan 04 completed PROCESS-01 through PROCESS-07: four advisory triggers (`EBC-EXEC-POSTMERGE`, `EBC-EXEC-SUMMARY`, `EBC-VERIFY-CI-BEFORE-MEASURE`, `EBC-PLAN-METRIC-COMPAT`) are mechanically probed by `scripts/verify-oversight-probes.js` and `.github/workflows/oversight-probes.yml`.
- Phase 42 Plan 03 completed SHIP-07 and DOCS-04: `scripts/cousin-smoke.js` verifies cold installs through `gsd --version --json`, `.github/workflows/cousin-install.yml` covers ubuntu-latest/macos-15/windows-latest x Node 20/22 x npm/pnpm/bun, and `INSTALL.md` documents public install plus optional read-only token usage.
- Phase 42 Plan 05 completed DOCS-05 and DOCS-06: `scripts/lint-docs.js` runs `markdownlint-cli2@0.23.0` against tracked markdown discovered by `git ls-files`, `.github/workflows/ci.yml` includes a `docs-gates` job using `lycheeverse/lychee-action@v2`, and `lychee.toml` excludes only generated/vendor/dependency paths (`node_modules/`, `dist/`, `.upstream/`, `overlay/get-shit-done/`) plus localhost examples. Local lychee verification passed with 602 total links and 0 errors.
- 2026-07-01 inbox triage fix closed the confirmed authkey `roadmap update-plan-progress` wrong-checkbox/CRLF issue and medesine-rx false-100% progress issue in code and tests. Memory-nexus v5/decimal roadmap drift is partially fixed in code and tests: `init execute-phase 42` now reports `v5.0`, `roadmap analyze` scopes to v5 phases only, and no v4 Phase 30/32.6 leakage remains. Memory-nexus Codex no-frontmatter installer crash is fixed/tested as of 2026-07-03; Phase 43 Plan 02 closed the related installer transaction/preflight/rollback and VERSION mapping clarity items for this repo. Config-schema drift and grouped stale-STATE health diagnostics remain open. Plan 06 completed the remaining real test subprocess migration and added Windows flake telemetry; no active REL-03 skips exist.
- Phase 43 Plan 02 resolved the Plan 01 post-wave `tests/installer-v3.test.js` Windows timeout/hang by finalizing upstream delegation on `exit` and adding rollback-aware post-upstream handling. Hook test timeout debt remains intentionally routed to Phase 43 Plans 06-07.
- Phase 43 Plans 06-07 resolved the coupled check-update/statusline hook reconciliation debt with shared `$HOME/.cache/gsd` cache semantics, package-lineage guards, worker packaging, phase-lifecycle display, and focused hook/compose tests.
- Phase 43 Plan 08 observed that direct `bash .changelog-conflict-check.sh CHANGELOG.md` fails on existing published-release bullets even though the required synthetic `--self-test` passes. Before wiring that script as a full-file gate, clarify whether it is fixture-only or update its awk state handling to ignore normal subsection bullets.
- Phase 43 Plan 09 generated and packaged `dist/bom.json`, and CI uploads it as package evidence. Literal GitHub release-asset attachment remains open until the Phase 44 publish/release workflow exists; do not mark SHIP-03 fully complete before that release-flow hook is verified.
- Config schema drift -- 8 unknown config.json keys flagged by gsd-tools; tracked as backlog 999.2 with 80% investigation done and Option C (namespace under features.*) recommended
- `_auto_chain_active` schema key (RESOLVED -- fork-specific, fixed in Phase 39 schema)
- Codex `extractFrontmatterField` crash (RESOLVED -- fork-specific, 4 oversight agents had heading before frontmatter)

### Pending Todos

None.

### Blockers/Concerns

Boundary checker still reports 41 structural root-mirror violations as known debt, but CI now reports it through `--report-only` plus the blocking debt ratchet instead of a failed-step annotation. This is known v1.2 debt, not hidden. Old Phase 40.5 Wave 5 must not file or patch against legacy upstream; it is retired unless a future reviewed plan creates a new Open GSD-specific filing path. Backlog 999.x items are not the default next phase; Phase 43 is the next v1.2 execution path unless explicitly replanned. Root-local inbox handoffs are being reconciled into terminal tracked records where resolved/no-action, with the remaining memory-nexus/authkey implementation items left active.

## Session Continuity

Last session: 2026-07-04T00:40:00.000+01:00
Resumed: 2026-06-22 -- user approved taking project lead and routing all project work through GSD.
Stopped at: Completed 43-09-PLAN.md
Resume file: None
