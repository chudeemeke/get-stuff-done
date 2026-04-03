# Requirements: GetStuffDone v1.1.0 Installer & Deployment Hardening

**Defined:** 2026-04-02
**Core Value:** Get upstream improvements automatically while preserving fork identity and additions

## v1.1.0 Requirements

Requirements for the hardening milestone. Fixes installer safety, statusline deployment, test health, and CI.

### Installer Safety

- [x] **INST-01**: Installer manifest-driven cleanup passes end-to-end test (install with user content present, verify nothing deleted)
- [x] **INST-02**: `detectV2()` does not false-positive on overlay-installed `src/` directories
- [x] **INST-03**: `uninstall()` uses manifest-driven `removeGsdFiles()` and removes only GSD-owned files

### Statusline Deployment

- [x] **STAT-01**: Composition pipeline deploys fork's enhanced statusline to `~/.claude/hooks/gsd-statusline.js` (replacing upstream's 119-line base)
- [x] **STAT-02**: Installer wires `statusLine` setting into global `~/.claude/settings.json`
- [x] **STAT-03**: Statusline `git fetch` has a timeout (max 3s) with graceful fallback on timeout/error
- [x] **STAT-04**: Statusline displays correctly in non-GSD projects (verified in at least one other project)

### Test Health

- [x] **TEST-01**: `validate-configs.test.js` passes against real `.planning/config.json` (schema updated to match actual config structure)
- [x] **TEST-02**: `sync.test.cjs` flaky timeout tests pass reliably on Windows (per-test timeout increased)
- [x] **TEST-03**: `hooks.test.js` maintainer path test passes reliably on Windows (timeout increased)
- [ ] **TEST-04**: Full test suite achieves 0 failures (`bun test` shows 0 fail)

### CI Improvements

- [x] **CI-01**: Automated check flags when upstream publishes a new version (compare pinned vs npm registry latest)

### Artifact Cleanup

- [ ] **CLEAN-01**: Stale debug sessions archived (progress-bar-blink, progress-bar-color-threshold)
- [ ] **CLEAN-02**: Phase 24 unexecuted plans (24-01, 24-02) archived with superseded v0.4.0
- [ ] **CLEAN-03**: `.continue-here.md` and `whats-next.md` deleted (consumed/superseded)
- [ ] **CLEAN-04**: PLAT-07 and PLAT-08 removed from PROJECT.md deferred list (already done)

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Parallel Execution

- **CLAUDE-06**: Safe parallel phase execution with artifact isolation -- worktree approach has shared artifact conflicts (STATE.md, ROADMAP.md, config.json). Reframed from original "agent teams orchestration."

### Tech Debt (Carried Forward from v1.0.0)

These are acknowledged, non-blocking items. Not targeted for fix but documented to prevent loss on milestone archive.

- 48 boundary violations (structural -- overlay files not in overrides/, CI informational)
- ~130 upstream compat failures (branding diffs by design, CI informational)
- preview-update.js ~5% uncovered I/O paths (documented exception)
- `_auto_chain_active` schema key (upstream GSD tooling bug, awaiting upstream fix)
- Codex `extractFrontmatterField` crash (upstream bug, awaiting upstream fix)
- sync-preview CLI timeout on Windows (re-evaluate on desktop)

## Out of Scope

| Feature | Reason |
|---------|--------|
| PLAT-07 Interactive diff viewer | No longer relevant -- overlay model eliminates cherry-pick workflow |
| PLAT-08 Multi-upstream support | GSD-2 is a different product category (standalone agent), not a second upstream |
| Upstream bug fixes (_auto_chain_active, Codex crash) | Upstream code, not fork code -- violates overlay model to modify |
| Boundary violation reduction | Structural to overlay architecture, informational CI only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 37 | Complete |
| INST-02 | Phase 37 | Complete |
| INST-03 | Phase 37 | Complete |
| STAT-01 | Phase 38 | Complete |
| STAT-02 | Phase 38 | Complete |
| STAT-03 | Phase 38 | Complete |
| STAT-04 | Phase 38 | Complete |
| TEST-01 | Phase 39 | Complete |
| TEST-02 | Phase 39 | Complete |
| TEST-03 | Phase 39 | Complete |
| TEST-04 | Phase 40 | Pending |
| CI-01 | Phase 39 | Complete |
| CLEAN-01 | Phase 40 | Pending |
| CLEAN-02 | Phase 40 | Pending |
| CLEAN-03 | Phase 40 | Pending |
| CLEAN-04 | Phase 40 | Pending |

**Coverage:**
- v1.1.0 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
