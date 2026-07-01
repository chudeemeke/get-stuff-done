# Memory-Nexus Milestone Scope Parser Fix

**Date:** 2026-07-01
**Status:** Resolved for runtime milestone selection and roadmap scope
**Scope:** Open GSD runtime parser override, compatibility helper, regression tests

## Problem

Memory-nexus had stale `STATE.md` frontmatter:

```yaml
milestone: v4.0
milestone_name: Intelligence Layer
```

but its body and ROADMAP both identified the current work as v5:

```text
**Milestone:** v5.0 Market-Leader Memory Platform
Phase: 42 (Dreaming Consolidation)
- IN PROGRESS **v5.0 Market-Leader Memory Platform**
```

Before this fix, the composed runtime selected the stale frontmatter first. `init execute-phase 42` returned `milestone_version: "v4.0"`, and `roadmap analyze` either missed v5 phases or leaked older v4 detail blocks into the active milestone analysis.

## Root Cause

`gsd-core/bin/lib/roadmap-parser.cjs` treated `STATE.md` frontmatter as authoritative and only fell back to active ROADMAP markers when frontmatter was absent. On memory-nexus, that conflicted with the explicit body/current roadmap truth.

A second parser shape mattered: memory-nexus uses a current milestone summary followed by a shared `## Phase Details` section. The v5 summary appears before old v4 details, so the current milestone slice had to filter detail blocks to the phase numbers declared by the current milestone summary.

## Fix

- Added `overrides/gsd-core/bin/lib/roadmap-parser.cjs` with `REASON.md`.
- Current milestone resolution now prefers:
  1. explicit `STATE.md` body milestone line,
  2. active/in-progress ROADMAP declaration,
  3. frontmatter as fallback.
- ROADMAP markers now include `ACTIVE`, `IN PROGRESS`, `WIP`, and `STARTED`.
- Shared `Phase Details` sections are filtered to the current milestone summary phase list.
- Compatibility `get-stuff-done/bin/lib/core.cjs` recognizes in-progress milestone declarations.

## Systems Check

- SRP: parsing responsibility stays in `roadmap-parser.cjs`; compatibility source gets only marker-recognition parity.
- OCP: new marker support is additive and falls back to existing frontmatter/legacy emoji paths.
- DIP/hexagonal boundary: no project-local memory-nexus mutation, no CLI special case, no dependence on memory-nexus file paths.
- Loose coupling / tight integration: `init`, `roadmap`, `state`, and `verify` continue to consume the parser module through the existing runtime seam.

## Verification

```powershell
node --check overrides\gsd-core\bin\lib\roadmap-parser.cjs
node scripts\check-overrides.js
bun run compose
bun test tests\core.test.cjs tests\runtime-overrides.test.cjs tests\roadmap.test.cjs tests\init.test.cjs tests\state.test.cjs
bun run lint
git diff --check
bun test
```

Results:

- Override freshness: 6 overrides checked, all fresh.
- Focused suite: 204 pass, 0 fail.
- Lint: exit 0 with existing 135 security warnings.
- Full suite: 1732 pass, 0 fail, 2410 `expect()` calls.

Real memory-nexus probes, using this branch's composed runtime:

```powershell
node dist\gsd-core\bin\gsd-tools.cjs --cwd C:\Projects\memory-nexus init execute-phase 42
node dist\gsd-core\bin\gsd-tools.cjs --cwd C:\Projects\memory-nexus roadmap analyze
node dist\gsd-core\bin\gsd-tools.cjs --cwd C:\Projects\memory-nexus validate health
```

Observed:

- `init execute-phase 42` now returns `milestone_version: "v5.0"` and `milestone_name: "Market-Leader Memory Platform"`.
- `roadmap analyze` now scopes to v5 phases only; no Phase 30/32.6 leakage remains.
- `roadmap analyze` reports `current_phase: "42"` and `next_phase: "42"`.
- `validate health` remains degraded because of separate project/config hygiene warnings, not because v5 phases are missing from ROADMAP.

## Remaining Debt

- Codex installer transaction/frontmatter crash remains open.
- Config key warning for `teams` remains open.
- Health still emits repeated stale historical `STATE.md` phase-reference warnings and should eventually group them with clearer remediation.
- Phase 41 Plan 04 real perf artifacts remain blocked on workflow registration and three-platform artifact capture.
