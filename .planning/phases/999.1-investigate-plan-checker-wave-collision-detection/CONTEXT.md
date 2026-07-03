# Phase 999.1 — Investigate Plan-Checker Wave Collision Detection

**Status:** BACKLOG — investigation not yet started
**Captured:** 2026-04-20
**Source:** authkey project Phase 9.2 root-cause analysis (cross-session reference)

## Hypothesis

`gsd-plan-checker` does not detect plans in the same execution wave modifying the same files. Authkey session Phase 9.2 identified this when 5 plans in Wave 2 all edited `.github/workflows/ci.yml`, creating guaranteed merge conflicts on parallel execution.

**Important caveat on the hypothesis as worded:** The authkey formulation ("two plans in the same wave cannot share any files_modified entry") may be over-strict. Two plans adding DIFFERENT new functions to the same file are mergeable without conflict. The genuine failure mode is overlapping edit regions or semantically coupled changes -- not file-level collision alone. Investigation must evaluate whether to refine the rule before proposing it anywhere.

## Why this is a backlog item, not a v1.2.0 requirement

1. **Unverified.** Hypothesis from another session; we have not confirmed upstream `gsd-plan-checker` lacks this detection. Prior embarrassment pattern (#1851) established the discipline: verify before committing to a solution path.
2. **v1.2.0 scope is frozen.** 45 requirements, 4 phases, approved 2026-04-20. Mid-milestone scope additions train future-instances to treat scope as soft. Professional-grade ship-readiness requires holding the line.
3. **Decision tree depends on investigation outcome.** The right implementation path (upstream PR / fork override / new oversight trigger) is determined by the investigation, not ahead of it.

## Investigation tasks (time-boxed 2h)

1. **Confirm upstream gap exists.**
   - Read current `gsd-plan-checker.md` agent prompt at `node_modules/get-shit-done-cc/agents/gsd-plan-checker.md`
   - Search for any wave-collision, files_modified, or conflict-detection logic
   - If detection exists, investigation closes as "already solved upstream"

2. **Verify rule wording.**
   - Decide: file-level collision vs edit-region collision vs semantic-coupling collision
   - The correct rule may be stricter AND looser than authkey's proposed version
   - Document chosen rule with concrete examples of allowed / rejected patterns

3. **Evaluate three implementation paths with reject-reasons:**
   - **Path A: Upstream PR modifying `gsd-plan-checker`.** Pros/cons. Rejects if: modifying core conflicts with "skin over OS" principle, OR upstream unlikely to accept.
   - **Path B: Fork-side override in `overrides/agents/gsd-plan-checker.md`.** Pros/cons. Rejects if: taking ownership of upstream's core agent means every upstream bump re-reviews drift (high maintenance cost).
   - **Path C: New trigger on `gsd-oversight-planning` in overlay.** Pros/cons. Rejects if: oversight is advisory-only; wave collision is arguably a blocking concern. Counter-argument: PROCESS-05 (test-approach metric compatibility) is also arguably blocking but we chose advisory per oversight pattern.

4. **External AI cross-check** (per feedback memory `feedback_verify_upstream_scope.md`): use a Codex / Gemini agent to independently evaluate whether this is a real upstream gap. We established this discipline after #1851.

## Promotion criteria

**If investigation confirms upstream gap AND Path C selected:**
- Promote to v1.2.0 as decimal-inserted phase (e.g., `42.1`) alongside the other oversight trigger work
- Add sibling requirement PROCESS-08 to REQUIREMENTS.md

**If investigation confirms upstream gap AND Path B selected:**
- Promote to v1.2.0 as PROCESS-08 requirement
- Plan includes REASON.md + SHA snapshot for the override

**If investigation confirms upstream gap AND Path A selected (upstream PR preferred):**
- Do NOT add to v1.2.0 scope
- File upstream issue first (with reproduction evidence, alternatives considered, rejection reasons)
- Track in `memory/project_upstream_issues.md`
- Re-evaluate fork-side mitigation if upstream delays

**If investigation confirms NOT an upstream gap (already solved, or over-strict rule):**
- Close this backlog item with verification evidence recorded here
- Update `memory/feedback_verify_upstream_scope.md` with the data point (4th instance of "claimed upstream gap" being fork-specific or not-really-a-gap)

**If investigation reveals rule needs refinement:**
- Refine rule BEFORE any implementation decision
- Re-run the three-path evaluation with refined rule

## Required outputs from investigation

1. Written determination of upstream gap: YES / NO / PARTIAL
2. If YES: refined rule statement with examples
3. Three-path evaluation with explicit rejection reasons for non-chosen paths
4. External-AI cross-check summary
5. Promotion decision per criteria above, with timestamp and rationale

## Cross-references

- authkey Phase 9.2 session (cross-project; source of hypothesis)
- `memory/feedback_verify_upstream_scope.md` (discipline)
- `memory/project_upstream_issues.md` (if upstream issue filed)
- v1.2.0 REQUIREMENTS.md PROCESS-01..07 (existing oversight pattern)
- Phase 42 PLAN.md (if promoted as decimal-inserted)

## Do NOT

- Do not propose the authkey rule verbatim without refinement review
- Do not file an upstream issue before external-AI cross-check completes
- Do not add to v1.2.0 scope before investigation concludes
- Do not treat "sounds plausible" as "verified" (lesson from #1851)
