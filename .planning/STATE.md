---
gsd_state_version: 1.0
milestone: v1.2.0
milestone_name: Ship-Ready Hardening
status: "Phase 40.6 INSERTED for upstream authority migration. Phase 40.5 reached Wave 4 evidence on legacy `get-shit-done-cc@1.39.1`, but Wave 5's legacy upstream-filing path is superseded by live upstream discovery: old TACHES/GSD package is no longer the right authority; Open GSD `@opengsd/gsd-core@1.5.0` is the migration target. Execute/review Phase 40.6 before Phase 41 or any old Wave 5 filing."
stopped_at: "2026-06-22 upstream authority pivot. Live npm/GitHub evidence: `get-shit-done-cc` latest is 1.42.3 and still maintained on npm only by glittercowboy; legacy repo is `gsd-build/get-shit-done`; successor Open GSD package `@opengsd/gsd-core` latest stable is 1.5.0 with active `open-gsd/gsd-core` development and different bin/source layout. Next: review Phase 40.6 plan artifacts, then execute Phase 40.6 before returning to Phase 40.5 closure or Phase 41."
last_updated: "2026-06-22T22:05:56.2133667+01:00"
last_activity: 2026-06-22 -- Phase 40.6 upstream authority migration inserted; roadmap/requirements/project/resume surfaces updated
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 9
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Get upstream improvements automatically while preserving fork identity and additions
**Current focus:** v1.2.0 Ship-Ready Hardening -- Phase 40.6 upstream authority migration inserted; review/execute it before Phase 41

## Current Position

Phase: Phase 40.6 (INSERTED, plan artifacts pending review) -- Upstream Authority Migration
Plan: 4 plans complete (40.6-01 through 40.6-04) once this insertion patch lands; must be reviewed before implementation
Status: Phase 40.5 Wave 1-4 work exists in this branch, but its Wave 5 legacy filing path is superseded. Phase 40.6 now owns the upstream-authority decision, Open GSD package-layout spike, tooling migration, verification, and Phase 41 readiness reset. Do not run old `/gsd:execute-phase 40.5` blindly.
Last activity: 2026-06-22 -- live upstream status checked and Phase 40.6 inserted as a blocking pre-Phase-41 migration phase

**Upstream state:** Active worktree currently pins legacy `get-shit-done-cc@1.39.1`. Live npm/GitHub evidence on 2026-06-22 shows legacy `get-shit-done-cc` latest `1.42.3` plus `next=1.43.0-rc2` / canary tags, but Open GSD `@opengsd/gsd-core@1.5.0` is the stable successor target. `@opengsd/get-shit-done-redux@1.1.0` is deprecated in favor of `@opengsd/gsd-core`. Open GSD package layout is not drop-in: no `gsd-sdk` bin in core, source root is package-specific, and compose/override tooling must be migrated deliberately.

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

### Roadmap Evolution

- Phase 40.5 inserted after Phase 40: Upstream bump 1.34.2 -> 1.38.2 and Phase 41 decision re-verification. (INSERTED 2026-04-22 URGENT). User chose bump-first ordering over plan-now-with-bump-in-Wave-0 to verify Phase 41 decisions against fresh upstream state before planning. UPGRADE-10 requirement added (Phase 40.5); UPGRADE-05 reworded to preserve dogfood-bump timing semantics (Phase 43); backlog 999.3 captured (conditional upstream regex-fix PR filing, only if bug still present on clean 1.38.2).
- Phase 40.6 inserted after Phase 40.5: Upstream authority migration from `get-shit-done-cc` / `gsd-build/get-shit-done` to Open GSD `@opengsd/gsd-core` / `open-gsd/gsd-core`. (INSERTED 2026-06-22). This supersedes Phase 40.5 Wave 5's legacy upstream filing path and blocks Phase 41 until compose/override/update tooling is verified against Open GSD layout.

### Carried Forward Tech Debt

- 48 boundary violations (structural, informational CI)
- ~130 upstream compat failures (branding diffs, informational CI)
- preview-update.js ~5% uncovered I/O paths (documented exception)
- INST-04 uninstall manifest gap (overlay files not tracked in upstream manifest)
- Intermittent Windows subprocess timeout flakiness (targeted for root-cause in Phase 41 via REL-02)
- Config schema drift -- 8 unknown config.json keys flagged by gsd-tools; tracked as backlog 999.2 with 80% investigation done and Option C (namespace under features.*) recommended
- `_auto_chain_active` schema key (RESOLVED -- fork-specific, fixed in Phase 39 schema)
- Codex `extractFrontmatterField` crash (RESOLVED -- fork-specific, 4 oversight agents had heading before frontmatter)

### Pending Todos

None.

### Blockers/Concerns

Phase 40.6 plan review is required before implementation. Old Phase 40.5 Wave 5 must not file or patch against legacy upstream until Phase 40.6 decides whether any legacy filing still has value.

## Session Continuity

Last session: 2026-06-22 (upstream status review + Phase 40.6 insertion).
Resumed: 2026-06-22 -- user approved taking project lead and routing all project work through GSD.
Stopped at: Phase 40.6 inserted and ready for external review, then execution. Next: `/gsd:review --phase 40.6 --all` followed by `/gsd:execute-phase 40.6` if review clears or is amended.
Resume file: .planning/phases/40.6-upstream-authority-migration/40.6-CONTEXT.md
