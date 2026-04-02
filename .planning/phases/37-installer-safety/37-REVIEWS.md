---
phase: 37
reviewers: [gemini]
reviewed_at: 2026-04-02T16:00:00Z
plans_reviewed: [37-01-PLAN.md]
notes: Codex CLI segfaulted on command-line argument; Claude CLI skipped (current runtime)
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
*Reviewed: 2026-04-02*
*Reviewers: Gemini (2.5 Pro)*
