---
gsd_state_version: 1.0
milestone: v1.2.0
milestone_name: Ship-Ready Hardening
status: "Phase 42 EXECUTING. Plan 01 perf budget enforcement complete; Plan 02 runtime package provenance is next."
stopped_at: "2026-07-03 Completed 42-01-PLAN.md with perf comparator, accepted-regression schema, and blocking perf-budget CI wiring. Continue with 42-02 runtime package provenance next; 42-04 can also proceed in Wave 1 after this PR lands."
last_updated: "2026-07-03T06:44:01Z"
last_activity: 2026-07-03 -- Phase 42 Plan 01 complete
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 21
  completed_plans: 12
  planned_plans: 4
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Get upstream improvements automatically while preserving fork identity and additions
**Current focus:** v1.2.0 Ship-Ready Hardening -- Phase 42 Budget Enforcement, Process Hardening, Cousin-Test

## Current Position

Phase: Phase 42 (executing) -- Budget Enforcement, Process Hardening, Cousin-Test
Plan: 1/5 complete; next is 42-02 runtime package provenance
Status: Plan 01 complete from Phase 41 baselines and external-review-corrected plan; continue Wave 1 without auto-promoting backlog 999.x items
Last activity: 2026-07-03 -- Plan 01 perf budget enforcement completed

**Upstream state:** Active worktree now pins Open GSD `@opengsd/gsd-core@1.5.0`. Legacy `get-shit-done-cc` remains deprecation evidence only; it is not the active bump target and must not be used as `latest` authority. `@opengsd/get-shit-done-redux@1.1.0` is deprecated in favor of `@opengsd/gsd-core`. Open GSD package layout is not drop-in: no `gsd-sdk` bin in core, source root is package-specific, and compose/override/update tooling now routes through the upstream-authority helper.

## Performance Metrics

**Velocity:**

- Total plans completed: 97 (across v0.1.0-v1.2.0 through Phase 41)
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
- 2026-07-01 inbox triage fix closed the confirmed authkey `roadmap update-plan-progress` wrong-checkbox/CRLF issue and medesine-rx false-100% progress issue in code and tests. Memory-nexus v5/decimal roadmap drift is partially fixed in code and tests: `init execute-phase 42` now reports `v5.0`, `roadmap analyze` scopes to v5 phases only, and no v4 Phase 30/32.6 leakage remains. Memory-nexus Codex no-frontmatter installer crash is fixed/tested as of 2026-07-03; installer transaction/preflight/rollback, VERSION mapping clarity, config-schema drift, and grouped stale-STATE health diagnostics remain open. Plan 06 completed the remaining real test subprocess migration and added Windows flake telemetry; no active REL-03 skips exist.
- Config schema drift -- 8 unknown config.json keys flagged by gsd-tools; tracked as backlog 999.2 with 80% investigation done and Option C (namespace under features.*) recommended
- `_auto_chain_active` schema key (RESOLVED -- fork-specific, fixed in Phase 39 schema)
- Codex `extractFrontmatterField` crash (RESOLVED -- fork-specific, 4 oversight agents had heading before frontmatter)

### Pending Todos

None.

### Blockers/Concerns

Boundary checker still reports 41 structural root-mirror violations as known debt, but CI now reports it through `--report-only` plus the blocking debt ratchet instead of a failed-step annotation. This is known v1.2 debt, not hidden. Old Phase 40.5 Wave 5 must not file or patch against legacy upstream; it is retired unless a future reviewed plan creates a new Open GSD-specific filing path. Backlog 999.x items are not the default next phase; Phase 42 is the next v1.2 execution path unless explicitly replanned. The root inbox still has open memory-nexus reports to triage after the current GSD routing/progress fix lands.

## Session Continuity

Last session: 2026-07-03 (Phase 42 Plan 01 completed after externally reviewed Phase 42 planning; perf comparator, accepted-regression schema, and perf-budget CI wiring implemented and locally verified. Phase 41 closed after 10x validation run 28639808289; Plan 04 real perf baselines came from workflow run 28638612289.)
Resumed: 2026-06-22 -- user approved taking project lead and routing all project work through GSD.
Stopped at: Completed 42-01-PLAN.md; Phase 42 Plan 02 runtime package provenance is next on this branch or a fresh Wave 1 branch. Phase 42 Plan 04 can also proceed in Wave 1 after this PR lands.
Resume file: .planning/phases/42-budget-enforcement-process-hardening-cousin-test/42-02-PLAN.md
