<purpose>
Create a .continue-here.md handoff file that preserves complete work state across sessions. Captures position, completed work, remaining work, decisions, and blockers so the next session can resume without context loss.
</purpose>

<process>

<step name="detect_current_phase">
Identify what's being worked on:

```bash
cat .planning/STATE.md 2>/dev/null
```

Parse current position from STATE.md:
- Current phase number and name
- Current plan (if mid-execution)
- Status (planning, executing, verifying, etc.)

If STATE.md doesn't exist or has no position:
```bash
# Find most recently modified files in .planning/phases/
ls -lt .planning/phases/*/*.md 2>/dev/null | head -5
```

Infer current phase from most recent file activity.
</step>

<step name="gather_state">
Collect comprehensive state:

**1. Position:**
- Phase, plan, task currently in progress
- What step of the workflow

**2. Completed work:**
```bash
# Recently completed plans (have SUMMARY.md)
ls .planning/phases/*/SUMMARY.md 2>/dev/null | tail -5
# Recent commits
git log --oneline -10
```

**3. Remaining work:**
```bash
# Plans without SUMMARY.md in current phase
PHASE_DIR=$(ls -d .planning/phases/$(printf "%02d" $PHASE)-* 2>/dev/null | head -1)
for plan in "$PHASE_DIR"/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Remaining: $plan"
done
```

**4. Decisions made:**
From STATE.md Accumulated Context section.

**5. Blockers/issues:**
Any known issues from STATE.md or recent conversation.
</step>

<step name="write_handoff">
Create handoff file:

```markdown
# Continue Here

**Paused:** [ISO timestamp]
**Phase:** [N] - [Name]
**Status:** [What was happening]

## Where I Left Off

[Specific description of what was in progress]
[What was the last thing completed]
[What's the immediate next step]

## Completed Work

[List of completed plans/tasks with brief outcomes]

## Remaining Work

[List of incomplete plans/tasks]

## Key Decisions

[Decisions from this session that affect future work]

## Blockers / Issues

[Any known issues or blockers]

## Resume Instructions

1. Run `/gsd:resume-work` or read this file
2. Current phase: [N] - check `.planning/phases/[dir]/`
3. STATE.md has full project context
4. Next action: [specific command to run]
```

Write to `.continue-here.md` in project root.
</step>

<step name="commit">
Check planning config:

```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

If commit_docs is true:
```bash
git add .continue-here.md .planning/STATE.md
git commit -m "wip: pause work at Phase [N] - [Name]"
```
</step>

<step name="confirm">
```
Work paused. Handoff saved to .continue-here.md

To resume:
  /gsd:resume-work

Or in a new session:
  Read .continue-here.md for context
  Then: [next action command]
```
</step>

</process>

<success_criteria>
- [ ] Current phase detected from STATE.md or file activity
- [ ] Complete state gathered (position, completed, remaining, decisions, blockers)
- [ ] .continue-here.md created with all sections
- [ ] Git commit as WIP
- [ ] Resume instructions displayed
</success_criteria>
