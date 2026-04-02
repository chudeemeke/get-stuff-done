---
phase: 37
reviewers: [gemini, codex]
reviewed_at: 2026-04-02T16:00:00Z
plans_reviewed: [37-01-PLAN.md]
notes: Codex initially segfaulted on command-line argument; succeeded via stdin pipe. Claude CLI skipped (current runtime).
---

# Cross-AI Plan Review -- Phase 37

## Gemini Review

### Summary
The plan is exceptionally well-structured and directly addresses the critical "installer wipe" incident of 2026-03-31. By shifting from fragile subprocess-based integration tests to robust unit tests for the installer's safety functions, it ensures the core invariants (user content preservation and v2 detection logic) are verified in isolation. The plan correctly identifies the need to refactor `bin/install.js` for testability and surgically removes a stale test that would otherwise conflict with the new safety requirements.

### Strengths
- **Unit Test Focus:** Correctly identifies that unit testing `detectV2`, `removeGsdFiles`, and `isSafeToClean` is more reliable than subprocess testing given the current flaky state of the upstream installer.
- **Comprehensive Fixtures:** The `USER_CONTENT` fixture list is highly representative of actual user data (CLAUDE.md, rules, settings, skills) that must survive an installation.
- **Safety Guards:** The addition of `isSafeToClean` unit tests (root, home, shallow paths) provides a critical defense-in-depth layer against catastrophic file operations.
- **Addressing Pitfalls:** Explicitly includes a test for "co-located user content" (Pitfall 4), which is a common edge case in manifest-driven cleanup.
- **Minimal Refactoring:** The change to `bin/install.js` is surgical -- just adding exports and a `require.main` guard -- which minimizes the risk of introducing new bugs while enabling testability.

### Concerns
- **Top-Level Side Effects (LOW):** While the plan guards `main()`, it doesn't explicitly check if `bin/install.js` has other top-level side effects (e.g., immediate environment variable checks or file I/O) that occur during a `require()`. Mitigation: The "Read First" step in Task 1 handles this discovery.
- **Mock FS Depth (LOW):** The plan uses `tests/helpers/mock-fs.js`. Ensure that `createTempDir()` and the mock environment correctly handle the deep directory structures used in the fixtures (e.g., `projects/myproject/memory/`) on Windows. Mitigation: `path.join` is used consistently.
- **Stale Integration Tests (MEDIUM):** The plan removes the "src/ fingerprint" test from `installer-v3.test.js`, but the research mentions 14 other failing tests in that file. While Phase 39/40 are designated for "Test Health," leaving a suite of failing tests in the same area might cause confusion. Mitigation: The plan focuses correctly on Phase 37's specific safety requirements.

### Suggestions
- **Export the Manifest Name:** Export `INSTALLED_MANIFEST_NAME` from `bin/install.js` as well, so the tests don't have to hardcode `gsd-file-manifest.json`. This ensures consistency if the filename ever changes.
- **Explicit Shell Check:** In the `detectV2` tests, include a case for a directory containing only the `get-shit-done` directory (v3 signal) to ensure it doesn't accidentally trigger the "directory-name" signal intended for `get-stuff-done`.
- **Verify No Output on Require:** Add a specific verification step to ensure that `require('./bin/install.js')` produces zero stdout or stderr when imported.

### Risk Assessment: LOW
The risk is low because the plan avoids modifying the core logic of the safety functions, focusing instead on providing them with the first-ever comprehensive test suite. The refactoring is standard Node.js practice for making CLI scripts testable.

**Verdict:** APPROVED. Proceed with execution.

---

## Codex Review

Codex CLI segfaulted when invoked with the review prompt (both via command-line argument and piped input). Unable to obtain review.

---

## Consensus Summary

### Agreed Strengths (single reviewer)
- Unit test approach over subprocess integration testing is the right strategy given 14 pre-existing subprocess test failures
- Minimal refactoring (exports + require.main guard) keeps risk low
- Comprehensive user content fixtures representative of real incident data
- isSafeToClean defense-in-depth layer adds structural safety

### Key Concerns
- **Stale integration tests (MEDIUM):** 14 failing subprocess tests remain in installer-v3.test.js. Phase 39 is the designated fix point, but the coexistence could confuse. Acknowledged -- phase boundaries are correct.
- **Top-level side effects (LOW):** require() may trigger side effects in install.js. Mitigated by read-first task design.
- **Mock FS depth on Windows (LOW):** Deep directory structures in temp dirs need verification. Mitigated by path.join usage.

### Actionable Suggestions (for executor to consider)
1. Export INSTALLED_MANIFEST_NAME alongside the safety functions
2. Add detectV2 test case for get-shit-done-only directory (v3 baseline)
3. Verify require('./bin/install.js') produces no stdout/stderr

---

## Codex Review (GPT-5.4, high reasoning effort)

### Summary
The plan is well-scoped around the actual failure mode: it shifts validation from brittle subprocess integration tests to direct unit coverage of the installer's safety functions, and it traces most of the required behaviors back to concrete fixtures and assertions. Its main weakness is that it overclaims "proof" for installer safety while leaving two important gaps: it does not directly exercise the public `uninstall()` path for INST-03, and it does not test manifest path containment, which is now the main remaining destructive-cleanup risk.

### Strengths
- Clear requirement traceability: INST-01, INST-02, and INST-03 are carried through objective, task behavior, acceptance criteria, and success criteria
- Correct test level for the problem: avoids depending on the already-broken upstream installer subprocess and targets safety logic directly
- Strong regression coverage for the actual incident pattern: src/ false positives, get-shit-done baseline handling, and co-located user-content pruning
- Good reuse discipline: importing INSTALLED_MANIFEST_NAME instead of hardcoding the filename reduces drift

### Concerns
- **HIGH**: INST-03 is about `uninstall()`, but the plan only tests `removeGsdFiles()` (internal function). The public entrypoint (`--uninstall` flag -> `uninstall()` function -> `removeGsdFiles()`) and its exit behavior/wiring are unverified.
- **HIGH**: Manifest-driven cleanup tests only well-formed relative paths. Path traversal (`../escape`), absolute paths, and symlink targets in manifest entries are untested. `removeGsdFiles()` does `path.join(targetDir, relPath)` and deletes -- a malicious/corrupt manifest entry like `../../.bashrc` would escape the target directory. For a safety phase, this is the most important untested edge.
- **MEDIUM**: The "no side effects on require()" requirement is not proven by the automated verification. The scripted check validates exports but does not capture stdout/stderr or assert no subprocess was spawned.
- **LOW**: Several acceptance criteria are structural (minimum line count, describe/test counts, grep-based checks) rather than behavioral.

### Suggestions
- Add one direct `uninstall()` test that seeds a temp target, invokes `uninstall()` under controlled `process.exit` interception, and asserts exit code plus user-content preservation
- Add manifest confinement tests for `../escape`, absolute paths, and symlink targets; if they fail, harden `removeGsdFiles()` before calling the phase complete
- Replace the manual import side-effect "spot check" with a deterministic harness that captures stdout/stderr
- Remove min_lines and most grep-count gates; keep scenario-based assertions and passing test command as the real acceptance bar

### Risk Assessment: MEDIUM
The plan is directionally strong and catches the original src/ false-positive regression, but does not justify its stronger claims about uninstall safety. Without direct uninstall() coverage and manifest path-containment checks, meaningful residual risk remains in the cleanup path.

---

## Consensus Summary (Updated)

### Agreed Strengths (both reviewers)
- Unit test approach over subprocess testing is correct for this problem
- Minimal refactoring keeps risk low
- Comprehensive user content fixtures
- Strong regression coverage for the incident pattern
- INSTALLED_MANIFEST_NAME export reduces drift

### Agreed Concerns
- Side-effect verification for require() needs strengthening (both flagged, different severity)

### Divergent Views
| Topic | Gemini | Codex |
|-------|--------|-------|
| Risk level | LOW | MEDIUM |
| INST-03 coverage | Sufficient via removeGsdFiles tests | Insufficient -- uninstall() entrypoint untested |
| Path traversal | Not mentioned | HIGH concern -- manifest entries can escape target dir |
| Acceptance criteria | Fine as-is | Structural criteria are noise |

### Codex-Only Findings (Gemini missed)
1. **Path traversal in manifest entries** (HIGH) -- `removeGsdFiles` joins and deletes without containment checks
2. **uninstall() public entrypoint untested** (HIGH) -- wiring between --uninstall flag and removeGsdFiles unverified
3. **Structural acceptance criteria** (LOW) -- min_lines and grep counts are maintenance noise

---
*Reviewed: 2026-04-02*
*Reviewers: Gemini (2.5 Pro), Codex (GPT-5.4 high reasoning)*
*CLI invocation notes: Both CLIs segfault on large command-line arguments on Windows/MINGW. Use stdin pipe: `cat prompt | gemini` and `cat prompt | codex exec --skip-git-repo-check -`*
