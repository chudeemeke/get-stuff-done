# Override: hooks/gsd-check-update-worker.js

## Why
Fork-branded background worker. The active upstream worker is a useful
resilience split, but the fork needs `@chude/get-stuff-done` package identity,
maintainer routing from `gsd.role`, and the fork's 7-day network throttle.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: 16f4ebb94930af55555534c21c7586327d4756b9cd10cc05350bd4de2a552fd9
- Semantic SHA-256: cdcc2be65ed93b5039fce9f7f593612c133fe0a604816a0c40a8a740f3b2ddb6

## What's different
- Checks `@chude/get-stuff-done` on npm for consumer update detection.
- Preserves maintainer `gsd.role` routing and commit classification.
- Preserves the fork's 7-day network throttle.
- Records stale installed hooks before a throttled no-update result.
- Includes a source/runtime fallback managed-hook list so tests and installed hooks share the same behavior.

## Adopted upstream 1.6.1 behavior
- Dedicated worker script replaces the inline `node -e` template.
- Uses `isNewer` semver comparison for package and hook staleness checks.
- Detects stale managed hooks from installed `gsd-hook-version` headers.
- Writes package lineage into the shared cache result.

## Review trigger
When upstream hooks/gsd-check-update-worker.js changes, review whether the override is still needed.
