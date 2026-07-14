---
phase: 43
plan: "11C"
wave: 13
status: complete
date: 2026-07-14
requirements:
  - UPGRADE-04
  - UPGRADE-05
  - SHIP-08B
---

# Phase 43 Plan 11C Summary - Durable N=3 Compatibility Proof

## Outcome

Ported roadmap byte preservation through one fork-private persistence adapter,
resolved the final candidate compatibility failure, and published exact-byte
N=3 evidence for Open GSD `1.5.0`, `1.6.0`, and `1.6.1`. Compatibility is
resolved; the original Plan 11 remains incomplete until all remaining
corrective plans in authoritative wave order close the separate
SHIP-08A/SHIP-08B and machine-validation gates.

## Roadmap Persistence Boundary

- `fork-roadmap-persistence.cjs` owns EOL projection and atomic publication;
  the global Open GSD writer remains unchanged.
- LF, CRLF, mixed-EOL, no-op, metadata, Windows DACL, collision, bounded lock
  retry, partial replacement, recovery, and cleanup states are covered.
- `roadmap.cjs` is the only source importer. The generated `dist` mirror is
  checked after composition so stale shippable output fails the boundary test.
- The override reason records the preservation responsibility and bump-review
  trigger without changing its reviewed upstream snapshot.

## Evidence Publication

- Matrix and manifest JSON use one atomic sibling-publication adapter with
  exclusive creation, bounded transient rename retries, cleanup, and no
  direct-write fallback.
- Failed `--require-all` runs cannot overwrite prior durable success evidence.
- Repository-relative report metadata remains stable through the required
  `C:\Projects` junction instead of collapsing to a basename.
- Manifest application hashes the exact report bytes, validates a real calendar
  date, and accepts only a complete successful N=3 report.
- Validation rejects missing/duplicate versions or suites, wrong authority
  boundaries, red/skipped suites, contradictory error arrays, aggregate-count
  drift, exclusion drift, and manifest role/blocking drift.

## Compatibility Contract

- All three reviewed pins pass the same 11 candidate suites with no
  version-specific skips.
- `phase-verification.test.cjs` moved to the repository contract because Open
  GSD `1.5.0` predates that active-product safety gate. Its promotion trigger
  requires every reviewed N=3 pin to support the behavior; the gate may not be
  removed from the active product.
- Repository suites are selected dynamically from the validated contract and
  run in a blocking cross-platform CI step. A future repository classification
  cannot be omitted through a stale package-script file list.
- Contract, root CJS suite, shared helper, and repository-runner edits now
  trigger the compatibility-matrix workflow.

## Durable Evidence

- `.planning/evidence/phase43-compat.json` is schema v2, `require-all`, and
  records 312 passed, 0 failed, and 0 skipped for each version: 936/936 total.
- Every row contains the exact 11 candidate suite paths and boundaries plus
  three classified exclusions: retired `core.test.cjs`, repository
  `phase-verification.test.cjs`, and repository `sync.test.cjs`.
- Exact-byte SHA-256:
  `6b7bb361b7ef34d82e11be5289ecc3f1f14a8200192ee826fb59ea110d8c387c`.
- All three vetted manifest rows are dated `2026-07-14`, reference the durable
  repository-relative path and digest, and have `status: passed`.
- `43-11-BLOCKER.md` retains the original failure and appends the dated
  `compatibility-resolved-pending-closeout-validation` state.

## TDD And Review Corrections

- RED exposed failed-report overwrite, junction-relative path loss, partial
  report acceptance, schema/runtime drift, retry-exhaustion propagation,
  repository-gate duplication, missing workflow triggers, and contradictory
  evidence acceptance before each correction was implemented.
- Independent architecture review found no P0/P1 issue. Its two P2 findings
  were the duplicated repository suite list and incomplete matrix path filters;
  both were fixed and the remediation re-review returned PASS.
- The architecture review confirmed the candidate/repository split is an
  honest common-minimum contract rather than hidden historical version skips.

## Validation Evidence

- `bun run dist`: Open GSD `1.6.1`, overlay `3.0.2`, 740 files, 124 branding
  rules, bundled hooks, and generated `dist/bom.json`.
- Fork roadmap adapter: 40/40 tests, 100% functions, 98.63% lines. Bun does not
  emit branch metrics; the canonical four-metric aggregate remains owned by
  Plans 11D through 11J.
- Roadmap command: 16/16; override freshness: 8/8.
- Standalone active-pin matrix: 312/312 with zero failures or skips.
- Authoritative N=3 matrix: 936/936 with zero failures or skips.
- Blocking repository contract: 154/154.
- Active config/phase/verification batch: 102/102.
- Focused publication, matrix, manifest, repository, and workflow tests: 79/79.
- Workflow lint, focused ESLint, documentation lint, and `git diff --check`
  passed. Full ESLint remains at the established 180 warnings and zero errors.

## Task Commits

1. **Roadmap preservation port:** `2ebc60a` (`fix`)
2. **Durable N=3 evidence and gates:** `6ad0bff` (`feat`)

## Cleanup And Boundary

Removed 58 verified stale `gsd-test-<token>` fixture directories under the
resolved OS temp root. Final marker-owned matrix/transition roots and
regenerable root reports are absent. `dist/` and `node_modules/` were preserved,
and no live `authkey`, `remotely`, or `conversations` session was touched.

## Self-Check: PASSED

- The durable report, manifest digest, blocker transition, source adapter, and
  permanent compatibility gates exist and agree.
- The temporary expected-red transition test was removed only after active and
  N=3 matrix success and an exact digest re-read.
- Original `43-11-PLAN.md` is unchanged and `43-11-SUMMARY.md` remains absent.
- Post-completion reconciliation found Open GSD plan-scan counts PLAN-REVIEW
  artifacts as executable plans. Plan 11L is the next GSD unit and owns the
  minimal upstream-tracked correction before Plan 11D establishes the coverage
  source-contract/toolchain foundation. No SHIP-08A four-metric completion is
  claimed here.
