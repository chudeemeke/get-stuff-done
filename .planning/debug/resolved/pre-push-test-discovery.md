---
status: resolved
trigger: "Pre-push bun test ran Node-native .test.cjs contracts and failed before the Phase 43 draft branch could be published."
created: 2026-07-14
updated: 2026-07-14
---

# Pre-Push Test Discovery

## Symptoms

- Expected: `bun test` discovers only fork-owned Bun `.test.js` suites; native
  `.test.cjs` compatibility contracts execute through their Node authority.
- Actual: Bun discovered `.test.cjs` files despite the legacy `include` and
  `exclude` keys in `bunfig.toml`, producing `node:test` mock incompatibility,
  subprocess timeouts, and locked temporary directories.
- Reproduction: run the Phase 43 branch pre-push hook or plain `bun test` after
  composition.
- Independent failure: `test-path-validation.test.js` treats an intentionally
  absent private adapter in a negative boundary assertion as a stale path.

## Current Focus

- hypothesis: Supported Bun config is defense in depth, but current Bun 1.3.5
  requires an explicit `.test.js` adapter and preload capability to enforce the
  Bun/Node authority boundary at runtime.
- test: The canonical adapter passed 1,319/1,319 functional tests across 54
  files with zero `.test.cjs` headers. Focused native Node contracts passed
  73/73 and the repository compatibility registry passed 154/154.
- expecting: The ordinary pre-push hook repeats install, compose, lint, and the
  canonical functional command without discovering a native Node contract.
- next_action: Open the draft pull request and use hosted CI as the required
  evidence checkpoint before Plan 11D.
- reasoning_checkpoint: Local and remote pre-push partition confidence is
  high; hosted runner evidence remains intentionally unclaimed.
- tdd_checkpoint: RED captured for unsupported config and path misclassification;
  GREEN captured for focused, complete functional, and native contract gates.

## Evidence

- timestamp: 2026-07-14
  observation: `node --test tests/phase.test.cjs` passed 54/54.
- timestamp: 2026-07-14
  observation: `node --test tests/roadmap.test.cjs` passed 19/19.
- timestamp: 2026-07-14
  observation: current Bun documentation names `root` and
    `pathIgnorePatterns` as supported discovery controls.
- timestamp: 2026-07-14
  observation: Bun 1.3.5 parsed supported configuration but still discovered
    `.test.cjs`, proving config text alone is not a blocking boundary.
- timestamp: 2026-07-14
  observation: Fable accepted the explicit adapter and fail-closed partition,
    requested caller/partition/version-policy evidence, and left Bun pinning
    for the evidence-backed Plan 11K adjudication.
- timestamp: 2026-07-14
  observation: focused adapter, preload, config, path, workflow, and guidance
    regressions passed 95/95.
- timestamp: 2026-07-14
  observation: complete canonical Bun functional execution passed 1,319/1,319
    across 54 files in 111.69 seconds with zero `.test.cjs` headers.
- timestamp: 2026-07-14
  observation: focused native contracts passed 73/73 and the complete
    repository compatibility registry passed 154/154.
- timestamp: 2026-07-14
  observation: focused Bun coverage reports the adapter at 100% functions and
    98.15% lines; the combined adapter/guard slice reports 100% functions and
    95.97% lines. Bun cannot report the required statement/branch metrics, so
    Plan 11D remains the explicit four-metric authority rather than inflating
    this evidence.

## Eliminated

- hypothesis: The roadmap or phase implementations regress under their
    authoritative runner.
  reason: Both focused native Node suites pass completely.

## Resolution

- root_cause: Legacy Bun discovery keys were unsupported, and supported
    `pathIgnorePatterns` remained non-blocking on local Bun 1.3.5. The previous
    command therefore merged Bun functional tests with native Node contracts.
- fix: Added the canonical Bun adapter, process-scoped preload capability,
    exhaustive extension/registry partition, caller routing, supported config,
    negative-path marker, and ADR 004. Fable reviewed the whole-project impact;
    Bun version pinning remains an evidence-backed Plan 11K decision.
- verification: The ordinary push hook passed 1,322/1,322 functional tests
    across 54 files with zero `.test.cjs` headers. Native focused contracts
    passed 73/73, repository compatibility passed 154/154, and local/remote
    refs both resolved to `9246673bac922773d3493ba8f430ba46a1ae2c60`.
- files_changed: See commit `9246673` and
    `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11M-SUMMARY.md`.
- cleanup: Removed 33 exact Plan 11M temp directories and 12 named evidence
    logs after process, containment, and reparse-point checks. Unattributed
    shared-temp entries were preserved because other project sessions are live.
