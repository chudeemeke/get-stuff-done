<purpose>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action. Provides situational awareness before continuing work.
</purpose>

<process>

<step name="load_state">
Read project state and roadmap:

```bash
cat .planning/STATE.md 2>/dev/null
cat .planning/ROADMAP.md 2>/dev/null
cat .planning/PROJECT.md 2>/dev/null
cat .planning/config.json 2>/dev/null
```

**If no .planning/ directory:**
```
No GSD project found in this directory.

To start: /gsd:new-project
```
Exit workflow.

**If STATE.md missing but .planning/ exists:**
Attempt to reconstruct from existing artifacts.
</step>

<step name="gather_phase_status">
Scan all phase directories for completion status:

```bash
# For each phase directory
for dir in .planning/phases/*/; do
  PLANS=$(ls "$dir"/*-PLAN.md 2>/dev/null | wc -l)
  SUMMARIES=$(ls "$dir"/*-SUMMARY.md 2>/dev/null | wc -l)
  VERIFICATION=$(ls "$dir"/*-VERIFICATION.md 2>/dev/null | wc -l)
  echo "$dir: $SUMMARIES/$PLANS plans complete, verified=$VERIFICATION"
done
```

Build phase inventory:
- Total phases
- Completed phases (all plans have summaries)
- In-progress phases (some plans have summaries)
- Unplanned phases (no PLAN.md files)
- Verified phases (have VERIFICATION.md)
</step>

<step name="detect_current_position">
From STATE.md and phase scan, determine:

1. **Current phase** -- The phase currently being worked on
2. **Current plan** -- If mid-execution, which plan
3. **Status** -- What happened last (planned, executing, verified, etc.)
4. **Next action** -- What logically comes next
</step>

<step name="present_progress">
Display progress summary:

```
## Project Progress: [Project Name]

**Milestone:** [Current milestone from roadmap]
**Position:** Phase [X] of [Y] -- [Phase name]
**Status:** [Current status]

### Phase Overview

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 1 | [name] | 2/2 | Complete |
| 2 | [name] | 3/3 | Complete |
| 3 | [name] | 0/2 | Executing |
| 4 | [name] | 0/0 | Unplanned |

Progress: [==========----------] 50% (X/Y phases)

### Recent Activity

[From STATE.md last activity and git log]

### What's Ahead

[Upcoming phases with brief descriptions from roadmap]
```
</step>

<step name="route_next_action">
Based on current state, recommend next action:

**Route A -- Phase needs planning:**
```
Next: Plan Phase [X]
/gsd:plan-phase [X]
```

**Route B -- Phase has plans, needs execution:**
```
Next: Execute Phase [X]
/gsd:execute-phase [X]
```

**Route C -- Phase executed, needs verification:**
```
Next: Verify Phase [X]
/gsd:verify-work [X]
```

**Route D -- Phase verified with gaps:**
```
Next: Plan gap closure
/gsd:plan-phase [X] --gaps
```

**Route E -- All phases complete:**
```
Milestone complete!
/gsd:audit-milestone
```

**Route F -- No project state (fresh start):**
```
/gsd:new-project
```

Present the recommended route prominently, with alternatives listed below:

```
---

## Next Up

**[Recommended action description]**

`[command]`

Also available:
- [alternative 1]
- [alternative 2]

---
```
</step>

</process>

<success_criteria>
- [ ] Project state loaded (STATE.md, ROADMAP.md, PROJECT.md)
- [ ] All phase statuses scanned
- [ ] Current position detected correctly
- [ ] Progress summary with table and progress bar displayed
- [ ] Recent activity shown
- [ ] Next action routed correctly (A through F)
- [ ] Clear next step presented with command
</success_criteria>
