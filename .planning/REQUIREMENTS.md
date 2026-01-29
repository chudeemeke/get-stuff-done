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

- [ ] **STATUS-01**: Brand prefix `[GSD]` displayed in cyan
- [ ] **STATUS-02**: Separators `|` displayed in white
- [ ] **STATUS-03**: Model and CWD displayed (dim)
- [ ] **STATUS-04**: Dynamic thresholds calculated from autocompact config (x0.5, x0.75, x0.875)
- [ ] **STATUS-05**: Stage icons: none (green), warning (yellow), lightning (orange/red)
- [ ] **STATUS-06**: Icons match progress bar color
- [ ] **STATUS-07**: Red stage (icon + bar + %) blinks
- [ ] **STATUS-08**: Update notification on second line only when upstream has changes
- [ ] **STATUS-09**: Second line shows `updates available | /gsd:upstream`

### Update Commands

- [ ] **UPDATE-01**: `/gsd:update` checks private repo (chudeemeke) releases
- [ ] **UPDATE-02**: `/gsd:upstream` checks glittercowboy repo commits
- [ ] **UPDATE-03**: Upstream shows commit-level summary with file drill-down
- [ ] **UPDATE-04**: After upstream sync, prompt user to run `/gsd:update`
- [ ] **UPDATE-05**: Track last upstream sync (SHA + date) in cache file

### Configuration

- [ ] **CONFIG-01**: Support token-based autocompact (e.g., 100000 tokens)
- [ ] **CONFIG-02**: `bin/gsd` reads config and passes correct flag to claude
- [ ] **CONFIG-03**: Statusline reads same config for threshold calculations
- [ ] **CONFIG-04**: Single source of truth (`~/.gsd/config.json`)

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
| CONFIG-01 | Phase 1 | Pending |
| CONFIG-02 | Phase 1 | Pending |
| CONFIG-03 | Phase 1 | Pending |
| CONFIG-04 | Phase 1 | Pending |
| STATUS-01 | Phase 2 | Pending |
| STATUS-02 | Phase 2 | Pending |
| STATUS-03 | Phase 2 | Pending |
| STATUS-04 | Phase 2 | Pending |
| STATUS-05 | Phase 2 | Pending |
| STATUS-06 | Phase 2 | Pending |
| STATUS-07 | Phase 2 | Pending |
| STATUS-08 | Phase 2 | Pending |
| STATUS-09 | Phase 2 | Pending |
| INSTALL-01 | Phase 3 | Pending |
| INSTALL-02 | Phase 3 | Pending |
| INSTALL-03 | Phase 3 | Pending |
| INSTALL-04 | Phase 3 | Pending |
| BRAND-01 | Phase 4 | Pending |
| BRAND-02 | Phase 4 | Pending |
| BRAND-03 | Phase 4 | Pending |
| BRAND-04 | Phase 4 | Pending |
| BRAND-05 | Phase 4 | Pending |
| UPDATE-01 | Phase 5 | Pending |
| UPDATE-02 | Phase 5 | Pending |
| UPDATE-03 | Phase 5 | Pending |
| UPDATE-04 | Phase 5 | Pending |
| UPDATE-05 | Phase 5 | Pending |
| LOGO-01 | Phase 6 | Pending |
| LOGO-02 | Phase 6 | Pending |
| LOGO-03 | Phase 6 | Pending |
| LOGO-04 | Phase 6 | Pending |
| LOGO-05 | Phase 6 | Pending |

**Coverage:**
- v0.1.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
