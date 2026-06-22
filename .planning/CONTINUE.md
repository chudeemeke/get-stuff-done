# Continuation Context

**Refreshed at:** 2026-06-22
**Trigger:** Phase 40.6 upstream authority migration insertion

## Resume Instructions

1. Read `.planning/STATE.md` first. It is the authoritative resume pointer.
2. Read `.planning/phases/40.6-upstream-authority-migration/40.6-CONTEXT.md`.
3. Review the four Phase 40.6 plans before implementation: `40.6-01-PLAN.md` through `40.6-04-PLAN.md`.
4. Do not run the old Phase 40.5 Wave 5 legacy filing path unless Phase 40.6 explicitly re-authorizes it.

## Last Known State

**Milestone:** v1.2.0 Ship-Ready Hardening

**Phase:** 40.6 -- Upstream Authority Migration

**Status:** Inserted 2026-06-22 after live upstream review showed the legacy `get-shit-done-cc` / `gsd-build/get-shit-done` authority assumption is no longer safe for market-ready v1.2.0 work.

**Current code state:** Active worktree pins `get-shit-done-cc@1.39.1`. The migration target is Open GSD `@opengsd/gsd-core@1.5.0` as of 2026-06-22 evidence. The package layout is not drop-in.

**Next concrete action:** `/gsd:review --phase 40.6 --all`, then `/gsd:execute-phase 40.6` after review amendments.

## Phase 40.6 Plans

- `40.6-01-PLAN.md` -- authority ADR and package/source contract
- `40.6-02-PLAN.md` -- isolated Open GSD package layout spike
- `40.6-03-PLAN.md` -- implement upstream identity abstraction and migrate tooling
- `40.6-04-PLAN.md` -- verification, legacy-reference audit, and Phase 41 readiness reset

## Tripwires

- Do not use `get-shit-done-cc@latest` as a normal bump target. It is now legacy evidence, not active authority.
- Do not dynamically track Open GSD `latest` or `next`; pin a reviewed stable version.
- Do not assume `@opengsd/gsd-core` has the old `get-shit-done-cc` layout or bins.
- Do not patch global GSD installs while debugging this. Work in the repo/worktree and use temp package-layout spikes.
- Do not file new upstream work against `gsd-build/get-shit-done` from stale Phase 40.5 instructions until Phase 40.6 decides whether legacy filing is still useful.

## Active Independent Work

- Phase 40.5 Wave 1-4 evidence exists in this branch and remains useful as legacy-baseline evidence.
- Phase 40.5 Wave 5 is superseded until Phase 40.6 re-establishes authority and resets Phase 41 readiness.

---

This file is a human-readable companion to `STATE.md`; `STATE.md` remains authoritative.
