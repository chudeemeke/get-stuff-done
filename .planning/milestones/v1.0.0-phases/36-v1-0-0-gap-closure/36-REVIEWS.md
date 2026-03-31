---
phase: 36
reviewers: [claude-sonnet]
reviewed_at: 2026-03-31
plans_reviewed: [36-01-PLAN.md, 36-02-PLAN.md]
note: Gemini not authenticated, Codex failed on Windows path resolution
---

# Cross-AI Plan Review -- Phase 36

## Claude (Sonnet) Review

### Plan 36-01: CI Stabilization & Bug Fixes

**Summary:** Well-structured and addresses clear, scoped issues: marking informational CI jobs as non-blocking, increasing Windows test timeouts, fixing a logical operator bug in severity sorting, and eliminating network dependencies in tests. The tasks are atomic, the acceptance criteria are verifiable, and the scope is appropriately narrow.

**Strengths:**
- Clear bug identification: The `|| 99` vs `?? 99` fix is well-documented with precise reasoning
- Minimal scope: Each change is narrowly targeted without refactoring unrelated code
- Automated verification: All tasks have automated verification commands
- Explicit constraints: "Do NOT change lint/parity jobs" prevents scope creep
- Strong acceptance criteria: Specific, measurable criteria for each change

**Concerns:**
- **MEDIUM**: Network mocking strategy is vague. Task 2 states "ensure ALL test calls pass both parameters explicitly" but doesn't provide a systematic way to find all instances. Grep commands or file inspection steps should be specified.
- **LOW**: The `BUN_TEST_TIMEOUT: 30000` is added to the test job but no verification that this actually affects Windows CI runners (env var might need to be passed differently per bun docs).
- **LOW**: No rollback strategy if `continue-on-error: true` masks actual failures (mitigated by clear documentation).

**Suggestions:**
- Add grep verification to confirm no `getVersionDelta()` calls with zero arguments remain
- Consider adding a comment in ci.yml above `continue-on-error: true` explaining why each job is informational
- Document BUN_TEST_TIMEOUT handling

**Risk Assessment: LOW**

---

### Plan 36-02: Coverage Gap Closure

**Summary:** Sound strategy that addresses per-script coverage gaps through direct function testing. The bun attribution workaround (single require) is clever. However, execution complexity and incomplete implementation recipes increase risk.

**Strengths:**
- Root cause analysis: Addresses bun coverage attribution bug with a single-require test file pattern
- Direct function testing via `require('../scripts/X')`, avoiding subprocess spawning
- Systematic error path coverage
- Realistic about uncoverable code (CLI entry blocks)

**Concerns:**
- **HIGH**: Task 1 cleanup strategy is incomplete. Temp directories mentioned but no concrete afterEach/afterAll implementation shown.
- **MEDIUM**: Task 1 computeDelta tests (6-7) lack concrete file structure or minimal reproduction recipe for the temp project setup.
- **MEDIUM**: Task 2 has contradictory guidance about `readPinnedVersion` -- says to test it, then says "accept as uncoverable". Confusing for executor.
- **MEDIUM**: Task 2 `runPreviewScan` fallback has multiple suggested approaches without a clear recommendation.
- **LOW**: No validation that new tests don't introduce false positives or become brittle on Windows.

**Suggestions:**
- Provide concrete temp directory cleanup pattern (beforeEach/afterEach with mkdtempSync/rmSync)
- Provide minimal file structure recipe for computeDelta temp project
- Remove contradictory `readPinnedVersion` guidance -- if uncoverable, say so clearly
- Simplify runPreviewScan fallback -- recommend `runFallbackChecks` directly and remove other suggestions
- Add per-file coverage extraction verification step

**Risk Assessment: MEDIUM**

---

## Codex Review

Codex (gpt-5.4) was unable to complete its review -- spent its entire session navigating Windows path resolution issues (PowerShell /tmp -> C:\Users\...\AppData\Local\Temp translation). Found the prompt file but timed out before producing a review.

---

## Gemini Review

Gemini CLI was not authenticated (missing GEMINI_API_KEY in settings.json). Skipped.

---

## Consensus Summary

### Agreed Concerns (from Claude review -- single reviewer)
1. **Plan 36-02 Task 1 cleanup** (HIGH): Temp directory lifecycle not shown concretely
2. **Plan 36-02 contradictory guidance** (MEDIUM): readPinnedVersion test vs "uncoverable" contradiction
3. **Plan 36-02 vague computeDelta recipe** (MEDIUM): No minimal file structure for temp project
4. **Plan 36-01 network mocking** (MEDIUM): No systematic grep to find all unparameterized calls

### Overall Risk
- Plan 36-01: LOW
- Plan 36-02: MEDIUM
- Phase 36: MEDIUM (dominated by Plan 36-02 execution complexity)

### Recommendations
1. Plans should be revised to address the HIGH concern (temp cleanup) and simplify contradictory guidance
2. Add phase-level verification that runs per-script coverage extraction after both plans complete
