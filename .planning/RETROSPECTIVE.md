# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0.0 — Overlay Architecture

**Shipped:** 2026-03-31
**Phases:** 8 | **Plans:** 21 | **Timeline:** 4 days (2026-03-28 → 2026-03-31)

### What Was Built
- Overlay architecture replacing direct-edit fork model — upstream consumed as npm devDependency, composed at publish time
- 5-stage composition pipeline (resolve, filter, override, brand, merge) with surface-only branding
- Feature flags (file-level exclusion) and override system with SHA-256 staleness detection
- Delegation installer (436 lines vs 5K upstream monolith) with v2.x auto-cleanup
- Preview-update workflow with 6-vector supply chain scanning
- Full CI matrix: 5 checks across 3 OSes (macOS, Linux, Windows)
- Published as @chude/get-stuff-done@3.0.0 to npm

### What Worked
- **Prototype gate (Phase 29)** validated the entire architecture in a single plan before committing — prevented wasted effort
- **TDD throughout** caught integration issues early; 97+ tests by Phase 30 end
- **SRP pipeline stages** made each phase independently testable and debuggable
- **4-day execution** for 8 phases / 21 plans — high velocity from clear requirements and design spec upfront
- **Gap closure phase (36)** as explicit audit-driven follow-up kept the main phases focused

### What Was Inefficient
- **Phase 34 boundary violations**: 48 violations detected but acceptable as structural (overlay-era files not yet in overrides/) — could have been designed out earlier
- **Coverage targets for CLI entry points**: 95% per-metric target hit practical ceiling on preview-update.js (88.65% lines) due to uncoverable CLI entry block — SRP refactor needed to close it
- **Upstream compat runner**: 131/451 failures expected due to branding — runner is informational only, not blocking; effort to categorize test failures was high relative to value

### Patterns Established
- **Overlay composition model**: upstream as devDep, compose at publish, brand at surface only
- **continue-on-error for informational CI**: boundary and upstream-compat jobs don't block PRs
- **captureCmd pattern**: in-process testing of process.exit-calling CLI functions
- **Symlink/junction shim**: enables source-tree testing of dist/-targeting imports
- **tryRequire() fallback**: launcher imports from dist/src or overlay/src depending on context

### Key Lessons
1. **Surface-only branding is the right call** — internal path renaming cascades through every test, import, and config. Android OEMs do the same with AOSP.
2. **Delegation > reimplementation** — the 436-line installer wrapper is vastly more maintainable than reimplementing upstream's 5K-line monolith.
3. **Prototype gates save entire milestones** — Phase 29's single-plan go/no-go prevented committing to an architecture that might not work.
4. **Coverage targets need escape hatches** — 95% per-metric is achievable for most code but impractical for thin CLI entry points. Document exceptions explicitly.
5. **Cherry-pick sync doesn't scale** — 569-commit delta made the old model unsustainable. Overlay eliminates the sync treadmill entirely.

### Cost Observations
- Model mix: ~80% opus (quality profile), ~20% sonnet (executor agents)
- Notable: 21 plans in 4 days — fastest milestone per plan ratio due to clear upfront design spec

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v0.1.0 | 1.38 hrs | 6 | 12 | Initial fork setup |
| v0.2.0 | 4.45 hrs | 11 | 32 | Security, CI, cross-platform |
| v0.3.0 | 15.0 hrs | 6 | 17 | Upstream sync intelligence |
| v0.4.0 | - | 5 | - | Superseded |
| v1.0.0 | 4 days | 8 | 21 | Overlay architecture, npm v3.0.0 |

### Cumulative Quality

| Milestone | Requirements | Coverage | Key Quality Gate |
|-----------|-------------|----------|-----------------|
| v0.1.0 | ~30 | - | Manual testing |
| v0.2.0 | ~50 | 95%+ | CI matrix, ESLint security |
| v0.3.0 | ~60 | 95%+ | Sync safety, supply chain scanning |
| v1.0.0 | 61 | 95%+ per metric | 5-check CI matrix, milestone audit |

### Top Lessons (Verified Across Milestones)

1. **Prototype gates prevent wasted work** — validated in v1.0.0 (Phase 29 go/no-go), previously learned from v0.4.0 supersession
2. **TDD catches integration issues early** — consistent across all milestones; enforced as requirement (TEST-04) in v1.0.0
3. **Upstream compatibility is a spectrum** — cherry-pick sync (v0.1-v0.3) reached practical limit; overlay model (v1.0.0) is the sustainable answer
