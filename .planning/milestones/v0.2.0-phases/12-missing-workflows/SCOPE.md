# Phase 12: Missing Workflow Files

## Problem

16 of 25 command files reference workflow files via `@~/.claude/get-stuff-done/workflows/*.md` that don't exist. Commands still function because they contain inline instructions, but the `@` references silently fail — meaning the workflow logic (which should contain the detailed orchestration) is never loaded.

This blocks other projects that depend on GSD commands working properly.

## Missing Workflows (16)

| # | Missing Workflow | Referenced By | Purpose |
|---|-----------------|---------------|---------|
| 1 | add-phase.md | commands/gsd/add-phase.md | Add integer phase to end of roadmap |
| 2 | add-todo.md | commands/gsd/add-todo.md | Capture ideas/tasks as structured todos |
| 3 | audit-milestone.md | commands/gsd/audit-milestone.md | Verify milestone achieved definition of done |
| 4 | check-todos.md | commands/gsd/check-todos.md | List pending todos, select and route |
| 5 | help.md | commands/gsd/help.md | Output complete GSD command reference |
| 6 | insert-phase.md | commands/gsd/insert-phase.md | Insert decimal phase for urgent work |
| 7 | new-milestone.md | commands/gsd/new-milestone.md | Start new milestone cycle |
| 8 | new-project.md | commands/gsd/new-project.md | Initialize new project with deep context |
| 9 | pause-work.md | commands/gsd/pause-work.md | Create handoff file preserving work state |
| 10 | plan-milestone-gaps.md | commands/gsd/plan-milestone-gaps.md | Create phases to close audit gaps |
| 11 | plan-phase.md | commands/gsd/plan-phase.md | Create PLAN.md with research + verification loop |
| 12 | progress.md | commands/gsd/progress.md | Check progress, summarize, route to next action |
| 13 | quick.md | commands/gsd/quick.md | Execute quick task with GSD guarantees |
| 14 | remove-phase.md | commands/gsd/remove-phase.md | Remove future phase and renumber |
| 15 | set-profile.md | commands/gsd/set-profile.md | Switch model profile (quality/balanced/budget) |
| 16 | settings.md | commands/gsd/settings.md | Configure GSD workflow toggles |

## Existing Workflows (9)

These already exist and work properly:
- complete-milestone.md
- diagnose-issues.md
- discover-phase.md (orphan - not referenced by any command)
- discuss-phase.md
- execute-phase.md
- execute-plan.md
- list-phase-assumptions.md
- map-codebase.md
- resume-project.md
- transition.md (orphan - not referenced by any command)
- upstream-sync.md
- verify-phase.md
- verify-work.md

## Implementation Approach

Each missing workflow needs to be created by reading its corresponding command file to understand:
1. What the command promises to do (user-facing description)
2. What `@` references it expects (workflow path)
3. What inline instructions exist (these are the fallback logic)

For each workflow:
- Extract the orchestration logic from the command's inline instructions
- Expand it into a proper workflow with steps, gates, and error handling
- Follow the patterns established by existing workflows (execute-phase.md, verify-work.md, etc.)

### Complexity Tiers

**Simple (inline logic is sufficient, workflow is thin):**
- help.md, set-profile.md, settings.md, progress.md, add-phase.md, remove-phase.md, insert-phase.md

**Medium (needs orchestration but straightforward):**
- add-todo.md, check-todos.md, pause-work.md, quick.md

**Complex (multi-step with subagent spawning):**
- plan-phase.md, new-project.md, new-milestone.md, audit-milestone.md, plan-milestone-gaps.md

## Priority

HIGH — Other projects using GSD depend on these commands functioning fully. The commands work partially (inline fallback) but miss the detailed orchestration that workflows provide.

## Dependencies

None — this is standalone work on existing project infrastructure.
