# Decision Record 004: Dual Test Authority

**Date:** 2026-07-14  
**Status:** Accepted  
**Context:** Phase 43 upgrade resilience and truthful coverage preparation

## Decision

Keep two explicit test authorities with disjoint ownership:

- Bun owns fork-authored functional suites named `*.test.js`.
- Native Node owns classified compatibility contracts named `*.test.cjs`.
- `tests/upstream-compat-contract.json` classifies every `.test.cjs` suite as
  candidate, repository, or retired.
- `scripts/run-bun-tests.js` is the port for Bun functional execution.
- `bun run test` and `bun run test:coverage:bun` are the public maintainer
  commands. Bare `bun test` is rejected by a preload guard.

The Bun coverage command is functional evidence only. It is not the Phase 43
four-metric SHIP-08A authority.

## Context

The pre-push gate on the Phase 43 corrective branch exposed a false combined
runner. `bun test` discovered native `node:test` contracts despite legacy
`include` and `exclude` keys in `bunfig.toml`. Replacing those keys with the
currently documented `root` and `pathIgnorePatterns` shape was not sufficient:
local Bun 1.3.5 parsed the configuration but still executed `.test.cjs` files.

The resulting failures were runner incompatibilities rather than product
regressions:

- `node:test` mock methods were unavailable under Bun.
- subprocess tests hit Bun's five-second timeout.
- timed-out child processes left Windows temporary directories locked.
- the same phase and roadmap contracts passed 54/54 and 19/19 under Node.

The previous assumption that configuration text alone bounded discovery was
therefore invalid. Runtime behavior is the acceptance authority.

## Invariants

1. Every repository test file is classified exactly once by extension and, for
   `.test.cjs`, by the compatibility registry.
2. Bun receives an explicit `.test.js` positional filter from the adapter.
3. Node-native selectors are rejected by the Bun adapter with Node routing
   guidance.
4. `--pass-with-no-tests` is forbidden for the functional gate.
5. Bare `bun test` exits before suite execution with one actionable message.
6. Pre-push, hosted CI, 10x validation, and generated maintainer guidance route
   through package scripts.
7. No timeout increase, skip, or merged runner masks an authority violation.
8. Plan 11D derives its Jest and Node inputs from explicit contracts, never
   from Bun's runtime-discovered set.

## Architecture

`scripts/run-bun-tests.js` is an infrastructure adapter around the Bun runner.
It owns argument normalization, authority validation, and child-process launch.
The child receives a process-scoped capability consumed by
`tests/helpers/enforce-bun-test-authority.js`; direct Bun invocation does not.

The test partition remains convention-driven and fail-closed:

```text
tests/*.test.js  -> Bun functional authority
tests/*.test.cjs -> native Node compatibility registry
other test forms -> rejected as unclassified
```

The compose pipeline independently rejects test files in `dist/`, preventing
published upstream internals from entering either repository authority.

## Bun Version Policy

CI currently retains the accepted floating `latest` Bun policy while the local
machine remains on 1.3.5. Plan 11M does not change the global runtime because
other projects have live sessions. The explicit adapter must pass on local
1.3.5 and hosted CI's resolved version.

This is a deliberate bounded exception, not an implicit claim of exact local-CI
toolchain parity. Plan 11K owns a machine-readable toolchain preflight and must
adjudicate exact pinning after hosted evidence is available. Any Bun version
policy change requires rerunning the bare-command guard, functional partition,
coverage attribution, install, and cross-platform CI evidence.

## Coverage Consequences

- `test:coverage:bun` is named as Bun-only evidence to prevent it being mistaken
  for the 95% four-metric gate.
- Plan 11D must use explicit Jest include inputs and an explicit Node contract.
- Test discovery does not define the production source denominator.
- Node contract execution may contribute raw V8 records only where Plan 11D's
  source ownership contract assigns canonical production paths to that runner.
- Statements, branches, functions, and lines remain independent thresholds;
  Bun's narrower report cannot satisfy SHIP-08A.

## Consequences

Positive:

- Runner failures identify the correct owner immediately.
- New `.test.cjs` files cannot bypass the compatibility registry.
- Operational callers share one adapter and one command vocabulary.
- Plan 11D receives a stable authority boundary instead of accidental discovery.

Costs:

- Contributors must use package scripts or explicit Node commands.
- The preload and adapter add a small test-infrastructure surface.
- Bun version policy remains an explicit Plan 11K decision until hosted evidence
  resolves the existing floating-version contract.

## Reconsideration Criteria

Reconsider this decision if Bun natively supports every required Node contract,
the compatibility suites are retired, test file conventions change, or a Bun
upgrade makes the adapter unnecessary. Removal requires behavioral evidence on
Windows, Linux, and macOS; configuration support alone is insufficient.
