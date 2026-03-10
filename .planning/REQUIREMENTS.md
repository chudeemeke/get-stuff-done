# Requirements: GetStuffDone v0.4.0 Platform Expansion

**Defined:** 2026-03-10
**Core Value:** Maintain upstream compatibility while establishing distinct identity

## v0.4.0 Requirements

Requirements for v0.4.0, ordered by execution priority: quality first, upstream sync second, multi-runtime polish third.

### Quality & Polish

- [ ] **QUAL-01**: Retroactive UAT for Phase 6 (Logo Assets) -- verify SVG/PNG assets render correctly, installer deploys them
- [ ] **QUAL-02**: Retroactive UAT for Phase 21 (Sync Intelligence) -- verify commit classification, supply chain scanning, severity-aware statusline
- [ ] **QUAL-03**: Retroactive UAT for Phase 22 (Advanced Sync Automation) -- verify selective sync filtering, dependency detection, AI conflict resolution
- [ ] **QUAL-04**: Fix claudeToGeminiTools ReferenceError in install.js:610 -- variable referenced but never defined
- [ ] **QUAL-05**: Add test coverage for 4 untested lib modules (config.cjs, frontmatter.cjs, template.cjs, core.cjs)

### Upstream Sync

- [ ] **SYNC-III-01**: Sync upstream commits v1.20.6 through v1.22.4 (~158 commits, 60 fixes, 23 features)
- [ ] **SYNC-III-02**: Resolve merge conflicts preserving fork identity (branding-map.json, scoped package name, fork URLs)
- [ ] **SYNC-III-03**: Post-sync test stabilization -- maintain 825+ tests passing at 95%+ coverage per metric
- [ ] **SYNC-III-04**: Absorb upstream multi-runtime code (Codex skills-first, OpenCode path detection, Gemini hook fixes)
- [ ] **SYNC-III-05**: Absorb upstream quality improvements (Nyquist validation, discuss-phase, agent frontmatter, state parsing fixes)
- [ ] **SYNC-III-06**: Absorb upstream Windows fixes (@file: protocol, toPosixPath, path separators)

### Multi-Runtime

- [ ] **RUNTIME-01**: Codex runtime installer support -- skills-first architecture, request_user_input mapping, multi-agent config
- [ ] **RUNTIME-02**: OpenCode runtime installer support -- correct config directory detection, flat command structure
- [ ] **RUNTIME-03**: Gemini runtime installer support -- AfterTool hook events, TOML conversion guard, agent conversion
- [ ] **RUNTIME-04**: Define and implement claudeToGeminiTools mapping in install.js (tool name translation table)
- [ ] **RUNTIME-05**: Multi-runtime branding pass -- fork identity (name, URLs, package references) applied per runtime
- [ ] **RUNTIME-06**: CI matrix expansion -- test installer for each supported runtime
- [ ] **RUNTIME-07**: Update documentation (README, help text) to reflect multi-runtime support

## Deferred (v0.5.0+)

- CLAUDE-06: Full agent teams orchestration for parallel phases
- PLAT-07: Interactive diff viewer
- PLAT-08: Multi-upstream support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing GSD's core workflow methodology | Adaptation, not rewrite |
| Removing .upstream/ directory | Needed for diffing/comparison |
| TypeScript migration | Adds build complexity for marginal benefit |
| Fast mode integration (CLAUDE-04) | Marginal benefit per CONTEXT.md |
| Bash-to-Claude-tools migration (CLAUDE-05) | Bash has valid advantages per CONTEXT.md |
| Auto-applying upstream updates | Destroys user control |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01 | Phase 24 | Pending |
| QUAL-02 | Phase 24 | Pending |
| QUAL-03 | Phase 24 | Pending |
| QUAL-04 | Phase 24 | Pending |
| QUAL-05 | Phase 24 | Pending |
| SYNC-III-01 | Phase 25 | Pending |
| SYNC-III-02 | Phase 25 | Pending |
| SYNC-III-03 | Phase 26 | Pending |
| SYNC-III-04 | Phase 25 | Pending |
| SYNC-III-05 | Phase 25 | Pending |
| SYNC-III-06 | Phase 25 | Pending |
| RUNTIME-01 | Phase 27 | Pending |
| RUNTIME-02 | Phase 27 | Pending |
| RUNTIME-03 | Phase 27 | Pending |
| RUNTIME-04 | Phase 27 | Pending |
| RUNTIME-05 | Phase 28 | Pending |
| RUNTIME-06 | Phase 28 | Pending |
| RUNTIME-07 | Phase 28 | Pending |

**Coverage:**
- v0.4.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
