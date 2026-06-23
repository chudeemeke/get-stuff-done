# Continuation Context

**Refreshed at:** 2026-06-23
**Trigger:** Phase 40.6 upstream authority migration completion

## Resume Instructions

1. Read `.planning/STATE.md` first. It is the authoritative resume pointer.
2. Read `.planning/phases/40.6-upstream-authority-migration/40.6-VERIFICATION.md`.
3. Proceed to Phase 41 planning/execution using Open GSD evidence.
4. Do not run the old Phase 40.5 Wave 5 legacy filing path. It is retired unless a future reviewed plan creates a new Open GSD-specific filing path.

## Last Known State

**Milestone:** v1.2.0 Ship-Ready Hardening

**Phase:** 40.6 -- Upstream Authority Migration

**Status:** Phase 40.6 complete. Implementation migrated active authority from legacy `get-shit-done-cc` / `gsd-build/get-shit-done` to Open GSD.

**Current code state:** Active worktree pins Open GSD `@opengsd/gsd-core@1.5.0`. Legacy `get-shit-done-cc` is retained only as historical/deprecation evidence. Package smoke for packed `@chude/get-stuff-done@3.0.2` passed, and the boundary checker still reports 41 structural root-mirror violations as explicit debt.

**Next concrete action:** Commit Phase 40.6 if not yet committed, then plan/execute Phase 41 from Open GSD authority. Do not resume Phase 40.5 Wave 5 legacy filing.

## Phase 40.6 Plans

- `40.6-01-PLAN.md` -- authority ADR and package/source contract
- `40.6-02-PLAN.md` -- isolated Open GSD package layout spike
- `40.6-03-PLAN.md` -- implement upstream identity abstraction and migrate tooling
- `40.6-04-PLAN.md` -- verification, legacy-reference audit, and Phase 41 readiness reset

## Tripwires

- Do not use `get-shit-done-cc@latest` as a normal bump target. It is now legacy evidence, not active authority.
- Do not dynamically track Open GSD `latest` or `next`; pin a reviewed stable version.
- Do not assume `@opengsd/gsd-core` has the old `get-shit-done-cc` layout or bins.
- Do not patch global GSD installs while debugging this. Work in the repo/worktree and use temp package-layout spikes. Note: one earlier `bun install` did trigger the package installer; record this as a verification breach and mitigation.
- Do not file new upstream work against `gsd-build/get-shit-done` from stale Phase 40.5 instructions.

## Active Independent Work

- Phase 40.5 Wave 1-4 evidence exists in this branch and remains useful as legacy-baseline evidence.
- Phase 40.5 Wave 5 legacy filing path is retired. Any future filing must be Open GSD-specific and planned separately.
- Phase 40.6 verification files are the authoritative closeout: `40.6-VERIFICATION.md`, `40.6-README.md`, and `40.6-04-SUMMARY.md`.

---

This file is a human-readable companion to `STATE.md`; `STATE.md` remains authoritative.
