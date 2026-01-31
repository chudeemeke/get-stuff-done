# Requirements: GetStuffDone Fork v0.1.0

**Defined:** 2026-01-28
**Core Value:** Maintain upstream compatibility while establishing distinct identity

## v0.1.0 Requirements

Requirements for initial fork release. Each maps to roadmap phases.

### Installation

- [ ] **INSTALL-01**: Installer creates file copies by default (industry standard)
- [ ] **INSTALL-02**: `--link` flag creates symlinks/junctions instead of copies (dev workflow)
- [ ] **INSTALL-03**: On Windows, `--link` uses junctions (no admin required)
- [ ] **INSTALL-04**: Re-running installer detects existing install type and matches it

### Branding

- [ ] **BRAND-01**: package.json points to chudeemeke/get-stuff-done
- [ ] **BRAND-02**: README references private repo (clone URL, footer, etc.)
- [ ] **BRAND-03**: Install message shows "Chude" or "AI Dev Environment" author
- [ ] **BRAND-04**: All URLs except upstream-check point to private repo
- [ ] **BRAND-05**: .upstream/ directory preserved unchanged for diffing

### Statusline

- [x] **STATUS-01**: Brand prefix `[GSD]` displayed in cyan
- [x] **STATUS-02**: Separators `|` displayed in white
- [x] **STATUS-03**: Model and CWD displayed (dim)
- [x] **STATUS-04**: Dynamic thresholds calculated from autocompact config (x0.5, x0.75, x0.875)
- [x] **STATUS-05**: Stage icons: none (green), warning (yellow), lightning (orange/red)
- [x] **STATUS-06**: Icons match progress bar color
- [x] **STATUS-07**: Red stage (icon + bar + %) blinks
- [x] **STATUS-08**: Update notification on second line only when upstream has changes
- [x] **STATUS-09**: Second line shows `updates available | /gsd:upstream`

### Update Commands

**`/gsd:upstream`** (maintainer workflow — syncs from original GSD):
- [ ] **UPSTREAM-01**: Pull commits from glittercowboy/get-shit-done since last sync
- [ ] **UPSTREAM-02**: Present commit-level summary with file drill-down
- [ ] **UPSTREAM-03**: Allow cherry-pick selection OR select ALL
- [ ] **UPSTREAM-04**: Apply selected changes to local project folder
- [ ] **UPSTREAM-05**: Commit and push to chudeemeke/get-stuff-done
- [ ] **UPSTREAM-06**: Publish to npm registry
- [ ] **UPSTREAM-07**: Show completion summary with "run `/gsd:update`" advice
- [ ] **UPSTREAM-08**: Track last sync SHA + date in cache file
- [ ] **UPSTREAM-09**: Skill file: `commands/gsd/upstream.md`
- [ ] **UPSTREAM-10**: Workflow file: `workflows/upstream-sync.md` (orchestrates existing agents: executor, verifier)

**`/gsd:update`** (consumer workflow — installs latest fork release):
- [ ] **UPDATE-01**: Check GitHub/npm for new version of chudeemeke/get-stuff-done
- [ ] **UPDATE-02**: Show changelog/release notes if available
- [ ] **UPDATE-03**: Run standard CLI update (works from Claude Code or terminal)
- [ ] **UPDATE-04**: Skill file: `commands/gsd/update.md`

### Configuration

- [x] **CONFIG-01**: Support percentage-based autocompact threshold (10-90%)
- [x] **CONFIG-02**: `bin/gsd` reads config and passes correct flag to claude
- [x] **CONFIG-03**: Statusline reads same config for threshold calculations
- [x] **CONFIG-04**: Single source of truth (`~/.gsd/config.json`)

### Logo/Assets

- [ ] **LOGO-01**: Isometric 3D rendering of interlocking squares icon
- [ ] **LOGO-02**: FYNORA-style layout (icon left, [GSD] top-right, Get*Stuff*Done below)
- [ ] **LOGO-03**: Colors: Cyan #5FD7D7, Green #87D787
- [ ] **LOGO-04**: Retro boxy/square monospace font
- [ ] **LOGO-05**: Bullet separators in text (Get*Stuff*Done)

## Future Requirements

Deferred to later milestones.

- **FUTURE-01**: Publish to npm under private/scoped package name
- **FUTURE-02**: CI/CD for automated releases
- **FUTURE-03**: Cross-platform testing (macOS, Linux)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Rewrite GSD core workflow | This is adaptation, not rewrite |
| Modify .upstream/ directory | Needed for diffing/comparison |
| Public npm publishing | Private use only |
| Change GSD command names | Maintain compatibility with docs/muscle memory |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONFIG-01 | Phase 1 | Complete |
| CONFIG-02 | Phase 1 | Complete |
| CONFIG-03 | Phase 1 | Complete |
| CONFIG-04 | Phase 1 | Complete |
| STATUS-01 | Phase 2 | Complete |
| STATUS-02 | Phase 2 | Complete |
| STATUS-03 | Phase 2 | Complete |
| STATUS-04 | Phase 2 | Complete |
| STATUS-05 | Phase 2 | Complete |
| STATUS-06 | Phase 2 | Complete |
| STATUS-07 | Phase 2 | Complete |
| STATUS-08 | Phase 2 | Complete |
| STATUS-09 | Phase 2 | Complete |
| INSTALL-01 | Phase 3 | Pending |
| INSTALL-02 | Phase 3 | Pending |
| INSTALL-03 | Phase 3 | Pending |
| INSTALL-04 | Phase 3 | Pending |
| BRAND-01 | Phase 4 | Pending |
| BRAND-02 | Phase 4 | Pending |
| BRAND-03 | Phase 4 | Pending |
| BRAND-04 | Phase 4 | Pending |
| BRAND-05 | Phase 4 | Pending |
| UPSTREAM-01 | Phase 5 | Pending |
| UPSTREAM-02 | Phase 5 | Pending |
| UPSTREAM-03 | Phase 5 | Pending |
| UPSTREAM-04 | Phase 5 | Pending |
| UPSTREAM-05 | Phase 5 | Pending |
| UPSTREAM-06 | Phase 5 | Pending |
| UPSTREAM-07 | Phase 5 | Pending |
| UPSTREAM-08 | Phase 5 | Pending |
| UPSTREAM-09 | Phase 5 | Pending |
| UPSTREAM-10 | Phase 5 | Pending |
| UPDATE-01 | Phase 5 | Pending |
| UPDATE-02 | Phase 5 | Pending |
| UPDATE-03 | Phase 5 | Pending |
| UPDATE-04 | Phase 5 | Pending |
| LOGO-01 | Phase 6 | Pending |
| LOGO-02 | Phase 6 | Pending |
| LOGO-03 | Phase 6 | Pending |
| LOGO-04 | Phase 6 | Pending |
| LOGO-05 | Phase 6 | Pending |

**Coverage:**
- v0.1.0 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-31 — Phase 2 Statusline requirements complete*
