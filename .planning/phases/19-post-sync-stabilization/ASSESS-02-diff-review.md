# Assessment Report: PLAT-07 / PLAT-08 vs Current Diff/Review Workflow

**Date:** 2026-02-23
**Requirement ID:** ASSESS-02
**Evaluating:** PLAT-07 (interactive diff viewer) and PLAT-08 (multi-upstream support) against the current fork diff/review workflow

---

## Executive Summary

Upstream (get-shit-done) has no upstream-sync workflow -- it is fork-only infrastructure. There is no upstream baseline to compare PLAT-07 or PLAT-08 against; the assessment evaluates each requirement against the fork's own current capability. The fork's Stage 3.5 text-based diff review is the established baseline, used successfully through Phase 18 for 185 commits. PLAT-07 (interactive diff viewer) represents a genuine gap: text diffs are functional but not visual, and long diffs are hard to navigate. PLAT-08 (multi-upstream support) has no current use case -- the fork tracks exactly one upstream with no known need for a second. Recommendation: defer PLAT-07 to v0.4.0 backlog as an optional ergonomic improvement; drop PLAT-08 from v0.3.0 and add to a someday/maybe list.

---

## Current Fork Diff/Review Capability

The fork's `get-stuff-done/workflows/upstream-sync.md` provides diff review at Stage 3.5 (Security and Change Review). The current capability:

- `git diff {first_sha}^..{last_sha} --stat` for a summary of files changed in the cherry-pick batch
- `git diff {first_sha}^..{last_sha}` for the full diff text of all commits in the batch
- Displayed inline as a checkpoint in the Claude Code conversation
- User reviews the plain-text git diff output before cherry-pick execution proceeds
- Plain text: no syntax highlighting, no navigation, no filtering by file or hunk

**Usage evidence:** Phase 18 applied this workflow to 185 upstream commits across 12 batches. The text-based review was functional throughout -- no batch was blocked or incorrectly processed due to review capability limitations. Long diffs (Batch 12 with 78 changed files) required careful reading but were manageable.

---

## Upstream Baseline

Upstream (glittercowboy/get-shit-done) does NOT have an upstream-sync workflow. The sync capability is entirely fork-specific infrastructure developed from Phase 4 onward. There is no upstream feature to compare PLAT-07 or PLAT-08 against -- these requirements address a domain upstream does not cover.

This means:
- PLAT-07 and PLAT-08 are not "catching up to upstream" -- they are additive improvements to fork-only infrastructure
- The correct evaluation question is: does the current fork capability (Stage 3.5 text diff) meet the usage requirements? If yes, defer. If no, prioritize.

---

## PLAT-07 Assessment: Interactive Diff Viewer

**What it would add:** A syntax-highlighted, navigable diff viewer integrated into the sync workflow. Examples of the form factor: terminal-based tools like `delta` or `diff-so-fancy` (which colorize and reformat `git diff` output), or browser-based viewers like `difit`. The core improvement is visual: colored additions/deletions, side-by-side comparison, file navigation, hunk filtering.

**Current gap:** The Stage 3.5 diff is plain text. In long-diff reviews (e.g., Batch 12: 78 files, hundreds of hunks), the user must scroll through raw diff output without visual differentiation between different files or change types. This is functional but ergonomically poor for large batches.

**Usage evidence:** Phase 18 completed 185 commits successfully using text-based diffs. No diff was missed or misapplied due to the text format. The ergonomic friction was real (long diffs required careful reading) but was not a blocker.

**Priority analysis:**
- The sync workflow is already functional end-to-end
- PLAT-07 improves ergonomics, not correctness
- Implementation complexity is moderate (requires tool detection, terminal capability detection, fallback to plain text)
- The improvement is most valuable for large sync batches (100+ commits) which are infrequent

**Verdict:** PLAT-07 is a real gap. Text diffs are functional but not optimal. PLAT-07 would be a genuine ergonomic improvement, particularly for large sync operations. However, it is not blocking current usage and the implementation carries complexity (platform-specific tool availability, terminal capability detection, graceful fallback). Low priority for v0.3.0 given the sync workflow is already stable and functional.

**Recommendation:** Defer PLAT-07 to the v0.4.0 backlog as an optional enhancement. Revisit when the sync workflow is otherwise mature and ergonomic improvements become the priority.

---

## PLAT-08 Assessment: Multi-Upstream Support

**What it would add:** The ability to track and synchronize from multiple upstream sources simultaneously. For example: tracking both `glittercowboy/get-shit-done` (the current upstream) and a hypothetical second upstream (e.g., a community fork or organization fork). The workflow would need to resolve conflicts between multiple upstream lineages.

**Current state:** The upstream-sync workflow hardcodes `upstream main` as the single source. The `upstream` remote is configured to point to one repository. The sync manifest tracks one SHA-based baseline. All Stage workflows assume a single upstream direction.

**Usage evidence:** Since Phase 4, the fork has tracked exactly one upstream. There has been no instance where a second upstream source was needed or desired. The project's purpose (maintaining a single fork of get-shit-done with fork-specific identity) does not create a multi-upstream use case.

**Implementation complexity:** Multi-upstream support would require substantial workflow restructuring:
- Each upstream would need its own remote, manifest entry, and commit tracking
- Stage 2 (upstream fetch) would need to handle multiple remotes
- Cherry-pick batches would need upstream source attribution
- Conflict resolution would need to account for upstream-vs-upstream conflicts, not just upstream-vs-fork conflicts

**Verdict:** PLAT-08 has no current use case. The fork tracks one upstream and there is no known scenario that would require a second. The implementation complexity is high relative to zero demonstrated need.

**Recommendation:** Remove PLAT-08 from v0.3.0 requirements. Add to a someday/maybe list for future consideration. Revisit only if fork governance changes -- specifically, if the project needs to track a second upstream source (e.g., a major upstream fork emerges that the fork should also track).

---

## Summary

| Requirement | Current State | Gap Assessment | Recommendation |
|-------------|---------------|----------------|----------------|
| PLAT-07 (Interactive Diff Viewer) | Plain text git diff in Stage 3.5 | Real gap: ergonomic limitation for large batches | Defer to v0.4.0 backlog as optional enhancement |
| PLAT-08 (Multi-Upstream Support) | Single upstream hardcoded | No gap: no use case for multiple upstreams | Drop from v0.3.0, add to someday/maybe list |

---

*Phase: 19-post-sync-stabilization*
*Completed: 2026-02-23*
