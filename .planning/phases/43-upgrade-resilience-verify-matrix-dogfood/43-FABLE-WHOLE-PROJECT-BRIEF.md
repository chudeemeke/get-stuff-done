---
project: get-stuff-done
reviewer: Claude Fable
review_scope: whole-project strategic and implementation critique
prepared: 2026-07-14
status: reviewed
review_completed: 2026-07-14
review_artifact: 43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
---

# Fable Whole-Project Advisory Brief

## Role

Act as the standing strategic advisor and critical design partner for the
entire `get-stuff-done` project. This is not a review of one plan, one phase,
or only the latest diff. Challenge the desired end state, architecture,
sequencing, quality model, migration discipline, product readiness, and the
details that could undermine them. Do not edit files.

## Desired End State

Deliver a market-ready, potentially open-source GSD distribution that:

- follows active Open GSD as authoritative upstream without surrendering fork
  identity, product behavior, or maintainability;
- treats the fork as a narrow overlay/override product rather than a permanent
  copy of upstream;
- exposes a simple operator/user surface while hiding composition, migration,
  rollback, provenance, and compatibility complexity;
- has strict hexagonal boundaries, SOLID responsibilities, explicit ports,
  loose coupling, and tight end-to-end integration;
- is secure, cross-platform, installable, upgradeable, observable, and
  supportable as a real product;
- uses TDD and blocks release below 95% independently for statements,
  branches, functions, and lines across the canonical fork-authored source;
- preserves disk-backed GSD continuity so another session can resume from
  repository truth without relying on chat memory; and
- can absorb future Open GSD changes through explicit authority, provenance,
  compatibility, and owner/removal contracts rather than ad hoc patching.

## Current Architecture

- Active upstream authority is exact-pinned `@opengsd/gsd-core@1.6.1` from
  `open-gsd/gsd-core`; legacy TACHES/GSD is deprecation/history only.
- `scripts/compose.js` builds `dist/` from upstream plus fork-owned overlays and
  reviewed overrides. Authority and package-layout differences are centralized
  rather than duplicated across callers.
- Overlay files add fork behavior. Overrides replace exact upstream paths and
  carry reason, snapshot, staleness, owner, and review expectations.
- Runtime/install provenance, rollback, semantic override staleness,
  compatibility matrices, upgrade simulation, hook reconciliation, SBOM,
  performance gates, cousin installs, docs gates, and oversight probes already
  exist.
- The project is on branch `phase43-upgrade-resilience-20260703`; work is not
  yet released or merged.

## Current GSD Position

- Milestone: `v1.2.0` Ship-Ready Hardening.
- Progress: 32/45 plans, 71%; Phases 41 and 42 are complete, Phase 43 is active,
  and Phase 44 remains.
- Plan 43-11 originally failed closed after the Open GSD 1.6.1 bump. Corrective
  Plans 11A through 11C now classify the compatibility surface, modernize
  stale candidate assumptions, port one proven roadmap byte-preservation
  behavior, and publish durable green evidence.
- Authoritative N=3 evidence is 936/936 across 1.5.0, 1.6.0, and 1.6.1 with 11
  common candidate suites and no version-specific skips. Active repository-only
  verification/sync contracts pass 154/154.
- Original Plan 11 remains incomplete by design. Plans 11D through 11K must
  establish the canonical source contract, four-metric coverage toolchain and
  closure across bounded source groups, SBOM portability/toolchain preflight,
  shipped-snapshot assurance, and validator-first aggregate evidence. Then
  original Plan 11 and Plan 12 are rerun before Phase 44 release polish.

## Known Risks And Debt

- Canonical fork-authored coverage baseline is approximately 70.88% statements,
  75.48% branches, 74.47% functions, and 70.88% lines. The 95% requirement is
  real and blocking; the remaining plans are intentionally bounded to prevent
  a low-quality test flood or denominator manipulation.
- The boundary checker reports 41 structural root-mirror violations. CI treats
  the baseline as visible debt with a blocking no-regression ratchet.
- `INST-04` remains: uninstall manifests do not track all overlay files.
- Several macOS performance exceptions expired on 2026-07-10 and need a
  deliberate rebaseline or variance-aware policy rather than more waivers.
- The changelog conflict checker passes its synthetic self-test but fails on
  normal published-release bullets; its intended operating scope is unresolved.
- Project config still has legacy/unknown keys tracked under backlog 999.2.
- Windows subprocess/lock behavior is heavily tested but remains an operational
  complexity and flake risk.
- The branch has multiple local commits and no current PR/CI confirmation for
  the newest corrective work.
- Active Open GSD `plan-scan.cjs` uses a loose Markdown filename fallback that
  counts `42-PLAN-REVIEW.md` and `43-PLAN-REVIEW.md` as executable plans. The
  authoritative plan total is 45, while `roadmap analyze` currently reports
  47. Backlog 999.5 captures the upstream/fork disposition and requires a fix
  before original Plan 43-11 closeout.

## Remaining Sequence In Detail

1. **11D:** establish the exhaustive/disjoint production-source contract and a
   truthful Bun + Jest + native Node + c8 four-metric runner. Do not attempt
   broad closure in the same plan.
2. **11K:** make SBOM generation portable and add toolchain preflight before
   measuring distribution/build coverage.
3. **11E:** close launcher and runtime-support coverage.
4. **11F:** close distribution and build-tool coverage.
5. **11G:** close quality, audit, performance, and reliability coverage.
6. **11H:** close upgrade and compatibility-tooling coverage while retaining
   explicit current-pin versus `require-all` policy.
7. **11I:** close hook and sync coverage.
8. **11J:** run validator-first aggregate assurance, require all four metrics at
   or above 95%, publish machine evidence, and transition the blocker only if
   SHIP-08A and SHIP-08B independently pass.
9. **Original 11:** rerun post-bump snapshots, churn, SBOM, and assurance after
   all corrective-plan mutations.
10. **12:** close D-7 maintenance evidence and Phase 43 verification.
11. **44:** wire release/publish, provenance, reproducibility, maintenance docs,
    and anti-theater checks into the shipping flow.

## Verified Evidence Anchors

- `.planning/STATE.md:13,23,29` - 32 completed plans, core value, and next Plan
  11D position.
- `.planning/STATE.md:111,138` - measured coverage gap, bounded assurance
  sequence, compatibility resolution, and remaining closeout blockers.
- `.planning/ROADMAP.md:179-188` - authoritative remaining Phase 43 wave order.
- `43-COVERAGE-SPIKE.md:77,102-110` - 52-file planning baseline and exact
  four-metric measurements versus the 95% thresholds.
- `docs/decisions/003-UPSTREAM-AUTHORITY-MIGRATION.md:11-29` - active authority
  migration while retaining the overlay architecture and core value.
- `docs/superpowers/specs/2026-03-28-overlay-architecture-design.md:10-20,42-59`
  - original divergence problem, composition model, and self-contained package
  delivery model.
- `.planning/evidence/phase43-compat.json` - durable schema-v2 N=3 report with
  936/936 candidate assertions and exact per-suite records.

## Invariants

- Do not restore the legacy upstream or create a legacy `core.cjs` facade.
- Do not use version-specific compatibility skips to make the matrix green.
- Do not confuse a passing candidate matrix with active-product repository
  safety or whole-product coverage.
- Do not broaden fork-private behavior into global upstream writers when a
  narrow adapter suffices.
- Do not declare Plan 11, Phase 43, or the milestone complete before their
  machine-validatable evidence exists and CI is green.
- Do not delete or modify live `authkey`, `remotely`, or `conversations`
  sessions; they are outside this repository.
- Preserve `dist/` and `node_modules`; clean only verified regenerable
  artifacts.

## Required Reading

These are the source documents synthesized above. The first attempt to inspect
all of them interactively exceeded the execution bound, so this retry is
tool-free. Use the verified evidence anchors and brief as the review record;
do not claim to have read content that is not supplied here.

Source set:

1. `.planning/PROJECT.md`
2. `.planning/STATE.md`
3. `.planning/ROADMAP.md`
4. `.planning/REQUIREMENTS.md`
5. `docs/decisions/003-UPSTREAM-AUTHORITY-MIGRATION.md`
6. `docs/superpowers/specs/2026-03-28-overlay-architecture-design.md`
7. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-CONTEXT.md`
8. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-PLAN-REVIEW.md`
9. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md`
10. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11C-SUMMARY.md`
11. Plans `43-11D-PLAN.md` through `43-11K-PLAN.md`
12. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md`
13. `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12-PLAN.md`
14. `tests/upstream-compat-contract.json`
15. `.planning/evidence/phase43-compat.json`

Inspect additional source or history where a conclusion depends on it.

## Questions To Resolve

1. Is the desired end state coherent and commercially/OSS credible, or is the
   project optimizing an internal fork instead of a maintainable product?
2. Is overlay/override composition still the right strategic architecture now
   that active authority moved to Open GSD? Identify coupling or ownership that
   should move before release.
3. Is the route 11D-11K -> original 11 -> 12 -> Phase 44 the shortest safe path,
   or is it over-planned, incorrectly ordered, or missing a critical gate?
4. Does the 95%-per-metric strategy measure the right product-owned risk, or can
   it be gamed while important behavior remains untested?
5. Which current debt is legitimately deferred, which must block v1.2, and
   which should be removed rather than managed?
6. What are the highest-probability hidden failure modes in upstream adoption,
   packaging/install/upgrade, cross-platform behavior, security, provenance,
   maintenance, and supportability?
7. Which decisions should be reversed or simplified now, before sunk cost makes
   them harder to change?
8. Define the recurring project-level checkpoints where Fable should review
   again, including what evidence each checkpoint must contain.

## Response Contract

Return:

1. a concise executive verdict;
2. severity-ranked findings with exact file/line evidence;
3. a first-principles architecture assessment;
4. a sequence critique with an improved critical path if needed;
5. a release-blocker/defer/remove table;
6. standing Fable review checkpoints for the rest of the project; and
7. explicit `KEEP`, `CHANGE`, `STOP`, and `INVESTIGATE` decisions.

Distinguish verified facts from inference. Do not praise the plan; pressure-test
it. Do not recommend a rewrite unless the evidence proves incremental correction
cannot reach the desired end state.
