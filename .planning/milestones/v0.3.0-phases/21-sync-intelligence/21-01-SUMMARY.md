---
phase: 21-sync-intelligence
plan: "01"
subsystem: sync-classification
tags: [sync, classification, config, tdd]
dependency_graph:
  requires: []
  provides: [classifyCommit, gsd.role-config]
  affects: [sync.cjs, ConfigSchema.js]
tech_stack:
  added: []
  patterns: [5-tier-commit-classification, conventional-commits-normalization]
key_files:
  created: []
  modified:
    - get-stuff-done/bin/lib/sync.cjs
    - src/config/ConfigSchema.js
    - tests/sync.test.cjs
    - tests/config.test.js
decisions:
  - "Security keyword detection takes highest priority over all other tiers, including conventional prefix"
  - "test/perf/style conventional prefixes normalize to chore/refactor/chore for semantic grouping"
  - "File-path heuristics check bin/ and hooks/ exclusions before docs/ and tests/ to preserve bin-priority ordering"
  - "byType summary uses a fixed set of 8 types; unknown types fall into 'other' bucket"
requirements_completed: [SYNC-08]
metrics:
  duration: 611s
  completed: 2026-02-25
  tasks_completed: 2
  files_modified: 4
---

# Phase 21 Plan 01: Commit Classification and ConfigSchema gsd.role Summary

Deterministic commit classification via classifyCommit() exported from sync.cjs, cmdSyncPreview JSON extended with per-commit classification and byType summary, ConfigSchema accepting gsd.role enum.

## What Was Built

### classifyCommit(subject, files)

Pure function implementing 5-tier classification precedence:

1. Security keywords (`/\b(security|cve|vuln|exploit|xss|sqli|rce|injection)\b/i`) - returns `{ type: 'security', confidence: 'high' }`
2. Breaking change marker (`/^[a-z]+(\(.+\))?!:/` or `BREAKING CHANGE`) - returns `{ type: 'breaking', confidence: 'high' }`
3. Conventional commit prefix - feat/fix/refactor/docs/chore at high confidence; test->chore, perf->refactor, style->chore normalizations
4. File-path heuristics - docs/ or .md => docs (medium); tests/ or .test./.spec. => chore (medium); bin/ or hooks/ => feat (low)
5. Fallback - `{ type: 'other', confidence: 'low' }`

Security overrides conventional prefix. A commit with `fix: address XSS vulnerability` returns `{ type: 'security', confidence: 'high' }`.

### cmdSyncPreview Extension

- `classification` field added to each commit in the JSON output (`{ type, confidence }`)
- `byType` summary added to `summary` object with 8 type counts: feat, fix, docs, chore, refactor, other, security, breaking
- Colored type badges in human-readable output: red (security/breaking), yellow (fix), green (feat), dim (docs/chore/refactor/other)

### ConfigSchema Fix

Added `gsd` property to configSchema.properties:
```javascript
gsd: {
  type: 'object',
  properties: {
    role: { type: 'string', enum: ['consumer', 'maintainer'], default: 'consumer' }
  },
  additionalProperties: false
}
```

This unblocks Plan 03's maintainer role detection in the background hook.

## Test Results

- 739 tests pass, 0 fail (full suite)
- 17 new classifyCommit unit tests covering all 5 tiers
- 4 new ConfigSchema gsd.role tests
- 2 new cmdSyncPreview integration tests for classification field and byType summary

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| RED (Task 1) | 4c510d5 | test(21-01): add failing tests for classifyCommit and ConfigSchema gsd.role |
| GREEN (Task 1) | 3cb9c31 | feat(21-01): implement classifyCommit and fix ConfigSchema gsd section |
| GREEN (Task 2) | d38fdf1 | feat(21-01): extend cmdSyncPreview with commit classification and byType summary |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files created/modified:
- FOUND: C:/Projects/get-stuff-done/get-stuff-done/bin/lib/sync.cjs
- FOUND: C:/Projects/get-stuff-done/src/config/ConfigSchema.js
- FOUND: C:/Projects/get-stuff-done/tests/sync.test.cjs
- FOUND: C:/Projects/get-stuff-done/tests/config.test.js

Commits:
- FOUND: 4c510d5 (RED tests)
- FOUND: 3cb9c31 (GREEN implementation)
- FOUND: d38fdf1 (Task 2 extension)
