# Roadmap: GetStuffDone

## Milestones

- ✅ **v0.1.0 GetStuffDone Fork** — Phases 1-6 (shipped 2026-02-05)
- ✅ **v0.2.0 Hardening & Upstream Sync** — Phases 7-17 (shipped 2026-02-21)
- ✅ **v0.3.0 Upstream Sync & Workflow Maturity** — Phases 18-23 (shipped 2026-03-08)
- ⚫ **v0.4.0 Platform Expansion** — Phases 24-28 (superseded by v1.0.0)
- ✅ **v1.0.0 Overlay Architecture** — Phases 29-36 (shipped 2026-03-31)
- 🚧 **v1.1.0 Installer & Deployment Hardening** — Phases 37-40 (in progress)

## Phases

<details>
<summary>✅ v0.1.0 GetStuffDone Fork (Phases 1-6) — SHIPPED 2026-02-05</summary>

See: .planning/milestones/v0.1.0-ROADMAP.md

</details>

<details>
<summary>✅ v0.2.0 Hardening & Upstream Sync (Phases 7-17) — SHIPPED 2026-02-21</summary>

See: .planning/milestones/v0.2.0-ROADMAP.md

</details>

<details>
<summary>✅ v0.3.0 Upstream Sync & Workflow Maturity (Phases 18-23) — SHIPPED 2026-03-08</summary>

See: .planning/milestones/v0.3.0-ROADMAP.md

</details>

<details>
<summary>⚫ v0.4.0 Platform Expansion (Phases 24-28) — SUPERSEDED</summary>

Superseded by v1.0.0 overlay architecture. See: .planning/milestones/v1.0.0-ROADMAP.md for context.

</details>

<details>
<summary>✅ v1.0.0 Overlay Architecture (Phases 29-36) — SHIPPED 2026-03-31</summary>

See: .planning/milestones/v1.0.0-ROADMAP.md

- [x] Phase 29: Prototype Gate (1/1 plans) — completed 2026-03-28
- [x] Phase 30: Composition Pipeline & Branding (3/3 plans) — completed 2026-03-28
- [x] Phase 31: Feature Flags & Override System (3/3 plans) — completed 2026-03-29
- [x] Phase 32: Fork Code Port (3/3 plans) — completed 2026-03-29
- [x] Phase 33: Installer & Update Workflow (2/2 plans) — completed 2026-03-29
- [x] Phase 34: Testing & CI Enforcement (4/4 plans) — completed 2026-03-30
- [x] Phase 35: Migration & Ship v3.0.0 (3/3 plans) — completed 2026-03-31
- [x] Phase 36: v1.0.0 Gap Closure (2/2 plans) — completed 2026-03-31

</details>

### v1.1.0 Installer & Deployment Hardening (In Progress)

**Milestone Goal:** Fix the installer/deployment pipeline so the fork installs correctly, deploys its enhanced statusline globally, and passes all tests cleanly.

- [x] **Phase 37: Installer Safety** - Manifest-driven cleanup and v2 detection hardening (completed 2026-04-02)
- [x] **Phase 38: Statusline Deployment** - Composition pipeline deploys enhanced statusline globally with timeout safety (completed 2026-04-03)
- [x] **Phase 39: Test Health & CI** - Fix pre-existing test failures and add upstream version check (completed 2026-04-03)
- [ ] **Phase 40: Cleanup & Verification** - Archive stale artifacts and verify zero test failures

## Phase Details

### Phase 37: Installer Safety
**Goal**: Installer safely handles user content during install/uninstall without false-positive v2 detection
**Depends on**: Nothing (first phase of v1.1.0)
**Requirements**: INST-01, INST-02, INST-03
**Success Criteria** (what must be TRUE):
  1. Running installer with user-created files present in the target directory does not delete or overwrite those files
  2. `detectV2()` returns false on a directory that was installed via the overlay architecture (no false-positive triggering of v2 cleanup)
  3. `uninstall()` removes only files listed in the install manifest, leaving all other files intact
**Plans:** 2/2 plans complete

Plans:
- [x] 37-01-PLAN.md -- Extract safety function exports and write comprehensive unit tests for INST-01/02/03
- [x] 37-02-PLAN.md -- Gap closure: path traversal hardening, uninstall() export/tests, side-effect verification

### Phase 38: Statusline Deployment
**Goal**: Fork's enhanced statusline is deployed globally and works reliably across projects
**Depends on**: Phase 37
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):
  1. After installation, `~/.claude/hooks/gsd-statusline.js` contains the fork's enhanced statusline (not upstream's 119-line base)
  2. `~/.claude/settings.json` includes the `statusLine` setting pointing to the deployed hook
  3. Running `git fetch` from a repo with a slow/unreachable remote does not hang the statusline (returns within 3 seconds)
  4. Opening a non-GSD project in Claude Code shows a working statusline without errors
**Plans:** 2/2 plans complete

Plans:
- [x] 38-01-PLAN.md -- Move hooks to overlay, fix timeouts, update compose/test paths (STAT-01, STAT-03)
- [x] 38-02-PLAN.md -- Installer statusLine wiring and non-GSD project verification (STAT-02, STAT-04)

### Phase 39: Test Health & CI
**Goal**: Pre-existing test failures are fixed and CI can detect upstream version drift
**Depends on**: Phase 38
**Requirements**: TEST-01, TEST-02, TEST-03, CI-01
**Success Criteria** (what must be TRUE):
  1. `validate-configs.test.js` passes when run against the actual `.planning/config.json` without schema errors
  2. `sync.test.cjs` timeout tests pass reliably on Windows without flaky failures
  3. `hooks.test.js` maintainer path test completes within its timeout on Windows
  4. CI workflow detects when the upstream npm registry has a newer version than the pinned version in package.json
**Plans:** 3/3 plans complete

Plans:
- [x] 39-01-PLAN.md -- Schema parity fix: add _auto_chain_active to schema, add drift detection test (TEST-01)
- [x] 39-02-PLAN.md -- Timeout infrastructure: central constants, apply to sync/hooks tests (TEST-02, TEST-03)
- [x] 39-03-PLAN.md -- Upstream version throttle: 7-day cache in gsd-check-update.js (CI-01)

### Phase 40: Cleanup & Verification
**Goal**: Stale artifacts removed and full test suite passes with zero failures
**Depends on**: Phase 39
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, TEST-04
**Success Criteria** (what must be TRUE):
  1. Debug session directories (progress-bar-blink, progress-bar-color-threshold) are archived, not present in working tree
  2. Phase 24 unexecuted plans and handoff files (.continue-here.md, whats-next.md) are removed from the repository
  3. PROJECT.md deferred list no longer references PLAT-07 or PLAT-08
  4. `bun test` completes with 0 failures across the entire test suite
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 37 -> 38 -> 39 -> 40

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v0.1.0 | 12/12 | Complete | 2026-02-05 |
| 7-17 | v0.2.0 | 32/32 | Complete | 2026-02-21 |
| 18-23 | v0.3.0 | 17/17 | Complete | 2026-03-08 |
| 24-28 | v0.4.0 | - | Superseded | - |
| 29-36 | v1.0.0 | 21/21 | Complete | 2026-03-31 |
| 37. Installer Safety | v1.1.0 | 2/2 | Complete    | 2026-04-02 |
| 38. Statusline Deployment | v1.1.0 | 2/2 | Complete    | 2026-04-03 |
| 39. Test Health & CI | v1.1.0 | 3/3 | Complete    | 2026-04-03 |
| 40. Cleanup & Verification | v1.1.0 | 0/? | Not started | - |
