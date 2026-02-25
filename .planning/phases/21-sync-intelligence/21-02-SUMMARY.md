---
phase: 21-sync-intelligence
plan: "02"
subsystem: supply-chain-scanner
tags: [sync, supply-chain, security, tdd]
dependency_graph:
  requires: [21-01]
  provides: [runSupplyChainChecks, checkPromptIntegrity, checkDependencyDiff, checkExecutionPath, checkNetworkEndpoints, checkObfuscation, checkAuthorAnomaly, loadKnownAuthors, saveKnownAuthors, seedKnownAuthors]
  affects: [sync.cjs, cmdSyncPreview, tests/sync.test.cjs]
tech_stack:
  added: []
  patterns: [6-check-supply-chain-scanner, author-cache-seeding, diff-size-guard]
key_files:
  created: []
  modified:
    - get-stuff-done/bin/lib/sync.cjs
    - tests/sync.test.cjs
decisions:
  - "Prompt Integrity requires BOTH file-path AND content match to trigger elevated severity (file-path alone = null, per Pitfall 5 in RESEARCH.md)"
  - "Diff size guard at 500KB: content-based checks (obfuscation, injection, network, dependency) skip on large diffs; file-path checks (execution-path) always run"
  - "Author cache seeded from git log on first run to avoid false-positive wall on first /gsd:upstream invocation"
  - "runSupplyChainChecks is pure: takes diff + files + authorString + knownAuthors; caller (cmdSyncPreview) manages cache load/save"
  - "Supply chain findings are informational only: cmdSyncPreview never exits non-zero based on supply chain results"
  - "Author anomaly finding includes triggered=['unknown-author'] and evidence=[authorString] for consistency with other finding shapes"
requirements_completed: [SYNC-07]
metrics:
  duration: 1554s
  completed: 2026-02-25
  tasks_completed: 2
  files_modified: 2
---

# Phase 21 Plan 02: Supply Chain Scanner Summary

6-check supply chain integrity scanner implementing content-based detection for prompt injection, dependency hijack, execution path compromise, network exfiltration, obfuscation/backdoors, and author compromise; wired into cmdSyncPreview JSON output.

## What Was Built

### 6 Supply Chain Check Functions

All functions are pure (no side effects, directly testable) and exported from `sync.cjs`.

**Check 1: checkPromptIntegrity(diff, files)**
- File-path gate: requires at least one `.md` file in `workflows/`, `agents/`, `commands/`, or `templates/`
- Content patterns: injection language, hidden Unicode (zero-width, RTL override), credential expansion (`~/.ssh`, `~/.aws`, `.env`), tool-list changes (`+/-.*tools:`), guardrail removal (delete lines with safe/blocked/forbidden/etc keywords)
- CRITICAL: File-path match alone returns null. BOTH file-path AND content match required for elevated finding.

**Check 2: checkDependencyDiff(diff, files)**
- Triggers on: `package.json`, lockfiles (bun.lock, package-lock.json, yarn.lock, pnpm-lock.yaml), new `require(` or `import ` statements in diff
- Reports specific lines showing package additions/removals

**Check 3: checkExecutionPath(files)**
- File-path only check (no diff content needed)
- Sensitive paths: `bin/`, `hooks/`, `scripts/`, `.github/workflows/`, `.github/actions/`, `Makefile`, `Dockerfile`, filenames containing `install`
- Always runs even when diff exceeds 500KB size limit

**Check 4: checkNetworkEndpoints(diff)**
- Scans `+` lines only (additions, not removals)
- Detects: `fetch(`, `http.request(`, `http.get(`, `new URL(`, `axios`, `XMLHttpRequest`, URL literals

**Check 5: checkObfuscation(diff, files)**
- Scans `+` lines only
- Detects: `eval(`, `new Function(`, base64 strings 200+ chars, hex escape sequences 11+ consecutive

**Check 6: checkAuthorAnomaly(authorString, knownAuthors)**
- Pure stateless function; takes author string and a Set of known authors
- Returns `{ isKnown: true }` for known or `{ isKnown: false, author: string }` for unknown

### Author Cache Functions

- `loadKnownAuthors(cacheDir)`: reads `gsd-upstream-authors.json`, returns Set; empty Set on missing/malformed file
- `saveKnownAuthors(cacheDir, authorsSet)`: writes Set to JSON with timestamp; creates cacheDir if missing
- `seedKnownAuthors(cwd, cacheDir)`: runs `git log --format=%an <%ae>`, saves and returns Set; called on first run when cache is empty

### runSupplyChainChecks Orchestrator

```javascript
runSupplyChainChecks(diff, files, authorString, knownAuthors)
```

- Diff size guard: if diff > 500KB, `safeDiff = ''` so content checks silently skip (file-path checks still run)
- Runs all 6 checks in priority order: prompt-integrity (elevated) → dependency-diff (high) → execution-path (high) → network-endpoints (medium) → obfuscation (high) → author-anomaly (medium)
- Adds `diff-size` info finding when diff exceeds limit
- Returns `[]` when nothing triggers

### cmdSyncPreview Extensions

- Loads known authors cache from `~/.claude/cache/gsd-upstream-authors.json` before commit loop; seeds from `git log` if empty
- Calls `runSupplyChainChecks(diff, enrichedFiles, commit.author, knownAuthors)` per commit
- Adds new authors encountered in the commit range to the cache after the loop
- JSON output: each commit gains `supplyChainRisks` array; summary gains `supplyChainFindings` count
- Human-readable output: supply chain risk badges printed after stat lines for each commit (red for elevated/high, yellow for medium, dim for info)

## Test Results

- 101 tests pass in `tests/sync.test.cjs` (53 pre-existing + 48 new)
- 800 tests pass full suite (0 regressions)
- 48 new tests covering all 6 checks, orchestrator, cache functions, and CLI integration

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| RED (Task 1) | f460c21 | test(21-02): add failing tests for 6 supply chain checks and author cache |
| GREEN (Task 1+2) | 7ecfabd | feat(21-02): implement supply chain scanner with 6 content-based checks |

## Deviations from Plan

### Auto-fixed Issues

None.

### Coverage Note (Pre-existing Gap)

`sync.cjs` lines coverage is ~57% due to the `cmdSyncPreview` function body (lines 726-969) being tested via CLI subprocess (`runGsdTools`) rather than direct function calls. This is the pre-existing architectural pattern documented in executor memory from Phase 21 Plan 01. The new supply chain functions (all exported pure functions) are tested via direct import and show high coverage. This gap was present before this plan and is not caused by Plan 02 changes.

## Self-Check: PASSED

Files created/modified:
- FOUND: C:/Projects/get-stuff-done/get-stuff-done/bin/lib/sync.cjs
- FOUND: C:/Projects/get-stuff-done/tests/sync.test.cjs

Commits:
- FOUND: f460c21 (RED tests)
- FOUND: 7ecfabd (GREEN implementation)
