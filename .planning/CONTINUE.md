# Continuation Context

**Refreshed at:** 2026-07-01
**Trigger:** Phase 41 Plan 04 local implementation blocked at real baseline capture

## Resume Instructions

1. Read `.planning/STATE.md` first. It is the authoritative resume pointer.
2. Read `.planning/phases/41-foundation-flip-gate-install-audit-surface-windows-slo/41-04-PLAN.md`.
3. Read `.planning/phases/41-foundation-flip-gate-install-audit-surface-windows-slo/41-04-SUMMARY.md`.
4. Continue Phase 41 Wave 2 using Open GSD evidence.
5. Do not run the old Phase 40.5 Wave 5 legacy filing path. It is retired unless a future reviewed plan creates a new Open GSD-specific filing path.

## Last Known State

**Milestone:** v1.2.0 Ship-Ready Hardening

**Phase:** 41 -- Foundation: Flip Gate, Install Audit Surface, Windows SLO

**Status:** Phase 41 Wave 2 active. Plans 01, 02, 03, and 05 are verified; Plan 04 local harness/workflow is implemented but blocked at real three-platform artifact capture.

**Current code state:** Active worktree pins Open GSD `@opengsd/gsd-core@1.5.0`. Legacy `get-shit-done-cc` is retained only as historical/deprecation evidence. Package smoke for packed `@chude/get-stuff-done@3.0.2` passed, the boundary checker still reports 41 structural root-mirror violations as explicit debt, Plan 05 migrated the high-volume subprocess test files to the central timeout helper, Plan 03 added blocking security scanner CI jobs plus OSV triage, and Plan 04 added perf schemas/scripts plus a manual capture workflow.

**Next concrete action:** Resolve the Plan 04 workflow-registration decision:

- Fast-forward/register `.github/workflows/perf-baseline.yml` on `origin/main`, then run `gh workflow run perf-baseline.yml --ref worktree-agent-a1c0cd52236103329 --repo chudeemeke/get-stuff-done`.
- Download the artifacts, merge real linux/macos/windows outputs, and commit `perf-baseline.json` plus `.planning/perf/test-timing.json`.

Do not resume Phase 40.5 Wave 5 legacy filing.

## Phase 40.6 Plans

- `40.6-01-PLAN.md` -- authority ADR and package/source contract
- `40.6-02-PLAN.md` -- isolated Open GSD package layout spike
- `40.6-03-PLAN.md` -- implement upstream identity abstraction and migrate tooling
- `40.6-04-PLAN.md` -- verification, legacy-reference audit, and Phase 41 readiness reset

## Phase 41 Plans

- `41-01-PLAN.md` -- Wave 1: blocking override gate and changelog conflict guard (complete)
- `41-02-PLAN.md` -- Wave 1: audit suppressions, security policy, and maintenance sections (complete)
- `41-05-PLAN.md` -- Wave 1: subprocess timeout helper and high-volume Windows-prone test migration (complete)
- `41-03-PLAN.md` -- Wave 2: security scanner CI surface and OSV triage (complete)
- `41-04-PLAN.md` -- Wave 2: perf baseline harness, schemas, workflow, and real three-platform capture protocol (blocked at real artifact capture)
- `41-06-PLAN.md` -- Wave 3: remaining subprocess migration and Windows flake telemetry
- `41-07-PLAN.md` -- Wave 4: 10x validation, flake maintenance, and D-11/REL-03 closure discipline

## Tripwires

- Do not use `get-shit-done-cc@latest` as a normal bump target. It is now legacy evidence, not active authority.
- Do not dynamically track Open GSD `latest` or `next`; pin a reviewed stable version.
- Do not assume `@opengsd/gsd-core` has the old `get-shit-done-cc` layout or bins.
- Do not patch global GSD installs while debugging this. Work in the repo/worktree and use temp package-layout spikes. Note: one earlier `bun install` did trigger the package installer; record this as a verification breach and mitigation.
- Do not file new upstream work against `gsd-build/get-shit-done` from stale Phase 40.5 instructions.
- Phase 41 perf and 10x workflows are `workflow_dispatch`; first run requires default-branch workflow registration before `gh workflow run ... --ref ...`.
- Do not fabricate missing Linux/macOS/Windows perf or test-timing baseline numbers.
- `perf-baseline.json` and `.planning/perf/test-timing.json` are intentionally absent until real workflow artifacts exist.
- First CI run for Plan 03 must record gitleaks action license behavior and harden-runner audit artifact shape; local verification could not observe those action-only surfaces.
- Current coverage command exits 0 but aggregate metrics remain below the user's 95% per-metric standard (`94.86%` functions, `93.08%` lines on 2026-07-01).

## Active Independent Work

- Phase 40.5 Wave 1-4 evidence exists in this branch and remains useful as legacy-baseline evidence.
- Phase 40.5 Wave 5 legacy filing path is retired. Any future filing must be Open GSD-specific and planned separately.
- Phase 40.6 verification files are the authoritative closeout: `40.6-VERIFICATION.md`, `40.6-README.md`, and `40.6-04-SUMMARY.md`.

---

This file is a human-readable companion to `STATE.md`; `STATE.md` remains authoritative.
