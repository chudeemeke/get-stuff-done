---
agent: gsd-roadmapper
updated: 2026-03-28
entries: 8
---

## Learnings

- finding: "v0.3.0 has 185 upstream commits to sync -- 2.5x the v0.2.0 sync (72 commits). Phase 18 is the critical path and likely needs multiple plans. Previous sync (Phase 8) used 3 plans for 72 commits."
  source: "v0.3.0 roadmap creation"
  confidence: HIGH
  phase: "18-upstream-sync-execution"
  date: "2026-02-27"

- finding: "Upstream split monolithic gsd-tools.js into 11 CJS domain modules (bin/lib/). This is a major architectural change that affects esbuild bundling, test imports, and fork-specific infrastructure. Bundling migration (SYNC-II-03) was correctly separated into Phase 19 to avoid overloading the sync phase."
  source: "v0.3.0 roadmap creation"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-27"

- finding: "ASSESS-01 and ASSESS-02 are correctly placed in Phase 19 (post-sync) because they cannot be evaluated until after the sync reveals what upstream now provides. These assessments gate conditional requirements CLAUDE-06, PLAT-07, PLAT-08."
  source: "v0.3.0 roadmap creation"
  confidence: HIGH
  phase: "19-post-sync-stabilization"
  date: "2026-02-27"

- finding: "v0.4.0 upstream sync (158 commits, v1.20.6-v1.22.4) is comparable to v0.3.0 sync (185 commits). Proven pattern: split sync into execution phase + post-sync stabilization phase."
  source: "v0.4.0 roadmap creation"
  confidence: HIGH
  phase: "25-upstream-sync-execution"
  date: "2026-03-10"
  status: superseded
  superseded_by: "v0.4.0 superseded by v1.0.0 overlay architecture. Cherry-pick sync replaced by npm devDependency model."

- finding: "Quality verification before upstream sync is a deliberate ordering choice: sync intelligence (Phase 21) and sync automation (Phase 22) tools are used during upstream sync execution. UAT must confirm they work before relying on them."
  source: "v0.4.0 roadmap creation"
  confidence: HIGH
  phase: "24-quality-verification"
  date: "2026-03-10"
  status: superseded
  superseded_by: "v0.4.0 superseded by v1.0.0. Pattern still valid generically but specific phase references no longer apply."

- finding: "v1.0.0 overlay architecture has a natural 7-phase structure derived from the design spec's own phasing (prototype gate, scaffold+pipeline, feature system, code port, installer, testing, migration). The requirements (52 total) clustered cleanly into these boundaries without forcing."
  source: "v1.0.0 roadmap creation"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "Phase 29 (prototype gate) as go/no-go before committing to full overlay migration is a pattern worth reusing. Validates the core architectural assumption (delegation works) before investing in the rest. Costs 1 phase of effort, saves potentially all remaining phases if the assumption is wrong."
  source: "v1.0.0 roadmap creation"
  confidence: HIGH
  phase: "29-prototype-gate"
  date: "2026-03-28"

- finding: "Composition pipeline (Phase 30) is the critical path of v1.0.0 -- 17 requirements in a single phase (COMP-01 through COMP-11, BRAND-01 through BRAND-06). This is the densest phase by requirement count. Will likely need 3-5 plans. Each pipeline stage being a separate function (SRP) helps parallelise the plans."
  source: "v1.0.0 roadmap creation"
  confidence: HIGH
  phase: "30-composition-pipeline-branding"
  date: "2026-03-28"
