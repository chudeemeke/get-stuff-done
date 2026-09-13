---
phase: 43
plan: "11A"
wave: 11
status: complete
date: 2026-07-13
requirements:
  - UPGRADE-02
  - UPGRADE-04
  - UPGRADE-05
  - SHIP-08B
---

# Phase 43 Plan 11A Summary - Classified Compatibility Evidence

## Outcome

Replaced the compatibility runner's hardcoded exclusions and aggregate-only
result with a fail-closed suite registry, independent candidate execution, and
per-suite evidence. The matrix remains blocking by default only for the active
pin; closeout can require every row with `--require-all`.

## Suite Contract

- `tests/upstream-compat-contract.json` classifies all 13 root `*.test.cjs`
  suites exactly once: 11 candidate, 1 repository-only, and 1 retired.
- Registry reconciliation rejects unclassified discovery, stale paths,
  duplicates, unknown classifications, incomplete owner/trigger metadata, and
  candidate version-specific skip policy.
- Direct `bin/lib/*` dependencies are explicitly recorded as
  `upstream-internal-observed` with exact evidence, rationale, and bump-review
  triggers.
- `sync.test.cjs` retains the exact repository port-or-retire trigger;
  `core.test.cjs` records its canonical replacement modules.

## Runner And Isolation

- Candidate suites stage once and execute independently through injected
  subprocess, clock, directory, registry, and temp-lifecycle ports.
- Each suite record includes classification, authority boundary, status,
  counts, duration, exit code, and bounded failure evidence.
- A failed, timed-out, or spawn-error suite does not prevent later suites from
  running, and aggregate counts are derived from suite records.
- `scripts/lib/owned-temp.js` is the only recursive-delete authority used by
  the compatibility runners. It requires canonical OS-temp containment and a
  matching ownership marker, protects repository/build roots, supports
  dry-run, permits internal links, and rejects unregistered external links.
- Success, assertion failure, timeout, spawn error, staging failure, and matrix
  install failure all leave their injected temp roots empty in focused tests.

## Matrix And Evidence Policy

- Matrix report schema is now version 2 and carries `suites[]` plus classified
  exclusions through JSON and concise text output.
- The informational CI wrapper remains exit-zero and renders the same bounded
  suite table in GitHub step summaries.
- Default matrix exit policy remains `current-pin`; `--require-all` fails when
  any selected N=3 row is red and cannot be combined with `--version`.
- Matrix evidence application now dates only rows with `ok: true` and
  `status: passed`. Red rows retain report/status evidence while clearing
  `vettedAt`; the stale historical dates in the repository manifest were
  cleared accordingly.
- A failed `suites[]` record overrides an inconsistent top-level `ok: true`
  in both matrix classification and manifest vetting.

## Plan Deviation

The plan required the manifest evidence writer to reject red-row vetting, but
its initial write set omitted the owning module and test. The bounded fix added
`scripts/vetted-upstream-versions.js`,
`tests/vetted-upstream-versions.test.js`, and
`.planning/vetted-upstream-versions.json`. This keeps the responsibility in its
existing owner rather than duplicating manifest policy in the matrix runner.

## Validation Evidence

- `bun test tests/owned-temp.test.js tests/run-upstream-compat.test.js tests/run-upstream-compat-ci.test.js tests/vetted-upstream-versions.test.js`
  passed: 38 tests and 136 assertions.
- Focused `bun test --coverage` passed. Bun reports functions and lines only;
  the canonical independent four-metric SHIP-08A gate remains owned by Plans
  43-11D through 43-11J.
- Focused ESLint passed with zero errors. Existing security-plugin dynamic-path
  findings in `run-upstream-compat.js` remain warnings on validated/injected
  paths, not suppressed errors.
- `node --check` passed for both runners, the CI wrapper, and owned-temp helper.
- `git diff --check` passed; only the existing CRLF normalization notice was
  emitted.

## External Review

- Initial critical review found two P1 defects (junction-alias protected-root
  bypass and failed TAP records able to remain green) and two P2 evidence
  defects (non-actionable excerpts and inexact internal-authority evidence).
  All four were fixed with regression coverage.
- Remediation review found one remaining P1 defect (matrix and vetting trusted
  an inconsistent top-level green over failed suites) and one remaining P2
  defect (expected error-path chatter could precede the actual failure). Both
  were fixed test-first.
- Final adversarial re-review returned PASS. It reproduced a failed suite under
  `ok: true` and confirmed a failed row, non-zero blocking exit, failed report,
  null `vettedAt`, actionable TAP evidence, and no leftover artifacts.

## Task Commits

1. **Plan 11A implementation:** `4d3baf7` (`feat`)

## Cleanup And Boundary

No compatibility report, coverage directory, owned temp tree, or disposable
test artifact remains in the worktree. `dist/` and `node_modules/` were not
deleted or treated as cleanup candidates.

Plan 11A does not claim the pre-existing compatibility failures are resolved.
Plan 43-11B now owns supported Open GSD behavior modernization and candidate
runtime-path coverage; Plan 43-11C owns the first durable green N=3 proof.

## Self-Check: PASSED

- All Plan 11A implementation and evidence artifacts exist.
- Focused tests, lint, syntax, manifest validation, and diff checks pass.
- Implementation commit `4d3baf7` exists and contains only the Plan 11A code,
  registry, manifest, and focused test changes.
