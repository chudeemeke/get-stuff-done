---
gsd_state_version: 1.0
milestone: v1.2.0
milestone_name: Ship-Ready Hardening
status: "Phase 41 EXECUTING. Wave 2 active: first repaired PR CI run is green; boundary/action/runtime/macOS/gitleaks hygiene is remote-verified; GSD routing/progress-accounting self-fix is locally verified; Plan 04 real perf artifacts remain blocked on default-branch workflow registration."
stopped_at: "2026-07-01 GSD routing/progress-accounting hotfix verified; Phase 41 Plan 04 still needs a decision on default-branch workflow registration, dispatch against the Phase 41 ref, and merge/commit of real perf artifacts."
last_updated: "2026-07-01T19:34:53+01:00"
last_activity: 2026-07-01 -- GSD self-routing/progress-accounting hotfix verified; Plan 04 perf artifact capture still blocked
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 16
  completed_plans: 8
  planned_plans: 3
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Get upstream improvements automatically while preserving fork identity and additions
**Current focus:** v1.2.0 Ship-Ready Hardening -- Phase 41 Wave 2 execution against Open GSD authority

## Current Position

Phase: Phase 41 (executing) -- Foundation: Flip Gate, Install Audit Surface, Windows SLO
Plan: 4 of 7 complete; Wave 2 active; CI repair and hygiene cleanup remote-verified; GSD routing/progress-accounting hotfix verified; 41-04 is blocked at real baseline capture
Status: Continue Wave 2 against Open GSD authority; resolve Plan 04 workflow-registration blocker before marking PERF-01/PERF-02 complete
Last activity: 2026-07-01 -- GSD self-routing/progress-accounting hotfix verified; Plan 04 perf artifact capture still blocked

**Upstream state:** Active worktree now pins Open GSD `@opengsd/gsd-core@1.5.0`. Legacy `get-shit-done-cc` remains deprecation evidence only; it is not the active bump target and must not be used as `latest` authority. `@opengsd/get-shit-done-redux@1.1.0` is deprecated in favor of `@opengsd/gsd-core`. Open GSD package layout is not drop-in: no `gsd-sdk` bin in core, source root is package-specific, and compose/override/update tooling now routes through the upstream-authority helper.

## Performance Metrics

**Velocity:**

- Total plans completed: 90 (across v0.1.0-v1.1.0)
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

### Roadmap Evolution

- Phase 40.5 inserted after Phase 40: Upstream bump 1.34.2 -> 1.38.2 and Phase 41 decision re-verification. (INSERTED 2026-04-22 URGENT). User chose bump-first ordering over plan-now-with-bump-in-Wave-0 to verify Phase 41 decisions against fresh upstream state before planning. UPGRADE-10 requirement added (Phase 40.5); UPGRADE-05 reworded to preserve dogfood-bump timing semantics (Phase 43); backlog 999.3 captured (conditional upstream regex-fix PR filing, only if bug still present on clean 1.38.2).
- Phase 40.6 inserted after Phase 40.5: Upstream authority migration from `get-shit-done-cc` / `gsd-build/get-shit-done` to Open GSD `@opengsd/gsd-core` / `open-gsd/gsd-core`. (INSERTED 2026-06-22). This supersedes Phase 40.5 Wave 5's legacy upstream filing path and blocks Phase 41 until compose/override/update tooling is verified against Open GSD layout.

### Carried Forward Tech Debt

- 41 boundary violations (structural, informational CI)
- Historical ~130 upstream compat failures (branding diffs, informational CI). After active-authority repair, local Windows compat runner reports 11 failures; keep linux/macos/windows baseline thresholds unchanged until PR matrix evidence exists.
- preview-update.js ~5% uncovered I/O paths (documented exception)
- INST-04 uninstall manifest gap (overlay files not tracked in upstream manifest)
- Intermittent Windows subprocess timeout flakiness (advanced in Phase 41 Plan 05; remaining subprocess surface and telemetry targeted by Plans 06-07 via REL-02/REL-01)
- First GitHub Actions run showed `gitleaks/gitleaks-action@v2` needs `GITHUB_TOKEN` for pull_request scans and OSV `@v2` is not a resolvable tag. The repaired PR run `28533068807` passed all CI jobs. Boundary report-only cleanup was remote-verified by run `28534255286`; first-party action/runtime and `macos-latest` annotation cleanup was remote-verified by run `28534944081`. The docs reconciliation run `28535445005` passed but surfaced the remaining `gitleaks/gitleaks-action@v2` Node 20 annotation; `gitleaks/gitleaks-action@v3` cleanup was remote-verified by run `28536087964`.
- Aggregate coverage remains below the user's 95% per-metric standard even though the current repo command exits 0 (`bun test --coverage`: 94.86% functions, 93.08% lines on 2026-07-01).
- Phase 41 Plan 04 implemented perf schemas, scripts, package commands, and a `workflow_dispatch` manual capture workflow, but `perf-baseline.json` and `.planning/perf/test-timing.json` remain intentionally absent until real Linux/macOS/Windows artifacts are captured from the registered default-branch workflow.
- 2026-07-01 inbox triage fix closed the confirmed authkey `roadmap update-plan-progress` wrong-checkbox/CRLF issue and medesine-rx false-100% progress issue in code and tests. Memory-nexus installer crash and health v5/decimal roadmap drift remain open inbox items; they were not part of this hotfix slice.
- Config schema drift -- 8 unknown config.json keys flagged by gsd-tools; tracked as backlog 999.2 with 80% investigation done and Option C (namespace under features.*) recommended
- `_auto_chain_active` schema key (RESOLVED -- fork-specific, fixed in Phase 39 schema)
- Codex `extractFrontmatterField` crash (RESOLVED -- fork-specific, 4 oversight agents had heading before frontmatter)

### Pending Todos

None.

### Blockers/Concerns

Boundary checker still reports 41 structural root-mirror violations as known debt, but CI now reports it through `--report-only` plus the blocking debt ratchet instead of a failed-step annotation. This is known v1.2 debt, not hidden. Old Phase 40.5 Wave 5 must not file or patch against legacy upstream; it is retired unless a future reviewed plan creates a new Open GSD-specific filing path. Phase 41 Plan 04 is blocked on workflow registration and real three-platform artifact capture; do not fabricate missing platform numbers. The root inbox still has open memory-nexus reports to triage after the current GSD routing/progress fix lands.

## Session Continuity

Last session: 2026-07-01 (GSD routing/progress-accounting hotfix verified; CI repair and hygiene cleanup remote-verified; Plan 04 artifact capture still blocked).
Resumed: 2026-06-22 -- user approved taking project lead and routing all project work through GSD.
Stopped at: GSD self-routing/progress-accounting hotfix is verified locally; Phase 41 Plan 04 remains blocked at default-branch workflow registration and real artifact capture.
Resume file: .planning/phases/41-foundation-flip-gate-install-audit-surface-windows-slo/41-CONTEXT.md
