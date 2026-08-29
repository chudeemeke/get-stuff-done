---
phase: 43
plan: "11M"
wave: 15
status: complete
date: 2026-07-14
requirements:
  - SHIP-08A
---

# Phase 43 Plan 11M Summary - Explicit Test Authorities

## Outcome

Restored truthful pre-push and hosted test-runner boundaries before branch
publication. Bun now owns only fork-authored `*.test.js` functional suites
through `scripts/run-bun-tests.js`; native Node owns the classified
`*.test.cjs` compatibility registry. Bare `bun test` fails once with routing
guidance before suite execution.

The ordinary push hook passed without bypass and published commit `9246673`.
Local `HEAD` and the remote branch both resolved to
`9246673bac922773d3493ba8f430ba46a1ae2c60`.

## Root Cause

The previous `bunfig.toml` used unsupported `include` and `exclude` keys. Bun
1.3.5 parsed the supported replacement keys, but `pathIgnorePatterns` still did
not prevent `.test.cjs` discovery. Configuration text alone was therefore not
a blocking test-authority boundary.

The false combined run produced runner failures rather than product failures:

- native `node:test` mock behavior was unavailable under Bun;
- native subprocess contracts exceeded Bun's timeout;
- timed-out children retained Windows temp-directory handles; and
- path validation treated one intentionally absent negative-boundary target as
  a stale production path.

## Architecture

- `scripts/run-bun-tests.js` is the single Bun execution port.
- The adapter applies an explicit `.test.js` positional filter, rejects
  `.test.cjs`, rejects unsupported test selectors, and forbids
  `--pass-with-no-tests`.
- A process-scoped capability allows the Bun preload only for adapter-owned
  children. Direct invocation exits non-zero with one message.
- `tests/upstream-compat-contract.json` remains the exhaustive native Node
  registry.
- Pre-push, CI, 10x validation, update guidance, and oversight evidence route
  through package scripts.
- Bun-only coverage is named `test:coverage:bun`; it cannot satisfy the
  four-metric SHIP-08A contract.
- ADR 004 records ownership, version policy, removal criteria, and Plan 11D
  coverage consequences.

## TDD And Coverage

RED evidence proved unsupported config keys, direct `.test.cjs` discovery, the
negative-path meta-test false positive, and the initially untested adapter
error paths.

GREEN evidence:

- focused authority/config/path/workflow regressions passed 95/95 before the
  final edge-path additions;
- final adapter/preload regressions passed 11/11;
- the adapter reports 100% functions and 98.15% lines;
- the combined focused adapter/guard slice reports 100% functions and 95.97%
  lines; and
- the real bare-command subprocess exits once in under five seconds.

Bun does not report the required statement and branch metrics and does not
attribute the child preload to its parent process. Those metrics remain
explicitly unclaimed. Plan 11D owns merged Jest/Node/c8 attribution and all
four independent 95% thresholds.

## Validation

- Complete canonical Bun authority: 1,319/1,319 before commit, then
  1,322/1,322 through the committed pre-push hook across 54 files.
- Native `.test.cjs` headers in both complete Bun runs: zero.
- Focused native phase/roadmap contracts: 73/73.
- Blocking repository compatibility registry: 154/154.
- Composition: 740 files at Open GSD `1.6.1` and overlay `3.0.2`.
- ESLint: zero errors; no new warning was retained.
- Markdown lint: 379 files, zero errors.
- GSD plan structure and roadmap consistency: passed. Health remains degraded
  only on pre-existing future/backlog directory warnings.
- `git diff --check`: passed.
- Ordinary remote publication: passed without `--no-verify`.

## Fable Disposition

Fable reviewed this as a whole-project architecture decision, not an isolated
plan. The review accepted the explicit adapter and dual authority with
amendments for caller routing, exhaustive partition tests, fail-fast direct
invocation, version-policy ownership, and explicit Plan 11D inputs.

The proposed immediate machine-global Bun upgrade was deferred rather than
discarded: it conflicts with the existing floating-CI decision and other live
project sessions. Plan 11K must adjudicate an exact pin from hosted evidence
and record the policy in machine-readable preflight output.

## Execution Corrections

- Supported Bun config was retained as defense in depth, not treated as the
  runtime authority after behavioral evidence disproved that assumption.
- `REL-01` was removed from Plan 11M because Phase 43 does not own it;
  `SHIP-08A` is the correct requirement boundary.
- A new security-linter warning in a workflow-test regex was removed through a
  line-based command classifier before commit.
- Historical command evidence was preserved; active plans, validation, hooks,
  workflows, and shipped guidance use the canonical package route.

## Commit

1. **Dual runner authority and publication repair:** `9246673` (`fix`)

## Cleanup And Boundaries

Removed 33 exact Plan 11M temp directories and 12 named evidence logs after
process, resolved-path, containment, timestamp, and reparse-point checks.
Unattributed shared-temp entries were preserved because `authkey`, `remotely`,
and `conversations` are live. `dist/` and `node_modules/` remain intact.

## Next

Open the branch as a draft pull request and obtain the required hosted CI
verdict. Use that evidence and the standing Fable checkpoint before executing
Plan 11D's source-contract and four-metric coverage foundation.
