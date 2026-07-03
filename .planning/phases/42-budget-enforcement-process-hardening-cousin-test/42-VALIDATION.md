---
phase: 42
status: planned
created_at: 2026-07-03
---

# Phase 42 Validation Strategy

## Must-Have Truths

| ID | Truth | Proof |
|----|-------|-------|
| V42-PERF-01 | Perf budget compares current metrics to Phase 41 baseline per platform. | `bun test tests/check-perf.test.js` |
| V42-PERF-02 | CI warns at `1.10x` and fails at `1.25x` unless an accepted regression matches. | `tests/check-perf.test.js`; `tests/ci-workflow.test.js` |
| V42-VERSION-01 | `gsd --version --json` is non-interactive and includes fork, upstream, and overlay manifest SHA-256 fields. | `bun test tests/package-launcher-v3.test.js` |
| V42-COUSIN-01 | Cold-install workflow isolates installer side effects under runner temp paths. | `bun test tests/cousin-smoke.test.js`; workflow assertions |
| V42-COUSIN-02 | Cousin matrix uses `ubuntu-latest`, `macos-15`, `windows-latest`, Node 20/22, and npm/pnpm/bun. | `tests/ci-workflow.test.js` |
| V42-PROCESS-01 | Evidence-before-claim principle exists once and four trigger IDs reference it. | `node scripts/verify-oversight-probes.js` |
| V42-DOCS-01 | Markdown/link gates run against tracked markdown and exclude generated/dependency copies only. | `tests/ci-workflow.test.js`; docs gate command |

## Required Verification Commands

- `bun test tests/check-perf.test.js`
- `bun test tests/package-launcher-v3.test.js`
- `bun test tests/cousin-smoke.test.js`
- `bun test tests/ci-workflow.test.js`
- `node scripts/verify-oversight-probes.js`
- `bash scripts/lint-workflows.sh`
- docs lint command added by Phase 42
- full `bun test` before Phase 42 closure

## Anti-Theater Checks

- A perf script that only validates JSON shape is not enough; it must compare ratios and exit non-zero for hard failures.
- A cousin workflow that installs only the already-published package on PRs is not enough; PRs must test the packed branch artifact or document why not.
- A docs gate that broadly ignores `.planning` or all legacy docs is not enough; tracked markdown must either pass or have narrow justified rule configuration.
- Oversight trigger text without a deterministic probe is not enough.
